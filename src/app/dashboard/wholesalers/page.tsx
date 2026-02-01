'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Card } from '@/components/ui';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  Building2,
  Check,
  X,
  Loader2,
  Power,
} from 'lucide-react';
import Link from 'next/link';
import { wholesalersApi, Wholesaler, PaginationMeta } from '@/lib/api';

export default function WholesalersPage() {
  const [search, setSearch] = useState('');
  const [wholesalers, setWholesalers] = useState<Wholesaler[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [showFilter, setShowFilter] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [toggling, setToggling] = useState<number | null>(null);

  const fetchWholesalers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: Record<string, string> = {
        page: currentPage.toString(),
        per_page: '15',
      };
      
      if (search) params.search = search;
      if (filterStatus === 'active') params.is_active = '1';
      if (filterStatus === 'inactive') params.is_active = '0';

      console.log('Fetching wholesalers with params:', params);
      const response = await wholesalersApi.list(params);
      console.log('Wholesalers API response:', response);
      
      if (response.success) {
        setWholesalers(response.data || []);
        setMeta(response.meta || null);
      } else {
        setError(response.message || 'Failed to load wholesalers');
      }
    } catch (err: any) {
      console.error('Wholesalers API error:', err);
      setError(err.message || 'Failed to load wholesalers');
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, filterStatus]);

  useEffect(() => {
    fetchWholesalers();
  }, [fetchWholesalers]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleDelete = async (id: number) => {
    if (!confirm('คุณต้องการลบ Wholesaler นี้หรือไม่?')) return;

    try {
      setDeleting(id);
      const response = await wholesalersApi.delete(id);
      
      if (response.success) {
        fetchWholesalers();
      } else {
        alert(response.message || 'Failed to delete wholesaler');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete wholesaler');
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleActive = async (id: number) => {
    try {
      setToggling(id);
      const response = await wholesalersApi.toggleActive(id);
      
      if (response.success) {
        setWholesalers(prev => 
          prev.map(w => w.id === id ? { ...w, is_active: !w.is_active } : w)
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Wholesalers</h1>
          <p className="text-gray-500 mt-1">จัดการข้อมูล Wholesale Partners</p>
        </div>
        <Link href="/dashboard/wholesalers/create">
          <Button>
            <Plus className="w-4 h-4" />
            Add Wholesaler
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
            <Button variant="outline" onClick={() => setShowFilter(!showFilter)}>
              <Filter className="w-4 h-4" />
              กรอง
            </Button>
            {showFilter && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg border border-gray-200 shadow-lg py-1 z-50">
                <button
                  onClick={() => { setFilterStatus('all'); setShowFilter(false); }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${filterStatus === 'all' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
                >
                  ทั้งหมด
                </button>
                <button
                  onClick={() => { setFilterStatus('active'); setShowFilter(false); }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${filterStatus === 'active' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
                >
                  Active
                </button>
                <button
                  onClick={() => { setFilterStatus('inactive'); setShowFilter(false); }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${filterStatus === 'inactive' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
                >
                  Inactive
                </button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card className="p-12 text-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
          <p className="mt-4 text-gray-500">กำลังโหลดข้อมูล...</p>
        </Card>
      )}

      {/* Error State */}
      {error && !loading && (
        <Card className="p-12 text-center">
          <p className="text-red-500">{error}</p>
          <Button onClick={fetchWholesalers} className="mt-4">
            ลองใหม่
          </Button>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !error && wholesalers.length === 0 && (
        <Card className="p-12 text-center">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">ไม่พบ Wholesaler</h3>
          <p className="mt-2 text-gray-500">เริ่มต้นเพิ่ม Wholesaler ใหม่</p>
          <Link href="/dashboard/wholesalers/create" className="mt-4 inline-block">
            <Button>
              <Plus className="w-4 h-4" />
              เพิ่ม Wholesaler
            </Button>
          </Link>
        </Card>
      )}

      {/* Table - Desktop */}
      {!loading && !error && wholesalers.length > 0 && (
        <>
          <Card className="hidden lg:block overflow-visible">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Wholesaler
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      ติดต่อ
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      ทัวร์
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      สถานะ
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      สร้างเมื่อ
                    </th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      จัดการ
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {wholesalers.map((wholesaler) => (
                    <tr 
                      key={wholesaler.id} 
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{wholesaler.name}</p>
                            <p className="text-sm text-gray-500">
                              <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-xs">
                                {wholesaler.code}
                              </span>
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">{wholesaler.contact_email || '-'}</p>
                        <p className="text-sm text-gray-500">{wholesaler.contact_phone || '-'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-50 text-blue-700">
                          {wholesaler.tours_count || 0} ทัวร์
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {wholesaler.is_active ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-sm font-medium bg-green-50 text-green-700">
                            <Check className="w-3.5 h-3.5" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
                            <X className="w-3.5 h-3.5" />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-500">{formatDate(wholesaler.created_at)}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/dashboard/wholesalers/${wholesaler.id}`}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors text-gray-600 hover:text-blue-600 text-sm"
                          >
                            <Eye className="w-4 h-4" />
                            <span>ดู</span>
                          </Link>
                          <Link
                            href={`/dashboard/wholesalers/${wholesaler.id}/edit`}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors text-gray-600 hover:text-blue-600 text-sm"
                          >
                            <Edit className="w-4 h-4" />
                            <span>แก้ไข</span>
                          </Link>
                          <button
                            onClick={() => handleToggleActive(wholesaler.id)}
                            disabled={toggling === wholesaler.id}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg transition-colors text-sm ${
                              wholesaler.is_active 
                                ? 'text-green-600 hover:bg-orange-50 hover:text-orange-600' 
                                : 'text-gray-500 hover:bg-green-50 hover:text-green-600'
                            }`}
                          >
                            {toggling === wholesaler.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Power className="w-4 h-4" />
                            )}
                            <span>{wholesaler.is_active ? 'ปิด' : 'เปิด'}</span>
                          </button>
                          <button
                            onClick={() => handleDelete(wholesaler.id)}
                            disabled={deleting === wholesaler.id}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors text-gray-600 hover:text-red-600 text-sm"
                          >
                            {deleting === wholesaler.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                            <span>ลบ</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {meta && (
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between relative z-0">
                <p className="text-sm text-gray-500">
                  แสดง <span className="font-medium">{(meta.current_page - 1) * meta.per_page + 1}</span> ถึง{' '}
                  <span className="font-medium">{Math.min(meta.current_page * meta.per_page, meta.total)}</span> จาก{' '}
                  <span className="font-medium">{meta.total}</span> รายการ
                </p>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={meta.current_page === 1}
                    onClick={() => setCurrentPage(meta.current_page - 1)}
                  >
                    ก่อนหน้า
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={meta.current_page === meta.last_page}
                    onClick={() => setCurrentPage(meta.current_page + 1)}
                  >
                    ถัดไป
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Cards - Mobile/Tablet */}
          <div className="lg:hidden space-y-4">
            {wholesalers.map((wholesaler) => (
              <Card key={wholesaler.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shrink-0">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{wholesaler.name}</h3>
                      <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-xs text-gray-600">
                        {wholesaler.code}
                      </span>
                    </div>
                  </div>
                  {wholesaler.is_active ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 shrink-0">
                      <Check className="w-3 h-3" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 shrink-0">
                      <X className="w-3 h-3" />
                      Inactive
                    </span>
                  )}
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">บริษัท</span>
                    <span className="text-gray-900 text-right">{wholesaler.company_name_th || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">อีเมล</span>
                    <span className="text-gray-900">{wholesaler.contact_email || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">โทรศัพท์</span>
                    <span className="text-gray-900">{wholesaler.contact_phone || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">ทัวร์</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                      {wholesaler.tours_count || 0} ทัวร์
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                  <Link
                    href={`/dashboard/wholesalers/${wholesaler.id}`}
                    className="flex-1"
                  >
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="w-4 h-4" />
                      ดู
                    </Button>
                  </Link>
                  <Link
                    href={`/dashboard/wholesalers/${wholesaler.id}/edit`}
                    className="flex-1"
                  >
                    <Button variant="outline" size="sm" className="w-full">
                      <Edit className="w-4 h-4" />
                      แก้ไข
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}

            {/* Mobile Pagination */}
            {meta && (
              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-gray-500">
                  {wholesalers.length} จาก {meta.total}
                </p>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={meta.current_page === 1}
                    onClick={() => setCurrentPage(meta.current_page - 1)}
                  >
                    ก่อนหน้า
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={meta.current_page === meta.last_page}
                    onClick={() => setCurrentPage(meta.current_page + 1)}
                  >
                    ถัดไป
                  </Button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
