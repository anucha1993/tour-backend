'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { Button, Card } from '@/components/ui';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  MapPin,
  Star,
  Loader2,
  Power,
  X,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { citiesApi, City, PaginationMeta } from '@/lib/api';

// Function to convert ISO2 code to flag URL
const getFlagUrl = (iso2: string): string => {
  if (!iso2 || iso2.length !== 2) return '';
  return `https://flagcdn.com/w80/${iso2.toLowerCase()}.png`;
};

interface PageProps {
  params: Promise<{ countryId: string }>;
}

export default function CitiesByCountryPage({ params }: PageProps) {
  const { countryId } = use(params);
  const router = useRouter();
  
  const [search, setSearch] = useState('');
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterPopular, setFilterPopular] = useState<'all' | 'popular' | 'normal'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [showFilter, setShowFilter] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [toggling, setToggling] = useState<number | null>(null);
  const [togglingPopular, setTogglingPopular] = useState<number | null>(null);
  const [countryInfo, setCountryInfo] = useState<{
    id: number;
    iso2: string;
    name_en: string;
    name_th: string | null;
  } | null>(null);

  const fetchCities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: Record<string, string> = {
        page: currentPage.toString(),
        per_page: '50',
        country_id: countryId,
      };
      
      if (search) params.search = search;
      if (filterPopular === 'popular') params.is_popular = 'true';
      if (filterPopular === 'normal') params.is_popular = 'false';
      if (filterStatus === 'active') params.is_active = 'true';
      if (filterStatus === 'inactive') params.is_active = 'false';

      const response = await citiesApi.list(params);
      
      if (response.success) {
        setCities(response.data || []);
        setMeta(response.meta || null);
        
        // Get country info from first city
        if (response.data && response.data.length > 0 && response.data[0].country) {
          setCountryInfo(response.data[0].country);
        }
      } else {
        setError(response.message || 'Failed to load cities');
      }
    } catch (err: any) {
      console.error('Cities API error:', err);
      setError(err.message || 'Failed to load cities');
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, countryId, filterPopular, filterStatus]);

  useEffect(() => {
    fetchCities();
  }, [fetchCities]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleDelete = async (id: number) => {
    if (!confirm('คุณต้องการลบข้อมูลนี้หรือไม่?')) return;

    try {
      setDeleting(id);
      const response = await citiesApi.delete(id);
      
      if (response.success) {
        fetchCities();
      } else {
        alert(response.message || 'Failed to delete city');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete city');
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      setToggling(id);
      const response = await citiesApi.toggleStatus(id);
      
      if (response.success) {
        setCities(prev => 
          prev.map(c => c.id === id ? { ...c, is_active: !c.is_active } : c)
        );
      } else {
        alert(response.message || 'Failed to toggle status');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to toggle status');
    } finally {
      setToggling(null);
    }
  };

  const handleTogglePopular = async (id: number) => {
    try {
      setTogglingPopular(id);
      const response = await citiesApi.togglePopular(id);
      
      if (response.success) {
        setCities(prev => 
          prev.map(c => c.id === id ? { ...c, is_popular: !c.is_popular } : c)
        );
      } else {
        alert(response.message || 'Failed to toggle popular');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to toggle popular');
    } finally {
      setTogglingPopular(null);
    }
  };

  const clearFilters = () => {
    setFilterPopular('all');
    setFilterStatus('all');
  };

  const hasActiveFilters = filterPopular !== 'all' || filterStatus !== 'all';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Back Button */}
          <Link href="/dashboard/cities">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              ย้อนกลับ
            </Button>
          </Link>
          
          <div className="flex items-center gap-3">
            {/* Country Flag */}
            {countryInfo?.iso2 && (
              <div className="w-12 h-8 rounded overflow-hidden shadow-sm">
                <img
                  src={getFlagUrl(countryInfo.iso2)}
                  alt={countryInfo.name_en}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {countryInfo?.name_th || countryInfo?.name_en || 'เมือง'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {meta ? `${meta.total} เมือง` : 'กำลังโหลด...'}
              </p>
            </div>
          </div>
        </div>
        
        <Link href={`/dashboard/cities/create?country_id=${countryId}`}>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            เพิ่มเมือง
          </Button>
        </Link>
      </div>

      {/* Search and Filter */}
      <Card>
        <div className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="ค้นหาเมือง..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            {/* Filter Button */}
            <Button
              variant={showFilter ? 'primary' : 'secondary'}
              onClick={() => setShowFilter(!showFilter)}
              className="relative"
            >
              <Filter className="w-4 h-4 mr-2" />
              ตัวกรอง
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
              )}
            </Button>
          </div>

          {/* Filter Options */}
          {showFilter && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap gap-4 items-end">
                {/* Popular Filter */}
                <div className="min-w-[150px]">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ยอดนิยม</label>
                  <select
                    value={filterPopular}
                    onChange={(e) => setFilterPopular(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="all">ทั้งหมด</option>
                    <option value="popular">ยอดนิยม</option>
                    <option value="normal">ปกติ</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div className="min-w-[150px]">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">สถานะ</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="all">ทั้งหมด</option>
                    <option value="active">ใช้งาน</option>
                    <option value="inactive">ไม่ใช้งาน</option>
                  </select>
                </div>

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <Button variant="secondary" onClick={clearFilters} size="sm">
                    <X className="w-4 h-4 mr-1" />
                    ล้างตัวกรอง
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <>
          {/* Cities Table */}
          {cities.length === 0 ? (
            <Card>
              <div className="px-6 py-12 text-center">
                <MapPin className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  ไม่พบเมืองในประเทศนี้
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  ยังไม่มีเมืองสำหรับประเทศนี้ หรือไม่พบตามเงื่อนไขที่ค้นหา
                </p>
                <Link href={`/dashboard/cities/create?country_id=${countryId}`}>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    เพิ่มเมืองใหม่
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        ชื่อเมือง (EN)
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        ชื่อเมือง (TH)
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24">
                        ยอดนิยม
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24">
                        สถานะ
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32">
                        จัดการ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {cities.map((city) => (
                      <tr 
                        key={city.id} 
                        className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                          !city.is_active ? 'opacity-50' : ''
                        }`}
                      >
                        {/* ชื่อเมือง EN */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
                            <span className="font-medium text-gray-900 dark:text-white">
                              {city.name_en}
                            </span>
                          </div>
                        </td>
                        
                        {/* ชื่อเมือง TH */}
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                          {city.name_th || '-'}
                        </td>
                        
                        {/* ยอดนิยม */}
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleTogglePopular(city.id)}
                            disabled={togglingPopular === city.id}
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                              city.is_popular 
                                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 hover:bg-yellow-200' 
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-400 hover:bg-yellow-100 hover:text-yellow-600'
                            }`}
                            title={city.is_popular ? 'ยกเลิกยอดนิยม' : 'ตั้งเป็นยอดนิยม'}
                          >
                            {togglingPopular === city.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Star className={`w-4 h-4 ${city.is_popular ? 'fill-current' : ''}`} />
                            )}
                          </button>
                        </td>
                        
                        {/* สถานะ */}
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleToggleStatus(city.id)}
                            disabled={toggling === city.id}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                              city.is_active 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200' 
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-green-100 hover:text-green-700'
                            }`}
                            title={city.is_active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                          >
                            {toggling === city.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <>
                                <Power className="w-3 h-3" />
                                {city.is_active ? 'ใช้งาน' : 'ปิด'}
                              </>
                            )}
                          </button>
                        </td>
                        
                        {/* จัดการ */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <Link href={`/dashboard/cities/${city.id}`}>
                              <button className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/30 transition-colors">
                                <Edit className="w-4 h-4" />
                              </button>
                            </Link>
                            <button
                              onClick={() => handleDelete(city.id)}
                              disabled={deleting === city.id}
                              className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 transition-colors"
                            >
                              {deleting === city.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
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
          {meta && meta.last_page > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                variant="secondary"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                ก่อนหน้า
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                หน้า {currentPage} / {meta.last_page}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={currentPage === meta.last_page}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                ถัดไป
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
