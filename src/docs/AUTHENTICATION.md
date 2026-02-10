# Bitfrost Authentication Configuration

## Overview

The Bitfrost app uses **SIWE (Sign-In with Ethereum)** authentication with HTTP-only cookies for secure backend authentication. Backend authentication is **ENABLED BY DEFAULT** and gracefully degrades when the backend is unavailable.

## Configuration

Authentication is controlled by the `VITE_ENABLE_BACKEND_AUTH` environment variable in your `.env.local` file.

### Default Mode (Backend Auth Enabled)

```env
# Backend auth is enabled by default - no need to set this
# VITE_ENABLE_BACKEND_AUTH=true
```

**Behavior:**
- ✅ **SIWE authentication** via backend API (secure, production-ready)
- ✅ Wallet connection triggers SIWE signature request
- ✅ User signs message to authenticate
- ✅ Backend validates signature and creates session
- ✅ HTTP-only cookies for session management (XSS protection)
- ✅ **Graceful degradation** if backend is unavailable
- ✅ No user-facing errors when backend is down

### Development Mode (Backend Auth Disabled)

```env
VITE_ENABLE_BACKEND_AUTH=false
```

**Behavior:**
- ✅ Wallet connection works normally (no signature required)
- ✅ SIWE authentication is skipped
- ✅ No backend calls for authentication
- ✅ Full app functionality available
- ✅ Useful for frontend-only development

## Authentication Flow

### When Wallet Connects:

1. User connects wallet via RainbowKit
2. `useAuth` hook detects connection
3. If `VITE_ENABLE_BACKEND_AUTH=true`:
   - Calls `POST /api/v1/auth/login` with wallet address
   - Backend sets HTTP-only cookie
   - Returns user data: `{ user_deposited: boolean }`
   - Updates Zustand auth store
4. If `VITE_ENABLE_BACKEND_AUTH=false`:
   - Skips backend call
   - Sets mock user data immediately
   - Updates Zustand auth store

### When Wallet Disconnects:

1. User disconnects wallet
2. `useAuth` hook detects disconnection
3. If `VITE_ENABLE_BACKEND_AUTH=true`:
   - Calls `POST /api/v1/auth/logout`
   - Backend clears HTTP-only cookie
   - Clears Zustand auth store
4. If `VITE_ENABLE_BACKEND_AUTH=false`:
   - Skips backend call
   - Clears Zustand auth store immediately

## Backend API Endpoints

### Login

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "wallet_address": "0x1234..."
}
```

**Response:**
```json
{
  "data": {
    "user_deposited": true
  }
}
```

**Sets HTTP-only cookie** for session management.

### Logout

```http
POST /api/v1/auth/logout
```

**Response:**
```json
{
  "data": null
}
```

**Clears HTTP-only cookie**.

## Zustand Auth Store

Located at `/stores/authStore.ts`

### State:

```typescript
interface AuthState {
  isAuthenticated: boolean;  // Whether user is logged in
  user: User | null;         // User information
  isLoading: boolean;        // Loading state
}

interface User {
  user_deposited: boolean;   // Whether user has deposited funds
}
```

### Actions:

```typescript
setUser(user: User): void      // Set user and mark authenticated
clearUser(): void              // Clear user and mark unauthenticated
setLoading(loading: boolean): void  // Set loading state
```

### Usage:

```tsx
import { useAuthStore } from './stores/authStore';

function MyComponent() {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) {
    return <div>Please connect wallet</div>;
  }
  
  return <div>Welcome! Deposited: {user?.user_deposited}</div>;
}
```

## Switching Between Modes

### Enable Backend Authentication:

1. Ensure backend API is running and accessible
2. Update `.env.local`:
   ```env
   VITE_ENABLE_BACKEND_AUTH=true
   ```
3. Restart dev server: `npm run dev`

### Disable Backend Authentication:

1. Update `.env.local`:
   ```env
   VITE_ENABLE_BACKEND_AUTH=false
   ```
2. Restart dev server: `npm run dev`

## CORS Configuration

When `VITE_ENABLE_BACKEND_AUTH=true`, ensure your backend API has CORS configured to allow:

- **Origin**: Your frontend URL (e.g., `http://localhost:5173`)
- **Credentials**: `true` (required for HTTP-only cookies)
- **Methods**: `GET, POST, PUT, DELETE, PATCH, OPTIONS`
- **Headers**: `Content-Type, X-Request-Time, X-Wallet-Address`

Example Express.js CORS config:

```javascript
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
```

## Troubleshooting

### "Network Error" in console

**Cause**: Backend not running or CORS not configured

**Solution**: Set `VITE_ENABLE_BACKEND_AUTH=false` in `.env.local` until backend is ready

### Authentication works but user data not persisted

**Cause**: HTTP-only cookies not being set/sent

**Solution**: 
- Ensure `withCredentials: true` in axios config (already set)
- Ensure backend sets `SameSite=None; Secure` for cross-origin cookies
- Check backend CORS config allows credentials

### User logged out unexpectedly

**Cause**: HTTP-only cookie expired or session invalid

**Solution**:
- Check backend session/cookie expiration settings
- Implement refresh token logic if needed
- Check browser console for 401 errors

## Security Notes

- **HTTP-only cookies**: Cannot be accessed by JavaScript, preventing XSS attacks
- **No tokens in localStorage**: More secure than storing JWTs in localStorage
- **CORS**: Properly configured to only allow your frontend domain
- **Wallet address**: Only used for authentication, not authorization
- **Session management**: Handled entirely by backend via cookies

## Future Enhancements

- [ ] Add refresh token logic for expired sessions
- [ ] Add user profile endpoints (name, email, settings)
- [ ] Add role-based authorization
- [ ] Add 2FA support
- [ ] Add session management UI (view active sessions, logout all devices)