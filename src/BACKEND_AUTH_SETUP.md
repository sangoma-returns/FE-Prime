# Backend Authentication Setup Guide

Backend authentication is now **ENABLED** by default in Bitfrost.

## ✅ What Changed

1. **Default Behavior**: Backend auth is now enabled by default (previously disabled)
2. **Environment Configuration**: Created `.env.local` with `VITE_ENABLE_BACKEND_AUTH=true`
3. **Graceful Degradation**: App still works if backend is unavailable, but will show warnings in console

## 🔧 Configuration Files

### `.env.local` (Your Local Settings)
- Created with backend auth enabled
- **DO NOT COMMIT** this file (added to `.gitignore`)
- Customize for your local development environment

### `.env.example` (Template)
- Reference template for all environment variables
- Safe to commit to git
- Copy this to `.env.local` and fill in your values

## 🚀 How It Works

### When Backend is Available
1. User clicks "Connect Wallet" button
2. RainbowKit shows wallet selection
3. After wallet connects, SIWE authentication flow starts:
   - Frontend requests nonce from `${API_BASE_URL}/api/v1/auth/nonce`
   - User signs SIWE message with their wallet
   - Frontend sends signature to `${API_BASE_URL}/api/v1/auth/login`
   - Backend validates and creates session with HTTP-only cookie
4. User is authenticated and can access protected features

### When Backend is Unavailable
1. User clicks "Connect Wallet" button
2. Wallet connects normally
3. SIWE authentication is skipped (graceful degradation)
4. User can still use wallet-based features
5. Console shows warning: "Backend unavailable, SIWE authentication disabled"

## 🎛️ Configuration Options

### Enable Backend Auth (Default)
```env
# .env.local
VITE_ENABLE_BACKEND_AUTH=true
```

### Disable Backend Auth
```env
# .env.local
VITE_ENABLE_BACKEND_AUTH=false
```

### Not Set (Defaults to Enabled)
```env
# .env.local
# VITE_ENABLE_BACKEND_AUTH not set → defaults to true
```

## 📍 Backend Endpoints

The app expects these endpoints to be available:

```
GET  ${API_BASE_URL}/api/v1/auth/nonce   - Get authentication nonce
POST ${API_BASE_URL}/api/v1/auth/login   - Verify signature & login
GET  ${API_BASE_URL}/api/v1/auth/me      - Check session status
POST ${API_BASE_URL}/api/v1/auth/logout  - Logout & clear session
```

**Current API_BASE_URL**:
- Testnet: `http://prime.testnet.bitfrost.ai:9093`
- Mainnet: `http://prime.mainnet.bitfrost.ai:9093`

## 🔍 Testing Authentication

### 1. Test with Backend Running
```bash
# Make sure backend is running at API_BASE_URL
# Connect wallet → Should show signature request
```

### 2. Test without Backend
```bash
# Stop backend or set VITE_ENABLE_BACKEND_AUTH=false
# Connect wallet → Should skip authentication gracefully
```

### 3. Check Console Logs
```
[SIWE] Requesting nonce from backend
[SIWE] Nonce received
[SIWE] Creating message
[SIWE] Verifying signature with backend
[SIWE] Verification successful
```

## 🐛 Troubleshooting

### Issue: "Failed to get nonce" errors
**Solution**: Check if backend is running and `API_BASE_URL` is correct

### Issue: Authentication succeeds but session not persisted
**Solution**: Ensure backend CORS is configured to allow credentials from your frontend origin

### Issue: Want to disable auth temporarily
**Solution**: Set `VITE_ENABLE_BACKEND_AUTH=false` in `.env.local`

### Issue: Changes not taking effect
**Solution**: Restart dev server after changing `.env.local`

## 📚 Related Documentation

- `/docs/SIWE_AUTHENTICATION.md` - Complete SIWE implementation guide
- `/docs/SIWE_BACKEND_REFERENCE.md` - Backend implementation reference
- `/docs/AUTHENTICATION.md` - General authentication documentation
- `/lib/siweAuthAdapter.ts` - Frontend SIWE adapter implementation

## 🔐 Security Features

✅ **HTTP-only cookies** - Prevents XSS attacks  
✅ **Single-use nonces** - Prevents replay attacks  
✅ **Message expiration** - 10-minute window  
✅ **Domain validation** - Prevents phishing  
✅ **Graceful degradation** - No user-facing errors if backend down  

## 📝 Next Steps

1. ✅ Backend auth is now enabled
2. ✅ Environment files created
3. ⚠️ Make sure your backend is running
4. ⚠️ Update `VITE_WALLETCONNECT_PROJECT_ID` with your real project ID for production
5. ⚠️ Configure CORS on backend to allow your frontend origin with credentials

---

**Status**: Backend authentication is **ENABLED** and ready to use! 🎉
