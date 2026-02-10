# Authentication API Service

Centralized internal API service for all authentication-related backend calls using **axios**.

## 📁 File Structure

```
/lib/authApi.ts           ← Centralized API service (axios)
/lib/siweAuthAdapter.ts   ← SIWE adapter (uses authApi)
/hooks/useAuth.ts         ← Auth hook (uses authApi)
```

## 🏗️ Architecture

### **Axios Instances**

Two separate axios instances for different security requirements:

```typescript
// Public API - No credentials
const publicApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: false, // ❌ No cookies
});

// Authenticated API - With credentials
const authenticatedApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true, // ✅ HTTP-only cookies
});
```

### **Interceptors**

Both instances have request/response interceptors for:
- 📡 Request logging (method, URL, credentials status)
- ✅ Response logging (status, URL)
- ❌ Error logging (status, network errors, CORS issues)
- 🔍 Detailed debugging information

## 🔒 Credentials Strategy

### PUBLIC ENDPOINTS (withCredentials: false)

**`publicApi`** - No session cookies sent or received

- ✅ `GET /api/v1/auth/nonce`
  - **Why:** First call before any authentication exists
  - **No session cookie needed**
  - **No session cookie set**
  - **No CORS preflight for credentials**

### AUTHENTICATED ENDPOINTS (withCredentials: true)

**`authenticatedApi`** - Session cookies sent and/or received

- ✅ `POST /api/v1/auth/login`
  - **Why:** Backend **SETS** session cookie in response
  - **Must include credentials to receive and store cookie**
  
- ✅ `GET /api/v1/auth/me`
  - **Why:** Backend **READS** session cookie to verify authentication
  - **Must send cookie to validate session**
  
- ✅ `POST /api/v1/auth/logout`
  - **Why:** Backend **READS** session cookie to identify session to clear
  - **Must send cookie to identify which session to destroy**
  
- ✅ `GET /api/v1/account`
  - **Why:** Backend **READS** session cookie for user authentication
  - **Must send cookie to get user-specific account data**

## 📋 API Methods

### `/lib/authApi.ts`

```typescript
import { authApi } from '../lib/authApi';

// PUBLIC ENDPOINTS
await authApi.getNonce();           // Returns: string (nonce)

// AUTHENTICATED ENDPOINTS  
await authApi.login({ message, signature });  // Returns: LoginResponse
await authApi.getSession();         // Returns: SessionResponse | null
await authApi.logout();             // Returns: void
await authApi.getAccount();         // Returns: AccountResponse
```

## 🔄 Usage Examples

### SIWE Adapter (`/lib/siweAuthAdapter.ts`)

```typescript
export const siweAuthAdapter: AuthenticationAdapter = {
  getNonce: async () => {
    const nonce = await authApi.getNonce();
    return nonce;
  },
  
  verifyMessage: async ({ message, signature }) => {
    const result = await authApi.login({ message, signature });
    return result.success;
  },
  
  getSession: async () => {
    const session = await authApi.getSession();
    return session ? { address: session.address, chainId: 1 } : null;
  },
  
  signOut: async () => {
    await authApi.logout();
  },
};
```

### Auth Hook (`/hooks/useAuth.ts`)

```typescript
const fetchUserData = async () => {
  const data = await authApi.getAccount();
  
  setUser({
    address: data.account.address,
    user_deposited: hasDeposited,
  });
};
```

## 🎯 Benefits

✅ **Centralized API logic** - All auth calls in one place  
✅ **Proper credentials handling** - Clear which endpoints need cookies  
✅ **Better type safety** - Typed request/response interfaces  
✅ **Easier testing** - Mock one service instead of many fetch calls  
✅ **Better error handling** - Consistent error handling with AuthApiError  
✅ **Clearer CORS configuration** - Backend knows exactly which endpoints need CORS credentials  
✅ **Single source of truth** - API base URL and timeouts defined once  

## 🔍 Error Handling

All methods throw `AuthApiError` with:
- `message` - Human-readable error message
- `status` - HTTP status code
- `endpoint` - Full endpoint URL

```typescript
try {
  const nonce = await authApi.getNonce();
} catch (error) {
  if (error instanceof AuthApiError) {
    console.error(`${error.endpoint} failed with status ${error.status}`);
  }
}
```

## 🌐 CORS Configuration (Backend)

The backend needs to configure CORS as follows:

### Nonce Endpoint (Public)
```
GET /api/v1/auth/nonce
Access-Control-Allow-Origin: * (or specific origins)
Access-Control-Allow-Credentials: NOT needed
```

### Authenticated Endpoints
```
POST /api/v1/auth/login
GET /api/v1/auth/me
POST /api/v1/auth/logout
GET /api/v1/account

Access-Control-Allow-Origin: <specific origin> (e.g., https://app.bitfrost.ai)
Access-Control-Allow-Credentials: true
Access-Control-Allow-Headers: Content-Type, Accept
Access-Control-Allow-Methods: GET, POST
```

## 📝 Type Definitions

### NonceResponse
```typescript
{
  nonce: string;
  expiresAt: string;
}
```

### LoginRequest
```typescript
{
  message: string;      // SIWE message
  signature: string;    // Wallet signature
}
```

### LoginResponse
```typescript
{
  success: boolean;
  address?: string;
}
```

### SessionResponse
```typescript
{
  address: string;
  expiresAt: string;
}
```

### AccountResponse
```typescript
{
  account: {
    address: string;
    unlocked: string;
    locked: string;
    marginLocked: string;
    createdAt: string;
    updatedAt: string;
  }
}
```

## 🔄 Authentication Flow

```
1. User clicks "Connect Wallet"
   ↓
2. RainbowKit triggers getNonce()
   ↓
3. authApi.getNonce() → GET /api/v1/auth/nonce (credentials: 'omit')
   ↓
4. User signs SIWE message
   ↓
5. RainbowKit triggers verifyMessage()
   ↓
6. authApi.login() → POST /api/v1/auth/login (credentials: 'include')
   Backend sets HTTP-only session cookie
   ↓
7. AuthSync detects authentication
   ↓
8. useAuth().fetchUserData() called
   ↓
9. authApi.getAccount() → GET /api/v1/account (credentials: 'include')
   Session cookie sent automatically
   ↓
10. User is fully authenticated!
```

## 🚀 Migration Summary

### Before
- Direct `fetch()` calls scattered across multiple files
- Inconsistent credentials handling
- Redundant type definitions
- Mixed credential strategies

### After
- ✅ Centralized `authApi` service in `/lib/authApi.ts`
- ✅ Clear separation: public vs authenticated endpoints
- ✅ Single source of truth for types
- ✅ Consistent error handling with `AuthApiError`
- ✅ Proper CORS credentials configuration