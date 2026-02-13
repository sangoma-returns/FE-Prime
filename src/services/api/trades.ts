import { post } from './client';

export interface CreateTradePayload {
  symbol: string;
  side: 'buy' | 'sell';
  notionalUsd: number;
  leverage: number;
  entryPrice: number;
}

export async function createTrade(payload: CreateTradePayload): Promise<{ trade: any }> {
  return post<{ trade: any }>('/api/v1/trades', payload);
}

