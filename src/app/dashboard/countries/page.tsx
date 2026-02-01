'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Card } from '@/components/ui';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Globe,
  Check,
  X,
  Loader2,
  Power,
} from 'lucide-react';
import Link from 'next/link';
import { countriesApi, Country, COUNTRY_REGIONS, PaginationMeta } from '@/lib/api';

// Function to convert ISO2 code to flag emoji
const getFlagEmoji = (iso2: string): string => {
  if (!iso2 || iso2.length !== 2) return '';
  const codePoints = iso2
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

// Flag image URL from flagcdn.com
const getFlagUrl = (iso2: string): string => {
  if (!iso2 || iso2.length !== 2) return '';
  return `https://flagcdn.com/w80/${iso2.toLowerCase()}.png`;
};

export default function CountriesPage() {
  const [search, setSearch] = useState('');
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterRegion, setFilterRegion] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [showFilter, setShowFilter] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [toggling, setToggling] = useState<number | null>(null);

  const fetchCountries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: Record<string, string> = {
        page: currentPage.toString(),
        per_page: '50',
      };
      
      if (search) params.search = search;
      if (filterRegion !== 'all') params.region = filterRegion;
      if (filterStatus === 'active') params.is_active = 'true';
      if (filterStatus === 'inactive') params.is_active = 'false';

      const response = await countriesApi.list(params);
      
      if (response.success) {
        setCountries(response.data || []);
        setMeta(response.meta || null);
      } else {
        setError(response.message || 'Failed to load countries');
      }
    } catch (err: any) {
      console.error('Countries API error:', err);
      setError(err.message || 'Failed to load countries');
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, filterRegion, filterStatus]);

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

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
      const response = await countriesApi.delete(id);
      
      if (response.success) {
        fetchCountries();
      } else {
        alert(response.message || 'Failed to delete country');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete country');
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      setToggling(id);
      const response = await countriesApi.toggleStatus(id);
      
      if (response.success) {
        setCountries(prev => 
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Countries</h1>
          <p className="text-gray-500 mt-1">จัดการข้อมูลประเทศ</p>
        </div>
        <Link href="/dashboard/countries/create">
          <Button>
            <Plus className="w-4 h-4" />
            Add Country
          </Button>
        </Link>
      </div>

      {/* Filters & Search */}
      <Card>
        <div className="p-4 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาด้วยรหัสหรือชื่อ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
            />
          </div>
          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setShowFilter(!showFilter)}
              className="gap-2"
            >
              <Filter className="w-4 h-4" />
              Filter
            </Button>
            
            {showFilter && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-10">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ภูมิภาค
                    </label>
                    <select
                      value={filterRegion}
                      onChange={(e) => {
                        setFilterRegion(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                    >
                      <option value="all">ทั้งหมด</option>
                      {Object.entries(COUNTRY_REGIONS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      สถานะ
                    </label>
                    <select
                      value={filterStatus}
                      onChange={(e) => {
                        setFilterStatus(e.target.value as 'all' | 'active' | 'inactive');
                        setCurrentPage(1);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                    >
                      <option value="all">ทั้งหมด</option>
                      <option value="active">เปิดใช้งาน</option>
                      <option value="inactive">ปิดใช้งาน</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
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
          {/* Cards Grid */}
          {countries.length === 0 ? (
            <Card>
              <div className="px-6 py-12 text-center text-gray-500">
                ไม่พบข้อมูล
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {countries.map((country) => (
                <div
                  key={country.id}
                  className={`bg-white rounded-lg border ${
                    !country.is_active ? 'border-gray-200 opacity-50' : 'border-gray-200'
                  } overflow-hidden hover:shadow-md hover:border-blue-300 transition-all duration-200 group`}
                >
                  <div className="flex items-center p-3 gap-3">
                    {/* Flag */}
                    <div className="w-12 h-12 bg-gray-50 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                      <img 
                        src={getFlagUrl(country.iso2)} 
                        alt={`${country.name_en} flag`}
                        className="w-10 h-7 object-cover rounded"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate" title={country.name_th || country.name_en}>
                        {country.name_th || country.name_en}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-xs font-bold text-blue-600">
                          {country.iso2}
                        </span>
                        <span className="font-mono text-xs text-gray-400">
                          {country.iso3}
                        </span>
                      </div>
                      {country.region && (
                        <span className="text-xs text-gray-500">
                          {COUNTRY_REGIONS[country.region] || country.region}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/dashboard/countries/${country.id}`}>
                        <button className="w-7 h-7 rounded bg-gray-100 text-gray-600 hover:bg-blue-500 hover:text-white transition-colors flex items-center justify-center">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      </Link>
                      <button
                        onClick={() => handleToggleStatus(country.id)}
                        disabled={toggling === country.id}
                        className={`w-7 h-7 rounded transition-colors flex items-center justify-center ${
                          country.is_active 
                            ? 'bg-green-100 text-green-600 hover:bg-green-500 hover:text-white' 
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-500 hover:text-white'
                        }`}
                      >
                        {toggling === country.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Power className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(country.id)}
                        disabled={deleting === country.id}
                        className="w-7 h-7 rounded bg-gray-100 text-gray-600 hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center"
                      >
                        {deleting === country.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {meta && meta.last_page > 1 && (
            <Card>
              <div className="px-6 py-4 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  แสดง {(meta.current_page - 1) * meta.per_page + 1} - {Math.min(meta.current_page * meta.per_page, meta.total)} จาก {meta.total} รายการ
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                  >
                    ก่อนหน้า
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === meta.last_page}
                    onClick={() => setCurrentPage(p => p + 1)}
                  >
                    ถัดไป
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
