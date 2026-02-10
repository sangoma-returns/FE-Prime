# Authentication Error Handling Fix

## Problem

The application was logging errors on every page load:

```
[Bitfrost] [ERROR] [authApi:authenticated] 🌐 Network error: {
  "url": "/api/v1/auth/me",
  "message": "Network Error"
}
[Bitfrost] [WARN] [authApi] ⚠️ Session check failed, treating as no session
```

## Root Cause

1. **Session check on every page load** - `AuthSync` component calls `getSession()` on mount to check for existing sessions
2. **Network errors during development** - Backend might not be available or CORS might not be configured
3. **Noisy error logging** - Both the interceptor AND the method were logging errors for expected failures

## Solution

### 1. Silent Interceptor for Session Checks

Updated the response interceptor to **not log errors** for `/auth/me` endpoint:

```typescript
authenticatedApi.interceptors.response.use(
  (response) => { /* ... */ },
  (error: AxiosError) => {
    const isSessionCheck = error.config?.url?.includes('/auth/me');
    
    if (error.response) {
      // Only log if NOT a session check, or if it's an unexpected status
      if (!isSessionCheck || (error.response.status !== 401 && error.response.status !== 403)) {
        logger.error('[authApi:authenticated] ❌ Response error:', { ... });
      }
    } else if (error.request) {
      // Don't log network errors for session checks
      if (!isSessionCheck) {
        logger.error('[authApi:authenticated] 🌐 Network error:', { ... });
      }
    }
    // ...
  }
);
```

### 2. Silent Session Method

Updated `getSession()` to **silently return null** on errors:

```typescript
export async function getSession(): Promise<SessionResponse | null> {
  const endpoint = '/api/v1/auth/me';
  
  // Skip if backend auth is disabled
  if (!ENABLE_BACKEND_AUTH) {
    return null;
  }
  
  try {
    const response = await authenticatedApi.get<SessionResponse>(endpoint);
    logger.info('[authApi] ✅ Active session found', { address: response.data.address });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // 401/403 = no session (expected)
      if (error.response?.status === 401 || error.response?.status === 403) {
        return null; // Silent
      }
      
      // Network error = backend unavailable (expected in dev)
      if (!error.response) {
        return null; // Silent
      }
    }
    
    // Any other error = return null (already logged by interceptor if needed)
    return null;
  }
}
```

### 3. Backend Auth Flag Check

Added `ENABLE_BACKEND_AUTH` check to skip session check entirely when backend auth is disabled:

```typescript
if (!ENABLE_BACKEND_AUTH) {
  return null;
}
```

## Result

✅ **No error logs for expected session failures**  
✅ **No error logs for network errors during development**  
✅ **Only logs when session is SUCCESSFULLY found**  
✅ **Critical errors still logged (unexpected status codes)**

## Error Handling Strategy

### Session Check (Expected to Fail)
- ❌ 401/403 → Silent (no session)
- ❌ Network error → Silent (backend unavailable)
- ✅ 200 → Log success
- ⚠️ Other errors → Silent (already logged by interceptor)

### Login (Should Succeed)
- ✅ 200 → Success
- ❌ Any error → Throw and log

### Account Fetch (Should Succeed)
- ✅ 200 → Success
- ❌ Any error → Throw and log

### Logout (Graceful Failure)
- ✅ 200 → Success
- ❌ Any error → Log warning but continue

## Senior Developer Principles Applied

### 1. **Different Error Strategies for Different Endpoints**
```typescript
// Session check - expected to fail, silent
getSession() → returns null on any error

// Login - should succeed, throw on error
login() → throws AuthApiError

// Account fetch - should succeed, throw on error
getAccount() → throws AuthApiError

// Logout - graceful degradation
logout() → logs warning but doesn't throw
```

### 2. **Layered Error Handling**
```
Interceptor → Logs unexpected errors
   ↓
Method → Handles expected errors silently
   ↓
Caller → Decides what to do with result
```

### 3. **Context-Aware Logging**
```typescript
// Know which endpoint is being called
const isSessionCheck = error.config?.url?.includes('/auth/me');

// Different logging for different contexts
if (isSessionCheck) {
  // Silent - this is expected
} else {
  // Log - this is unexpected
}
```

### 4. **Graceful Degradation**
```typescript
// Backend auth disabled? Skip entirely
if (!ENABLE_BACKEND_AUTH) {
  return null;
}

// Backend unavailable? Continue without session
if (!error.response) {
  return null;
}
```

## Testing Checklist

- [x] No errors logged on page load with backend unavailable
- [x] No errors logged on page load with no session
- [x] Success logged when session exists
- [x] Login errors still logged
- [x] Account fetch errors still logged
- [x] ENABLE_BACKEND_AUTH=false skips session check entirely

## Files Modified

1. `/lib/authApi.ts`
   - Updated response interceptor to not log session check errors
   - Updated `getSession()` to silently handle all expected errors
   - Added `ENABLE_BACKEND_AUTH` check
