# Debug: Connect Wallet Button Not Working

## Issue
Clicking "Connect Wallet" button doesn't do anything.

## Added Debug Logging

I've added comprehensive console logging to help identify the issue. Please check your browser console.

## What to Check

### 1. Open Browser Console
- Press `F12` or right-click → Inspect
- Go to the "Console" tab
- Refresh the page

### 2. Look for These Logs

#### On Page Load
```
[RainbowKitWrapper] Mounting...
[RainbowKitWrapper] Auth status changed: unauthenticated (or loading)
[SIWE] 🔍 Checking for existing session
[authApi:authenticated] 📡 Request: GET /api/v1/auth/me withCredentials: true
```

#### CustomConnectButton State
```
[CustomConnectButton] State: {
  mounted: true,
  authenticationStatus: 'unauthenticated',
  account: undefined,
  chain: undefined
}
[CustomConnectButton] Computed: { ready: true, connected: false }
[CustomConnectButton] Rendering "Connect Wallet" button
```

#### When Clicking Connect Wallet
```
[CustomConnectButton] Connect button clicked
```

### 3. Possible Issues

#### Issue A: Button is Hidden (Not Visible)

**Symptoms:**
```
[CustomConnectButton] State: { mounted: true, authenticationStatus: 'loading', ... }
[CustomConnectButton] Computed: { ready: false, connected: false }
```

**Cause:** Status is stuck on 'loading'

**Solution:** The `getSession()` call in SIWE adapter might be hanging. Check if there's a network error.

---

#### Issue B: Button Click Not Firing

**Symptoms:**
- You see "Connect Wallet" button
- Clicking it does nothing
- No "[CustomConnectButton] Connect button clicked" log

**Cause:** JavaScript error preventing click handler

**Solution:** Check for errors in console above the click attempt

---

#### Issue C: RainbowKit Modal Not Opening

**Symptoms:**
- You see "[CustomConnectButton] Connect button clicked"
- But no modal appears

**Cause:** RainbowKit configuration issue or provider missing

**Solution:** Check if there are RainbowKit errors in console

---

#### Issue D: Backend Connection Blocking

**Symptoms:**
```
[SIWE] 🔍 Checking for existing session
[authApi:authenticated] ❌ Network error: ...
```
Then status never changes from 'loading' to 'unauthenticated'

**Cause:** `getSession()` error handling not setting status correctly

**Solution:** Already fixed in code - status should be set to 'unauthenticated' on error

---

#### Issue E: CORS Error

**Symptoms:**
```
Access to XMLHttpRequest at 'https://api.prime.testnet.bitfrost.ai/api/v1/auth/me' 
from origin 'http://localhost:5173' has been blocked by CORS policy
```

**Cause:** Backend not configured for CORS

**Solution:** Backend needs proper CORS headers (see BACKEND_CORS_REQUIREMENTS.md)

**Workaround:** This shouldn't block the button - getSession should handle the error gracefully

---

## Expected Normal Flow

### 1. On Page Load (No Backend)
```
[RainbowKitWrapper] Mounting...
[RainbowKitWrapper] Auth status changed: unauthenticated
[SIWE] 🔍 Checking for existing session
[authApi:authenticated] 📡 Request: GET /api/v1/auth/me withCredentials: true
[authApi:authenticated] 🌐 Network error: Network Error
[SIWE] ℹ️ No session (backend unavailable or error)
[RainbowKitWrapper] Auth status changed: unauthenticated
[CustomConnectButton] State: { mounted: true, authenticationStatus: 'unauthenticated', account: undefined, chain: undefined }
[CustomConnectButton] Computed: { ready: true, connected: false }
[CustomConnectButton] Rendering "Connect Wallet" button
```

### 2. Click Connect Wallet
```
[CustomConnectButton] Connect button clicked
→ RainbowKit modal opens
→ User selects wallet
→ Wallet connection popup appears
```

### 3. After Wallet Connects (SIWE Flow)
```
[SIWE] 📡 Getting nonce from backend
[authApi:public] 📡 Request: GET /api/v1/auth/nonce withCredentials: false
[authApi:public] ✅ Response: 200
[SIWE] ✅ Nonce received
[SIWE] Creating message
→ User sees signature request in wallet
→ User signs
[SIWE] 🔐 Verifying signature with backend
[authApi:authenticated] 📡 Request: POST /api/v1/auth/login withCredentials: true
[authApi:authenticated] ✅ Response: 200
[SIWE] ✅ Authentication successful
```

## Debug Checklist

Check each of these and report back:

- [ ] Page loads without JavaScript errors
- [ ] Console shows `[RainbowKitWrapper] Mounting...`
- [ ] Console shows `[CustomConnectButton] State: { mounted: true, ... }`
- [ ] Console shows `ready: true`
- [ ] "Connect Wallet" button is visible on screen
- [ ] Button is clickable (not disabled, not transparent)
- [ ] Clicking button shows `[CustomConnectButton] Connect button clicked`
- [ ] RainbowKit modal appears after clicking button

## Quick Fix Tests

### Test 1: Force Status to Unauthenticated
Open browser console and run:
```javascript
window.__AUTH_STATUS__ = 'unauthenticated';
```
Then refresh. If button works, the issue is status not being set correctly.

### Test 2: Check RainbowKit Provider
Look for this in console:
```
Uncaught Error: No QueryClient set, use QueryClientProvider to set one
```
or
```
Error: Could not find RainbowKitProvider
```

### Test 3: Check Button Visibility
In console:
```javascript
document.querySelector('button:contains("Connect Wallet")')
```
Should return the button element. If null, button isn't rendering.

## Common Solutions

### Solution 1: Status Stuck on Loading
The `getSession()` call completes but doesn't set status to 'unauthenticated'.

**Fixed in:** `/lib/siweAuthAdapter.ts` - `getSession()` now catches errors and sets status

### Solution 2: RainbowKit Not Initialized
The providers are in wrong order or missing.

**Check:** `/App.tsx` - should be:
```tsx
<QueryClientProvider>
  <WagmiProvider>
    <RainbowKitProvider>
      <RainbowKitAuthenticationProvider>
```

### Solution 3: Button Hidden by CSS
The button renders but is hidden.

**Check:** Browser DevTools → Elements → Find button → Check computed styles

## Report Back

Please copy-paste the console output showing:

1. **On page load** (first 20 lines)
2. **CustomConnectButton state** (the State and Computed logs)
3. **When clicking button** (any logs or errors)
4. **Network tab** (any requests to `/api/v1/auth/me`)

With this information, I can identify the exact issue and provide a fix.

## Temporary Workaround (Testing Only)

If you want to test wallet connection WITHOUT SIWE authentication temporarily:

1. Remove the `RainbowKitAuthenticationProvider` wrapper in `/App.tsx`
2. Remove the `status` prop from `RainbowKitProvider`

This will allow wallet connection to work while we debug the authentication issue.

**BUT** - do not use this for production, we need the SIWE authentication working.
