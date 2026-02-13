import { resetState } from '../../_lib/state.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    resetState();
    res.status(200).json({
      success: true,
      data: { ok: true },
      timestamp: new Date().toISOString(),
    });
  } catch {
    res.status(500).json({
      success: false,
      error: { code: 'reset_failed', message: 'Failed to reset account' },
      timestamp: new Date().toISOString(),
    });
  }
}

