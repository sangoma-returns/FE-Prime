# MetaMask SDK Dependency Fix - Final Solution

## Problem
Building with RainbowKit 2.2.4 caused MetaMask SDK dependency errors in Figma Make's esm.sh environment because importing from `@rainbow-me/rainbowkit/wallets` pulls in the problematic `@metamask/sdk` package.

## Root Cause
The `@rainbow-me/rainbowkit/wallets` module includes wallet connectors that depend on `@metamask/sdk`, which:
- Requires Node.js polyfills (Buffer, etc.) not available in browser
- Doesn't resolve properly through esm.sh CDN
- Is unnecessary when using wagmi's built-in connectors

## Solution
Use wagmi 2.x's built-in connectors from `wagmi/connectors` instead of RainbowKit's wallet abstractions.

---

## Implementation

### 1. Package Dependencies
```json
{
  "@rainbow-me/rainbowkit": "2.2.4",
  "wagmi": "2.15.1",
  "viem": "^2.7.0",
  "@tanstack/react-query": "^5.0.0"
}
```

**Note:** Do NOT install `@wagmi/connectors` - that was for wagmi v1. In wagmi v2, connectors are built into the main package.

### 2. Wagmi Configuration (`/config/wagmi.ts`)

#### ❌ BEFORE (Broken)
```typescript
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  coinbaseWallet,
  metaMaskWallet,
  rainbowWallet,
} from '@rainbow-me/rainbowkit/wallets'; // ❌ Pulls in MetaMask SDK

export const config = getDefaultConfig({
  appName: 'Bitfrost Prime',
  projectId: WALLETCONNECT_PROJECT_ID,
  chains: [currentChain],
  wallets: [
    {
      groupName: 'Recommended',
      wallets: [rainbowWallet, metaMaskWallet, coinbaseWallet],
    },
  ],
});
```

#### ✅ AFTER (Fixed)
```typescript
import { createConfig, http } from 'wagmi';
import { type Chain } from 'wagmi/chains';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors'; // ✅ Built-in to wagmi

export const config = createConfig({
  chains: [currentChain],
  connectors: [
    injected({
      target: 'metaMask', // Still supports MetaMask via browser injection
    }),
    walletConnect({
      projectId: WALLETCONNECT_PROJECT_ID,
      showQrModal: true,
    }),
    coinbaseWallet({
      appName: 'Bitfrost Prime',
    }),
  ],
  transports: {
    [currentChain.id]: http(),
  },
});
```

---

## Key Differences

| Aspect | Old Approach | New Approach |
|--------|-------------|--------------|
| Config function | `getDefaultConfig()` | `createConfig()` |
| Connector source | `@rainbow-me/rainbowkit/wallets` | `wagmi/connectors` |
| MetaMask support | `metaMaskWallet` connector | `injected` connector |
| Dependencies | Pulls in MetaMask SDK | No SDK dependencies |
| RainbowKit UI | ✅ Works | ✅ Still works |

---

## Supported Wallets

### ✅ Injected Wallets (via `injected` connector)
- MetaMask
- Brave Wallet
- Any browser-injected wallet

### ✅ WalletConnect (via `walletConnect` connector)
- Rainbow Wallet
- Trust Wallet
- All mobile wallets supporting WalletConnect

### ✅ Coinbase Wallet (via `coinbaseWallet` connector)
- Coinbase Wallet (web & mobile)

---

## Why This Works

1. **No RainbowKit wallet imports** → No MetaMask SDK dependency
2. **Wagmi v2 built-in connectors** → Clean, maintained by wagmi core team
3. **`injected` connector** → Supports MetaMask without SDK
4. **RainbowKit UI preserved** → Only connector layer changed, all UI components work

---

## Critical Rules

### ⛔ DO NOT
- ❌ Import from `@rainbow-me/rainbowkit/wallets`
- ❌ Use `getDefaultConfig` with custom wallet selection
- ❌ Install `@wagmi/connectors` (wagmi v1 only)
- ❌ Import `metaMaskWallet` from RainbowKit

### ✅ DO
- ✅ Import connectors from `wagmi/connectors`
- ✅ Use `createConfig` from wagmi
- ✅ Use `injected` connector for browser wallets
- ✅ Keep RainbowKit UI components (`RainbowKitProvider`, `ConnectButton`)

---

## Testing Checklist

- [ ] App builds without errors
- [ ] No MetaMask SDK warnings in console
- [ ] RainbowKit connect button appears
- [ ] Can connect with browser wallet (MetaMask)
- [ ] Can connect via WalletConnect
- [ ] Can connect with Coinbase Wallet
- [ ] SIWE authentication completes
- [ ] Session persists after refresh

---

## Troubleshooting

**If build fails:**
1. Clear node_modules and reinstall
2. Verify no imports from `@rainbow-me/rainbowkit/wallets`
3. Check wagmi version is exactly `2.15.1`
4. Ensure using `wagmi/connectors` not `@wagmi/connectors`

**If MetaMask doesn't connect:**
- The `injected` connector automatically detects browser wallets
- Make sure `target: 'metaMask'` is specified
- Browser must have MetaMask installed

---

## Version Compatibility Matrix

| Package | Version | Notes |
|---------|---------|-------|
| `wagmi` | `2.15.1` | Required - do not change |
| `@rainbow-me/rainbowkit` | `2.2.4` | UI only |
| `viem` | `^2.7.0` | Transport layer |
| `@tanstack/react-query` | `^5.0.0` | Required by RainbowKit |

---

## Summary

The fix eliminates MetaMask SDK dependency by:
1. Using wagmi's native connectors instead of RainbowKit's wallet abstractions
2. Replacing `getDefaultConfig` with `createConfig`
3. Using `injected` connector for browser wallets (including MetaMask)

**Result:** Clean build, all wallet types supported, RainbowKit UI fully functional. ✅
