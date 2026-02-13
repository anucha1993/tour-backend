'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Star, StarHalf, Search, Filter, Check, X, MessageSquare,
  Sparkles, Trash2, Eye, ChevronDown, AlertCircle,
  ThumbsUp, ThumbsDown, Users, Clock, Plus, Upload, Image as ImageIcon, Pencil, Hash,
} from 'lucide-react';
import { tourReviewApi, reviewTagApi, toursApi, TourReviewAdmin, ReviewStats, ReviewTagAdmin, Tour, API_BASE_URL, ReviewImageItem } from '@/lib/api';

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

function StarDisplay({ rating, categoryRatings }: { rating: number; categoryRatings?: Record<string, number> | null }) {
  // Compute from category_ratings if available, otherwise use rating field
  let displayRating = rating;
  if (categoryRatings && Object.keys(categoryRatings).length > 0) {
    const vals = Object.values(categoryRatings).map(Number);
    displayRating = parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1));
  }
  const full = Math.floor(displayRating);
  const hasHalf = displayRating !== full;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => {
        if (s <= full) return <Star key={s} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />;
        if (s === full + 1 && hasHalf) return <StarHalf key={s} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />;
        return <Star key={s} className="w-3.5 h-3.5 text-gray-200" />;
      })}
      <span className="ml-1 text-xs font-medium text-yellow-600">{displayRating}</span>
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

  // Tags state
  const [availableTags, setAvailableTags] = useState<ReviewTagAdmin[]>([]);

  // Helper: convert tag slug (English) to Thai name
  const resolveTagName = useCallback((tag: string) => {
    const found = availableTags.find(t => t.slug === tag || t.name === tag);
    return found ? found.name : tag;
  }, [availableTags]);

  // Create review modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [tourSearch, setTourSearch] = useState('');
  const [tourResults, setTourResults] = useState<Tour[]>([]);
  const [tourSearching, setTourSearching] = useState(false);
  const tourSearchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [createForm, setCreateForm] = useState({
    tour_id: 0,
    tour_title: '',
    reviewer_name: '',
    rating: 5,
    comment: '',
    approved_by_customer: true,
    tags: [] as string[],
    category_ratings: { guide: 5, food: 5, hotel: 5, value: 5, program_accuracy: 5, would_return: 5 } as Record<string, number>,
    review_source: 'assisted' as 'self' | 'assisted' | 'internal',
    status: 'approved' as 'pending' | 'approved' | 'rejected',
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [reviewImages, setReviewImages] = useState<File[]>([]);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // Edit review modal state
  const [editingReview, setEditingReview] = useState<TourReviewAdmin | null>(null);
  const [editForm, setEditForm] = useState({
    reviewer_name: '',
    rating: 5,
    comment: '',
    tags: [] as string[],
    category_ratings: { guide: 5, food: 5, hotel: 5, value: 5, program_accuracy: 5, would_return: 5 } as Record<string, number>,
    review_source: 'assisted' as 'self' | 'assisted' | 'internal',
    status: 'approved' as 'pending' | 'approved' | 'rejected',
  });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
  const [editNewImages, setEditNewImages] = useState<File[]>([]);
  const [editRemoveImageIds, setEditRemoveImageIds] = useState<number[]>([]);
  const [editRemoveAvatar, setEditRemoveAvatar] = useState(false);
  const [editExistingImages, setEditExistingImages] = useState<ReviewImageItem[]>([]);

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

  // Fetch available tags on mount
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await reviewTagApi.list() as any;
        setAvailableTags(res.data || []);
      } catch { /* ignore */ }
    };
    fetchTags();
  }, []);

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

  // Search tours for create modal
  const handleTourSearch = (query: string) => {
    setTourSearch(query);
    if (tourSearchTimeout.current) clearTimeout(tourSearchTimeout.current);
    if (!query.trim()) { setTourResults([]); return; }
    tourSearchTimeout.current = setTimeout(async () => {
      setTourSearching(true);
      try {
        const res = await toursApi.list({ search: query, per_page: '10' }) as any;
        setTourResults(res?.data || []);
      } catch { setTourResults([]); }
      finally { setTourSearching(false); }
    }, 300);
  };

  const handleSelectTour = (tour: Tour) => {
    setCreateForm(f => ({ ...f, tour_id: tour.id, tour_title: tour.title }));
    setTourSearch('');
    setTourResults([]);
  };

  const resetCreateForm = () => {
    setCreateForm({
      tour_id: 0, tour_title: '', reviewer_name: '', rating: 5, comment: '',
      approved_by_customer: true, tags: [],
      category_ratings: { guide: 5, food: 5, hotel: 5, value: 5, program_accuracy: 5, would_return: 5 },
      review_source: 'assisted', status: 'approved',
    });
    setScreenshotFile(null);
    setReviewImages([]);
    setAvatarFile(null);
    setTourSearch('');
    setTourResults([]);
  };

  const handleCreateReview = async () => {
    if (!createForm.tour_id || !createForm.reviewer_name.trim() || !createForm.comment.trim()) {
      alert('กรุณากรอกข้อมูลให้ครบ');
      return;
    }
    setCreateSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('tour_id', String(createForm.tour_id));
      fd.append('reviewer_name', createForm.reviewer_name);
      // Compute average rating from category ratings
      const catVals = Object.values(createForm.category_ratings).map(Number);
      const avgRating = catVals.length ? Math.round(catVals.reduce((a, b) => a + b, 0) / catVals.length) : 5;
      fd.append('rating', String(avgRating));
      fd.append('comment', createForm.comment);
      fd.append('approved_by_customer', createForm.approved_by_customer ? '1' : '0');
      fd.append('review_source', createForm.review_source);
      fd.append('status', createForm.status);
      Object.entries(createForm.category_ratings).forEach(([k, v]) => {
        fd.append(`category_ratings[${k}]`, String(v));
      });
      createForm.tags.forEach(tag => {
        fd.append('tags[]', tag);
      });
      if (screenshotFile) fd.append('approval_screenshot', screenshotFile);
      if (avatarFile) fd.append('reviewer_avatar', avatarFile);
      reviewImages.forEach((file) => {
        fd.append('images[]', file);
      });

      const res = await tourReviewApi.createAssisted(fd) as any;
      if (res.success) {
        setShowCreateModal(false);
        resetCreateForm();
        fetchReviews();
      } else {
        const errors = res.errors ? Object.values(res.errors).flat().join('\n') : 'เกิดข้อผิดพลาด';
        alert(errors);
      }
    } catch {
      alert('เกิดข้อผิดพลาด');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const openEditModal = (review: TourReviewAdmin) => {
    setEditingReview(review);
    // Convert old English slug tags to Thai names
    const resolvedTags = Array.isArray(review.tags)
      ? review.tags.map(tag => {
          const found = availableTags.find(t => t.slug === tag || t.name === tag);
          return found ? found.name : tag;
        })
      : [];
    setEditForm({
      reviewer_name: review.reviewer_name || '',
      rating: review.rating || 5,
      comment: review.comment || '',
      tags: resolvedTags,
      category_ratings: review.category_ratings || { guide: 5, food: 5, hotel: 5, value: 5, program_accuracy: 5, would_return: 5 },
      review_source: review.review_source || 'assisted',
      status: review.status || 'approved',
    });
    setEditExistingImages(review.images || []);
    setEditRemoveImageIds([]);
    setEditNewImages([]);
    setEditAvatarFile(null);
    setEditRemoveAvatar(false);
  };

  const closeEditModal = () => {
    setEditingReview(null);
    setEditForm({
      reviewer_name: '',
      rating: 5,
      comment: '',
      tags: [],
      category_ratings: { guide: 5, food: 5, hotel: 5, value: 5, program_accuracy: 5, would_return: 5 },
      review_source: 'assisted', status: 'approved',
    });
    setEditExistingImages([]);
    setEditRemoveImageIds([]);
    setEditNewImages([]);
    setEditAvatarFile(null);
    setEditRemoveAvatar(false);
  };

  const handleUpdateReview = async () => {
    if (!editingReview) return;
    if (!editForm.reviewer_name.trim() || !editForm.comment.trim()) {
      alert('กรุณากรอกข้อมูลให้ครบ');
      return;
    }
    setEditSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('reviewer_name', editForm.reviewer_name);
      // Compute average rating from category ratings
      const editCatVals = Object.values(editForm.category_ratings).map(Number);
      const editAvgRating = editCatVals.length ? Math.round(editCatVals.reduce((a, b) => a + b, 0) / editCatVals.length) : 5;
      fd.append('rating', String(editAvgRating));
      fd.append('comment', editForm.comment);
      fd.append('review_source', editForm.review_source);
      fd.append('status', editForm.status);
      Object.entries(editForm.category_ratings).forEach(([k, v]) => {
        fd.append(`category_ratings[${k}]`, String(v));
      });
      editForm.tags.forEach(tag => {
        fd.append('tags[]', tag);
      });
      if (editAvatarFile) fd.append('reviewer_avatar', editAvatarFile);
      if (editRemoveAvatar) fd.append('remove_avatar', '1');
      editRemoveImageIds.forEach(id => {
        fd.append('remove_image_ids[]', String(id));
      });
      editNewImages.forEach(file => {
        fd.append('images[]', file);
      });

      const res = await tourReviewApi.update(editingReview.id, fd) as any;
      if (res.success) {
        closeEditModal();
        fetchReviews();
      } else {
        const errors = res.errors ? Object.values(res.errors).flat().join('\n') : 'เกิดข้อผิดพลาด';
        alert(errors);
      }
    } catch {
      alert('เกิดข้อผิดพลาด');
    } finally {
      setEditSubmitting(false);
    }
  };

  const imageBaseUrl = API_BASE_URL.replace('/api', '');

  // Helper: resolve image URL (R2 URLs are already absolute, legacy /storage/ paths need base prefix)
  const resolveImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return imageBaseUrl + url;
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
        <button
          onClick={() => { resetCreateForm(); setShowCreateModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          เขียนรีวิว
        </button>
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
            <div key={s.label} className={`rounded-xl p-4 border border-gray-300 ${s.color.split(' ')[1]}`}>
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
      <div className="flex flex-wrap items-center gap-3 mb-4 ">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            placeholder="ค้นหาชื่อ, ความคิดเห็น, ทัวร์..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">สถานะทั้งหมด</option>
          <option value="pending">รอตรวจสอบ</option>
          <option value="approved">อนุมัติ</option>
          <option value="rejected">ปฏิเสธ</option>
        </select>
        <select
          value={sourceFilter}
          onChange={(e) => { setSourceFilter(e.target.value); setCurrentPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">แหล่งที่มาทั้งหมด</option>
          <option value="self">สมาชิก</option>
          <option value="assisted">Assisted</option>
          <option value="internal">Internal</option>
        </select>
        <select
          value={ratingFilter}
          onChange={(e) => { setRatingFilter(e.target.value); setCurrentPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
      <div className="bg-white rounded-xl border overflow-hidden border-gray-300">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-300">
              <tr>
                <th className="px-4 py-3 text-left border-gray-300">
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
                          {review.reviewer_avatar_url ? (
                            <img src={resolveImageUrl(review.reviewer_avatar_url)} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-semibold text-blue-600">
                                {review.reviewer_name.charAt(0)}
                              </span>
                            </div>
                          )}
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
                        <div className="max-w-[200px]">
                          <div className="truncate text-sm text-gray-700">{review.tour?.title || '-'}</div>
                          {review.tour?.tour_code && (
                            <div className="text-[10px] text-gray-400 mt-0.5">รหัส: {review.tour.tour_code}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StarDisplay rating={review.rating} categoryRatings={review.category_ratings} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="max-w-[250px]">
                          <div className="truncate text-sm text-gray-600">{review.comment || '-'}</div>
                          {review.images && review.images.length > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                              <ImageIcon className="w-3 h-3 text-gray-400" />
                              <span className="text-[10px] text-gray-400">{review.images.length} รูป</span>
                            </div>
                          )}
                          {review.tags && review.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {review.tags.map((tag, i) => (
                                <span key={i} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">#{resolveTagName(tag)}</span>
                              ))}
                            </div>
                          )}
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
                            onClick={() => openEditModal(review)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                            title="แก้ไข"
                          >
                            <Pencil className="w-4 h-4" />
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
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={() => setReplyingId(null)}
                className="flex-1 py-2 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
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
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={() => setRejectingId(null)}
                className="flex-1 py-2 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
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

      {/* Create Review Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto py-8">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border border-gray-300 border-b px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                เขียนรีวิวจากหลังบ้าน
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Tour Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">เลือกทัวร์ <span className="text-red-500">*</span></label>
                {createForm.tour_id ? (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex-1 text-sm text-blue-800 font-medium">{createForm.tour_title}</div>
                    <button onClick={() => setCreateForm(f => ({ ...f, tour_id: 0, tour_title: '' }))} className="p-1 hover:bg-blue-100 rounded">
                      <X className="w-4 h-4 text-blue-500" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={tourSearch}
                      onChange={(e) => handleTourSearch(e.target.value)}
                      placeholder="พิมพ์ชื่อทัวร์หรือรหัสทัวร์เพื่อค้นหา..."
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {(tourResults.length > 0 || tourSearching) && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
                        {tourSearching ? (
                          <div className="px-4 py-3 text-sm text-gray-400 text-center">กำลังค้นหา...</div>
                        ) : (
                          tourResults.map(t => (
                            <div
                              key={t.id}
                              onClick={() => handleSelectTour(t)}
                              className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-sm border-b last:border-0"
                            >
                              <div className="font-medium text-gray-900">{t.title}</div>
                              <div className="text-xs text-gray-500 mt-0.5">รหัส: {t.tour_code}</div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Reviewer Name + Avatar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">ชื่อผู้รีวิว <span className="text-red-500">*</span></label>
                <div className="flex items-start gap-4">
                  {/* Avatar Upload */}
                  <div className="flex-shrink-0">
                    <label className="relative block w-16 h-16 rounded-full overflow-hidden border-2 border-dashed border-gray-300 cursor-pointer hover:border-blue-400 transition-colors bg-gray-50">
                      {avatarFile ? (
                        <img src={URL.createObjectURL(avatarFile)} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center">
                          <ImageIcon className="w-5 h-5 text-gray-300" />
                          <span className="text-[8px] text-gray-400 mt-0.5">รูปโปรไฟล์</span>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                    </label>
                    {avatarFile && (
                      <button
                        type="button"
                        onClick={() => setAvatarFile(null)}
                        className="mt-1 text-[10px] text-red-400 hover:text-red-600 w-full text-center"
                      >ลบรูป</button>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={createForm.reviewer_name}
                      onChange={(e) => setCreateForm(f => ({ ...f, reviewer_name: e.target.value }))}
                      placeholder="เช่น คุณสมชาย ใจดี"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">อัปโหลดรูปโปรไฟล์ของผู้รีวิว (ไม่เกิน 2MB)</p>
                  </div>
                </div>
              </div>

              {/* Overall Rating (auto-computed) */}
              {(() => {
                const vals = Object.values(createForm.category_ratings).map(Number);
                const avg = vals.length ? parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)) : 5;
                const full = Math.floor(avg);
                const hasHalf = avg !== full;
                return (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">คะแนนรวม <span className="text-xs text-gray-400">(คำนวณจากค่าเฉลี่ย)</span></label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(s => {
                        if (s <= full) return <Star key={s} className="w-7 h-7 fill-yellow-400 text-yellow-400" />;
                        if (s === full + 1 && hasHalf) return <StarHalf key={s} className="w-7 h-7 fill-yellow-400 text-yellow-400" />;
                        return <Star key={s} className="w-7 h-7 text-gray-200" />;
                      })}
                      <span className="ml-2 text-sm font-semibold text-yellow-600">{avg}/5</span>
                    </div>
                  </div>
                );
              })()}

              {/* Category Ratings */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">คะแนนตามหมวดหมู่ <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'guide', label: 'ไกด์นำเที่ยว' },
                    { key: 'food', label: 'อาหาร' },
                    { key: 'hotel', label: 'โรงแรม' },
                    { key: 'value', label: 'ความคุ้มค่า' },
                    { key: 'program_accuracy', label: 'โปรแกรมตรงปก' },
                    { key: 'would_return', label: 'กลับมาอีก' },
                  ].map(cat => (
                    <div key={cat.key} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                      <span className="text-sm text-gray-600">{cat.label}</span>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map(s => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setCreateForm(f => ({
                              ...f,
                              category_ratings: { ...f.category_ratings, [cat.key]: s },
                            }))}
                            className="p-0"
                          >
                            <Star className={`w-4 h-4 ${s <= (createForm.category_ratings[cat.key] || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">ความคิดเห็น <span className="text-red-500">*</span></label>
                <textarea
                  value={createForm.comment}
                  onChange={(e) => setCreateForm(f => ({ ...f, comment: e.target.value }))}
                  placeholder="เขียนรีวิว..."
                  rows={4}
                  maxLength={200}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <div className="text-xs text-gray-400 text-right mt-1">{createForm.comment.length}/200</div>
              </div>

              {/* Hashtags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Hash className="w-4 h-4" />
                  แฮชแท็ก
                </label>
                {/* Selected tags */}
                {(createForm.tags || []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {(createForm.tags || []).map(tag => (
                      <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        #{tag}
                        <button type="button" onClick={() => setCreateForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }))} className="p-0.5 hover:bg-blue-200 rounded-full">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {/* Suggested tags */}
                {availableTags.filter(t => t.is_active).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {availableTags.filter(t => t.is_active).map(tag => {
                      const isSelected = (createForm.tags || []).includes(tag.name);
                      if (isSelected) return null;
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => setCreateForm(f => ({ ...f, tags: [...(f.tags || []), tag.name] }))}
                          className="px-2.5 py-1 rounded-full text-xs border border-gray-300 text-gray-500 hover:bg-gray-50 transition-colors"
                        >
                          #{tag.name}
                        </button>
                      );
                    })}
                  </div>
                )}
                {/* Custom tag input */}
                <input
                  type="text"
                  placeholder="พิมพ์แฮชแท็กแล้วกด Enter เช่น ญี่ปุ่น, ครอบครัว"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      const val = (e.target as HTMLInputElement).value.replace(/[#,]/g, '').trim();
                      if (val && !(createForm.tags || []).includes(val)) {
                        setCreateForm(f => ({ ...f, tags: [...(f.tags || []), val] }));
                      }
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                />
              </div>

              {/* Review Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">รูปภาพรีวิว <span className="text-xs text-gray-400">(สูงสุด 6 ภาพ, ภาพละไม่เกิน 5MB)</span></label>
                <div className="grid grid-cols-3 gap-3">
                  {reviewImages.map((file, idx) => (
                    <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                      <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setReviewImages(imgs => imgs.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] text-center py-0.5">{idx + 1}</div>
                    </div>
                  ))}
                  {reviewImages.length < 6 && (
                    <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-blue-400 transition-colors">
                      <ImageIcon className="w-6 h-6 text-gray-300 mb-1" />
                      <span className="text-xs text-gray-400">เพิ่มรูป</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          setReviewImages(prev => [...prev, ...files].slice(0, 6));
                          e.target.value = '';
                        }}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Source & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">แหล่งที่มา</label>
                  <select
                    value={createForm.review_source}
                    onChange={(e) => setCreateForm(f => ({ ...f, review_source: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="assisted">Assisted (แอดมินสร้าง)</option>
                    <option value="self">สมาชิก</option>
                    <option value="internal">Internal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">สถานะ</label>
                  <select
                    value={createForm.status}
                    onChange={(e) => setCreateForm(f => ({ ...f, status: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="approved">อนุมัติ</option>
                    <option value="pending">รอตรวจสอบ</option>
                    <option value="rejected">ปฏิเสธ</option>
                  </select>
                </div>
              </div>

              {/* Customer Approval */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">ลูกค้ายินยอม</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={createForm.approved_by_customer}
                      onChange={() => setCreateForm(f => ({ ...f, approved_by_customer: true }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">ยินยอม</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={!createForm.approved_by_customer}
                      onChange={() => setCreateForm(f => ({ ...f, approved_by_customer: false }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">ไม่ได้ยินยอม</span>
                  </label>
                </div>
              </div>

              {/* Screenshot Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">ภาพหลักฐานการยินยอม (ถ้ามี)</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                    <Upload className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">{screenshotFile ? screenshotFile.name : 'เลือกไฟล์...'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setScreenshotFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                  {screenshotFile && (
                    <button onClick={() => setScreenshotFile(null)} className="p-1 hover:bg-red-50 rounded text-red-400">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-300 px-6 py-4 rounded-b-2xl flex items-center gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-white transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleCreateReview}
                disabled={createSubmitting || !createForm.tour_id || !createForm.reviewer_name.trim() || !createForm.comment.trim()}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {createSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    บันทึกรีวิว
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Review Modal */}
      {editingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto py-8">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border border-gray-300 border-b px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Pencil className="w-5 h-5 text-indigo-600" />
                แก้ไขรีวิว
              </h3>
              <button onClick={closeEditModal} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Tour Name (read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">ทัวร์</label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                  <div className="flex-1 text-sm text-gray-700 font-medium">{editingReview.tour?.title || `Tour #${editingReview.tour_id}`}</div>
                </div>
              </div>

              {/* Reviewer Name + Avatar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">ชื่อผู้รีวิว <span className="text-red-500">*</span></label>
                <div className="flex items-start gap-4">
                  {/* Avatar Upload */}
                  <div className="flex-shrink-0">
                    <label className="relative block w-16 h-16 rounded-full overflow-hidden border-2 border-dashed border-gray-300 cursor-pointer hover:border-indigo-400 transition-colors bg-gray-50">
                      {editAvatarFile ? (
                        <img src={URL.createObjectURL(editAvatarFile)} alt="" className="w-full h-full object-cover" />
                      ) : !editRemoveAvatar && editingReview.reviewer_avatar_url ? (
                        <img src={resolveImageUrl(editingReview.reviewer_avatar_url!)} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center">
                          <ImageIcon className="w-5 h-5 text-gray-300" />
                          <span className="text-[8px] text-gray-400 mt-0.5">รูปโปรไฟล์</span>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setEditAvatarFile(file);
                          if (file) setEditRemoveAvatar(false);
                        }}
                        className="hidden"
                      />
                    </label>
                    {(editAvatarFile || (!editRemoveAvatar && editingReview.reviewer_avatar_url)) && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditAvatarFile(null);
                          if (editingReview.reviewer_avatar_url) setEditRemoveAvatar(true);
                        }}
                        className="mt-1 text-[10px] text-red-400 hover:text-red-600 w-full text-center"
                      >ลบรูป</button>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={editForm.reviewer_name}
                      onChange={(e) => setEditForm(f => ({ ...f, reviewer_name: e.target.value }))}
                      placeholder="เช่น คุณสมชาย ใจดี"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">อัปโหลดรูปโปรไฟล์ของผู้รีวิว (ไม่เกิน 2MB)</p>
                  </div>
                </div>
              </div>

              {/* Overall Rating (auto-computed) */}
              {(() => {
                const vals = Object.values(editForm.category_ratings).map(Number);
                const avg = vals.length ? parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)) : 5;
                const full = Math.floor(avg);
                const hasHalf = avg !== full;
                return (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">คะแนนรวม <span className="text-xs text-gray-400">(คำนวณจากค่าเฉลี่ย)</span></label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(s => {
                        if (s <= full) return <Star key={s} className="w-7 h-7 fill-yellow-400 text-yellow-400" />;
                        if (s === full + 1 && hasHalf) return <StarHalf key={s} className="w-7 h-7 fill-yellow-400 text-yellow-400" />;
                        return <Star key={s} className="w-7 h-7 text-gray-200" />;
                      })}
                      <span className="ml-2 text-sm font-semibold text-yellow-600">{avg}/5</span>
                    </div>
                  </div>
                );
              })()}

              {/* Category Ratings */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">คะแนนตามหมวดหมู่ <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'guide', label: 'ไกด์นำเที่ยว' },
                    { key: 'food', label: 'อาหาร' },
                    { key: 'hotel', label: 'โรงแรม' },
                    { key: 'value', label: 'ความคุ้มค่า' },
                    { key: 'program_accuracy', label: 'โปรแกรมตรงปก' },
                    { key: 'would_return', label: 'กลับมาอีก' },
                  ].map(cat => (
                    <div key={cat.key} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                      <span className="text-sm text-gray-600">{cat.label}</span>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map(s => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setEditForm(f => ({
                              ...f,
                              category_ratings: { ...f.category_ratings, [cat.key]: s },
                            }))}
                            className="p-0"
                          >
                            <Star className={`w-4 h-4 ${s <= (editForm.category_ratings[cat.key] || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">ความคิดเห็น <span className="text-red-500">*</span></label>
                <textarea
                  value={editForm.comment}
                  onChange={(e) => setEditForm(f => ({ ...f, comment: e.target.value }))}
                  placeholder="เขียนรีวิว..."
                  rows={4}
                  maxLength={200}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
                <div className="text-xs text-gray-400 text-right mt-1">{editForm.comment.length}/200</div>
              </div>

              {/* Hashtags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Hash className="w-4 h-4" />
                  แฮชแท็ก
                </label>
                {/* Selected tags */}
                {(editForm.tags || []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {(editForm.tags || []).map(tag => (
                      <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                        #{tag}
                        <button type="button" onClick={() => setEditForm(f => ({ ...f, tags: (f.tags || []).filter(t => t !== tag) }))} className="p-0.5 hover:bg-indigo-200 rounded-full">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {/* Suggested tags */}
                {availableTags.filter(t => t.is_active).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {availableTags.filter(t => t.is_active).map(tag => {
                      const isSelected = (editForm.tags || []).includes(tag.name);
                      if (isSelected) return null;
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => setEditForm(f => ({ ...f, tags: [...(f.tags || []), tag.name] }))}
                          className="px-2.5 py-1 rounded-full text-xs border border-gray-300 text-gray-500 hover:bg-gray-50 transition-colors"
                        >
                          #{tag.name}
                        </button>
                      );
                    })}
                  </div>
                )}
                {/* Custom tag input */}
                <input
                  type="text"
                  placeholder="พิมพ์แฮชแท็กแล้วกด Enter เช่น ญี่ปุ่น, ครอบครัว"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      const val = (e.target as HTMLInputElement).value.replace(/[#,]/g, '').trim();
                      if (val && !(editForm.tags || []).includes(val)) {
                        setEditForm(f => ({ ...f, tags: [...(f.tags || []), val] }));
                      }
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                />
              </div>

              {/* Source & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">แหล่งที่มา</label>
                  <select
                    value={editForm.review_source}
                    onChange={(e) => setEditForm(f => ({ ...f, review_source: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="assisted">Assisted (แอดมินสร้าง)</option>
                    <option value="self">สมาชิก</option>
                    <option value="internal">Internal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">สถานะ</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm(f => ({ ...f, status: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="approved">อนุมัติ</option>
                    <option value="pending">รอตรวจสอบ</option>
                    <option value="rejected">ปฏิเสธ</option>
                  </select>
                </div>
              </div>

              {/* Existing Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  รูปภาพรีวิว <span className="text-xs text-gray-400">(สูงสุด 6 ภาพ, ภาพละไม่เกิน 5MB)</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {/* Existing images (from server) */}
                  {editExistingImages
                    .filter(img => !editRemoveImageIds.includes(img.id))
                    .map((img) => (
                      <div key={`existing-${img.id}`} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                        <img src={resolveImageUrl(img.image_url)} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setEditRemoveImageIds(ids => [...ids, img.id])}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] text-center py-0.5">เดิม</div>
                      </div>
                    ))}
                  {/* New images to upload */}
                  {editNewImages.map((file, idx) => (
                    <div key={`new-${idx}`} className="relative group aspect-square rounded-xl overflow-hidden border border-indigo-200 bg-indigo-50">
                      <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setEditNewImages(imgs => imgs.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-indigo-600/70 text-white text-[10px] text-center py-0.5">ใหม่</div>
                    </div>
                  ))}
                  {/* Add button */}
                  {(editExistingImages.filter(img => !editRemoveImageIds.includes(img.id)).length + editNewImages.length) < 6 && (
                    <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-indigo-400 transition-colors">
                      <ImageIcon className="w-6 h-6 text-gray-300 mb-1" />
                      <span className="text-xs text-gray-400">เพิ่มรูป</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          const remaining = 6 - editExistingImages.filter(img => !editRemoveImageIds.includes(img.id)).length - editNewImages.length;
                          setEditNewImages(prev => [...prev, ...files].slice(0, prev.length + remaining));
                          e.target.value = '';
                        }}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-300 px-6 py-4 rounded-b-2xl flex items-center gap-3">
              <button
                onClick={closeEditModal}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-white transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleUpdateReview}
                disabled={editSubmitting || !editForm.reviewer_name.trim() || !editForm.comment.trim()}
                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {editSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    บันทึกการแก้ไข
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
