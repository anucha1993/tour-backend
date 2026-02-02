'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Button } from '@/components/ui';
import { API_BASE_URL } from '@/lib/api';
import { 
  Search, 
  Filter, 
  Loader2, 
  Calendar, 
  MapPin, 
  Users, 
  ChevronDown,
  RefreshCw,
  X,
  Plane,
  Building2,
  FileText,
  Copy,
  Check,
  Clock,
  CheckSquare,
  Square,
  Download,
  AlertCircle,
} from 'lucide-react';

interface Period {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _raw: any; // Raw data from API - varies by wholesaler
  // Unified fields from backend transform
  external_id?: number;
  departure_date?: string;
  return_date?: string;
  price_adult?: number;
  price_child?: number;
  price_child_nobed?: number;
  deposit?: number;
  capacity?: number;
  available_seats?: number;
  available?: number;
  status?: string;
}

interface Tour {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _raw: any; // Raw data from API - varies by wholesaler
  // Unified fields from backend transform
  external_id?: number;
  title?: string;
  wholesaler_tour_code?: string;
  duration_days?: number | string;
  duration_nights?: number | string;
  primary_country_id?: string;
  transport_id?: string;
  // Meta fields
  periods?: Period[];
  _wholesaler_id: number;
  _wholesaler_name: string;
}

type DateSearchMode = 'month' | 'range' | 'exact';

interface SearchFilters {
  keyword: string;
  country: string;
  departure_from: string;
  departure_to: string;
  departure_month_from: string; // YYYY-MM format - start month
  departure_month_to: string; // YYYY-MM format - end month
  exact_departure: string;
  exact_return: string;
  date_search_mode: DateSearchMode;
  min_price: string;
  max_price: string;
  min_seats: string;
  wholesaler_id: number | null;
  _sort: string;
}

interface Wholesaler {
  id: number;
  name: string;
}

// Tour code lookup result
interface TourCodeLookup {
  synced: boolean;
  tour_id: number | null;
  tour_code: string | null;
  sync_status: string | null;
}

// Country list with Thai names
const COUNTRY_OPTIONS = [
  { value: '', label: 'ทั้งหมด', labelTh: 'ทั้งหมด' },
  { value: 'CHINA', label: 'จีน (China)', labelTh: 'จีน' },
  { value: 'JAPAN', label: 'ญี่ปุ่น (Japan)', labelTh: 'ญี่ปุ่น' },
  { value: 'KOREA', label: 'เกาหลี (Korea)', labelTh: 'เกาหลี' },
  { value: 'TAIWAN', label: 'ไต้หวัน (Taiwan)', labelTh: 'ไต้หวัน' },
  { value: 'VIETNAM', label: 'เวียดนาม (Vietnam)', labelTh: 'เวียดนาม' },
  { value: 'THAILAND', label: 'ไทย (Thailand)', labelTh: 'ไทย' },
  { value: 'SINGAPORE', label: 'สิงคโปร์ (Singapore)', labelTh: 'สิงคโปร์' },
  { value: 'MALAYSIA', label: 'มาเลเซีย (Malaysia)', labelTh: 'มาเลเซีย' },
  { value: 'INDONESIA', label: 'อินโดนีเซีย (Indonesia)', labelTh: 'อินโดนีเซีย' },
  { value: 'INDIA', label: 'อินเดีย (India)', labelTh: 'อินเดีย' },
  { value: 'NEPAL', label: 'เนปาล (Nepal)', labelTh: 'เนปาล' },
  { value: 'BHUTAN', label: 'ภูฏาน (Bhutan)', labelTh: 'ภูฏาน' },
  { value: 'MALDIVES', label: 'มัลดีฟส์ (Maldives)', labelTh: 'มัลดีฟส์' },
  { value: 'SRI LANKA', label: 'ศรีลังกา (Sri Lanka)', labelTh: 'ศรีลังกา' },
  { value: 'TURKEY', label: 'ตุรกี (Turkey)', labelTh: 'ตุรกี' },
  { value: 'GEORGIA', label: 'จอร์เจีย (Georgia)', labelTh: 'จอร์เจีย' },
  { value: 'AZERBAIJAN', label: 'อาเซอร์ไบจาน (Azerbaijan)', labelTh: 'อาเซอร์ไบจาน' },
  { value: 'UZBEKISTAN', label: 'อุซเบกิสถาน (Uzbekistan)', labelTh: 'อุซเบกิสถาน' },
  { value: 'KAZAKHSTAN', label: 'คาซัคสถาน (Kazakhstan)', labelTh: 'คาซัคสถาน' },
  { value: 'RUSSIA', label: 'รัสเซีย (Russia)', labelTh: 'รัสเซีย' },
  { value: 'MONGOLIA', label: 'มองโกเลีย (Mongolia)', labelTh: 'มองโกเลีย' },
  { value: 'EUROPE', label: 'ยุโรป (Europe)', labelTh: 'ยุโรป' },
  { value: 'FRANCE', label: 'ฝรั่งเศส (France)', labelTh: 'ฝรั่งเศส' },
  { value: 'ITALY', label: 'อิตาลี (Italy)', labelTh: 'อิตาลี' },
  { value: 'SWITZERLAND', label: 'สวิตเซอร์แลนด์ (Switzerland)', labelTh: 'สวิตเซอร์แลนด์' },
  { value: 'GERMANY', label: 'เยอรมนี (Germany)', labelTh: 'เยอรมนี' },
  { value: 'ENGLAND', label: 'อังกฤษ (England)', labelTh: 'อังกฤษ' },
  { value: 'SPAIN', label: 'สเปน (Spain)', labelTh: 'สเปน' },
  { value: 'PORTUGAL', label: 'โปรตุเกส (Portugal)', labelTh: 'โปรตุเกส' },
  { value: 'GREECE', label: 'กรีซ (Greece)', labelTh: 'กรีซ' },
  { value: 'CROATIA', label: 'โครเอเชีย (Croatia)', labelTh: 'โครเอเชีย' },
  { value: 'ICELAND', label: 'ไอซ์แลนด์ (Iceland)', labelTh: 'ไอซ์แลนด์' },
  { value: 'NORWAY', label: 'นอร์เวย์ (Norway)', labelTh: 'นอร์เวย์' },
  { value: 'FINLAND', label: 'ฟินแลนด์ (Finland)', labelTh: 'ฟินแลนด์' },
  { value: 'SWEDEN', label: 'สวีเดน (Sweden)', labelTh: 'สวีเดน' },
  { value: 'DENMARK', label: 'เดนมาร์ก (Denmark)', labelTh: 'เดนมาร์ก' },
  { value: 'AUSTRALIA', label: 'ออสเตรเลีย (Australia)', labelTh: 'ออสเตรเลีย' },
  { value: 'NEW ZEALAND', label: 'นิวซีแลนด์ (New Zealand)', labelTh: 'นิวซีแลนด์' },
  { value: 'USA', label: 'สหรัฐอเมริกา (USA)', labelTh: 'สหรัฐอเมริกา' },
  { value: 'CANADA', label: 'แคนาดา (Canada)', labelTh: 'แคนาดา' },
  { value: 'EGYPT', label: 'อียิปต์ (Egypt)', labelTh: 'อียิปต์' },
  { value: 'MOROCCO', label: 'โมร็อกโก (Morocco)', labelTh: 'โมร็อกโก' },
  { value: 'SOUTH AFRICA', label: 'แอฟริกาใต้ (South Africa)', labelTh: 'แอฟริกาใต้' },
  { value: 'DUBAI', label: 'ดูไบ (Dubai)', labelTh: 'ดูไบ' },
  { value: 'JORDAN', label: 'จอร์แดน (Jordan)', labelTh: 'จอร์แดน' },
  { value: 'ISRAEL', label: 'อิสราเอล (Israel)', labelTh: 'อิสราเอล' },
];

export default function SalesSearchPage() {
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [tours, setTours] = useState<Tour[]>([]);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(true);
  const [expandedTour, setExpandedTour] = useState<number | null>(null);
  const [wholesalers, setWholesalers] = useState<Wholesaler[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [countrySearch, setCountrySearch] = useState('');
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [searchTime, setSearchTime] = useState<number | null>(null);
  const [tourCodeMap, setTourCodeMap] = useState<Record<string, TourCodeLookup>>({});
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);
  
  // Mass Sync states
  const [selectedTours, setSelectedTours] = useState<Set<string>>(new Set());
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 });
  const [syncResult, setSyncResult] = useState<{ success: number; failed: number; message: string } | null>(null);

  // Generate month options for the next 12 months
  const generateMonthOptions = () => {
    const months = [];
    const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const thaiMonthsFull = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    const now = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const thaiYear = date.getFullYear() + 543;
      months.push({
        value,
        label: `${thaiMonthsFull[date.getMonth()]} ${thaiYear}`,
        shortLabel: `${thaiMonths[date.getMonth()]} ${thaiYear.toString().slice(-2)}`
      });
    }
    return months;
  };
  
  const monthOptions = generateMonthOptions();
  
  const [filters, setFilters] = useState<SearchFilters>({
    keyword: '',
    country: '',
    departure_from: '',
    departure_to: '',
    departure_month_from: '',
    departure_month_to: '',
    exact_departure: '',
    exact_return: '',
    date_search_mode: 'range',
    min_price: '',
    max_price: '',
    min_seats: '',
    wholesaler_id: null,
    _sort: 'price',
  });

  // Load wholesalers and countries
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/tours/search/filters`);
        const data = await response.json();
        if (data.wholesalers && data.wholesalers.length > 0) {
          setWholesalers(data.wholesalers);
          // Auto-select first wholesaler (required)
          setFilters(prev => ({ ...prev, wholesaler_id: data.wholesalers[0].id }));
        }
        if (data.countries) {
          setCountries(data.countries);
        }
      } catch (error) {
        console.error('Failed to load filters:', error);
      }
    };
    loadFilters();
  }, []);

  // Lookup tour codes from our database by external_id
  const lookupTourCodes = async (toursData: Tour[]) => {
    // Build lookup request - use external_id or raw id/ProductId
    const externalIds = toursData.map(tour => {
      const extId = tour.external_id || tour._raw?.ProductId || tour._raw?.id || tour._raw?.code;
      return {
        wholesaler_id: tour._wholesaler_id,
        external_id: extId ? String(extId) : null,
      };
    }).filter(item => item.wholesaler_id && item.external_id) as { wholesaler_id: number; external_id: string }[];

    if (externalIds.length === 0) return;

    try {
      const response = await fetch(`${API_BASE_URL}/tours/lookup-codes`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({ external_ids: externalIds }),
      });

      // Check if response is OK and is JSON
      if (!response.ok) {
        console.warn('Tour codes lookup API not available');
        return;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('Tour codes lookup API returned non-JSON response');
        return;
      }

      const data = await response.json();
      if (data.success) {
        setTourCodeMap(data.data);
      }
    } catch {
      // Silently fail - API may not be deployed yet
      console.warn('Tour codes lookup failed - API may not be available');
    }
  };

  const handleSearch = useCallback(async () => {
    // Require wholesaler selection
    if (!filters.wholesaler_id) {
      return;
    }
    
    setLoading(true);
    setLoadingProgress(0);
    const startTime = Date.now();
    
    // Start progress timer
    progressRef.current = setInterval(() => {
      setLoadingProgress(Date.now() - startTime);
    }, 100);
    
    try {
      // Build query params
      const params = new URLSearchParams();
      if (filters.keyword) params.append('keyword', filters.keyword);
      if (filters.country) params.append('country', filters.country);
      
      // Handle date search based on mode
      if (filters.date_search_mode === 'month' && filters.departure_month_from) {
        // Month range search: convert YYYY-MM to date range
        const [startYear, startMonth] = filters.departure_month_from.split('-');
        const startDate = `${startYear}-${startMonth}-01`;
        
        // Use end month if specified, otherwise use start month
        const endMonthValue = filters.departure_month_to || filters.departure_month_from;
        const [endYear, endMonth] = endMonthValue.split('-');
        const lastDay = new Date(Number(endYear), Number(endMonth), 0).getDate();
        const endDate = `${endYear}-${endMonth}-${String(lastDay).padStart(2, '0')}`;
        
        params.append('departure_from', startDate);
        params.append('departure_to', endDate);
      } else if (filters.date_search_mode === 'range') {
        // Range search: use departure_from and departure_to
        if (filters.departure_from) params.append('departure_from', filters.departure_from);
        if (filters.departure_to) params.append('departure_to', filters.departure_to);
      } else if (filters.date_search_mode === 'exact') {
        // Exact search: use exact_departure for both from and to (exact match)
        if (filters.exact_departure) {
          params.append('departure_from', filters.exact_departure);
          params.append('departure_to', filters.exact_departure);
          params.append('exact_match', 'true');
        }
        if (filters.exact_return) {
          params.append('return_date', filters.exact_return);
        }
      }
      
      if (filters.min_price) params.append('min_price', filters.min_price);
      if (filters.max_price) params.append('max_price', filters.max_price);
      if (filters.min_seats) params.append('min_seats', filters.min_seats);
      if (filters._sort) params.append('_sort', filters._sort);
      params.append('_limit', '500');
      
      // Use specific wholesaler (required)
      const url = `${API_BASE_URL}/integrations/${filters.wholesaler_id}/tours/search`;
      
      const response = await fetch(`${url}?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setTours(data.data || []);
        setTotal(data.pagination?.total || 0);
        
        // Lookup tour codes for synced tours
        const toursData = data.data || [];
        if (toursData.length > 0) {
          lookupTourCodes(toursData);
        }
      }
      
      setSearchTime(Date.now() - startTime);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      // Stop progress timer
      if (progressRef.current) {
        clearInterval(progressRef.current);
        progressRef.current = null;
      }
      setLoading(false);
    }
  }, [filters]);

  // Debounced search when keyword changes
  const handleKeywordChange = useCallback((value: string) => {
    setFilters(prev => ({ ...prev, keyword: value }));
    
    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // Set new debounce (500ms delay)
    if (value.length >= 2 && filters.wholesaler_id) {
      debounceRef.current = setTimeout(() => {
        handleSearch();
      }, 500);
    }
  }, [filters.wholesaler_id, handleSearch]);

  const clearFilters = () => {
    setFilters(prev => ({
      keyword: '',
      country: '',
      departure_from: '',
      departure_to: '',
      departure_month_from: '',
      departure_month_to: '',
      exact_departure: '',
      exact_return: '',
      date_search_mode: 'range',
      min_price: '',
      max_price: '',
      min_seats: '',
      wholesaler_id: prev.wholesaler_id, // Keep wholesaler selection
      _sort: 'price',
    }));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('th-TH').format(price);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: '2-digit',
    });
  };

  const getLowestPrice = (tour: Tour): number => {
    if (tour.periods && tour.periods.length > 0) {
      const prices = tour.periods.map(p => {
        // ลอง unified fields ก่อน แล้ว fallback ไป raw
        const unified = p.price_adult || 0;
        const rawPrice = p._raw?.Price || p._raw?.salePrice || p._raw?.adultPrice || 0;
        return unified || rawPrice;
      });
      const validPrices = prices.filter(p => p > 0);
      return validPrices.length > 0 ? Math.min(...validPrices) : 0;
    }
    return tour._raw?.priceStart || 0;
  };

  const getAvailablePeriods = (tour: Tour): Period[] => {
    if (!tour.periods) return [];
    return tour.periods.filter(p => {
      // ลอง unified fields ก่อน แล้ว fallback ไป raw (Zego ใช้ Seat)
      const available = p.available_seats || p.available || p._raw?.Seat || p._raw?.available || 0;
      return available > 0;
    });
  };

  // State สำหรับ copy feedback
  const [copiedTourId, setCopiedTourId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  // Format tour data สำหรับ copy
  const formatTourForCopy = (tour: Tour): string => {
    const raw = tour._raw;
    const code = tour.wholesaler_tour_code || raw?.ProductCode || '';
    const title = tour.title || raw?.ProductName || '';
    const days = tour.duration_days || raw?.Days || '';
    const nights = tour.duration_nights || raw?.Nights || '';
    const airline = raw?.AirlineName || '';
    const airlineCode = raw?.AirlineCode || tour.transport_id || '';
    const pdfUrl = raw?.FilePDF || raw?.pdfUrl || '';
    
    const formatFullDate = (d: Date) => d.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
    
    // Check if specific date filter is applied
    const hasDateFilter = filters.departure_from || filters.departure_to;
    
    // Get periods with parsed dates
    const periodsWithDates = (tour.periods || []).map(p => {
      const dateStr = p.departure_date || p._raw?.PeriodStartDate || p._raw?.DepartureDate;
      const endDateStr = p._raw?.PeriodEndDate || p._raw?.ReturnDate;
      const price = p.price_adult || p._raw?.PriceAdult || p._raw?.Price || 0;
      const seats = p.available || p._raw?.Available || p._raw?.AvailableSeats || 0;
      
      let startDate: Date | null = null;
      let endDate: Date | null = null;
      
      if (dateStr) {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) startDate = d;
      }
      if (endDateStr) {
        const d = new Date(endDateStr);
        if (!isNaN(d.getTime())) endDate = d;
      }
      // If no end date, calculate from days
      if (startDate && !endDate && days) {
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + Number(days) - 1);
      }
      
      return { ...p, startDate, endDate, price: Number(price), seats: Number(seats) };
    }).filter(p => p.startDate !== null);
    
    if (hasDateFilter && periodsWithDates.length > 0) {
      // Filter periods by date range
      const filterFrom = filters.departure_from ? new Date(filters.departure_from) : null;
      const filterTo = filters.departure_to ? new Date(filters.departure_to) : null;
      
      const matchingPeriods = periodsWithDates.filter(p => {
        if (!p.startDate) return false;
        if (filterFrom && p.startDate < filterFrom) return false;
        if (filterTo && p.startDate > filterTo) return false;
        return true;
      });
      
      if (matchingPeriods.length > 0) {
        // Generate text for each matching period
        const periodTexts = matchingPeriods.map(p => {
          let text = `รหัสทัวร์ : ${code}\n`;
          text += `${title} (${days} วัน ${nights} คืน)\n`;
          
          const startStr = p.startDate ? formatFullDate(p.startDate) : '';
          const endStr = p.endDate ? formatFullDate(p.endDate) : '';
          text += `ช่วงเดินทาง : ${startStr}${endStr ? ` - ${endStr}` : ''}\n`;
          
          if (airline) text += `สายการบิน : ${airline}${airlineCode ? ` (${airlineCode})` : ''}\n`;
          text += `ราคา : ${new Intl.NumberFormat('th-TH').format(p.price)}\n`;
          text += `ที่นั่งรับได้ : ${p.seats}\n`;
          if (pdfUrl) {
            text += `รายละเอียดโปรแกรม (PDF)\n${pdfUrl}`;
          }
          return text;
        });
        
        return periodTexts.join('\n\n---\n\n');
      }
    }
    
    // Default: show date range and lowest price
    let dateRange = '';
    if (periodsWithDates.length > 0) {
      const dates = periodsWithDates.map(p => p.startDate!);
      const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
      const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
      dateRange = `${formatFullDate(minDate)} - ${formatFullDate(maxDate)}`;
    }
    
    const lowestPrice = getLowestPrice(tour);
    
    let text = `รหัสทัวร์ : ${code}\n`;
    text += `${title} (${days} วัน ${nights} คืน)\n`;
    if (dateRange) text += `ช่วงเดินทาง : ${dateRange}\n`;
    if (airline) text += `สายการบิน : ${airline}${airlineCode ? ` (${airlineCode})` : ''}\n`;
    text += `ราคาเริ่มต้นที่ : ${new Intl.NumberFormat('th-TH').format(lowestPrice)}\n`;
    if (pdfUrl) {
      text += `รายละเอียดโปรแกรม (PDF)\n${pdfUrl}`;
    }
    
    return text;
  };

  // Copy single tour
  const handleCopyTour = async (tour: Tour, tourId: string) => {
    const text = formatTourForCopy(tour);
    await navigator.clipboard.writeText(text);
    setCopiedTourId(tourId);
    setTimeout(() => setCopiedTourId(null), 2000);
  };

  // Copy all tours
  const handleCopyAll = async () => {
    const allText = tours.map(tour => formatTourForCopy(tour)).join('\n\n---\n\n');
    await navigator.clipboard.writeText(allText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  // === Mass Sync Functions ===
  
  // Get tour key for selection
  const getTourKey = (tour: Tour, index: number) => {
    const raw = tour._raw;
    return `${tour._wholesaler_id}-${tour.external_id || raw?.ProductId || raw?.id || raw?.code || index}`;
  };

  const MAX_SYNC_TOURS = 5;

  // Toggle single tour selection
  const toggleTourSelection = (tourKey: string) => {
    setSelectedTours(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tourKey)) {
        newSet.delete(tourKey);
      } else {
        // Limit to MAX_SYNC_TOURS
        if (newSet.size >= MAX_SYNC_TOURS) {
          alert(`สามารถเลือกได้สูงสุด ${MAX_SYNC_TOURS} ทัวร์ต่อครั้ง`);
          return prev;
        }
        newSet.add(tourKey);
      }
      return newSet;
    });
  };

  // Select/Deselect all tours (only unsynced, max MAX_SYNC_TOURS)
  const toggleSelectAll = () => {
    if (selectedTours.size > 0) {
      // Deselect all
      setSelectedTours(new Set());
    } else {
      // Select unsynced tours (limit to MAX_SYNC_TOURS)
      const unsyncedKeys = tours
        .map((tour, index) => {
          const key = getTourKey(tour, index);
          const syncInfo = tourCodeMap[`${tour._wholesaler_id}_${tour.external_id || tour._raw?.ProductId || tour._raw?.id}`];
          if (!syncInfo?.synced) {
            return key;
          }
          return null;
        })
        .filter((k): k is string => k !== null)
        .slice(0, MAX_SYNC_TOURS); // Limit to max
      
      if (unsyncedKeys.length === MAX_SYNC_TOURS) {
        alert(`เลือกอัตโนมัติ ${MAX_SYNC_TOURS} ทัวร์แรก (สูงสุดที่ sync ได้ต่อครั้ง)`);
      }
      setSelectedTours(new Set(unsyncedKeys));
    }
  };

  // Sync selected tours
  const handleSyncSelected = async () => {
    if (selectedTours.size === 0 || !filters.wholesaler_id) return;

    setSyncing(true);
    setSyncProgress({ current: 0, total: selectedTours.size });
    setSyncResult(null);

    try {
      // Get selected tour data
      const selectedToursData = tours.filter((tour, index) => 
        selectedTours.has(getTourKey(tour, index))
      );

      // Send to API
      const response = await fetch(`${API_BASE_URL}/integrations/${filters.wholesaler_id}/tours/sync-selected`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({ tours: selectedToursData }),
      });

      const data = await response.json();

      if (data.success) {
        setSyncResult({
          success: data.data.success,
          failed: data.data.failed,
          message: data.message,
        });
        
        // Refresh tour codes lookup
        if (tours.length > 0) {
          lookupTourCodes(tours);
        }
        
        // Clear selection
        setSelectedTours(new Set());
      } else {
        setSyncResult({
          success: 0,
          failed: selectedTours.size,
          message: data.message || 'เกิดข้อผิดพลาดในการ sync',
        });
      }
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncResult({
        success: 0,
        failed: selectedTours.size,
        message: 'เกิดข้อผิดพลาดในการเชื่อมต่อ API',
      });
    } finally {
      setSyncing(false);
    }
  };

  // Clear sync result after 5 seconds
  useEffect(() => {
    if (syncResult) {
      const timer = setTimeout(() => setSyncResult(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [syncResult]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ค้นหาทัวร์ (Realtime)</h1>
          <p className="text-gray-500 text-sm">
            ค้นหาทัวร์จาก Wholesaler API โดยตรง • ข้อมูลเรียลไทม์ ถูกต้อง ทันสมัย
          </p>
        </div>
        <div className="flex items-center gap-2">
          {searchTime && (
            <span className="text-sm text-gray-500">
              ใช้เวลา {(searchTime / 1000).toFixed(2)}s
            </span>
          )}
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4" />
            {showFilters ? 'ซ่อนตัวกรอง' : 'แสดงตัวกรอง'}
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      {showFilters && (
        <Card className="p-6">
          <div className="space-y-4">
            {/* Main Search */}
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="ค้นหาชื่อทัวร์... (พิมพ์ 2 ตัวอักษรขึ้นไป)"
                    value={filters.keyword}
                    onChange={(e) => handleKeywordChange(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <Button onClick={handleSearch} disabled={loading || !filters.wholesaler_id} className="px-8">
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
                ค้นหา
              </Button>
            </div>

            {/* Date Search Mode Selection */}
            <div className="bg-gray-50 rounded-lg p-ๅ space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  รูปแบบการค้นหาวันเดินทาง
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setFilters(prev => ({ 
                      ...prev, 
                      date_search_mode: 'month',
                      departure_from: '',
                      departure_to: '',
                      exact_departure: '',
                      exact_return: ''
                    }))}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      filters.date_search_mode === 'month'
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    📅 ค้นหาตามเดือน
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilters(prev => ({ 
                      ...prev, 
                      date_search_mode: 'range',
                      departure_month_from: '',
                      departure_month_to: '',
                      exact_departure: '',
                      exact_return: ''
                    }))}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      filters.date_search_mode === 'range'
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    📆 ค้นหาช่วงวัน
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilters(prev => ({ 
                      ...prev, 
                      date_search_mode: 'exact',
                      departure_month_from: '',
                      departure_month_to: '',
                      departure_from: '',
                      departure_to: ''
                    }))}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      filters.date_search_mode === 'exact'
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    🎯 ค้นหาวันที่ตรงกัน
                  </button>
                </div>
              </div>

              {/* Month Search Mode */}
              {filters.date_search_mode === 'month' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="block text-sm text-gray-600 mb-2">
                        <span className="font-medium text-gray-700">เดือนเริ่มต้น</span>
                        <span className="text-gray-400 ml-1">(คลิกเลือก)</span>
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {monthOptions.map((month) => {
                          const isStartMonth = filters.departure_month_from === month.value;
                          const isEndMonth = filters.departure_month_to === month.value;
                          const isInRange = filters.departure_month_from && filters.departure_month_to && 
                            month.value >= filters.departure_month_from && month.value <= filters.departure_month_to;
                          const isOnlyStart = isStartMonth && !filters.departure_month_to;
                          
                          return (
                            <button
                              key={month.value}
                              type="button"
                              onClick={() => {
                                if (!filters.departure_month_from || (filters.departure_month_from && filters.departure_month_to)) {
                                  // ถ้ายังไม่เลือกเริ่มต้น หรือเลือกครบแล้ว ให้เริ่มใหม่
                                  setFilters(prev => ({ ...prev, departure_month_from: month.value, departure_month_to: '' }));
                                } else if (month.value < filters.departure_month_from) {
                                  // ถ้าเลือกเดือนก่อนหน้าเดือนเริ่มต้น ให้เปลี่ยนเดือนเริ่มต้น
                                  setFilters(prev => ({ ...prev, departure_month_from: month.value }));
                                } else if (month.value === filters.departure_month_from) {
                                  // ถ้าคลิกเดือนเดียวกัน = ค้นหาเดือนเดียว
                                  setFilters(prev => ({ ...prev, departure_month_to: month.value }));
                                } else {
                                  // เลือกเดือนสิ้นสุด
                                  setFilters(prev => ({ ...prev, departure_month_to: month.value }));
                                }
                              }}
                              className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                                isStartMonth || isEndMonth
                                  ? 'bg-green-500 text-white shadow-md'
                                  : isInRange
                                    ? 'bg-green-100 text-green-700 border border-green-300'
                                    : isOnlyStart
                                      ? 'bg-green-500 text-white shadow-md ring-2 ring-green-300'
                                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-green-50 hover:border-green-300'
                              }`}
                            >
                              {month.shortLabel}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  
                  {/* Selected Range Display */}
                  {filters.departure_month_from && (
                    <div className="flex items-center justify-between bg-green-50 rounded-lg px-4 py-2">
                      <p className="text-sm text-green-700 flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        {filters.departure_month_to && filters.departure_month_to !== filters.departure_month_from ? (
                          <>
                            ค้นหาทัวร์ช่วง <strong>{monthOptions.find(m => m.value === filters.departure_month_from)?.label}</strong> 
                            <span className="mx-1">ถึง</span>
                            <strong>{monthOptions.find(m => m.value === filters.departure_month_to)?.label}</strong>
                          </>
                        ) : (
                          <>
                            ค้นหาทัวร์เดือน <strong>{monthOptions.find(m => m.value === filters.departure_month_from)?.label}</strong>
                            {!filters.departure_month_to && <span className="text-green-600 ml-2">(คลิกเดือนสิ้นสุด หรือคลิกเดือนเดิมเพื่อเลือกเดือนเดียว)</span>}
                          </>
                        )}
                      </p>
                      <button
                        type="button"
                        onClick={() => setFilters(prev => ({ ...prev, departure_month_from: '', departure_month_to: '' }))}
                        className="text-green-600 hover:text-green-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Range Search Mode */}
              {filters.date_search_mode === 'range' && (
                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <label className="block text-sm text-gray-600 mb-1">ตั้งแต่วันที่</label>
                    <input
                      type="date"
                      value={filters.departure_from}
                      onChange={(e) => setFilters(prev => ({ ...prev, departure_from: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-center text-gray-400 mb-3">→</div>
                  <div className="flex-1">
                    <label className="block text-sm text-gray-600 mb-1">ถึงวันที่</label>
                    <input
                      type="date"
                      value={filters.departure_to}
                      min={filters.departure_from}
                      onChange={(e) => setFilters(prev => ({ ...prev, departure_to: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Exact Search Mode */}
              {filters.date_search_mode === 'exact' && (
                <div className="space-y-3">
                  <p className="text-xs text-gray-500">ระบุวันที่ต้องการเดินทางตรงๆ ระบบจะค้นหาทัวร์ที่มีวันเดินทางตรงกับที่ระบุ</p>
                  <div className="flex items-end gap-4">
                    <div className="flex-1">
                      <label className="block text-sm text-gray-600 mb-1">
                        <Plane className="inline w-4 h-4 mr-1" />
                        วันเดินทางไป
                      </label>
                      <input
                        type="date"
                        value={filters.exact_departure}
                        onChange={(e) => setFilters(prev => ({ ...prev, exact_departure: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm text-gray-600 mb-1">
                        <Plane className="inline w-4 h-4 mr-1 rotate-180" />
                        วันเดินทางกลับ (ถ้ามี)
                      </label>
                      <input
                        type="date"
                        value={filters.exact_return}
                        min={filters.exact_departure}
                        onChange={(e) => setFilters(prev => ({ ...prev, exact_return: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Other Filters Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

              {/* Country - Searchable Dropdown */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">ประเทศ</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                  <input
                    type="text"
                    placeholder="พิมพ์ค้นหา..."
                    value={countrySearch || COUNTRY_OPTIONS.find(c => c.value === filters.country)?.labelTh || filters.country}
                    onChange={(e) => {
                      setCountrySearch(e.target.value);
                      setCountryDropdownOpen(true);
                    }}
                    onFocus={() => setCountryDropdownOpen(true)}
                    className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  {filters.country && (
                    <button
                      onClick={() => {
                        setFilters(prev => ({ ...prev, country: '' }));
                        setCountrySearch('');
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                {/* Dropdown List */}
                {countryDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {COUNTRY_OPTIONS
                      .filter(opt => {
                        if (!countrySearch) return true;
                        const search = countrySearch.toLowerCase();
                        return (
                          opt.label.toLowerCase().includes(search) ||
                          opt.value.toLowerCase().includes(search) ||
                          opt.labelTh.toLowerCase().includes(search)
                        );
                      })
                      .map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => {
                            setFilters(prev => ({ ...prev, country: opt.value }));
                            setCountrySearch('');
                            setCountryDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-blue-50 flex items-center justify-between ${
                            filters.country === opt.value ? 'bg-blue-50 text-blue-700' : ''
                          }`}
                        >
                          <span>{opt.label}</span>
                          {filters.country === opt.value && (
                            <span className="text-blue-600">✓</span>
                          )}
                        </button>
                      ))
                    }
                    {/* Show API countries not in predefined list */}
                    {countries
                      .filter(c => !COUNTRY_OPTIONS.some(opt => opt.value === c))
                      .filter(c => !countrySearch || c.toLowerCase().includes(countrySearch.toLowerCase()))
                      .map(c => (
                        <button
                          key={c}
                          onClick={() => {
                            setFilters(prev => ({ ...prev, country: c }));
                            setCountrySearch('');
                            setCountryDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-blue-50 ${
                            filters.country === c ? 'bg-blue-50 text-blue-700' : ''
                          }`}
                        >
                          {c}
                        </button>
                      ))
                    }
                  </div>
                )}
                
                {/* Click outside to close */}
                {countryDropdownOpen && (
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => {
                      setCountryDropdownOpen(false);
                      setCountrySearch('');
                    }}
                  />
                )}
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ราคา (บาท)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="ต่ำสุด"
                    value={filters.min_price}
                    onChange={(e) => setFilters(prev => ({ ...prev, min_price: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <span className="flex items-center text-gray-400">-</span>
                  <input
                    type="number"
                    placeholder="สูงสุด"
                    value={filters.max_price}
                    onChange={(e) => setFilters(prev => ({ ...prev, max_price: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* Min Seats */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ที่นั่งว่าง</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    placeholder="ขั้นต่ำ"
                    min="1"
                    value={filters.min_seats}
                    onChange={(e) => setFilters(prev => ({ ...prev, min_seats: e.target.value }))}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">เรียงตาม</label>
                <select
                  value={filters._sort}
                  onChange={(e) => setFilters(prev => ({ ...prev, _sort: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="price">ราคาต่ำ → สูง</option>
                  <option value="-price">ราคาสูง → ต่ำ</option>
                  <option value="departure_date">วันเดินทางใกล้</option>
                  <option value="title">ชื่อ A-Z</option>
                </select>
              </div>
            </div>

            {/* Wholesaler Select - Single Select (Required) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wholesaler <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {wholesalers.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => setFilters(prev => ({
                      ...prev,
                      wholesaler_id: w.id
                    }))}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      filters.wholesaler_id === w.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {w.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear Filters */}
            <div className="flex justify-end">
              <button
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                ล้างตัวกรอง
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Results */}
      <div className="space-y-4">
        {/* Mass Sync Bar (when tours selected) */}
        {selectedTours.size > 0 && !syncing && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckSquare className="w-5 h-5 text-blue-600" />
              <span className="text-blue-800 font-medium">
                เลือก {selectedTours.size} ทัวร์
              </span>
              <button
                onClick={() => setSelectedTours(new Set())}
                className="text-blue-600 hover:text-blue-800 text-sm underline"
              >
                ยกเลิกทั้งหมด
              </button>
            </div>
            <Button
              onClick={handleSyncSelected}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={selectedTours.size === 0}
            >
              <Download className="w-4 h-4" />
              Sync เข้าระบบ ({selectedTours.size})
            </Button>
          </div>
        )}

        {/* Syncing Progress */}
        {syncing && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <span className="text-blue-800 font-medium">
                กำลัง Sync {selectedTours.size} ทัวร์เข้าระบบ...
              </span>
            </div>
          </div>
        )}

        {/* Sync Result */}
        {syncResult && (
          <div className={`rounded-lg p-4 flex items-center gap-3 ${
            syncResult.failed === 0 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-yellow-50 border border-yellow-200'
          }`}>
            {syncResult.failed === 0 ? (
              <Check className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            )}
            <span className={syncResult.failed === 0 ? 'text-green-800' : 'text-yellow-800'}>
              {syncResult.message}
            </span>
          </div>
        )}

        {/* Results Header */}
        <div className="flex items-center justify-between">
          <p className="text-gray-600">
            {loading ? 'กำลังค้นหา...' : `พบ ${total} ทัวร์`}
          </p>
          <div className="flex items-center gap-2">
            {tours.length > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleSelectAll}
                  className={selectedTours.size > 0 ? 'text-blue-600 border-blue-600' : ''}
                >
                  {selectedTours.size > 0 ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                  {selectedTours.size > 0 ? 'ยกเลิกเลือก' : 'เลือกที่ยังไม่ sync'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyAll}
                  className={copiedAll ? 'text-green-600 border-green-600' : ''}
                >
                  {copiedAll ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedAll ? 'คัดลอกแล้ว!' : `คัดลอกทั้งหมด (${tours.length})`}
                </Button>
              </>
            )}
            <Button variant="outline" size="sm" onClick={handleSearch} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              รีเฟรช
            </Button>
          </div>
        </div>

        {/* Tour List */}
        {loading ? (
          <div className="space-y-4">
            {/* Loading Progress Bar */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                  <span className="text-blue-700 font-medium">กำลังดึงข้อมูลจาก Wholesaler API...</span>
                </div>
                <div className="flex items-center gap-1 text-blue-600">
                  <Clock className="w-4 h-4" />
                  <span className="font-mono">{(loadingProgress / 1000).toFixed(1)}s</span>
                </div>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${Math.min(loadingProgress / 60, 100)}%` }}
                />
              </div>
              <p className="text-xs text-blue-500 mt-2">โปรดรอสักครู่ การค้นหาอาจใช้เวลา 3-6 วินาที</p>
            </div>
            
            {/* Skeleton Table */}
            <Card className="overflow-hidden animate-pulse">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-2 py-3 w-10"><div className="h-4 w-4 bg-gray-200 rounded mx-auto" /></th>
                      <th className="px-2 py-3 w-10"><div className="h-4 bg-gray-200 rounded w-6 mx-auto" /></th>
                      <th className="px-2 py-3 w-12"><div className="h-4 bg-gray-200 rounded w-8 mx-auto" /></th>
                      <th className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-20" /></th>
                      <th className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-24" /></th>
                      <th className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-16" /></th>
                      <th className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-16" /></th>
                      <th className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-24" /></th>
                      <th className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-20" /></th>
                      <th className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-20" /></th>
                      <th className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-16 mx-auto" /></th>
                      <th className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-24" /></th>
                      <th className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-16 mx-auto" /></th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...Array(10)].map((_, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="px-2 py-3"><div className="h-4 w-4 bg-gray-200 rounded mx-auto" /></td>
                        <td className="px-2 py-3"><div className="h-4 bg-gray-200 rounded w-6 mx-auto" /></td>
                        <td className="px-2 py-3"><div className="h-6 w-6 bg-gray-200 rounded mx-auto" /></td>
                        <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-24" /></td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <div className="h-4 bg-gray-200 rounded w-48" />
                            <div className="h-3 bg-gray-100 rounded w-32" />
                          </div>
                        </td>
                        <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-16" /></td>
                        <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-20" /></td>
                        <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-28" /></td>
                        <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-20" /></td>
                        <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-24 ml-auto" /></td>
                        <td className="px-4 py-3"><div className="h-5 bg-gray-200 rounded-full w-14 mx-auto" /></td>
                        <td className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-24" /></td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 justify-center">
                            <div className="h-7 w-7 bg-gray-200 rounded" />
                            <div className="h-7 w-7 bg-gray-200 rounded" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        ) : tours.length === 0 ? (
          <Card className="p-12 text-center">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">ยังไม่มีผลการค้นหา</h3>
            <p className="text-gray-500">กรุณากดปุ่ม &quot;ค้นหา&quot; เพื่อดึงข้อมูลจาก Wholesaler API</p>
          </Card>
        ) : (
          <>
            {/* Tour Table */}
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-2 py-3 text-center font-medium text-gray-700 w-10">
                        <button
                          onClick={toggleSelectAll}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                          title={selectedTours.size > 0 ? 'ยกเลิกเลือกทั้งหมด' : 'เลือกที่ยังไม่ sync'}
                        >
                          {selectedTours.size > 0 ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </th>
                      <th className="px-2 py-3 text-center font-medium text-gray-700 w-10">#</th>
                      <th className="px-2 py-3 text-center font-medium text-gray-700 w-12">จอง</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">รหัสทัวร์</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">ชื่อทัวร์</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">ระยะเวลา</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">ประเทศ</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">ช่วงเดินทาง</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">สายการบิน</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-700">ราคาเริ่มต้น</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-700">รอบ/ว่าง</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Wholesaler</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-700">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tours.map((tour, index) => {
                      const raw = tour._raw;
                      const lowestPrice = getLowestPrice(tour);
                      const availablePeriods = getAvailablePeriods(tour);
                      const isExpanded = expandedTour === index;
                      const tourKey = getTourKey(tour, index);

                      // Get travel date range from periods
                      const getDateRange = () => {
                        if (!tour.periods || tour.periods.length === 0) {
                          if (raw?.scheduleFirstDate && raw?.scheduleLastDate) {
                            return `${formatMonthYear(raw.scheduleFirstDate)} - ${formatMonthYear(raw.scheduleLastDate)}`;
                          }
                          return '-';
                        }
                        const dates = tour.periods
                          .map(p => {
                            const dateStr = p._raw?.departureDate || p._raw?.DepartureDate || p.departure_date;
                            if (!dateStr) return null;
                            const d = new Date(dateStr);
                            return isNaN(d.getTime()) ? null : d;
                          })
                          .filter((d): d is Date => d !== null);
                        
                        if (dates.length === 0) return '-';
                        
                        const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
                        const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
                        return `${formatMonthYear(minDate.toISOString())} - ${formatMonthYear(maxDate.toISOString())}`;
                      };

                      const formatMonthYear = (date: string) => {
                        return new Date(date).toLocaleDateString('th-TH', {
                          day: 'numeric',
                          month: 'short',
                          year: '2-digit',
                        });
                      };

                      const dateRange = getDateRange();

                      // Helper: ดึงค่าจาก unified fields หรือ fallback ไป raw
                      const getExternalId = () => tour.external_id || raw?.ProductId || raw?.id || raw?.code || '';
                      const getTourCode = () => tour.wholesaler_tour_code || raw?.ProductCode || raw?.code || '';
                      const getTourTitle = () => tour.title || raw?.ProductName || raw?.name || '';
                      const getDays = () => tour.duration_days || raw?.Days || raw?.days || '';
                      const getNights = () => {
                        if (tour.duration_nights !== undefined && tour.duration_nights !== null && tour.duration_nights !== '') {
                          return tour.duration_nights;
                        }
                        return raw?.Nights || raw?.nights || '';
                      };
                      const getCountry = () => tour.primary_country_id || raw?.CountryName || raw?.countryName || '';
                      const getAirline = () => raw?.AirlineName || raw?.airlineName || '';
                      const getPdfUrl = () => raw?.FilePDF || raw?.pdfUrl || '';
                      const totalPeriods = tour.periods?.length || raw?.Periods?.length || 0;

                      // Get synced tour code from lookup
                      const lookupKey = `${tour._wholesaler_id}_${getExternalId()}`;
                      const syncInfo = tourCodeMap[lookupKey];
                      const syncedTourCode = syncInfo?.tour_code;
                      const isSynced = syncInfo?.synced ?? false;

                      return (
                        <tr 
                          key={tourKey} 
                          className={`border-b border-gray-100 hover:bg-blue-50/50 transition-colors ${
                            selectedTours.has(tourKey) ? 'bg-blue-50' : ''
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="px-2 py-3 text-center">
                            <button
                              onClick={() => toggleTourSelection(tourKey)}
                              className="p-1 hover:bg-gray-200 rounded transition-colors"
                              title={selectedTours.has(tourKey) ? 'ยกเลิกเลือก' : 'เลือก'}
                            >
                              {selectedTours.has(tourKey) ? (
                                <CheckSquare className="w-4 h-4 text-blue-600" />
                              ) : (
                                <Square className="w-4 h-4 text-gray-400" />
                              )}
                            </button>
                          </td>

                          {/* ลำดับ */}
                          <td className="px-2 py-3 text-center">
                            <span className="text-gray-500 text-sm font-medium">{index + 1}</span>
                          </td>
                          
                          {/* ปุ่มจอง */}
                          <td className="px-2 py-3 text-center">
                            <button
                              onClick={() => alert('ฟีเจอร์จองทัวร์กำลังพัฒนา')}
                              className="p-2 rounded-lg transition-all bg-orange-100 hover:bg-orange-500 text-orange-500 hover:text-white hover:shadow-md"
                              title="จองทัวร์"
                            >
                              <Plane className="w-5 h-5" />
                            </button>
                          </td>
                          
                          {/* รหัส */}
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              {/* Our tour_code (if synced) */}
                              {isSynced && syncedTourCode ? (
                                <span className="font-mono text-xs bg-green-100 text-green-700 px-2 py-1 rounded block w-fit" title="รหัสทัวร์ของเรา">
                                  {syncedTourCode}
                                </span>
                              ) : (
                                <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded block w-fit" title="ยังไม่ sync เข้าระบบ">
                                  ยังไม่ sync
                                </span>
                              )}
                              {/* Wholesaler code (smaller, gray) */}
                              <span className="font-mono text-[10px] text-gray-400 block" title="รหัส Wholesaler">
                                {getTourCode()}
                              </span>
                            </div>
                          </td>
                          
                          {/* ชื่อทัวร์ */}
                          <td className="px-4 py-3 max-w-xs">
                            <span className="font-medium text-gray-900 line-clamp-2" title={getTourTitle()}>
                              {getTourTitle()}
                            </span>
                          </td>
                          
                          {/* ระยะเวลา */}
                          <td className="px-4 py-3">
                            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs whitespace-nowrap">
                              {getDays()}วัน {getNights()}คืน
                            </span>
                          </td>
                          
                          {/* ประเทศ */}
                          <td className="px-4 py-3">
                            <span className="flex items-center gap-1 text-gray-700">
                              <MapPin className="w-3 h-3 text-green-500 flex-shrink-0" />
                              <span className="truncate max-w-[100px]" title={getCountry()}>
                                {getCountry() || '-'}
                              </span>
                            </span>
                          </td>
                          
                          {/* ช่วงเดินทาง */}
                          <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">
                            {dateRange}
                          </td>
                          
                          {/* สายการบิน */}
                          <td className="px-4 py-3">
                            {getAirline() ? (
                              <span className="flex items-center gap-1 text-gray-600 text-xs">
                                <Plane className="w-3 h-3 text-purple-500 flex-shrink-0" />
                                <span className="truncate max-w-[80px]" title={getAirline()}>
                                  {getAirline()}
                                </span>
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          
                          {/* ราคาเริ่มต้น */}
                          <td className="px-4 py-3 text-right">
                            <span className="font-bold text-blue-600 whitespace-nowrap">
                              ฿{formatPrice(lowestPrice)}
                            </span>
                          </td>
                          
                          {/* รอบ/ว่าง */}
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => setExpandedTour(isExpanded ? null : index)}
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              <span className="font-medium">{totalPeriods}</span>
                              <span className="text-gray-400">/</span>
                              <span className={availablePeriods.length > 0 ? 'text-emerald-600 font-medium' : 'text-gray-400'}>
                                {availablePeriods.length}
                              </span>
                              <ChevronDown className="w-3 h-3" />
                            </button>
                          </td>
                          
                          {/* Wholesaler */}
                          <td className="px-4 py-3">
                            <span className="flex items-center gap-1 text-orange-600 text-xs">
                              <Building2 className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate max-w-[80px]">{tour._wholesaler_name}</span>
                            </span>
                          </td>
                          
                          {/* จัดการ */}
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1">
                              {/* Booking button - Mockup */}
                              <button
                                onClick={() => handleCopyTour(tour, tourKey)}
                                className={`p-1.5 rounded transition-colors ${
                                  copiedTourId === tourKey 
                                    ? 'text-green-600 bg-green-50' 
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                }`}
                                title="คัดลอกข้อมูลทัวร์"
                              >
                                {copiedTourId === tourKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                              </button>

                              {getPdfUrl() && (
                                <a
                                  href={getPdfUrl()}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="ดู PDF"
                                >
                                  <FileText className="w-4 h-4" />
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Periods Modal - Separate from table */}
            {expandedTour !== null && tours[expandedTour] && (() => {
              const tour = tours[expandedTour];
              const raw = tour._raw;
              const getTourCode = () => tour.wholesaler_tour_code || raw?.ProductCode || raw?.code || '';
              const getTourTitle = () => tour.title || raw?.ProductName || raw?.name || '';
              
              return (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setExpandedTour(null)}>
                  <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                    <div className="p-4 border-b flex items-center justify-between bg-gray-50 border-gray-200">
                      <div>
                        <h3 className="font-semibold text-gray-900">{getTourCode()}</h3>
                        <p className="text-sm text-gray-600">{getTourTitle()}</p>
                      </div>
                      <button onClick={() => setExpandedTour(null)} className="p-1 hover:bg-gray-200 rounded">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="p-4 overflow-auto max-h-[60vh]">
                      {tour.periods && tour.periods.length > 0 ? (
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-gray-500 border-b border-gray-200">
                              <th className="pb-2 font-medium">วันเดินทาง</th>
                              <th className="pb-2 font-medium">ราคาผู้ใหญ่</th>
                              <th className="pb-2 font-medium">ราคาเด็ก</th>
                              <th className="pb-2 font-medium">มัดจำ</th>
                              <th className="pb-2 font-medium">ที่นั่ง</th>
                              <th className="pb-2 font-medium">สถานะ</th>
                              <th className="pb-2"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {tour.periods.map((period, pIndex) => {
                              const pRaw = period._raw;
                              const departureDate = period.departure_date || pRaw?.PeriodStartDate || pRaw?.DepartureDate || pRaw?.departureDate || '';
                              const returnDate = period.return_date || pRaw?.PeriodEndDate || pRaw?.ReturnDate || pRaw?.returnDate || '';
                              const adultPrice = period.price_adult || pRaw?.Price || pRaw?.adultPrice || pRaw?.salePrice || 0;
                              const childPrice = period.price_child || pRaw?.Price_Child || pRaw?.childPrice || 0;
                              const deposit = period.deposit || pRaw?.Deposit || pRaw?.deposit || 0;
                              const available = period.available_seats || period.available || pRaw?.Seat || pRaw?.available || 0;
                              const capacity = period.capacity || pRaw?.GroupSize || pRaw?.seat || pRaw?.capacity || 0;
                              
                              return (
                                <tr key={pIndex} className="border-b border-gray-100 hover:bg-gray-50">
                                  <td className="py-2">
                                    <span className="font-medium">{formatDate(departureDate)}</span>
                                    <span className="text-gray-400 mx-1">→</span>
                                    <span>{formatDate(returnDate)}</span>
                                  </td>
                                  <td className="py-2 font-semibold text-blue-600">
                                    ฿{formatPrice(adultPrice)}
                                  </td>
                                  <td className="py-2">
                                    ฿{formatPrice(childPrice)}
                                  </td>
                                  <td className="py-2">
                                    ฿{formatPrice(deposit)}
                                  </td>
                                  <td className="py-2">
                                    <span className={available > 5 ? 'text-green-600' : available > 0 ? 'text-orange-600' : 'text-red-600'}>
                                      {available}/{capacity}
                                    </span>
                                  </td>
                                  <td className="py-2">
                                    {available > 0 ? (
                                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">ว่าง</span>
                                    ) : (
                                      <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs">เต็ม</span>
                                    )}
                                  </td>
                                  <td className="py-2">
                                    <Button size="sm" disabled={available === 0}>จอง</Button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      ) : (
                        <p className="text-gray-500 text-center py-8">ไม่มีข้อมูลรอบเดินทาง</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </>
        )}
      </div>
    </div>
  );
}
