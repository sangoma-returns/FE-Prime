# SIWE Authentication - Quick Reference

## ✅ Implementation Complete

SIWE (Sign-In with Ethereum) authentication has been successfully implemented in Bitfrost using RainbowKit's authentication adapter.

## 🚀 What's Working

### Frontend Implementation
✅ SIWE authentication adapter (`/lib/siweAuthAdapter.ts`)
✅ RainbowKit integration with authentication provider
✅ Zustand auth store with session management
✅ AuthSync component that checks session on mount and monitors wallet connection
✅ User account data fetching after authentication
✅ HTTP-only cookie support with credentials
✅ Automatic session persistence on refresh
✅ Proper logout flow

### Security Features
✅ Single-use nonces from backend
✅ Message expiration (10 minutes)
✅ Domain and URI validation
✅ HTTP-only cookies (XSS protection)
✅ HTTPS enforcement in production
✅ Credentials: 'include' for all auth requests
✅ Replay attack prevention

## 📋 Backend Requirements

Your backend needs to implement these endpoints:

### 1. GET `/api/v1/auth/nonce`
Returns a unique, cryptographically secure nonce that expires in 10 minutes.

```json
Response: {
  "nonce": "uuid-string",
  "expiresAt": "ISO-8601-timestamp"
}
```

### 2. POST `/api/v1/auth/login`
Verifies SIWE message and signature, creates session with HTTP-only cookie.

```json
Request: {
  "message": "SIWE message string",
  "signature": "0x..."
}

Response: {
  "success": true,
  "address": "0x..."
}
```

**Must verify:**
- Signature matches address
- Nonce is valid and unused
- Message hasn't expired
- Domain matches your app
- URI matches your app

**Must do:**
- Set HTTP-only, Secure, SameSite cookie
- Mark nonce as used
- Create user session

### 3. GET `/api/v1/auth/me`
Returns current user if authenticated (checks cookie).

```json
Response: {
  "address": "0x...",
  "expiresAt": "ISO-8601-timestamp"
}
```

### 4. POST `/api/v1/auth/logout`
Clears session and HTTP-only cookie.

```json
Response: {
  "success": true
}
```

### 5. GET `/api/v1/account`
Returns user account data (authenticated endpoint).

```json
Response: {
  "account": {
    "address": "0x...",
    "unlocked": "string",
    "locked": "string",
    "marginLocked": "string",
    "createdAt": "string",
    "updatedAt": "string"
  }
}
```

## 🔐 Security Checklist

Backend must implement:
- [ ] Cryptographically secure nonce generation
- [ ] Nonce storage with 10-minute expiration
- [ ] Nonce single-use enforcement (prevent replay)
- [ ] SIWE message parsing and validation
- [ ] Signature verification
- [ ] Domain and URI validation
- [ ] HTTP-only cookie creation
- [ ] Secure flag on cookies (HTTPS only)
- [ ] SameSite cookie attribute
- [ ] Session storage and management
- [ ] Session expiration

## 🎯 User Flow

1. **User connects wallet** → RainbowKit modal
2. **SIWE prompt** → User signs message with wallet
3. **Authentication** → Backend verifies and creates session
4. **Data fetch** → App fetches user account data
5. **Logged in** → User sees authenticated UI

On page refresh:
- Session cookie sent automatically
- If valid → User stays logged in
- If expired → User must sign in again

## 📦 Files Modified/Created

### Created:
- `/lib/siweAuthAdapter.ts` - SIWE authentication adapter
- `/docs/SIWE_AUTHENTICATION.md` - Comprehensive documentation

### Modified:
- `/App.tsx` - Added RainbowKit authentication provider & AuthSync
- `/stores/authStore.ts` - Added address, status, session management
- `/hooks/useAuth.ts` - Updated to work with SIWE (fetch user data)

## 🧪 Testing

### Manual Testing Steps:

1. **Connect Wallet**
   ```
   - Click "Connect Wallet"
   - Select wallet (MetaMask, etc.)
   - Should see SIWE signature request
   - Sign the message
   - Should be authenticated
   ```

2. **Check Session Persistence**
   ```
   - Refresh page
   - Should still be logged in (no new signature required)
   ```

3. **Disconnect**
   ```
   - Click disconnect
   - Should logout on backend
   - Should clear local state
   ```

4. **Check Security**
   ```
   - Open DevTools → Application → Cookies
   - Verify cookie has HttpOnly flag
   - Try `document.cookie` in console
   - Should NOT see session cookie
   ```

### Browser Console Logs:

When authentication works correctly, you should see:
```
[SIWE] Requesting nonce from backend
[SIWE] Nonce received { expiresAt: "..." }
[SIWE] Creating message { address: "0x...", chainId: 999 }
[SIWE] Message created { domain: "...", uri: "..." }
[SIWE] Verifying signature with backend
[SIWE] Verification successful { address: "0x..." }
[AuthSync] User authenticated via SIWE { address: "0x..." }
[useAuth] Fetching user account data { address: "0x..." }
[useAuth] User account data fetched { hasDeposited: false }
```

## 🐛 Debugging

### Issue: "Nonce request fails"
- Check backend is running
- Verify `API_BASE_URL` in `/constants/app.ts`
- Check CORS headers on backend
- Check Network tab for 404/500 errors

### Issue: "Signature verification fails"
- Backend must parse SIWE message correctly
- Check signature verification logic
- Ensure nonce matches backend-generated nonce
- Verify domain/URI in message

### Issue: "Session doesn't persist"
- Check HTTP-only cookie is being set
- Verify `credentials: 'include'` in fetch calls
- Check cookie SameSite/Secure flags
- Ensure backend returns cookie on login

### Issue: "Cookie not sent to backend"
- Check `withCredentials: true` in axios config
- Check `credentials: 'include'` in fetch calls
- Verify CORS allows credentials
- Check cookie domain/path settings

## 📚 Additional Resources

- Full documentation: `/docs/SIWE_AUTHENTICATION.md`
- EIP-4361 spec: https://eips.ethereum.org/EIPS/eip-4361
- RainbowKit auth docs: https://www.rainbowkit.com/docs/authentication
- SIWE library: https://github.com/spruceid/siwe

## 💡 Tips

1. **Development**: Use browser in HTTP mode for local testing (cookies work on localhost)
2. **Production**: MUST use HTTPS for secure cookies to work
3. **Debugging**: Check Network tab for cookie headers and auth endpoint responses
4. **Nonce Storage**: Use Redis or in-memory cache with TTL for nonces
5. **Rate Limiting**: Add rate limiting to auth endpoints to prevent brute force

## 🎉 Next Steps

1. Test with your backend implementation
2. Verify all security requirements are met
3. Test session persistence and expiration
4. Test on both desktop and mobile wallets
5. Deploy to production with HTTPS

---

**Status**: ✅ Ready for backend integration testing

**Questions?** Check `/docs/SIWE_AUTHENTICATION.md` for detailed documentation.