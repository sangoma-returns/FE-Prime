# 🚀 Backend Authentication Quick Start

## TL;DR

Backend authentication is **ENABLED**. Your app will use SIWE (Sign-In with Ethereum) to authenticate users.

---

## ✅ What You Need to Know

### 1. Current Status
- ✅ Backend auth: **ENABLED**
- 📡 API: `http://prime.testnet.bitfrost.ai:9093`
- 🔐 Method: SIWE (Sign-In with Ethereum)
- 🍪 Sessions: HTTP-only cookies

### 2. User Experience
```
User clicks "Connect Wallet"
  ↓
Wallet connection popup
  ↓
✨ NEW: Signature request appears
  ↓
User signs message
  ↓
✅ Authenticated
```

### 3. If Backend is Down
- No errors shown to users
- App works in wallet-only mode
- Console shows warning message

---

## 🎛️ Quick Toggle

### Disable Auth (for development)
```bash
# Add to .env.local
echo "VITE_ENABLE_BACKEND_AUTH=false" >> .env.local

# Restart dev server
npm run dev
```

### Enable Auth (production-ready)
```bash
# Add to .env.local
echo "VITE_ENABLE_BACKEND_AUTH=true" >> .env.local

# Restart dev server
npm run dev
```

---

## 🧪 Quick Test

### Test with Backend Running
1. Open app
2. Open browser console (F12)
3. Look for: `🔐 Backend authentication is ENABLED`
4. Click "Connect Wallet"
5. Sign the message when prompted
6. Look for: `[SIWE] Verification successful`

### Test without Backend
1. Set `VITE_ENABLE_BACKEND_AUTH=false` or stop backend
2. Restart app
3. Click "Connect Wallet"
4. No signature request appears
5. Look for: `Backend unavailable, SIWE authentication disabled`

---

## 📂 Key Files

```
/.env.local          ← Your config (VITE_ENABLE_BACKEND_AUTH=true)
/.env.example        ← Template
/constants/app.ts    ← ENABLE_BACKEND_AUTH constant
/lib/siweAuthAdapter.ts  ← SIWE logic
/App.tsx             ← Startup logging
```

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Failed to get nonce" errors | Check if backend is running |
| No signature request | Set `VITE_ENABLE_BACKEND_AUTH=true` |
| Changes not working | Restart dev server |
| Want to disable auth | Set `VITE_ENABLE_BACKEND_AUTH=false` |

---

## 📚 More Info

- **Full Setup Guide:** `/BACKEND_AUTH_SETUP.md`
- **What Changed:** `/BACKEND_AUTH_ENABLED.md`
- **Auth Docs:** `/docs/AUTHENTICATION.md`
- **SIWE Details:** `/docs/SIWE_AUTHENTICATION.md`

---

**Status:** ✅ Ready to use!

**Default:** Auth enabled  
**Backend:** `http://prime.testnet.bitfrost.ai:9093`  
**Toggle:** `.env.local` → `VITE_ENABLE_BACKEND_AUTH=true/false`
