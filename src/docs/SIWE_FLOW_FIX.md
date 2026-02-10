# SIWE Flow Fix - RainbowKit Integration

## Problem

After wallet connection, the nonce endpoint was not being called. The SIWE authentication modal was not appearing.

## Root Cause

The `RainbowKitAuthenticationProvider` was missing the **`status` prop**, which tells RainbowKit when to trigger the SIWE authentication flow.

Without this prop, RainbowKit:
- ❌ Doesn't know authentication is required after wallet connection
- ❌ Doesn't show the SIWE signature modal
- ❌ Doesn't call `getNonce()`, `createMessage()`, or `verifyMessage()`

## Solution

### 1. Added `status` Prop to RainbowKitAuthenticationProvider

**Before:**
```typescript
<RainbowKitAuthenticationProvider adapter={siweAuthAdapter}>
  <AuthSync />
  <AppContent />
</RainbowKitAuthenticationProvider>
```

**After:**
```typescript
const authStatus = useAuthStore((s) => s.status);

<RainbowKitAuthenticationProvider 
  adapter={siweAuthAdapter}
  status={authStatus} // ✅ CRITICAL: Tells RainbowKit when to show SIWE modal
>
  <AuthSync />
  <AppContent />
</RainbowKitAuthenticationProvider>
```

### 2. Updated SIWE Adapter to Manage Zustand Store

The adapter now updates the auth store state at each step:

```typescript
export const siweAuthAdapter: AuthenticationAdapter = {
  getNonce: async () => {
    useAuthStore.getState().setStatus('loading'); // Set loading
    const nonce = await authApi.getNonce();
    return nonce;
  },

  verifyMessage: async ({ message, signature }) => {
    const result = await authApi.login({ message, signature });
    if (result.success && result.address) {
      useAuthStore.getState().setUser({ address: result.address }); // ✅ Set authenticated
      return true;
    }
    useAuthStore.getState().setStatus('unauthenticated'); // Set unauthenticated
    return false;
  },

  getSession: async () => {
    useAuthStore.getState().setStatus('loading');
    const session = await authApi.getSession();
    if (session) {
      useAuthStore.getState().setUser({ address: session.address }); // ✅ Restore session
      return { address: session.address, chainId: 1 };
    }
    useAuthStore.getState().setStatus('unauthenticated');
    return null;
  },

  signOut: async () => {
    await authApi.logout();
    useAuthStore.getState().clearUser(); // ✅ Clear state
  },
};
```

### 3. Simplified AuthSync Component

Removed manual session checking since RainbowKit handles it:

**Before:**
```typescript
const AuthSync: FC = () => {
  // Manual session check on mount
  useEffect(() => {
    const checkSession = async () => {
      const session = await siweAuthAdapter.getSession();
      // ... manual state management
    };
    checkSession();
  }, []);
  
  // ... more manual logic
};
```

**After:**
```typescript
const AuthSync: FC = () => {
  const { address, isConnected } = useAccount();
  const { clearUser, isAuthenticated } = useAuthStore();
  const { fetchUserData } = useAuth();

  // Handle wallet disconnect
  useEffect(() => {
    if (!isConnected && isAuthenticated) {
      clearUser();
    }
  }, [isConnected, isAuthenticated, clearUser]);

  // Fetch user data when authenticated
  useEffect(() => {
    if (isAuthenticated && address) {
      fetchUserData();
    }
  }, [isAuthenticated, address, fetchUserData]);

  return null;
};
```

## How It Works Now

### **Flow 1: First Time Connection**

```
1. User clicks "Connect Wallet"
   ↓
2. Wallet connects (isConnected = true)
   ↓
3. RainbowKit checks status prop → sees "unauthenticated"
   ↓
4. RainbowKit shows SIWE modal
   ↓
5. RainbowKit calls adapter.getNonce()
   → authApi.getNonce() → GET /api/v1/auth/nonce (withCredentials: false)
   → Store: setStatus('loading')
   ↓
6. RainbowKit calls adapter.createMessage()
   → Creates EIP-4361 SIWE message
   ↓
7. User signs message in wallet
   ↓
8. RainbowKit calls adapter.verifyMessage()
   → authApi.login() → POST /api/v1/auth/login (withCredentials: true)
   → Backend sets HTTP-only session cookie
   → Store: setUser({ address }) → status becomes 'authenticated'
   ↓
9. RainbowKit sees status changed to 'authenticated'
   ↓
10. SIWE modal closes
   ↓
11. AuthSync detects isAuthenticated = true
   → Calls fetchUserData() → GET /api/v1/account
   ↓
12. ✅ User is fully authenticated!
```

### **Flow 2: Returning User with Existing Session**

```
1. User loads page
   ↓
2. RainbowKit calls adapter.getSession() on mount
   → authApi.getSession() → GET /api/v1/auth/me (withCredentials: true)
   → Browser sends HTTP-only session cookie
   ↓
3. Backend validates cookie, returns user address
   ↓
4. Adapter updates store: setUser({ address })
   → status becomes 'authenticated'
   ↓
5. RainbowKit sees status = 'authenticated'
   → No SIWE modal shown (already authenticated)
   ↓
6. User's wallet auto-connects (RainbowKit feature)
   ↓
7. AuthSync detects isAuthenticated = true
   → Calls fetchUserData()
   ↓
8. ✅ User is authenticated without signing again!
```

### **Flow 3: Session Expired**

```
1. User loads page
   ↓
2. RainbowKit calls adapter.getSession()
   → GET /api/v1/auth/me
   → Backend returns 401 (session expired)
   ↓
3. Adapter sets status = 'unauthenticated'
   ↓
4. User connects wallet
   ↓
5. RainbowKit sees status = 'unauthenticated'
   → Shows SIWE modal
   ↓
6. [Same as Flow 1 from step 5]
```

## State Management Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Zustand Store (useAuthStore)                                │
│                                                              │
│ status: 'loading' | 'authenticated' | 'unauthenticated'     │
│ isAuthenticated: boolean                                    │
│ user: { address, user_deposited } | null                   │
└─────────────────────────────────────────────────────────────┘
                        ↑
                        │
                        │ Updates via getState()
                        │
┌─────────────────────────────────────────────────────────────┐
│ SIWE Adapter (siweAuthAdapter)                              │
│                                                              │
│ • getNonce() → setStatus('loading')                         │
│ • verifyMessage() → setUser() or setStatus('unauth')       │
│ • getSession() → setUser() or setStatus('unauth')          │
│ • signOut() → clearUser()                                   │
└─────────────────────────────────────────────────────────────┘
                        ↑
                        │
                        │ Calls adapter methods
                        │
┌─────────────────────────────────────────────────────────────┐
│ RainbowKit (RainbowKitAuthenticationProvider)               │
│                                                              │
│ Reads: status prop from Zustand                             │
│ Actions: Calls adapter methods based on status              │
│                                                              │
│ status = 'unauthenticated' → Show SIWE modal                │
│ status = 'loading' → Show loading state                     │
│ status = 'authenticated' → Hide modal, show as connected    │
└─────────────────────────────────────────────────────────────┘
```

## Key Changes Summary

### Files Modified

1. **`/App.tsx`**
   - ✅ Added `status` prop to `RainbowKitAuthenticationProvider`
   - ✅ Simplified `AuthSync` component (removed manual session check)
   - ✅ Let RainbowKit handle SIWE flow automatically

2. **`/lib/siweAuthAdapter.ts`**
   - ✅ Import Zustand store
   - ✅ Update store state in `getNonce()` - set loading
   - ✅ Update store state in `verifyMessage()` - set user on success
   - ✅ Update store state in `getSession()` - set user or unauthenticated
   - ✅ Update store state in `signOut()` - clear user
   - ✅ Added comprehensive logging for debugging

## Testing Checklist

### First Time User
- [x] User clicks "Connect Wallet"
- [x] SIWE modal appears
- [x] Network tab shows `GET /api/v1/auth/nonce` (withCredentials: false)
- [x] User signs message in wallet
- [x] Network tab shows `POST /api/v1/auth/login` (withCredentials: true)
- [x] Session cookie is set in browser
- [x] Network tab shows `GET /api/v1/account` (withCredentials: true)
- [x] User is shown as connected and authenticated

### Returning User
- [x] Page loads
- [x] Network tab shows `GET /api/v1/auth/me` (withCredentials: true)
- [x] Session cookie is sent with request
- [x] User is automatically authenticated
- [x] No SIWE modal shown
- [x] Wallet auto-connects

### Logout
- [x] User clicks disconnect
- [x] Network tab shows `POST /api/v1/auth/logout` (withCredentials: true)
- [x] Session cookie is cleared
- [x] User is unauthenticated
- [x] Wallet is disconnected

## Debug Logs

Enable logging to see the full flow:

```
[SIWE] 🔍 Checking for existing session
[authApi:authenticated] 📡 Request: GET /api/v1/auth/me withCredentials: true
[authApi:authenticated] ✅ Response: 200
[SIWE] ✅ Session found { address: '0x123...' }

[SIWE] 📡 Getting nonce from backend
[authApi:public] 📡 Request: GET /api/v1/auth/nonce withCredentials: false
[authApi:public] ✅ Response: 200
[SIWE] ✅ Nonce received

[SIWE] 🔐 Verifying signature with backend
[authApi:authenticated] 📡 Request: POST /api/v1/auth/login withCredentials: true
[authApi:authenticated] ✅ Response: 200
[SIWE] ✅ Authentication successful { address: '0x123...' }

[AuthSync] User authenticated, fetching account data { address: '0x123...' }
```

## Benefits

✅ **Automatic SIWE flow** - RainbowKit triggers authentication automatically  
✅ **Proper state management** - Zustand store synced with RainbowKit  
✅ **Session persistence** - Returning users don't need to sign again  
✅ **Clean separation** - RainbowKit handles auth UX, we handle business logic  
✅ **Type-safe** - Full TypeScript support throughout  
✅ **Debuggable** - Comprehensive logging at every step  

## Why This Works

The `status` prop is the **critical bridge** between:
- **Our state management** (Zustand)
- **RainbowKit's UI logic** (when to show SIWE modal)

Without it:
- RainbowKit doesn't know when authentication is needed
- The adapter exists but is never called
- No nonce request is made

With it:
- RainbowKit reads `status = 'unauthenticated'` after wallet connects
- RainbowKit shows SIWE modal
- RainbowKit calls adapter methods
- Authentication flow completes
- Store updates to `status = 'authenticated'`
- RainbowKit hides modal and shows user as connected

## Related Documentation

- [BACKEND_INTEGRATION_SUMMARY.md](./BACKEND_INTEGRATION_SUMMARY.md) - Full backend integration guide
- [BACKEND_CORS_REQUIREMENTS.md](./BACKEND_CORS_REQUIREMENTS.md) - CORS configuration
- [AXIOS_SENIOR_REFACTOR.md](./AXIOS_SENIOR_REFACTOR.md) - Axios architecture
- [RainbowKit Authentication Docs](https://www.rainbowkit.com/docs/authentication) - Official RainbowKit docs
