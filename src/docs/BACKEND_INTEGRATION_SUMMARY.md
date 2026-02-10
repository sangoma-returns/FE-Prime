# Backend Integration - Production Ready

## ✅ Implementation Complete

The authentication system is now fully configured for **real backend integration** with **SIWE (Sign-In with Ethereum)** using axios.

## 🎯 Key Changes

### 1. **No Fallback Functionality**
- ❌ Removed all mock/stub responses
- ❌ Removed silent error suppression (except for expected 401/403)
- ✅ All errors are logged and visible for debugging
- ✅ Real backend calls for all operations

### 2. **Proper Axios Implementation**
- ✅ Two axios instances with different credential strategies
- ✅ Public API: `withCredentials: false` for nonce
- ✅ Authenticated API: `withCredentials: true` for all other endpoints
- ✅ Request/response interceptors for debugging
- ✅ Proper error handling with custom `AuthApiError` class

### 3. **SIWE Flow**
```
1. User clicks "Connect Wallet"
   ↓
2. Frontend calls GET /api/v1/auth/nonce (withCredentials: false)
   ↓
3. User signs SIWE message in wallet
   ↓
4. Frontend calls POST /api/v1/auth/login (withCredentials: true)
   ↓
5. Backend verifies signature & sets HTTP-only session cookie
   ↓
6. Frontend calls GET /api/v1/auth/me (withCredentials: true)
   ↓
7. Frontend calls GET /api/v1/account (withCredentials: true)
   ↓
8. User is fully authenticated!
```

## 📋 Axios Configuration

### Public Endpoint (Nonce)
```typescript
const publicApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: false, // ❌ No credentials
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});
```

**Endpoints:**
- `GET /api/v1/auth/nonce`

**Why `withCredentials: false`?**
- First call before any authentication exists
- No cookies to send or receive
- Simpler CORS configuration (can use `Access-Control-Allow-Origin: *`)
- Avoids unnecessary preflight requests

### Authenticated Endpoints
```typescript
const authenticatedApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true, // ✅ Include credentials
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});
```

**Endpoints:**
- `POST /api/v1/auth/login` - Backend sets session cookie
- `GET /api/v1/auth/me` - Backend reads session cookie
- `POST /api/v1/auth/logout` - Backend clears session cookie
- `GET /api/v1/account` - Backend reads session cookie for user data

**Why `withCredentials: true`?**
- Sends HTTP-only cookies automatically
- Receives and stores cookies from backend
- Required for session-based authentication

## 🔍 Error Handling

### Public Endpoints (getNonce)
```typescript
// Throws error if fails - no fallback
export async function getNonce(): Promise<string> {
  try {
    const response = await publicApi.get<NonceResponse>(endpoint);
    return response.data.nonce;
  } catch (error) {
    throw handleApiError(error, endpoint); // ❌ No fallback
  }
}
```

### Session Check (getSession)
```typescript
// Returns null for 401/403 (expected), throws for other errors
export async function getSession(): Promise<SessionResponse | null> {
  try {
    const response = await authenticatedApi.get<SessionResponse>(endpoint);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // 401/403 = no session (expected)
      if (error.response?.status === 401 || error.response?.status === 403) {
        return null;
      }
    }
    // All other errors are thrown for visibility
    throw handleApiError(error, endpoint);
  }
}
```

### Login/Account (Critical Operations)
```typescript
// Throws error if fails - must succeed
export async function login(request: LoginRequest): Promise<LoginResponse> {
  try {
    const response = await authenticatedApi.post<LoginResponse>(endpoint, request);
    return response.data;
  } catch (error) {
    throw handleApiError(error, endpoint); // ❌ No fallback
  }
}
```

## 🌐 CORS Requirements (Backend)

### Nonce Endpoint
```http
Access-Control-Allow-Origin: * (or specific origin)
Access-Control-Allow-Methods: GET, OPTIONS
```
**No `Access-Control-Allow-Credentials` needed**

### Authenticated Endpoints
```http
Access-Control-Allow-Origin: http://localhost:5173 (EXACT match)
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Credentials: true
```
**MUST use specific origin (not `*`) with credentials**

### Session Cookie Requirements
```javascript
res.cookie('session', token, {
  httpOnly: true,      // Prevent XSS
  secure: true,        // HTTPS only (production)
  sameSite: 'none',    // Allow cross-origin
  maxAge: 86400000,    // 24 hours
});
```

## 📊 API Endpoints

| Endpoint | Method | Credentials | Purpose |
|----------|--------|-------------|---------|
| `/api/v1/auth/nonce` | GET | ❌ false | Get nonce for SIWE |
| `/api/v1/auth/login` | POST | ✅ true | Verify signature, set session |
| `/api/v1/auth/me` | GET | ✅ true | Check session status |
| `/api/v1/auth/logout` | POST | ✅ true | Clear session |
| `/api/v1/account` | GET | ✅ true | Get user account data |

## 🚀 Testing

### 1. Test Nonce (Public)
```bash
curl -X GET 'https://api.prime.testnet.bitfrost.ai/api/v1/auth/nonce' \
  -H 'Origin: http://localhost:5173' \
  -v

# Should return:
# {"nonce":"abc123","expiresAt":"2024-01-20T12:00:00Z"}
```

### 2. Test Login (Authenticated)
```bash
curl -X POST 'https://api.prime.testnet.bitfrost.ai/api/v1/auth/login' \
  -H 'Content-Type: application/json' \
  -H 'Origin: http://localhost:5173' \
  --cookie-jar cookies.txt \
  -d '{"message":"...","signature":"..."}' \
  -v

# Should set cookie in cookies.txt
```

### 3. Test Session (Authenticated)
```bash
curl -X GET 'https://api.prime.testnet.bitfrost.ai/api/v1/auth/me' \
  -H 'Origin: http://localhost:5173' \
  --cookie cookies.txt \
  -v

# Should return:
# {"address":"0x123...","expiresAt":"2024-01-20T12:00:00Z"}
```

## 🔒 Security Features

✅ **HTTP-only cookies** - Session token not accessible via JavaScript  
✅ **Single-use nonces** - Each SIWE message uses unique nonce  
✅ **Message expiration** - SIWE messages expire after 10 minutes  
✅ **Domain validation** - SIWE validates domain and origin  
✅ **Signature verification** - Backend verifies wallet signature  
✅ **Session expiration** - Sessions expire after 24 hours  
✅ **CORS protection** - Specific origins only  

## 📁 Files

### Core Implementation
- `/lib/authApi.ts` - Axios-based authentication API
- `/lib/siweAuthAdapter.ts` - RainbowKit SIWE adapter
- `/hooks/useAuth.ts` - Authentication hook

### Documentation
- `/docs/BACKEND_CORS_REQUIREMENTS.md` - Complete CORS guide for backend team
- `/docs/AXIOS_SENIOR_REFACTOR.md` - Architecture and patterns
- `/docs/AUTH_API_SERVICE.md` - API service documentation
- This file - Integration summary

## 🐛 Debugging

### Frontend Logs
All API calls are logged with:
```
[authApi:public] 📡 Request: GET /api/v1/auth/nonce
[authApi:public] ✅ Response: 200

[authApi:authenticated] 📡 Request: POST /api/v1/auth/login
[authApi:authenticated] ✅ Response: 200
```

### Network Errors
```
[authApi:authenticated] 🌐 Network error: Network Error
💡 Check CORS credentials configuration
💡 Backend should set Access-Control-Allow-Credentials: true
💡 Backend should set Access-Control-Allow-Origin: http://localhost:5173
```

### Browser DevTools
1. **Console** - Check for CORS errors
2. **Network** - Inspect request/response headers
3. **Application → Cookies** - Verify session cookie is set

## ✅ Production Checklist

- [x] Axios instances configured properly
- [x] `withCredentials: false` for nonce
- [x] `withCredentials: true` for authenticated endpoints
- [x] Proper error handling (no silent failures)
- [x] Custom error class with detailed info
- [x] Request/response interceptors
- [x] TypeScript types for all requests/responses
- [x] Comprehensive logging
- [x] No fallback/mock functionality
- [x] Documentation for backend team

## 🎓 For Backend Team

**Read this:**
1. `/docs/BACKEND_CORS_REQUIREMENTS.md` - CORS configuration (CRITICAL)
2. This document - Integration overview
3. `/docs/AXIOS_SENIOR_REFACTOR.md` - Architecture details

**Key Points:**
- Nonce endpoint: `withCredentials: false` (simpler CORS)
- All other endpoints: `withCredentials: true` (requires proper CORS)
- Session cookies must have `sameSite: 'none'` and `secure: true`
- `Access-Control-Allow-Origin` must be exact match (not `*`) for authenticated endpoints

## 🔗 Related

- [RainbowKit SIWE Documentation](https://www.rainbowkit.com/docs/authentication)
- [EIP-4361: Sign-In with Ethereum](https://eips.ethereum.org/EIPS/eip-4361)
- [MDN CORS Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Axios Documentation](https://axios-http.com/docs/intro)
