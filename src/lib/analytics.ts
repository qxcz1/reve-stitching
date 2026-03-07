import type { SupabaseClient } from '@supabase/supabase-js';

export interface QuoteAnalytics {
  // Key Metrics
  totalQuotes: number;
  quotesThisMonth: number;
  activeQuotes: number;
  pipelineValue: number;
  avgResponseTime: number; // in hours
  conversionRate: number; // percentage

  // Funnel Data
  funnel: {
    new: { count: number; value: number };
    reviewed: { count: number; value: number };
    quoted: { count: number; value: number };
    won: { count: number; value: number };
    lost: { count: number; value: number };
  };

  // Geographic Breakdown
  geography: {
    country: string;
    count: number;
    percentage: number;
  }[];

  // Product Breakdown
  products: {
    product: string;
    count: number;
    avgQuantity: number;
  }[];

  // Monthly Trend
  monthlyTrend: {
    month: string;
    count: number;
  }[];

  // Response Times
  slowestQuotes: {
    id: string;
    reference_number: string;
    company_name: string;
    hoursWaiting: number;
  }[];
}

/**
 * Calculate comprehensive quote analytics
 */
export async function getQuoteAnalytics(
  supabase: SupabaseClient
): Promise<QuoteAnalytics> {
  // Fetch all quotes
  const { data: quotes, error } = await supabase
    .from('quote_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !quotes) {
    console.error('❌ Error fetching quotes:', error);
    return getEmptyAnalytics();
  }

  console.log(`📊 Analyzing ${quotes.length} quotes...`);

  // Calculate date ranges
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  // Filter quotes by date
  const quotesThisMonth = quotes.filter(
    (q) => new Date(q.created_at) >= startOfMonth
  );

  // Active quotes (not closed/rejected)
  const activeQuotes = quotes.filter(
    (q) => q.status !== 'closed' && q.status !== 'rejected' && q.status !== 'lost'
  );

  // Calculate pipeline value (from estimated_price_range)
  const pipelineValue = activeQuotes.reduce((sum, q) => {
    if (!q.estimated_price_range) return sum;
    // Parse "$6,000 - $8,500" format
    const match = q.estimated_price_range.match(/\$?([\d,]+)/);
    if (match) {
      const value = parseInt(match[1].replace(/,/g, ''), 10);
      return sum + value;
    }
    return sum;
  }, 0);

  // Calculate average response time
  const quotesWithResponse = quotes.filter(
    (q) => q.status !== 'new' && q.updated_at && q.created_at
  );
  const totalResponseTime = quotesWithResponse.reduce((sum, q) => {
    const created = new Date(q.created_at).getTime();
    const updated = new Date(q.updated_at).getTime();
    const hours = (updated - created) / (1000 * 60 * 60);
    return sum + hours;
  }, 0);
  const avgResponseTime =
    quotesWithResponse.length > 0
      ? totalResponseTime / quotesWithResponse.length
      : 0;

  // Calculate conversion rate
  const wonQuotes = quotes.filter((q) => q.status === 'won').length;
  const conversionRate =
    quotes.length > 0 ? (wonQuotes / quotes.length) * 100 : 0;

  // Funnel breakdown
  const funnel = {
    new: calculateFunnelStage(quotes, 'new'),
    reviewed: calculateFunnelStage(quotes, 'reviewed'),
    quoted: calculateFunnelStage(quotes, 'quoted'),
    won: calculateFunnelStage(quotes, 'won'),
    lost: calculateFunnelStage(quotes, 'lost'),
  };

  // Geographic breakdown
  const geographyMap = new Map<string, number>();
  quotes.forEach((q) => {
    const country = q.destination || 'Unknown';
    geographyMap.set(country, (geographyMap.get(country) || 0) + 1);
  });
  const geography = Array.from(geographyMap.entries())
    .map(([country, count]) => ({
      country: formatCountryName(country),
      count,
      percentage: (count / quotes.length) * 100,
    }))
    .sort((a, b) => b.count - a.count);

  // Product breakdown
  const productMap = new Map<
    string,
    { count: number; totalQuantity: number }
  >();
  quotes.forEach((q) => {
    const product = q.product_type || 'Unknown';
    const existing = productMap.get(product) || { count: 0, totalQuantity: 0 };
    productMap.set(product, {
      count: existing.count + 1,
      totalQuantity: existing.totalQuantity + (q.quantity || 0),
    });
  });
  const products = Array.from(productMap.entries())
    .map(([product, data]) => ({
      product: formatProductName(product),
      count: data.count,
      avgQuantity: data.count > 0 ? data.totalQuantity / data.count : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Monthly trend (last 6 months)
  const monthlyTrend = calculateMonthlyTrend(quotes, 6);

  // Slowest response quotes (unread, oldest first)
  const slowestQuotes = quotes
    .filter((q) => q.status === 'new')
    .map((q) => {
      const hoursWaiting =
        (now.getTime() - new Date(q.created_at).getTime()) / (1000 * 60 * 60);
      return {
        id: q.id,
        reference_number: q.reference_number,
        company_name: q.company_name,
        hoursWaiting: Math.round(hoursWaiting),
      };
    })
    .sort((a, b) => b.hoursWaiting - a.hoursWaiting)
    .slice(0, 5);

  return {
    totalQuotes: quotes.length,
    quotesThisMonth: quotesThisMonth.length,
    activeQuotes: activeQuotes.length,
    pipelineValue,
    avgResponseTime: Math.round(avgResponseTime),
    conversionRate: Math.round(conversionRate * 10) / 10,
    funnel,
    geography,
    products,
    monthlyTrend,
    slowestQuotes,
  };
}

/**
 * Calculate funnel stage stats
 */
function calculateFunnelStage(
  quotes: any[],
  status: string
): { count: number; value: number } {
  const stageQuotes = quotes.filter((q) => q.status === status);
  const value = stageQuotes.reduce((sum, q) => {
    if (!q.estimated_price_range) return sum;
    const match = q.estimated_price_range.match(/\$?([\d,]+)/);
    if (match) {
      return sum + parseInt(match[1].replace(/,/g, ''), 10);
    }
    return sum;
  }, 0);

  return { count: stageQuotes.length, value };
}

/**
 * Calculate monthly trend
 */
function calculateMonthlyTrend(
  quotes: any[],
  months: number
): { month: string; count: number }[] {
  const now = new Date();
  const trend: { month: string; count: number }[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const count = quotes.filter((q) => {
      const created = new Date(q.created_at);
      return created >= monthStart && created <= monthEnd;
    }).length;

    trend.push({
      month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      count,
    });
  }

  return trend;
}

/**
 * Format country name for display
 */
function formatCountryName(country: string): string {
  const map: Record<string, string> = {
    uk: 'United Kingdom',
    us: 'United States',
    eu: 'European Union',
    ca: 'Canada',
    au: 'Australia',
  };
  return map[country.toLowerCase()] || country.toUpperCase();
}

/**
 * Format product name for display
 */
function formatProductName(product: string): string {
  return product
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get empty analytics (fallback)
 */
function getEmptyAnalytics(): QuoteAnalytics {
  return {
    totalQuotes: 0,
    quotesThisMonth: 0,
    activeQuotes: 0,
    pipelineValue: 0,
    avgResponseTime: 0,
    conversionRate: 0,
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
    slowestQuotes: [],
  };
}