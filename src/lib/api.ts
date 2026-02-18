// API URL Configuration
// Development: http://127.0.0.1:8000/api
// Production:  https://api.nexttrip.asia/api
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.nexttrip.asia/api';

// Cloudflare Images URL helper
const CLOUDFLARE_ACCOUNT_HASH = 'yixdo-GXTcyjkoSkBzfBcA';

/**
 * แปลง image path จาก database เป็น Cloudflare Images URL
 * @param imagePath - path จาก database เช่น "upload/travel-type/logo03112023-18535011.jpeg"
 * @param folder - folder ใน Cloudflare เช่น "transports"
 * @returns URL เช่น "https://imagedelivery.net/yixdo-GXTcyjkoSkBzfBcA/transports/logo03112023-18535011/public"
 */
export function getCloudflareImageUrl(imagePath: string | null | undefined, folder: string = 'transports'): string | null {
  if (!imagePath) return null;
  
  // ดึงชื่อไฟล์จาก path และตัด extension
  const fileName = imagePath.split('/').pop()?.replace(/\.[^/.]+$/, '') || '';
  if (!fileName) return null;
  
  return `https://imagedelivery.net/${CLOUDFLARE_ACCOUNT_HASH}/${folder}/${fileName}/public`;
}

/**
 * แปลง ISO2 country code เป็น flag emoji
 * @param iso2 - ISO 3166-1 alpha-2 code เช่น "JP", "TH"
 * @returns Flag emoji เช่น "🇯🇵", "🇹🇭"
 */
export function getFlagEmoji(iso2: string): string {
  if (!iso2 || iso2.length !== 2) return '';
  const codePoints = iso2
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// Types
export interface Wholesaler {
  id: number;
  code: string;
  name: string;
  logo_url: string | null;
  website: string | null;
  is_active: boolean;
  notes: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  tax_id: string | null;
  company_name_th: string | null;
  company_name_en: string | null;
  branch_code: string | null;
  branch_name: string | null;
  address: string | null;
  phone: string | null;
  fax: string | null;
  tours_count?: number;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Transport {
  id: number;
  code: string;
  code1: string | null;
  name: string;
  type: 'airline' | 'bus' | 'van' | 'boat';
  image: string | null;
  status: 'on' | 'off';
  created_at: string;
  updated_at: string;
}

export const TRANSPORT_TYPES: Record<string, string> = {
  airline: 'สายการบิน',
  bus: 'รถบัส',
  van: 'รถตู้',
  boat: 'เรือ',
};

export interface Country {
  id: number;
  iso2: string;
  iso3: string;
  name_en: string;
  name_th: string | null;
  slug: string;
  region: string | null;
  flag_emoji: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const COUNTRY_REGIONS: Record<string, string> = {
  'Asia': 'เอเชีย',
  'Europe': 'ยุโรป',
  'Africa': 'แอฟริกา',
  'North America': 'อเมริกาเหนือ',
  'South America': 'อเมริกาใต้',
  'Oceania': 'โอเชียเนีย',
  'Middle East': 'ตะวันออกกลาง',
};

export interface City {
  id: number;
  name_en: string;
  name_th: string | null;
  slug: string;
  country_id: number;
  country?: {
    id: number;
    iso2: string;
    name_en: string;
    name_th: string | null;
  };
  description: string | null;
  is_popular: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CountryWithCities {
  id: number;
  iso2: string;
  iso3: string;
  name_en: string;
  name_th: string | null;
  region: string | null;
  is_active: boolean;
  cities_count: number;
  popular_count: number;
}

export interface Promotion {
  id: number;
  name: string;
  code: string | null;
  description: string | null;
  type: 'discount_amount' | 'discount_percent' | 'free_gift' | 'installment' | 'special';
  discount_value: string | null;
  is_active: boolean;
  sort_order: number;
  banner_url: string | null;
  cloudflare_id: string | null;
  link_url: string | null;
  start_date: string | null;
  end_date: string | null;
  badge_text: string | null;
  badge_color: string | null;
  created_at: string;
  updated_at: string;
}

export interface TourTabCondition {
  type: string;
  value: string | number | boolean | (string | number)[];
}

export interface TourTab {
  id: number;
  name: string;
  slug: string;
  description: string | null | undefined;
  icon: string | null | undefined;
  badge_text: string | null | undefined;
  badge_color: string | null | undefined;
  display_modes: ('tab' | 'badge' | 'period' | 'promotion')[];
  badge_icon: string | null | undefined;
  badge_expires_at: string | null | undefined;
  conditions: TourTabCondition[] | null | undefined;
  display_limit: number;
  sort_by: 'popular' | 'price_asc' | 'price_desc' | 'newest' | 'departure_date';
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TourTabConditionOptions {
  condition_types: Record<string, string>;
  sort_options: Record<string, string>;
  display_modes: Record<string, string>;
  countries: Array<{ id: number; name_th: string; name_en: string; iso2: string }>;
  regions: Record<string, string>;
  wholesalers: Array<{ id: number; name: string; code: string }>;
  tour_types: Record<string, string>;
}

// ===================== Recommended Tours Types =====================

export interface RecommendedTourSection {
  id: number;
  name: string;
  description: string | null;
  conditions: TourTabCondition[] | null;
  display_limit: number;
  sort_by: 'popular' | 'price_asc' | 'price_desc' | 'newest' | 'departure_date';
  sort_order: number;
  weight: number;
  schedule_start: string | null;
  schedule_end: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecommendedTourSettings {
  id: number;
  display_mode: 'ordered' | 'random' | 'weighted_random' | 'schedule';
  title: string;
  subtitle: string | null;
  is_active: boolean;
  cache_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface RecommendedTourConditionOptions {
  condition_types: Record<string, string>;
  sort_options: Record<string, string>;
  display_modes: Record<string, string>;
  countries: Array<{ id: number; name_th: string; name_en: string; iso2: string }>;
  regions: Record<string, string>;
  wholesalers: Array<{ id: number; name: string; code: string }>;
  tour_types: Record<string, string>;
}

export interface GalleryImage {
  id: number;
  cloudflare_id: string | null;
  url: string;
  thumbnail_url: string | null;
  filename: string;
  alt: string | null;
  caption: string | null;
  country_id: number | null;
  city_id: number | null;
  country?: {
    id: number;
    iso2: string;
    name_en: string;
    name_th: string | null;
  };
  city?: {
    id: number;
    name_en: string;
    name_th: string | null;
  };
  tags: string[];
  width: number;
  height: number;
  file_size: number | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  total_cities?: number; // สำหรับ cities API
}

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
  meta?: PaginationMeta;
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = typeof window !== 'undefined' 
    ? localStorage.getItem('access_token') 
    : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
      throw new ApiError(
        data.message || 'Request failed',
        response.status,
        data.errors
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Preserve AbortError so callers can detect cancelled requests
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }
    throw new ApiError('Network error', 0);
  }
}

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (name: string, email: string, password: string, password_confirmation: string) =>
    apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, password_confirmation }),
    }),

  logout: () =>
    apiRequest('/auth/logout', { method: 'POST' }),

  me: () =>
    apiRequest('/auth/me'),
};

// Wholesalers API
export const wholesalersApi = {
  list: (params?: Record<string, string>) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value);
      });
    }
    
    return apiRequest<Wholesaler[]>(`/wholesalers?${searchParams.toString()}`);
  },

  get: (id: number) =>
    apiRequest<Wholesaler>(`/wholesalers/${id}`),

  create: (data: any) =>
    apiRequest('/wholesalers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: any) =>
    apiRequest(`/wholesalers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    apiRequest(`/wholesalers/${id}`, { method: 'DELETE' }),

  toggleActive: (id: number) =>
    apiRequest(`/wholesalers/${id}/toggle-active`, { method: 'PATCH' }),
};

// Users API
export const usersApi = {
  list: (params?: { page?: number; per_page?: number; search?: string; role?: string; is_active?: boolean }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.per_page) searchParams.append('per_page', params.per_page.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.role) searchParams.append('role', params.role);
    if (params?.is_active !== undefined) searchParams.append('is_active', params.is_active.toString());
    
    return apiRequest(`/users?${searchParams.toString()}`);
  },

  get: (id: number) =>
    apiRequest(`/users/${id}`),

  create: (data: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    role: string;
    is_active?: boolean;
  }) =>
    apiRequest('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: {
    name?: string;
    email?: string;
    password?: string;
    password_confirmation?: string;
    role?: string;
    is_active?: boolean;
  }) =>
    apiRequest(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    apiRequest(`/users/${id}`, { method: 'DELETE' }),
};

// Web Members API (สมาชิกหน้าเว็บ - แยกจาก Users ซึ่งเป็นผู้ใช้ backend)
export interface WebMember {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  line_id: string | null;
  avatar: string | null;
  birth_date: string | null;
  gender: 'male' | 'female' | 'other' | null;
  email_verified: boolean;
  email_verified_at: string | null;
  phone_verified: boolean;
  phone_verified_at: string | null;
  consent_terms: boolean;
  consent_privacy: boolean;
  consent_marketing: boolean;
  consent_at: string | null;
  status: 'active' | 'inactive' | 'suspended';
  failed_login_attempts: number;
  locked_until: string | null;
  last_login_at: string | null;
  last_login_ip: string | null;
  created_at: string;
  updated_at: string;
}

export interface WebMemberStatistics {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  verified: number;
  unverified: number;
  new_this_month: number;
  new_today: number;
}

export const webMembersApi = {
  list: (params?: { 
    page?: number; 
    per_page?: number; 
    search?: string; 
    status?: string;
    verified?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.per_page) searchParams.append('per_page', params.per_page.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.verified) searchParams.append('verified', params.verified);
    
    return apiRequest<{
      data: WebMember[];
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    }>(`/web-members?${searchParams.toString()}`);
  },

  get: (id: number) =>
    apiRequest<WebMember>(`/web-members/${id}`),

  statistics: () =>
    apiRequest<WebMemberStatistics>('/web-members/statistics'),

  updateStatus: (id: number, status: 'active' | 'inactive' | 'suspended') =>
    apiRequest<WebMember>(`/web-members/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  resetPassword: (id: number, password: string, password_confirmation: string) =>
    apiRequest(`/web-members/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ password, password_confirmation }),
    }),

  unlock: (id: number) =>
    apiRequest<WebMember>(`/web-members/${id}/unlock`, { method: 'POST' }),

  delete: (id: number) =>
    apiRequest(`/web-members/${id}`, { method: 'DELETE' }),

  export: (params?: { status?: string; verified?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.verified) searchParams.append('verified', params.verified);
    
    return apiRequest(`/web-members/export?${searchParams.toString()}`);
  },
};

// Transports API
export const transportsApi = {
  list: (params?: Record<string, string>) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value);
      });
    }
    return apiRequest<Transport[]>(`/transports?${searchParams.toString()}`);
  },

  get: (id: number) =>
    apiRequest<Transport>(`/transports/${id}`),

  create: (data: Partial<Transport>) =>
    apiRequest<Transport>('/transports', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<Transport>) =>
    apiRequest<Transport>(`/transports/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    apiRequest(`/transports/${id}`, { method: 'DELETE' }),

  toggleStatus: (id: number) =>
    apiRequest<Transport>(`/transports/${id}/toggle-status`, { method: 'PATCH' }),

  getTypes: () =>
    apiRequest<Record<string, string>>('/transports/types'),
};

// Countries API
export const countriesApi = {
  list: (params?: Record<string, string>) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value);
      });
    }
    return apiRequest<Country[]>(`/countries?${searchParams.toString()}`);
  },

  get: (id: number) =>
    apiRequest<Country>(`/countries/${id}`),

  create: (data: Partial<Country>) =>
    apiRequest<Country>('/countries', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<Country>) =>
    apiRequest<Country>(`/countries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    apiRequest(`/countries/${id}`, { method: 'DELETE' }),

  toggleStatus: (id: number) =>
    apiRequest<Country>(`/countries/${id}/toggle-status`, { method: 'PATCH' }),

  getRegions: () =>
    apiRequest<Record<string, string>>('/countries/regions'),
};

// Cities API
export const citiesApi = {
  list: (params?: Record<string, string>) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value);
      });
    }
    return apiRequest<City[]>(`/cities?${searchParams.toString()}`);
  },

  get: (id: number) =>
    apiRequest<City>(`/cities/${id}`),

  create: (data: Partial<City>) =>
    apiRequest<City>('/cities', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<City>) =>
    apiRequest<City>(`/cities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    apiRequest(`/cities/${id}`, { method: 'DELETE' }),

  toggleStatus: (id: number) =>
    apiRequest<City>(`/cities/${id}/toggle-status`, { method: 'PATCH' }),

  togglePopular: (id: number) =>
    apiRequest<City>(`/cities/${id}/toggle-popular`, { method: 'PATCH' }),

  getCountries: () =>
    apiRequest<Array<{ id: number; iso2: string; name_en: string; name_th: string | null }>>('/cities/countries'),

  getCountriesWithCities: (params?: Record<string, string>) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value);
      });
    }
    return apiRequest<CountryWithCities[]>(`/cities/countries-with-cities?${searchParams.toString()}`);
  },
};

export { ApiError };

// =====================
// TOUR TYPES & API
// =====================

export interface TourCountry {
  id: number;
  iso2: string;
  name_en: string;
  name_th: string | null;
  pivot?: {
    is_primary: boolean;
    sort_order: number;
    days_in_country: number | null;
  };
}

export interface TourLocation {
  id: number;
  tour_id: number;
  name: string;
  name_en: string | null;
  sort_order: number;
}

export interface TourGallery {
  id: number;
  tour_id: number;
  url: string;
  thumbnail_url: string | null;
  alt: string | null;
  sort_order: number;
}

export interface TourTransport {
  id: number;
  tour_id: number;
  transport_code: string;
  transport_name: string;
  flight_no: string | null;
  route_from: string;
  route_to: string;
  depart_time: string | null;
  arrive_time: string | null;
  transport_type: 'outbound' | 'inbound' | 'domestic';
  day_no: number;
  transport?: {
    id: number;
    code: string;
    name: string;
    type?: string;
    image?: string;
  };
}

// TourItinerary interface ย้ายไปอยู่ด้านล่างใกล้กับ itinerariesApi

export interface Period {
  id: number;
  tour_id: number;
  period_code: string;
  start_date: string;
  end_date: string;
  capacity: number;
  booked: number;
  available: number;
  status: 'open' | 'closed' | 'sold_out' | 'cancelled';
  is_visible: boolean;
  sale_status: 'available' | 'booking' | 'sold_out';
  offer?: Offer;
}

export interface Offer {
  id: number;
  period_id: number;
  currency: string;
  price_adult: string;
  discount_adult: string;
  price_child: string | null;
  discount_child_bed: string;
  price_child_nobed: string | null;
  discount_child_nobed: string;
  price_infant: string | null;
  price_single: string | null;
  discount_single: string;
  deposit: string | null;
  cancellation_policy: string | null;
  promo_name: string | null;
  promo_start_date: string | null;
  promo_end_date: string | null;
  promo_quota: number | null;
  promo_used: number;
  promotion_id: number | null;
  promotion?: Promotion;
  promotions?: OfferPromotion[];
}

export interface OfferPromotion {
  id: number;
  offer_id: number;
  promo_code: string;
  name: string;
  type: 'discount_percent' | 'discount_amount' | 'free_pax' | 'upgrade';
  value: string;
  is_active: boolean;
}

export interface Tour {
  id: number;
  wholesaler_id: number;
  external_id: string | null;
  tour_code: string;
  wholesaler_tour_code: string | null;
  title: string;
  tour_type: 'join' | 'incentive' | 'collective';
  primary_country_id: number | null;
  region: string | null;
  sub_region: string | null;
  duration_days: number;
  duration_nights: number;
  highlights: string[] | null;
  shopping_highlights: string[] | null;
  food_highlights: string[] | null;
  special_highlights: string[] | null;
  hotel_star: number | null;
  hotel_star_min: number | null;
  hotel_star_max: number | null;
  inclusions: string | null;
  exclusions: string | null;
  conditions: string | null;
  slug: string;
  meta_title: string | null;
  meta_description: string | null;
  keywords: string[] | null;
  hashtags: string[] | null;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  pdf_url: string | null;
  themes: string[] | null;
  suitable_for: string[] | null;
  departure_airports: string[] | null;
  min_price: string | null;
  display_price: string | null;
  discount_amount: string | null;
  discount_label: string | null;
  max_price: string | null;
  next_departure_date: string | null;
  total_departures: number;
  available_seats: number;
  has_promotion: boolean;
  badge: string | null;
  popularity_score: number;
  sort_order: number;
  status: 'draft' | 'active' | 'inactive';
  // Sync fields
  data_source: 'api' | 'manual' | null;
  last_synced_at: string | null;
  sync_status: string | null;
  sync_locked: boolean;
  max_discount_percent: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  primary_country?: TourCountry;
  countries?: TourCountry[];
  cities?: City[];
  wholesaler?: { id: number; name: string };
  locations?: TourLocation[];
  gallery?: TourGallery[];
  transports?: TourTransport[];
  itineraries?: TourItinerary[];
  periods?: Period[];
}

export const TOUR_THEMES: Record<string, string> = {
  'SHOPPING': 'ช้อปปิ้ง',
  'CULTURE': 'วัฒนธรรม',
  'TEMPLE': 'ไหว้พระ',
  'NATURE': 'ธรรมชาติ',
  'BEACH': 'ทะเล',
  'ADVENTURE': 'ผจญภัย',
  'HONEYMOON': 'ฮันนีมูน',
  'FAMILY': 'ครอบครัว',
  'PREMIUM': 'พรีเมียม',
  'BUDGET': 'ประหยัด',
};

export const TOUR_TYPES: Record<string, string> = {
  'join': 'Join Tour',
  'incentive': 'Incentive',
  'collective': 'Collective',
};

export const TOUR_SUITABLE_FOR: Record<string, string> = {
  'FAMILY': 'ครอบครัว',
  'COUPLE': 'คู่รัก',
  'GROUP': 'กรุ๊ปทัวร์',
  'SOLO': 'เดี่ยว',
  'SENIOR': 'ผู้สูงอายุ',
  'KIDS': 'เด็ก',
};

export const TOUR_BADGES: Record<string, string> = {
  'HOT': 'ขายดี',
  'NEW': 'ใหม่',
  'BEST_SELLER': 'ยอดนิยม',
  'PROMOTION': 'โปรโมชั่น',
  'LIMITED': 'จำนวนจำกัด',
};

export const TOUR_STATUS: Record<string, string> = {
  'draft': 'แบบร่าง',
  'active': 'เปิดใช้งาน',
  'inactive': 'ปิดใช้งาน',
};

export const PERIOD_STATUS: Record<string, string> = {
  'open': 'เปิดขาย',
  'closed': 'ปิดการขาย',
  'sold_out': 'เต็ม',
  'cancelled': 'ยกเลิก',
};

export const SALE_STATUS: Record<string, string> = {
  'available': 'ไลน์',
  'booking': 'จอง',
  'sold_out': 'เต็ม',
};

export interface TourStatistics {
  total: number;
  by_status: Record<string, number>;
  by_region: Record<string, number>;
  with_promotion: number;
}

export interface TourCounts {
  total: number;
  by_data_source: {
    api: number;
    manual: number;
  };
  by_status: {
    active: number;
    draft: number;
    inactive: number;
  };
}

// Tours API
export const toursApi = {
  list: (params?: Record<string, string>, signal?: AbortSignal) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value);
      });
    }
    return apiRequest<Tour[]>(`/tours?${searchParams.toString()}`, { signal });
  },

  get: (id: number) =>
    apiRequest<Tour>(`/tours/${id}`),

  create: (data: Partial<Tour> & { country_ids?: number[] }) =>
    apiRequest<Tour>('/tours', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<Tour> & { country_ids?: number[] }) =>
    apiRequest<Tour>(`/tours/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    apiRequest(`/tours/${id}`, { method: 'DELETE' }),

  massDelete: (ids: number[]) =>
    apiRequest<{ deleted: number; failed: number }>('/tours/mass-delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),

  toggleStatus: (id: number) =>
    apiRequest<Tour>(`/tours/${id}/toggle-status`, { method: 'PATCH' }),

  togglePublish: (id: number) =>
    apiRequest<Tour>(`/tours/${id}/toggle-publish`, { method: 'PATCH' }),

  generateSlug: (id: number) =>
    apiRequest<{ slug: string; tour_id: number }>(`/tours/${id}/generate-slug`, { method: 'POST' }),

  checkSlug: (slug: string, tourId?: number) =>
    apiRequest<{ slug: string; is_unique: boolean }>('/tours/check-slug', {
      method: 'POST',
      body: JSON.stringify({ slug, tour_id: tourId }),
    }),

  previewSlug: (title: string, tourId?: number) =>
    apiRequest<{ slug: string }>('/tours/preview-slug', {
      method: 'POST',
      body: JSON.stringify({ title, tour_id: tourId }),
    }),

  recalculate: (id: number) =>
    apiRequest<Tour>(`/tours/${id}/recalculate`, { method: 'POST' }),

  getStatistics: () =>
    apiRequest<TourStatistics>('/tours/statistics'),

  getCounts: () =>
    apiRequest<TourCounts>('/tours/counts'),

  getRegions: () =>
    apiRequest<Record<string, string>>('/tours/regions'),

  getThemes: () =>
    apiRequest<Record<string, string>>('/tours/themes'),

  getTourTypes: () =>
    apiRequest<Record<string, string>>('/tours/tour-types'),

  getSuitableFor: () =>
    apiRequest<Record<string, string>>('/tours/suitable-for'),

  uploadCoverImage: async (id: number, file: File, customName?: string, alt?: string) => {
    const formData = new FormData();
    formData.append('image', file);
    if (customName) formData.append('custom_name', customName);
    if (alt) formData.append('alt', alt);
    
    const token = localStorage.getItem('access_token');
    
    const response = await fetch(`${API_BASE_URL}/tours/${id}/upload-cover-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    return response.json() as Promise<ApiResponse<{ cover_image_url: string; cover_image_alt?: string }>>;
  },

  uploadPdf: async (id: number, file: File) => {
    const formData = new FormData();
    formData.append('pdf', file);
    
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/tours/${id}/upload-pdf`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    return response.json() as Promise<ApiResponse<{ pdf_url: string }>>;
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  debug: (id: number) => apiRequest<any>(`/tours/${id}/debug`),
};

// Periods API (Tour sub-resource)
export const periodsApi = {
  list: (tourId: number, params?: Record<string, string>) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value);
      });
    }
    return apiRequest<Period[]>(`/tours/${tourId}/periods?${searchParams.toString()}`);
  },

  get: (tourId: number, periodId: number) =>
    apiRequest<Period>(`/tours/${tourId}/periods/${periodId}`),

  create: (tourId: number, data: any) =>
    apiRequest<Period>(`/tours/${tourId}/periods`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (tourId: number, periodId: number, data: any) =>
    apiRequest<Period>(`/tours/${tourId}/periods/${periodId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (tourId: number, periodId: number) =>
    apiRequest(`/tours/${tourId}/periods/${periodId}`, { method: 'DELETE' }),

  toggleStatus: (tourId: number, periodId: number) =>
    apiRequest<Period>(`/tours/${tourId}/periods/${periodId}/toggle-status`, { method: 'PATCH' }),

  bulkUpdate: (tourId: number, data: { period_ids: number[]; updates: Partial<{ is_visible: boolean; sale_status: string; promo_name: string }> }) =>
    apiRequest(`/tours/${tourId}/periods/bulk-update`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  massUpdatePromo: (tourId: number, data: { period_ids: number[]; promo_name: string; promo_start_date: string; promo_end_date: string; promo_quota: number }) =>
    apiRequest(`/tours/${tourId}/periods/mass-update-promo`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  massUpdateDiscount: (tourId: number, data: { period_ids: number[]; discount_adult: number; discount_single: number; discount_child_bed: number; discount_child_nobed: number }) =>
    apiRequest(`/tours/${tourId}/periods/mass-update-discount`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Tour Itinerary interface
export interface TourItinerary {
  id: number;
  tour_id: number;
  day_number: number;
  title: string | null;
  description: string | null;
  places: string[] | null;
  has_breakfast: boolean;
  has_lunch: boolean;
  has_dinner: boolean;
  meals_note: string | null;
  accommodation: string | null;
  hotel_star: number | null;
  images: string[] | null;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
}

// Tour Itineraries API
export const itinerariesApi = {
  list: (tourId: number) =>
    apiRequest<TourItinerary[]>(`/tours/${tourId}/itineraries`),

  get: (tourId: number, itineraryId: number) =>
    apiRequest<TourItinerary>(`/tours/${tourId}/itineraries/${itineraryId}`),

  create: (tourId: number, data: Partial<TourItinerary>) =>
    apiRequest<TourItinerary>(`/tours/${tourId}/itineraries`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (tourId: number, itineraryId: number, data: Partial<TourItinerary>) =>
    apiRequest<TourItinerary>(`/tours/${tourId}/itineraries/${itineraryId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (tourId: number, itineraryId: number) =>
    apiRequest(`/tours/${tourId}/itineraries/${itineraryId}`, { method: 'DELETE' }),

  reorder: (tourId: number, data: { itinerary_ids: number[] }) =>
    apiRequest(`/tours/${tourId}/itineraries/reorder`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Upload image standalone (returns URL only, for new itineraries)
  uploadImageOnly: async (file: File, tourId?: number): Promise<ApiResponse<{ url: string; cloudflare_id?: string }>> => {
    const formData = new FormData();
    formData.append('image', file);
    if (tourId) {
      formData.append('tour_id', tourId.toString());
    }
    
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/itineraries/upload-image`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    
    return response.json();
  },

  // Upload image for existing itinerary (also updates itinerary.images)
  uploadImage: async (tourId: number, itineraryId: number, file: File): Promise<ApiResponse<{ url: string; cloudflare_id?: string; images: string[] }>> => {
    const formData = new FormData();
    formData.append('image', file);
    
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/tours/${tourId}/itineraries/${itineraryId}/upload-image`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    
    return response.json();
  },

  removeImage: (tourId: number, itineraryId: number, url: string) =>
    apiRequest<{ images: string[] }>(`/tours/${tourId}/itineraries/${itineraryId}/remove-image`, {
      method: 'POST',
      body: JSON.stringify({ url }),
    }),

  // Delete image from Cloudflare (standalone - for unsaved itineraries)
  deleteImage: async (url: string): Promise<ApiResponse<null>> => {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/itineraries/delete-image`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ url }),
    });
    return response.json();
  },
};

// Promotions API
export const promotionsApi = {
  list: (params?: Record<string, string>) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value);
      });
    }
    return apiRequest<Promotion[]>(`/promotions?${searchParams.toString()}`);
  },

  get: (id: number) =>
    apiRequest<Promotion>(`/promotions/${id}`),

  create: (data: Partial<Promotion>) =>
    apiRequest<Promotion>('/promotions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<Promotion>) =>
    apiRequest<Promotion>(`/promotions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    apiRequest(`/promotions/${id}`, { method: 'DELETE' }),

  toggleStatus: (id: number) =>
    apiRequest<Promotion>(`/promotions/${id}/toggle-status`, { method: 'PATCH' }),

  reorder: (items: { id: number; sort_order: number }[]) =>
    apiRequest('/promotions/reorder', {
      method: 'POST',
      body: JSON.stringify({ items }),
    }),

  uploadBanner: async (id: number, file: File) => {
    const formData = new FormData();
    formData.append('image', file);

    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/promotions/${id}/upload-banner`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload banner');
    }

    return response.json() as Promise<{
      success: boolean;
      banner_url: string;
      cloudflare_id: string;
      message: string;
    }>;
  },

  deleteBanner: (id: number) =>
    apiRequest(`/promotions/${id}/delete-banner`, { method: 'DELETE' }),
};

// Gallery Images API
export const galleryApi = {
  list: (params?: Record<string, string>) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value);
      });
    }
    return apiRequest<GalleryImage[]>(`/gallery?${searchParams.toString()}`);
  },

  get: (id: number) =>
    apiRequest<GalleryImage>(`/gallery/${id}`),

  update: (id: number, data: Partial<GalleryImage>) =>
    apiRequest<GalleryImage>(`/gallery/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    apiRequest(`/gallery/${id}`, { method: 'DELETE' }),

  toggleStatus: (id: number) =>
    apiRequest<GalleryImage>(`/gallery/${id}/toggle-status`, { method: 'PATCH' }),

  getTags: () =>
    apiRequest<string[]>('/gallery/tags'),

  getStatistics: () =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiRequest<any>('/gallery/statistics'),

  getForTour: (cityIds: number[], countryIds: number[], hashtags: string[], limit = 6) =>
    apiRequest<{ url: string; thumbnail_url: string; alt: string; caption: string }[]>('/gallery/for-tour', {
      method: 'POST',
      body: JSON.stringify({ city_ids: cityIds, country_ids: countryIds, hashtags, limit }),
    }),

  upload: async (file: File, data: { alt?: string; caption?: string; country_id?: number; city_id?: number; tags?: string[]; custom_filename?: string }) => {
    const formData = new FormData();
    formData.append('image', file);
    if (data.alt) formData.append('alt', data.alt);
    if (data.caption) formData.append('caption', data.caption);
    if (data.country_id) formData.append('country_id', data.country_id.toString());
    if (data.city_id) formData.append('city_id', data.city_id.toString());
    if (data.custom_filename) formData.append('custom_filename', data.custom_filename);
    if (data.tags) {
      data.tags.forEach((tag, i) => formData.append(`tags[${i}]`, tag));
    }
    
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/gallery`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    return response.json() as Promise<ApiResponse<GalleryImage>>;
  },

  bulkUpload: async (files: File[], data: { country_id?: number; city_id?: number; tags?: string[] }) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('images[]', file));
    if (data.country_id) formData.append('country_id', data.country_id.toString());
    if (data.city_id) formData.append('city_id', data.city_id.toString());
    if (data.tags) {
      data.tags.forEach((tag, i) => formData.append(`tags[${i}]`, tag));
    }
    
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/gallery/bulk-upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    return response.json() as Promise<ApiResponse<{ uploaded: GalleryImage[]; failed: string[] }>>;
  },
};

// ================== Integrations API ==================

export interface WholesalerApiConfig {
  id: number;
  wholesaler_id: number;
  wholesaler?: Wholesaler;
  api_base_url: string;
  api_version: string;
  api_format: 'rest' | 'soap' | 'graphql';
  auth_type: 'api_key' | 'oauth2' | 'basic' | 'bearer' | 'custom';
  auth_credentials?: {
    api_key?: string;
    api_secret?: string;
    username?: string;
    password?: string;
    token?: string;
    client_id?: string;
    client_secret?: string;
    token_url?: string;
    headers?: Record<string, string>;
    endpoints?: {
      tours?: string;
      periods?: string;
      tour_detail?: string;
      itineraries?: string;
    };
    oauth_fields?: { key: string; value: string }[];
    response_token_field?: string;
  };
  auth_header_name: string;
  rate_limit_per_minute: number;
  rate_limit_per_day: number;
  connect_timeout_seconds: number;
  request_timeout_seconds: number;
  retry_attempts: number;
  sync_enabled: boolean;
  sync_method: 'cursor' | 'ack_callback' | 'last_modified';
  sync_mode?: 'single' | 'two_phase';
  sync_schedule: string;
  sync_limit?: number | null;
  full_sync_schedule: string;
  webhook_enabled: boolean;
  webhook_secret?: string;
  webhook_url?: string;
  supports_availability_check: boolean;
  supports_hold_booking: boolean;
  supports_modify_booking: boolean;
  is_active: boolean;
  last_health_check_at: string | null;
  last_health_check_status: boolean | null;
  // PDF Branding
  pdf_header_image?: string | null;
  pdf_footer_image?: string | null;
  pdf_header_height?: number | null;
  pdf_footer_height?: number | null;
  // Notification Settings
  notifications_enabled?: boolean;
  notification_emails?: string[];
  notification_types?: string[];
  // City Extraction
  extract_cities_from_name?: boolean;
  // Past Period Handling
  past_period_handling?: 'skip' | 'close' | 'keep';
  past_period_threshold_days?: number;
  // Data Structure Config for nested arrays
  aggregation_config?: {
    data_structure?: {
      departures?: {
        path?: string;
        description?: string;
      };
      itineraries?: {
        path?: string;
        description?: string;
      };
    };
  };
  created_at: string;
  updated_at: string;
}

export interface SectionDefinition {
  id: number;
  section_name: string;
  field_name: string;
  data_type: string;
  enum_values?: string[];
  is_required: boolean;
  default_value?: string;
  validation_rules?: string;
  lookup_table?: string;
  lookup_match_fields?: string[];
  lookup_return_field: string;
  lookup_create_if_not_found: boolean;
  description?: string;
  sort_order: number;
  is_system: boolean;
}

export interface WholesalerFieldMapping {
  id: number;
  wholesaler_id: number;
  section_name: string;
  our_field: string;
  their_field?: string;
  their_field_path?: string;
  transform_type: 'direct' | 'value_map' | 'formula' | 'split' | 'concat' | 'lookup' | 'custom';
  transform_config?: Record<string, unknown>;
  default_value?: string;
  is_required_override?: boolean;
  notes?: string;
  is_active: boolean;
  sort_order: number;
}

export interface IntegrationWithStats extends WholesalerApiConfig {
  wholesaler_name: string;
  wholesaler_logo?: string;
  tours_count: number;
  last_synced_at?: string;
  last_sync_status?: 'success' | 'failed' | 'partial';
  next_sync_at?: string;
  errors_count: number;
  health_status: 'healthy' | 'degraded' | 'down' | 'unknown';
}

export interface TestConnectionResult {
  success: boolean;
  message: string;
  tours_count?: number;
  sample_tour?: {
    code: string;
    name: string;
    destination?: string;
    days?: number;
    price?: number;
  };
  response_time_ms?: number;
  status_code?: number;
  error?: string;
}

export const integrationsApi = {
  // List all integrations with stats
  list: (params?: Record<string, string>) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value);
      });
    }
    return apiRequest<IntegrationWithStats[]>(`/integrations?${searchParams.toString()}`);
  },

  // Get single integration
  get: (id: number) =>
    apiRequest<WholesalerApiConfig>(`/integrations/${id}`),

  // Create new integration
  create: (data: Partial<WholesalerApiConfig>) =>
    apiRequest<WholesalerApiConfig>('/integrations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Update integration
  update: (id: number, data: Partial<WholesalerApiConfig>) =>
    apiRequest<WholesalerApiConfig>(`/integrations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Delete integration
  delete: (id: number) =>
    apiRequest(`/integrations/${id}`, { method: 'DELETE' }),

  // Test connection
  testConnection: (data: {
    api_base_url: string;
    api_version?: string;
    auth_type: string;
    auth_credentials: Record<string, string | Record<string, string>>;
  }) =>
    apiRequest<TestConnectionResult>('/integrations/test-connection', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Toggle sync
  toggleSync: (id: number) =>
    apiRequest<{ sync_enabled: boolean }>(`/integrations/${id}/toggle-sync`, { method: 'POST' }),

  // Trigger manual sync (deprecated - use runSyncNow instead)
  syncNow: (id: number) =>
    apiRequest<{ job_id: string; message: string }>(`/integrations/${id}/sync-now`, { method: 'POST' }),

  // Get sync history
  getSyncHistory: (id: number, params?: Record<string, string>) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value);
      });
    }
    return apiRequest<Array<{
      id: number;
      sync_id?: string;
      sync_type: string;
      status: string;
      tours_received: number;
      tours_created: number;
      tours_updated: number;
      tours_skipped?: number;
      tours_failed?: number;
      error_count: number;
      started_at: string;
      completed_at?: string | null;
      duration_seconds?: number | null;
    }>>(`/integrations/${id}/sync-history?${searchParams.toString()}`);
  },

  // Get field mappings for integration
  getMappings: (id: number) =>
    apiRequest<WholesalerFieldMapping[]>(`/integrations/${id}/mappings`),

  // Save field mappings
  saveMappings: (id: number, mappings: Partial<WholesalerFieldMapping>[]) =>
    apiRequest<WholesalerFieldMapping[]>(`/integrations/${id}/mappings`, {
      method: 'POST',
      body: JSON.stringify({ mappings }),
    }),

  // Fetch sample data from wholesaler API
  fetchSample: (id: number) =>
    apiRequest<{
      success: boolean;
      data: unknown[];
      tours_count: number;
      sample_tour: unknown;
    }>(`/integrations/${id}/fetch-sample`),

  // Test mapping (dry run validation)
  testMapping: (wholesalerId: number, data: {
    sample_data: Record<string, unknown>;
    transformed_data: Record<string, unknown>;
  }) =>
    apiRequest<{
      success: boolean;
      message: string;
      summary: {
        tours: number;
        departures: number;
        itineraries: number;
        errors: number;
        warnings: number;
      };
      validations: Array<{
        section: string;
        status: 'success' | 'warning' | 'error';
        message: string;
        count?: number;
        fields?: Record<string, unknown>;
        items?: Array<{
          index: number;
          status: string;
          issues: string[];
          data: Record<string, unknown>;
        }>;
      }>;
      errors: Array<{
        section: string;
        type: string;
        message: string;
      }>;
      warnings: Array<{
        section: string;
        type: string;
        message: string;
      }>;
    }>(`/integrations/${wholesalerId}/test-mapping`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Preview Sync - Fetch from API, apply mapping, return transformed data
  previewSync: (id: number, data?: { limit?: number }) =>
    apiRequest<{
      total_fetched: number;
      preview_count: number;
      limit: number;
      transformed_data: Array<{
        tour: Record<string, unknown>;
        departure: Array<Record<string, unknown>>;
        itinerary: Array<Record<string, unknown>>;
        content: Record<string, unknown>;
        media: Record<string, unknown>;
      }>;
    }>(`/integrations/${id}/preview-sync`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    }),

  // Check tour count from wholesaler API
  checkTourCount: (id: number) =>
    apiRequest<{
      tour_count: number;
      tours_with_departures: number;
      total_departures: number;
      countries: string[];
      countries_count: number;
      response_time_ms: number;
      api_url: string;
      wholesaler_name: string;
    }>(`/integrations/${id}/check-tour-count`),

  // Check schedule conflict
  checkScheduleConflict: (schedule: string, excludeId?: number) => {
    const params = new URLSearchParams({ schedule });
    if (excludeId) params.append('exclude_id', String(excludeId));
    return apiRequest<{
      conflict: boolean;
      message: string;
      conflicting_integration?: string;
      conflicting_minute?: number;
      gap_minutes?: number;
      min_gap?: number;
      suggested_minutes?: number[];
    }>(`/integrations/check-schedule?${params.toString()}`);
  },

  // Sync Now - Run sync immediately
  runSyncNow: (id: number, data?: {
    transformed_data?: Array<Record<string, unknown>>;
    sync_type?: 'manual' | 'incremental' | 'full';
    limit?: number;
  }) =>
    apiRequest<{
      success: boolean;
      message: string;
      data: {
        sync_type: string;
        has_transformed_data: boolean;
        limit: number | null;
      };
    }>(`/integrations/${id}/sync-now`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    }),

  // Upload PDF header image
  uploadHeader: async (id: number, file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    
    const response = await fetch(`${API_BASE_URL}/integrations/${id}/upload-header`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      if (response.status === 401) {
        throw new Error('กรุณาเข้าสู่ระบบใหม่');
      }
      throw new Error(error.message || `Failed to upload header (${response.status})`);
    }
    
    return response.json() as Promise<{
      success: boolean;
      message: string;
      data: { url: string; height: number };
    }>;
  },

  // Upload PDF footer image
  uploadFooter: async (id: number, file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const response = await fetch(`${API_BASE_URL}/integrations/${id}/upload-footer`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      if (response.status === 401) {
        throw new Error('กรุณาเข้าสู่ระบบใหม่');
      }
      throw new Error(error.message || `Failed to upload footer (${response.status})`);
    }
    
    return response.json() as Promise<{
      success: boolean;
      message: string;
      data: { url: string; height: number };
    }>;
  },

  // Remove PDF header
  removeHeader: (id: number) =>
    apiRequest<{ success: boolean; message: string }>(`/integrations/${id}/header`, {
      method: 'DELETE',
    }),

  // Remove PDF footer
  removeFooter: (id: number) =>
    apiRequest<{ success: boolean; message: string }>(`/integrations/${id}/footer`, {
      method: 'DELETE',
    }),

  // Test notification
  testNotification: (id: number) =>
    apiRequest<{ success: boolean; message: string }>(`/integrations/${id}/test-notification`, {
      method: 'POST',
    }),

  // Get Smart Sync Settings
  getSyncSettings: (id: number) =>
    apiRequest<{
      respect_manual_overrides: boolean;
      always_sync_fields: string[];
      never_sync_fields: string[];
      auto_close_expired_periods: boolean;
      auto_close_expired_tours: boolean;
      skip_past_periods_on_sync: boolean;
      skip_disabled_tours_on_sync: boolean;
      past_period_handling: 'skip' | 'close' | 'keep';
      past_period_threshold_days: number;
    }>(`/integrations/${id}/sync-settings`),

  // Update Smart Sync Settings
  updateSyncSettings: (id: number, data: {
    respect_manual_overrides?: boolean;
    always_sync_fields?: string[];
    never_sync_fields?: string[];
    auto_close_expired_periods?: boolean;
    auto_close_expired_tours?: boolean;
    skip_past_periods_on_sync?: boolean;
    skip_disabled_tours_on_sync?: boolean;
    past_period_handling?: 'skip' | 'close' | 'keep';
    past_period_threshold_days?: number;
  }) =>
    apiRequest<{
      success: boolean;
      message: string;
      data: Record<string, unknown>;
    }>(`/integrations/${id}/sync-settings`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Run Auto-Close for expired periods/tours
  runAutoClose: (id: number) =>
    apiRequest<{
      success: boolean;
      message: string;
      data: {
        periods_closed: number;
        tours_closed: number;
        threshold_date: string;
      };
    }>(`/integrations/${id}/auto-close-expired`, {
      method: 'POST',
    }),
};

// ============================================================
// Sync Progress & Control API (new endpoints)
// ============================================================
export interface SyncProgressData {
  sync_log_id: number;
  status: string;
  progress_percent: number;
  processed_items: number;
  total_items: number;
  current_item_code: string | null;
  chunk_size: number;
  current_chunk: number;
  total_chunks: number;
  api_calls_count: number;
  cancel_requested: boolean;
  cancelled_at: string | null;
  cancel_reason: string | null;
  last_heartbeat_at: string | null;
  heartbeat_timeout_minutes: number;
  is_stuck: boolean;
  started_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
  tours_created: number;
  tours_updated: number;
  tours_failed: number;
  error_count: number;
}

export interface RunningSyncData {
  id: number;
  wholesaler_id: number;
  wholesaler_name: string;
  sync_type: string;
  status: string;
  progress_percent: number;
  processed_items: number;
  total_items: number;
  current_item_code: string | null;
  started_at: string;
  last_heartbeat_at: string | null;
  is_stuck: boolean;
  cancel_requested: boolean;
}

export const syncApi = {
  // Get all running syncs with progress
  getRunning: () =>
    apiRequest<RunningSyncData[]>('/sync/running'),

  // Get progress for specific sync
  getProgress: (syncLogId: number) =>
    apiRequest<SyncProgressData>(`/sync/${syncLogId}/progress`),

  // Request cancel (graceful)
  cancel: (syncLogId: number, reason?: string) =>
    apiRequest<{ message: string }>(`/sync/${syncLogId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason: reason || 'Cancelled by user' }),
    }),

  // Force cancel (immediate)
  forceCancel: (syncLogId: number, reason?: string) =>
    apiRequest<{ message: string }>(`/sync/${syncLogId}/force-cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason: reason || 'Force cancelled by user' }),
    }),
};

// Section Definitions API
export const sectionDefinitionsApi = {
  // List all sections grouped
  list: () =>
    apiRequest<Record<string, SectionDefinition[]>>('/integrations/section-definitions'),

  // Get fields for a section
  getSection: (sectionName: string) =>
    apiRequest<SectionDefinition[]>(`/integrations/section-definitions/${sectionName}`),
};

// Hero Slides Types
export interface HeroSlide {
  id: number;
  cloudflare_id: string | null;
  url: string;
  thumbnail_url: string | null;
  filename: string;
  alt: string | null;
  title: string | null;
  subtitle: string | null;
  button_text: string | null;
  button_link: string | null;
  width: number;
  height: number;
  file_size: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface HeroSlideStatistics {
  total: number;
  active: number;
  inactive: number;
}

// Hero Slides API
export const heroSlidesApi = {
  // List all hero slides
  list: (params?: Record<string, string>) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value);
      });
    }
    return apiRequest<HeroSlide[]>(`/hero-slides?${searchParams.toString()}`);
  },

  // Get a single hero slide
  get: (id: number) => apiRequest<HeroSlide>(`/hero-slides/${id}`),

  // Upload new hero slide
  upload: async (
    file: File,
    data?: {
      alt?: string;
      title?: string;
      subtitle?: string;
      button_text?: string;
      button_link?: string;
      custom_filename?: string;
    }
  ) => {
    const formData = new FormData();
    formData.append('image', file);
    if (data?.alt) formData.append('alt', data.alt);
    if (data?.title) formData.append('title', data.title);
    if (data?.subtitle) formData.append('subtitle', data.subtitle);
    if (data?.button_text) formData.append('button_text', data.button_text);
    if (data?.button_link) formData.append('button_link', data.button_link);
    if (data?.custom_filename) formData.append('custom_filename', data.custom_filename);

    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

    const response = await fetch(`${API_BASE_URL}/hero-slides`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    const responseData = await response.json();
    if (!response.ok) {
      throw new Error(responseData.message || 'Upload failed');
    }
    return responseData as { success: boolean; data: HeroSlide; message: string };
  },

  // Update hero slide details
  update: (id: number, data: Partial<HeroSlide>) =>
    apiRequest<HeroSlide>(`/hero-slides/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Replace hero slide image
  replaceImage: async (id: number, file: File) => {
    const formData = new FormData();
    formData.append('image', file);

    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

    const response = await fetch(`${API_BASE_URL}/hero-slides/${id}/replace-image`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    const responseData = await response.json();
    if (!response.ok) {
      throw new Error(responseData.message || 'Replace image failed');
    }
    return responseData as { success: boolean; data: HeroSlide; message: string };
  },

  // Toggle hero slide status
  toggleStatus: (id: number) =>
    apiRequest<HeroSlide>(`/hero-slides/${id}/toggle-status`, { method: 'PATCH' }),

  // Reorder hero slides
  reorder: (slides: { id: number; sort_order: number }[]) =>
    apiRequest('/hero-slides/reorder', {
      method: 'POST',
      body: JSON.stringify({ slides }),
    }),

  // Delete hero slide
  delete: (id: number) =>
    apiRequest(`/hero-slides/${id}`, { method: 'DELETE' }),

  // Get statistics
  getStatistics: () =>
    apiRequest<HeroSlideStatistics>('/hero-slides/statistics'),
};

// ===================== Our Clients API =====================

export interface OurClient {
  id: number;
  cloudflare_id: string | null;
  url: string;
  thumbnail_url: string | null;
  filename: string;
  name: string;
  alt: string | null;
  description: string | null;
  website_url: string | null;
  width: number;
  height: number;
  file_size: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface OurClientStatistics {
  total: number;
  active: number;
  inactive: number;
}

export const ourClientsApi = {
  // List all clients
  list: (params?: Record<string, string>) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value);
      });
    }
    return apiRequest<OurClient[]>(`/our-clients?${searchParams.toString()}`);
  },

  // Get a single client
  get: (id: number) => apiRequest<OurClient>(`/our-clients/${id}`),

  // Upload new client
  upload: async (
    file: File,
    data?: {
      name?: string;
      alt?: string;
      description?: string;
      website_url?: string;
      custom_filename?: string;
    }
  ) => {
    const formData = new FormData();
    formData.append('image', file);
    if (data?.name) formData.append('name', data.name);
    if (data?.alt) formData.append('alt', data.alt);
    if (data?.description) formData.append('description', data.description);
    if (data?.website_url) formData.append('website_url', data.website_url);
    if (data?.custom_filename) formData.append('custom_filename', data.custom_filename);

    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

    const response = await fetch(`${API_BASE_URL}/our-clients`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    const responseData = await response.json();
    if (!response.ok) {
      throw new Error(responseData.message || 'Upload failed');
    }
    return responseData as { success: boolean; data: OurClient; message: string };
  },

  // Update client details
  update: (id: number, data: Partial<OurClient>) =>
    apiRequest<OurClient>(`/our-clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Replace client image
  replaceImage: async (id: number, file: File) => {
    const formData = new FormData();
    formData.append('image', file);

    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

    const response = await fetch(`${API_BASE_URL}/our-clients/${id}/replace-image`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    const responseData = await response.json();
    if (!response.ok) {
      throw new Error(responseData.message || 'Replace image failed');
    }
    return responseData as { success: boolean; data: OurClient; message: string };
  },

  // Toggle client status
  toggleStatus: (id: number) =>
    apiRequest<OurClient>(`/our-clients/${id}/toggle-status`, { method: 'PATCH' }),

  // Reorder clients
  reorder: (clients: { id: number; sort_order: number }[]) =>
    apiRequest('/our-clients/reorder', {
      method: 'POST',
      body: JSON.stringify({ clients }),
    }),

  // Delete client
  delete: (id: number) =>
    apiRequest(`/our-clients/${id}`, { method: 'DELETE' }),

  // Get statistics
  getStatistics: () =>
    apiRequest<OurClientStatistics>('/our-clients/statistics'),
};

// Popup Types
export interface Popup {
  id: number;
  title: string;
  description: string | null;
  cloudflare_id: string | null;
  image_url: string | null;
  thumbnail_url: string | null;
  alt_text: string | null;
  button_text: string | null;
  button_link: string | null;
  button_color: string;
  popup_type: 'image' | 'content' | 'promo' | 'newsletter' | 'announcement';
  display_frequency: 'always' | 'once_per_session' | 'once_per_day' | 'once_per_week' | 'once';
  delay_seconds: number;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  show_close_button: boolean;
  close_on_overlay: boolean;
  sort_order: number;
  width: number | null;
  height: number | null;
  file_size: number | null;
  created_at: string;
  updated_at: string;
}

export interface PopupStatistics {
  total: number;
  active: number;
  inactive: number;
  by_type: Record<string, number>;
  currently_showing: number;
}

export const popupsApi = {
  // List all popups
  list: (params?: Record<string, string>) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value);
      });
    }
    return apiRequest<Popup[]>(`/popups?${searchParams.toString()}`);
  },

  // Get a single popup
  get: (id: number) => apiRequest<Popup>(`/popups/${id}`),

  // Upload new popup with image
  upload: async (
    file: File | null,
    data: {
      title: string;
      description?: string;
      alt_text?: string;
      button_text?: string;
      button_link?: string;
      button_color?: string;
      popup_type?: string;
      display_frequency?: string;
      delay_seconds?: number;
      start_date?: string;
      end_date?: string;
      is_active?: boolean;
      show_close_button?: boolean;
      close_on_overlay?: boolean;
    }
  ) => {
    const formData = new FormData();
    if (file) formData.append('image', file);
    formData.append('title', data.title);
    if (data.description) formData.append('description', data.description);
    if (data.alt_text) formData.append('alt_text', data.alt_text);
    if (data.button_text) formData.append('button_text', data.button_text);
    if (data.button_link) formData.append('button_link', data.button_link);
    if (data.button_color) formData.append('button_color', data.button_color);
    if (data.popup_type) formData.append('popup_type', data.popup_type);
    if (data.display_frequency) formData.append('display_frequency', data.display_frequency);
    if (data.delay_seconds !== undefined) formData.append('delay_seconds', String(data.delay_seconds));
    if (data.start_date) formData.append('start_date', data.start_date);
    if (data.end_date) formData.append('end_date', data.end_date);
    if (data.is_active !== undefined) formData.append('is_active', data.is_active ? '1' : '0');
    if (data.show_close_button !== undefined) formData.append('show_close_button', data.show_close_button ? '1' : '0');
    if (data.close_on_overlay !== undefined) formData.append('close_on_overlay', data.close_on_overlay ? '1' : '0');

    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

    const response = await fetch(`${API_BASE_URL}/popups`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    const responseData = await response.json();
    if (!response.ok) {
      throw new Error(responseData.message || 'Upload failed');
    }
    return responseData as { success: boolean; data: Popup; message: string };
  },

  // Update popup details
  update: (id: number, data: Partial<Popup>) =>
    apiRequest<Popup>(`/popups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Replace popup image
  replaceImage: async (id: number, file: File) => {
    const formData = new FormData();
    formData.append('image', file);

    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

    const response = await fetch(`${API_BASE_URL}/popups/${id}/replace-image`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    const responseData = await response.json();
    if (!response.ok) {
      throw new Error(responseData.message || 'Replace image failed');
    }
    return responseData as { success: boolean; data: Popup; message: string };
  },

  // Toggle popup status
  toggleStatus: (id: number) =>
    apiRequest<Popup>(`/popups/${id}/toggle-status`, { method: 'PATCH' }),

  // Reorder popups
  reorder: (popups: { id: number; sort_order: number }[]) =>
    apiRequest('/popups/reorder', {
      method: 'POST',
      body: JSON.stringify({ popups }),
    }),

  // Delete popup
  delete: (id: number) =>
    apiRequest(`/popups/${id}`, { method: 'DELETE' }),

  // Get statistics
  getStatistics: () =>
    apiRequest<PopupStatistics>('/popups/statistics'),
};

// ==================== Menu Types ====================
export interface MenuItem {
  id: number;
  location: 'header' | 'footer_col1' | 'footer_col2' | 'footer_col3';
  title: string;
  url: string | null;
  target: '_self' | '_blank';
  icon: string | null;
  parent_id: number | null;
  sort_order: number;
  is_active: boolean;
  css_class: string | null;
  all_children?: MenuItem[];
  children?: MenuItem[];
  created_at: string;
  updated_at: string;
}

export const menusApi = {
  list: (params?: Record<string, string>) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value);
      });
    }
    return apiRequest<MenuItem[]>(`/menus?${searchParams.toString()}`);
  },

  get: (id: number) => apiRequest<MenuItem>(`/menus/${id}`),

  create: (data: Partial<MenuItem>) =>
    apiRequest<MenuItem>('/menus', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<MenuItem>) =>
    apiRequest<MenuItem>(`/menus/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    apiRequest(`/menus/${id}`, { method: 'DELETE' }),

  reorder: (menus: { id: number; sort_order: number; parent_id?: number | null }[]) =>
    apiRequest('/menus/reorder', {
      method: 'POST',
      body: JSON.stringify({ menus }),
    }),

  toggleStatus: (id: number) =>
    apiRequest<MenuItem>(`/menus/${id}/toggle-status`, { method: 'PATCH' }),

  getLocations: () =>
    apiRequest<Record<string, string>>('/menus/locations'),
};

// ==================== SEO Types ====================
export interface SeoSetting {
  id: number;
  page_slug: string;
  page_name: string;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  og_image_cloudflare_id: string | null;
  canonical_url: string | null;
  robots_index: boolean;
  robots_follow: boolean;
  structured_data: string | null;
  custom_head_tags: string | null;
  created_at: string;
  updated_at: string;
}

export const seoApi = {
  list: () => apiRequest<SeoSetting[]>('/seo'),

  get: (slug: string) => apiRequest<SeoSetting>(`/seo/${slug}`),

  update: (slug: string, data: Partial<SeoSetting>) =>
    apiRequest<SeoSetting>(`/seo/${slug}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  uploadOgImage: async (slug: string, file: File) => {
    const formData = new FormData();
    formData.append('image', file);

    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

    const response = await fetch(`${API_BASE_URL}/seo/${slug}/og-image`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    const responseData = await response.json();
    if (!response.ok) {
      throw new Error(responseData.message || 'Upload failed');
    }
    return responseData as { success: boolean; data: SeoSetting; message: string };
  },

  getPages: () => apiRequest<Record<string, string>>('/seo/pages'),
};

// ==================== Site Contact Types ====================
export interface SiteContact {
  id: number;
  key: string;
  label: string;
  value: string;
  icon: string | null;
  url: string | null;
  sort_order: number;
  is_active: boolean;
  group: 'contact' | 'social' | 'business_hours';
  created_at: string;
  updated_at: string;
}

export const siteContactsApi = {
  list: (params?: Record<string, string>) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value);
      });
    }
    return apiRequest<SiteContact[]>(`/site-contacts?${searchParams.toString()}`);
  },

  create: (data: Partial<SiteContact>) =>
    apiRequest<SiteContact>('/site-contacts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<SiteContact>) =>
    apiRequest<SiteContact>(`/site-contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    apiRequest(`/site-contacts/${id}`, { method: 'DELETE' }),

  toggle: (id: number) =>
    apiRequest<SiteContact>(`/site-contacts/${id}/toggle`, { method: 'PATCH' }),
};

// Popular Country Setting Types
export interface PopularCountryItem {
  id: number;
  setting_id: number;
  country_id: number;
  image_url: string | null;
  cloudflare_id: string | null;
  alt_text: string | null;
  title: string | null;
  subtitle: string | null;
  link_url: string | null;
  display_name: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  country?: {
    id: number;
    iso2: string;
    iso3: string;
    name_en: string;
    name_th: string | null;
    region: string | null;
    flag_emoji: string | null;
  };
}

export interface PopularCountrySetting {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  selection_mode: 'auto' | 'manual';
  country_ids: number[] | null;
  filters: {
    wholesaler_ids?: number[];
    themes?: string[];
    regions?: string[];
    min_price?: number;
    max_price?: number;
    hotel_star_min?: number;
    hotel_star_max?: number;
    duration_min?: number;
    duration_max?: number;
  } | null;
  tour_conditions: {
    has_upcoming_periods?: boolean;
    travel_months?: number[];
    travel_date_from?: string;
    travel_date_to?: string;
    min_available_seats?: number;
  } | null;
  display_count: number;
  min_tour_count: number;
  sort_by: 'tour_count' | 'name' | 'manual';
  sort_direction: 'asc' | 'desc';
  is_active: boolean;
  sort_order: number;
  cache_minutes: number;
  last_cached_at: string | null;
  created_at: string;
  updated_at: string;
  items?: PopularCountryItem[];
}

// Input type for creating/updating country items
export interface PopularCountryItemInput {
  country_id: number;
  alt_text?: string | null;
  title?: string | null;
  subtitle?: string | null;
  link_url?: string | null;
  display_name?: string | null;
  sort_order?: number;
}

// Input type for creating/updating settings
export interface PopularCountrySettingInput extends Omit<Partial<PopularCountrySetting>, 'items' | 'id' | 'created_at' | 'updated_at' | 'last_cached_at'> {
  items?: PopularCountryItemInput[];
}

export interface PopularCountryResult {
  id: number;
  iso2: string;
  iso3: string;
  name_en: string;
  name_th: string | null;
  slug: string;
  region: string | null;
  flag_emoji: string | null;
  tour_count: number;
  // Custom display from PopularCountryItem
  image_url?: string | null;
  alt_text?: string | null;
  title?: string | null;
  subtitle?: string | null;
  link_url?: string | null;
  display_name?: string | null;
}

export interface PopularCountryFilterOptions {
  selection_modes: Record<string, string>;
  sort_options: Record<string, string>;
  themes: Record<string, string>;
  regions: Record<string, string>;
  wholesalers: { id: number; name: string; code: string }[];
  countries: { id: number; iso2: string; name_en: string; name_th: string | null; flag_emoji: string | null; region: string | null }[];
  months: Record<number, string>;
}

// Popular Country Settings API
export const popularCountriesApi = {
  // List all settings
  list: (params?: Record<string, string>) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value);
      });
    }
    return apiRequest<PopularCountrySetting[]>(`/popular-countries?${searchParams.toString()}`);
  },

  // Get filter options
  getFilterOptions: () =>
    apiRequest<PopularCountryFilterOptions>('/popular-countries/filter-options'),

  // Get a single setting
  get: (id: number) =>
    apiRequest<PopularCountrySetting>(`/popular-countries/${id}`),

  // Create new setting
  create: (data: PopularCountrySettingInput) =>
    apiRequest<PopularCountrySetting>('/popular-countries', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Update a setting
  update: (id: number, data: PopularCountrySettingInput) =>
    apiRequest<PopularCountrySetting>(`/popular-countries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Delete a setting
  delete: (id: number) =>
    apiRequest(`/popular-countries/${id}`, { method: 'DELETE' }),

  // Toggle status
  toggleStatus: (id: number) =>
    apiRequest<PopularCountrySetting>(`/popular-countries/${id}/toggle-status`, {
      method: 'PATCH',
    }),

  // Preview with saved setting
  preview: (id: number) =>
    apiRequest<{ setting: { name: string; slug: string }; countries: PopularCountryResult[]; total_found: number }>(
      `/popular-countries/${id}/preview`
    ),

  // Preview with unsaved settings
  previewSettings: (data: {
    setting_id?: number; // Include to load saved images when editing existing setting
    selection_mode: string;
    country_ids?: number[];
    filters?: PopularCountrySetting['filters'];
    tour_conditions?: PopularCountrySetting['tour_conditions'];
    display_count?: number;
    min_tour_count?: number;
    sort_by?: string;
    sort_direction?: string;
  }) =>
    apiRequest<{ countries: PopularCountryResult[]; total_found: number }>(
      '/popular-countries/preview-settings',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),

  // Clear cache
  clearCache: (id: number) =>
    apiRequest(`/popular-countries/${id}/clear-cache`, { method: 'POST' }),

  // Reorder settings
  reorder: (items: { id: number; sort_order: number }[]) =>
    apiRequest('/popular-countries/reorder', {
      method: 'POST',
      body: JSON.stringify({ items }),
    }),

  // Upload image for a country item
  uploadItemImage: async (settingId: number, countryId: number, file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/popular-countries/${settingId}/items/${countryId}/image`, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload image');
    }
    
    return response.json() as Promise<{ 
      success: boolean; 
      image_url: string; 
      cloudflare_id: string;
      item: PopularCountryItem;
    }>;
  },

  // Delete image from a country item
  deleteItemImage: (settingId: number, countryId: number) =>
    apiRequest<{ success: boolean; item: PopularCountryItem }>(
      `/popular-countries/${settingId}/items/${countryId}/image`,
      { method: 'DELETE' }
    ),

  // Update a specific country item
  updateItem: (settingId: number, countryId: number, data: Partial<Pick<PopularCountryItem, 'alt_text' | 'title' | 'subtitle' | 'link_url' | 'display_name' | 'sort_order'>>) =>
    apiRequest<{ success: boolean; item: PopularCountryItem }>(
      `/popular-countries/${settingId}/items/${countryId}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    ),
};

// Tour Tabs API
export const tourTabsApi = {
  list: (params?: Record<string, string>) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value);
      });
    }
    return apiRequest<TourTab[]>(`/tour-tabs?${searchParams.toString()}`);
  },

  get: (id: number) =>
    apiRequest<TourTab>(`/tour-tabs/${id}`),

  create: (data: Partial<TourTab>) =>
    apiRequest<TourTab>('/tour-tabs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<TourTab>) =>
    apiRequest<TourTab>(`/tour-tabs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    apiRequest(`/tour-tabs/${id}`, { method: 'DELETE' }),

  toggleStatus: (id: number) =>
    apiRequest<TourTab>(`/tour-tabs/${id}/toggle-status`, { method: 'PATCH' }),

  reorder: (items: { id: number; sort_order: number }[]) =>
    apiRequest('/tour-tabs/reorder', {
      method: 'POST',
      body: JSON.stringify({ items }),
    }),

  getConditionOptions: () =>
    apiRequest<TourTabConditionOptions>('/tour-tabs/condition-options'),

  preview: (id: number, limit?: number) => {
    const params = limit ? `?limit=${limit}` : '';
    return apiRequest<{
      tours: Array<{
        id: number;
        title: string;
        tour_code: string;
        country: string;
        days: number;
        nights: number;
        price: number | null;
        departure_date: string | null;
        image_url: string | null;
      }>;
      total: number;
      conditions: TourTabCondition[] | null;
      sort_by: string;
    }>(`/tour-tabs/${id}/preview${params}`);
  },

  previewConditions: (data: {
    conditions?: TourTabCondition[];
    sort_by?: string;
    display_limit?: number;
  }) =>
    apiRequest<{
      tours: Array<{
        id: number;
        title: string;
        tour_code: string;
        country: string;
        days: number;
        nights: number;
        price: number | null;
        departure_date: string | null;
        image_url: string | null;
        view_count: number;
      }>;
      total: number;
      conditions: TourTabCondition[] | null;
      sort_by: string;
    }>('/tour-tabs/preview-conditions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ===================== Recommended Tours API =====================

export const recommendedToursApi = {
  list: async (params?: { search?: string; is_active?: boolean }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append('search', params.search);
    if (params?.is_active !== undefined) searchParams.append('is_active', params.is_active ? '1' : '0');
    return apiRequest<RecommendedTourSection[]>(`/recommended-tours?${searchParams.toString()}`);
  },

  get: (id: number) =>
    apiRequest<RecommendedTourSection>(`/recommended-tours/${id}`),

  create: (data: Partial<RecommendedTourSection>) =>
    apiRequest<RecommendedTourSection>('/recommended-tours', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<RecommendedTourSection>) =>
    apiRequest<RecommendedTourSection>(`/recommended-tours/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    apiRequest<void>(`/recommended-tours/${id}`, { method: 'DELETE' }),

  toggleStatus: (id: number) =>
    apiRequest<RecommendedTourSection>(`/recommended-tours/${id}/toggle-status`, { method: 'PATCH' }),

  reorder: (items: Array<{ id: number; sort_order: number }>) =>
    apiRequest<void>('/recommended-tours/reorder', {
      method: 'POST',
      body: JSON.stringify({ items }),
    }),

  getConditionOptions: () =>
    apiRequest<RecommendedTourConditionOptions>('/recommended-tours/condition-options'),

  getSettings: () =>
    apiRequest<RecommendedTourSettings>('/recommended-tours/settings'),

  updateSettings: (data: Partial<RecommendedTourSettings>) =>
    apiRequest<RecommendedTourSettings>('/recommended-tours/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  preview: (id: number) =>
    apiRequest<{
      section: RecommendedTourSection;
      tours: Array<{
        id: number;
        title: string;
        tour_code: string;
        country: { id: number; name: string; iso2?: string };
        days: number;
        nights: number;
        price: number | null;
        departure_date: string | null;
        image_url: string | null;
      }>;
      total: number;
    }>(`/recommended-tours/${id}/preview`),

  previewConditions: (data: {
    conditions?: TourTabCondition[];
    display_limit?: number;
    sort_by?: string;
  }) =>
    apiRequest<{
      tours: Array<{
        id: number;
        title: string;
        tour_code: string;
        country: { id: number; name: string; iso2?: string };
        days: number;
        nights: number;
        price: number | null;
        departure_date: string | null;
        image_url: string | null;
      }>;
      total: number;
    }>('/recommended-tours/preview-conditions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ===================== Dashboard API =====================

export interface DashboardStats {
  total_wholesalers: number;
  active_wholesalers: number;
  total_tours: number;
  published_tours: number;
  total_periods: number;
  upcoming_periods: number;
  today_syncs: number;
  success_syncs: number;
  failed_syncs: number;
}

export interface WholesalerStat {
  id: number;
  name: string;
  code: string;
  logo_url: string | null;
  tours_count: number;
  is_active: boolean;
}

export interface RecentSync {
  id: number;
  wholesaler_name: string;
  wholesaler_code: string;
  wholesaler_logo: string | null;
  status: string;
  sync_type: string;
  tours_received: number;
  tours_created: number;
  tours_updated: number;
  tours_failed: number;
  started_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
}

export interface DashboardSummary {
  stats: DashboardStats;
  tours_per_wholesaler: WholesalerStat[];
  recent_syncs: RecentSync[];
}

export const dashboardApi = {
  getSummary: () =>
    apiRequest<DashboardSummary>('/dashboard/summary'),
};

// ============================================================
// System Settings API (Global Settings)
// ============================================================
export interface SystemSettingValue {
  value: boolean | string | number | string[];
  type: 'boolean' | 'string' | 'integer' | 'json' | 'array';
  description: string;
}

export interface SystemSettings {
  sync: Record<string, SystemSettingValue>;
  auto_close: Record<string, SystemSettingValue>;
  [key: string]: Record<string, SystemSettingValue>;
}

export interface SyncSettings {
  respect_manual_overrides: boolean;
  always_sync_fields: string[];
  never_sync_fields: string[];
  skip_past_periods: boolean;
  skip_disabled_tours: boolean;
}

export interface AutoCloseSettings {
  enabled: boolean;
  periods: boolean;
  tours: boolean;
  threshold_days: number;
  run_time: string;
}

// Footer Config
export interface FooterFeature {
  icon: string;
  label: string;
}

export interface FooterConfig {
  newsletter_title: string;
  newsletter_show: boolean;
  scam_warning_title: string;
  scam_warning_text: string;
  scam_warning_show: boolean;
  company_description: string;
  license_number: string;
  line_id: string;
  line_url: string;
  line_qr_image: string;
  col1_title: string;
  col2_title: string;
  col3_title: string;
  features: FooterFeature[];
}

export const footerSettingsApi = {
  get: () =>
    apiRequest<FooterConfig>('/settings/footer'),
  update: (data: Partial<FooterConfig>) =>
    apiRequest<FooterConfig>('/settings/footer', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  uploadQrImage: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const response = await fetch(`${API_BASE_URL}/settings/footer/upload-qr`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    return response.json() as Promise<ApiResponse<{ line_qr_image: string }>>;
  },
};

// ==================== Why Choose Us ====================

export interface WhyChooseUsItem {
  icon: string;
  title: string;
  description: string;
}

export interface WhyChooseUsConfig {
  title: string;
  subtitle: string;
  show: boolean;
  items: WhyChooseUsItem[];
}

export const whyChooseUsApi = {
  get: () =>
    apiRequest<WhyChooseUsConfig>('/settings/why-choose-us'),
  update: (data: Partial<WhyChooseUsConfig>) =>
    apiRequest<WhyChooseUsConfig>('/settings/why-choose-us', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// ==================== Subscribers & Newsletters ====================

export interface Subscriber {
  id: number;
  email: string;
  status: 'pending' | 'active' | 'unsubscribed';
  source_page: string | null;
  interest_country: string | null;
  confirmed_at: string | null;
  subscribed_at: string | null;
  unsubscribed_at: string | null;
  ip_address: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriberStats {
  total: number;
  active: number;
  pending: number;
  unsubscribed: number;
  new_this_month: number;
  sources: Record<string, number>;
}

export interface NewsletterItem {
  id: number;
  subject: string;
  content_html: string;
  content_text: string | null;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';
  template: string;
  scheduled_at: string | null;
  sent_at: string | null;
  expires_at: string | null;
  recipient_filter: { type?: string; country?: string; subscriber_ids?: number[] } | null;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  opened_count: number;
  batch_size: number;
  batch_delay_seconds: number;
  created_at: string;
  updated_at: string;
}

export interface SubscriberSmtpConfig {
  host: string;
  port: number;
  encryption: string;
  username: string;
  password?: string;
  password_masked?: string;
  has_password?: boolean;
  from_address: string;
  from_name: string;
  reply_to: string;
  enabled: boolean;
}

export const subscriberApi = {
  // Subscriber CRUD
  list: (params?: Record<string, string | number>) => {
    const query = params ? '?' + new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString() : '';
    return apiRequest<Subscriber[]>(`/subscribers${query}`);
  },
  stats: () =>
    apiRequest<SubscriberStats>('/subscribers/stats'),
  show: (id: number) =>
    apiRequest<Subscriber>(`/subscribers/${id}`),
  destroy: (id: number) =>
    apiRequest<void>(`/subscribers/${id}`, { method: 'DELETE' }),

  // Newsletter CRUD
  newsletters: (params?: Record<string, string | number>) => {
    const query = params ? '?' + new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString() : '';
    return apiRequest<NewsletterItem[]>(`/newsletters${query}`);
  },
  createNewsletter: (data: Partial<NewsletterItem>) =>
    apiRequest<NewsletterItem>('/newsletters', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  showNewsletter: (id: number) =>
    apiRequest<NewsletterItem>(`/newsletters/${id}`),
  updateNewsletter: (id: number, data: Partial<NewsletterItem>) =>
    apiRequest<NewsletterItem>(`/newsletters/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteNewsletter: (id: number) =>
    apiRequest<void>(`/newsletters/${id}`, { method: 'DELETE' }),
  sendNewsletter: (id: number) =>
    apiRequest<NewsletterItem>(`/newsletters/${id}/send`, { method: 'POST' }),
  cancelNewsletter: (id: number) =>
    apiRequest<void>(`/newsletters/${id}/cancel`, { method: 'POST' }),
  previewCount: (filter: Record<string, unknown>) =>
    apiRequest<{ count: number }>('/newsletters/preview-count', {
      method: 'POST',
      body: JSON.stringify({ recipient_filter: filter }),
    }),

  // Subscriber SMTP
  getSmtp: () =>
    apiRequest<SubscriberSmtpConfig>('/settings/subscriber-smtp'),
  updateSmtp: (data: Partial<SubscriberSmtpConfig>) =>
    apiRequest<void>('/settings/subscriber-smtp', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  testSmtp: (toEmail: string) =>
    apiRequest<void>('/settings/subscriber-smtp/test', {
      method: 'POST',
      body: JSON.stringify({ to_email: toEmail }),
    }),
};

export const systemSettingsApi = {
  // Get all settings grouped
  getAll: () =>
    apiRequest<SystemSettings>('/system-settings'),

  // Get settings by group
  getByGroup: (group: string) =>
    apiRequest<Record<string, unknown>>(`/system-settings/group/${group}`),

  // Get sync settings
  getSyncSettings: () =>
    apiRequest<SyncSettings>('/system-settings/sync'),

  // Update sync settings
  updateSyncSettings: (data: Partial<SyncSettings>) =>
    apiRequest<SyncSettings>('/system-settings/sync', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Get auto-close settings
  getAutoCloseSettings: () =>
    apiRequest<AutoCloseSettings>('/system-settings/auto-close'),

  // Update auto-close settings
  updateAutoCloseSettings: (data: Partial<AutoCloseSettings>) =>
    apiRequest<AutoCloseSettings>('/system-settings/auto-close', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Run auto-close manually
  runAutoClose: () =>
    apiRequest<{
      periods_closed: number;
      tours_closed: number;
      threshold_date: string;
    }>('/system-settings/auto-close/run', {
      method: 'POST',
    }),

  // Update a single setting
  update: (key: string, value: unknown, type?: string) =>
    apiRequest('/system-settings', {
      method: 'PUT',
      body: JSON.stringify({ key, value, type }),
    }),

  // Clear settings cache
  clearCache: () =>
    apiRequest('/system-settings/clear-cache', {
      method: 'POST',
    }),
};

// ===================== International Tour Settings Types =====================

export interface InternationalTourSetting {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
  cover_image_cf_id: string | null;
  cover_image_position: string;
  conditions: TourTabCondition[] | null;
  display_limit: number;
  per_page: number;
  sort_by: string;
  show_periods: boolean;
  max_periods_display: number;
  show_transport: boolean;
  show_hotel_star: boolean;
  show_meal_count: boolean;
  show_commission: boolean;
  filter_country: boolean;
  filter_city: boolean;
  filter_search: boolean;
  filter_airline: boolean;
  filter_departure_month: boolean;
  filter_price_range: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface InternationalTourConditionOptions {
  condition_types: Record<string, string>;
  sort_options: Record<string, string>;
  countries: Array<{ id: number; name_th: string; name_en: string; iso2: string; region: string }>;
  regions: Record<string, string>;
  wholesalers: Array<{ id: number; name: string; code: string }>;
  tour_types: Record<string, string>;
  airlines: Array<{ id: number; code: string; name: string; image: string | null }>;
}

export interface InternationalTourPreview {
  total_count: number;
  preview_tours: Array<{
    id: number;
    title: string;
    tour_code: string;
    country: { id: number; name: string; iso2: string } | null;
    days: number;
    nights: number;
    price: number | null;
    departure_date: string | null;
    image_url: string | null;
  }>;
}

export const internationalTourSettingsApi = {
  // List all settings
  list: () =>
    apiRequest<{ data: InternationalTourSetting[] }>('/international-tour-settings'),

  // Get single setting
  get: (id: number) =>
    apiRequest<{ data: InternationalTourSetting }>(`/international-tour-settings/${id}`),

  // Create setting
  create: (data: Partial<InternationalTourSetting>) =>
    apiRequest<{ data: InternationalTourSetting }>('/international-tour-settings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Update setting
  update: (id: number, data: Partial<InternationalTourSetting>) =>
    apiRequest<{ data: InternationalTourSetting }>(`/international-tour-settings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Delete setting
  delete: (id: number) =>
    apiRequest(`/international-tour-settings/${id}`, {
      method: 'DELETE',
    }),

  // Toggle active status
  toggleStatus: (id: number) =>
    apiRequest<{ data: InternationalTourSetting }>(`/international-tour-settings/${id}/toggle-status`, {
      method: 'PATCH',
    }),

  // Get condition options
  getConditionOptions: () =>
    apiRequest<InternationalTourConditionOptions>('/international-tour-settings/condition-options'),

  // Preview conditions
  previewConditions: (data: { conditions: TourTabCondition[]; sort_by?: string; display_limit?: number }) =>
    apiRequest<InternationalTourPreview>('/international-tour-settings/preview-conditions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Upload cover image
  uploadCoverImage: (id: number, file: File) => {
    const formData = new FormData();
    formData.append('cover_image', file);
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    return fetch(`${API_BASE_URL}/international-tour-settings/${id}/cover-image`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    }).then(res => res.json()) as Promise<ApiResponse<{ data: InternationalTourSetting }>>;
  },

  // Delete cover image
  deleteCoverImage: (id: number) =>
    apiRequest<{ data: InternationalTourSetting }>(`/international-tour-settings/${id}/cover-image`, {
      method: 'DELETE',
    }),
};

// =====================
// Domestic Tour Settings (Admin)
// =====================

export interface DomesticTourSetting {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
  cover_image_cf_id: string | null;
  cover_image_position: string;
  conditions: TourTabCondition[] | null;
  display_limit: number;
  per_page: number;
  sort_by: string;
  show_periods: boolean;
  max_periods_display: number;
  show_transport: boolean;
  show_hotel_star: boolean;
  show_meal_count: boolean;
  show_commission: boolean;
  filter_search: boolean;
  filter_city: boolean;
  filter_airline: boolean;
  filter_departure_month: boolean;
  filter_price_range: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DomesticTourConditionOptions {
  condition_types: Record<string, string>;
  sort_options: Record<string, string>;
  wholesalers: Array<{ id: number; name: string; code: string }>;
  tour_types: Record<string, string>;
  airlines: Array<{ id: number; code: string; name: string; image: string | null }>;
}

export interface DomesticTourPreview {
  total_count: number;
  preview_tours: Array<{
    id: number;
    title: string;
    tour_code: string;
    country: { id: number; name: string; iso2: string } | null;
    days: number;
    nights: number;
    price: number | null;
    departure_date: string | null;
    image_url: string | null;
  }>;
}

export const domesticTourSettingsApi = {
  list: () =>
    apiRequest<{ data: DomesticTourSetting[] }>('/domestic-tour-settings'),

  get: (id: number) =>
    apiRequest<{ data: DomesticTourSetting }>(`/domestic-tour-settings/${id}`),

  create: (data: Partial<DomesticTourSetting>) =>
    apiRequest<{ data: DomesticTourSetting }>('/domestic-tour-settings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<DomesticTourSetting>) =>
    apiRequest<{ data: DomesticTourSetting }>(`/domestic-tour-settings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    apiRequest(`/domestic-tour-settings/${id}`, {
      method: 'DELETE',
    }),

  toggleStatus: (id: number) =>
    apiRequest<{ data: DomesticTourSetting }>(`/domestic-tour-settings/${id}/toggle-status`, {
      method: 'PATCH',
    }),

  getConditionOptions: () =>
    apiRequest<DomesticTourConditionOptions>('/domestic-tour-settings/condition-options'),

  previewConditions: (data: { conditions: TourTabCondition[]; sort_by?: string; display_limit?: number }) =>
    apiRequest<DomesticTourPreview>('/domestic-tour-settings/preview-conditions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  uploadCoverImage: (id: number, file: File) => {
    const formData = new FormData();
    formData.append('cover_image', file);
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    return fetch(`${API_BASE_URL}/domestic-tour-settings/${id}/cover-image`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    }).then(res => res.json()) as Promise<ApiResponse<{ data: DomesticTourSetting }>>;
  },

  deleteCoverImage: (id: number) =>
    apiRequest<{ data: DomesticTourSetting }>(`/domestic-tour-settings/${id}/cover-image`, {
      method: 'DELETE',
    }),
};

// =====================
// Tour Reviews (Admin)
// =====================

export interface TourReviewAdmin {
  id: number;
  tour_id: number;
  user_id: number | null;
  order_id: number | null;
  reviewer_name: string;
  reviewer_avatar_url: string | null;
  rating: number;
  category_ratings: Record<string, number> | null;
  tags: string[] | null;
  comment: string;
  review_source: 'self' | 'assisted' | 'internal';
  tour_type: 'individual' | 'private' | 'corporate';
  approved_by_customer: boolean;
  approval_screenshot_url: string | null;
  assisted_by_admin_id: number | null;
  status: 'pending' | 'approved' | 'rejected';
  moderated_by: number | null;
  moderated_at: string | null;
  rejection_reason: string | null;
  admin_reply: string | null;
  replied_by: number | null;
  replied_at: string | null;
  incentive_type: string | null;
  incentive_value: number | null;
  incentive_claimed: boolean;
  is_featured: boolean;
  helpful_count: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
  tour?: { id: number; title: string; slug: string; tour_code?: string; cover_image_url?: string } | null;
  user?: { id: number; first_name: string; last_name: string; avatar?: string } | null;
  moderator?: { id: number; name: string } | null;
  replier?: { id: number; name: string } | null;
  assistedByAdmin?: { id: number; name: string } | null;
  images?: ReviewImageItem[];
}

export interface ReviewImageItem {
  id: number;
  tour_review_id: number;
  image_url: string;
  thumbnail_url: string | null;
  sort_order: number;
}

export interface ReviewStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  featured: number;
}

export interface ReviewTagAdmin {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  usage_count: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const tourReviewApi = {
  list: (params?: Record<string, string | number>) =>
    apiRequest<any>(`/tour-reviews${params ? '?' + new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString() : ''}`),

  show: (id: number) =>
    apiRequest<{ data: TourReviewAdmin }>(`/tour-reviews/${id}`),

  createAssisted: (formData: FormData) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    return fetch(`${API_BASE_URL}/tour-reviews/assisted`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    }).then(res => res.json()) as Promise<ApiResponse<{ data: TourReviewAdmin }>>;
  },

  update: (id: number, formData: FormData) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    return fetch(`${API_BASE_URL}/tour-reviews/${id}/update`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    }).then(res => res.json()) as Promise<ApiResponse<{ data: TourReviewAdmin }>>;
  },

  approve: (id: number) =>
    apiRequest<{ data: TourReviewAdmin }>(`/tour-reviews/${id}/approve`, {
      method: 'PATCH',
    }),

  reject: (id: number, reason: string) =>
    apiRequest<{ data: TourReviewAdmin }>(`/tour-reviews/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ rejection_reason: reason }),
    }),

  reply: (id: number, replyText: string) =>
    apiRequest<{ data: TourReviewAdmin }>(`/tour-reviews/${id}/reply`, {
      method: 'POST',
      body: JSON.stringify({ admin_reply: replyText }),
    }),

  toggleFeatured: (id: number) =>
    apiRequest<{ data: TourReviewAdmin }>(`/tour-reviews/${id}/toggle-featured`, {
      method: 'PATCH',
    }),

  bulkApprove: (ids: number[]) =>
    apiRequest<any>('/tour-reviews/bulk-approve', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),

  delete: (id: number) =>
    apiRequest<any>(`/tour-reviews/${id}`, {
      method: 'DELETE',
    }),
};

export const reviewTagApi = {
  list: (params?: Record<string, string | number>) =>
    apiRequest<{ data: ReviewTagAdmin[] }>(`/admin/review-tags${params ? '?' + new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString() : ''}`),

  create: (data: Record<string, unknown>) =>
    apiRequest<{ data: ReviewTagAdmin }>('/admin/review-tags', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Record<string, unknown>) =>
    apiRequest<{ data: ReviewTagAdmin }>(`/admin/review-tags/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    apiRequest<any>(`/admin/review-tags/${id}`, {
      method: 'DELETE',
    }),

  toggle: (id: number) =>
    apiRequest<{ data: ReviewTagAdmin }>(`/admin/review-tags/${id}/toggle`, {
      method: 'PATCH',
    }),

  reorder: (ids: number[]) =>
    apiRequest<any>('/admin/review-tags/reorder', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),
};

// =====================
// Festival Holidays
// =====================

export interface FestivalHoliday {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  start_date: string;
  end_date: string;
  image_url: string | null;
  image_cf_id: string | null;
  cover_image_url: string | null;
  cover_image_cf_id: string | null;
  cover_image_position: string;
  badge_text: string | null;
  badge_color: string;
  badge_icon: string | null;
  display_modes: string[];
  is_active: boolean;
  sort_order: number;
  tour_count?: number;
  created_at: string;
  updated_at: string;
}

export interface FestivalHolidayPreview {
  total_count: number;
  preview_tours: Array<{
    id: number;
    title: string;
    tour_code: string;
    country: { id: number; name: string; iso2: string } | null;
    days: number;
    nights: number;
    price: number | null;
    departure_date: string | null;
    image_url: string | null;
  }>;
}

export const festivalHolidaysApi = {
  list: () =>
    apiRequest<{ data: FestivalHoliday[] }>('/festival-holidays'),

  get: (id: number) =>
    apiRequest<{ data: FestivalHoliday }>(`/festival-holidays/${id}`),

  create: (data: Partial<FestivalHoliday>) =>
    apiRequest<{ data: FestivalHoliday }>('/festival-holidays', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<FestivalHoliday>) =>
    apiRequest<{ data: FestivalHoliday }>(`/festival-holidays/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    apiRequest<any>(`/festival-holidays/${id}`, {
      method: 'DELETE',
    }),

  toggleStatus: (id: number) =>
    apiRequest<{ data: FestivalHoliday }>(`/festival-holidays/${id}/toggle-status`, {
      method: 'PATCH',
    }),

  uploadImage: (id: number, file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    return fetch(`${API_BASE_URL}/festival-holidays/${id}/image`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    }).then(res => res.json()) as Promise<ApiResponse<{ data: FestivalHoliday }>>;
  },

  deleteImage: (id: number) =>
    apiRequest<{ data: FestivalHoliday }>(`/festival-holidays/${id}/image`, {
      method: 'DELETE',
    }),

  uploadCoverImage: (id: number, file: File) => {
    const formData = new FormData();
    formData.append('cover_image', file);
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    return fetch(`${API_BASE_URL}/festival-holidays/${id}/cover-image`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    }).then(res => res.json()) as Promise<ApiResponse<{ data: FestivalHoliday }>>;
  },

  deleteCoverImage: (id: number) =>
    apiRequest<{ data: FestivalHoliday }>(`/festival-holidays/${id}/cover-image`, {
      method: 'DELETE',
    }),

  previewTours: (id: number) =>
    apiRequest<FestivalHolidayPreview>(`/festival-holidays/${id}/preview`),
};

// Festival Page Settings (cover image for listing page)
export interface FestivalPageSetting {
  id: number;
  cover_image_url: string | null;
  cover_image_cf_id: string | null;
  cover_image_position: string;
  created_at: string;
  updated_at: string;
}

export const festivalPageSettingsApi = {
  get: () =>
    apiRequest<{ data: FestivalPageSetting }>('/festival-page-settings'),

  update: (data: Partial<FestivalPageSetting>) =>
    apiRequest<{ data: FestivalPageSetting }>('/festival-page-settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  uploadCoverImage: (file: File) => {
    const formData = new FormData();
    formData.append('cover_image', file);
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    return fetch(`${API_BASE_URL}/festival-page-settings/cover-image`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    }).then(res => res.json()) as Promise<ApiResponse<{ data: FestivalPageSetting }>>;
  },

  deleteCoverImage: () =>
    apiRequest<{ data: FestivalPageSetting }>('/festival-page-settings/cover-image', {
      method: 'DELETE',
    }),
};

// =====================
// Tour Packages
// =====================

export interface TourPackage {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  terms: string | null;
  remarks: string | null;
  cancellation_policy: string | null;
  inclusions: string[] | null;
  exclusions: string[] | null;
  timeline: Array<{ day_number: number; detail: string }> | null;
  image_url: string | null;
  image_cf_id: string | null;
  pdf_url: string | null;
  pdf_path: string | null;
  hashtags: string[] | null;
  expires_at: string | null;
  is_never_expire: boolean;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  is_active: boolean;
  sort_order: number;
  countries?: Array<{ id: number; name_th: string; iso2: string; slug: string }>;
  created_at: string;
  updated_at: string;
}

export const tourPackagesApi = {
  list: () =>
    apiRequest<{ data: TourPackage[] }>('/tour-packages'),

  get: (id: number) =>
    apiRequest<{ data: TourPackage }>(`/tour-packages/${id}`),

  create: (data: Partial<TourPackage> & { country_ids?: number[] }) =>
    apiRequest<{ data: TourPackage }>('/tour-packages', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<TourPackage> & { country_ids?: number[] }) =>
    apiRequest<{ data: TourPackage }>(`/tour-packages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    apiRequest<any>(`/tour-packages/${id}`, {
      method: 'DELETE',
    }),

  toggleStatus: (id: number) =>
    apiRequest<{ data: TourPackage }>(`/tour-packages/${id}/toggle-status`, {
      method: 'PATCH',
    }),

  uploadImage: (id: number, file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    return fetch(`${API_BASE_URL}/tour-packages/${id}/image`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    }).then(res => res.json()) as Promise<ApiResponse<{ data: TourPackage }>>;
  },

  deleteImage: (id: number) =>
    apiRequest<{ data: TourPackage }>(`/tour-packages/${id}/image`, {
      method: 'DELETE',
    }),

  uploadPdf: (id: number, file: File) => {
    const formData = new FormData();
    formData.append('pdf', file);
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    return fetch(`${API_BASE_URL}/tour-packages/${id}/pdf`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    }).then(res => res.json()) as Promise<ApiResponse<{ data: TourPackage }>>;
  },

  deletePdf: (id: number) =>
    apiRequest<{ data: TourPackage }>(`/tour-packages/${id}/pdf`, {
      method: 'DELETE',
    }),
};

// Tour Package Page Settings
export interface TourPackagePageSetting {
  id: number;
  cover_image_url: string | null;
  cover_image_cf_id: string | null;
  cover_image_position: string;
  created_at: string;
  updated_at: string;
}

export const tourPackagePageSettingsApi = {
  get: () =>
    apiRequest<{ data: TourPackagePageSetting }>('/tour-package-page-settings'),

  update: (data: Partial<TourPackagePageSetting>) =>
    apiRequest<{ data: TourPackagePageSetting }>('/tour-package-page-settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  uploadCoverImage: (file: File) => {
    const formData = new FormData();
    formData.append('cover_image', file);
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    return fetch(`${API_BASE_URL}/tour-package-page-settings/cover-image`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    }).then(res => res.json()) as Promise<ApiResponse<{ data: TourPackagePageSetting }>>;
  },

  deleteCoverImage: () =>
    apiRequest<{ data: TourPackagePageSetting }>('/tour-package-page-settings/cover-image', {
      method: 'DELETE',
    }),
};

// ===================== Group Tours =====================

export interface GroupTourPageSettings {
  id: number;
  hero_title: string;
  hero_subtitle: string | null;
  hero_image_url: string | null;
  hero_image_cf_id: string | null;
  hero_image_position: string;
  content: string | null;
  stats: Array<{ icon: string; value: string; label: string }> | null;
  group_types: Array<{ icon: string; title: string; description: string }> | null;
  advantages_title: string;
  advantages_image_url: string | null;
  advantages_image_cf_id: string | null;
  advantages: Array<{ text: string }> | null;
  process_steps: Array<{ step_number: number; title: string; description: string }> | null;
  faqs: Array<{ question: string; answer: string }> | null;
  cta_title: string;
  cta_description: string | null;
  cta_phone: string | null;
  cta_email: string | null;
  cta_line_id: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  is_active: boolean;
  // Testimonial display settings
  testimonial_title: string;
  testimonial_subtitle: string | null;
  testimonial_limit: number;
  testimonial_pinned_ids: number[] | null;
  testimonial_show_section: boolean;
  testimonial_tour_types: string[] | null;
  testimonial_sort_by: string;
  testimonial_min_rating: number;
}

export interface GroupTourPortfolio {
  id: number;
  title: string;
  caption: string | null;
  group_size: string | null;
  destination: string | null;
  image_url: string | null;
  image_cf_id: string | null;
  logo_url: string | null;
  logo_cf_id: string | null;
  group_type: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface GroupTourInquiry {
  id: number;
  name: string;
  organization: string | null;
  phone: string | null;
  email: string | null;
  line_id: string | null;
  group_type: string | null;
  group_size: string | null;
  destination: string | null;
  travel_date_start: string | null;
  travel_date_end: string | null;
  details: string | null;
  status: 'new' | 'contacted' | 'quoted' | 'confirmed' | 'cancelled';
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export const groupTourSettingsApi = {
  get: () =>
    apiRequest<{ data: GroupTourPageSettings }>('/group-tour-settings'),

  update: (data: Partial<GroupTourPageSettings>) =>
    apiRequest<{ data: GroupTourPageSettings }>('/group-tour-settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  uploadHeroImage: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const response = await fetch(`${API_BASE_URL}/group-tour-settings/hero-image`, {
      method: 'POST',
      headers: { 'Accept': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
      body: formData,
    });
    const responseData = await response.json();
    if (!response.ok) {
      throw new Error(responseData.message || 'Upload failed');
    }
    return responseData as { success: boolean; data: GroupTourPageSettings; message: string };
  },

  deleteHeroImage: () =>
    apiRequest('/group-tour-settings/hero-image', { method: 'DELETE' }),

  uploadAdvantagesImage: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const response = await fetch(`${API_BASE_URL}/group-tour-settings/advantages-image`, {
      method: 'POST',
      headers: { 'Accept': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
      body: formData,
    });
    const responseData = await response.json();
    if (!response.ok) {
      throw new Error(responseData.message || 'Upload failed');
    }
    return responseData as { success: boolean; data: GroupTourPageSettings; message: string };
  },

  deleteAdvantagesImage: () =>
    apiRequest('/group-tour-settings/advantages-image', { method: 'DELETE' }),
};

export const groupTourPortfoliosApi = {
  list: () =>
    apiRequest<{ data: GroupTourPortfolio[] }>('/group-tour-portfolios'),

  create: (data: Partial<GroupTourPortfolio>) =>
    apiRequest<{ data: GroupTourPortfolio }>('/group-tour-portfolios', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<GroupTourPortfolio>) =>
    apiRequest<{ data: GroupTourPortfolio }>(`/group-tour-portfolios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    apiRequest(`/group-tour-portfolios/${id}`, { method: 'DELETE' }),

  reorder: (items: { id: number; sort_order: number }[]) =>
    apiRequest<{ data: GroupTourPortfolio[] }>('/group-tour-portfolios/reorder', {
      method: 'POST',
      body: JSON.stringify({ items }),
    }),

  uploadImage: (id: number, file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    return fetch(`${API_BASE_URL}/group-tour-portfolios/${id}/image`, {
      method: 'POST',
      headers: { 'Accept': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
      body: formData,
    }).then(res => res.json()) as Promise<ApiResponse<{ data: GroupTourPortfolio }>>;
  },

  uploadLogo: (id: number, file: File) => {
    const formData = new FormData();
    formData.append('logo', file);
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    return fetch(`${API_BASE_URL}/group-tour-portfolios/${id}/logo`, {
      method: 'POST',
      headers: { 'Accept': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
      body: formData,
    }).then(res => res.json()) as Promise<ApiResponse<{ data: GroupTourPortfolio }>>;
  },

  deleteLogo: (id: number) =>
    apiRequest(`/group-tour-portfolios/${id}/logo`, { method: 'DELETE' }),
};

export const groupTourInquiriesApi = {
  countNew: () =>
    apiRequest<{ count: number }>('/group-tour-inquiries/count-new'),

  list: (params?: { status?: string; search?: string; page?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.page) searchParams.append('page', String(params.page));
    const qs = searchParams.toString();
    return apiRequest<{ data: GroupTourInquiry[]; current_page: number; last_page: number; total: number }>(
      `/group-tour-inquiries${qs ? `?${qs}` : ''}`
    );
  },

  get: (id: number) =>
    apiRequest<{ data: GroupTourInquiry }>(`/group-tour-inquiries/${id}`),

  update: (id: number, data: { status?: string; admin_notes?: string }) =>
    apiRequest<{ data: GroupTourInquiry }>(`/group-tour-inquiries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    apiRequest(`/group-tour-inquiries/${id}`, { method: 'DELETE' }),
};

// ===================== Blog =====================

export interface BlogCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  posts_count?: number;
  created_at: string;
  updated_at: string;
}

export interface BlogPost {
  id: number;
  category_id: number | null;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  cover_image_url: string | null;
  cover_image_cf_id: string | null;
  author_name: string;
  author_avatar_url: string | null;
  status: 'draft' | 'published' | 'archived';
  is_featured: boolean;
  published_at: string | null;
  view_count: number;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  tags: string[] | null;
  reading_time_min: number | null;
  category?: { id: number; name: string; slug: string } | null;
  created_at: string;
  updated_at: string;
}

export const blogCategoriesApi = {
  list: () =>
    apiRequest<{ data: BlogCategory[] }>('/blog-categories'),

  create: (data: Partial<BlogCategory>) =>
    apiRequest<{ data: BlogCategory }>('/blog-categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<BlogCategory>) =>
    apiRequest<{ data: BlogCategory }>(`/blog-categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    apiRequest(`/blog-categories/${id}`, { method: 'DELETE' }),

  reorder: (items: { id: number; sort_order: number }[]) =>
    apiRequest<{ data: BlogCategory[] }>('/blog-categories/reorder', {
      method: 'POST',
      body: JSON.stringify({ items }),
    }),
};

export const blogPostsApi = {
  list: (params?: { status?: string; category_id?: number; search?: string; page?: number }) => {
    const sp = new URLSearchParams();
    if (params?.status) sp.append('status', params.status);
    if (params?.category_id) sp.append('category_id', String(params.category_id));
    if (params?.search) sp.append('search', params.search);
    if (params?.page) sp.append('page', String(params.page));
    const qs = sp.toString();
    return apiRequest<{ data: BlogPost[]; current_page: number; last_page: number; total: number }>(
      `/blog-posts${qs ? `?${qs}` : ''}`
    );
  },

  get: (id: number) =>
    apiRequest<{ data: BlogPost }>(`/blog-posts/${id}`),

  create: (data: Partial<BlogPost>) =>
    apiRequest<{ data: BlogPost }>('/blog-posts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<BlogPost>) =>
    apiRequest<{ data: BlogPost }>(`/blog-posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    apiRequest(`/blog-posts/${id}`, { method: 'DELETE' }),

  uploadCoverImage: async (id: number, file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const response = await fetch(`${API_BASE_URL}/blog-posts/${id}/cover-image`, {
      method: 'POST',
      headers: { 'Accept': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
      body: formData,
    });
    if (!response.ok) throw new Error('Upload failed');
    return response.json() as Promise<{ success: boolean; data: BlogPost; message: string }>;
  },

  deleteCoverImage: (id: number) =>
    apiRequest<{ data: BlogPost }>(`/blog-posts/${id}/cover-image`, { method: 'DELETE' }),
};

// ===================== Blog Page Settings =====================

export interface BlogPageSettings {
  id: number;
  hero_title: string;
  hero_subtitle: string | null;
  hero_image_url: string | null;
  hero_image_cf_id: string | null;
  hero_image_position: string;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const blogSettingsApi = {
  get: () =>
    apiRequest<{ data: BlogPageSettings }>('/blog-settings'),

  update: (data: Partial<BlogPageSettings>) =>
    apiRequest<{ data: BlogPageSettings }>('/blog-settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  uploadHeroImage: async (file: File) => {
    const token = localStorage.getItem('access_token');
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`${API_BASE_URL}/blog-settings/hero-image`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  },

  deleteHeroImage: () =>
    apiRequest<{ data: BlogPageSettings }>('/blog-settings/hero-image', { method: 'DELETE' }),
};

// ===================== About Page =====================

export interface AboutPageSettings {
  id: number;
  hero_title: string;
  hero_subtitle: string | null;
  hero_image_url: string | null;
  hero_image_cf_id: string | null;
  hero_image_position: string;
  about_title: string;
  about_content: string | null;
  highlights: { label: string; value: string; suffix?: string }[] | null;
  value_props: string[] | null;
  company_name: string | null;
  registration_no: string | null;
  capital: string | null;
  vat_no: string | null;
  tat_license: string | null;
  company_info_extra: string | null;
  license_image_url: string | null;
  license_image_cf_id: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AboutAssociation {
  id: number;
  name: string;
  license_no: string | null;
  logo_url: string | null;
  logo_cf_id: string | null;
  website_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AboutService {
  id: number;
  title: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AboutCustomerGroup {
  id: number;
  title: string;
  description: string | null;
  icon: string | null;
  image_url: string | null;
  image_cf_id: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AboutAward {
  id: number;
  title: string;
  description: string | null;
  year: string | null;
  image_url: string | null;
  image_cf_id: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const aboutSettingsApi = {
  get: () =>
    apiRequest<{ data: AboutPageSettings }>('/about-settings'),
  update: (data: Partial<AboutPageSettings>) =>
    apiRequest<{ data: AboutPageSettings }>('/about-settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  uploadHeroImage: async (file: File) => {
    const token = localStorage.getItem('access_token');
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`${API_BASE_URL}/about-settings/hero-image`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  },
  deleteHeroImage: () =>
    apiRequest<{ data: AboutPageSettings }>('/about-settings/hero-image', { method: 'DELETE' }),
  uploadLicenseImage: async (file: File) => {
    const token = localStorage.getItem('access_token');
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`${API_BASE_URL}/about-settings/license-image`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  },
  deleteLicenseImage: () =>
    apiRequest<{ data: AboutPageSettings }>('/about-settings/license-image', { method: 'DELETE' }),
};

export const aboutAssociationsApi = {
  list: () => apiRequest<{ data: AboutAssociation[] }>('/about-associations'),
  create: (data: Partial<AboutAssociation>) =>
    apiRequest<{ data: AboutAssociation }>('/about-associations', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<AboutAssociation>) =>
    apiRequest<{ data: AboutAssociation }>(`/about-associations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => apiRequest(`/about-associations/${id}`, { method: 'DELETE' }),
  uploadLogo: async (id: number, file: File) => {
    const token = localStorage.getItem('access_token');
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`${API_BASE_URL}/about-associations/${id}/logo`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  },
  reorder: (items: { id: number; sort_order: number }[]) =>
    apiRequest('/about-associations/reorder', { method: 'POST', body: JSON.stringify({ items }) }),
};

export const aboutServicesApi = {
  list: () => apiRequest<{ data: AboutService[] }>('/about-services'),
  create: (data: Partial<AboutService>) =>
    apiRequest<{ data: AboutService }>('/about-services', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<AboutService>) =>
    apiRequest<{ data: AboutService }>(`/about-services/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => apiRequest(`/about-services/${id}`, { method: 'DELETE' }),
  reorder: (items: { id: number; sort_order: number }[]) =>
    apiRequest('/about-services/reorder', { method: 'POST', body: JSON.stringify({ items }) }),
};

export const aboutCustomerGroupsApi = {
  list: () => apiRequest<{ data: AboutCustomerGroup[] }>('/about-customer-groups'),
  create: (data: Partial<AboutCustomerGroup>) =>
    apiRequest<{ data: AboutCustomerGroup }>('/about-customer-groups', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<AboutCustomerGroup>) =>
    apiRequest<{ data: AboutCustomerGroup }>(`/about-customer-groups/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => apiRequest(`/about-customer-groups/${id}`, { method: 'DELETE' }),
  uploadImage: async (id: number, file: File) => {
    const token = localStorage.getItem('access_token');
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`${API_BASE_URL}/about-customer-groups/${id}/image`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  },
  reorder: (items: { id: number; sort_order: number }[]) =>
    apiRequest('/about-customer-groups/reorder', { method: 'POST', body: JSON.stringify({ items }) }),
};

export const aboutAwardsApi = {
  list: () => apiRequest<{ data: AboutAward[] }>('/about-awards'),
  create: (data: Partial<AboutAward>) =>
    apiRequest<{ data: AboutAward }>('/about-awards', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<AboutAward>) =>
    apiRequest<{ data: AboutAward }>(`/about-awards/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => apiRequest(`/about-awards/${id}`, { method: 'DELETE' }),
  uploadImage: async (id: number, file: File) => {
    const token = localStorage.getItem('access_token');
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`${API_BASE_URL}/about-awards/${id}/image`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  },
  reorder: (items: { id: number; sort_order: number }[]) =>
    apiRequest('/about-awards/reorder', { method: 'POST', body: JSON.stringify({ items }) }),
};

// ─── Flash Sale Types & API ───

export interface FlashSale {
  id: number;
  title: string;
  description: string | null;
  banner_image_url: string | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  sort_order: number;
  items_count?: number;
  status_label?: string;
  items?: FlashSaleItem[];
  created_at: string;
  updated_at: string;
}

export interface FlashSaleItem {
  id: number;
  flash_sale_id: number;
  tour_id: number;
  flash_price: number | null;
  original_price: number | null;
  discount_percent: number | null;
  quantity_limit: number | null;
  quantity_sold: number;
  sort_order: number;
  is_active: boolean;
  tour?: {
    id: number;
    title: string;
    slug: string;
    tour_code: string;
    cover_image_url: string | null;
    min_price: number | null;
    price_adult: number | null;
    status: string;
  };
}

export interface FlashSaleTourSearch {
  id: number;
  title: string;
  slug: string;
  tour_code: string;
  cover_image_url: string | null;
  min_price: number | null;
  price_adult: number | null;
  max_discount_percent: number | null;
  status: string;
}

export const flashSalesApi = {
  list: (params?: { is_active?: boolean }) => {
    const searchParams = new URLSearchParams();
    if (params?.is_active !== undefined) searchParams.append('is_active', String(params.is_active));
    return apiRequest<{ data: FlashSale[] }>(`/flash-sales?${searchParams}`);
  },
  get: (id: number) =>
    apiRequest<{ data: FlashSale }>(`/flash-sales/${id}`),
  create: (data: Partial<FlashSale>) =>
    apiRequest<{ data: FlashSale }>('/flash-sales', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<FlashSale>) =>
    apiRequest<{ data: FlashSale }>(`/flash-sales/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) =>
    apiRequest(`/flash-sales/${id}`, { method: 'DELETE' }),
  toggleStatus: (id: number) =>
    apiRequest<{ data: FlashSale }>(`/flash-sales/${id}/toggle-status`, { method: 'PATCH' }),
  // Items
  addItem: (flashSaleId: number, data: { tour_id: number; flash_price?: number; quantity_limit?: number; sort_order?: number }) =>
    apiRequest<{ data: FlashSaleItem }>(`/flash-sales/${flashSaleId}/items`, { method: 'POST', body: JSON.stringify(data) }),
  updateItem: (flashSaleId: number, itemId: number, data: Partial<FlashSaleItem>) =>
    apiRequest<{ data: FlashSaleItem }>(`/flash-sales/${flashSaleId}/items/${itemId}`, { method: 'PUT', body: JSON.stringify(data) }),
  removeItem: (flashSaleId: number, itemId: number) =>
    apiRequest(`/flash-sales/${flashSaleId}/items/${itemId}`, { method: 'DELETE' }),
  reorderItems: (flashSaleId: number, items: { id: number; sort_order: number }[]) =>
    apiRequest(`/flash-sales/${flashSaleId}/items/reorder`, { method: 'POST', body: JSON.stringify({ items }) }),
  massUpdateDiscount: (flashSaleId: number, data: { discount_type: 'percent' | 'amount'; discount_value: number; item_ids?: number[] }) =>
    apiRequest<{ updated_count: number }>(`/flash-sales/${flashSaleId}/items/mass-update-discount`, { method: 'POST', body: JSON.stringify(data) }),
  // Search tours for selection
  searchTours: (q?: string) =>
    apiRequest<{ data: FlashSaleTourSearch[] }>(`/flash-sales-search-tours?q=${encodeURIComponent(q || '')}`),
};