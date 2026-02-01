import { Period } from './api';

// Thai month abbreviations
export const THAI_MONTHS = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

export const THAI_MONTHS_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

/**
 * Format date to Thai format: "1 ก.พ. 69"
 */
export function formatThaiDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = d.getDate();
  const month = THAI_MONTHS[d.getMonth()];
  const year = (d.getFullYear() + 543).toString().slice(-2);
  return `${day} ${month} ${year}`;
}

/**
 * Format date to Thai full format: "1 มกราคม 2569"
 */
export function formatThaiDateFull(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = d.getDate();
  const month = THAI_MONTHS_FULL[d.getMonth()];
  const year = d.getFullYear() + 543;
  return `${day} ${month} ${year}`;
}

/**
 * Format date to short format: "1/2/69"
 */
export function formatThaiDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = (d.getFullYear() + 543).toString().slice(-2);
  return `${day}/${month}/${year}`;
}

/**
 * Sort periods by start_date ascending
 */
export function sortPeriodsByDate(periods: Period[], order: 'asc' | 'desc' = 'asc'): Period[] {
  return [...periods].sort((a, b) => {
    const timeA = new Date(a.start_date).getTime();
    const timeB = new Date(b.start_date).getTime();
    return order === 'asc' ? timeA - timeB : timeB - timeA;
  });
}

/**
 * Get first and last period from sorted periods
 */
export function getFirstLastPeriods(periods: Period[]): { first: Period | null; last: Period | null } {
  if (!periods || periods.length === 0) {
    return { first: null, last: null };
  }
  const sorted = sortPeriodsByDate(periods);
  return {
    first: sorted[0],
    last: sorted[sorted.length - 1]
  };
}

/**
 * Get travel date range string: "1 ก.พ. 69 - 28 ก.พ. 69"
 */
export function getTravelDateRange(periods: Period[]): string | null {
  if (!periods || periods.length === 0) return null;
  
  const { first, last } = getFirstLastPeriods(periods);
  if (!first || !last) return null;
  
  const startStr = formatThaiDate(first.start_date);
  const endStr = formatThaiDate(last.start_date);
  
  return `${startStr} - ${endStr}`;
}

/**
 * Get upcoming periods (start_date >= today)
 */
export function getUpcomingPeriods(periods: Period[]): Period[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return periods.filter(p => new Date(p.start_date) >= today);
}

/**
 * Get past periods (start_date < today)
 */
export function getPastPeriods(periods: Period[]): Period[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return periods.filter(p => new Date(p.start_date) < today);
}

/**
 * Get visible periods only
 */
export function getVisiblePeriods(periods: Period[]): Period[] {
  return periods.filter(p => p.is_visible);
}

/**
 * Get available periods (visible + has seats + upcoming)
 */
export function getAvailablePeriods(periods: Period[]): Period[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return periods.filter(p => 
    p.is_visible && 
    p.available > 0 && 
    new Date(p.start_date) >= today &&
    p.sale_status !== 'sold_out'
  );
}

/**
 * Get cheapest period (lowest price_adult after discount)
 */
export function getCheapestPeriod(periods: Period[]): Period | null {
  const available = getAvailablePeriods(periods);
  if (available.length === 0) return null;
  
  return available.reduce((cheapest, current) => {
    const cheapestPrice = cheapest.offer?.discount_adult && Number(cheapest.offer.discount_adult) > 0
      ? Number(cheapest.offer.discount_adult)
      : Number(cheapest.offer?.price_adult || Infinity);
    
    const currentPrice = current.offer?.discount_adult && Number(current.offer.discount_adult) > 0
      ? Number(current.offer.discount_adult)
      : Number(current.offer?.price_adult || Infinity);
    
    return currentPrice < cheapestPrice ? current : cheapest;
  });
}

/**
 * Get period summary stats
 */
export function getPeriodStats(periods: Period[]): {
  total: number;
  visible: number;
  hidden: number;
  upcoming: number;
  past: number;
  available: number;
  soldOut: number;
  totalSeats: number;
  totalBooked: number;
  totalAvailable: number;
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return {
    total: periods.length,
    visible: periods.filter(p => p.is_visible).length,
    hidden: periods.filter(p => !p.is_visible).length,
    upcoming: periods.filter(p => new Date(p.start_date) >= today).length,
    past: periods.filter(p => new Date(p.start_date) < today).length,
    available: periods.filter(p => p.sale_status === 'available' && p.available > 0).length,
    soldOut: periods.filter(p => p.sale_status === 'sold_out' || p.available === 0).length,
    totalSeats: periods.reduce((sum, p) => sum + p.capacity, 0),
    totalBooked: periods.reduce((sum, p) => sum + p.booked, 0),
    totalAvailable: periods.reduce((sum, p) => sum + p.available, 0),
  };
}

/**
 * Format price with Thai Baht
 */
export function formatPrice(price: string | number | null | undefined): string {
  if (!price || price === '0' || price === '0.00') return '-';
  const num = typeof price === 'string' ? parseFloat(price) : price;
  return `฿${num.toLocaleString('th-TH')}`;
}

/**
 * Format price number only (no currency symbol)
 */
export function formatPriceNumber(price: string | number | null | undefined): string {
  if (!price || price === '0' || price === '0.00') return '-';
  const num = typeof price === 'string' ? parseFloat(price) : price;
  return num.toLocaleString('th-TH');
}
