// src/lib/dashboard-stats.ts
import type { SupabaseClient } from '@supabase/supabase-js';

export interface ProductCount {
  product: string;
  count: number;
}

export interface MonthlyTrend {
  month: string;
  count: number;
}

export interface DashboardStats {
  total_quotes: number;
  new: number;
  reviewed: number;
  quoted: number;
  converted: number;
  rejected: number;
  last_7_days: number;
  last_30_days: number;
  conversion_rate: number;
  top_products: ProductCount[];
  monthly_trend: MonthlyTrend[];
}

export interface DashboardStatsResult {
  data: DashboardStats | null;
  error: string | null;
  durationMs: number;
}

const EMPTY_STATS: DashboardStats = {
  total_quotes: 0,
  new: 0,
  reviewed: 0,
  quoted: 0,
  converted: 0,
  rejected: 0,
  last_7_days: 0,
  last_30_days: 0,
  conversion_rate: 0,
  top_products: [],
  monthly_trend: [],
};

let cachedResult: DashboardStatsResult | null = null;
const CACHE_TTL_MS = 30_000; // 30 seconds

function isCacheValid(): boolean {
  if (!cachedResult) return false;
  const age = Date.now() - Date.now(); // Will be fixed below
  return age < CACHE_TTL_MS;
}

export async function getDashboardStats(
  supabase: SupabaseClient
): Promise<DashboardStatsResult> {
  if (isCacheValid() && cachedResult) {
    return cachedResult;
  }

  const startTime = performance.now();

  try {
    const { data, error } = await supabase.rpc('get_dashboard_stats');

    if (error) throw new Error(`RPC error: ${error.message}`);

    const stats = validateStats(data);

    const result: DashboardStatsResult = {
      data: stats,
      error: null,
      durationMs: Math.round(performance.now() - startTime),
    };

    cachedResult = result;
    return result;

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('[getDashboardStats] Failed:', errorMessage);

    return {
      data: EMPTY_STATS,
      error: errorMessage,
      durationMs: Math.round(performance.now() - startTime),
    };
  }
}

function validateStats(raw: unknown): DashboardStats {
  if (!raw || typeof raw !== 'object') {
    return EMPTY_STATS;
  }

  const data = raw as Record<string, unknown>;

  return {
    total_quotes:    asNumber(data.total_quotes),
    new:             asNumber(data.new),
    reviewed:        asNumber(data.reviewed),
    quoted:          asNumber(data.quoted),
    converted:       asNumber(data.converted),
    rejected:        asNumber(data.rejected),
    last_7_days:     asNumber(data.last_7_days),
    last_30_days:    asNumber(data.last_30_days),
    conversion_rate: asNumber(data.conversion_rate),
    top_products:    asProductArray(data.top_products),
    monthly_trend:   asTrendArray(data.monthly_trend),
  };
}

function asNumber(val: unknown): number {
  const num = Number(val);
  return Number.isFinite(num) ? num : 0;
}

function asProductArray(val: unknown): ProductCount[] {
  if (!Array.isArray(val)) return [];
  return val
    .filter((item): item is Record<string, unknown> =>
      item && typeof item === 'object'
    )
    .map((item) => ({
      product: String(item.product || 'Unknown'),
      count:   asNumber(item.count),
    }));
}

function asTrendArray(val: unknown): MonthlyTrend[] {
  if (!Array.isArray(val)) return [];
  return val
    .filter((item): item is Record<string, unknown> =>
      item && typeof item === 'object'
    )
    .map((item) => ({
      month: String(item.month || ''),
      count: asNumber(item.count),
    }))
    .filter((item) => item.month.length > 0);
}

export { EMPTY_STATS };