import { readState, writeState } from '../../_lib/state.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { amountUsd } = req.body || {};
    const amount = Number(amountUsd || 0);
    if (!amount || amount <= 0) {
      res.status(400).json({ error: 'Invalid amount' });
      return;
    }

    const state = readState();
    state.cashUsd = Number(state.cashUsd || 0) + amount;
    writeState(state);
    res.status(200).json({
      success: true,
      data: { ok: true, cashUsd: state.cashUsd },
      timestamp: new Date().toISOString(),
    });
  } catch {
    res.status(500).json({
      success: false,
      error: { code: 'deposit_failed', message: 'Failed to deposit' },
      timestamp: new Date().toISOString(),
    });
  }
}
