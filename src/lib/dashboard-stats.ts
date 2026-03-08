// src/lib/dashboard-stats.ts
import type { SupabaseClient } from '@supabase/supabase-js';

export interface FunnelStage {
  count: number;
  value: number;
}

export interface GeoData {
  country: string;
  count: number;
  percentage: number;
}

export interface ProductData {
  product: string;
  count: number;
  avgQuantity: number;
}

export interface MonthlyData {
  month: string;
  count: number;
}

export interface OldestUnread {
  id: string;
  reference_number: string;
  company_name: string;
  hoursWaiting: number;
}

export interface FullDashboardStats {
  // Counts
  total_quotes: number;
  new: number;
  reviewed: number;
  quoted: number;
  converted: number;
  rejected: number;
  quotes_this_month: number;
  quotes_last_month: number;
  last_7_days: number;
  last_30_days: number;
  active_quotes: number;
  conversion_rate: number;
  pipeline_value: number;
  avg_response_hours: number;
  // Complex data
  funnel: {
    new: FunnelStage;
    reviewed: FunnelStage;
    quoted: FunnelStage;
    won: FunnelStage;
    lost: FunnelStage;
  };
  geography: GeoData[];
  products: ProductData[];
  monthlyTrend: MonthlyData[];
  oldestUnread: OldestUnread[];
}

export interface DashboardStatsResult {
  data: FullDashboardStats | null;
  error: string | null;
  durationMs: number;
}

const EMPTY_STATS: FullDashboardStats = {
  total_quotes: 0,
  new: 0,
  reviewed: 0,
  quoted: 0,
  converted: 0,
  rejected: 0,
  quotes_this_month: 0,
  quotes_last_month: 0,
  last_7_days: 0,
  last_30_days: 0,
  active_quotes: 0,
  conversion_rate: 0,
  pipeline_value: 0,
  avg_response_hours: 0,
  funnel: {
    new: { count: 0, value: 0 },
    reviewed: { count: 0, value: 0 },
    quoted: { count: 0, value: 0 },
    won: { count: 0, value: 0 },
    lost: { count: 0, value: 0 },
  },
  geography: [],
  products: [],
  monthlyTrend: [],
  oldestUnread: [],
};

export async function getFullDashboardStats(
  supabase: SupabaseClient
): Promise<DashboardStatsResult> {
  const startTime = performance.now();

  try {
    const { data, error } = await supabase.rpc('get_full_dashboard_stats');

    if (error) throw new Error(`RPC error: ${error.message}`);

    const stats = validateStats(data);

    return {
      data: stats,
      error: null,
      durationMs: Math.round(performance.now() - startTime),
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('[getFullDashboardStats] Failed:', errorMessage);

    return {
      data: EMPTY_STATS,
      error: errorMessage,
      durationMs: Math.round(performance.now() - startTime),
    };
  }
}

function validateStats(raw: unknown): FullDashboardStats {
  if (!raw || typeof raw !== 'object') {
    return EMPTY_STATS;
  }

  const d = raw as Record<string, unknown>;

  return {
    total_quotes: asNumber(d.total_quotes),
    new: asNumber(d.new),
    reviewed: asNumber(d.reviewed),
    quoted: asNumber(d.quoted),
    converted: asNumber(d.converted),
    rejected: asNumber(d.rejected),
    quotes_this_month: asNumber(d.quotes_this_month),
    quotes_last_month: asNumber(d.quotes_last_month),
    last_7_days: asNumber(d.last_7_days),
    last_30_days: asNumber(d.last_30_days),
    active_quotes: asNumber(d.active_quotes),
    conversion_rate: asNumber(d.conversion_rate),
    pipeline_value: asNumber(d.pipeline_value),
    avg_response_hours: asNumber(d.avg_response_hours),
    funnel: asFunnel(d.funnel),
    geography: asGeoArray(d.geography),
    products: asProductArray(d.products),
    monthlyTrend: asMonthlyArray(d.monthlyTrend),
    oldestUnread: asOldestArray(d.oldestUnread),
  };
}

function asNumber(val: unknown): number {
  const num = Number(val);
  return Number.isFinite(num) ? num : 0;
}

function asFunnel(val: unknown): FullDashboardStats['funnel'] {
  const defaultFunnel = EMPTY_STATS.funnel;
  if (!val || typeof val !== 'object') return defaultFunnel;
  
  const f = val as Record<string, unknown>;
  return {
    new: asStage(f.new),
    reviewed: asStage(f.reviewed),
    quoted: asStage(f.quoted),
    won: asStage(f.won),
    lost: asStage(f.lost),
  };
}

function asStage(val: unknown): FunnelStage {
  if (!val || typeof val !== 'object') return { count: 0, value: 0 };
  const s = val as Record<string, unknown>;
  return {
    count: asNumber(s.count),
    value: asNumber(s.value),
  };
}

function asGeoArray(val: unknown): GeoData[] {
  if (!Array.isArray(val)) return [];
  return val.map((item) => ({
    country: String((item as any)?.country || 'Unknown'),
    count: asNumber((item as any)?.count),
    percentage: asNumber((item as any)?.percentage),
  }));
}

function asProductArray(val: unknown): ProductData[] {
  if (!Array.isArray(val)) return [];
  return val.map((item) => ({
    product: String((item as any)?.product || 'Unknown'),
    count: asNumber((item as any)?.count),
    avgQuantity: asNumber((item as any)?.avgQuantity),
  }));
}

function asMonthlyArray(val: unknown): MonthlyData[] {
  if (!Array.isArray(val)) return [];
  return val.map((item) => ({
    month: String((item as any)?.month || ''),
    count: asNumber((item as any)?.count),
  }));
}

function asOldestArray(val: unknown): OldestUnread[] {
  if (!Array.isArray(val)) return [];
  return val.map((item) => ({
    id: String((item as any)?.id || ''),
    reference_number: String((item as any)?.reference_number || ''),
    company_name: String((item as any)?.company_name || 'Unknown'),
    hoursWaiting: asNumber((item as any)?.hoursWaiting),
  }));
}

export { EMPTY_STATS };