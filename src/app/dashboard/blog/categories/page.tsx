'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown, Pencil, FolderOpen } from 'lucide-react';
import { blogCategoriesApi, BlogCategory } from '@/lib/api';

export default function BlogCategoriesPage() {
  const [items, setItems] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<BlogCategory | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', description: '', icon: '', sort_order: 0, is_active: true });
  const [reordering, setReordering] = useState(false);

  const fetch_ = useCallback(async () => {
    const res = await blogCategoriesApi.list();
    const d = ((res as unknown) as { data: BlogCategory[] })?.data;
    if (d) setItems(d);
    setLoading(false);
  }, []);
  useEffect(() => { fetch_(); }, [fetch_]);

  const submit = async () => {
    try {
      if (editItem) await blogCategoriesApi.update(editItem.id, form);
      else await blogCategoriesApi.create(form);
      setShowForm(false); setEditItem(null); resetForm();
      fetch_();
    } catch { alert('เกิดข้อผิดพลาด'); }
  };

  const del = async (id: number) => { if (!confirm('ยืนยันลบหมวดหมู่นี้?')) return; await blogCategoriesApi.delete(id); fetch_(); };

  const resetForm = () => setForm({ name: '', slug: '', description: '', icon: '', sort_order: 0, is_active: true });

  const moveItem = async (index: number, direction: 'up' | 'down') => {
    const newItems = [...items];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newItems.length) return;
    [newItems[index], newItems[swapIndex]] = [newItems[swapIndex], newItems[index]];
    const reorderData = newItems.map((it, i) => ({ id: it.id, sort_order: i }));
    setItems(newItems);
    setReordering(true);
    try { await blogCategoriesApi.reorder(reorderData); } catch { alert('เรียงลำดับไม่สำเร็จ'); fetch_(); }
    setReordering(false);
  };

  if (loading) return (
    <div className="space-y-6">
      <div className="flex items-center gap-3"><FolderOpen className="w-7 h-7 text-blue-600" /><h1 className="text-2xl font-bold text-gray-900">หมวดหมู่บทความ</h1></div>
      <div className="animate-pulse space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <FolderOpen className="w-7 h-7 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">หมวดหมู่บทความ</h1>
            <p className="text-gray-500 text-sm">{items.length} หมวดหมู่</p>
          </div>
        </div>
        <button onClick={() => { setShowForm(true); setEditItem(null); resetForm(); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700">
          <Plus className="w-4 h-4" />เพิ่มหมวดหมู่
        </button>
      </div>

      {showForm && (
        <div className="bg-white border-1 border-solid border-gray-200 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-lg">{editItem ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่ใหม่'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อหมวดหมู่ *</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="เช่น เคล็ดลับเที่ยว" className="w-full px-3 py-2 border-1 border-solid border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL)</label>
              <input type="text" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="auto-generate ถ้าไม่กรอก" className="w-full px-3 py-2 border-1 border-solid border-gray-300 rounded-lg" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">คำอธิบาย</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} placeholder="คำอธิบายหมวดหมู่" className="w-full px-3 py-2 border-1 border-solid border-gray-300 rounded-lg" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="cat_active" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="rounded" />
              <label htmlFor="cat_active" className="text-sm text-gray-700">เปิดใช้งาน</label>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={submit} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">บันทึก</button>
            <button onClick={() => { setShowForm(false); setEditItem(null); }} className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">ยกเลิก</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={item.id} className="bg-white border-1 border-solid border-gray-200 rounded-xl flex items-center">
            {/* Move buttons */}
            <div className="flex flex-col justify-center gap-0.5 px-2 bg-gray-50 rounded-l-xl self-stretch border-r border-solid border-gray-200">
              <button onClick={() => moveItem(index, 'up')} disabled={index === 0 || reordering} className="p-0.5 rounded hover:bg-gray-200 disabled:opacity-30"><ChevronUp className="w-4 h-4 text-gray-500" /></button>
              <span className="text-[10px] text-gray-400 text-center">{index + 1}</span>
              <button onClick={() => moveItem(index, 'down')} disabled={index === items.length - 1 || reordering} className="p-0.5 rounded hover:bg-gray-200 disabled:opacity-30"><ChevronDown className="w-4 h-4 text-gray-500" /></button>
            </div>
            {/* Info */}
            <div className="flex-1 px-4 py-3">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-gray-900">{item.name}</h4>
                <span className="text-xs text-gray-400">/{item.slug}</span>
                {!item.is_active && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">ปิดอยู่</span>}
              </div>
              {item.description && <p className="text-sm text-gray-500 mt-0.5">{item.description}</p>}
              <span className="text-xs text-gray-400">{item.posts_count ?? 0} บทความ</span>
            </div>
            {/* Actions */}
            <div className="flex gap-1 px-3">
              <button onClick={() => { setEditItem(item); setForm({ name: item.name, slug: item.slug, description: item.description || '', icon: item.icon || '', sort_order: item.sort_order, is_active: item.is_active }); setShowForm(true); }}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => del(item.id)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-center py-12 text-gray-500"><FolderOpen className="w-12 h-12 mx-auto mb-2 text-gray-300" /><p>ยังไม่มีหมวดหมู่</p></div>
        )}
      </div>
    </div>
  );
}
