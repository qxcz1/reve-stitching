// src/lib/types/sample.ts

export interface SampleRequest {
    id: string;
    reference_number: string;
  
    company_name: string;
    contact_person: string;
    email: string;
    phone: string | null;
    country: string;
    shipping_address: string;
  
    product_type: string;
    fabric_type: string | null;
    gsm: number | null;
    color: string | null;
    size: string | null;
    quantity: number;
    special_requirements: string | null;
  
    linked_quote_id: string | null;
  
    sample_fee: number;
    actual_cost: number | null;
    shipping_cost: number | null;
    is_free_sample: boolean;
  
    shipping_carrier: string | null;
    tracking_number: string | null;
    shipped_at: string | null;
    delivered_at: string | null;
  
    status: SampleStatus;
  
    admin_notes: string | null;
    rejection_reason: string | null;
  
    created_at: string;
    updated_at: string;
  }
  
  export type SampleStatus =
    | 'new'
    | 'approved'
    | 'production'
    | 'shipped'
    | 'delivered'
    | 'converted'
    | 'rejected';
  
  export interface SampleSubmission {
    company_name: string;
    contact_person: string;
    email: string;
    phone?: string;
    country: string;
    shipping_address: string;
    product_type: string;
    fabric_type?: string;
    gsm?: number;
    color?: string;
    size?: string;
    quantity: number;
    special_requirements?: string;
    linked_quote_id?: string;
  }
  
  export interface SampleStatusUpdate {
    status?: SampleStatus;
    shipping_carrier?: string;
    tracking_number?: string;
    shipped_at?: string;
    delivered_at?: string;
    sample_fee?: number;
    actual_cost?: number;
    shipping_cost?: number;
    is_free_sample?: boolean;
    admin_notes?: string;
    rejection_reason?: string;
  }
  
  export const SAMPLE_STATUS_CONFIG: Record<SampleStatus, { label: string; color: string; bg: string; border: string }> = {
    new: { label: 'New', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
    approved: { label: 'Approved', color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200' },
    production: { label: 'In Production', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
    shipped: { label: 'Shipped', color: 'text-cyan-700', bg: 'bg-cyan-50', border: 'border-cyan-200' },
    delivered: { label: 'Delivered', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
    converted: { label: 'Converted', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    rejected: { label: 'Rejected', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
  };
  
  export const PRODUCT_TYPES = [
    { value: 'hoodie', label: 'Hoodie' },
    { value: 'tshirt', label: 'T-Shirt' },
    { value: 'polo', label: 'Polo Shirt' },
    { value: 'joggers', label: 'Joggers' },
    { value: 'sweatshirt', label: 'Sweatshirt' },
  ];
  
  export const FABRIC_TYPES = [
    { value: 'cotton', label: '100% Cotton' },
    { value: 'polyester', label: 'Polyester' },
    { value: 'blend', label: 'Cotton-Poly Blend' },
    { value: 'fleece', label: 'Fleece' },
  ];
  
  export const SIZE_OPTIONS = ['S', 'M', 'L', 'XL', 'XXL', 'Custom'];
  
  export const COUNTRIES = [
    'Afghanistan', 'Albania', 'Algeria', 'Argentina', 'Australia', 'Austria',
    'Bahrain', 'Bangladesh', 'Belgium', 'Brazil', 'Canada', 'Chile', 'China',
    'Colombia', 'Czech Republic', 'Denmark', 'Egypt', 'Finland', 'France',
    'Germany', 'Greece', 'Hong Kong', 'Hungary', 'India', 'Indonesia',
    'Ireland', 'Israel', 'Italy', 'Japan', 'Jordan', 'Kenya', 'Kuwait',
    'Lebanon', 'Malaysia', 'Mexico', 'Morocco', 'Netherlands', 'New Zealand',
    'Nigeria', 'Norway', 'Oman', 'Pakistan', 'Peru', 'Philippines', 'Poland',
    'Portugal', 'Qatar', 'Romania', 'Russia', 'Saudi Arabia', 'Singapore',
    'South Africa', 'South Korea', 'Spain', 'Sri Lanka', 'Sweden', 'Switzerland',
    'Taiwan', 'Thailand', 'Turkey', 'Ukraine', 'United Arab Emirates',
    'United Kingdom', 'United States', 'Vietnam', 'Other'
  ];