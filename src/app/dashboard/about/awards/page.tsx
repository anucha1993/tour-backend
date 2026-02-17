'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Plus, Save, Trash2, GripVertical, ChevronUp, ChevronDown, Loader2, X, Upload, Award } from 'lucide-react';
import { aboutAwardsApi, AboutAward } from '@/lib/api';

export default function AboutAwardsPage() {
  const [items, setItems] = useState<AboutAward[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formYear, setFormYear] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<number | null>(null);

  const loadItems = useCallback(async () => {
    try {
      const res = await aboutAwardsApi.list();
      const data = (res as unknown as { data: AboutAward[] })?.data;
      if (data) setItems(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadItems(); }, [loadItems]);

  const resetForm = () => {
    setFormTitle(''); setFormDescription(''); setFormYear('');
    setEditingId(null); setShowForm(false);
  };

  const handleSave = async () => {
    if (!formTitle.trim()) { alert('กรุณากรอกชื่อรางวัล'); return; }
    setSaving(true);
    try {
      if (editingId) {
        await aboutAwardsApi.update(editingId, { title: formTitle, description: formDescription, year: formYear });
      } else {
        await aboutAwardsApi.create({ title: formTitle, description: formDescription, year: formYear });
      }
      resetForm(); loadItems();
    } catch { alert('เกิดข้อผิดพลาด'); } finally { setSaving(false); }
  };

  const handleEdit = (item: AboutAward) => {
    setEditingId(item.id); setFormTitle(item.title);
    setFormDescription(item.description || ''); setFormYear(item.year || '');
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('ลบรายการนี้?')) return;
    try { await aboutAwardsApi.delete(id); loadItems(); } catch { alert('เกิดข้อผิดพลาด'); }
  };

  const handleUploadImage = async (id: number, file: File) => {
    setUploading(id);
    try { await aboutAwardsApi.uploadImage(id, file); loadItems(); } catch { alert('อัพโหลดล้มเหลว'); }
    finally { setUploading(null); }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const newItems = [...items];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newItems.length) return;
    [newItems[index], newItems[swapIndex]] = [newItems[swapIndex], newItems[index]];
    const reordered = newItems.map((item, i) => ({ id: item.id, sort_order: i + 1 }));
    setItems(newItems);
    try { await aboutAwardsApi.reorder(reordered); } catch { loadItems(); }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">รางวัลที่ได้รับ</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" /> เพิ่มรางวัล
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{editingId ? 'แก้ไข' : 'เพิ่มใหม่'}</h2>
            <button onClick={resetForm}><X className="w-5 h-5 text-gray-400" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อรางวัล *</label>
              <input type="text" value={formTitle} onChange={e => setFormTitle(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ปี</label>
              <input type="text" value={formYear} onChange={e => setFormYear(e.target.value)} className="w-full border rounded-lg px-3 py-2" placeholder="เช่น 2024" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียด</label>
            <textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} rows={3} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={resetForm} className="px-4 py-2 border rounded-lg hover:bg-gray-50">ยกเลิก</button>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editingId ? 'บันทึก' : 'เพิ่ม'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.length === 0 ? (
          <div className="col-span-full p-8 text-center text-gray-500 bg-white rounded-lg shadow">ยังไม่มีข้อมูล</div>
        ) : items.map((item, index) => (
          <div key={item.id} className="bg-white rounded-lg shadow overflow-hidden">
            {item.image_url ? (
              <div className="relative aspect-[4/3]">
                <Image src={item.image_url} alt={item.title} fill className="object-cover" />
              </div>
            ) : (
              <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center">
                <Award className="w-12 h-12 text-gray-300" />
              </div>
            )}
            <div className="p-4">
              <h3 className="font-semibold text-sm">{item.title}</h3>
              {item.year && <p className="text-xs text-gray-500 mt-1">ปี {item.year}</p>}
              <div className="flex items-center gap-2 mt-3">
                <div className="flex gap-1">
                  <button onClick={() => handleMove(index, 'up')} disabled={index === 0} className="p-1 hover:bg-gray-100 rounded disabled:opacity-20"><ChevronUp className="w-3 h-3" /></button>
                  <button onClick={() => handleMove(index, 'down')} disabled={index === items.length - 1} className="p-1 hover:bg-gray-100 rounded disabled:opacity-20"><ChevronDown className="w-3 h-3" /></button>
                </div>
                <label className="text-blue-600 hover:text-blue-700 text-xs cursor-pointer flex items-center gap-1">
                  {uploading === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                  รูป
                  <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleUploadImage(item.id, e.target.files[0])} />
                </label>
                <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-700 text-xs">แก้ไข</button>
                <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-600 ml-auto"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
