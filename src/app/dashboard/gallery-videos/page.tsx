'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Card, Input, Select, SearchableSelect } from '@/components/ui';
import {
  Video,
  Search,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  X,
  Plus,
  Loader2,
  MapPin,
  RefreshCw,
  ExternalLink,
  Play,
  Image as ImageIcon,
} from 'lucide-react';
import { galleryVideoApi, countriesApi, citiesApi, GalleryVideo, Country, City } from '@/lib/api';

// ─── Helpers ───

/** Extract YouTube video ID from URL */
function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}

/** Get auto-generated YouTube thumbnail from URL */
function getYouTubeThumbnail(url: string): string | null {
  const id = getYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}

export default function VideoGalleryPage() {
  const [videos, setVideos] = useState<GalleryVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);

  // Filters
  const [search, setSearch] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Add modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addVideoUrl, setAddVideoUrl] = useState('');
  const [addTitle, setAddTitle] = useState('');
  const [addDescription, setAddDescription] = useState('');
  const [addThumbnail, setAddThumbnail] = useState<File | null>(null);
  const [addCountry, setAddCountry] = useState('');
  const [addCity, setAddCity] = useState('');
  const [addTags, setAddTags] = useState('');
  const [addCities, setAddCities] = useState<City[]>([]);
  const [saving, setSaving] = useState(false);

  // Edit modal
  const [editVideo, setEditVideo] = useState<GalleryVideo | null>(null);
  const [editVideoUrl, setEditVideoUrl] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editThumbnail, setEditThumbnail] = useState<File | null>(null);
  const [editCountry, setEditCountry] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editCities, setEditCities] = useState<City[]>([]);
  const [editSaving, setEditSaving] = useState(false);

  // Preview
  const [previewVideo, setPreviewVideo] = useState<GalleryVideo | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Statistics
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [stats, setStats] = useState<any>(null);

  // ─── Data Fetching ───

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: page.toString(),
        per_page: '20',
      };
      if (search) params.search = search;
      if (filterCountry) params.country_id = filterCountry;
      if (filterCity) params.city_id = filterCity;
      if (filterStatus) params.is_active = filterStatus;

      const response = await galleryVideoApi.list(params);
      if (response.success && response.data) {
        setVideos(response.data);
        if (response.meta) {
          setTotalPages(response.meta.last_page);
          setTotal(response.meta.total);
        }
      }
    } catch (error) {
      console.error('Failed to fetch videos:', error);
    } finally {
      setLoading(false);
    }
  }, [page, search, filterCountry, filterCity, filterStatus]);

  const fetchStats = async () => {
    try {
      const response = await galleryVideoApi.getStatistics();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [countriesRes] = await Promise.all([
          countriesApi.list({ is_active: 'true', per_page: '250' }),
        ]);
        if (countriesRes.success && countriesRes.data) {
          setCountries(countriesRes.data);
        }
        fetchStats();
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };
    loadData();
  }, []);

  // City loading for filters
  useEffect(() => {
    const loadCities = async () => {
      if (!filterCountry) { setCities([]); return; }
      try {
        const res = await citiesApi.list({ country_id: filterCountry, is_active: 'true', per_page: '100' });
        if (res.success && res.data) setCities(res.data);
      } catch (e) { console.error(e); }
    };
    loadCities();
  }, [filterCountry]);

  // City loading for add modal
  useEffect(() => {
    const loadCities = async () => {
      if (!addCountry) { setAddCities([]); return; }
      try {
        const res = await citiesApi.list({ country_id: addCountry, is_active: 'true', per_page: '100' });
        if (res.success && res.data) setAddCities(res.data);
      } catch (e) { console.error(e); }
    };
    loadCities();
  }, [addCountry]);

  // City loading for edit modal
  useEffect(() => {
    const loadCities = async () => {
      if (!editCountry) { setEditCities([]); return; }
      try {
        const res = await citiesApi.list({ country_id: editCountry, is_active: 'true', per_page: '100' });
        if (res.success && res.data) setEditCities(res.data);
      } catch (e) { console.error(e); }
    };
    loadCities();
  }, [editCountry]);

  // ─── Handlers ───

  const resetAddForm = () => {
    setAddVideoUrl('');
    setAddTitle('');
    setAddDescription('');
    setAddThumbnail(null);
    setAddCountry('');
    setAddCity('');
    setAddTags('');
  };

  const handleAdd = async () => {
    if (!addVideoUrl || !addTitle) return;
    setSaving(true);
    try {
      const tags = addTags.split(',').map(t => t.trim()).filter(Boolean);
      const response = await galleryVideoApi.create({
        video_url: addVideoUrl,
        title: addTitle,
        description: addDescription || undefined,
        thumbnail: addThumbnail || undefined,
        country_id: addCountry ? parseInt(addCountry) : undefined,
        city_id: addCity ? parseInt(addCity) : undefined,
        tags: tags.length > 0 ? tags : undefined,
      });

      if (!response.success) {
        throw new Error(response.message || 'Create failed');
      }

      setShowAddModal(false);
      resetAddForm();
      fetchVideos();
      fetchStats();
    } catch (error) {
      console.error('Failed to add video:', error);
      alert('เพิ่มวิดีโอไม่สำเร็จ: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (video: GalleryVideo) => {
    setEditVideo(video);
    setEditVideoUrl(video.video_url);
    setEditTitle(video.title);
    setEditDescription(video.description || '');
    setEditThumbnail(null);
    setEditCountry(video.country_id?.toString() || '');
    setEditCity(video.city_id?.toString() || '');
    setEditTags(video.tags?.join(', ') || '');
  };

  const handleSaveEdit = async () => {
    if (!editVideo) return;
    setEditSaving(true);
    try {
      const tags = editTags.split(',').map(t => t.trim()).filter(Boolean);
      const response = await galleryVideoApi.update(editVideo.id, {
        video_url: editVideoUrl,
        title: editTitle,
        description: editDescription || null,
        thumbnail: editThumbnail || undefined,
        country_id: editCountry ? parseInt(editCountry) : null,
        city_id: editCity ? parseInt(editCity) : null,
        tags,
      });

      if (!response.success) {
        throw new Error(response.message || 'Update failed');
      }

      setEditVideo(null);
      fetchVideos();
    } catch (error) {
      console.error('Failed to update:', error);
      alert('บันทึกไม่สำเร็จ: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setEditSaving(false);
    }
  };

  const handleToggleStatus = async (video: GalleryVideo) => {
    try {
      await galleryVideoApi.toggleStatus(video.id);
      fetchVideos();
    } catch (error) {
      console.error('Failed to toggle status:', error);
    }
  };

  const handleDelete = async (video: GalleryVideo) => {
    if (!confirm(`ต้องการลบวิดีโอ "${video.title}" หรือไม่?`)) return;
    try {
      const response = await galleryVideoApi.delete(video.id);
      if (!response.success) {
        throw new Error(response.message || 'Delete failed');
      }
      fetchVideos();
      fetchStats();
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('ลบไม่สำเร็จ: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  /** Get the best thumbnail to display */
  const getThumbnail = (video: GalleryVideo): string | null => {
    if (video.thumbnail_url) return video.thumbnail_url;
    return getYouTubeThumbnail(video.video_url);
  };

  /** Build embeddable URL (YouTube/Vimeo support) */
  const getEmbedUrl = (url: string): string | null => {
    const ytId = getYouTubeId(url);
    if (ytId) return `https://www.youtube.com/embed/${ytId}`;

    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

    return null;
  };

  // ─── Render ───

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gallery วิดีโอ</h1>
          <p className="text-gray-600 mt-1">จัดการวิดีโอสถานที่ท่องเที่ยว ({total} วิดีโอ)</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          เพิ่มวิดีโอ
        </Button>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Video className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-500">วิดีโอทั้งหมด</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                <p className="text-sm text-gray-500">เปิดใช้งาน</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <EyeOff className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.inactive}</p>
                <p className="text-sm text-gray-500">ปิดใช้งาน</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.by_country?.length || 0}</p>
                <p className="text-sm text-gray-500">ประเทศ</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="ค้นหาชื่อ, คำอธิบาย, URL..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-10"
              />
            </div>
          </div>
          <div className="w-[200px]">
            <SearchableSelect
              options={[
                { value: '', label: 'ทุกประเทศ' },
                ...countries.map((c) => ({
                  value: c.id.toString(),
                  label: c.name_th || c.name_en,
                  sublabel: c.iso2,
                })),
              ]}
              value={filterCountry}
              onChange={(v) => { setFilterCountry(v); setFilterCity(''); setPage(1); }}
              placeholder="เลือกประเทศ"
              searchPlaceholder="ค้นหาประเทศ..."
            />
          </div>
          <Select
            value={filterCity}
            onChange={(e) => { setFilterCity(e.target.value); setPage(1); }}
            disabled={!filterCountry}
          >
            <option value="">ทุกเมือง</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>{c.name_th || c.name_en}</option>
            ))}
          </Select>
          <Select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          >
            <option value="">ทุกสถานะ</option>
            <option value="true">เปิดใช้งาน</option>
            <option value="false">ปิดใช้งาน</option>
          </Select>
          <Button variant="outline" onClick={() => { setSearch(''); setFilterCountry(''); setFilterCity(''); setFilterStatus(''); setPage(1); }}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      {/* Video Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : videos.length === 0 ? (
        <Card className="p-12 text-center">
          <Video className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">ยังไม่มีวิดีโอ</p>
          <Button className="mt-4" onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            เพิ่มวิดีโอแรก
          </Button>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {videos.map((video) => {
              const thumb = getThumbnail(video);
              return (
                <Card key={video.id} className="overflow-hidden group relative">
                  {/* Thumbnail */}
                  <div
                    className="aspect-video bg-gray-100 cursor-pointer relative"
                    onClick={() => setPreviewVideo(video)}
                  >
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumb}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <Video className="w-10 h-10" />
                      </div>
                    )}

                    {/* Play button overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-12 h-12 bg-black/60 rounded-full flex items-center justify-center">
                        <Play className="w-5 h-5 text-white ml-0.5" />
                      </div>
                    </div>

                    {!video.is_active && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white text-sm">ปิดใช้งาน</span>
                      </div>
                    )}
                  </div>

                  {/* Hover actions */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(video)} className="p-2 bg-white rounded-full hover:bg-gray-100">
                        <Edit className="w-4 h-4 text-gray-700" />
                      </button>
                      <button onClick={() => handleToggleStatus(video)} className="p-2 bg-white rounded-full hover:bg-gray-100">
                        {video.is_active ? <EyeOff className="w-4 h-4 text-gray-700" /> : <Eye className="w-4 h-4 text-green-600" />}
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(video); }} className="p-2 bg-white rounded-full hover:bg-gray-100">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-2">
                    <p className="text-sm font-medium text-gray-800 truncate">{video.title}</p>
                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                      {video.country && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                          {video.country.name_th || video.country.name_en}
                        </span>
                      )}
                      {video.city && (
                        <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                          {video.city.name_th || video.city.name_en}
                        </span>
                      )}
                    </div>
                    {video.tags && video.tags.length > 0 && (
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        {video.tags.slice(0, 2).map((tag, i) => (
                          <span key={i} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">#{tag}</span>
                        ))}
                        {video.tags.length > 2 && (
                          <span className="text-xs text-gray-400">+{video.tags.length - 2}</span>
                        )}
                      </div>
                    )}
                    <a
                      href={video.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 mt-1 text-xs text-blue-500 hover:underline truncate"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{video.video_url}</span>
                    </a>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                ก่อนหน้า
              </Button>
              <span className="flex items-center px-4">หน้า {page} / {totalPages}</span>
              <Button variant="outline" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                ถัดไป
              </Button>
            </div>
          )}
        </>
      )}

      {/* ════ Add Modal ════ */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">เพิ่มวิดีโอ</h2>
              <button onClick={() => { setShowAddModal(false); resetAddForm(); }}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Video URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL วิดีโอ *</label>
                <Input
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={addVideoUrl}
                  onChange={(e) => setAddVideoUrl(e.target.value)}
                />
                {addVideoUrl && getYouTubeThumbnail(addVideoUrl) && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1">YouTube Preview:</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getYouTubeThumbnail(addVideoUrl)!}
                      alt="YouTube thumbnail"
                      className="w-48 h-auto rounded border"
                    />
                  </div>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อวิดีโอ *</label>
                <Input
                  placeholder="ทัวร์ญี่ปุ่น โตเกียว ซากุระบาน"
                  value={addTitle}
                  onChange={(e) => setAddTitle(e.target.value)}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">คำอธิบาย</label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="รายละเอียดวิดีโอ..."
                  value={addDescription}
                  onChange={(e) => setAddDescription(e.target.value)}
                />
              </div>

              {/* Thumbnail upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <ImageIcon className="w-4 h-4 inline mr-1" />
                  ภาพปก (ถ้าไม่อัพโหลดจะใช้ภาพจาก YouTube อัตโนมัติ)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={(e) => setAddThumbnail(e.target.files?.[0] || null)}
                  className="w-full border rounded-lg p-2 text-sm"
                />
                {addThumbnail && (
                  <div className="mt-2 flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={URL.createObjectURL(addThumbnail)}
                      alt="thumbnail preview"
                      className="w-24 h-auto rounded border"
                    />
                    <button onClick={() => setAddThumbnail(null)} className="text-xs text-red-500 hover:underline">ลบ</button>
                  </div>
                )}
              </div>

              {/* Country */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ประเทศ</label>
                <SearchableSelect
                  options={countries.map((c) => ({
                    value: c.id.toString(),
                    label: c.name_th || c.name_en,
                    sublabel: c.iso2,
                  }))}
                  value={addCountry}
                  onChange={(v) => { setAddCountry(v); setAddCity(''); }}
                  placeholder="-- เลือกประเทศ --"
                  searchPlaceholder="ค้นหาประเทศ..."
                />
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">เมือง</label>
                <SearchableSelect
                  options={addCities.map((c) => ({
                    value: c.id.toString(),
                    label: c.name_th || c.name_en,
                  }))}
                  value={addCity}
                  onChange={setAddCity}
                  placeholder="-- เลือกเมือง --"
                  searchPlaceholder="ค้นหาเมือง..."
                  disabled={!addCountry}
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags (คั่นด้วย ,)</label>
                <Input
                  placeholder="ซากุระ, ฟูจิ, วัด"
                  value={addTags}
                  onChange={(e) => setAddTags(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => { setShowAddModal(false); resetAddForm(); }}>
                  ยกเลิก
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleAdd}
                  disabled={!addVideoUrl || !addTitle || saving}
                >
                  {saving ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" />กำลังบันทึก...</>
                  ) : (
                    <><Plus className="w-4 h-4 mr-2" />เพิ่มวิดีโอ</>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ════ Edit Modal ════ */}
      {editVideo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">แก้ไขวิดีโอ</h2>
              <button onClick={() => setEditVideo(null)}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Current thumbnail */}
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden relative">
                {getThumbnail(editVideo) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={getThumbnail(editVideo)!} alt={editVideo.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <Video className="w-10 h-10" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-12 h-12 bg-black/60 rounded-full flex items-center justify-center">
                    <Play className="w-5 h-5 text-white ml-0.5" />
                  </div>
                </div>
              </div>

              {/* Video URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL วิดีโอ</label>
                <Input value={editVideoUrl} onChange={(e) => setEditVideoUrl(e.target.value)} />
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อวิดีโอ</label>
                <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">คำอธิบาย</label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              </div>

              {/* Replace thumbnail */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <ImageIcon className="w-4 h-4 inline mr-1" />
                  เปลี่ยนภาพปก
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={(e) => setEditThumbnail(e.target.files?.[0] || null)}
                  className="w-full border rounded-lg p-2 text-sm"
                />
                {editThumbnail && (
                  <div className="mt-2 flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={URL.createObjectURL(editThumbnail)} alt="preview" className="w-24 h-auto rounded border" />
                    <button onClick={() => setEditThumbnail(null)} className="text-xs text-red-500 hover:underline">ลบ</button>
                  </div>
                )}
              </div>

              {/* Country */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ประเทศ</label>
                <SearchableSelect
                  options={countries.map((c) => ({
                    value: c.id.toString(),
                    label: c.name_th || c.name_en,
                    sublabel: c.iso2,
                  }))}
                  value={editCountry}
                  onChange={(v) => { setEditCountry(v); setEditCity(''); }}
                  placeholder="-- เลือกประเทศ --"
                  searchPlaceholder="ค้นหาประเทศ..."
                />
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">เมือง</label>
                <SearchableSelect
                  options={editCities.map((c) => ({
                    value: c.id.toString(),
                    label: c.name_th || c.name_en,
                  }))}
                  value={editCity}
                  onChange={setEditCity}
                  placeholder="-- เลือกเมือง --"
                  searchPlaceholder="ค้นหาเมือง..."
                  disabled={!editCountry}
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <Input value={editTags} onChange={(e) => setEditTags(e.target.value)} placeholder="ซากุระ, ฟูจิ, วัด" />
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setEditVideo(null)}>
                  ยกเลิก
                </Button>
                <Button className="flex-1" onClick={handleSaveEdit} disabled={editSaving}>
                  {editSaving ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" />กำลังบันทึก...</>
                  ) : (
                    'บันทึก'
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ════ Preview Modal ════ */}
      {previewVideo && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewVideo(null)}
        >
          <button className="absolute top-4 right-4 text-white z-10" onClick={() => setPreviewVideo(null)}>
            <X className="w-8 h-8" />
          </button>
          <div className="w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            {getEmbedUrl(previewVideo.video_url) ? (
              <div className="aspect-video">
                <iframe
                  src={getEmbedUrl(previewVideo.video_url)!}
                  className="w-full h-full rounded-lg"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="text-center py-12">
                <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-white mb-4">ไม่สามารถแสดงวิดีโอแบบ embed ได้</p>
                <a
                  href={previewVideo.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  <ExternalLink className="w-4 h-4" />
                  เปิดในแท็บใหม่
                </a>
              </div>
            )}
            <div className="mt-4 text-center">
              <p className="text-white font-medium">{previewVideo.title}</p>
              {previewVideo.description && <p className="text-sm text-gray-300 mt-1">{previewVideo.description}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
