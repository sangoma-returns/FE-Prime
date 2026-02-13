import { readState, writeState } from '../../_lib/state.js';
import { normalizeSymbol } from '../../_lib/prices.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { symbol, side, notionalUsd, leverage, entryPrice } = req.body || {};

    if (!symbol || !side || !notionalUsd || !leverage || !entryPrice) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const normalizedSymbol = normalizeSymbol(symbol);
    const notional = Number(notionalUsd);
    const lev = Number(leverage);
    const price = Number(entryPrice);
    const feeUsd = notional * 0.0001; // 0.01% fee
    const marginUsd = notional / lev;

    const state = readState();
    const trade = {
      id: `trade_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      symbol: normalizedSymbol,
      side: side === 'sell' ? 'short' : 'long',
      notionalUsd: notional,
      leverage: lev,
      entryPrice: price,
      feeUsd,
      marginUsd,
      quantityBase: notional / price,
    };

    state.trades.push(trade);
    state.cashUsd = Number(state.cashUsd || 0) - marginUsd - feeUsd;

    writeState(state);

    res.status(200).json({
      success: true,
      data: { trade },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'trade_store_failed', message: 'Failed to store trade' },
      timestamp: new Date().toISOString(),
    });
  }
}
