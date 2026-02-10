# SIWE (Sign-In with Ethereum) Authentication Implementation

## Overview

Bitfrost uses **SIWE (EIP-4361)** for secure, wallet-based authentication. This implementation integrates RainbowKit's authentication adapter with our backend API to provide a seamless and secure login experience.

## Architecture

```
┌─────────────────┐
│   User Wallet   │
└────────┬────────┘
         │ 1. Connect Wallet
         ▼
┌─────────────────┐
│   RainbowKit    │ ◄──── Authentication UI
└────────┬────────┘
         │ 2. Request Nonce
         ▼
┌─────────────────┐
│  SIWE Adapter   │ ◄──── /lib/siweAuthAdapter.ts
└────────┬────────┘
         │ 3. GET /api/v1/auth/nonce
         ▼
┌─────────────────┐
│    Backend      │
│  (Your API)     │
└────────┬────────┘
         │ 4. Return nonce
         ▼
┌─────────────────┐
│  SIWE Adapter   │
│  Create Message │
└────────┬────────┘
         ��� 5. User Signs Message
         ▼
┌─────────────────┐
│   User Wallet   │
└────────┬────────┘
         │ 6. Signature
         ▼
┌─────────────────┐
│  SIWE Adapter   │
│ Verify Message  │
└────────┬────────┘
         │ 7. POST /api/v1/auth/login
         │    { message, signature }
         ▼
┌─────────────────┐
│    Backend      │
│  Verify + Set   │
│  HTTP-only      │
│    Cookie       │
└────────┬────────┘
         │ 8. Authenticated!
         ▼
┌─────────────────┐
│  AuthSync Hook  │ ◄──── Updates Zustand store
└────────┬────────┘
         │ 9. Fetch user data
         ▼
┌─────────────────┐
│   useAuth()     │
│ fetchUserData() │
└────────┬────────┘
         │ 10. GET /api/v1/account
         ▼
┌─────────────────┐
│  App Rendered   │ ◄──── User logged in!
└─────────────────┘
```

## Implementation Files

### 1. SIWE Auth Adapter (`/lib/siweAuthAdapter.ts`)

This is the core adapter that RainbowKit uses for SIWE authentication:

```typescript
import { siweAuthAdapter } from './lib/siweAuthAdapter';
```

**Methods:**
- `getNonce()` - Fetches nonce from backend
- `createMessage()` - Creates EIP-4361 SIWE message
- `verifyMessage()` - Sends signature to backend for verification
- `getSession()` - Checks if user has active session
- `signOut()` - Clears session on backend

### 2. Auth Store (`/stores/authStore.ts`)

Zustand store that manages authentication state:

```typescript
const { isAuthenticated, user, setUser, clearUser } = useAuthStore();
```

**State:**
- `isAuthenticated` - Boolean flag
- `user` - User object with address and account data
- `isLoading` - Loading state
- `status` - 'loading' | 'authenticated' | 'unauthenticated'

### 3. Auth Hook (`/hooks/useAuth.ts`)

Custom hook for fetching user account data after SIWE authentication:

```typescript
const { fetchUserData, handleLogout } = useAuth();
```

**Methods:**
- `fetchUserData()` - Fetches account data from `/api/v1/account`
- `handleLogout()` - Clears local state (backend logout handled by adapter)

### 4. AuthSync Component (`/App.tsx`)

Syncs RainbowKit's authentication status with Zustand store:

```typescript
const AuthSync: FC = () => {
  const { status } = useAuthenticationStatus();
  // Syncs status and fetches user data
};
```

## Backend API Endpoints

### GET `/api/v1/auth/nonce`

**Request:**
```
GET /api/v1/auth/nonce
```

**Response:**
```json
{
  "nonce": "random-uuid-string",
  "expiresAt": "2024-01-15T12:00:00Z"
}
```

**Backend Requirements:**
- Generate cryptographically secure random nonce
- Store nonce with 10-minute expiration
- Return unique nonce for each request

---

### POST `/api/v1/auth/login`

**Request:**
```json
{
  "message": "example.com wants you to sign in...",
  "signature": "0x1234..."
}
```

**Response:**
```json
{
  "success": true,
  "address": "0x1234..."
}
```

**Backend Requirements:**
- Parse SIWE message
- Verify signature matches address
- Validate nonce hasn't been used (replay attack prevention)
- Check message hasn't expired
- Verify domain matches your app
- Create session and set HTTP-only cookie
- Mark nonce as used

---

### GET `/api/v1/auth/me`

**Request:**
```
GET /api/v1/auth/me
Cookie: session=...
```

**Response:**
```json
{
  "address": "0x1234...",
  "expiresAt": "2024-01-15T12:00:00Z"
}
```

**Backend Requirements:**
- Verify session cookie
- Return user data if authenticated
- Return 401 if not authenticated

---

### POST `/api/v1/auth/logout`

**Request:**
```
POST /api/v1/auth/logout
Cookie: session=...
```

**Response:**
```json
{
  "success": true
}
```

**Backend Requirements:**
- Clear session from storage
- Clear HTTP-only cookie
- Return success even if no session exists

---

### GET `/api/v1/account`

**Request:**
```
GET /api/v1/account
Cookie: session=...
```

**Response:**
```json
{
  "account": {
    "address": "0x1234...",
    "unlocked": "1000.00",
    "locked": "500.00",
    "marginLocked": "200.00",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-15T12:00:00Z"
  }
}
```

## Security Considerations

### ✅ Nonce Security
- **Single-use**: Each nonce must only be used once
- **Expiration**: Nonces expire after 10 minutes
- **Random**: Use cryptographically secure random generation
- **Storage**: Store nonces temporarily (Redis recommended)

### ✅ Message Security
- **Expiration**: SIWE messages expire 10 minutes after creation
- **Domain validation**: Backend must verify domain matches
- **URI validation**: Backend must verify URI matches
- **Version**: Always use version "1"

### ✅ Cookie Security
- **HttpOnly**: Prevents JavaScript access (XSS protection)
- **Secure**: Only sent over HTTPS in production
- **SameSite**: Set to 'Strict' or 'Lax' (CSRF protection)
- **Expiration**: Set reasonable session expiration

### ✅ Signature Verification
- **Verify address**: Ensure signature matches claimed address
- **Verify message**: Parse and validate SIWE message structure
- **Prevent replay**: Mark nonces as used immediately

### ❌ Common Vulnerabilities to Avoid
- Reusing nonces (replay attacks)
- Not validating message expiration
- Not checking domain/URI
- Not using HTTPS in production
- Making cookies accessible to JavaScript
- Not implementing CSRF protection

## Flow Examples

### User Login Flow

1. **User clicks "Connect Wallet"**
   - RainbowKit modal opens
   - User selects wallet (MetaMask, WalletConnect, etc.)

2. **Wallet connects**
   - RainbowKit detects authentication is required
   - Calls `siweAuthAdapter.getNonce()`
   - Backend returns fresh nonce

3. **SIWE message created**
   - Adapter creates standardized EIP-4361 message
   - Message includes: domain, address, nonce, expiration

4. **User signs message**
   - Wallet prompts user to sign
   - User approves signature
   - Wallet returns signature

5. **Signature verified**
   - Adapter sends message + signature to backend
   - Backend verifies signature is valid
   - Backend creates session with HTTP-only cookie

6. **User data fetched**
   - `AuthSync` detects authentication
   - Calls `useAuth().fetchUserData()`
   - Fetches account details from `/api/v1/account`
   - Updates Zustand store with user data

7. **User is logged in**
   - `isAuthenticated = true`
   - App shows authenticated UI

### User Logout Flow

1. **User clicks "Disconnect"**
   - App calls `disconnect()` from wagmi
   - RainbowKit calls `siweAuthAdapter.signOut()`

2. **Backend logout**
   - Adapter calls `POST /api/v1/auth/logout`
   - Backend clears session and cookie

3. **Local state cleared**
   - `AuthSync` detects unauthenticated status
   - Calls `clearUser()` on Zustand store
   - `isAuthenticated = false`

4. **User is logged out**
   - App shows non-authenticated UI

### Session Persistence

On page load:

1. **App initializes**
   - `AuthSync` component mounts
   - RainbowKit calls `siweAuthAdapter.getSession()`

2. **Check session**
   - Adapter calls `GET /api/v1/auth/me`
   - Cookies sent automatically

3. **If session valid:**
   - Backend returns user address
   - `AuthSync` sets user in store
   - User remains logged in

4. **If session invalid:**
   - Backend returns 401
   - User must sign in again

## Testing Checklist

### Frontend Testing
- [ ] User can connect wallet
- [ ] SIWE signature prompt appears
- [ ] User can sign message
- [ ] Authentication succeeds after signing
- [ ] User data is fetched after authentication
- [ ] Session persists on page refresh
- [ ] User can disconnect wallet
- [ ] Logout clears local state
- [ ] Reconnecting prompts new SIWE flow

### Backend Testing
- [ ] Nonce endpoint returns unique nonces
- [ ] Nonces expire after 10 minutes
- [ ] Same nonce cannot be used twice (replay attack)
- [ ] Invalid signatures are rejected
- [ ] Expired messages are rejected
- [ ] Wrong domain in message is rejected
- [ ] Session cookie is HTTP-only
- [ ] Session cookie has Secure flag (production)
- [ ] Session cookie has SameSite attribute
- [ ] `/me` returns 401 when not authenticated
- [ ] `/logout` clears session properly

### Security Testing
- [ ] Cookies not accessible via `document.cookie`
- [ ] HTTPS enforced in production
- [ ] CSRF protection enabled
- [ ] Nonces stored securely
- [ ] Sessions expire appropriately
- [ ] Rate limiting on auth endpoints

## Environment Variables

No additional environment variables needed! SIWE authentication works with your existing backend URL configuration:

```bash
# Already configured in constants/app.ts
VITE_NETWORK=testnet  # or mainnet
```

The API base URL is automatically selected based on `VITE_NETWORK`.

## Debugging

Enable authentication logs:

```typescript
// Check browser console for:
[SIWE] Requesting nonce from backend
[SIWE] Nonce received
[SIWE] Creating message
[SIWE] Message created
[SIWE] Verifying signature with backend
[SIWE] Verification successful
[AuthSync] User authenticated via SIWE
[useAuth] Fetching user account data
[useAuth] User account data fetched
```

Check Network tab:
1. `GET /api/v1/auth/nonce` - Should return nonce
2. `POST /api/v1/auth/login` - Should return success
3. `GET /api/v1/auth/me` - Should return user address
4. `GET /api/v1/account` - Should return account data

Check cookies in DevTools:
- Should see session cookie (name may vary)
- Cookie should have `HttpOnly` flag
- Cookie should have `Secure` flag (production only)

## References

- [EIP-4361: Sign-In with Ethereum](https://eips.ethereum.org/EIPS/eip-4361)
- [RainbowKit Authentication](https://www.rainbowkit.com/docs/authentication)
- [SIWE Library](https://github.com/spruceid/siwe)
- [Wagmi Documentation](https://wagmi.sh/)

## Support

For issues with:
- **Frontend**: Check `/lib/siweAuthAdapter.ts` and browser console
- **Backend**: Check API logs and verify endpoint responses
- **Cookies**: Ensure HTTPS in production and proper cookie flags
- **Nonces**: Verify backend generates unique, expiring nonces
