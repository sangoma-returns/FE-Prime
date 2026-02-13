import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
const statePath = path.join(dataDir, 'state.json');

const defaultState = {
  cashUsd: 0,
  trades: [],
};

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

export function readState() {
  try {
    if (!fs.existsSync(statePath)) {
      return { ...defaultState };
    }
    const raw = fs.readFileSync(statePath, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      cashUsd: typeof parsed.cashUsd === 'number' ? parsed.cashUsd : 0,
      trades: Array.isArray(parsed.trades) ? parsed.trades : [],
    };
  } catch {
    return { ...defaultState };
  }
}

export function writeState(state) {
  ensureDataDir();
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
}

export function resetState() {
  writeState({ ...defaultState });
}

