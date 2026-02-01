'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Card, Input, Select, SearchableSelect } from '@/components/ui';
import {
  ImageIcon,
  Upload,
  Search,
  Filter,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  X,
  Plus,
  Loader2,
  Tag,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import { galleryApi, countriesApi, citiesApi, GalleryImage, Country, City } from '@/lib/api';

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  
  // Filters
  const [search, setSearch] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  // Upload modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadCountry, setUploadCountry] = useState('');
  const [uploadCity, setUploadCity] = useState('');
  const [uploadTags, setUploadTags] = useState('');
  const [uploadCities, setUploadCities] = useState<City[]>([]);
  const [uploadFilename, setUploadFilename] = useState('');
  const [uploadAlt, setUploadAlt] = useState('');
  
  // Edit modal
  const [editImage, setEditImage] = useState<GalleryImage | null>(null);
  const [editAlt, setEditAlt] = useState('');
  const [editCaption, setEditCaption] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editCountry, setEditCountry] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editCities, setEditCities] = useState<City[]>([]);
  const [saving, setSaving] = useState(false);
  
  // Preview
  const [previewImage, setPreviewImage] = useState<GalleryImage | null>(null);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Statistics
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [stats, setStats] = useState<any>(null);

  const fetchImages = useCallback(async () => {
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
      
      const response = await galleryApi.list(params);
      if (response.success && response.data) {
        setImages(response.data);
        if (response.meta) {
          setTotalPages(response.meta.last_page);
          setTotal(response.meta.total);
        }
      }
    } catch (error) {
      console.error('Failed to fetch images:', error);
    } finally {
      setLoading(false);
    }
  }, [page, search, filterCountry, filterCity, filterStatus]);

  const fetchStats = async () => {
    try {
      const response = await galleryApi.getStatistics();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

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

  // Load cities when country changes (for filters)
  useEffect(() => {
    const loadCities = async () => {
      if (!filterCountry) {
        setCities([]);
        return;
      }
      try {
        const response = await citiesApi.list({ country_id: filterCountry, is_active: 'true', per_page: '100' });
        if (response.success && response.data) {
          setCities(response.data);
        }
      } catch (error) {
        console.error('Failed to load cities:', error);
      }
    };
    loadCities();
  }, [filterCountry]);

  // Load cities when upload country changes
  useEffect(() => {
    const loadCities = async () => {
      if (!uploadCountry) {
        setUploadCities([]);
        return;
      }
      try {
        const response = await citiesApi.list({ country_id: uploadCountry, is_active: 'true', per_page: '100' });
        if (response.success && response.data) {
          setUploadCities(response.data);
        }
      } catch (error) {
        console.error('Failed to load cities:', error);
      }
    };
    loadCities();
  }, [uploadCountry]);

  // Load cities when edit country changes
  useEffect(() => {
    const loadCities = async () => {
      if (!editCountry) {
        setEditCities([]);
        return;
      }
      try {
        const response = await citiesApi.list({ country_id: editCountry, is_active: 'true', per_page: '100' });
        if (response.success && response.data) {
          setEditCities(response.data);
        }
      } catch (error) {
        console.error('Failed to load cities:', error);
      }
    };
    loadCities();
  }, [editCountry]);

  // Auto-generate filename and alt
  const generateFilenameAndAlt = () => {
    const country = countries.find(c => c.id.toString() === uploadCountry);
    const city = uploadCities.find(c => c.id.toString() === uploadCity);
    const tags = uploadTags.split(',').map(t => t.trim()).filter(Boolean);
    
    // Generate filename: country-city-tag-timestamp.webp
    const parts: string[] = [];
    if (country) parts.push(country.name_en.toLowerCase().replace(/\s+/g, '-'));
    if (city) parts.push((city.name_en || '').toLowerCase().replace(/\s+/g, '-'));
    if (tags.length > 0) parts.push(tags[0].toLowerCase().replace(/\s+/g, '-'));
    parts.push(Date.now().toString().slice(-6));
    
    const filename = parts.filter(Boolean).join('-');
    setUploadFilename(filename);
    
    // Generate alt: Tag เมือง ประเทศ (Thai)
    const altParts: string[] = [];
    if (tags.length > 0) altParts.push(tags[0]);
    if (city) altParts.push(city.name_th || city.name_en);
    if (country) altParts.push(country.name_th || country.name_en);
    
    const alt = altParts.filter(Boolean).join(' ');
    setUploadAlt(alt);
  };

  const handleUpload = async () => {
    if (uploadFiles.length === 0) return;
    
    setUploading(true);
    try {
      const tags = uploadTags.split(',').map(t => t.trim()).filter(Boolean);
      
      let response;
      if (uploadFiles.length === 1) {
        response = await galleryApi.upload(uploadFiles[0], {
          alt: uploadAlt || undefined,
          country_id: uploadCountry ? parseInt(uploadCountry) : undefined,
          city_id: uploadCity ? parseInt(uploadCity) : undefined,
          tags,
          custom_filename: uploadFilename || undefined,
        });
      } else {
        response = await galleryApi.bulkUpload(uploadFiles, {
          country_id: uploadCountry ? parseInt(uploadCountry) : undefined,
          city_id: uploadCity ? parseInt(uploadCity) : undefined,
          tags,
        });
      }
      
      // Check if upload was successful
      if (!response.success) {
        throw new Error(response.message || 'Upload failed');
      }
      
      setShowUploadModal(false);
      setUploadFiles([]);
      setUploadCountry('');
      setUploadCity('');
      setUploadTags('');
      setUploadFilename('');
      setUploadAlt('');
      fetchImages();
      fetchStats();
    } catch (error) {
      console.error('Failed to upload:', error);
      alert('อัพโหลดไม่สำเร็จ: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (image: GalleryImage) => {
    setEditImage(image);
    setEditAlt(image.alt || '');
    setEditCaption(image.caption || '');
    setEditTags(image.tags?.join(', ') || '');
    setEditCountry(image.country_id?.toString() || '');
    setEditCity(image.city_id?.toString() || '');
  };

  const handleSaveEdit = async () => {
    if (!editImage) return;
    
    setSaving(true);
    try {
      const tags = editTags.split(',').map(t => t.trim()).filter(Boolean);
      await galleryApi.update(editImage.id, {
        alt: editAlt || null,
        caption: editCaption || null,
        country_id: editCountry ? parseInt(editCountry) : null,
        city_id: editCity ? parseInt(editCity) : null,
        tags,
      });
      setEditImage(null);
      fetchImages();
    } catch (error) {
      console.error('Failed to update:', error);
      alert('บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (image: GalleryImage) => {
    try {
      await galleryApi.toggleStatus(image.id);
      fetchImages();
    } catch (error) {
      console.error('Failed to toggle status:', error);
    }
  };

  const handleDelete = async (image: GalleryImage) => {
    if (!confirm(`ต้องการลบรูป "${image.filename}" หรือไม่?`)) return;
    
    try {
      const response = await galleryApi.delete(image.id);
      if (!response.success) {
        throw new Error(response.message || 'Delete failed');
      }
      fetchImages();
      fetchStats();
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('ลบไม่สำเร็จ: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' B';
    return (bytes / 1024).toFixed(1) + ' KB';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gallery รูปภาพ</h1>
          <p className="text-gray-600 mt-1">
            จัดการรูปภาพสถานที่ท่องเที่ยว ({total} รูป)
          </p>
        </div>
        <Button onClick={() => setShowUploadModal(true)}>
          <Upload className="w-4 h-4 mr-2" />
          อัพโหลดรูป
        </Button>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-500">รูปทั้งหมด</p>
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
                placeholder="ค้นหาชื่อไฟล์, alt, caption..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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
              onChange={(value) => {
                setFilterCountry(value);
                setFilterCity('');
              }}
              placeholder="เลือกประเทศ"
              searchPlaceholder="ค้นหาประเทศ..."
            />
          </div>
          <Select
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
            disabled={!filterCountry}
          >
            <option value="">ทุกเมือง</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>{c.name_th || c.name_en}</option>
            ))}
          </Select>
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">ทุกสถานะ</option>
            <option value="true">เปิดใช้งาน</option>
            <option value="false">ปิดใช้งาน</option>
          </Select>
          <Button variant="outline" onClick={() => {
            setSearch('');
            setFilterCountry('');
            setFilterCity('');
            setFilterStatus('');
            setPage(1);
          }}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      {/* Image Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : images.length === 0 ? (
        <Card className="p-12 text-center">
          <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">ยังไม่มีรูปภาพ</p>
          <Button className="mt-4" onClick={() => setShowUploadModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            อัพโหลดรูปแรก
          </Button>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {images.map((image) => (
              <Card key={image.id} className="overflow-hidden group relative">
                <div 
                  className="aspect-[3/2] bg-gray-100 cursor-pointer"
                  onClick={() => setPreviewImage(image)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.thumbnail_url || image.url}
                    alt={image.alt || image.filename}
                    className="w-full h-full object-cover"
                  />
                  {!image.is_active && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white text-sm">ปิดใช้งาน</span>
                    </div>
                  )}
                </div>
                
                {/* Overlay actions */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(image)}
                      className="p-2 bg-white rounded-full hover:bg-gray-100"
                    >
                      <Edit className="w-4 h-4 text-gray-700" />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(image)}
                      className="p-2 bg-white rounded-full hover:bg-gray-100"
                    >
                      {image.is_active ? (
                        <EyeOff className="w-4 h-4 text-gray-700" />
                      ) : (
                        <Eye className="w-4 h-4 text-green-600" />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(image);
                      }}
                      className="p-2 bg-white rounded-full hover:bg-gray-100"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
                
                {/* Info */}
                <div className="p-2">
                  <p className="text-xs text-gray-600 truncate">{image.filename}</p>
                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                    {image.country && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                        {image.country.name_th || image.country.name_en}
                      </span>
                    )}
                    {image.city && (
                      <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                        {image.city.name_th || image.city.name_en}
                      </span>
                    )}
                  </div>
                  {image.tags && image.tags.length > 0 && (
                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                      {image.tags.slice(0, 2).map((tag, i) => (
                        <span key={i} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                          #{tag}
                        </span>
                      ))}
                      {image.tags.length > 2 && (
                        <span className="text-xs text-gray-400">+{image.tags.length - 2}</span>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                ก่อนหน้า
              </Button>
              <span className="flex items-center px-4">
                หน้า {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                ถัดไป
              </Button>
            </div>
          )}
        </>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">อัพโหลดรูปภาพ</h2>
              <button onClick={() => setShowUploadModal(false)}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* File input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  เลือกรูป (รองรับ JPG, PNG, GIF, WebP - จะแปลงเป็น WebP อัตโนมัติ)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/bmp"
                  multiple
                  onChange={(e) => setUploadFiles(Array.from(e.target.files || []))}
                  className="w-full border rounded-lg p-2"
                />
                {uploadFiles.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 mb-2">
                      เลือก {uploadFiles.length} ไฟล์
                    </p>
                    <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                      {uploadFiles.map((file, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="w-full h-20 object-cover rounded border"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setUploadFiles(uploadFiles.filter((_, i) => i !== idx));
                            }}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                          <p className="text-xs text-gray-500 truncate mt-1">{file.name}</p>
                        </div>
                      ))}
                    </div>
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
                  value={uploadCountry}
                  onChange={(value) => {
                    setUploadCountry(value);
                    setUploadCity('');
                  }}
                  placeholder="-- เลือกประเทศ --"
                  searchPlaceholder="ค้นหาประเทศ..."
                />
              </div>
              
              {/* City */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">เมือง</label>
                <SearchableSelect
                  options={uploadCities.map((c) => ({
                    value: c.id.toString(),
                    label: c.name_th || c.name_en,
                  }))}
                  value={uploadCity}
                  onChange={setUploadCity}
                  placeholder="-- เลือกเมือง --"
                  searchPlaceholder="ค้นหาเมือง..."
                  disabled={!uploadCountry}
                />
              </div>
              
              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (คั่นด้วย ,)
                </label>
                <Input
                  placeholder="ซากุระ, ฟูจิ, วัด"
                  value={uploadTags}
                  onChange={(e) => setUploadTags(e.target.value)}
                />
              </div>

              {/* Auto-generate button */}
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateFilenameAndAlt}
                  disabled={!uploadCountry && !uploadCity && !uploadTags}
                >
                  ✨ สร้างชื่อไฟล์ & Alt อัตโนมัติ
                </Button>
              </div>

              {/* Filename */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อไฟล์ (ไม่ต้องใส่ .webp)
                </label>
                <Input
                  placeholder="japan-tokyo-sensoji"
                  value={uploadFilename}
                  onChange={(e) => setUploadFilename(e.target.value)}
                />
                {uploadFilename && (
                  <p className="text-xs text-gray-500 mt-1">
                    จะบันทึกเป็น: <span className="font-mono text-blue-600">{uploadFilename}.webp</span>
                  </p>
                )}
              </div>

              {/* Alt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alt Text (SEO)
                </label>
                <Input
                  placeholder="วัดเซนโซจิ โตเกียว ญี่ปุ่น"
                  value={uploadAlt}
                  onChange={(e) => setUploadAlt(e.target.value)}
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowUploadModal(false)}
                >
                  ยกเลิก
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleUpload}
                  disabled={uploadFiles.length === 0 || uploading}
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
          </Card>
        </div>
      )}

      {/* Edit Modal */}
      {editImage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">แก้ไขรูปภาพ</h2>
              <button onClick={() => setEditImage(null)}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Preview */}
              <div className="aspect-[3/2] bg-gray-100 rounded-lg overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={editImage.url}
                  alt={editImage.alt || ''}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="text-sm text-gray-500">
                {editImage.filename} • {editImage.width}x{editImage.height} • {formatFileSize(editImage.file_size)}
              </div>
              
              {/* Alt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alt Text</label>
                <Input
                  value={editAlt}
                  onChange={(e) => setEditAlt(e.target.value)}
                  placeholder="คำอธิบายรูปสำหรับ SEO"
                />
              </div>
              
              {/* Caption */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Caption</label>
                <Input
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  placeholder="คำบรรยายรูป"
                />
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
                  onChange={(value) => {
                    setEditCountry(value);
                    setEditCity('');
                  }}
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
                <Input
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  placeholder="ซากุระ, ฟูจิ, วัด"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setEditImage(null)}
                >
                  ยกเลิก
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSaveEdit}
                  disabled={saving}
                >
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
          </Card>
        </div>
      )}

      {/* Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <button 
            className="absolute top-4 right-4 text-white"
            onClick={() => setPreviewImage(null)}
          >
            <X className="w-8 h-8" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewImage.url}
            alt={previewImage.alt || ''}
            className="max-w-full max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-lg">
            <p className="font-medium">{previewImage.alt || previewImage.filename}</p>
            {previewImage.caption && <p className="text-sm text-gray-300">{previewImage.caption}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
