'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Star, Search, Filter, Check, X, MessageSquare,
  Sparkles, Trash2, Eye, ChevronDown, AlertCircle,
  ThumbsUp, ThumbsDown, Users, Clock, Plus, Upload, Image as ImageIcon,
} from 'lucide-react';
import { tourReviewApi, reviewTagApi, toursApi, TourReviewAdmin, ReviewStats, ReviewTagAdmin, Tour } from '@/lib/api';

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'รอตรวจสอบ', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  approved: { label: 'อนุมัติ', color: 'text-green-700', bg: 'bg-green-100' },
  rejected: { label: 'ปฏิเสธ', color: 'text-red-700', bg: 'bg-red-100' },
};

const SOURCE_MAP: Record<string, { label: string; color: string }> = {
  self: { label: 'สมาชิก', color: 'text-blue-600' },
  assisted: { label: 'Assisted', color: 'text-purple-600' },
  internal: { label: 'Internal', color: 'text-gray-600' },
};

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-3.5 h-3.5 ${s <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}
        />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<TourReviewAdmin[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [replyingId, setReplyingId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [detailReview, setDetailReview] = useState<TourReviewAdmin | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page: currentPage, per_page: 20 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (sourceFilter) params.source = sourceFilter;
      if (ratingFilter) params.rating = Number(ratingFilter);

      const res = await tourReviewApi.list(params) as any;
      if (res.success) {
        setReviews(res.data?.data || []);
        setLastPage(res.data?.last_page || 1);
        setTotal(res.data?.total || 0);
        setStats(res.stats || null);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, statusFilter, sourceFilter, ratingFilter]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleApprove = async (id: number) => {
    try {
      await tourReviewApi.approve(id);
      fetchReviews();
    } catch {
      alert('เกิดข้อผิดพลาด');
    }
  };

  const handleReject = async () => {
    if (!rejectingId || !rejectReason.trim()) return;
    try {
      await tourReviewApi.reject(rejectingId, rejectReason.trim());
      setRejectingId(null);
      setRejectReason('');
      fetchReviews();
    } catch {
      alert('เกิดข้อผิดพลาด');
    }
  };

  const handleReply = async () => {
    if (!replyingId || !replyText.trim()) return;
    try {
      await tourReviewApi.reply(replyingId, replyText.trim());
      setReplyingId(null);
      setReplyText('');
      fetchReviews();
    } catch {
      alert('เกิดข้อผิดพลาด');
    }
  };

  const handleToggleFeatured = async (id: number) => {
    try {
      await tourReviewApi.toggleFeatured(id);
      fetchReviews();
    } catch {
      alert('เกิดข้อผิดพลาด');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('ต้องการลบรีวิวนี้?')) return;
    try {
      await tourReviewApi.delete(id);
      fetchReviews();
    } catch {
      alert('เกิดข้อผิดพลาด');
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    try {
      await tourReviewApi.bulkApprove(selectedIds);
      setSelectedIds([]);
      fetchReviews();
    } catch {
      alert('เกิดข้อผิดพลาด');
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === reviews.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(reviews.map((r) => r.id));
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Star className="w-6 h-6 text-yellow-500" />
            จัดการรีวิว
          </h1>
          <p className="text-sm text-gray-500 mt-1">ตรวจสอบ อนุมัติ และตอบกลับรีวิวจากลูกค้า</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
          {[
            { label: 'ทั้งหมด', value: stats.total, icon: Users, color: 'text-gray-600 bg-gray-50' },
            { label: 'รอตรวจสอบ', value: stats.pending, icon: Clock, color: 'text-yellow-600 bg-yellow-50' },
            { label: 'อนุมัติ', value: stats.approved, icon: Check, color: 'text-green-600 bg-green-50' },
            { label: 'ปฏิเสธ', value: stats.rejected, icon: X, color: 'text-red-600 bg-red-50' },
            { label: 'แนะนำ', value: stats.featured, icon: Sparkles, color: 'text-amber-600 bg-amber-50' },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl p-4 ${s.color.split(' ')[1]}`}>
              <div className="flex items-center gap-2 mb-1">
                <s.icon className={`w-4 h-4 ${s.color.split(' ')[0]}`} />
                <span className="text-xs text-gray-500">{s.label}</span>
              </div>
              <div className={`text-2xl font-bold ${s.color.split(' ')[0]}`}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            placeholder="ค้นหาชื่อ, ความคิดเห็น, ทัวร์..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">สถานะทั้งหมด</option>
          <option value="pending">รอตรวจสอบ</option>
          <option value="approved">อนุมัติ</option>
          <option value="rejected">ปฏิเสธ</option>
        </select>
        <select
          value={sourceFilter}
          onChange={(e) => { setSourceFilter(e.target.value); setCurrentPage(1); }}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">แหล่งที่มาทั้งหมด</option>
          <option value="self">สมาชิก</option>
          <option value="assisted">Assisted</option>
          <option value="internal">Internal</option>
        </select>
        <select
          value={ratingFilter}
          onChange={(e) => { setRatingFilter(e.target.value); setCurrentPage(1); }}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">คะแนนทั้งหมด</option>
          {[5, 4, 3, 2, 1].map((r) => (
            <option key={r} value={r}>{r} ดาว</option>
          ))}
        </select>
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 mb-4 bg-blue-50 p-3 rounded-lg">
          <span className="text-sm text-blue-700">เลือก {selectedIds.length} รายการ</span>
          <button
            onClick={handleBulkApprove}
            className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            อนุมัติทั้งหมด
          </button>
          <button
            onClick={() => setSelectedIds([])}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
          >
            ยกเลิก
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === reviews.length && reviews.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded"
                  />
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">ผู้รีวิว</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">ทัวร์</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">คะแนน</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">ความคิดเห็น</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">แหล่งที่มา</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">สถานะ</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">วันที่</th>
                <th className="px-4 py-3 text-center font-medium text-gray-600">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    กำลังโหลด...
                  </td>
                </tr>
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    ไม่พบรีวิว
                  </td>
                </tr>
              ) : (
                reviews.map((review) => {
                  const statusInfo = STATUS_MAP[review.status];
                  const sourceInfo = SOURCE_MAP[review.review_source];
                  return (
                    <tr key={review.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(review.id)}
                          onChange={() => toggleSelect(review.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-semibold text-blue-600">
                              {review.reviewer_name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 text-sm">{review.reviewer_name}</div>
                            {review.is_featured && (
                              <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">
                                ⭐ แนะนำ
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="max-w-[200px] truncate text-sm text-gray-700">
                          {review.tour?.tour_name || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StarDisplay rating={review.rating} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="max-w-[250px] truncate text-sm text-gray-600">
                          {review.comment || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-medium ${sourceInfo.color}`}>
                          {sourceInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusInfo.bg} ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-gray-500">
                        {new Date(review.created_at).toLocaleDateString('th-TH', {
                          day: 'numeric', month: 'short', year: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          {review.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(review.id)}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                                title="อนุมัติ"
                              >
                                <ThumbsUp className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => { setRejectingId(review.id); setRejectReason(''); }}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                                title="ปฏิเสธ"
                              >
                                <ThumbsDown className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => { setReplyingId(review.id); setReplyText(review.admin_reply || ''); }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="ตอบกลับ"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleFeatured(review.id)}
                            className={`p-1.5 rounded-lg ${review.is_featured ? 'text-amber-600 bg-amber-50' : 'text-gray-400 hover:bg-gray-50'}`}
                            title={review.is_featured ? 'ยกเลิกแนะนำ' : 'ตั้งเป็นแนะนำ'}
                          >
                            <Sparkles className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(review.id)}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            title="ลบ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {lastPage > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
            <span className="text-sm text-gray-500">
              {total} รายการ | หน้า {currentPage}/{lastPage}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-white"
              >
                ก่อนหน้า
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(lastPage, p + 1))}
                disabled={currentPage >= lastPage}
                className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-white"
              >
                ถัดไป
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reply Modal */}
      {replyingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              ตอบกลับรีวิว
            </h3>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="พิมพ์ข้อความตอบกลับ..."
              rows={4}
              className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={() => setReplyingId(null)}
                className="flex-1 py-2 border rounded-xl text-sm text-gray-600 hover:bg-gray-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleReply}
                disabled={!replyText.trim()}
                className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                ส่งตอบกลับ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-red-600">
              <ThumbsDown className="w-5 h-5" />
              ปฏิเสธรีวิว
            </h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="ระบุเหตุผล..."
              rows={3}
              className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={() => setRejectingId(null)}
                className="flex-1 py-2 border rounded-xl text-sm text-gray-600 hover:bg-gray-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                className="flex-1 py-2 bg-red-600 text-white rounded-xl text-sm hover:bg-red-700 disabled:opacity-50"
              >
                ปฏิเสธ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
