# SIWE Backend Implementation Reference

This document provides code examples and guidance for backend developers implementing the SIWE authentication endpoints.

## Required NPM Package

```bash
npm install siwe
```

The `siwe` package handles SIWE message parsing and signature verification.

---

## Endpoint Implementations

### 1. GET `/api/v1/auth/nonce`

Generate and return a unique nonce for SIWE authentication.

```typescript
import { randomBytes } from 'crypto';

// Using Redis for nonce storage (recommended)
import Redis from 'ioredis';
const redis = new Redis();

app.get('/api/v1/auth/nonce', async (req, res) => {
  try {
    // Generate cryptographically secure random nonce
    const nonce = randomBytes(32).toString('hex');
    
    // Set expiration time (10 minutes from now)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    
    // Store nonce in Redis with 10-minute TTL
    await redis.setex(`siwe:nonce:${nonce}`, 600, expiresAt);
    
    res.json({
      nonce,
      expiresAt
    });
  } catch (error) {
    console.error('Error generating nonce:', error);
    res.status(500).json({ error: 'Failed to generate nonce' });
  }
});
```

**Alternative: In-Memory Storage (for development)**

```typescript
// Simple in-memory storage (not recommended for production)
const nonceStore = new Map<string, { expiresAt: Date }>();

app.get('/api/v1/auth/nonce', (req, res) => {
  const nonce = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  
  nonceStore.set(nonce, { expiresAt });
  
  // Cleanup expired nonces
  for (const [key, value] of nonceStore.entries()) {
    if (value.expiresAt < new Date()) {
      nonceStore.delete(key);
    }
  }
  
  res.json({
    nonce,
    expiresAt: expiresAt.toISOString()
  });
});
```

---

### 2. POST `/api/v1/auth/login`

Verify SIWE message and signature, create session.

```typescript
import { SiweMessage } from 'siwe';
import session from 'express-session';

app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const { message, signature } = req.body;
    
    // Parse SIWE message
    const siweMessage = new SiweMessage(message);
    
    // Verify the signature
    const fields = await siweMessage.verify({ signature });
    
    // Validate nonce exists and hasn't been used
    const nonceKey = `siwe:nonce:${siweMessage.nonce}`;
    const nonceExists = await redis.exists(nonceKey);
    
    if (!nonceExists) {
      return res.status(401).json({ 
        error: 'Invalid or expired nonce' 
      });
    }
    
    // Check if nonce has been used
    const nonceUsed = await redis.get(`siwe:used:${siweMessage.nonce}`);
    if (nonceUsed) {
      return res.status(401).json({ 
        error: 'Nonce already used' 
      });
    }
    
    // Validate domain (important for security!)
    const expectedDomain = process.env.NODE_ENV === 'production' 
      ? 'bitfrost.ai'  // Your production domain
      : 'localhost';    // Dev domain
    
    if (siweMessage.domain !== expectedDomain && 
        !siweMessage.domain.includes(expectedDomain)) {
      return res.status(401).json({ 
        error: 'Invalid domain' 
      });
    }
    
    // Mark nonce as used (prevent replay attacks)
    await redis.setex(
      `siwe:used:${siweMessage.nonce}`, 
      600, 
      'used'
    );
    
    // Delete original nonce
    await redis.del(nonceKey);
    
    // Create session
    req.session.address = siweMessage.address.toLowerCase();
    req.session.chainId = siweMessage.chainId;
    req.session.expiresAt = new Date(
      Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    ).toISOString();
    
    // Save session
    await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) reject(err);
        else resolve(true);
      });
    });
    
    res.json({
      success: true,
      address: siweMessage.address
    });
    
  } catch (error) {
    console.error('SIWE verification error:', error);
    res.status(401).json({ 
      error: 'Authentication failed',
      details: error.message 
    });
  }
});
```

**Session Configuration Example:**

```typescript
import session from 'express-session';
import RedisStore from 'connect-redis';

app.use(session({
  store: new RedisStore({ client: redis }),
  secret: process.env.SESSION_SECRET, // Use strong secret!
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,      // Prevent JavaScript access
    secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
    sameSite: 'strict',  // CSRF protection
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));
```

---

### 3. GET `/api/v1/auth/me`

Check if user has active session.

```typescript
app.get('/api/v1/auth/me', (req, res) => {
  // Check if session exists
  if (!req.session.address) {
    return res.status(401).json({ 
      error: 'Not authenticated' 
    });
  }
  
  // Check if session has expired
  if (req.session.expiresAt) {
    const expiresAt = new Date(req.session.expiresAt);
    if (expiresAt < new Date()) {
      req.session.destroy(() => {});
      return res.status(401).json({ 
        error: 'Session expired' 
      });
    }
  }
  
  res.json({
    address: req.session.address,
    expiresAt: req.session.expiresAt
  });
});
```

---

### 4. POST `/api/v1/auth/logout`

Clear session and logout user.

```typescript
app.post('/api/v1/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ 
        error: 'Failed to logout' 
      });
    }
    
    // Clear cookie
    res.clearCookie('connect.sid'); // Default session cookie name
    
    res.json({ 
      success: true 
    });
  });
});
```

---

### 5. GET `/api/v1/account`

Return user account data (authenticated endpoint).

```typescript
// Middleware to require authentication
function requireAuth(req, res, next) {
  if (!req.session.address) {
    return res.status(401).json({ 
      error: 'Authentication required' 
    });
  }
  next();
}

app.get('/api/v1/account', requireAuth, async (req, res) => {
  try {
    const address = req.session.address;
    
    // Fetch account data from database
    const account = await db.accounts.findOne({ 
      address: address 
    });
    
    if (!account) {
      // Create new account if doesn't exist
      account = await db.accounts.create({
        address,
        unlocked: '0',
        locked: '0',
        marginLocked: '0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    res.json({
      account: {
        address: account.address,
        unlocked: account.unlocked.toString(),
        locked: account.locked.toString(),
        marginLocked: account.marginLocked.toString(),
        createdAt: account.createdAt,
        updatedAt: account.updatedAt
      }
    });
    
  } catch (error) {
    console.error('Error fetching account:', error);
    res.status(500).json({ 
      error: 'Failed to fetch account data' 
    });
  }
});
```

---

## CORS Configuration

IMPORTANT: Your backend must allow credentials in CORS.

```typescript
import cors from 'cors';

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://bitfrost.ai', 'https://www.bitfrost.ai']
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true, // CRITICAL: Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

## Environment Variables

```bash
# Session secret (use strong random string!)
SESSION_SECRET=your-super-secret-random-string-here

# Redis connection
REDIS_URL=redis://localhost:6379

# Node environment
NODE_ENV=development  # or production

# Your domain (for SIWE validation)
DOMAIN=bitfrost.ai
```

---

## Complete Express.js Example

```typescript
import express from 'express';
import session from 'express-session';
import RedisStore from 'connect-redis';
import Redis from 'ioredis';
import cors from 'cors';
import { SiweMessage } from 'siwe';
import { randomBytes } from 'crypto';

const app = express();
const redis = new Redis(process.env.REDIS_URL);

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://bitfrost.ai']
    : ['http://localhost:5173'],
  credentials: true
}));

app.use(session({
  store: new RedisStore({ client: redis }),
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Auth middleware
function requireAuth(req, res, next) {
  if (!req.session.address) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

// Routes
app.get('/api/v1/auth/nonce', async (req, res) => {
  const nonce = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  await redis.setex(`siwe:nonce:${nonce}`, 600, expiresAt);
  res.json({ nonce, expiresAt });
});

app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const { message, signature } = req.body;
    const siweMessage = new SiweMessage(message);
    await siweMessage.verify({ signature });
    
    const nonceKey = `siwe:nonce:${siweMessage.nonce}`;
    const nonceExists = await redis.exists(nonceKey);
    if (!nonceExists) {
      return res.status(401).json({ error: 'Invalid nonce' });
    }
    
    await redis.setex(`siwe:used:${siweMessage.nonce}`, 600, 'used');
    await redis.del(nonceKey);
    
    req.session.address = siweMessage.address.toLowerCase();
    req.session.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    
    await new Promise((resolve, reject) => {
      req.session.save((err) => err ? reject(err) : resolve(true));
    });
    
    res.json({ success: true, address: siweMessage.address });
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
});

app.get('/api/v1/auth/me', (req, res) => {
  if (!req.session.address) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json({ 
    address: req.session.address,
    expiresAt: req.session.expiresAt 
  });
});

app.post('/api/v1/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

app.get('/api/v1/account', requireAuth, async (req, res) => {
  // Fetch from your database
  res.json({
    account: {
      address: req.session.address,
      unlocked: '0',
      locked: '0',
      marginLocked: '0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  });
});

const PORT = process.env.PORT || 9093;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

## Testing Your Backend

### Using curl:

```bash
# 1. Get nonce
NONCE_RESPONSE=$(curl -s http://localhost:9093/api/v1/auth/nonce)
echo $NONCE_RESPONSE

# 2. Login (you'll need to generate real SIWE message + signature from frontend)
curl -X POST http://localhost:9093/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "message": "localhost:5173 wants you to sign in...",
    "signature": "0x..."
  }'

# 3. Check session
curl -b cookies.txt http://localhost:9093/api/v1/auth/me

# 4. Get account data
curl -b cookies.txt http://localhost:9093/api/v1/account

# 5. Logout
curl -X POST -b cookies.txt http://localhost:9093/api/v1/auth/logout
```

### Using Postman:

1. Enable "Automatically follow redirects"
2. Enable "Send cookies"
3. Test each endpoint in order
4. Check cookies are being set/sent

---

## Security Checklist

Backend implementation must have:

- [x] Cryptographically secure nonce generation
- [x] Nonce storage with TTL (10 minutes)
- [x] Nonce single-use enforcement (prevent replay attacks)
- [x] SIWE message parsing with `siwe` package
- [x] Signature verification
- [x] Domain validation
- [x] URI validation (optional but recommended)
- [x] HTTP-only cookie flag
- [x] Secure cookie flag (production only)
- [x] SameSite cookie attribute
- [x] CORS credentials allowed
- [x] Session expiration
- [x] Rate limiting on auth endpoints (recommended)
- [x] HTTPS in production
- [x] Strong session secret

---

## Common Issues & Solutions

### Issue: "Cookies not being set"
**Solution:** 
- Check CORS allows credentials: `credentials: true`
- Check session cookie has correct settings
- Verify frontend uses `credentials: 'include'`

### Issue: "Nonce invalid or expired"
**Solution:**
- Check Redis is running
- Verify nonce TTL is set correctly
- Ensure nonce isn't being deleted too early

### Issue: "SIWE verification fails"
**Solution:**
- Use the `siwe` npm package, don't implement yourself
- Check message format matches EIP-4361
- Verify signature is hex string starting with "0x"

### Issue: "Session not persisting"
**Solution:**
- Check session store (Redis) is configured
- Verify `req.session.save()` is called
- Check cookie expiration time

### Issue: "CORS errors"
**Solution:**
- Add your frontend URL to CORS origins
- Ensure `credentials: true` in CORS config
- Check preflight (OPTIONS) requests are handled

---

## Production Deployment

Before deploying to production:

1. **Use HTTPS everywhere**
   - Set `cookie.secure = true`
   - Use SSL/TLS certificates

2. **Use Redis for session storage**
   - Not in-memory storage
   - Configure Redis persistence

3. **Set strong session secret**
   - Use random string (32+ characters)
   - Store in environment variables

4. **Enable rate limiting**
   ```typescript
   import rateLimit from 'express-rate-limit';
   
   const authLimiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 5 // 5 requests per window
   });
   
   app.use('/api/v1/auth/', authLimiter);
   ```

5. **Monitor and log**
   - Log all authentication attempts
   - Monitor for suspicious activity
   - Set up alerts for failures

6. **Regular security updates**
   - Keep `siwe` package updated
   - Update session/Redis packages
   - Review security advisories

---

## References

- SIWE Specification: https://eips.ethereum.org/EIPS/eip-4361
- SIWE Library: https://github.com/spruceid/siwe
- Express Session: https://github.com/expressjs/session
- Connect Redis: https://github.com/tj/connect-redis

---

**Need Help?** Check the frontend implementation in `/lib/siweAuthAdapter.ts` to see how messages are created and sent.
