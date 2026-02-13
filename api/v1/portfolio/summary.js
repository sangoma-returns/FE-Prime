import { readState } from '../../_lib/state.js';
import { fetchBinancePrice } from '../../_lib/prices.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const state = readState();
    const trades = state.trades || [];
    const cashUsd = Number(state.cashUsd || 0);

    const symbols = Array.from(new Set(trades.map(t => t.symbol).filter(Boolean)));
    const priceEntries = await Promise.all(
      symbols.map(async (symbol) => {
        const price = await fetchBinancePrice(symbol);
        return [symbol, price];
      })
    );
    const priceMap = new Map(priceEntries);

    let totalNotional = 0;
    let totalMargin = 0;
    let totalFees = 0;
    let unrealizedPnL = 0;
    let netNotional = 0;

    for (const trade of trades) {
      const currentPrice = priceMap.get(trade.symbol);
      if (!currentPrice) continue;

      const notional = Number(trade.notionalUsd || 0);
      const leverage = Number(trade.leverage || 1);
      const qty = Number(trade.quantityBase || 0);
      const entry = Number(trade.entryPrice || 0);
      const fee = Number(trade.feeUsd || 0);
      const margin = Number(trade.marginUsd || (notional / leverage));

      totalNotional += notional;
      totalMargin += margin;
      totalFees += fee;
      netNotional += trade.side === 'short' ? -notional : notional;

      const pnl = trade.side === 'short'
        ? (entry - currentPrice) * qty
        : (currentPrice - entry) * qty;
      unrealizedPnL += pnl;
    }

    const totalEquity = cashUsd + totalMargin + unrealizedPnL;
    const directionalBiasPercent = totalEquity !== 0
      ? (netNotional / totalEquity) * 100
      : 0;
    const unrealizedPnLPercent = totalEquity !== 0
      ? (unrealizedPnL / totalEquity) * 100
      : 0;

    res.status(200).json({
      success: true,
      data: {
        totalEquity,
        totalEquityChange24h: 0,
        totalEquityChangePercent24h: 0,
        directionalBias: netNotional,
        directionalBiasPercent,
        unrealizedPnL,
        unrealizedPnLPercent,
        currency: 'USDC',
        lockedMargin: totalMargin,
        totalVolume: totalNotional,
        feesPaid: totalFees,
        cashUsd,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'summary_failed', message: 'Failed to compute summary' },
      timestamp: new Date().toISOString(),
    });
  }
}
