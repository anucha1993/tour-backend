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
  Users,
  Globe,
  Info,
} from 'lucide-react';
import { ourClientsApi, OurClient, OurClientStatistics } from '@/lib/api';

export default function OurClientsPage() {
  const [clients, setClients] = useState<OurClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState<OurClientStatistics | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Upload modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string>('');
  const [uploadName, setUploadName] = useState('');
  const [uploadAlt, setUploadAlt] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadWebsiteUrl, setUploadWebsiteUrl] = useState('');
  const [uploadCustomFilename, setUploadCustomFilename] = useState('');

  // Edit modal
  const [editClient, setEditClient] = useState<OurClient | null>(null);
  const [editName, setEditName] = useState('');
  const [editAlt, setEditAlt] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editWebsiteUrl, setEditWebsiteUrl] = useState('');
  const [saving, setSaving] = useState(false);

  // Replace image modal
  const [replaceClient, setReplaceClient] = useState<OurClient | null>(null);
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

  // Max file size 5MB
  const MAX_FILE_SIZE = 100 * 1024; // 100 KB
  const MAX_FILE_SIZE_KB = 100;

  const fetchClients = useCallback(async () => {
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

      const response = await ourClientsApi.list(params);
      if (response.success && response.data) {
        setClients(response.data);
        if (response.meta) {
          setTotalPages(response.meta.last_page);
          setTotal(response.meta.total);
        }
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    } finally {
      setLoading(false);
    }
  }, [page, search, filterStatus]);

  const fetchStats = async () => {
    try {
      const response = await ourClientsApi.getStatistics();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    fetchStats();
  }, []);

  // Validate WebP file
  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `ไฟล์มีขนาดใหญ่เกินไป (${(file.size / 1024).toFixed(1)} KB)\nขนาดสูงสุดที่รองรับคือ ${MAX_FILE_SIZE_KB} KB`;
    }
    if (!file.type.includes('webp') && !file.name.toLowerCase().endsWith('.webp')) {
      return 'รองรับเฉพาะไฟล์ WebP เท่านั้น\nกรุณาแปลงภาพเป็น WebP ก่อนอัปโหลด';
    }
    return null;
  };

  // Handle file select for upload
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const error = validateFile(file);
      if (error) {
        alert(error);
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
      const error = validateFile(file);
      if (error) {
        alert(error);
        e.target.value = '';
        return;
      }
      setReplaceFile(file);
      const reader = new FileReader();
      reader.onload = () => setReplacePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Upload new client
  const handleUpload = async () => {
    if (!uploadFile || !uploadName.trim()) {
      alert('กรุณากรอกชื่อลูกค้าและเลือกรูปภาพ');
      return;
    }

    setUploading(true);
    try {
      const response = await ourClientsApi.upload(uploadFile, {
        name: uploadName.trim(),
        alt: uploadAlt || undefined,
        description: uploadDescription || undefined,
        website_url: uploadWebsiteUrl || undefined,
        custom_filename: uploadCustomFilename || undefined,
      });

      if (response.success) {
        setShowUploadModal(false);
        resetUploadForm();
        fetchClients();
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
    setUploadName('');
    setUploadAlt('');
    setUploadDescription('');
    setUploadWebsiteUrl('');
    setUploadCustomFilename('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Open edit modal
  const openEditModal = (client: OurClient) => {
    setEditClient(client);
    setEditName(client.name || '');
    setEditAlt(client.alt || '');
    setEditDescription(client.description || '');
    setEditWebsiteUrl(client.website_url || '');
  };

  // Save edit
  const handleSaveEdit = async () => {
    if (!editClient) return;

    setSaving(true);
    try {
      const response = await ourClientsApi.update(editClient.id, {
        name: editName || undefined,
        alt: editAlt || undefined,
        description: editDescription || undefined,
        website_url: editWebsiteUrl || undefined,
      } as Partial<OurClient>);

      if (response.success) {
        setEditClient(null);
        fetchClients();
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
    if (!replaceClient || !replaceFile) return;

    setReplacing(true);
    try {
      const response = await ourClientsApi.replaceImage(replaceClient.id, replaceFile);

      if (response.success) {
        setReplaceClient(null);
        setReplaceFile(null);
        setReplacePreview('');
        if (replaceFileInputRef.current) replaceFileInputRef.current.value = '';
        fetchClients();
      }
    } catch (error) {
      console.error('Failed to replace image:', error);
      alert('เปลี่ยนรูปไม่สำเร็จ: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setReplacing(false);
    }
  };

  // Toggle status
  const handleToggleStatus = async (client: OurClient) => {
    try {
      const response = await ourClientsApi.toggleStatus(client.id);
      if (response.success) {
        fetchClients();
        fetchStats();
      }
    } catch (error) {
      console.error('Failed to toggle status:', error);
    }
  };

  // Delete client
  const handleDelete = async (client: OurClient) => {
    if (!confirm(`ยืนยันลบข้อมูลลูกค้า "${client.name}" ?`)) return;

    try {
      const response = await ourClientsApi.delete(client.id);
      if (response.success) {
        fetchClients();
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

    const draggedIndex = clients.findIndex((c) => c.id === draggedId);
    const targetIndex = clients.findIndex((c) => c.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedId(null);
      return;
    }

    // Reorder locally first
    const newClients = [...clients];
    const [removed] = newClients.splice(draggedIndex, 1);
    newClients.splice(targetIndex, 0, removed);

    const reorderedClients = newClients.map((client, index) => ({
      ...client,
      sort_order: index + 1,
    }));

    setClients(reorderedClients);
    setDraggedId(null);

    // Save to backend
    setReordering(true);
    try {
      await ourClientsApi.reorder(
        reorderedClients.map((c) => ({ id: c.id, sort_order: c.sort_order }))
      );
    } catch (error) {
      console.error('Failed to reorder:', error);
      fetchClients();
    } finally {
      setReordering(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ลูกค้าของเรา</h1>
          <p className="text-gray-600 mt-1">จัดการโลโก้/ภาพลูกค้าที่แสดงบนเว็บไซต์</p>
        </div>
        <Button onClick={() => setShowUploadModal(true)}>
          <Upload className="w-4 h-4 mr-2" />
          เพิ่มลูกค้า
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
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
                placeholder="ค้นหาชื่อลูกค้า..."
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
          <Button variant="outline" onClick={() => fetchClients()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            รีเฟรช
          </Button>
        </div>
      </Card>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-2">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 space-y-1">
            <p><strong>📐 สัดส่วนแนะนำ:</strong> 3:2 (เช่น 600x400, 900x600, 1200x800 px)</p>
            <p><strong>📁 รูปแบบไฟล์:</strong> WebP เท่านั้น (ขนาดสูงสุด 100 KB)</p>
            <p><strong>🔀 การจัดเรียง:</strong> ลากและวางเพื่อจัดลำดับการแสดงผล</p>
          </div>
        </div>
      </div>

      {/* Clients List */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">ยังไม่มีข้อมูลลูกค้า</p>
            <Button className="mt-4" onClick={() => setShowUploadModal(true)}>
              <Upload className="w-4 h-4 mr-2" />
              เพิ่มลูกค้าแรก
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
            {clients.map((client, index) => (
              <div
                key={client.id}
                draggable
                onDragStart={(e) => handleDragStart(e, client.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, client.id)}
                className={`flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors ${
                  draggedId === client.id ? 'opacity-50 bg-blue-50' : ''
                } ${!client.is_active ? 'bg-gray-50' : ''}`}
              >
                {/* Drag Handle */}
                <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
                  <GripVertical className="w-5 h-5" />
                </div>

                {/* Order Number */}
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                  {index + 1}
                </div>

                {/* Thumbnail (3:2 ratio) */}
                <div className="relative w-[120px] h-[80px] flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                  <img
                    src={client.url}
                    alt={client.alt || client.name}
                    className="w-full h-full object-contain"
                  />
                  {!client.is_active && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <EyeOff className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-900 truncate">
                      {client.name}
                    </h3>
                    {client.is_active ? (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                        เปิดใช้งาน
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                        ปิดใช้งาน
                      </span>
                    )}
                  </div>
                  {client.alt && (
                    <p className="text-sm text-gray-600 truncate">
                      <span className="text-gray-400">Alt:</span> {client.alt}
                    </p>
                  )}
                  {client.description && (
                    <p className="text-sm text-gray-500 truncate">{client.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                    <span>{client.width}x{client.height}</span>
                    <span>{(client.file_size / 1024).toFixed(1)} KB</span>
                    <span className="text-gray-300">{client.filename}</span>
                    {client.website_url && (
                      <a
                        href={client.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-500 hover:text-blue-700"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Globe className="w-3 h-3" />
                        เว็บไซต์
                      </a>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleStatus(client)}
                    className={`p-2 rounded-lg transition-colors ${
                      client.is_active
                        ? 'text-green-600 hover:bg-green-50'
                        : 'text-gray-400 hover:bg-gray-100'
                    }`}
                    title={client.is_active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                  >
                    {client.is_active ? (
                      <Eye className="w-5 h-5" />
                    ) : (
                      <EyeOff className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setReplaceClient(client);
                      setReplaceFile(null);
                      setReplacePreview('');
                    }}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="เปลี่ยนรูป"
                  >
                    <ImageIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => openEditModal(client)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="แก้ไข"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(client)}
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
            แสดง {clients.length} จาก {total} รายการ
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

      {/* ==================== Upload Modal ==================== */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">เพิ่มลูกค้าของเรา</h2>
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
                  เลือกรูปภาพ (WebP เท่านั้น, สัดส่วน 3:2) <span className="text-red-500">*</span>
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
                      if (file) {
                        const error = validateFile(file);
                        if (error) {
                          alert(error);
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
                      accept=".webp,image/webp"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        <Upload className="w-8 h-8 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-base font-medium text-gray-700">
                          ลากไฟล์มาวางที่นี่ หรือ <span className="text-blue-600">คลิกเพื่อเลือกไฟล์</span>
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          รองรับเฉพาะ WebP · สัดส่วน 3:2 · ขนาดสูงสุด {MAX_FILE_SIZE_KB} KB
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                      <div className="flex justify-center p-4 bg-gray-50">
                        <img
                          src={uploadPreview}
                          alt="Preview"
                          className="max-h-48 object-contain rounded"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setUploadFile(null);
                        setUploadPreview('');
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    {uploadFile && (
                      <p className="text-xs text-gray-500 mt-2">
                        {uploadFile.name} ({(uploadFile.size / 1024).toFixed(1)} KB)
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Client Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อลูกค้า / บริษัท <span className="text-red-500">*</span>
                </label>
                <Input
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  placeholder="เช่น Thai Airways, Bangkok Bank"
                />
              </div>

              {/* Alt Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alt Text (SEO) <span className="text-gray-400 text-xs font-normal">แนะนำเพื่อ SEO</span>
                </label>
                <Input
                  value={uploadAlt}
                  onChange={(e) => setUploadAlt(e.target.value)}
                  placeholder="เช่น โลโก้บริษัท Thai Airways"
                />
                <p className="text-xs text-gray-400 mt-1">ข้อความอธิบายรูปภาพสำหรับ Search Engine และ Screen Reader</p>
              </div>

              {/* Custom Filename */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ตั้งชื่อไฟล์ภาพ <span className="text-gray-400 text-xs font-normal">ไม่บังคับ</span>
                </label>
                <div className="flex items-center gap-1">
                  <Input
                    value={uploadCustomFilename}
                    onChange={(e) => setUploadCustomFilename(e.target.value)}
                    placeholder="เช่น thai-airways-logo"
                  />
                  <span className="text-gray-400 text-sm">.webp</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">หากไม่กรอก จะใช้ชื่อไฟล์เดิม</p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  รายละเอียด <span className="text-gray-400 text-xs font-normal">ไม่บังคับ</span>
                </label>
                <textarea
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="รายละเอียดเพิ่มเติมเกี่ยวกับลูกค้า..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={2}
                />
              </div>

              {/* Website URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  เว็บไซต์ลูกค้า <span className="text-gray-400 text-xs font-normal">ไม่บังคับ</span>
                </label>
                <Input
                  value={uploadWebsiteUrl}
                  onChange={(e) => setUploadWebsiteUrl(e.target.value)}
                  placeholder="https://www.example.com"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
              <Button
                variant="outline"
                onClick={() => {
                  setShowUploadModal(false);
                  resetUploadForm();
                }}
              >
                ยกเลิก
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!uploadFile || !uploadName.trim() || uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
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

      {/* ==================== Edit Modal ==================== */}
      {editClient && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">แก้ไขข้อมูลลูกค้า</h2>
              <button
                onClick={() => setEditClient(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Current Image */}
              <div className="flex justify-center p-4 bg-gray-50 rounded-lg">
                <img
                  src={editClient.url}
                  alt={editClient.alt || editClient.name}
                  className="max-h-40 object-contain rounded"
                />
              </div>

              {/* Client Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อลูกค้า / บริษัท <span className="text-red-500">*</span>
                </label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="ชื่อลูกค้า"
                />
              </div>

              {/* Alt Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alt Text (SEO)
                </label>
                <Input
                  value={editAlt}
                  onChange={(e) => setEditAlt(e.target.value)}
                  placeholder="ข้อความอธิบายรูปภาพ"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  รายละเอียด
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="รายละเอียดเพิ่มเติม..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={2}
                />
              </div>

              {/* Website URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  เว็บไซต์ลูกค้า
                </label>
                <Input
                  value={editWebsiteUrl}
                  onChange={(e) => setEditWebsiteUrl(e.target.value)}
                  placeholder="https://www.example.com"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
              <Button variant="outline" onClick={() => setEditClient(null)}>
                ยกเลิก
              </Button>
              <Button onClick={handleSaveEdit} disabled={saving || !editName.trim()}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
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

      {/* ==================== Replace Image Modal ==================== */}
      {replaceClient && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">เปลี่ยนรูปภาพ - {replaceClient.name}</h2>
              <button
                onClick={() => {
                  setReplaceClient(null);
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
                <div className="flex justify-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <img
                    src={replaceClient.url}
                    alt={replaceClient.alt || replaceClient.name}
                    className="max-h-32 object-contain rounded"
                  />
                </div>
              </div>

              {/* New Image Upload */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  รูปใหม่ (WebP เท่านั้น, สัดส่วน 3:2) <span className="text-red-500">*</span>
                </p>
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
                      if (file) {
                        const error = validateFile(file);
                        if (error) {
                          alert(error);
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
                      accept=".webp,image/webp"
                      onChange={handleReplaceFileSelect}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-8 h-8 text-blue-500" />
                      <p className="text-sm text-gray-600">
                        ลากไฟล์มาวางที่นี่ หรือ <span className="text-blue-600">คลิกเพื่อเลือกไฟล์</span>
                      </p>
                      <p className="text-xs text-gray-400">WebP เท่านั้น · สัดส่วน 3:2 · สูงสุด 100 KB</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="flex justify-center p-4 bg-green-50 rounded-lg border border-green-200">
                      <img src={replacePreview} alt="New" className="max-h-32 object-contain rounded" />
                    </div>
                    <button
                      onClick={() => {
                        setReplaceFile(null);
                        setReplacePreview('');
                        if (replaceFileInputRef.current) replaceFileInputRef.current.value = '';
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    {replaceFile && (
                      <p className="text-xs text-gray-500 mt-2">
                        {replaceFile.name} ({(replaceFile.size / 1024).toFixed(1)} KB)
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
              <Button
                variant="outline"
                onClick={() => {
                  setReplaceClient(null);
                  setReplaceFile(null);
                  setReplacePreview('');
                }}
              >
                ยกเลิก
              </Button>
              <Button
                onClick={handleReplaceImage}
                disabled={!replaceFile || replacing}
              >
                {replacing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    กำลังเปลี่ยนรูป...
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4 mr-2" />
                    เปลี่ยนรูป
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
