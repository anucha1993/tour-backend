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
  Loader2,
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
  Flame,
  CheckCircle,
  XCircle,
  FileEdit,
  Map,
} from 'lucide-react';
import {
  toursApi,
  Tour,
  TourCounts,
  TourTransport,
  TOUR_STATUS,
  TOUR_THEMES,
  TOUR_TYPES,
  TOUR_BADGES,
} from '@/lib/api';
import TourPreviewModal from './TourPreviewModal';
import TourPeriodsModal from './TourPeriodsModal';

// ─── Tab Definitions ─────────────────────────────────────────────
// Each tab maps to a unique preset filter sent to the API
type TabKey = 'all' | 'api' | 'manual' | 'active' | 'draft' | 'inactive' | 'fire_sale';

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
  { key: 'fire_sale', label: 'โปรไฟไหม้',   icon: Flame,       params: { promotion_type: 'fire_sale' }, getCount: c => c.by_promotion_type.fire_sale },
];

/** Determine active tab from URL searchParams */
function resolveTab(searchParams: URLSearchParams): TabKey {
  const status = searchParams.get('status');
  const dataSource = searchParams.get('data_source');
  const promoType = searchParams.get('promotion_type');

  if (promoType === 'fire_sale') return 'fire_sale';
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
    } catch (err: any) {
      // Abort errors are expected — ignore
      if (err?.name === 'AbortError' || err?.message === 'The user aborted a request.') return;
      if (thisRequestId !== requestIdRef.current) return;
      console.error('Failed to fetch tours:', err);
    } finally {
      if (thisRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [currentPage, search, tourTypeFilter, themeFilter, activeTabDef]);

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
  const hasAdditionalFilters = tourTypeFilter || themeFilter || search;
  
  // Clear additional filters only
  const clearAdditionalFilters = () => {
    setTourTypeFilter('');
    setThemeFilter('');
    setSearch('');
    setCurrentPage(1);
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
            <Button
              variant="danger"
              size="sm"
              onClick={() => setMassDeleteConfirm(true)}
            >
              <Trash2 className="w-4 h-4" />
              ลบที่เลือก ({selectedTours.size})
            </Button>
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

            {hasAdditionalFilters && (
              <button
                onClick={clearAdditionalFilters}
                className="px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                ล้างตัวกรอง
              </button>
            )}
          </div>
        </div>
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
                  <th className="text-center px-4 py-3 font-medium text-gray-700 whitespace-nowrap">Wholesaler</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-700 whitespace-nowrap">ประเทศ</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-700 whitespace-nowrap">สายการบิน</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-700 whitespace-nowrap">กลุ่ม</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-700 whitespace-nowrap">วัน/คืน</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-700 whitespace-nowrap">โรงแรม</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-700 whitespace-nowrap">ราคา</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-700 whitespace-nowrap">รอบ</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-700 whitespace-nowrap">สถานะ</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-700 whitespace-nowrap">อัปเดต</th>
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
                    {/* Wholesaler */}
                    <td className="px-4 py-3 text-center">
                      <div className="h-6 bg-gray-200 rounded animate-pulse w-16 mx-auto"></div>
                    </td>
                    {/* Countries */}
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-1">
                        <div className="h-5 bg-gray-200 rounded animate-pulse w-10"></div>
                        <div className="h-5 bg-gray-200 rounded animate-pulse w-10"></div>
                      </div>
                    </td>
                    {/* Airlines */}
                    <td className="px-4 py-3 text-center">
                      <div className="h-5 bg-gray-200 rounded animate-pulse w-12 mx-auto"></div>
                    </td>
                    {/* Tour Type */}
                    <td className="px-4 py-3 text-center">
                      <div className="h-5 bg-gray-200 rounded animate-pulse w-14 mx-auto"></div>
                    </td>
                    {/* Days/Nights */}
                    <td className="px-4 py-3 text-center">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-14 mx-auto"></div>
                    </td>
                    {/* Hotel */}
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-0.5">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="w-3 h-3 bg-gray-200 rounded animate-pulse"></div>
                        ))}
                      </div>
                    </td>
                    {/* Price */}
                    <td className="px-4 py-3 text-right">
                      <div className="h-5 bg-gray-200 rounded animate-pulse w-20 ml-auto"></div>
                    </td>
                    {/* Periods */}
                    <td className="px-4 py-3 text-center">
                      <div className="h-6 bg-gray-200 rounded animate-pulse w-16 mx-auto"></div>
                    </td>
                    {/* Status */}
                    <td className="px-4 py-3 text-center">
                      <div className="h-5 bg-gray-200 rounded-full animate-pulse w-16 mx-auto"></div>
                    </td>
                    {/* Updated */}
                    <td className="px-4 py-3 text-center">
                      <div className="space-y-1">
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-16 mx-auto"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-10 mx-auto"></div>
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
                  <th className="text-center px-4 py-3 font-medium text-gray-700 whitespace-nowrap">Wholesaler</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-700 whitespace-nowrap">ประเทศ</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-700 whitespace-nowrap">สายการบิน</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-700 whitespace-nowrap">กลุ่ม</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-700 whitespace-nowrap">วัน/คืน</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-700 whitespace-nowrap">โรงแรม</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-700 whitespace-nowrap">ราคา</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-700 whitespace-nowrap">รอบ</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-700 whitespace-nowrap">สถานะ</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-700 whitespace-nowrap">อัปเดต</th>
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

                    {/* Wholesaler */}
                    <td className="px-4 py-3 text-center">
                      {tour.wholesaler ? (
                        <Link 
                          href={`/dashboard/integrations/${tour.wholesaler_id}`}
                          className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded hover:bg-purple-100 transition-colors inline-block max-w-[100px] truncate"
                          title={tour.wholesaler.name}
                        >
                          {tour.wholesaler.name}
                        </Link>
                      ) : tour.data_source === 'manual' ? (
                        <span className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded">
                          สร้างเอง
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>

                    {/* Countries */}
                    <td className="px-4 py-3 text-center">
                      {tour.countries && tour.countries.length > 0 ? (
                        <div className="flex flex-wrap justify-center gap-1">
                          {tour.countries.slice(0, 3).map((country) => (
                            <span
                              key={country.id}
                              className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded"
                              title={country.name_en}
                            >
                              {country.name_th || country.name_en}
                            </span>
                          ))}
                          {tour.countries.length > 3 && (
                            <span className="text-xs text-gray-400">+{tour.countries.length - 3}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>

                    {/* Transports (สายการบิน) */}
                    <td className="px-4 py-3 text-center">
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
                          <div className="flex flex-wrap justify-center gap-1">
                            {uniqueTransports.slice(0, 3).map((t, idx) => (
                              <span 
                                key={idx} 
                                className="text-xs bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded font-mono"
                                title={t.transport?.name || t.transport_name}
                              >
                                {t.transport?.name || t.transport_name}
                              </span>
                            ))}
                            {uniqueTransports.length > 3 && (
                              <span className="text-xs text-gray-400">+{uniqueTransports.length - 3}</span>
                            )}
                          </div>
                        );
                      })() : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>

                    {/* Tour Type */}
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getTourTypeColor(tour.tour_type)}`}>
                        {TOUR_TYPES[tour.tour_type] || tour.tour_type}
                      </span>
                    </td>

                    {/* Duration */}
                    <td className="px-4 py-3 text-center">
                      <span className="text-gray-700">
                        {tour.duration_days} วัน {tour.duration_nights} คืน
                      </span>
                    </td>

                    {/* Hotel Star */}
                    <td className="px-4 py-3 text-center">
                      {tour.hotel_star ? (
                        <span className="flex items-center justify-center gap-0.5 text-yellow-500">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span className="text-gray-700 text-xs">
                            {tour.hotel_star}
                          </span>
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>

                    {/* Price */}
                    <td className="px-4 py-3 text-right">
                      {tour.discount_amount && parseFloat(tour.discount_amount) > 0 ? (
                        <div>
                          <div className="text-red-400 line-through text-xs">฿{formatPrice(tour.min_price)}</div>
                          <div className="font-bold text-green-600">฿{formatPrice(tour.display_price)}</div>
                        </div>
                      ) : (
                        <span className="font-semibold text-gray-800">฿{formatPrice(tour.display_price || tour.min_price)}</span>
                      )}
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

                    {/* Status */}
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(tour.status)}`}>
                        {TOUR_STATUS[tour.status]}
                      </span>
                      {tour.has_promotion && (
                        <span className="block mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-pink-100 text-pink-700">
                          โปรโมชั่น
                        </span>
                      )}
                    </td>

                    {/* Last Update / Sync */}
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        {tour.last_synced_at ? (
                          <div className="flex items-center gap-1 text-xs text-blue-600" title={`Sync: ${tour.last_synced_at}`}>
                            <Cloud className="w-3 h-3" />
                            <span>{formatDateTime(tour.last_synced_at)}</span>
                          </div>
                        ) : tour.data_source === 'manual' ? (
                          <div className="flex items-center gap-1 text-xs text-gray-500" title={`สร้างเมื่อ: ${tour.created_at}`}>
                            <PenLine className="w-3 h-3" />
                            <span>{formatDateTime(tour.updated_at || tour.created_at)}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <Clock className="w-3 h-3" />
                            <span>{formatDateTime(tour.updated_at || tour.created_at)}</span>
                          </div>
                        )}
                        {tour.data_source && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${tour.data_source === 'api' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                            {tour.data_source === 'api' ? 'API' : 'Manual'}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
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
