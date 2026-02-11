'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Card, Input } from '@/components/ui';
import {
  Menu,
  Plus,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  X,
  GripVertical,
  Loader2,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Link2,
} from 'lucide-react';
import { menusApi, MenuItem } from '@/lib/api';

const LOCATION_LABELS: Record<string, string> = {
  header: 'เมนู Header',
  footer_col1: 'Footer คอลัมน์ 1',
  footer_col2: 'Footer คอลัมน์ 2',
  footer_col3: 'Footer คอลัมน์ 3',
};

const LOCATION_TABS = [
  { key: 'header', label: 'Header' },
  { key: 'footer_col1', label: 'Footer 1' },
  { key: 'footer_col2', label: 'Footer 2' },
  { key: 'footer_col3', label: 'Footer 3' },
];

export default function MenuManagementPage() {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLocation, setActiveLocation] = useState('header');

  // Create/Edit modal
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formTarget, setFormTarget] = useState('_self');
  const [formIcon, setFormIcon] = useState('');
  const [formParentId, setFormParentId] = useState<string>('');
  const [formCssClass, setFormCssClass] = useState('');
  const [saving, setSaving] = useState(false);

  // Drag and drop
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const fetchMenus = useCallback(async () => {
    setLoading(true);
    try {
      const response = await menusApi.list({ location: activeLocation });
      if (response.success && response.data) {
        setMenus(response.data);
        // Auto-expand all
        const ids = new Set<number>();
        response.data.forEach((m: MenuItem) => {
          if (m.all_children && m.all_children.length > 0) ids.add(m.id);
        });
        setExpandedIds(ids);
      }
    } catch (error) {
      console.error('Failed to fetch menus:', error);
    } finally {
      setLoading(false);
    }
  }, [activeLocation]);

  useEffect(() => {
    fetchMenus();
  }, [fetchMenus]);

  const openCreateModal = (parentId?: number) => {
    setEditItem(null);
    setFormTitle('');
    setFormUrl('');
    setFormTarget('_self');
    setFormIcon('');
    setFormParentId(parentId ? String(parentId) : '');
    setFormCssClass('');
    setShowModal(true);
  };

  const openEditModal = (item: MenuItem) => {
    setEditItem(item);
    setFormTitle(item.title);
    setFormUrl(item.url || '');
    setFormTarget(item.target || '_self');
    setFormIcon(item.icon || '');
    setFormParentId(item.parent_id ? String(item.parent_id) : '');
    setFormCssClass(item.css_class || '');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formTitle.trim()) {
      alert('กรุณากรอกชื่อเมนู');
      return;
    }
    setSaving(true);
    try {
      const data: Partial<MenuItem> = {
        location: activeLocation as MenuItem['location'],
        title: formTitle,
        url: formUrl || null,
        target: formTarget as '_self' | '_blank',
        icon: formIcon || null,
        parent_id: formParentId ? parseInt(formParentId) : null,
        css_class: formCssClass || null,
      };

      if (editItem) {
        await menusApi.update(editItem.id, data);
      } else {
        await menusApi.create(data);
      }
      setShowModal(false);
      fetchMenus();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'บันทึกล้มเหลว');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: MenuItem) => {
    const childCount = item.all_children?.length || 0;
    const msg = childCount > 0
      ? `ต้องการลบเมนู "${item.title}" และเมนูย่อย ${childCount} รายการ หรือไม่?`
      : `ต้องการลบเมนู "${item.title}" หรือไม่?`;
    if (!confirm(msg)) return;
    try {
      await menusApi.delete(item.id);
      fetchMenus();
    } catch {
      alert('ลบล้มเหลว');
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await menusApi.toggleStatus(id);
      fetchMenus();
    } catch {
      alert('เปลี่ยนสถานะล้มเหลว');
    }
  };

  // Drag & reorder
  const handleDragStart = (id: number) => setDraggedId(id);
  const handleDragEnd = () => setDraggedId(null);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = async (targetId: number) => {
    if (draggedId === null || draggedId === targetId) return;
    const flatList = flattenMenus(menus);
    const dragIndex = flatList.findIndex((m) => m.id === draggedId);
    const dropIndex = flatList.findIndex((m) => m.id === targetId);
    if (dragIndex === -1 || dropIndex === -1) return;

    const [dragged] = flatList.splice(dragIndex, 1);
    flatList.splice(dropIndex, 0, dragged);

    try {
      await menusApi.reorder(
        flatList.map((m, i) => ({ id: m.id, sort_order: i + 1, parent_id: m.parent_id }))
      );
      fetchMenus();
    } catch {
      fetchMenus();
    }
    setDraggedId(null);
  };

  const flattenMenus = (items: MenuItem[]): MenuItem[] => {
    const flat: MenuItem[] = [];
    items.forEach((item) => {
      flat.push(item);
      if (item.all_children) {
        flat.push(...flattenMenus(item.all_children));
      }
    });
    return flat;
  };

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Get root-level items for parent select
  const rootMenus = menus.filter((m) => !m.parent_id);

  const renderMenuItem = (item: MenuItem, depth = 0) => {
    const hasChildren = item.all_children && item.all_children.length > 0;
    const isExpanded = expandedIds.has(item.id);

    return (
      <div key={item.id}>
        <div
          className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-300 ${
            draggedId === item.id ? 'opacity-50' : ''
          }`}
          style={{ paddingLeft: `${16 + depth * 32}px` }}
          draggable
          onDragStart={() => handleDragStart(item.id)}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDrop={() => handleDrop(item.id)}
        >
          <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
            <GripVertical className="w-4 h-4" />
          </div>

          {hasChildren ? (
            <button
              onClick={() => toggleExpand(item.id)}
              className="p-0.5 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
            </button>
          ) : (
            <div className="w-5" />
          )}

          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{item.title}</span>
              {item.url && (
                <span className="text-xs text-gray-400 flex items-center gap-1 truncate max-w-[200px]">
                  <Link2 className="w-3 h-3" />
                  {item.url}
                </span>
              )}
              {item.target === '_blank' && (
                <ExternalLink className="w-3 h-3 text-gray-400" />
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {activeLocation === 'header' && (
              <button
                onClick={() => openCreateModal(item.id)}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-blue-500 transition-colors"
                title="เพิ่มเมนูย่อย"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => handleToggleStatus(item.id)}
              className={`p-1.5 rounded-lg transition-colors ${
                item.is_active ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'
              }`}
              title={item.is_active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
            >
              {item.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
            <button
              onClick={() => openEditModal(item)}
              className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors"
              title="แก้ไข"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(item)}
              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
              title="ลบ"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {item.all_children!.map((child) => renderMenuItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">จัดการเมนู</h1>
          <p className="text-gray-600 mt-1">จัดการเมนู Header และ Footer ของเว็บไซต์</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchMenus} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            รีเฟรช
          </Button>
          <Button onClick={() => openCreateModal()}>
            <Plus className="w-4 h-4 mr-2" />
            เพิ่มเมนู
          </Button>
        </div>
      </div>

      {/* Location Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        {LOCATION_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveLocation(tab.key)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              activeLocation === tab.key
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-gray-300 rounded-lg px-4 py-3 text-sm text-blue-700">
        <strong>{LOCATION_LABELS[activeLocation]}</strong>
        {activeLocation === 'header' && ' — เมนูด้านบนของเว็บไซต์ รองรับเมนูย่อย (submenu)'}
        {activeLocation.startsWith('footer') && ' — เมนูด้านล่างของเว็บไซต์'}
      </div>

      {/* Menu List */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : menus.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Menu className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>ยังไม่มีเมนูใน {LOCATION_LABELS[activeLocation]}</p>
            <Button onClick={() => openCreateModal()} className="mt-4">
              <Plus className="w-4 h-4 mr-2" />
              เพิ่มเมนูแรก
            </Button>
          </div>
        ) : (
          <div>{menus.map((item) => renderMenuItem(item))}</div>
        )}
      </Card>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-300">
              <h2 className="text-lg font-semibold">
                {editItem ? 'แก้ไขเมนู' : 'เพิ่มเมนูใหม่'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อเมนู <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="เช่น ทัวร์ต่างประเทศ"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL ลิงก์</label>
                <Input
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="/tours/international หรือ https://..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">เปิดลิงก์</label>
                  <select
                    value={formTarget}
                    onChange={(e) => setFormTarget(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="_self">หน้าเดียวกัน</option>
                    <option value="_blank">แท็บใหม่</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ไอคอน</label>
                  <Input
                    value={formIcon}
                    onChange={(e) => setFormIcon(e.target.value)}
                    placeholder="ชื่อไอคอน (ไม่บังคับ)"
                  />
                </div>
              </div>
              {activeLocation === 'header' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">เมนูหลัก (สำหรับ submenu)</label>
                  <select
                    value={formParentId}
                    onChange={(e) => setFormParentId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">-- เมนูระดับบนสุด --</option>
                    {rootMenus
                      .filter((m) => m.id !== editItem?.id)
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.title}
                        </option>
                      ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CSS Class (ไม่บังคับ)</label>
                <Input
                  value={formCssClass}
                  onChange={(e) => setFormCssClass(e.target.value)}
                  placeholder="custom-class"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-300">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                ยกเลิก
              </Button>
              <Button onClick={handleSave} disabled={saving || !formTitle.trim()}>
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
    </div>
  );
}
