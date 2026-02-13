export async function fetchBinancePrice(symbol) {
  const pair = `${symbol.toUpperCase()}USDT`;
  const url = `https://api.binance.com/api/v3/ticker/price?symbol=${pair}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Binance price fetch failed for ${pair}`);
  }
  const data = await res.json();
  return Number(data.price);
}

export function normalizeSymbol(rawSymbol) {
  if (!rawSymbol) return '';
  // Accept "BTC", "BTC:PERP-USD", "BTC-PERP-USDC"
  const trimmed = rawSymbol.toUpperCase();
  if (trimmed.includes(':')) {
    return trimmed.split(':')[0];
  }
  if (trimmed.includes('-')) {
    return trimmed.split('-')[0];
  }
  return trimmed;
}

