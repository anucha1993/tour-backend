'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search, RefreshCw, ChevronLeft, ChevronRight,
  FileText, Zap, Globe, Clock, CheckCircle2,
  XCircle, CreditCard, Package, AlertCircle,
  Eye, ChevronDown,
} from 'lucide-react';
import { bookingsApi, AdminBooking, BookingStatistics } from '@/lib/api';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  pending: { label: 'รอดำเนินการ', color: 'text-yellow-700', bg: 'bg-yellow-100', icon: Clock },
  confirmed: { label: 'ยืนยันแล้ว', color: 'text-blue-700', bg: 'bg-blue-100', icon: CheckCircle2 },
  paid: { label: 'ชำระเงินแล้ว', color: 'text-green-700', bg: 'bg-green-100', icon: CreditCard },
  cancelled: { label: 'ยกเลิก', color: 'text-red-700', bg: 'bg-red-100', icon: XCircle },
  completed: { label: 'เสร็จสมบูรณ์', color: 'text-emerald-700', bg: 'bg-emerald-100', icon: Package },
};

const SOURCE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  website: { label: 'เว็บไซต์', icon: Globe, color: 'text-blue-600' },
  flash_sale: { label: 'Flash Sale', icon: Zap, color: 'text-red-500' },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full ${cfg.bg} ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function SourceBadge({ source }: { source: string }) {
  const cfg = SOURCE_CONFIG[source] || SOURCE_CONFIG.website;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

// ─── Booking Detail Modal ───
function BookingDetailModal({ booking, onClose, onStatusUpdate }: {
  booking: AdminBooking;
  onClose: () => void;
  onStatusUpdate: (id: number, status: string, note?: string) => Promise<void>;
}) {
  const [newStatus, setNewStatus] = useState(booking.status);
  const [adminNote, setAdminNote] = useState(booking.admin_note || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusDropdown, setStatusDropdown] = useState(false);

  const handleUpdate = async () => {
    if (newStatus === booking.status && adminNote === (booking.admin_note || '')) return;
    setIsUpdating(true);
    await onStatusUpdate(booking.id, newStatus, adminNote || undefined);
    setIsUpdating(false);
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
  const formatDateTime = (d: string) => new Date(d).toLocaleString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-800">รายละเอียดใบจอง</h2>
            <p className="text-sm text-gray-500 font-mono">{booking.booking_code}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Status + Source */}
          <div className="flex items-center gap-3">
            <StatusBadge status={booking.status} />
            <SourceBadge source={booking.source} />
            <span className="text-xs text-gray-400 ml-auto">{formatDateTime(booking.created_at)}</span>
          </div>

          {/* Tour info */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-sm font-bold text-gray-700 mb-2">ข้อมูลทัวร์</h3>
            <p className="text-sm font-semibold">{booking.tour?.title || '-'}</p>
            <div className="flex gap-4 mt-1 text-xs text-gray-500">
              <span>รหัส: {booking.tour?.tour_code}</span>
              {booking.period && (
                <span>เดินทาง: {formatDate(booking.period.start_date)} - {formatDate(booking.period.end_date)}</span>
              )}
            </div>
            {booking.flash_sale_item && (
              <div className="mt-2 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-red-500" />
                <span className="text-xs text-red-600 font-semibold">
                  Flash Sale: ฿{Number(booking.flash_sale_item.flash_price).toLocaleString()} (-{booking.flash_sale_item.discount_percent}%)
                </span>
                {booking.flash_sale_item.flash_sale && (
                  <span className="text-xs text-gray-400">({booking.flash_sale_item.flash_sale.title})</span>
                )}
              </div>
            )}
          </div>

          {/* Customer info */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-sm font-bold text-gray-700 mb-2">ข้อมูลลูกค้า</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-500">ชื่อ:</span> {booking.first_name} {booking.last_name}</div>
              <div><span className="text-gray-500">โทร:</span> {booking.phone}</div>
              <div><span className="text-gray-500">อีเมล:</span> {booking.email}</div>
              {booking.member && (
                <div><span className="text-gray-500">สมาชิก ID:</span> #{booking.member.id}</div>
              )}
            </div>
          </div>

          {/* Quantities & Pricing */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-sm font-bold text-gray-700 mb-2">จำนวน & ราคา</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-500">ผู้ใหญ่:</span> {booking.qty_adult} ท่าน × ฿{Number(booking.price_adult).toLocaleString()}</div>
              {booking.qty_adult_single > 0 && (
                <div><span className="text-gray-500">พักเดี่ยว:</span> {booking.qty_adult_single} ท่าน</div>
              )}
              {booking.qty_child_bed > 0 && (
                <div><span className="text-gray-500">เด็ก (เตียง):</span> {booking.qty_child_bed} ท่าน</div>
              )}
              {booking.qty_child_nobed > 0 && (
                <div><span className="text-gray-500">เด็ก (ไม่มีเตียง):</span> {booking.qty_child_nobed} ท่าน</div>
              )}
            </div>
            <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between items-center">
              <span className="text-sm font-bold text-gray-700">ยอดรวม</span>
              <span className="text-lg font-bold text-red-500">฿{Number(booking.total_amount).toLocaleString()}</span>
            </div>
          </div>

          {/* Extras */}
          {(booking.sale_code || booking.special_request) && (
            <div className="bg-gray-50 rounded-xl p-4 text-sm">
              {booking.sale_code && <p><span className="text-gray-500">Sale Code:</span> {booking.sale_code}</p>}
              {booking.special_request && <p className="mt-1"><span className="text-gray-500">คำขอพิเศษ:</span> {booking.special_request}</p>}
            </div>
          )}

          {/* Status update */}
          <div className="border border-gray-200 rounded-xl p-4">
            <h3 className="text-sm font-bold text-gray-700 mb-3">อัปเดตสถานะ</h3>
            <div className="relative mb-3">
              <button
                onClick={() => setStatusDropdown(!statusDropdown)}
                className={`w-full px-3 py-2 border border-gray-200 rounded-lg text-sm flex items-center justify-between cursor-pointer ${STATUS_CONFIG[newStatus]?.color || ''}`}
              >
                <span className="flex items-center gap-2">
                  {(() => { const Icon = STATUS_CONFIG[newStatus]?.icon || Clock; return <Icon className="w-4 h-4" />; })()}
                  {STATUS_CONFIG[newStatus]?.label || newStatus}
                </span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {statusDropdown && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setStatusDropdown(false)} />
                  <ul className="absolute top-full left-0 right-0 z-30 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                      const Icon = cfg.icon;
                      return (
                        <li key={key}>
                          <button
                            onClick={() => { setNewStatus(key as AdminBooking['status']); setStatusDropdown(false); }}
                            className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-50 cursor-pointer ${key === newStatus ? 'bg-gray-50 font-semibold' : ''} ${cfg.color}`}
                          >
                            <Icon className="w-4 h-4" />{cfg.label}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </div>
            <textarea
              value={adminNote}
              onChange={e => setAdminNote(e.target.value)}
              placeholder="หมายเหตุแอดมิน..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 resize-none"
            />
            <button
              onClick={handleUpdate}
              disabled={isUpdating || (newStatus === booking.status && adminNote === (booking.admin_note || ''))}
              className="mt-2 w-full py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
            >
              {isUpdating ? 'กำลังอัปเดต...' : 'อัปเดตสถานะ'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───
export default function BookingsPage() {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [stats, setStats] = useState<BookingStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedBooking, setSelectedBooking] = useState<AdminBooking | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await bookingsApi.list({
        search: search || undefined,
        status: statusFilter || undefined,
        source: sourceFilter || undefined,
        page,
        per_page: 20,
      });
      setBookings(res.data || []);
      setTotalPages(res.last_page || 1);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('Failed to fetch bookings', err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, sourceFilter, page]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await bookingsApi.statistics();
      setStats(res);
    } catch (err) {
      console.error('Failed to fetch stats', err);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleStatusUpdate = async (id: number, status: string, note?: string) => {
    try {
      await bookingsApi.updateStatus(id, { status, admin_note: note });
      fetchBookings();
      fetchStats();
      setSelectedBooking(null);
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
  const formatDateTime = (d: string) => new Date(d).toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">ใบจอง (Bookings)</h1>
          <p className="text-sm text-gray-500 mt-0.5">จัดการใบจองทัวร์จากเว็บไซต์และ Flash Sale</p>
        </div>
        <button onClick={() => { fetchBookings(); fetchStats(); }} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50 cursor-pointer">
          <RefreshCw className="w-4 h-4" />
          รีเฟรช
        </button>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { label: 'ทั้งหมด', value: stats.total, color: 'bg-gray-100 text-gray-700' },
            { label: 'รอดำเนินการ', value: stats.pending, color: 'bg-yellow-100 text-yellow-700' },
            { label: 'ยืนยัน', value: stats.confirmed, color: 'bg-blue-100 text-blue-700' },
            { label: 'ชำระแล้ว', value: stats.paid, color: 'bg-green-100 text-green-700' },
            { label: 'ยกเลิก', value: stats.cancelled, color: 'bg-red-100 text-red-700' },
            { label: 'เสร็จ', value: stats.completed, color: 'bg-emerald-100 text-emerald-700' },
            { label: 'เว็บไซต์', value: stats.from_website, color: 'bg-blue-50 text-blue-600' },
            { label: 'Flash Sale', value: stats.from_flash_sale, color: 'bg-red-50 text-red-600' },
          ].map(s => (
            <div key={s.label} className={`${s.color} rounded-xl px-3 py-2.5 text-center`}>
              <div className="text-lg font-bold">{s.value}</div>
              <div className="text-[11px] font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="ค้นหา รหัสจอง, ชื่อ, โทร, อีเมล..."
            className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none cursor-pointer"
        >
          <option value="">ทุกสถานะ</option>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.label}</option>
          ))}
        </select>
        <select
          value={sourceFilter}
          onChange={e => { setSourceFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none cursor-pointer"
        >
          <option value="">ทุกช่องทาง</option>
          <option value="website">เว็บไซต์</option>
          <option value="flash_sale">Flash Sale</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
            กำลังโหลด...
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
            ไม่พบใบจอง
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">รหัสจอง</th>
                  <th className="px-4 py-3 text-left">ลูกค้า</th>
                  <th className="px-4 py-3 text-left">ทัวร์</th>
                  <th className="px-4 py-3 text-center">จำนวน</th>
                  <th className="px-4 py-3 text-right">ยอดรวม</th>
                  <th className="px-4 py-3 text-center">ช่องทาง</th>
                  <th className="px-4 py-3 text-center">สถานะ</th>
                  <th className="px-4 py-3 text-center">วันจอง</th>
                  <th className="px-4 py-3 text-center w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bookings.map(b => (
                  <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono font-semibold text-blue-600">{b.booking_code}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{b.first_name} {b.last_name}</div>
                      <div className="text-xs text-gray-400">{b.phone}</div>
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <div className="font-medium text-gray-700 truncate">{b.tour?.title || '-'}</div>
                      <div className="text-xs text-gray-400">{b.tour?.tour_code} {b.period ? `• ${formatDate(b.period.start_date)}` : ''}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-gray-700">{b.qty_adult + b.qty_child_bed + b.qty_child_nobed}</span>
                      <span className="text-gray-400 text-xs"> ท่าน</span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-800">
                      ฿{Number(b.total_amount).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <SourceBadge source={b.source} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-gray-400 whitespace-nowrap">
                      {formatDateTime(b.created_at)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setSelectedBooking(b)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                        title="ดูรายละเอียด"
                      >
                        <Eye className="w-4 h-4 text-gray-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">
              ทั้งหมด {total} รายการ • หน้า {page}/{totalPages}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </div>
  );
}
