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
  MousePointerClick,
  Megaphone,
  Tag,
  Mail,
  Info,
  Clock,
  Calendar,
  ExternalLink,
  Palette,
} from 'lucide-react';
import { popupsApi, Popup, PopupStatistics } from '@/lib/api';

const POPUP_TYPE_LABELS: Record<string, string> = {
  image: 'รูปภาพ',
  content: 'เนื้อหา',
  promo: 'โปรโมชั่น',
  newsletter: 'จดหมายข่าว',
  announcement: 'ประกาศ',
};

const POPUP_TYPE_ICONS: Record<string, React.ReactNode> = {
  image: <ImageIcon className="w-4 h-4" />,
  content: <Megaphone className="w-4 h-4" />,
  promo: <Tag className="w-4 h-4" />,
  newsletter: <Mail className="w-4 h-4" />,
  announcement: <Info className="w-4 h-4" />,
};

const FREQUENCY_LABELS: Record<string, string> = {
  always: 'แสดงทุกครั้ง',
  once_per_session: 'แสดงครั้งเดียวต่อเซสชัน',
  once_per_day: 'แสดงครั้งเดียวต่อวัน',
  once_per_week: 'แสดงครั้งเดียวต่อสัปดาห์',
  once: 'แสดงครั้งเดียว',
};

function PopupFormFields({
  title,
  setTitle,
  description,
  setDescription,
  altText,
  setAltText,
  buttonText,
  setButtonText,
  buttonLink,
  setButtonLink,
  buttonColor,
  setButtonColor,
  popupType,
  setPopupType,
  displayFrequency,
  setDisplayFrequency,
  delaySeconds,
  setDelaySeconds,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  showCloseButton,
  setShowCloseButton,
  closeOnOverlay,
  setCloseOnOverlay,
}: {
  title: string;
  setTitle: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  altText: string;
  setAltText: (v: string) => void;
  buttonText: string;
  setButtonText: (v: string) => void;
  buttonLink: string;
  setButtonLink: (v: string) => void;
  buttonColor: string;
  setButtonColor: (v: string) => void;
  popupType: string;
  setPopupType: (v: string) => void;
  displayFrequency: string;
  setDisplayFrequency: (v: string) => void;
  delaySeconds: number;
  setDelaySeconds: (v: number) => void;
  startDate: string;
  setStartDate: (v: string) => void;
  endDate: string;
  setEndDate: (v: string) => void;
  showCloseButton: boolean;
  setShowCloseButton: (v: boolean) => void;
  closeOnOverlay: boolean;
  setCloseOnOverlay: (v: boolean) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          ชื่อ Popup <span className="text-red-500">*</span>
        </label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="เช่น โปรโมชั่นต้อนรับปีใหม่"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียด</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="รายละเอียดเพิ่มเติม"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={3}
        />
      </div>

      {/* Alt Text */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <span className="flex items-center gap-1">
            Alt Text (SEO)
            <Info className="w-3 h-3 text-gray-400" />
          </span>
        </label>
        <Input
          value={altText}
          onChange={(e) => setAltText(e.target.value)}
          placeholder="คำอธิบายรูปภาพสำหรับ SEO"
        />
      </div>

      {/* Popup Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">ประเภท Popup</label>
        <select
          value={popupType}
          onChange={(e) => setPopupType(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {Object.entries(POPUP_TYPE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Button Section */}
      <div className="border border-gray-300 rounded-lg p-3 space-y-3 bg-gray-50">
        <h4 className="text-sm font-medium text-gray-700 flex items-center gap-1">
          <MousePointerClick className="w-4 h-4" />
          ปุ่มกดในป๊อปอัป
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">ข้อความบนปุ่ม</label>
            <Input
              value={buttonText}
              onChange={(e) => setButtonText(e.target.value)}
              placeholder="เช่น ดูรายละเอียด"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">ลิงก์ปุ่ม</label>
            <Input
              value={buttonLink}
              onChange={(e) => setButtonLink(e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1">
            <Palette className="w-3 h-3" />
            สีปุ่ม
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={buttonColor}
              onChange={(e) => setButtonColor(e.target.value)}
              className="w-10 h-8 rounded border border-gray-300 cursor-pointer"
            />
            <Input
              value={buttonColor}
              onChange={(e) => setButtonColor(e.target.value)}
              placeholder="#3B82F6"
              className="flex-1"
            />
          </div>
        </div>
      </div>

      {/* Display Settings */}
      <div className="border border-gray-300 rounded-lg p-3 space-y-3 bg-gray-50">
        <h4 className="text-sm font-medium text-gray-700 flex items-center gap-1">
          <Clock className="w-4 h-4" />
          การตั้งค่าการแสดงผล
        </h4>
        <div>
          <label className="block text-xs text-gray-500 mb-1">ความถี่ในการแสดง</label>
          <select
            value={displayFrequency}
            onChange={(e) => setDisplayFrequency(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {Object.entries(FREQUENCY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">หน่วงเวลาก่อนแสดง (วินาที)</label>
          <Input
            type="number"
            min={0}
            value={delaySeconds}
            onChange={(e) => setDelaySeconds(parseInt(e.target.value) || 0)}
            placeholder="0"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              วันที่เริ่ม
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              วันที่สิ้นสุด
            </label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Behavior Settings */}
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showCloseButton}
            onChange={(e) => setShowCloseButton(e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">แสดงปุ่มปิด</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={closeOnOverlay}
            onChange={(e) => setCloseOnOverlay(e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">ปิดเมื่อคลิกพื้นหลัง</span>
        </label>
      </div>
    </div>
  );
}

export default function PopupsPage() {
  const [popups, setPopups] = useState<Popup[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState<PopupStatistics | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');

  // Upload modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string>('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadAltText, setUploadAltText] = useState('');
  const [uploadButtonText, setUploadButtonText] = useState('');
  const [uploadButtonLink, setUploadButtonLink] = useState('');
  const [uploadButtonColor, setUploadButtonColor] = useState('#3B82F6');
  const [uploadPopupType, setUploadPopupType] = useState<string>('image');
  const [uploadDisplayFrequency, setUploadDisplayFrequency] = useState<string>('once_per_session');
  const [uploadDelaySeconds, setUploadDelaySeconds] = useState(0);
  const [uploadStartDate, setUploadStartDate] = useState('');
  const [uploadEndDate, setUploadEndDate] = useState('');
  const [uploadShowCloseButton, setUploadShowCloseButton] = useState(true);
  const [uploadCloseOnOverlay, setUploadCloseOnOverlay] = useState(true);

  // Edit modal
  const [editPopup, setEditPopup] = useState<Popup | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editAltText, setEditAltText] = useState('');
  const [editButtonText, setEditButtonText] = useState('');
  const [editButtonLink, setEditButtonLink] = useState('');
  const [editButtonColor, setEditButtonColor] = useState('#3B82F6');
  const [editPopupType, setEditPopupType] = useState<string>('image');
  const [editDisplayFrequency, setEditDisplayFrequency] = useState<string>('once_per_session');
  const [editDelaySeconds, setEditDelaySeconds] = useState(0);
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editShowCloseButton, setEditShowCloseButton] = useState(true);
  const [editCloseOnOverlay, setEditCloseOnOverlay] = useState(true);
  const [saving, setSaving] = useState(false);

  // Replace image modal
  const [replacePopup, setReplacePopup] = useState<Popup | null>(null);
  const [replaceFile, setReplaceFile] = useState<File | null>(null);
  const [replacePreview, setReplacePreview] = useState<string>('');
  const [replacing, setReplacing] = useState(false);

  // Drag and drop
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [reordering, setReordering] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const MAX_FILE_SIZE_MB = 5;

  const fetchPopups = useCallback(async () => {
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
      if (filterType) params.popup_type = filterType;

      const response = await popupsApi.list(params);
      if (response.success && response.data) {
        setPopups(response.data);
        if (response.meta) {
          setTotalPages(response.meta.last_page);
          setTotal(response.meta.total);
        }
      }
    } catch (error) {
      console.error('Failed to fetch popups:', error);
    } finally {
      setLoading(false);
    }
  }, [page, search, filterStatus, filterType]);

  const fetchStats = async () => {
    try {
      const response = await popupsApi.getStatistics();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    fetchPopups();
    fetchStats();
  }, [fetchPopups]);

  // Upload handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('webp') && !file.type.includes('png') && !file.type.includes('jpeg') && !file.type.includes('jpg') && !file.type.includes('gif')) {
      alert('รองรับเฉพาะไฟล์ WebP, PNG, JPG, GIF เท่านั้น');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      alert(`ขนาดไฟล์ต้องไม่เกิน ${MAX_FILE_SIZE_MB}MB`);
      return;
    }

    setUploadFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setUploadPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!uploadTitle) {
      alert('กรุณากรอกชื่อ Popup');
      return;
    }

    setUploading(true);
    try {
      await popupsApi.upload(uploadFile, {
        title: uploadTitle,
        description: uploadDescription || undefined,
        alt_text: uploadAltText || undefined,
        button_text: uploadButtonText || undefined,
        button_link: uploadButtonLink || undefined,
        button_color: uploadButtonColor,
        popup_type: uploadPopupType,
        display_frequency: uploadDisplayFrequency,
        delay_seconds: uploadDelaySeconds,
        start_date: uploadStartDate || undefined,
        end_date: uploadEndDate || undefined,
        is_active: true,
        show_close_button: uploadShowCloseButton,
        close_on_overlay: uploadCloseOnOverlay,
      });
      resetUploadForm();
      setShowUploadModal(false);
      fetchPopups();
      fetchStats();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'อัพโหลดล้มเหลว');
    } finally {
      setUploading(false);
    }
  };

  const resetUploadForm = () => {
    setUploadFile(null);
    setUploadPreview('');
    setUploadTitle('');
    setUploadDescription('');
    setUploadAltText('');
    setUploadButtonText('');
    setUploadButtonLink('');
    setUploadButtonColor('#3B82F6');
    setUploadPopupType('image');
    setUploadDisplayFrequency('once_per_session');
    setUploadDelaySeconds(0);
    setUploadStartDate('');
    setUploadEndDate('');
    setUploadShowCloseButton(true);
    setUploadCloseOnOverlay(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Edit handlers
  const openEditModal = (popup: Popup) => {
    setEditPopup(popup);
    setEditTitle(popup.title);
    setEditDescription(popup.description || '');
    setEditAltText(popup.alt_text || '');
    setEditButtonText(popup.button_text || '');
    setEditButtonLink(popup.button_link || '');
    setEditButtonColor(popup.button_color || '#3B82F6');
    setEditPopupType(popup.popup_type);
    setEditDisplayFrequency(popup.display_frequency);
    setEditDelaySeconds(popup.delay_seconds);
    setEditStartDate(popup.start_date || '');
    setEditEndDate(popup.end_date || '');
    setEditShowCloseButton(popup.show_close_button);
    setEditCloseOnOverlay(popup.close_on_overlay);
  };

  const handleSaveEdit = async () => {
    if (!editPopup) return;
    setSaving(true);
    try {
      await popupsApi.update(editPopup.id, {
        title: editTitle,
        description: editDescription || null,
        alt_text: editAltText || null,
        button_text: editButtonText || null,
        button_link: editButtonLink || null,
        button_color: editButtonColor,
        popup_type: editPopupType as Popup['popup_type'],
        display_frequency: editDisplayFrequency as Popup['display_frequency'],
        delay_seconds: editDelaySeconds,
        start_date: editStartDate || null,
        end_date: editEndDate || null,
        show_close_button: editShowCloseButton,
        close_on_overlay: editCloseOnOverlay,
      });
      setEditPopup(null);
      fetchPopups();
      fetchStats();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'บันทึกล้มเหลว');
    } finally {
      setSaving(false);
    }
  };

  // Replace image handlers
  const handleReplaceFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('webp') && !file.type.includes('png') && !file.type.includes('jpeg') && !file.type.includes('jpg') && !file.type.includes('gif')) {
      alert('รองรับเฉพาะไฟล์ WebP, PNG, JPG, GIF เท่านั้น');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      alert(`ขนาดไฟล์ต้องไม่เกิน ${MAX_FILE_SIZE_MB}MB`);
      return;
    }

    setReplaceFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setReplacePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleReplaceImage = async () => {
    if (!replacePopup || !replaceFile) return;
    setReplacing(true);
    try {
      await popupsApi.replaceImage(replacePopup.id, replaceFile);
      setReplacePopup(null);
      setReplaceFile(null);
      setReplacePreview('');
      if (replaceFileInputRef.current) replaceFileInputRef.current.value = '';
      fetchPopups();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'เปลี่ยนรูปล้มเหลว');
    } finally {
      setReplacing(false);
    }
  };

  // Toggle status
  const handleToggleStatus = async (id: number) => {
    try {
      await popupsApi.toggleStatus(id);
      fetchPopups();
      fetchStats();
    } catch {
      alert('เปลี่ยนสถานะล้มเหลว');
    }
  };

  // Delete
  const handleDelete = async (popup: Popup) => {
    if (!confirm(`ต้องการลบ Popup "${popup.title}" หรือไม่?`)) return;
    try {
      await popupsApi.delete(popup.id);
      fetchPopups();
      fetchStats();
    } catch {
      alert('ลบล้มเหลว');
    }
  };

  // Drag and drop reorder
  const handleDragStart = (id: number) => setDraggedId(id);
  const handleDragEnd = () => setDraggedId(null);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = async (targetId: number) => {
    if (draggedId === null || draggedId === targetId) return;
    setReordering(true);
    const newPopups = [...popups];
    const dragIndex = newPopups.findIndex((p) => p.id === draggedId);
    const dropIndex = newPopups.findIndex((p) => p.id === targetId);
    const [dragged] = newPopups.splice(dragIndex, 1);
    newPopups.splice(dropIndex, 0, dragged);
    setPopups(newPopups);
    try {
      await popupsApi.reorder(
        newPopups.map((p, i) => ({ id: p.id, sort_order: i + 1 }))
      );
      fetchPopups();
    } catch (error) {
      console.error('Reorder failed:', error);
      fetchPopups();
    } finally {
      setReordering(false);
      setDraggedId(null);
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isCurrentlyActive = (popup: Popup) => {
    if (!popup.is_active) return false;
    const now = new Date();
    if (popup.start_date && new Date(popup.start_date) > now) return false;
    if (popup.end_date && new Date(popup.end_date) < now) return false;
    return true;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">จัดการ Popup</h1>
          <p className="text-gray-600 mt-1">จัดการป๊อปอัปที่แสดงบนหน้าเว็บไซต์</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              fetchPopups();
              fetchStats();
            }}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            รีเฟรช
          </Button>
          <Button onClick={() => setShowUploadModal(true)}>
            <Upload className="w-4 h-4 mr-2" />
            เพิ่ม Popup ใหม่
          </Button>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-500">ทั้งหมด</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-sm text-gray-500">เปิดใช้งาน</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-400">{stats.inactive}</div>
            <div className="text-sm text-gray-500">ปิดใช้งาน</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.currently_showing}</div>
            <div className="text-sm text-gray-500">แสดงอยู่ตอนนี้</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {stats.by_type ? Object.keys(stats.by_type).length : 0}
            </div>
            <div className="text-sm text-gray-500">ประเภท</div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="ค้นหาชื่อ Popup..."
              className="pl-10"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPage(1);
            }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">สถานะทั้งหมด</option>
            <option value="1">เปิดใช้งาน</option>
            <option value="0">ปิดใช้งาน</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setPage(1);
            }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">ประเภททั้งหมด</option>
            {Object.entries(POPUP_TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Popups List */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : popups.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Megaphone className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>ยังไม่มี Popup</p>
            <Button onClick={() => setShowUploadModal(true)} className="mt-4">
              <Upload className="w-4 h-4 mr-2" />
              เพิ่ม Popup แรก
            </Button>
          </div>
        ) : (
          <div className="divide-y">
            {popups.map((popup) => (
              <div
                key={popup.id}
                className={`flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors ${
                  draggedId === popup.id ? 'opacity-50' : ''
                } ${reordering ? 'pointer-events-none' : ''}`}
                draggable
                onDragStart={() => handleDragStart(popup.id)}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(popup.id)}
              >
                {/* Drag handle */}
                <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
                  <GripVertical className="w-5 h-5" />
                </div>

                {/* Image preview */}
                <div className="w-24 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-300">
                  {popup.image_url ? (
                    <img
                      src={popup.image_url}
                      alt={popup.alt_text || popup.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Megaphone className="w-6 h-6" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-900 truncate">{popup.title}</h3>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-blue-50 text-blue-700">
                      {POPUP_TYPE_ICONS[popup.popup_type]}
                      {POPUP_TYPE_LABELS[popup.popup_type]}
                    </span>
                    <span className={`inline-block w-2 h-2 rounded-full ${
                      isCurrentlyActive(popup) ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {FREQUENCY_LABELS[popup.display_frequency]}
                    </span>
                    {popup.delay_seconds > 0 && (
                      <span>หน่วง {popup.delay_seconds} วินาที</span>
                    )}
                    {popup.start_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(popup.start_date)} - {formatDate(popup.end_date)}
                      </span>
                    )}
                    {popup.button_text && (
                      <span className="flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" />
                        {popup.button_text}
                      </span>
                    )}
                    {popup.file_size && (
                      <span>{formatFileSize(popup.file_size)}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleStatus(popup.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      popup.is_active
                        ? 'text-green-600 hover:bg-green-50'
                        : 'text-gray-400 hover:bg-gray-100'
                    }`}
                    title={popup.is_active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                  >
                    {popup.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  {popup.image_url && (
                    <button
                      onClick={() => setReplacePopup(popup)}
                      className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                      title="เปลี่ยนรูปภาพ"
                    >
                      <ImageIcon className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => openEditModal(popup)}
                    className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors"
                    title="แก้ไข"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(popup)}
                    className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                    title="ลบ"
                  >
                    <Trash2 className="w-4 h-4" />
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
            แสดง {popups.length} จาก {total} รายการ
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              ก่อนหน้า
            </Button>
            <span className="flex items-center px-3 text-sm text-gray-600">
              หน้า {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              ถัดไป
            </Button>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold">เพิ่ม Popup ใหม่</h2>
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
            <div className="p-6 space-y-4">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  รูปภาพ Popup (ไม่บังคับ)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".webp,.png,.jpg,.jpeg,.gif"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {uploadPreview ? (
                  <div className="relative">
                    <img
                      src={uploadPreview}
                      alt="Preview"
                      className="w-full max-h-[200px] object-contain rounded-lg border border-gray-300"                    />
                    <button
                      onClick={() => {
                        setUploadFile(null);
                        setUploadPreview('');
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  >
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-500">คลิกเพื่อเลือกรูปภาพ</p>
                    <p className="text-xs text-gray-400 mt-1">
                      รองรับ WebP, PNG, JPG, GIF · สูงสุด {MAX_FILE_SIZE_MB}MB
                    </p>
                  </button>
                )}
              </div>

              <PopupFormFields
                title={uploadTitle}
                setTitle={setUploadTitle}
                description={uploadDescription}
                setDescription={setUploadDescription}
                altText={uploadAltText}
                setAltText={setUploadAltText}
                buttonText={uploadButtonText}
                setButtonText={setUploadButtonText}
                buttonLink={uploadButtonLink}
                setButtonLink={setUploadButtonLink}
                buttonColor={uploadButtonColor}
                setButtonColor={setUploadButtonColor}
                popupType={uploadPopupType}
                setPopupType={setUploadPopupType}
                displayFrequency={uploadDisplayFrequency}
                setDisplayFrequency={setUploadDisplayFrequency}
                delaySeconds={uploadDelaySeconds}
                setDelaySeconds={setUploadDelaySeconds}
                startDate={uploadStartDate}
                setStartDate={setUploadStartDate}
                endDate={uploadEndDate}
                setEndDate={setUploadEndDate}
                showCloseButton={uploadShowCloseButton}
                setShowCloseButton={setUploadShowCloseButton}
                closeOnOverlay={uploadCloseOnOverlay}
                setCloseOnOverlay={setUploadCloseOnOverlay}
              />
            </div>
            <div className="flex justify-end gap-3 p-6 border-t sticky bottom-0 bg-white">
              <Button
                variant="outline"
                onClick={() => {
                  setShowUploadModal(false);
                  resetUploadForm();
                }}
              >
                ยกเลิก
              </Button>
              <Button onClick={handleUpload} disabled={uploading || !uploadTitle}>
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    กำลังสร้าง...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    สร้าง Popup
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold">แก้ไข Popup</h2>
              <button
                onClick={() => setEditPopup(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Current Image Preview */}
              {editPopup.image_url && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">รูปภาพปัจจุบัน</label>
                  <img
                    src={editPopup.image_url}
                    alt={editPopup.alt_text || editPopup.title}
                    className="w-full max-h-[200px] object-contain rounded-lg border border-gray-300"
                  />
                </div>
              )}

              <PopupFormFields
                title={editTitle}
                setTitle={setEditTitle}
                description={editDescription}
                setDescription={setEditDescription}
                altText={editAltText}
                setAltText={setEditAltText}
                buttonText={editButtonText}
                setButtonText={setEditButtonText}
                buttonLink={editButtonLink}
                setButtonLink={setEditButtonLink}
                buttonColor={editButtonColor}
                setButtonColor={setEditButtonColor}
                popupType={editPopupType}
                setPopupType={setEditPopupType}
                displayFrequency={editDisplayFrequency}
                setDisplayFrequency={setEditDisplayFrequency}
                delaySeconds={editDelaySeconds}
                setDelaySeconds={setEditDelaySeconds}
                startDate={editStartDate}
                setStartDate={setEditStartDate}
                endDate={editEndDate}
                setEndDate={setEditEndDate}
                showCloseButton={editShowCloseButton}
                setShowCloseButton={setEditShowCloseButton}
                closeOnOverlay={editCloseOnOverlay}
                setCloseOnOverlay={setEditCloseOnOverlay}
              />
            </div>
            <div className="flex justify-end gap-3 p-6 border-t sticky bottom-0 bg-white">
              <Button variant="outline" onClick={() => setEditPopup(null)}>
                ยกเลิก
              </Button>
              <Button onClick={handleSaveEdit} disabled={saving || !editTitle}>
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
      {replacePopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">เปลี่ยนรูปภาพ - {replacePopup.title}</h2>
              <button
                onClick={() => {
                  setReplacePopup(null);
                  setReplaceFile(null);
                  setReplacePreview('');
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Current Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">รูปภาพปัจจุบัน</label>
                <img
                  src={replacePopup.image_url || ''}
                  alt={replacePopup.alt_text || replacePopup.title}
                  className="w-full max-h-[150px] object-contain rounded-lg border border-gray-300"
                />
              </div>

              {/* New Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">รูปภาพใหม่</label>
                <input
                  ref={replaceFileInputRef}
                  type="file"
                  accept=".webp,.png,.jpg,.jpeg,.gif"
                  onChange={handleReplaceFileSelect}
                  className="hidden"
                />
                {replacePreview ? (
                  <div className="relative">
                    <img src={replacePreview} alt="Preview" className="w-full max-h-[150px] object-contain rounded-lg border border-gray-300" />
                    <button
                      onClick={() => {
                        setReplaceFile(null);
                        setReplacePreview('');
                        if (replaceFileInputRef.current) replaceFileInputRef.current.value = '';
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => replaceFileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  >
                    <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-500">คลิกเพื่อเลือกรูปภาพใหม่</p>
                    <p className="text-xs text-gray-400 mt-1">
                      รองรับ WebP, PNG, JPG, GIF · สูงสุด {MAX_FILE_SIZE_MB}MB
                    </p>
                  </button>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setReplacePopup(null);
                  setReplaceFile(null);
                  setReplacePreview('');
                }}
              >
                ยกเลิก
              </Button>
              <Button onClick={handleReplaceImage} disabled={replacing || !replaceFile}>
                {replacing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    กำลังเปลี่ยน...
                  </>
                ) : (
                  'เปลี่ยนรูปภาพ'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
