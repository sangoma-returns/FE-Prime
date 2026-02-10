# Backend CORS Configuration Requirements

## Overview

The Bitfrost frontend uses **axios** with different credential strategies for authentication endpoints. This document outlines the exact CORS configuration required for the backend.

## Frontend Configuration

### Public Endpoint (No Credentials)
```typescript
// Nonce endpoint - withCredentials: false
GET /api/v1/auth/nonce
```

### Authenticated Endpoints (With Credentials)
```typescript
// Authentication endpoints - withCredentials: true
POST /api/v1/auth/login
GET /api/v1/auth/me
POST /api/v1/auth/logout
GET /api/v1/account
```

## Required CORS Headers

### For Nonce Endpoint (Public)

**Endpoint:** `GET /api/v1/auth/nonce`

**CORS Headers:**
```http
Access-Control-Allow-Origin: * (or specific origin)
Access-Control-Allow-Methods: GET, OPTIONS
Access-Control-Allow-Headers: Content-Type, Accept
```

**Note:** `Access-Control-Allow-Credentials` is **NOT** needed since `withCredentials: false`.

### For Authenticated Endpoints

**Endpoints:**
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/logout`
- `GET /api/v1/account`

**CORS Headers:**
```http
Access-Control-Allow-Origin: <SPECIFIC_ORIGIN> (e.g., https://app.bitfrost.ai or http://localhost:5173)
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Accept
Access-Control-Allow-Credentials: true
```

**CRITICAL:**
- `Access-Control-Allow-Origin` **MUST** be a specific origin (not `*`) when using credentials
- `Access-Control-Allow-Credentials: true` **MUST** be present
- Backend **MUST** set `SameSite=None; Secure` on cookies (for cross-origin)

## Example Backend Configuration

### Express.js (Node.js)

```javascript
import cors from 'cors';

const allowedOrigins = [
  'https://app.bitfrost.ai',
  'http://localhost:5173',
  'http://localhost:3000',
];

// Public endpoints (no credentials)
app.use('/api/v1/auth/nonce', cors({
  origin: allowedOrigins,
  credentials: false, // No credentials needed
}));

// Authenticated endpoints (with credentials)
app.use([
  '/api/v1/auth/login',
  '/api/v1/auth/me',
  '/api/v1/auth/logout',
  '/api/v1/account'
], cors({
  origin: allowedOrigins,
  credentials: true, // Credentials required
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept'],
}));

// Set session cookie with proper flags
app.post('/api/v1/auth/login', (req, res) => {
  // ... verify SIWE signature ...
  
  res.cookie('session', sessionToken, {
    httpOnly: true,
    secure: true, // HTTPS only
    sameSite: 'none', // Allow cross-origin
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  });
  
  res.json({ success: true, address: userAddress });
});
```

### Go (Gin Framework)

```go
import (
    "github.com/gin-contrib/cors"
    "github.com/gin-gonic/gin"
)

func setupCORS(r *gin.Engine) {
    allowedOrigins := []string{
        "https://app.bitfrost.ai",
        "http://localhost:5173",
    }
    
    // Public nonce endpoint (no credentials)
    r.GET("/api/v1/auth/nonce", func(c *gin.Context) {
        c.Header("Access-Control-Allow-Origin", getAllowedOrigin(c, allowedOrigins))
        c.Header("Access-Control-Allow-Methods", "GET, OPTIONS")
        // No Access-Control-Allow-Credentials header
        // ... handler logic ...
    })
    
    // Authenticated endpoints (with credentials)
    authGroup := r.Group("/api/v1")
    authGroup.Use(cors.New(cors.Config{
        AllowOrigins:     allowedOrigins,
        AllowMethods:     []string{"GET", "POST", "OPTIONS"},
        AllowHeaders:     []string{"Content-Type", "Accept"},
        AllowCredentials: true,
    }))
    
    authGroup.POST("/auth/login", loginHandler)
    authGroup.GET("/auth/me", sessionHandler)
    authGroup.POST("/auth/logout", logoutHandler)
    authGroup.GET("/account", accountHandler)
}

func loginHandler(c *gin.Context) {
    // ... verify SIWE signature ...
    
    c.SetCookie(
        "session",
        sessionToken,
        3600*24,        // maxAge
        "/",            // path
        "",             // domain (let browser decide)
        true,           // secure
        true,           // httpOnly
        "None",         // sameSite
    )
    
    c.JSON(200, gin.H{"success": true, "address": address})
}
```

### Python (FastAPI)

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

app = FastAPI()

allowed_origins = [
    "https://app.bitfrost.ai",
    "http://localhost:5173",
]

# Global CORS for authenticated endpoints
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Accept"],
)

# Nonce endpoint (override to disable credentials)
@app.get("/api/v1/auth/nonce")
async def get_nonce(response: Response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    # No credentials header
    return {"nonce": generate_nonce()}

@app.post("/api/v1/auth/login")
async def login(request: Request, response: Response):
    # ... verify SIWE signature ...
    
    response.set_cookie(
        key="session",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=86400,
    )
    
    return {"success": True, "address": address}
```

## Testing CORS Configuration

### Test Nonce Endpoint (Public)

```bash
# Should work without credentials
curl -X GET 'https://api.prime.testnet.bitfrost.ai/api/v1/auth/nonce' \
  -H 'Origin: http://localhost:5173' \
  -v

# Expected headers:
# Access-Control-Allow-Origin: * (or specific origin)
# NO Access-Control-Allow-Credentials header
```

### Test Login Endpoint (Authenticated)

```bash
# Preflight request
curl -X OPTIONS 'https://api.prime.testnet.bitfrost.ai/api/v1/auth/login' \
  -H 'Origin: http://localhost:5173' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: Content-Type' \
  -v

# Expected headers:
# Access-Control-Allow-Origin: http://localhost:5173 (exact match)
# Access-Control-Allow-Credentials: true
# Access-Control-Allow-Methods: GET, POST, OPTIONS
```

## Common Issues

### Issue 1: CORS Error on Nonce
**Error:** `Access to fetch at 'https://api.../nonce' from origin 'http://localhost:5173' has been blocked by CORS`

**Solution:**
- Ensure backend sets `Access-Control-Allow-Origin` header
- For public nonce endpoint, can use `*` or specific origin
- No need for credentials header on nonce endpoint

### Issue 2: CORS Error on Login
**Error:** `The value of the 'Access-Control-Allow-Credentials' header in the response is '' which must be 'true'`

**Solution:**
- Set `Access-Control-Allow-Credentials: true` on authenticated endpoints
- Set `Access-Control-Allow-Origin` to **specific origin** (not `*`)
- Example: `Access-Control-Allow-Origin: http://localhost:5173`

### Issue 3: Cookies Not Being Sent
**Error:** Network request succeeds but cookies aren't sent on subsequent requests

**Solution:**
- Ensure frontend uses `withCredentials: true` (already configured)
- Ensure backend sets `SameSite=None` and `Secure=true` on cookies
- Ensure backend sets `Access-Control-Allow-Credentials: true`
- Ensure backend's `Access-Control-Allow-Origin` matches frontend origin exactly

### Issue 4: Session Cookie Not Set After Login
**Error:** Login succeeds but `/auth/me` returns 401

**Solution:**
- Check that backend sets cookie with correct flags:
  - `httpOnly: true`
  - `secure: true` (requires HTTPS in production)
  - `sameSite: 'none'` (for cross-origin)
  - `path: '/'`
- Check browser dev tools → Application → Cookies
- Verify cookie is being set and not blocked

## Security Considerations

### Production Setup

1. **Use specific origins** - Never use `*` with credentials in production
2. **HTTPS only** - Set `secure: true` on cookies (requires HTTPS)
3. **HttpOnly cookies** - Prevents XSS attacks
4. **SameSite=None** - Required for cross-origin cookies
5. **Short expiration** - Session cookies should expire (e.g., 24 hours)

### Development Setup

1. **Local development** - Can use `http://localhost:5173`
2. **Test credentials** - Can temporarily disable `secure` flag for local HTTP
3. **CORS logging** - Enable verbose CORS logs to debug issues

## Frontend URLs

### Production
```
Origin: https://app.bitfrost.ai
```

### Staging
```
Origin: https://staging.bitfrost.ai
```

### Development
```
Origin: http://localhost:5173
Origin: http://localhost:3000
```

## Backend URLs

### Mainnet
```
API: https://api.prime.mainnet.bitfrost.ai
```

### Testnet
```
API: https://api.prime.testnet.bitfrost.ai
```

## Debugging Checklist

When debugging CORS issues:

- [ ] Check browser console for CORS errors
- [ ] Check Network tab → Headers for CORS headers
- [ ] Verify `Access-Control-Allow-Origin` matches frontend origin exactly
- [ ] Verify `Access-Control-Allow-Credentials: true` on authenticated endpoints
- [ ] Verify cookies are being set (Application → Cookies)
- [ ] Verify cookies have correct flags (httpOnly, secure, sameSite)
- [ ] Test OPTIONS preflight request manually
- [ ] Check backend logs for CORS configuration
- [ ] Verify frontend is using correct `withCredentials` setting

## Contact

If backend team needs clarification on any CORS requirements, refer to:
- `/lib/authApi.ts` - Frontend axios configuration
- `/docs/AXIOS_SENIOR_REFACTOR.md` - Architecture documentation
- This document - CORS requirements
