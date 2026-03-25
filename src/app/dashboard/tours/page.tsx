'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button, Card } from '@/components/ui';
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Calendar,
  MapPin,
  Star,
  FileText,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Clock,
  Cloud,
  PenLine,
  CheckCircle,
  XCircle,
  FileEdit,
  Map,
  Copy,
  Check,
  X,
  Filter,
  Building2,
  Gift,
} from 'lucide-react';
import {
  toursApi,
  countriesApi,
  wholesalersApi,
  promotionsApi,
  Tour,
  TourCounts,
  TourTransport,
  Country,
  Wholesaler,
  Promotion,
  TOUR_STATUS,
  TOUR_THEMES,
  TOUR_TYPES,
  TOUR_BADGES,
} from '@/lib/api';
import TourPreviewModal from './TourPreviewModal';
import TourPeriodsModal from './TourPeriodsModal';

// ─── Date Search Mode ────────────────────────────────────────────
type DateSearchMode = 'month' | 'range' | 'exact';

// ─── Tab Definitions ─────────────────────────────────────────────
// Each tab maps to a unique preset filter sent to the API
type TabKey = 'all' | 'api' | 'manual' | 'active' | 'draft' | 'inactive';

interface TabDef {
  key: TabKey;
  label: string;
  icon: React.ElementType;
  /** Fixed params sent to API for this tab */
  params: Record<string, string>;
  /** Extract count from TourCounts */
  getCount: (c: TourCounts) => number;
}

const TABS: TabDef[] = [
  { key: 'all',       label: 'ทั้งหมด',    icon: Map,         params: {},                             getCount: c => c.total },
  { key: 'api',       label: 'จาก API',     icon: Cloud,       params: { data_source: 'api' },         getCount: c => c.by_data_source.api },
  { key: 'manual',    label: 'สร้างเอง',    icon: PenLine,     params: { data_source: 'manual' },      getCount: c => c.by_data_source.manual },
  { key: 'active',    label: 'เปิดใช้งาน',  icon: CheckCircle, params: { status: 'active' },           getCount: c => c.by_status.active },
  { key: 'draft',     label: 'แบบร่าง',     icon: FileEdit,    params: { status: 'draft' },            getCount: c => c.by_status.draft },
  { key: 'inactive',  label: 'ปิดใช้งาน',   icon: XCircle,     params: { status: 'inactive' },         getCount: c => c.by_status.inactive },
];

/** Determine active tab from URL searchParams */
function resolveTab(searchParams: URLSearchParams): TabKey {
  const status = searchParams.get('status');
  const dataSource = searchParams.get('data_source');

  if (dataSource === 'api') return 'api';
  if (dataSource === 'manual') return 'manual';
  if (status === 'active') return 'active';
  if (status === 'draft') return 'draft';
  if (status === 'inactive') return 'inactive';
  return 'all';
}

export default function ToursPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // ─── Active tab (derived from URL) ────────────────────────────
  const activeTab = resolveTab(searchParams);
  const activeTabDef = TABS.find(t => t.key === activeTab)!;

  // ─── State ─────────────────────────────────────────────────────
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [tourTypeFilter, setTourTypeFilter] = useState('');
  const [themeFilter, setThemeFilter] = useState('');
  const [counts, setCounts] = useState<TourCounts | null>(null);
  
  // Additional filters (like search page)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [countryFilter, setCountryFilter] = useState('');
  const [countrySearch, setCountrySearch] = useState('');
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [minPriceFilter, setMinPriceFilter] = useState('');
  const [maxPriceFilter, setMaxPriceFilter] = useState('');
  
  // Date search mode filters
  const [dateSearchMode, setDateSearchMode] = useState<DateSearchMode>('range');
  const [departureFrom, setDepartureFrom] = useState('');
  const [departureTo, setDepartureTo] = useState('');
  const [departureMonthFrom, setDepartureMonthFrom] = useState('');
  const [departureMonthTo, setDepartureMonthTo] = useState('');
  const [exactDeparture, setExactDeparture] = useState('');
  const [exactReturn, setExactReturn] = useState('');
  
  // Sort
  const [sortBy, setSortBy] = useState('created_at');
  
  // Countries from database
  const [countries, setCountries] = useState<Country[]>([]);
  
  // Wholesalers from database
  const [wholesalers, setWholesalers] = useState<Wholesaler[]>([]);
  const [wholesalerFilter, setWholesalerFilter] = useState('');
  const [wholesalerSearch, setWholesalerSearch] = useState('');
  const [wholesalerDropdownOpen, setWholesalerDropdownOpen] = useState(false);
  const [wholesalerTourCodeFilter, setWholesalerTourCodeFilter] = useState('');
  
  // Promotions from database
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [promotionFilters, setPromotionFilters] = useState<string[]>([]);
  const [promotionSearch, setPromotionSearch] = useState('');
  const [promotionDropdownOpen, setPromotionDropdownOpen] = useState(false);
  
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
  // Copy states
  const [copiedTourId, setCopiedTourId] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedSelected, setCopiedSelected] = useState(false);

  // Modals
  const [previewTour, setPreviewTour] = useState<Tour | null>(null);
  const [periodsTour, setPeriodsTour] = useState<Tour | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Mass Delete
  const [selectedTours, setSelectedTours] = useState<Set<number>>(new Set());
  const [massDeleteConfirm, setMassDeleteConfirm] = useState(false);
  const [isMassDeleting, setIsMassDeleting] = useState(false);

  // ─── Request cancellation ──────────────────────────────────────
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  // ─── Fetch counts (once on mount / after mutations) ────────────
  const fetchCounts = useCallback(async () => {
    try {
      const res = await toursApi.getCounts();
      if (res.success && res.data) setCounts(res.data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchCounts(); }, [fetchCounts]);

  // ─── Fetch countries (once on mount) ───────────────────────────
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await countriesApi.list({ is_active: 'true' });
        if (res.success && res.data) {
          setCountries(res.data);
        }
      } catch { /* ignore */ }
    };
    fetchCountries();
  }, []);

  // ─── Fetch wholesalers (once on mount) ─────────────────────────
  useEffect(() => {
    const fetchWholesalers = async () => {
      try {
        const res = await wholesalersApi.list({ is_active: 'true', per_page: '1000' });
        if (res.success && res.data) {
          setWholesalers(res.data);
        }
      } catch { /* ignore */ }
    };
    fetchWholesalers();
  }, []);

  // ─── Fetch promotions (once on mount) ──────────────────────────
  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        const res = await promotionsApi.list({ is_active: 'true' });
        if (res.success && res.data) {
          setPromotions(res.data);
        }
      } catch { /* ignore */ }
    };
    fetchPromotions();
  }, []);

  // ─── Fetch tours ───────────────────────────────────────────────
  const fetchTours = useCallback(async () => {
    // Cancel any in-flight request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const thisRequestId = ++requestIdRef.current;

    setLoading(true);
    try {
      // Merge tab preset params + additional dropdown filters
      const params: Record<string, string> = {
        page: currentPage.toString(),
        per_page: '20',
        ...activeTabDef.params,
      };
      if (search) params.search = search;
      if (tourTypeFilter) params.tour_type = tourTypeFilter;
      if (themeFilter) params.theme = themeFilter;
      if (countryFilter) params.country_id = countryFilter;
      if (wholesalerFilter) params.wholesaler_id = wholesalerFilter;
      if (wholesalerTourCodeFilter) params.wholesaler_tour_code = wholesalerTourCodeFilter;
      if (promotionFilters.length > 0) params.promotion_ids = promotionFilters.join(',');
      if (minPriceFilter) params.min_price = minPriceFilter;
      if (maxPriceFilter) params.max_price = maxPriceFilter;
      if (sortBy) {
        if (sortBy.startsWith('-')) {
          params.sort_by = sortBy.substring(1);
          params.sort_dir = 'desc';
        } else {
          params.sort_by = sortBy;
          params.sort_dir = 'asc';
        }
      }
      
      // Handle date search based on mode
      if (dateSearchMode === 'month' && departureMonthFrom) {
        const [startYear, startMonth] = departureMonthFrom.split('-');
        const startDate = `${startYear}-${startMonth}-01`;
        const endMonthValue = departureMonthTo || departureMonthFrom;
        const [endYear, endMonth] = endMonthValue.split('-');
        const lastDay = new Date(Number(endYear), Number(endMonth), 0).getDate();
        const endDate = `${endYear}-${endMonth}-${String(lastDay).padStart(2, '0')}`;
        params.departure_from = startDate;
        params.departure_to = endDate;
      } else if (dateSearchMode === 'range') {
        if (departureFrom) params.departure_from = departureFrom;
        if (departureTo) params.departure_to = departureTo;
      } else if (dateSearchMode === 'exact') {
        if (exactDeparture) {
          params.departure_from = exactDeparture;
          params.departure_to = exactDeparture;
        }
      }

      const response = await toursApi.list(params, controller.signal);

      // Guard: discard if a newer request was issued
      if (thisRequestId !== requestIdRef.current) return;

      if (response.success) {
        setTours(response.data || []);
        if (response.meta) {
          setCurrentPage(response.meta.current_page);
          setTotalPages(response.meta.last_page);
          setTotal(response.meta.total);
        }
      }
    } catch (err: unknown) {
      // Abort errors are expected — ignore
      const error = err as Error & { name?: string };
      if (error?.name === 'AbortError' || error?.message === 'The user aborted a request.') return;
      if (thisRequestId !== requestIdRef.current) return;
      console.error('Failed to fetch tours:', err);
    } finally {
      if (thisRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [currentPage, search, tourTypeFilter, themeFilter, countryFilter, wholesalerFilter, wholesalerTourCodeFilter, promotionFilters, minPriceFilter, maxPriceFilter, departureFrom, departureTo, dateSearchMode, departureMonthFrom, departureMonthTo, exactDeparture, sortBy, activeTabDef]);

  useEffect(() => { fetchTours(); }, [fetchTours]);

  // Debounce search → reset page
  useEffect(() => {
    const timer = setTimeout(() => { setCurrentPage(1); }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // ─── Tab switch handler ─────────────────────────────────────────
  const switchTab = (tab: TabDef) => {
    // Clear additional filters when switching tabs
    setSearch('');
    setTourTypeFilter('');
    setThemeFilter('');
    setCountryFilter('');
    setCountrySearch('');
    setWholesalerFilter('');
    setWholesalerSearch('');
    setWholesalerTourCodeFilter('');
    setPromotionFilters([]);
    setPromotionSearch('');
    setMinPriceFilter('');
    setMaxPriceFilter('');
    setDateSearchMode('range');
    setDepartureFrom('');
    setDepartureTo('');
    setDepartureMonthFrom('');
    setDepartureMonthTo('');
    setExactDeparture('');
    setExactReturn('');
    setSortBy('created_at');
    setCurrentPage(1);
    setSelectedTours(new Set());

    // Build the URL
    const params = new URLSearchParams(tab.params);
    const qs = params.toString();
    router.push(`/dashboard/tours${qs ? `?${qs}` : ''}`);
  };

  // Reset page & selection when tab changes from sidebar
  const prevTabRef = useRef(activeTab);
  useEffect(() => {
    if (prevTabRef.current !== activeTab) {
      setCurrentPage(1);
      setSelectedTours(new Set());
      prevTabRef.current = activeTab;
    }
  }, [activeTab]);

  // ─── CRUD helpers ──────────────────────────────────────────────
  const handleDelete = async (id: number) => {
    setIsDeleting(true);
    try {
      await toursApi.delete(id);
      fetchTours();
      fetchCounts();
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Failed to delete tour:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMassDelete = async () => {
    if (selectedTours.size === 0) return;
    setIsMassDeleting(true);
    try {
      const ids = Array.from(selectedTours);
      await toursApi.massDelete(ids);
      setSelectedTours(new Set());
      setMassDeleteConfirm(false);
      fetchTours();
      fetchCounts();
    } catch (err) {
      console.error('Failed to mass delete tours:', err);
    } finally {
      setIsMassDeleting(false);
    }
  };

  const toggleSelectTour = (id: number) => {
    const newSelected = new Set(selectedTours);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedTours(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedTours.size === tours.length) {
      setSelectedTours(new Set());
    } else {
      setSelectedTours(new Set(tours.map(t => t.id)));
    }
  };

  const formatPrice = (price: string | null) => {
    if (!price) return '-';
    return new Intl.NumberFormat('th-TH').format(parseFloat(price));
  };

  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'เมื่อกี้';
    if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
    if (diffHours < 24) return `${diffHours} ชม.ที่แล้ว`;
    if (diffDays < 7) return `${diffDays} วันที่แล้ว`;
    return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'inactive': return 'bg-gray-100 text-gray-600';
      case 'draft': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getTourTypeColor = (type: string) => {
    switch (type) {
      case 'join': return 'bg-blue-100 text-blue-700';
      case 'incentive': return 'bg-purple-100 text-purple-700';
      case 'collective': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case 'HOT': return 'bg-red-500 text-white';
      case 'NEW': return 'bg-green-500 text-white';
      case 'BEST_SELLER': return 'bg-yellow-500 text-white';
      case 'PROMOTION': return 'bg-pink-500 text-white';
      case 'LIMITED': return 'bg-gray-800 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  // Check if any additional filter is active (beyond tab preset)
  const hasAdditionalFilters = tourTypeFilter || themeFilter || search || countryFilter || wholesalerFilter || wholesalerTourCodeFilter || promotionFilters.length > 0 || minPriceFilter || maxPriceFilter || departureFrom || departureTo || departureMonthFrom || exactDeparture || (sortBy !== 'created_at');
  
  // Clear additional filters only
  const clearAdditionalFilters = () => {
    setTourTypeFilter('');
    setThemeFilter('');
    setSearch('');
    setCountryFilter('');
    setCountrySearch('');
    setWholesalerFilter('');
    setWholesalerSearch('');
    setWholesalerTourCodeFilter('');
    setPromotionFilters([]);
    setPromotionSearch('');
    setMinPriceFilter('');
    setMaxPriceFilter('');
    setDateSearchMode('range');
    setDepartureFrom('');
    setDepartureTo('');
    setDepartureMonthFrom('');
    setDepartureMonthTo('');
    setExactDeparture('');
    setExactReturn('');
    setSortBy('created_at');
    setCurrentPage(1);
  };

  // ─── Copy Functions ─────────────────────────────────────────────
  const formatTourForCopy = (tour: Tour): string => {
    const code = tour.tour_code || '';
    const title = tour.title || '';
    const days = tour.duration_days || '';
    const nights = tour.duration_nights || '';
    
    // Build airline info from transports
    const airlineNames = tour.transports
      ?.map(t => t.transport?.name || t.transport_name)
      .filter((v, i, a) => a.indexOf(v) === i) // unique
      .join(', ') || '';
    
    const formatFullDate = (date: Date) => date.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
    
    // Get periods for date range
    const periods = tour.periods || [];
    let dateRange = '';
    if (periods.length > 0) {
      const dates = periods
        .map(p => p.start_date ? new Date(p.start_date) : null)
        .filter((d): d is Date => d !== null && !isNaN(d.getTime()));
      if (dates.length > 0) {
        const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
        dateRange = `${formatFullDate(minDate)} - ${formatFullDate(maxDate)}`;
      }
    }
    
    // Get price
    const price = tour.display_price || tour.min_price || '';
    
    // Get PDF URL
    const pdfUrl = tour.pdf_url || '';
    
    let text = `รหัสทัวร์ : ${code}\n`;
    text += `${title} (${days} วัน ${nights} คืน)\n`;
    if (dateRange) text += `ช่วงเดินทาง : ${dateRange}\n`;
    if (airlineNames) text += `สายการบิน : ${airlineNames}\n`;
    if (price) text += `ราคาเริ่มต้นที่ : ${new Intl.NumberFormat('th-TH').format(Number(price))}\n`;
    if (pdfUrl) {
      text += `รายละเอียดโปรแกรม (PDF)\n${pdfUrl}`;
    }
    
    return text;
  };

  // Copy single tour
  const handleCopyTour = async (tour: Tour) => {
    const text = formatTourForCopy(tour);
    await navigator.clipboard.writeText(text);
    setCopiedTourId(tour.id);
    setTimeout(() => setCopiedTourId(null), 2000);
  };

  // Copy all tours
  const handleCopyAll = async () => {
    const allText = tours.map(tour => formatTourForCopy(tour)).join('\n\n---\n\n');
    await navigator.clipboard.writeText(allText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  // Copy selected tours (checkbox)
  const handleCopySelected = async () => {
    const selected = tours.filter(t => selectedTours.has(t.id));
    if (selected.length === 0) return;
    const text = selected.map(tour => formatTourForCopy(tour)).join('\n\n---\n\n');
    await navigator.clipboard.writeText(text);
    setCopiedSelected(true);
    setTimeout(() => setCopiedSelected(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">จัดการทัวร์</h1>
          <p className="text-gray-500 text-sm mt-1">
            {activeTab !== 'all' ? `${activeTabDef.label} — ` : ''}
            {total} รายการ
          </p>
        </div>
        <div className="flex gap-2">
          {selectedTours.size > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopySelected}
                disabled={copiedSelected}
                className={copiedSelected ? '!bg-green-50 !text-green-700 !border-green-300' : ''}
              >
                {copiedSelected ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedSelected ? 'คัดลอกแล้ว!' : `คัดลอกที่เลือก (${selectedTours.size})`}
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setMassDeleteConfirm(true)}
              >
                <Trash2 className="w-4 h-4" />
                ลบที่เลือก ({selectedTours.size})
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" onClick={() => { fetchTours(); fetchCounts(); }}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Link href="/dashboard/tours/create">
            <Button size="sm">
              <Plus className="w-4 h-4" />
              เพิ่มทัวร์
            </Button>
          </Link>
        </div>
      </div>

      {/* ─── Inline Tab Bar ───────────────────────────────────────── */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-0 overflow-x-auto -mb-px" aria-label="Tabs">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const Icon = tab.icon;
            const count = counts ? tab.getCount(counts) : null;
            return (
              <button
                key={tab.key}
                onClick={() => switchTab(tab)}
                className={`
                  flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                  ${isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {count !== null && (
                  <span className={`
                    ml-1 text-xs px-1.5 py-0.5 rounded-full
                    ${isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}
                  `}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ─── Search & Additional Filters ──────────────────────────── */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ, รหัสทัวร์, แฮชแท็ก..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Additional dropdown filters (within current tab) */}
          <div className="flex flex-wrap gap-2">
            <select
              value={tourTypeFilter}
              onChange={(e) => { setTourTypeFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">ทุกกลุ่ม</option>
              {Object.entries(TOUR_TYPES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>

            <select
              value={themeFilter}
              onChange={(e) => { setThemeFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">ทุกธีม</option>
              {Object.entries(TOUR_THEMES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="created_at">ล่าสุด</option>
              <option value="-created_at">เก่าสุด</option>
              <option value="display_price">ราคาต่ำ→สูง</option>
              <option value="-display_price">ราคาสูง→ต่ำ</option>
              <option value="next_departure_date">เดินทางใกล้</option>
              <option value="title">ชื่อ A-Z</option>
            </select>

            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-3 py-2 text-sm rounded-lg transition-colors flex items-center gap-1 ${
                showAdvancedFilters ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Filter className="w-4 h-4" />
              ตัวกรองเพิ่มเติม
            </button>

            {hasAdditionalFilters && (
              <button
                onClick={clearAdditionalFilters}
                className="px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                ล้างตัวกรอง
              </button>
            )}
            
            {/* Copy All Button */}
            {tours.length > 0 && (
              <button
                onClick={handleCopyAll}
                disabled={copiedAll}
                className={`px-3 py-2 text-sm rounded-lg transition-colors flex items-center gap-1 ${
                  copiedAll ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {copiedAll ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedAll ? 'คัดลอกแล้ว!' : `คัดลอกทั้งหมด (${tours.length})`}
              </button>
            )}
          </div>
        </div>
        
        {/* Advanced Filters Expandable Section */}
        {showAdvancedFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
            {/* Date Search Mode Selection */}
            <div className="bg-gray-50 rounded-lg p-1 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  รูปแบบการค้นหาวันเดินทาง
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDateSearchMode('month');
                      setDepartureFrom('');
                      setDepartureTo('');
                      setExactDeparture('');
                      setExactReturn('');
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      dateSearchMode === 'month'
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    📅 ค้นหาตามเดือน
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDateSearchMode('range');
                      setDepartureMonthFrom('');
                      setDepartureMonthTo('');
                      setExactDeparture('');
                      setExactReturn('');
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      dateSearchMode === 'range'
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    📆 ค้นหาช่วงวัน
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDateSearchMode('exact');
                      setDepartureMonthFrom('');
                      setDepartureMonthTo('');
                      setDepartureFrom('');
                      setDepartureTo('');
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      dateSearchMode === 'exact'
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    🎯 ค้นหาวันที่ตรงกัน
                  </button>
                </div>
              </div>

              {/* Month Search Mode */}
              {dateSearchMode === 'month' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="block text-sm text-gray-600 mb-2">
                        <span className="font-medium text-gray-700">เดือนเริ่มต้น</span>
                        <span className="text-gray-400 ml-1">(คลิกเลือก)</span>
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {monthOptions.map((month) => {
                          const isStartMonth = departureMonthFrom === month.value;
                          const isEndMonth = departureMonthTo === month.value;
                          const isInRange = departureMonthFrom && departureMonthTo && 
                            month.value >= departureMonthFrom && month.value <= departureMonthTo;
                          const isOnlyStart = isStartMonth && !departureMonthTo;
                          
                          return (
                            <button
                              key={month.value}
                              type="button"
                              onClick={() => {
                                if (!departureMonthFrom || (departureMonthFrom && departureMonthTo)) {
                                  setDepartureMonthFrom(month.value);
                                  setDepartureMonthTo('');
                                } else if (month.value < departureMonthFrom) {
                                  setDepartureMonthFrom(month.value);
                                } else if (month.value === departureMonthFrom) {
                                  setDepartureMonthTo(month.value);
                                } else {
                                  setDepartureMonthTo(month.value);
                                }
                                setCurrentPage(1);
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
                  {departureMonthFrom && (
                    <div className="flex items-center justify-between bg-green-50 rounded-lg px-4 py-2">
                      <p className="text-sm text-green-700 flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        {departureMonthTo && departureMonthTo !== departureMonthFrom ? (
                          <>
                            ค้นหาทัวร์ช่วง <strong>{monthOptions.find(m => m.value === departureMonthFrom)?.label}</strong> 
                            <span className="mx-1">ถึง</span>
                            <strong>{monthOptions.find(m => m.value === departureMonthTo)?.label}</strong>
                          </>
                        ) : (
                          <>
                            ค้นหาทัวร์เดือน <strong>{monthOptions.find(m => m.value === departureMonthFrom)?.label}</strong>
                            {!departureMonthTo && <span className="text-green-600 ml-2">(คลิกเดือนสิ้นสุด หรือคลิกเดือนเดิมเพื่อเลือกเดือนเดียว)</span>}
                          </>
                        )}
                      </p>
                      <button
                        type="button"
                        onClick={() => { setDepartureMonthFrom(''); setDepartureMonthTo(''); }}
                        className="text-green-600 hover:text-green-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Range Search Mode */}
              {dateSearchMode === 'range' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">วันเดินทางไป</label>
                    <input
                      type="date"
                      value={departureFrom}
                      onChange={(e) => { setDepartureFrom(e.target.value); setCurrentPage(1); }}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">วันเดินทางกลับ (ถ้ามี)</label>
                    <input
                      type="date"
                      value={departureTo}
                      min={departureFrom}
                      onChange={(e) => { setDepartureTo(e.target.value); setCurrentPage(1); }}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Exact Search Mode */}
              {dateSearchMode === 'exact' && (
                <div className="space-y-3">
                  <p className="text-xs text-gray-500">ระบุวันที่ต้องการเดินทางตรงๆ ระบบจะค้นหาทัวร์ที่มีวันเดินทางตรงกับที่ระบุ</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">วันเดินทางไป</label>
                      <input
                        type="date"
                        value={exactDeparture}
                        onChange={(e) => { setExactDeparture(e.target.value); setCurrentPage(1); }}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">วันเดินทางกลับ (ถ้ามี)</label>
                      <input
                        type="date"
                        value={exactReturn}
                        min={exactDeparture}
                        onChange={(e) => { setExactReturn(e.target.value); setCurrentPage(1); }}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Other Filters Grid - Equal Width Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Country - Searchable Dropdown */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPin className="inline w-4 h-4 mr-1" />
                  ประเทศ
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="พิมพ์ค้นหาประเทศ..."
                    value={countrySearch || countries.find(c => String(c.id) === countryFilter)?.name_th || (countryFilter ? countries.find(c => String(c.id) === countryFilter)?.name_en : '')}
                    onChange={(e) => {
                      setCountrySearch(e.target.value);
                      setCountryDropdownOpen(true);
                    }}
                    onFocus={() => setCountryDropdownOpen(true)}
                    className="w-full pl-3 pr-8 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {countryFilter && (
                    <button
                      onClick={() => {
                        setCountryFilter('');
                        setCountrySearch('');
                        setCurrentPage(1);
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
                    {/* All option */}
                    <button
                      onClick={() => {
                        setCountryFilter('');
                        setCountrySearch('');
                        setCountryDropdownOpen(false);
                        setCurrentPage(1);
                      }}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-blue-50 flex items-center justify-between ${
                        !countryFilter ? 'bg-blue-50 text-blue-700' : ''
                      }`}
                    >
                      <span>ทั้งหมด</span>
                      {!countryFilter && <span className="text-blue-600">✓</span>}
                    </button>
                    {/* Dynamic countries from API */}
                    {countries
                      .filter(country => {
                        if (!countrySearch) return true;
                        const search = countrySearch.toLowerCase();
                        return (
                          country.name_en.toLowerCase().includes(search) ||
                          (country.name_th?.toLowerCase() || '').includes(search) ||
                          country.iso2.toLowerCase().includes(search)
                        );
                      })
                      .map((country) => (
                        <button
                          key={country.id}
                          onClick={() => {
                            setCountryFilter(String(country.id));
                            setCountrySearch('');
                            setCountryDropdownOpen(false);
                            setCurrentPage(1);
                          }}
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-blue-50 flex items-center justify-between ${
                            countryFilter === String(country.id) ? 'bg-blue-50 text-blue-700' : ''
                          }`}
                        >
                          <span>
                            {country.flag_emoji && <span className="mr-2">{country.flag_emoji}</span>}
                            {country.name_th || country.name_en}
                            <span className="text-gray-400 ml-1">({country.name_en})</span>
                          </span>
                          {countryFilter === String(country.id) && (
                            <span className="text-blue-600">✓</span>
                          )}
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

              {/* Wholesaler - Searchable Dropdown (in Advanced Filters) */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Building2 className="inline w-4 h-4 mr-1" />
                  Wholesaler
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="พิมพ์ค้นหา Wholesaler..."
                    value={wholesalerSearch || wholesalers.find(w => String(w.id) === wholesalerFilter)?.name || ''}
                    onChange={(e) => {
                      setWholesalerSearch(e.target.value);
                      setWholesalerDropdownOpen(true);
                    }}
                    onFocus={() => setWholesalerDropdownOpen(true)}
                    className="w-full pl-3 pr-8 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {wholesalerFilter && (
                    <button
                      onClick={() => {
                        setWholesalerFilter('');
                        setWholesalerSearch('');
                        setCurrentPage(1);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                {/* Dropdown List */}
                {wholesalerDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {/* All option */}
                    <button
                      onClick={() => {
                        setWholesalerFilter('');
                        setWholesalerSearch('');
                        setWholesalerDropdownOpen(false);
                        setCurrentPage(1);
                      }}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-blue-50 flex items-center justify-between ${
                        !wholesalerFilter ? 'bg-blue-50 text-blue-700' : ''
                      }`}
                    >
                      <span>ทั้งหมด</span>
                      {!wholesalerFilter && <span className="text-blue-600">✓</span>}
                    </button>
                    {/* Dynamic wholesalers from API */}
                    {wholesalers
                      .filter(wholesaler => {
                        if (!wholesalerSearch) return true;
                        const search = wholesalerSearch.toLowerCase();
                        return (
                          wholesaler.name.toLowerCase().includes(search) ||
                          wholesaler.code.toLowerCase().includes(search)
                        );
                      })
                      .map((wholesaler) => (
                        <button
                          key={wholesaler.id}
                          onClick={() => {
                            setWholesalerFilter(String(wholesaler.id));
                            setWholesalerSearch('');
                            setWholesalerDropdownOpen(false);
                            setCurrentPage(1);
                          }}
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-blue-50 flex items-center justify-between ${
                            wholesalerFilter === String(wholesaler.id) ? 'bg-blue-50 text-blue-700' : ''
                          }`}
                        >
                          <span>
                            {wholesaler.name}
                            <span className="text-gray-400 ml-1">({wholesaler.code})</span>
                          </span>
                          {wholesalerFilter === String(wholesaler.id) && (
                            <span className="text-blue-600">✓</span>
                          )}
                        </button>
                      ))
                    }
                  </div>
                )}
                
                {/* Click outside to close */}
                {wholesalerDropdownOpen && (
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => {
                      setWholesalerDropdownOpen(false);
                      setWholesalerSearch('');
                    }}
                  />
                )}
              </div>

              {/* Wholesaler Tour Code Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FileText className="inline w-4 h-4 mr-1" />
                  รหัสทัวร์ Wholesale
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="เช่น TH-JP-001..."
                    value={wholesalerTourCodeFilter}
                    onChange={(e) => { setWholesalerTourCodeFilter(e.target.value); setCurrentPage(1); }}
                    className="w-full pl-3 pr-8 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {wholesalerTourCodeFilter && (
                    <button
                      onClick={() => { setWholesalerTourCodeFilter(''); setCurrentPage(1); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Promotion Filter - Multi-Select Dropdown */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Gift className="inline w-4 h-4 mr-1" />
                  โปรโมชั่น {promotionFilters.length > 0 && <span className="text-blue-600">({promotionFilters.length})</span>}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="พิมพ์ค้นหาโปรโมชั่น..."
                    value={promotionSearch || (promotionFilters.length > 0 ? `เลือก ${promotionFilters.length} รายการ` : '')}
                    onChange={(e) => {
                      setPromotionSearch(e.target.value);
                      setPromotionDropdownOpen(true);
                    }}
                    onFocus={() => setPromotionDropdownOpen(true)}
                    className="w-full pl-3 pr-8 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {promotionFilters.length > 0 && (
                    <button
                      onClick={() => {
                        setPromotionFilters([]);
                        setPromotionSearch('');
                        setCurrentPage(1);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                {/* Dropdown List */}
                {promotionDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {/* Clear all option */}
                    <button
                      onClick={() => {
                        setPromotionFilters([]);
                        setPromotionSearch('');
                        setCurrentPage(1);
                      }}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-blue-50 flex items-center justify-between ${
                        promotionFilters.length === 0 ? 'bg-blue-50 text-blue-700' : ''
                      }`}
                    >
                      <span>ทั้งหมด</span>
                      {promotionFilters.length === 0 && <span className="text-blue-600">✓</span>}
                    </button>
                    {/* Dynamic promotions from API */}
                    {promotions
                      .filter(promotion => {
                        if (!promotionSearch) return true;
                        const search = promotionSearch.toLowerCase();
                        return (
                          promotion.name.toLowerCase().includes(search) ||
                          (promotion.description?.toLowerCase().includes(search))
                        );
                      })
                      .map((promotion) => {
                        const isSelected = promotionFilters.includes(String(promotion.id));
                        return (
                          <button
                            key={promotion.id}
                            onClick={() => {
                              if (isSelected) {
                                setPromotionFilters(promotionFilters.filter(id => id !== String(promotion.id)));
                              } else {
                                setPromotionFilters([...promotionFilters, String(promotion.id)]);
                              }
                              setCurrentPage(1);
                            }}
                            className={`w-full px-3 py-2 text-left text-sm hover:bg-blue-50 flex items-center gap-2 ${
                              isSelected ? 'bg-blue-50 text-blue-700' : ''
                            }`}
                          >
                            <input 
                              type="checkbox" 
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="flex-1">
                              {promotion.name}
                              {promotion.type && (
                                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                                  promotion.type === 'installment' ? 'bg-purple-100 text-purple-700' :
                                  promotion.type === 'special' ? 'bg-pink-100 text-pink-700' :
                                  'bg-gray-100 text-gray-600'
                                }`}>
                                  {promotion.type === 'installment' ? 'ผ่อน/รูดบัตร' : 
                                   promotion.type === 'special' ? 'พิเศษ' :
                                   promotion.type === 'discount_amount' ? 'ลดราคา' :
                                   promotion.type === 'discount_percent' ? 'ลด %' :
                                   promotion.type === 'free_gift' ? 'ของแถม' : promotion.type}
                                </span>
                              )}
                            </span>
                          </button>
                        );
                      })
                    }
                  </div>
                )}
                
                {/* Click outside to close */}
                {promotionDropdownOpen && (
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => {
                      setPromotionDropdownOpen(false);
                      setPromotionSearch('');
                    }}
                  />
                )}
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">💰 ราคา (บาท)</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    placeholder="ต่ำสุด"
                    value={minPriceFilter}
                    onChange={(e) => { setMinPriceFilter(e.target.value); setCurrentPage(1); }}
                    className="flex-1 min-w-0 px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="text-gray-400 flex-shrink-0">-</span>
                  <input
                    type="number"
                    placeholder="สูงสุด"
                    value={maxPriceFilter}
                    onChange={(e) => { setMaxPriceFilter(e.target.value); setCurrentPage(1); }}
                    className="flex-1 min-w-0 px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Tours Table */}
      {loading ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-center px-3 py-3 font-medium text-gray-700 whitespace-nowrap w-10">
                    <div className="w-4 h-4 bg-gray-200 rounded animate-pulse mx-auto"></div>
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 whitespace-nowrap">รูป</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 whitespace-nowrap">รหัส / ชื่อทัวร์</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-700 whitespace-nowrap">Wholesaler<br/><span className="text-gray-400 font-normal">ประเทศ</span></th>
                  <th className="text-center px-4 py-3 font-medium text-gray-700 whitespace-nowrap">สายการบิน<br/><span className="text-gray-400 font-normal">กลุ่ม</span></th>
                  <th className="text-center px-4 py-3 font-medium text-gray-700 whitespace-nowrap">วัน/คืน<br/><span className="text-gray-400 font-normal">โรงแรม</span></th>
                  <th className="text-right px-4 py-3 font-medium text-gray-700 whitespace-nowrap">ราคา</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-700 whitespace-nowrap">รอบ</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-700 whitespace-nowrap">สถานะ<br/><span className="text-gray-400 font-normal">อัปเดต</span></th>
                  <th className="text-center px-4 py-3 font-medium text-gray-700 whitespace-nowrap">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[...Array(10)].map((_, index) => (
                  <tr key={index} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                    {/* Checkbox */}
                    <td className="px-3 py-3 text-center">
                      <div className="w-4 h-4 bg-gray-200 rounded animate-pulse mx-auto"></div>
                    </td>
                    {/* Cover Image */}
                    <td className="px-4 py-3">
                      <div className="w-16 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                    </td>
                    {/* Tour Code & Title */}
                    <td className="px-4 py-3">
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-48"></div>
                        <div className="flex gap-1">
                          <div className="h-3 bg-gray-200 rounded animate-pulse w-12"></div>
                          <div className="h-3 bg-gray-200 rounded animate-pulse w-12"></div>
                        </div>
                      </div>
                    </td>
                    {/* Wholesaler + Countries */}
                    <td className="px-4 py-3 text-center">
                      <div className="space-y-1">
                        <div className="h-5 bg-gray-200 rounded animate-pulse w-16 mx-auto"></div>
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-12 mx-auto"></div>
                      </div>
                    </td>
                    {/* Airlines + Tour Type */}
                    <td className="px-4 py-3 text-center">
                      <div className="space-y-1">
                        <div className="h-5 bg-gray-200 rounded animate-pulse w-12 mx-auto"></div>
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-14 mx-auto"></div>
                      </div>
                    </td>
                    {/* Days/Nights + Hotel */}
                    <td className="px-4 py-3 text-center">
                      <div className="space-y-1">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-14 mx-auto"></div>
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-10 mx-auto"></div>
                      </div>
                    </td>
                    {/* Price */}
                    <td className="px-4 py-3 text-right">
                      <div className="space-y-1">
                        <div className="h-5 bg-gray-200 rounded animate-pulse w-20 ml-auto"></div>
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-14 ml-auto"></div>
                      </div>
                    </td>
                    {/* Periods */}
                    <td className="px-4 py-3 text-center">
                      <div className="h-6 bg-gray-200 rounded animate-pulse w-16 mx-auto"></div>
                    </td>
                    {/* Status + Updated */}
                    <td className="px-4 py-3 text-center">
                      <div className="space-y-1">
                        <div className="h-5 bg-gray-200 rounded-full animate-pulse w-16 mx-auto"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-14 mx-auto"></div>
                      </div>
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-1">
                        <div className="w-7 h-7 bg-gray-200 rounded animate-pulse"></div>
                        <div className="w-7 h-7 bg-gray-200 rounded animate-pulse"></div>
                        <div className="w-7 h-7 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : tours.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">ไม่พบทัวร์</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-center px-3 py-3 font-medium text-gray-700 whitespace-nowrap w-10">
                    <input
                      type="checkbox"
                      checked={tours.length > 0 && selectedTours.size === tours.length}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 whitespace-nowrap">รูป</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 whitespace-nowrap">รหัส / ชื่อทัวร์</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-700 whitespace-nowrap">Wholesaler<br/><span className="text-gray-400 font-normal">ประเทศ</span></th>
                  <th className="text-center px-4 py-3 font-medium text-gray-700 whitespace-nowrap">สายการบิน<br/><span className="text-gray-400 font-normal">กลุ่ม</span></th>
                  <th className="text-center px-4 py-3 font-medium text-gray-700 whitespace-nowrap">วัน/คืน<br/><span className="text-gray-400 font-normal">โรงแรม</span></th>
                  <th className="text-right px-4 py-3 font-medium text-gray-700 whitespace-nowrap">ราคา</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-700 whitespace-nowrap">รอบ</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-700 whitespace-nowrap">สถานะ<br/><span className="text-gray-400 font-normal">อัปเดต</span></th>
                  <th className="text-center px-4 py-3 font-medium text-gray-700 whitespace-nowrap">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tours.map((tour, index) => (
                  <tr key={tour.id} className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} ${selectedTours.has(tour.id) ? 'bg-blue-50' : ''}`}>
                    {/* Checkbox */}
                    <td className="px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedTours.has(tour.id)}
                        onChange={() => toggleSelectTour(tour.id)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    {/* Cover Image */}
                    <td className="px-4 py-3">
                      <div className="relative w-16 h-12 rounded-lg overflow-hidden bg-gray-100 shadow-sm">
                        {tour.cover_image_url ? (
                          <img
                            src={tour.cover_image_url.replace('/public', '/thumbnail')}
                            alt={tour.cover_image_alt || tour.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <MapPin className="w-5 h-5" />
                          </div>
                        )}
                        {/* Badge overlay */}
                        {tour.badge && (
                          <span className={`absolute top-0 left-0 px-1 py-0.5 text-[10px] font-medium ${getBadgeColor(tour.badge)}`}>
                            {TOUR_BADGES[tour.badge]?.slice(0, 3) || tour.badge.slice(0, 3)}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Tour Code & Title */}
                    <td className="px-4 py-3">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-mono font-semibold text-blue-600">{tour.tour_code}</span>
                          {tour.wholesaler_tour_code && (
                            <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                              {tour.wholesaler_tour_code}
                            </span>
                          )}
                        </div>
                        <div className="font-medium text-gray-900 line-clamp-2 max-w-xs">{tour.title}</div>
                        {/* Hashtags */}
                        {tour.hashtags && (Array.isArray(tour.hashtags) ? tour.hashtags : []).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(Array.isArray(tour.hashtags) ? tour.hashtags : []).slice(0, 2).map((tag, idx) => (
                              <span key={idx} className="text-[10px] text-blue-600">
                                {tag.startsWith('#') ? tag : `#${tag}`}
                              </span>
                            ))}
                            {(Array.isArray(tour.hashtags) ? tour.hashtags : []).length > 2 && (
                              <span className="text-[10px] text-gray-400">+{(Array.isArray(tour.hashtags) ? tour.hashtags : []).length - 2}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Wholesaler + Countries */}
                    <td className="px-4 py-3 text-center">
                      <div className="space-y-1">
                        {tour.wholesaler ? (
                          <Link 
                            href={`/dashboard/integrations/${tour.wholesaler_id}`}
                            className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded hover:bg-purple-100 transition-colors inline-block max-w-[100px] truncate"
                            title={tour.wholesaler.name}
                          >
                            {tour.wholesaler.name}
                          </Link>
                        ) : tour.data_source === 'manual' ? (
                          <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded">
                            สร้างเอง
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                        {tour.countries && tour.countries.length > 0 ? (
                          <div className="flex flex-wrap justify-center gap-0.5">
                            {tour.countries.slice(0, 2).map((country) => (
                              <span
                                key={country.id}
                                className="text-[10px] text-blue-600"
                                title={country.name_en}
                              >
                                {country.name_th || country.name_en}
                              </span>
                            ))}
                            {tour.countries.length > 2 && (
                              <span className="text-[10px] text-gray-400">+{tour.countries.length - 2}</span>
                            )}
                          </div>
                        ) : null}
                      </div>
                    </td>

                    {/* Transports (สายการบิน) + Tour Type */}
                    <td className="px-4 py-3 text-center">
                      <div className="space-y-1">
                        {tour.transports && tour.transports.length > 0 ? (() => {
                          const seen = new Set<string | number>();
                          const uniqueTransports: TourTransport[] = [];
                          for (const t of tour.transports!) {
                            const key = t.transport?.id || t.transport_code;
                            if (!seen.has(key)) {
                              seen.add(key);
                              uniqueTransports.push(t);
                            }
                          }
                          return (
                            <div className="flex flex-wrap justify-center gap-0.5">
                              {uniqueTransports.slice(0, 2).map((t, idx) => (
                                <span 
                                  key={idx} 
                                  className="text-xs bg-gray-100 text-gray-700 px-1 py-0.5 rounded font-mono"
                                  title={t.transport?.name || t.transport_name}
                                >
                                  {t.transport?.name || t.transport_name}
                                </span>
                              ))}
                              {uniqueTransports.length > 2 && (
                                <span className="text-[10px] text-gray-400">+{uniqueTransports.length - 2}</span>
                              )}
                            </div>
                          );
                        })() : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${getTourTypeColor(tour.tour_type)}`}>
                          {TOUR_TYPES[tour.tour_type] || tour.tour_type}
                        </span>
                      </div>
                    </td>

                    {/* Duration + Hotel Star */}
                    <td className="px-4 py-3 text-center">
                      <div className="space-y-0.5">
                        <span className="text-gray-700 text-xs block">
                          {tour.duration_days}D{tour.duration_nights}N
                        </span>
                        {tour.hotel_star ? (
                          <span className="flex items-center justify-center gap-0.5 text-yellow-500">
                            <Star className="w-3 h-3 fill-current" />
                            <span className="text-gray-700 text-[10px]">
                              {tour.hotel_star}
                            </span>
                          </span>
                        ) : (
                          <span className="text-gray-400 text-[10px]">-</span>
                        )}
                      </div>
                    </td>

                    {/* Price + Promotion Badge */}
                    <td className="px-4 py-3 text-right">
                      <div className="space-y-0.5">
                        {tour.discount_amount && parseFloat(tour.discount_amount) > 0 ? (
                          <>
                            <div className="text-red-400 line-through text-xs">฿{formatPrice(tour.min_price)}</div>
                            <div className="font-bold text-green-600">฿{formatPrice(tour.display_price)}</div>
                          </>
                        ) : (
                          <span className="font-semibold text-gray-800">฿{formatPrice(tour.display_price || tour.min_price)}</span>
                        )}
                        {/* Show promotion names from periods */}
                        {(() => {
                          const promoNames = new Set<string>();
                          tour.periods?.forEach(period => {
                            if (period.offer?.promotion?.name) {
                              promoNames.add(period.offer.promotion.name);
                            }
                            period.offer?.promotions?.forEach(p => {
                              if (p.name && p.is_active) promoNames.add(p.name);
                            });
                          });
                          const names = Array.from(promoNames).slice(0, 2);
                          if (names.length === 0 && tour.has_promotion) {
                            return (
                              <span className="block px-1.5 py-0.5 rounded text-[10px] font-medium bg-pink-100 text-pink-700 text-center">
                                โปรโมชั่น
                              </span>
                            );
                          }
                          return names.map((name, idx) => (
                            <span key={idx} className="block px-1.5 py-0.5 rounded text-[10px] font-medium bg-pink-100 text-pink-700 text-center truncate max-w-[100px]" title={name}>
                              {name}
                            </span>
                          ));
                        })()}
                      </div>
                    </td>

                    {/* Departures */}
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setPeriodsTour(tour)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="font-medium">{tour.total_departures || 0}</span>
                      </button>
                    </td>

                    {/* Status + Update */}
                    <td className="px-4 py-3 text-center">
                      <div className="space-y-1">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(tour.status)}`}>
                          {TOUR_STATUS[tour.status]}
                        </span>
                        <div className="flex flex-col items-center">
                          {tour.last_synced_at ? (
                            <div className="flex items-center gap-0.5 text-[10px] text-blue-600" title={`Sync: ${tour.last_synced_at}`}>
                              <Cloud className="w-3 h-3" />
                              <span>{formatDateTime(tour.last_synced_at)}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-0.5 text-[10px] text-gray-400">
                              <Clock className="w-3 h-3" />
                              <span>{formatDateTime(tour.updated_at || tour.created_at)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleCopyTour(tour)}
                          className={`p-1.5 rounded transition-colors ${
                            copiedTourId === tour.id 
                              ? 'bg-green-100 text-green-600' 
                              : 'hover:bg-gray-100 text-gray-500 hover:text-green-600'
                          }`}
                          title={copiedTourId === tour.id ? 'คัดลอกแล้ว!' : 'คัดลอกข้อมูล'}
                        >
                          {copiedTourId === tour.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => setPreviewTour(tour)}
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                          title="ดูตัวอย่าง"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <Link href={`/dashboard/tours/${tour.id}/edit`}>
                          <button
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-colors"
                            title="แก้ไข"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </Link>
                        <button
                          onClick={() => setDeleteConfirm(tour.id)}
                          className="p-1.5 rounded hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
                          title="ลบ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-gray-600 px-4">
            หน้า {currentPage} จาก {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Preview Modal */}
      {previewTour && (
        <TourPreviewModal
          tour={previewTour}
          onClose={() => setPreviewTour(null)}
        />
      )}

      {/* Periods Modal */}
      {periodsTour && (
        <TourPeriodsModal
          tour={periodsTour}
          onClose={() => setPeriodsTour(null)}
          onUpdate={() => { fetchTours(); fetchCounts(); }}
        />
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">ยืนยันการลบ</h3>
            <p className="text-gray-600 mb-4">คุณต้องการลบทัวร์นี้หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)} disabled={isDeleting}>ยกเลิก</Button>
              <Button variant="danger" onClick={() => handleDelete(deleteConfirm)} disabled={isDeleting}>
                {isDeleting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    กำลังลบ...
                  </>
                ) : 'ลบ'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Mass Delete Confirm Modal */}
      {massDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">ยืนยันการลบหลายรายการ</h3>
            <p className="text-gray-600 mb-4">
              คุณต้องการลบทัวร์ที่เลือก <span className="font-semibold text-red-600">{selectedTours.size} รายการ</span> หรือไม่?
              <br />
              <span className="text-sm text-red-500">การดำเนินการนี้ไม่สามารถย้อนกลับได้</span>
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setMassDeleteConfirm(false)} disabled={isMassDeleting}>ยกเลิก</Button>
              <Button variant="danger" onClick={handleMassDelete} disabled={isMassDeleting}>
                {isMassDeleting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    กำลังลบ...
                  </>
                ) : `ลบ ${selectedTours.size} รายการ`}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
