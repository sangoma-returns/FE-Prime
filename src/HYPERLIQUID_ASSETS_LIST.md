# Complete Hyperliquid Assets List

*Generated: February 9, 2026*

This document provides a comprehensive list of all Hyperliquid trading assets, including both standard perpetual contracts and HIP-3 RWA (Real World Assets).

---

## How to Fetch This Data

### Method 1: Fetch Standard Perpetuals (Mainnet)

```typescript
// Fetch all standard Hyperliquid perpetual contracts
const response = await fetch("https://api.hyperliquid.xyz/info", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ type: "meta" })
});

const data = await response.json();
console.log(data.universe); // Array of all available assets
```

**Expected Response Structure**:
```json
{
  "universe": [
    { "name": "BTC", "szDecimals": 5 },
    { "name": "ETH", "szDecimals": 4 },
    { "name": "SOL", "szDecimals": 2 },
    // ... more assets
  ]
}
```

### Method 2: Fetch HIP-3 DEX Assets (RWA)

```typescript
// Step 1: Get list of available DEXs
const dexsResponse = await fetch("https://api.hyperliquid.xyz/info", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ type: "perpDexs" })
});

const dexs = await dexsResponse.json();
// Returns: [{ name: "xyz", fullName: "XYZ DEX" }, ...]

// Step 2: Get assets for each DEX
for (const dex of dexs) {
  const assetsResponse = await fetch("https://api.hyperliquid.xyz/info", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      type: "metaAndAssetCtxs",
      dex: dex.name  // e.g., "xyz"
    })
  });
  
  const [meta, assetCtxs] = await assetsResponse.json();
  console.log(`${dex.name} assets:`, meta.universe);
}
```

---

## Standard Hyperliquid Perpetuals (Mainnet)

These are the crypto perpetual contracts on Hyperliquid mainnet. The symbol format is just the **base asset name** (e.g., "BTC", "ETH").

### Major Assets (Top 20 by Volume)

| Symbol | Name | Decimals | Note |
|--------|------|----------|------|
| BTC | Bitcoin | 5 | Most liquid |
| ETH | Ethereum | 4 | Second most liquid |
| SOL | Solana | 2 | |
| MATIC | Polygon | 1 | ⚠️ Now "POL" on some exchanges |
| ARB | Arbitrum | 2 | |
| OP | Optimism | 2 | |
| AVAX | Avalanche | 2 | |
| DOGE | Dogecoin | 0 | |
| SHIB | Shiba Inu | 0 | |
| LINK | Chainlink | 2 | |
| UNI | Uniswap | 2 | |
| ATOM | Cosmos | 2 | |
| DOT | Polkadot | 2 | |
| LTC | Litecoin | 2 | |
| BCH | Bitcoin Cash | 2 | |
| XRP | Ripple | 1 | |
| ADA | Cardano | 1 | |
| TRX | Tron | 0 | |
| NEAR | Near Protocol | 2 | |
| RNDR | Render | 2 | |

### Altcoins (50+ more)

*Note: This is a partial list. Use the API to get the complete current list.*

| Symbol | Name | Type |
|--------|------|------|
| AAVE | Aave | DeFi |
| APE | ApeCoin | NFT/Metaverse |
| APT | Aptos | L1 |
| BLUR | Blur | NFT Marketplace |
| COMP | Compound | DeFi |
| CRV | Curve | DeFi |
| DYDX | dYdX | DeFi |
| FIL | Filecoin | Storage |
| FTM | Fantom | L1 |
| GRT | The Graph | Infrastructure |
| ICP | Internet Computer | L1 |
| IMX | Immutable X | L2 |
| INJ | Injective | L1 |
| LDO | Lido | Liquid Staking |
| MEME | Memecoin | Meme |
| MKR | Maker | DeFi |
| PEPE | Pepe | Meme |
| RUNE | THORChain | DeFi |
| SEI | Sei Network | L1 |
| SNX | Synthetix | DeFi |
| STX | Stacks | Bitcoin L2 |
| SUI | Sui | L1 |
| SUSHI | SushiSwap | DeFi |
| WLD | Worldcoin | AI/Identity |
| WOO | WOO Network | DeFi |

**Total Standard Perpetuals**: ~100+ assets (constantly expanding)

---

## HIP-3 DEX Assets (Real World Assets)

These are RWA perpetuals on Hyperliquid-powered DEXs. The symbol format includes the **DEX prefix** (e.g., "xyz:GOLD", "flx:SILVER").

### Known HIP-3 DEXs

1. **XYZ** (`xyz`)
2. **VNTL** (`vntl`)
3. **KM** (`km`)
4. **CASH** (`cash`)
5. **FLX** (`flx`)
6. **HYNA** (`hyna`)

### XYZ DEX Assets (`xyz:`)

Commodities and indices:

| Symbol | Full Name | Asset Class |
|--------|-----------|-------------|
| xyz:GOLD | Gold Futures | Precious Metal |
| xyz:SILVER | Silver Futures | Precious Metal |
| xyz:COPPER | Copper Futures | Industrial Metal |
| xyz:OIL | Crude Oil Futures | Energy |
| xyz:NATGAS | Natural Gas Futures | Energy |
| xyz:SPX | S&P 500 Index | Equity Index |
| xyz:NDX | Nasdaq 100 Index | Equity Index |
| xyz:DXY | US Dollar Index | Currency Index |

### FLX DEX Assets (`flx:`)

Stocks and ETFs:

| Symbol | Full Name | Asset Class |
|--------|-----------|-------------|
| flx:TSLA | Tesla Stock | Tech Stock |
| flx:AAPL | Apple Stock | Tech Stock |
| flx:MSFT | Microsoft Stock | Tech Stock |
| flx:GOOGL | Alphabet Stock | Tech Stock |
| flx:AMZN | Amazon Stock | Tech Stock |
| flx:NVDA | NVIDIA Stock | Tech Stock |
| flx:META | Meta Stock | Tech Stock |
| flx:SPY | SPDR S&P 500 ETF | Equity ETF |
| flx:QQQ | Invesco QQQ ETF | Equity ETF |

### CASH DEX Assets (`cash:`)

Forex pairs:

| Symbol | Full Name | Asset Class |
|--------|-----------|-------------|
| cash:EURUSD | Euro/US Dollar | Forex |
| cash:GBPUSD | British Pound/US Dollar | Forex |
| cash:USDJPY | US Dollar/Japanese Yen | Forex |
| cash:AUDUSD | Australian Dollar/US Dollar | Forex |

### Other DEXs (VNTL, KM, HYNA)

*Assets vary by DEX. Use the API to fetch current offerings.*

---

## Symbol Format Reference

### Standard Hyperliquid Perpetuals
- **API Symbol**: `"BTC"`, `"ETH"`, `"SOL"`
- **Display Name**: BTC-PERP, ETH-PERP, SOL-PERP (add -PERP for UI)
- **Trading Pair**: Against USD (implicit)

### HIP-3 DEX Assets
- **API Symbol**: `"xyz:GOLD"`, `"flx:TSLA"`, `"cash:EURUSD"`
- **Format**: `{dex}:{asset}`
- **Display Name**: Same as API symbol, or add -PERP suffix
- **Example**: `xyz:GOLD` or `xyz:GOLD-PERP`

### When Calling APIs

**For metaAndAssetCtxs (market data)**:
```typescript
// Standard perpetuals (no DEX parameter)
{ type: "metaAndAssetCtxs" }

// HIP-3 assets (with DEX parameter)
{ type: "metaAndAssetCtxs", dex: "xyz" }
```

**For candleSnapshot**:
```typescript
// Standard perpetuals
{ 
  type: "candleSnapshot",
  req: {
    coin: "BTC",
    interval: "1h",
    startTime: timestamp,
    endTime: timestamp
  }
}

// HIP-3 assets
{ 
  type: "candleSnapshot",
  req: {
    coin: "xyz:GOLD",  // Include DEX prefix
    interval: "1h",
    startTime: timestamp,
    endTime: timestamp
  },
  dex: "xyz"  // Also pass DEX parameter
}
```

---

## Complete Asset Fetching Script

Here's a complete script to fetch ALL Hyperliquid assets:

```typescript
async function getAllHyperliquidAssets() {
  const API = "https://api.hyperliquid.xyz/info";
  
  // 1. Fetch standard perpetuals
  const mainnetResponse = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "meta" })
  });
  const mainnetData = await mainnetResponse.json();
  const standardPerps = mainnetData.universe.map((asset: any) => ({
    symbol: asset.name,
    decimals: asset.szDecimals,
    type: "crypto-perp",
    dex: "mainnet"
  }));
  
  // 2. Fetch HIP-3 DEXs
  const dexsResponse = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "perpDexs" })
  });
  const dexs = await dexsResponse.json();
  
  // 3. Fetch assets for each DEX
  const hip3Assets = [];
  for (const dex of dexs) {
    try {
      const assetsResponse = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          type: "metaAndAssetCtxs",
          dex: dex.name
        })
      });
      const [meta, assetCtxs] = await assetsResponse.json();
      
      const dexAssets = meta.universe.map((asset: any) => ({
        symbol: asset.name,  // Already includes "dex:" prefix
        decimals: asset.szDecimals,
        type: "rwa-perp",
        dex: dex.name,
        dexFullName: dex.fullName
      }));
      
      hip3Assets.push(...dexAssets);
    } catch (error) {
      console.error(`Failed to fetch ${dex.name}:`, error);
    }
  }
  
  return {
    standardPerps,
    hip3Assets,
    total: standardPerps.length + hip3Assets.length
  };
}

// Usage
const assets = await getAllHyperliquidAssets();
console.log(`Total standard perpetuals: ${assets.standardPerps.length}`);
console.log(`Total HIP-3 assets: ${assets.hip3Assets.length}`);
console.log(`Grand total: ${assets.total}`);
console.log("\nAll assets:", [...assets.standardPerps, ...assets.hip3Assets]);
```

---

## Common Issues & Solutions

### Issue 1: Asset Not Found
**Problem**: `Asset BTC not found in xyz universe`

**Solution**: BTC is a standard perpetual, not a HIP-3 asset. Don't pass `dex` parameter.

```typescript
// ❌ Wrong
{ type: "metaAndAssetCtxs", dex: "xyz" }  // Looking for BTC in XYZ DEX

// ✅ Correct
{ type: "metaAndAssetCtxs" }  // Fetches standard perpetuals
```

### Issue 2: Symbol Format Confusion
**Problem**: Should I use "BTC", "BTCUSD", or "BTC-PERP"?

**Solution**: 
- **API calls**: Use raw symbol (`"BTC"`, `"xyz:GOLD"`)
- **UI display**: Add `-PERP` suffix (`"BTC-PERP"`, `"xyz:GOLD-PERP"`)

### Issue 3: MATIC vs POL
**Problem**: Polygon rebranded from MATIC to POL

**Solution**: 
- Hyperliquid mainnet: Still uses `"MATIC"`
- Other exchanges (Binance): Use `"POL"` or `"POLUSDT"`
- Map appropriately in your code:
  ```typescript
  const symbol = exchange === 'hyperliquid' ? 'MATIC' : 'POL';
  ```

---

## Asset Count Summary (Approximate)

| Category | Count | Examples |
|----------|-------|----------|
| Standard Perpetuals | ~100+ | BTC, ETH, SOL, DOGE |
| XYZ (Commodities) | ~10+ | GOLD, SILVER, OIL, SPX |
| FLX (Stocks) | ~20+ | TSLA, AAPL, MSFT, NVDA |
| CASH (Forex) | ~10+ | EURUSD, GBPUSD, USDJPY |
| VNTL | ~5+ | Various |
| KM | ~5+ | Various |
| HYNA | ~5+ | Various |
| **TOTAL** | **~155+** | Growing constantly |

---

## API Reference

**Base URL**: `https://api.hyperliquid.xyz/info`

**Available Endpoints**:
- `{ type: "meta" }` - Get standard perpetuals universe
- `{ type: "perpDexs" }` - Get list of HIP-3 DEXs
- `{ type: "metaAndAssetCtxs", dex: "xyz" }` - Get HIP-3 DEX assets
- `{ type: "candleSnapshot", req: {...} }` - Get price candles
- `{ type: "l2Book", coin: "BTC" }` - Get order book
- `{ type: "allMids" }` - Get all mid prices

---

*Note: This list is a snapshot. Hyperliquid frequently adds new assets. Always fetch fresh data from the API for production use.*
