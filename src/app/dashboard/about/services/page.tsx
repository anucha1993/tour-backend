'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Save, Trash2, GripVertical, ChevronUp, ChevronDown, Loader2, X } from 'lucide-react';
import { aboutServicesApi, AboutService } from '@/lib/api';
import IconPicker, { RenderIcon } from '@/components/ui/IconPicker';

export default function AboutServicesPage() {
  const [items, setItems] = useState<AboutService[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIcon, setFormIcon] = useState('');
  const [saving, setSaving] = useState(false);

  const loadItems = useCallback(async () => {
    try {
      const res = await aboutServicesApi.list();
      const data = (res as unknown as { data: AboutService[] })?.data;
      if (data) setItems(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadItems(); }, [loadItems]);

  const resetForm = () => {
    setFormTitle('');
    setFormDescription('');
    setFormIcon('');
    setEditingId(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!formTitle.trim()) { alert('กรุณากรอกชื่อบริการ'); return; }
    setSaving(true);
    try {
      if (editingId) {
        await aboutServicesApi.update(editingId, { title: formTitle, description: formDescription, icon: formIcon });
      } else {
        await aboutServicesApi.create({ title: formTitle, description: formDescription, icon: formIcon });
      }
      resetForm();
      loadItems();
    } catch { alert('เกิดข้อผิดพลาด'); }
    finally { setSaving(false); }
  };

  const handleEdit = (item: AboutService) => {
    setEditingId(item.id);
    setFormTitle(item.title);
    setFormDescription(item.description || '');
    setFormIcon(item.icon || '');
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('ลบรายการนี้?')) return;
    try {
      await aboutServicesApi.delete(id);
      loadItems();
    } catch { alert('เกิดข้อผิดพลาด'); }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const newItems = [...items];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newItems.length) return;
    [newItems[index], newItems[swapIndex]] = [newItems[swapIndex], newItems[index]];
    const reordered = newItems.map((item, i) => ({ id: item.id, sort_order: i + 1 }));
    setItems(newItems);
    try { await aboutServicesApi.reorder(reordered); } catch { loadItems(); }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">บริการหลักของเรา</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" /> เพิ่มบริการ
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{editingId ? 'แก้ไขบริการ' : 'เพิ่มบริการใหม่'}</h2>
            <button onClick={resetForm}><X className="w-5 h-5 text-gray-400" /></button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อบริการ *</label>
              <input type="text" value={formTitle} onChange={e => setFormTitle(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ไอคอน</label>
              <IconPicker value={formIcon} onChange={setFormIcon} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียด</label>
            <textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
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

      {/* Items List */}
      <div className="bg-white rounded-lg shadow divide-y">
        {items.length === 0 ? (
          <div className="p-8 text-center text-gray-500">ยังไม่มีบริการ</div>
        ) : items.map((item, index) => (
          <div key={item.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 border border-gray-300">
            <GripVertical className="w-5 h-5 text-gray-300 flex-shrink-0" />
            <div className="flex flex-col gap-1">
              <button onClick={() => handleMove(index, 'up')} disabled={index === 0} className="p-0.5 hover:bg-gray-200 rounded disabled:opacity-20"><ChevronUp className="w-3 h-3" /></button>
              <button onClick={() => handleMove(index, 'down')} disabled={index === items.length - 1} className="p-0.5 hover:bg-gray-200 rounded disabled:opacity-20"><ChevronDown className="w-3 h-3" /></button>
            </div>
            {item.icon && <RenderIcon name={item.icon} className="w-6 h-6 text-orange-500" />}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold">{item.title}</h3>
              {item.description && <p className="text-sm text-gray-500 truncate">{item.description}</p>}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-700 text-sm">แก้ไข</button>
              <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
