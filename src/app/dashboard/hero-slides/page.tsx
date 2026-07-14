'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button, Card, Input } from '@/components/ui';
import {
  ImageIcon,
  Upload,
  Search,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  X,
  GripVertical,
  Loader2,
  RefreshCw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  MousePointerClick,
} from 'lucide-react';
import { heroSlidesApi, HeroSlide, HeroSlideStatistics } from '@/lib/api';

export default function HeroSlidesPage() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState<HeroSlideStatistics | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Upload modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string>('');
  const [uploadAlt, setUploadAlt] = useState('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadSubtitle, setUploadSubtitle] = useState('');
  const [uploadButtonText, setUploadButtonText] = useState('');
  const [uploadButtonLink, setUploadButtonLink] = useState('');

  // Edit modal
  const [editSlide, setEditSlide] = useState<HeroSlide | null>(null);
  const [editAlt, setEditAlt] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [editButtonText, setEditButtonText] = useState('');
  const [editButtonLink, setEditButtonLink] = useState('');
  const [saving, setSaving] = useState(false);

  // Replace image modal
  const [replaceSlide, setReplaceSlide] = useState<HeroSlide | null>(null);
  const [replaceFile, setReplaceFile] = useState<File | null>(null);
  const [replacePreview, setReplacePreview] = useState<string>('');
  const [replacing, setReplacing] = useState(false);

  // Preview carousel
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  // Drag and drop
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [reordering, setReordering] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);

  const fetchSlides = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: page.toString(),
        per_page: '20',
        sort_by: 'sort_order',
        sort_dir: 'asc',
      };
      if (search) params.search = search;
      if (filterStatus) params.is_active = filterStatus;

      const response = await heroSlidesApi.list(params);
      if (response.success && response.data) {
        setSlides(response.data);
        if (response.meta) {
          setTotalPages(response.meta.last_page);
          setTotal(response.meta.total);
        }
      }
    } catch (error) {
      console.error('Failed to fetch slides:', error);
    } finally {
      setLoading(false);
    }
  }, [page, search, filterStatus]);

  const fetchStats = async () => {
    try {
      const response = await heroSlidesApi.getStatistics();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    fetchSlides();
  }, [fetchSlides]);

  useEffect(() => {
    fetchStats();
  }, []);

  // Max file size 2MB (PHP default limit)
  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB in bytes
  const MAX_FILE_SIZE_MB = 2;

  // Handle file select for upload
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        alert(`ไฟล์มีขนาดใหญ่เกินไป (${(file.size / 1024 / 1024).toFixed(2)} MB)\nขนาดสูงสุดที่รองรับคือ ${MAX_FILE_SIZE_MB} MB\n\nกรุณาลดขนาดภาพก่อนอัพโหลด`);
        e.target.value = '';
        return;
      }
      setUploadFile(file);
      const reader = new FileReader();
      reader.onload = () => setUploadPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Handle file select for replace
  const handleReplaceFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        alert(`ไฟล์มีขนาดใหญ่เกินไป (${(file.size / 1024 / 1024).toFixed(2)} MB)\nขนาดสูงสุดที่รองรับคือ ${MAX_FILE_SIZE_MB} MB\n\nกรุณาลดขนาดภาพก่อนอัพโหลด`);
        e.target.value = '';
        return;
      }
      setReplaceFile(file);
      const reader = new FileReader();
      reader.onload = () => setReplacePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Upload new slide
  const handleUpload = async () => {
    if (!uploadFile) return;

    setUploading(true);
    try {
      const response = await heroSlidesApi.upload(uploadFile, {
        alt: uploadAlt || undefined,
        title: uploadTitle || undefined,
        subtitle: uploadSubtitle || undefined,
        button_text: uploadButtonText || undefined,
        button_link: uploadButtonLink || undefined,
      });

      if (response.success) {
        setShowUploadModal(false);
        resetUploadForm();
        fetchSlides();
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to upload:', error);
      alert('อัพโหลดไม่สำเร็จ: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };

  const resetUploadForm = () => {
    setUploadFile(null);
    setUploadPreview('');
    setUploadAlt('');
    setUploadTitle('');
    setUploadSubtitle('');
    setUploadButtonText('');
    setUploadButtonLink('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Open edit modal
  const openEditModal = (slide: HeroSlide) => {
    setEditSlide(slide);
    setEditAlt(slide.alt || '');
    setEditTitle(slide.title || '');
    setEditSubtitle(slide.subtitle || '');
    setEditButtonText(slide.button_text || '');
    setEditButtonLink(slide.button_link || '');
  };

  // Save edit
  const handleSaveEdit = async () => {
    if (!editSlide) return;

    setSaving(true);
    try {
      const response = await heroSlidesApi.update(editSlide.id, {
        alt: editAlt || null,
        title: editTitle || null,
        subtitle: editSubtitle || null,
        button_text: editButtonText || null,
        button_link: editButtonLink || null,
      });

      if (response.success) {
        setEditSlide(null);
        fetchSlides();
      }
    } catch (error) {
      console.error('Failed to update:', error);
      alert('อัพเดทไม่สำเร็จ: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  // Replace image
  const handleReplaceImage = async () => {
    if (!replaceSlide || !replaceFile) return;

    setReplacing(true);
    try {
      const response = await heroSlidesApi.replaceImage(replaceSlide.id, replaceFile);

      if (response.success) {
        setReplaceSlide(null);
        setReplaceFile(null);
        setReplacePreview('');
        if (replaceFileInputRef.current) replaceFileInputRef.current.value = '';
        fetchSlides();
      }
    } catch (error) {
      console.error('Failed to replace image:', error);
      alert('เปลี่ยนรูปไม่สำเร็จ: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setReplacing(false);
    }
  };

  // Toggle status
  const handleToggleStatus = async (slide: HeroSlide) => {
    try {
      const response = await heroSlidesApi.toggleStatus(slide.id);
      if (response.success) {
        fetchSlides();
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to toggle status:', error);
    }
  };

  // Delete slide
  const handleDelete = async (slide: HeroSlide) => {
    if (!confirm(`ยืนยันลบ Hero Slide "${slide.filename}" ?`)) return;

    try {
      const response = await heroSlidesApi.delete(slide.id);
      if (response.success) {
        fetchSlides();
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('ลบไม่สำเร็จ: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetId: number) => {
    e.preventDefault();
    if (draggedId === null || draggedId === targetId) {
      setDraggedId(null);
      return;
    }

    // Find indices
    const draggedIndex = slides.findIndex((s) => s.id === draggedId);
    const targetIndex = slides.findIndex((s) => s.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedId(null);
      return;
    }

    // Reorder locally first
    const newSlides = [...slides];
    const [removed] = newSlides.splice(draggedIndex, 1);
    newSlides.splice(targetIndex, 0, removed);

    // Update sort_order values
    const reorderedSlides = newSlides.map((slide, index) => ({
      ...slide,
      sort_order: index + 1,
    }));

    setSlides(reorderedSlides);
    setDraggedId(null);

    // Save to backend
    setReordering(true);
    try {
      await heroSlidesApi.reorder(
        reorderedSlides.map((s) => ({ id: s.id, sort_order: s.sort_order }))
      );
    } catch (error) {
      console.error('Failed to reorder:', error);
      fetchSlides(); // Reload on error
    } finally {
      setReordering(false);
    }
  };

  // Preview carousel navigation
  const activeSlides = slides.filter((s) => s.is_active);
  const nextPreview = () =>
    setPreviewIndex((prev) => (prev + 1) % activeSlides.length);
  const prevPreview = () =>
    setPreviewIndex((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hero Slides</h1>
          <p className="text-gray-600 mt-1">จัดการภาพสไลด์หน้าแรก</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setPreviewIndex(0);
              setPreviewOpen(true);
            }}
            disabled={activeSlides.length === 0}
          >
            <Eye className="w-4 h-4 mr-2" />
            ดูตัวอย่าง
          </Button>
          <Button onClick={() => setShowUploadModal(true)}>
            <Upload className="w-4 h-4 mr-2" />
            เพิ่ม Slide
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ImageIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">ทั้งหมด</p>
                <p className="text-xl font-semibold">{stats.total}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Eye className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">เปิดใช้งาน</p>
                <p className="text-xl font-semibold">{stats.active}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <EyeOff className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">ปิดใช้งาน</p>
                <p className="text-xl font-semibold">{stats.inactive}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="ค้นหา..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">ทุกสถานะ</option>
            <option value="true">เปิดใช้งาน</option>
            <option value="false">ปิดใช้งาน</option>
          </select>
          <Button variant="outline" onClick={() => fetchSlides()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            รีเฟรช
          </Button>
        </div>
      </Card>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>💡 วิธีจัดเรียง:</strong> ลากและวางเพื่อจัดลำดับการแสดงผล Slide
          (ลำดับที่ 1 จะแสดงก่อน)
        </p>
      </div>

      {/* Slides List */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : slides.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">ยังไม่มี Hero Slides</p>
            <Button className="mt-4" onClick={() => setShowUploadModal(true)}>
              <Upload className="w-4 h-4 mr-2" />
              เพิ่ม Slide แรก
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {reordering && (
              <div className="px-4 py-2 bg-yellow-50 text-sm text-yellow-700">
                <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                กำลังบันทึกลำดับ...
              </div>
            )}
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                draggable
                onDragStart={(e) => handleDragStart(e, slide.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, slide.id)}
                className={`flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors ${
                  draggedId === slide.id ? 'opacity-50 bg-blue-50' : ''
                } ${!slide.is_active ? 'bg-gray-50' : ''}`}
              >
                {/* Drag Handle */}
                <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
                  <GripVertical className="w-5 h-5" />
                </div>

                {/* Order Number */}
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                  {index + 1}
                </div>

                {/* Thumbnail */}
                <div className="relative w-32 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={slide.url}
                    alt={slide.alt || slide.filename}
                    className="w-full h-full object-cover"
                  />
                  {!slide.is_active && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <EyeOff className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-900 truncate">
                      {slide.title || slide.filename}
                    </h3>
                    {slide.is_active ? (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full whitespace-nowrap">
                        เปิดใช้งาน
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full whitespace-nowrap">
                        ปิดใช้งาน
                      </span>
                    )}
                  </div>
                  {slide.subtitle && (
                    <p className="text-sm text-gray-600 truncate mb-0.5">{slide.subtitle}</p>
                  )}
                  {slide.alt && (
                    <p className="text-xs text-gray-500 truncate">
                      <span className="font-medium text-gray-400">Alt:</span> {slide.alt}
                    </p>
                  )}

                  {/* Button preview (if defined) */}
                  {(slide.button_text || slide.button_link) && (
                    <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                      {slide.button_text && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded border border-purple-200 font-medium">
                          <MousePointerClick className="w-3 h-3" />
                          {slide.button_text}
                        </span>
                      )}
                      {slide.button_link && (
                        <a
                          href={slide.button_link.startsWith('/') || slide.button_link.startsWith('http') ? slide.button_link : `/${slide.button_link}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded border border-blue-200 font-mono max-w-[420px] truncate hover:bg-blue-100 hover:underline"
                          title={`เปิดในแท็บใหม่: ${slide.button_link}`}
                        >
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{decodeURIComponent(slide.button_link)}</span>
                        </a>
                      )}
                      {slide.button_link && !slide.button_link.startsWith('/') && !slide.button_link.startsWith('http') && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 text-xs rounded border border-amber-200"
                          title="ลิงก์นี้ไม่มี / นำหน้า จะทำงานเป็น relative URL อาจทำงานผิดหน้าเว็บ"
                        >
                          ⚠ ไม่มี / นำหน้า
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                    <span>
                      {slide.width}x{slide.height}
                    </span>
                    <span>{(slide.file_size / 1024).toFixed(1)} KB</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleStatus(slide)}
                    className={`p-2 rounded-lg transition-colors ${
                      slide.is_active
                        ? 'text-green-600 hover:bg-green-50'
                        : 'text-gray-400 hover:bg-gray-100'
                    }`}
                    title={slide.is_active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                  >
                    {slide.is_active ? (
                      <Eye className="w-5 h-5" />
                    ) : (
                      <EyeOff className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setReplaceSlide(slide);
                      setReplaceFile(null);
                      setReplacePreview('');
                    }}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="เปลี่ยนรูป"
                  >
                    <ImageIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => openEditModal(slide)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="แก้ไข"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(slide)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="ลบ"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            แสดง {slides.length} จาก {total} รายการ
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              ก่อนหน้า
            </Button>
            <span className="px-4 py-2 text-sm">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              ถัดไป
            </Button>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">เพิ่ม Hero Slide</h2>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  resetUploadForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* File Input - Drag & Drop Zone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เลือกรูปภาพ <span className="text-red-500">*</span>
                </label>
                
                {!uploadPreview ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.currentTarget.classList.add('border-blue-500', 'bg-blue-50');
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
                      const file = e.dataTransfer.files?.[0];
                      if (file && file.type.startsWith('image/')) {
                        // Check file size
                        if (file.size > MAX_FILE_SIZE) {
                          alert(`ไฟล์มีขนาดใหญ่เกินไป (${(file.size / 1024 / 1024).toFixed(2)} MB)\nขนาดสูงสุดที่รองรับคือ ${MAX_FILE_SIZE_MB} MB\n\nกรุณาลดขนาดภาพก่อนอัพโหลด`);
                          return;
                        }
                        setUploadFile(file);
                        const reader = new FileReader();
                        reader.onload = () => setUploadPreview(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        <Upload className="w-8 h-8 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-base font-medium text-gray-700">
                          ลากไฟล์มาวางที่นี่ หรือ <span className="text-blue-600">คลิกเพื่อเลือก</span>
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          รองรับ JPEG, PNG, GIF, WebP, BMP (สูงสุด {MAX_FILE_SIZE_MB}MB)
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                          แนะนำขนาด 1920x600 px หรือ 1920x800 px
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Preview */
                  <div className="relative rounded-xl overflow-hidden bg-gray-100 group">
                    <img
                      src={uploadPreview}
                      alt="Preview"
                      className="w-full h-64 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                      >
                        เปลี่ยนรูป
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUploadFile(null);
                          setUploadPreview('');
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
                      >
                        ลบ
                      </button>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                )}
              </div>

              {/* Alt Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alt Text <span className="text-gray-400">(SEO)</span>
                </label>
                <Input
                  value={uploadAlt}
                  onChange={(e) => setUploadAlt(e.target.value)}
                  placeholder="คำอธิบายรูปภาพสำหรับ SEO"
                />
                <p className="mt-1 text-xs text-gray-500">
                  ช่วยให้ Search Engine เข้าใจเนื้อหาของรูป
                </p>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title Attribute
                </label>
                <Input
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="หัวข้อที่แสดงเมื่อ hover"
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subtitle / คำบรรยาย
                </label>
                <Input
                  value={uploadSubtitle}
                  onChange={(e) => setUploadSubtitle(e.target.value)}
                  placeholder="คำบรรยายเพิ่มเติม"
                />
              </div>

              {/* Button */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ข้อความปุ่ม
                  </label>
                  <Input
                    value={uploadButtonText}
                    onChange={(e) => setUploadButtonText(e.target.value)}
                    placeholder="เช่น ดูทัวร์เพิ่มเติม"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ลิงก์ปุ่ม
                  </label>
                  <Input
                    value={uploadButtonLink}
                    onChange={(e) => setUploadButtonLink(e.target.value)}
                    placeholder="เช่น /tours/japan"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 p-4 border-t bg-gray-50">
              <Button
                variant="outline"
                onClick={() => {
                  setShowUploadModal(false);
                  resetUploadForm();
                }}
              >
                ยกเลิก
              </Button>
              <Button onClick={handleUpload} disabled={!uploadFile || uploading}>
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    กำลังอัพโหลด...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    อัพโหลด
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editSlide && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">แก้ไข Hero Slide</h2>
              <button
                onClick={() => setEditSlide(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Current Image */}
              <div className="relative rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={editSlide.url}
                  alt={editSlide.alt || editSlide.filename}
                  className="w-full h-48 object-cover"
                />
              </div>

              {/* Alt Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alt Text <span className="text-gray-400">(SEO)</span>
                </label>
                <Input
                  value={editAlt}
                  onChange={(e) => setEditAlt(e.target.value)}
                  placeholder="คำอธิบายรูปภาพสำหรับ SEO"
                />
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title Attribute
                </label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="หัวข้อที่แสดงเมื่อ hover"
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subtitle / คำบรรยาย
                </label>
                <Input
                  value={editSubtitle}
                  onChange={(e) => setEditSubtitle(e.target.value)}
                  placeholder="คำบรรยายเพิ่มเติม"
                />
              </div>

              {/* Button */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ข้อความปุ่ม
                  </label>
                  <Input
                    value={editButtonText}
                    onChange={(e) => setEditButtonText(e.target.value)}
                    placeholder="เช่น ดูทัวร์เพิ่มเติม"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ลิงก์ปุ่ม
                  </label>
                  <Input
                    value={editButtonLink}
                    onChange={(e) => setEditButtonLink(e.target.value)}
                    placeholder="เช่น /tours/japan"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 p-4 border-t bg-gray-50">
              <Button variant="outline" onClick={() => setEditSlide(null)}>
                ยกเลิก
              </Button>
              <Button onClick={handleSaveEdit} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  'บันทึก'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Replace Image Modal */}
      {replaceSlide && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">เปลี่ยนรูป Hero Slide</h2>
              <button
                onClick={() => {
                  setReplaceSlide(null);
                  setReplaceFile(null);
                  setReplacePreview('');
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Current Image */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">รูปปัจจุบัน</p>
                <div className="relative rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={replaceSlide.url}
                    alt={replaceSlide.alt || replaceSlide.filename}
                    className="w-full h-32 object-cover"
                  />
                </div>
              </div>

              {/* File Input - Drag & Drop Zone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เลือกรูปใหม่ <span className="text-red-500">*</span>
                </label>
                
                {!replacePreview ? (
                  <div
                    onClick={() => replaceFileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.currentTarget.classList.add('border-blue-500', 'bg-blue-50');
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
                      const file = e.dataTransfer.files?.[0];
                      if (file && file.type.startsWith('image/')) {
                        // Check file size
                        if (file.size > MAX_FILE_SIZE) {
                          alert(`ไฟล์มีขนาดใหญ่เกินไป (${(file.size / 1024 / 1024).toFixed(2)} MB)\nขนาดสูงสุดที่รองรับคือ ${MAX_FILE_SIZE_MB} MB\n\nกรุณาลดขนาดภาพก่อนอัพโหลด`);
                          return;
                        }
                        setReplaceFile(file);
                        const reader = new FileReader();
                        reader.onload = () => setReplacePreview(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all"
                  >
                    <input
                      ref={replaceFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleReplaceFileSelect}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Upload className="w-6 h-6 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          ลากไฟล์มาวางที่นี่ หรือ <span className="text-blue-600">คลิกเพื่อเลือก</span>
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          รองรับ JPEG, PNG, GIF, WebP, BMP (สูงสุด {MAX_FILE_SIZE_MB}MB)
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* New Preview */
                  <div>
                    <p className="text-sm text-gray-600 mb-2">รูปใหม่</p>
                    <div className="relative rounded-xl overflow-hidden bg-gray-100 group">
                      <img
                        src={replacePreview}
                        alt="New Preview"
                        className="w-full h-40 object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => replaceFileInputRef.current?.click()}
                          className="px-3 py-1.5 bg-white text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
                        >
                          เปลี่ยน
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setReplaceFile(null);
                            setReplacePreview('');
                            if (replaceFileInputRef.current) replaceFileInputRef.current.value = '';
                          }}
                          className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
                        >
                          ลบ
                        </button>
                      </div>
                      <input
                        ref={replaceFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleReplaceFileSelect}
                        className="hidden"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 p-4 border-t bg-gray-50">
              <Button
                variant="outline"
                onClick={() => {
                  setReplaceSlide(null);
                  setReplaceFile(null);
                  setReplacePreview('');
                }}
              >
                ยกเลิก
              </Button>
              <Button onClick={handleReplaceImage} disabled={!replaceFile || replacing}>
                {replacing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    กำลังเปลี่ยน...
                  </>
                ) : (
                  'เปลี่ยนรูป'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Carousel Modal */}
      {previewOpen && activeSlides.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
          <button
            onClick={() => setPreviewOpen(false)}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-lg z-10"
          >
            <X className="w-6 h-6" />
          </button>

          <button
            onClick={prevPreview}
            className="absolute left-4 p-3 text-white hover:bg-white/10 rounded-full z-10"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>

          <div className="max-w-5xl w-full mx-4">
            <img
              src={activeSlides[previewIndex].url}
              alt={activeSlides[previewIndex].alt || ''}
              className="w-full h-auto max-h-[70vh] object-contain"
            />
            <div className="text-center mt-4 text-white">
              {activeSlides[previewIndex].title && (
                <h3 className="text-2xl font-bold">{activeSlides[previewIndex].title}</h3>
              )}
              {activeSlides[previewIndex].subtitle && (
                <p className="text-lg mt-2 text-white/80">
                  {activeSlides[previewIndex].subtitle}
                </p>
              )}
              {activeSlides[previewIndex].button_text && (
                <div className="mt-4">
                  <span className="px-6 py-2 bg-white text-gray-900 rounded-lg font-medium">
                    {activeSlides[previewIndex].button_text}
                  </span>
                </div>
              )}
              <p className="mt-4 text-sm text-white/60">
                {previewIndex + 1} / {activeSlides.length}
              </p>
            </div>
          </div>

          <button
            onClick={nextPreview}
            className="absolute right-4 p-3 text-white hover:bg-white/10 rounded-full z-10"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </div>
      )}
    </div>
  );
}
