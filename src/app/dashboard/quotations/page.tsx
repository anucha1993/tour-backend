'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { quotationsApi, Quotation, QuotationStatistics } from '@/lib/api';
import { FileText, Search, Eye } from 'lucide-react';

const STATUS_LABEL: Record<Quotation['status'], { text: string; color: string }> = {
  requested: { text: 'คำขอใหม่', color: 'bg-blue-100 text-blue-700' },
  draft: { text: 'แบบร่าง', color: 'bg-gray-100 text-gray-700' },
  sent: { text: 'ส่งแล้ว', color: 'bg-amber-100 text-amber-800' },
  accepted: { text: 'ยอมรับ', color: 'bg-green-100 text-green-700' },
  declined: { text: 'ปฏิเสธ', color: 'bg-red-100 text-red-700' },
  expired: { text: 'หมดอายุ', color: 'bg-gray-100 text-gray-500' },
  cancelled: { text: 'ยกเลิก', color: 'bg-gray-100 text-gray-500' },
};

export default function QuotationsAdminPage() {
  const [list, setList] = useState<Quotation[]>([]);
  const [stats, setStats] = useState<QuotationStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    const [listRes, statsRes] = await Promise.all([
      quotationsApi.list({ page, search: search || undefined, status: statusFilter || undefined }),
      quotationsApi.statistics(),
    ]);
    if (listRes.success && listRes.data) {
      const d = listRes.data as { data: Quotation[]; last_page: number };
      setList(d.data || []);
      setLastPage(d.last_page || 1);
    }
    if (statsRes.success && statsRes.data) {
      setStats(statsRes.data);
    }
    setLoading(false);
  }, [page, search, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const formatDate = (s: string | null) => (s ? new Date(s).toLocaleString('th-TH') : '-');
  const formatMoney = (n: number | string) => Number(n).toLocaleString('th-TH', { minimumFractionDigits: 2 });

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <FileText className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ใบเสนอราคา</h1>
          <p className="text-sm text-gray-500">จัดการคำขอใบเสนอราคาจากลูกค้า</p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          {(['requested', 'draft', 'sent', 'accepted', 'declined', 'expired', 'cancelled'] as const).map((k) => (
            <button
              key={k}
              onClick={() => {
                setStatusFilter(statusFilter === k ? '' : k);
                setPage(1);
              }}
              className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                statusFilter === k ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="text-xs text-gray-500">{STATUS_LABEL[k].text}</div>
              <div className="text-2xl font-bold text-gray-900">{stats[k]}</div>
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4 flex gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (setPage(1), load())}
            placeholder="ค้นหา เลขใบเสนอราคา / ชื่อ / เบอร์ / อีเมล"
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="">ทุกสถานะ</option>
          {(Object.keys(STATUS_LABEL) as Array<keyof typeof STATUS_LABEL>).map((s) => (
            <option key={s} value={s}>{STATUS_LABEL[s].text}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="px-4 py-3 text-left">เลขที่</th>
              <th className="px-4 py-3 text-left">ลูกค้า</th>
              <th className="px-4 py-3 text-left">ทัวร์ / รายละเอียด</th>
              <th className="px-4 py-3 text-right">มูลค่า</th>
              <th className="px-4 py-3 text-center">สถานะ</th>
              <th className="px-4 py-3 text-left">สร้างเมื่อ</th>
              <th className="px-4 py-3 text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">กำลังโหลด...</td></tr>
            ) : list.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">ไม่มีข้อมูล</td></tr>
            ) : (
              list.map((q) => (
                <tr key={q.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{q.quotation_number}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{q.customer_name}</div>
                    <div className="text-xs text-gray-500">{q.customer_phone}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{q.title || q.tour?.title || 'ทัวร์ใหม่'}</div>
                    <div className="text-xs text-gray-500">
                      {q.pax_adult + q.pax_child + q.pax_infant} ท่าน
                      {q.travel_date_preference ? ` · ${q.travel_date_preference}` : ''}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {Number(q.total_amount) > 0 ? `฿${formatMoney(q.total_amount)}` : '-'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${STATUS_LABEL[q.status].color}`}>
                      {STATUS_LABEL[q.status].text}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{formatDate(q.created_at)}</td>
                  <td className="px-4 py-3 text-center">
                    <Link
                      href={`/dashboard/quotations/${q.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Eye className="w-4 h-4" />
                      ดู
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {lastPage > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 cursor-pointer"
          >
            ก่อนหน้า
          </button>
          <span className="px-4 py-2">{page} / {lastPage}</span>
          <button
            onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
            disabled={page === lastPage}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 cursor-pointer"
          >
            ถัดไป
          </button>
        </div>
      )}
    </div>
  );
}
