'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Plus, Save, Trash2, GripVertical, ChevronUp, ChevronDown, Loader2, X, Upload } from 'lucide-react';
import { aboutAssociationsApi, AboutAssociation } from '@/lib/api';

export default function AboutAssociationsPage() {
  const [items, setItems] = useState<AboutAssociation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formName, setFormName] = useState('');
  const [formLicenseNo, setFormLicenseNo] = useState('');
  const [formWebsite, setFormWebsite] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<number | null>(null);

  const loadItems = useCallback(async () => {
    try {
      const res = await aboutAssociationsApi.list();
      const data = (res as unknown as { data: AboutAssociation[] })?.data;
      if (data) setItems(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadItems(); }, [loadItems]);

  const resetForm = () => {
    setFormName(''); setFormLicenseNo(''); setFormWebsite('');
    setEditingId(null); setShowForm(false);
  };

  const handleSave = async () => {
    if (!formName.trim()) { alert('กรุณากรอกชื่อสมาคม'); return; }
    setSaving(true);
    try {
      if (editingId) {
        await aboutAssociationsApi.update(editingId, { name: formName, license_no: formLicenseNo, website_url: formWebsite });
      } else {
        await aboutAssociationsApi.create({ name: formName, license_no: formLicenseNo, website_url: formWebsite });
      }
      resetForm(); loadItems();
    } catch { alert('เกิดข้อผิดพลาด'); } finally { setSaving(false); }
  };

  const handleEdit = (item: AboutAssociation) => {
    setEditingId(item.id); setFormName(item.name);
    setFormLicenseNo(item.license_no || ''); setFormWebsite(item.website_url || '');
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('ลบรายการนี้?')) return;
    try { await aboutAssociationsApi.delete(id); loadItems(); } catch { alert('เกิดข้อผิดพลาด'); }
  };

  const handleUploadLogo = async (id: number, file: File) => {
    setUploading(id);
    try { await aboutAssociationsApi.uploadLogo(id, file); loadItems(); } catch { alert('อัพโหลดล้มเหลว'); }
    finally { setUploading(null); }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const newItems = [...items];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newItems.length) return;
    [newItems[index], newItems[swapIndex]] = [newItems[swapIndex], newItems[index]];
    const reordered = newItems.map((item, i) => ({ id: item.id, sort_order: i + 1 }));
    setItems(newItems);
    try { await aboutAssociationsApi.reorder(reordered); } catch { loadItems(); }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">สมาคมที่เข้าร่วม</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" /> เพิ่มสมาคม
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{editingId ? 'แก้ไข' : 'เพิ่มใหม่'}</h2>
            <button onClick={resetForm}><X className="w-5 h-5 text-gray-400" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อสมาคม *</label>
              <input type="text" value={formName} onChange={e => setFormName(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">เลขที่ใบอนุญาต</label>
              <input type="text" value={formLicenseNo} onChange={e => setFormLicenseNo(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="เช่น No.04896" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">เว็บไซต์</label>
              <input type="text" value={formWebsite} onChange={e => setFormWebsite(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="https://..." />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={resetForm} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">ยกเลิก</button>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editingId ? 'บันทึก' : 'เพิ่ม'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow divide-y">
        {items.length === 0 ? (
          <div className="p-8 text-center text-gray-500">ยังไม่มีข้อมูล</div>
        ) : items.map((item, index) => (
          <div key={item.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 border border-gray-300">
            <GripVertical className="w-5 h-5 text-gray-300 flex-shrink-0" />
            <div className="flex flex-col gap-1">
              <button onClick={() => handleMove(index, 'up')} disabled={index === 0} className="p-0.5 hover:bg-gray-200 rounded disabled:opacity-20"><ChevronUp className="w-3 h-3" /></button>
              <button onClick={() => handleMove(index, 'down')} disabled={index === items.length - 1} className="p-0.5 hover:bg-gray-200 rounded disabled:opacity-20"><ChevronDown className="w-3 h-3" /></button>
            </div>
            {item.logo_url ? (
              <Image src={item.logo_url} alt={item.name} width={80} height={50} className="rounded object-contain bg-white" />
            ) : (
              <div className="w-[80px] h-[50px] bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400">No Logo</div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold">{item.name}</h3>
              {item.license_no && <p className="text-sm text-gray-500">{item.license_no}</p>}
            </div>
            <div className="flex items-center gap-2">
              <label className="text-blue-600 hover:text-blue-700 text-sm cursor-pointer flex items-center gap-1">
                {uploading === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                โลโก้
                <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleUploadLogo(item.id, e.target.files[0])} />
              </label>
              <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-700 text-sm">แก้ไข</button>
              <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
