'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Card } from '@/components/ui';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Plane,
  Bus,
  Car,
  Ship,
  Check,
  X,
  Loader2,
  Power,
  Image as ImageIcon,
} from 'lucide-react';
import Link from 'next/link';
import { transportsApi, Transport, TRANSPORT_TYPES, PaginationMeta } from '@/lib/api';

const TYPE_ICONS: Record<string, React.ElementType> = {
  airline: Plane,
  bus: Bus,
  van: Car,
  boat: Ship,
};

export default function TransportsPage() {
  const [search, setSearch] = useState('');
  const [transports, setTransports] = useState<Transport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'on' | 'off'>('all');
  const [showFilter, setShowFilter] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [toggling, setToggling] = useState<number | null>(null);

  const fetchTransports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: Record<string, string> = {
        page: currentPage.toString(),
        per_page: '50',
      };
      
      if (search) params.search = search;
      if (filterType !== 'all') params.type = filterType;
      if (filterStatus !== 'all') params.status = filterStatus;

      const response = await transportsApi.list(params);
      
      if (response.success) {
        setTransports(response.data || []);
        setMeta(response.meta || null);
      } else {
        setError(response.message || 'Failed to load transports');
      }
    } catch (err: any) {
      console.error('Transports API error:', err);
      setError(err.message || 'Failed to load transports');
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, filterType, filterStatus]);

  useEffect(() => {
    fetchTransports();
  }, [fetchTransports]);

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
      const response = await transportsApi.delete(id);
      
      if (response.success) {
        fetchTransports();
      } else {
        alert(response.message || 'Failed to delete transport');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete transport');
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      setToggling(id);
      const response = await transportsApi.toggleStatus(id);
      
      if (response.success) {
        setTransports(prev => 
          prev.map(t => t.id === id ? { ...t, status: t.status === 'on' ? 'off' : 'on' } : t)
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

  const getTypeIcon = (type: string) => {
    const Icon = TYPE_ICONS[type] || Plane;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transports</h1>
          <p className="text-gray-500 mt-1">จัดการข้อมูลสายการบินและยานพาหนะ</p>
        </div>
        <Link href="/dashboard/transports/create">
          <Button>
            <Plus className="w-4 h-4" />
            Add Transport
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
                      ประเภท
                    </label>
                    <select
                      value={filterType}
                      onChange={(e) => {
                        setFilterType(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                    >
                      <option value="all">ทั้งหมด</option>
                      {Object.entries(TRANSPORT_TYPES).map(([value, label]) => (
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
                        setFilterStatus(e.target.value as 'all' | 'on' | 'off');
                        setCurrentPage(1);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                    >
                      <option value="all">ทั้งหมด</option>
                      <option value="on">เปิดใช้งาน</option>
                      <option value="off">ปิดใช้งาน</option>
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
          {transports.length === 0 ? (
            <Card>
              <div className="px-6 py-12 text-center text-gray-500">
                ไม่พบข้อมูล
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {transports.map((transport) => (
                <div
                  key={transport.id}
                  className={`bg-white rounded-lg border ${
                    transport.status === 'off' ? 'border-gray-200 opacity-50' : 'border-gray-200'
                  } overflow-hidden hover:shadow-md hover:border-blue-300 transition-all duration-200 group`}
                >
                  <div className="flex items-center p-2 gap-3">
                    {/* Image - Small */}
                    <div className="w-14 h-14 bg-gray-50 rounded-lg flex-shrink-0 flex items-center justify-center p-1 relative">
                      {transport.image ? (
                        <img
                          src={transport.image}
                          alt={transport.name}
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`flex items-center justify-center ${transport.image ? 'hidden' : ''}`}>
                        {getTypeIcon(transport.type)}
                      </div>
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate" title={transport.name}>
                        {transport.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {transport.code && (
                          <span className="font-mono text-xs font-bold text-blue-600">
                            {transport.code}
                          </span>
                        )}
                        {transport.code1 && (
                          <span className="font-mono text-xs text-gray-400">
                            {transport.code1}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                          {getTypeIcon(transport.type)}
                          <span className="hidden sm:inline">{TRANSPORT_TYPES[transport.type]}</span>
                        </span>
                        <span className={`inline-flex items-center gap-0.5 text-xs ${
                          transport.status === 'on' ? 'text-green-600' : 'text-gray-400'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            transport.status === 'on' ? 'bg-green-500' : 'bg-gray-300'
                          }`} />
                          <span className="hidden sm:inline">{transport.status === 'on' ? 'เปิด' : 'ปิด'}</span>
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/dashboard/transports/${transport.id}`}>
                        <button className="w-7 h-7 rounded bg-gray-100 text-gray-600 hover:bg-blue-500 hover:text-white transition-colors flex items-center justify-center">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      </Link>
                      <button
                        onClick={() => handleToggleStatus(transport.id)}
                        disabled={toggling === transport.id}
                        className={`w-7 h-7 rounded transition-colors flex items-center justify-center ${
                          transport.status === 'on' 
                            ? 'bg-green-100 text-green-600 hover:bg-green-500 hover:text-white' 
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-500 hover:text-white'
                        }`}
                      >
                        {toggling === transport.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Power className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(transport.id)}
                        disabled={deleting === transport.id}
                        className="w-7 h-7 rounded bg-gray-100 text-gray-600 hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center"
                      >
                        {deleting === transport.id ? (
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
