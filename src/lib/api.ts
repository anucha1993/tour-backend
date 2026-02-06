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
  created_at: string;
  updated_at: string;
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
  is_published: boolean;
  published_at: string | null;
  // Sync fields
  data_source: 'api' | 'manual' | null;
  last_synced_at: string | null;
  sync_status: string | null;
  sync_locked: boolean;
  // Promotion fields
  promotion_type: 'none' | 'normal' | 'fire_sale' | null;
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

export const PROMOTION_TYPES: Record<string, string> = {
  'none': 'ไม่มีโปร',
  'normal': 'โปรโมชั่น',
  'fire_sale': 'โปรไฟไหม้',
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
  published: number;
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
  by_promotion_type: {
    fire_sale: number;
    normal: number;
    none: number;
  };
}

// Tours API
export const toursApi = {
  list: (params?: Record<string, string>) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value);
      });
    }
    return apiRequest<Tour[]>(`/tours?${searchParams.toString()}`);
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
  last_sync_at?: string;
  last_sync_status?: 'success' | 'failed' | 'partial';
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
    apiRequest<WholesalerApiConfig>(`/integrations/${id}/toggle-sync`, { method: 'POST' }),

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