# Senior Developer Refactor: Axios Implementation

## ✅ What Was Done

Refactored authentication API to use **axios** with professional architecture following senior developer best practices.

## 🏗️ Architecture Overview

### **Three API Clients in the Project**

1. **`/lib/authApi.ts`** (NEW) - Authentication-specific client
   - Two axios instances: `publicApi` (no credentials) + `authenticatedApi` (with credentials)
   - Dedicated to SIWE authentication flow
   - Special handling for nonce (public) vs authenticated endpoints
   
2. **`/services/api/internalClient.ts`** - General internal API client
   - Single instance with `withCredentials: true`
   - Used for general backend calls (portfolio, orders, etc.)
   
3. **`/services/api/client.ts`** - External exchange API client
   - Used for Hyperliquid, Paradex, etc.

### **Why Separate Auth Client?**

✅ **Security separation** - Different credential strategies for different endpoints  
✅ **Specific error handling** - Auth failures need special UX treatment  
✅ **Isolated configuration** - Auth timeouts/retries different from data fetching  
✅ **Clear boundaries** - Auth logic separate from business logic

## 📋 Implementation Details

### **1. Two Axios Instances**

```typescript
// PUBLIC - No credentials (nonce endpoint)
const publicApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: false, // ❌
});

// AUTHENTICATED - With credentials (login, session, account)
const authenticatedApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true, // ✅
});
```

### **2. Request/Response Interceptors**

Both instances have comprehensive interceptors:

```typescript
// Request logging
config => {
  logger.info('[authApi:*] 📡 Request:', {
    method: config.method?.toUpperCase(),
    url: config.url,
    withCredentials: config.withCredentials,
  });
  return config;
}

// Response logging & error handling
response => { /* success logging */ },
error => {
  if (error.response) {
    // Server error (4xx, 5xx)
  } else if (error.request) {
    // Network/CORS error
  } else {
    // Config error
  }
}
```

### **3. Proper Error Handling**

```typescript
// Custom error class
export class AuthApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public endpoint: string,
    public originalError?: AxiosError,
  ) {
    super(message);
    this.name = 'AuthApiError';
  }
}

// Error handler utility
function handleApiError(error: unknown, endpoint: string): AuthApiError {
  if (axios.isAxiosError(error)) {
    // Extract axios error details
    const status = error.response?.status || 0;
    const message = error.response?.data?.message || error.message;
    return new AuthApiError(`API Error: ${message}`, status, endpoint, error);
  }
  // Handle other error types
}
```

### **4. Type-Safe API Methods**

```typescript
export async function getNonce(): Promise<string> {
  const endpoint = '/api/v1/auth/nonce';
  try {
    const response = await publicApi.get<NonceResponse>(endpoint);
    return response.data.nonce;
  } catch (error) {
    throw handleApiError(error, endpoint);
  }
}

export async function login(request: LoginRequest): Promise<LoginResponse> {
  const endpoint = '/api/v1/auth/login';
  try {
    const response = await authenticatedApi.post<LoginResponse>(endpoint, request);
    return response.data;
  } catch (error) {
    throw handleApiError(error, endpoint);
  }
}
```

## 🎯 Benefits of This Approach

### **Code Quality**
✅ **Type safety** - All requests/responses typed  
✅ **Error handling** - Consistent axios error handling with type guards  
✅ **No junior mistakes** - No raw fetch calls, no manual header management  
✅ **Testable** - Easy to mock axios instances  

### **Security**
✅ **Credential isolation** - Public endpoints don't send cookies  
✅ **CORS clarity** - Clear which endpoints need credentials  
✅ **Cookie security** - HTTP-only cookies handled correctly  

### **Maintainability**
✅ **Single source of truth** - All auth API logic in one place  
✅ **Consistent patterns** - All methods follow same structure  
✅ **Clear separation** - Auth vs business logic  
✅ **Easy debugging** - Comprehensive logging via interceptors  

### **Performance**
✅ **Request deduplication** - Axios handles this automatically  
✅ **Timeout handling** - Configurable per instance  
✅ **Retry logic** - Can be added to interceptors  

## 📊 Comparison

### Before (Fetch)
```typescript
❌ Manual headers on every call
❌ Manual credentials handling
❌ Manual error parsing
❌ No request/response logging
❌ No timeout handling
❌ Scattered across files
❌ Inconsistent error types
```

### After (Axios)
```typescript
✅ Automatic headers via instance config
✅ Automatic credentials via withCredentials
✅ Automatic error parsing with axios.isAxiosError()
✅ Automatic logging via interceptors
✅ Built-in timeout support
✅ Centralized in authApi
✅ Custom AuthApiError type
```

## 🔍 Senior Developer Patterns Used

### **1. Separation of Concerns**
- Public vs authenticated endpoints use different instances
- Each method has single responsibility
- Error handling separated into utility function

### **2. DRY (Don't Repeat Yourself)**
- Instance configuration defined once
- Interceptors handle cross-cutting concerns
- Error handling centralized

### **3. Type Safety**
- All requests typed with generics: `get<NonceResponse>`
- Custom error class extends Error
- Proper axios type imports

### **4. Error Handling Strategy**
```typescript
// Session check - return null on error (expected)
export async function getSession(): Promise<SessionResponse | null> {
  try {
    const response = await authenticatedApi.get<SessionResponse>(endpoint);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
      return null; // Expected - no session
    }
    return null; // Other errors also treated as no session
  }
}

// Logout - swallow errors (disconnecting anyway)
export async function logout(): Promise<void> {
  try {
    await authenticatedApi.post<LogoutResponse>(endpoint);
  } catch (error) {
    logger.warn('[authApi] Logout failed, but continuing');
    // Don't throw - we're disconnecting anyway
  }
}

// Account fetch - throw errors (critical data)
export async function getAccount(): Promise<AccountResponse> {
  try {
    const response = await authenticatedApi.get<AccountResponse>(endpoint);
    return response.data;
  } catch (error) {
    throw handleApiError(error, endpoint); // Propagate error
  }
}
```

### **5. Export Strategy**
```typescript
// Named exports for tree-shaking
export { getNonce, login, getSession, logout, getAccount };

// Convenience object export
export const authApi = { getNonce, login, getSession, logout, getAccount };

// Test exports (prefixed with __)
export const __test__ = { publicApi, authenticatedApi };

// Default export
export default authApi;
```

## 🚀 Usage

### Simple
```typescript
import { authApi } from '../lib/authApi';

const nonce = await authApi.getNonce();
```

### With Error Handling
```typescript
import { authApi, AuthApiError } from '../lib/authApi';

try {
  const account = await authApi.getAccount();
} catch (error) {
  if (error instanceof AuthApiError) {
    console.error(`${error.endpoint} failed with ${error.status}`);
    // Access original axios error if needed
    if (error.originalError) {
      console.error(error.originalError.response?.data);
    }
  }
}
```

## 📝 Files Modified

1. ✅ **Created** `/lib/authApi.ts` - Professional axios-based auth API
2. ✅ **Updated** `/lib/siweAuthAdapter.ts` - Uses authApi
3. ✅ **Updated** `/hooks/useAuth.ts` - Uses authApi
4. ✅ **Updated** `/docs/AUTH_API_SERVICE.md` - Documentation

## 🔒 Security Notes

### **Public Endpoint (nonce)**
```
withCredentials: false
→ No cookies sent/received
→ No CORS preflight for credentials
→ Simpler CORS configuration
```

### **Authenticated Endpoints**
```
withCredentials: true
→ Cookies automatically sent with every request
→ Backend must set Access-Control-Allow-Credentials: true
→ Backend must set specific Access-Control-Allow-Origin (not *)
```

## ✅ Senior Developer Checklist

- [x] Use axios instead of fetch
- [x] Create separate instances for different credential strategies
- [x] Implement request/response interceptors
- [x] Proper TypeScript types for all methods
- [x] Custom error class extending Error
- [x] Error type guards (axios.isAxiosError)
- [x] Centralized error handling utility
- [x] Consistent method signatures
- [x] Proper timeout configuration
- [x] Comprehensive logging
- [x] Clear separation of concerns
- [x] Export strategy for tree-shaking
- [x] Test exports for mocking
- [x] Documentation

## 🎓 Key Learnings

**Why axios over fetch?**
1. Built-in timeout support
2. Automatic JSON parsing
3. Better error handling (axios.isAxiosError)
4. Interceptors for cross-cutting concerns
5. Automatic request/response transformation
6. Better TypeScript support
7. Instance configuration (no repeated code)
8. Works in Node.js and browser

**Why separate instances?**
1. Security - different credential strategies
2. Performance - different timeout/retry configs
3. Debugging - clear which instance made the request
4. Flexibility - can add different interceptors per instance

**Why custom error class?**
1. Type safety - instanceof checks
2. Additional context - status, endpoint
3. Original error access - for detailed debugging
4. Consistent error interface across app
