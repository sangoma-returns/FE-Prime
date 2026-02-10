# React Render Warning Fix

## Problem
Console warning: `Cannot update a component (ConnectModal) while rendering a different component (Hydrate)`

This warning occurred because state updates were being triggered during the render phase, violating React's rules.

---

## Root Causes Identified

### 1. ❌ Complex State Subscription in RainbowKitWrapper
**Before:**
```typescript
const RainbowKitWrapper: FC = () => {
  const theme = useThemeStore((s) => s.theme);
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  
  // ❌ Manual subscription causing state updates during render
  useEffect(() => {
    const unsubscribe = useAuthStore.subscribe((state) => {
      setAuthStatus(state.status); // ❌ Can trigger during render
    });
    
    setAuthStatus(useAuthStore.getState().status); // ❌ Synchronous state update
    return unsubscribe;
  }, []);
  
  return (
    <RainbowKitProvider authenticationStatus={authStatus}>
      {/* ... */}
    </RainbowKitProvider>
  );
};
```

**After:**
```typescript
const RainbowKitWrapper: FC = () => {
  const theme = useThemeStore((s) => s.theme);
  const authStatus = useAuthStore((s) => s.status); // ✅ Direct selector
  
  return (
    <RainbowKitProvider authenticationStatus={authStatus}>
      {/* ... */}
    </RainbowKitProvider>
  );
};
```

### 2. ❌ Missing Dependencies in useSessionRestore
**Before:**
```typescript
useEffect(() => {
  if (isConnected && !isAuthenticated && status !== 'loading') {
    useAuthStore.getState().setStatus('unauthenticated'); // ❌ Direct store call
  }
}, [isConnected, isAuthenticated, status]); // ❌ Missing setStatus dependency
```

**After:**
```typescript
export function useSessionRestore() {
  const { isConnected } = useAccount();
  const { clearUser, status, isAuthenticated, setStatus } = useAuthStore(); // ✅ Extract setStatus

  useEffect(() => {
    if (isConnected && !isAuthenticated && status !== 'loading') {
      setStatus('unauthenticated'); // ✅ Use hook-extracted function
    }
  }, [isConnected, isAuthenticated, status, setStatus]); // ✅ Complete dependencies
}
```

### 3. ⚠️ Multiple State Updates in SiwePrompt
**Before:**
```typescript
useEffect(() => {
  if (isConnected && !isAuthenticated && status === 'unauthenticated' && !hasPrompted) {
    setShowPrompt(true);
    setHasPrompted(true);
  }
  
  if (isAuthenticated) {
    setShowPrompt(false);
  }
  
  if (!isConnected) {
    setShowPrompt(false);
    setHasPrompted(false);
  }
}, [isConnected, isAuthenticated, status, hasPrompted]);
```

**After:**
```typescript
useEffect(() => {
  const shouldShow = isConnected && !isAuthenticated && status === 'unauthenticated' && !hasPrompted;
  
  // ✅ Consolidate state updates with guards
  if (shouldShow && !showPrompt) {
    setShowPrompt(true);
    setHasPrompted(true);
  } else if (isAuthenticated && showPrompt) {
    setShowPrompt(false);
  } else if (!isConnected) {
    if (showPrompt) setShowPrompt(false);
    if (hasPrompted) setHasPrompted(false);
  }
}, [isConnected, isAuthenticated, status, hasPrompted, showPrompt]);
```

---

## Changes Made

### 1. `/App.tsx` - Simplified RainbowKitWrapper
- **Removed:** Manual useEffect subscription to authStore
- **Removed:** Local useState for authStatus
- **Added:** Direct Zustand selector `useAuthStore((s) => s.status)`
- **Result:** No extra re-renders, no manual state sync

### 2. `/hooks/useSessionRestore.ts` - Fixed Store Access
- **Added:** `setStatus` extracted from useAuthStore hook
- **Removed:** Direct `useAuthStore.getState().setStatus()` calls
- **Updated:** All useEffect dependency arrays to include `setStatus`
- **Result:** Proper React hooks flow, no setState during render

### 3. `/components/SiwePrompt.tsx` - Optimized State Updates
- **Added:** Guards before each setState call (`if (showPrompt)`, etc.)
- **Added:** Derived `shouldShow` variable for clarity
- **Added:** `showPrompt` to dependency array
- **Result:** Fewer unnecessary state updates

---

## Why These Fixes Work

### Direct Zustand Selectors
```typescript
// ❌ BAD: Manual subscription can cause timing issues
const [value, setValue] = useState();
useEffect(() => {
  const unsub = store.subscribe((s) => setValue(s.value));
  setValue(store.getState().value); // Synchronous update!
  return unsub;
}, []);

// ✅ GOOD: Zustand handles subscriptions properly
const value = useStore((s) => s.value);
```

### Hook-Extracted Functions
```typescript
// ❌ BAD: Bypasses React's render cycle
useEffect(() => {
  store.getState().setValue(newValue);
}, [deps]); // Missing setValue in deps!

// ✅ GOOD: React tracks the function properly
const { setValue } = useStore();
useEffect(() => {
  setValue(newValue);
}, [setValue, deps]); // Complete dependencies
```

### Conditional State Updates
```typescript
// ❌ BAD: Always calls setState even if value unchanged
useEffect(() => {
  setState(false);
}, [someCondition]);

// ✅ GOOD: Only updates when necessary
useEffect(() => {
  if (state !== false) {
    setState(false);
  }
}, [someCondition, state]);
```

---

## Testing Checklist

After these fixes, verify:

- [x] No React warnings in console
- [x] RainbowKit modal opens properly
- [x] Wallet connection works
- [x] SIWE prompt appears at correct time
- [x] Authentication flow completes
- [x] Disconnect clears state properly
- [x] Re-connection restores session

---

## Best Practices Applied

1. **Use Zustand selectors directly** - Don't manually subscribe
2. **Extract store functions from hooks** - Don't use `getState()` in effects
3. **Complete dependency arrays** - Include all used values
4. **Guard state updates** - Check current value before setting
5. **Consolidate effects** - Avoid multiple effects for same state

---

## Performance Impact

- ✅ **Fewer re-renders** - Direct selectors are more efficient
- ✅ **Better batching** - React can batch updates properly
- ✅ **No warning spam** - Clean console output
- ✅ **Stable references** - Zustand functions are stable by default

---

## Related Files

- `/App.tsx` - Main app with RainbowKitWrapper
- `/hooks/useSessionRestore.ts` - Session restoration logic
- `/components/SiwePrompt.tsx` - Authentication prompt
- `/stores/authStore.ts` - Authentication state (unchanged)

---

## Summary

The render warning was caused by manual state management when Zustand's built-in hooks were sufficient. By using direct selectors and properly extracting store functions, we eliminated all setState-during-render issues while maintaining the same functionality.

**Status: ✅ RESOLVED**
