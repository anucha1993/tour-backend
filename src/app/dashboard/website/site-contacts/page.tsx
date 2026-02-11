'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Card, Input } from '@/components/ui';
import {
  Phone,
  Globe,
  Clock,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Loader2,
  Save,
  X,
  GripVertical,
  Eye,
  EyeOff,
} from 'lucide-react';
import { siteContactsApi, SiteContact } from '@/lib/api';

const GROUP_TABS = [
  { key: 'contact', label: 'ข้อมูลติดต่อ', icon: Phone, color: 'blue' },
  { key: 'social', label: 'โซเชียลมีเดีย', icon: Globe, color: 'purple' },
  { key: 'business_hours', label: 'เวลาทำการ', icon: Clock, color: 'green' },
] as const;

type GroupKey = (typeof GROUP_TABS)[number]['key'];

// --- Form Fields Component (outside main to avoid focus jump) ---
interface FormFieldsProps {
  formKey: string;
  setFormKey: (v: string) => void;
  formLabel: string;
  setFormLabel: (v: string) => void;
  formValue: string;
  setFormValue: (v: string) => void;
  formIcon: string;
  setFormIcon: (v: string) => void;
  formUrl: string;
  setFormUrl: (v: string) => void;
  activeGroup: GroupKey;
  editingItem: SiteContact | null;
}

function ContactFormFields({
  formKey,
  setFormKey,
  formLabel,
  setFormLabel,
  formValue,
  setFormValue,
  formIcon,
  setFormIcon,
  formUrl,
  setFormUrl,
  activeGroup,
  editingItem,
}: FormFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Key *</label>
          <Input
            value={formKey}
            onChange={(e) => setFormKey(e.target.value)}
            placeholder={
              activeGroup === 'contact'
                ? 'phone, email, line_id, hotline'
                : activeGroup === 'social'
                ? 'facebook, instagram, youtube, tiktok'
                : 'weekday, weekend, holiday'
            }
            disabled={!!editingItem}
          />
          <p className="text-xs text-gray-400 mt-1">ตัวระบุ (ไม่ซ้ำกัน)</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Label *</label>
          <Input
            value={formLabel}
            onChange={(e) => setFormLabel(e.target.value)}
            placeholder={
              activeGroup === 'contact'
                ? 'เบอร์โทร, อีเมล, LINE'
                : activeGroup === 'social'
                ? 'Facebook, Instagram'
                : 'จันทร์-ศุกร์, วันหยุด'
            }
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Value *</label>
        <Input
          value={formValue}
          onChange={(e) => setFormValue(e.target.value)}
          placeholder={
            activeGroup === 'contact'
              ? '02-xxx-xxxx, info@nexttrip.co.th'
              : activeGroup === 'social'
              ? '@nexttripofficial'
              : '09:00 - 18:00'
          }
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
          <Input
            value={formIcon}
            onChange={(e) => setFormIcon(e.target.value)}
            placeholder="phone, mail, facebook, clock"
          />
          <p className="text-xs text-gray-400 mt-1">ชื่อ icon (lucide icon name)</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">URL / Link</label>
          <Input
            value={formUrl}
            onChange={(e) => setFormUrl(e.target.value)}
            placeholder="https://..."
          />
        </div>
      </div>
    </div>
  );
}

// --- Main Component ---
export default function SiteContactsPage() {
  const [contacts, setContacts] = useState<SiteContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGroup, setActiveGroup] = useState<GroupKey>('contact');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<SiteContact | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formKey, setFormKey] = useState('');
  const [formLabel, setFormLabel] = useState('');
  const [formValue, setFormValue] = useState('');
  const [formIcon, setFormIcon] = useState('');
  const [formUrl, setFormUrl] = useState('');

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await siteContactsApi.list();
      if (res.success && res.data) {
        setContacts(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch contacts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const groupedContacts = contacts.filter((c) => c.group === activeGroup);

  const openCreate = () => {
    setEditingItem(null);
    setFormKey('');
    setFormLabel('');
    setFormValue('');
    setFormIcon('');
    setFormUrl('');
    setShowModal(true);
  };

  const openEdit = (item: SiteContact) => {
    setEditingItem(item);
    setFormKey(item.key);
    setFormLabel(item.label);
    setFormValue(item.value);
    setFormIcon(item.icon || '');
    setFormUrl(item.url || '');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formKey.trim() || !formLabel.trim() || !formValue.trim()) {
      alert('กรุณากรอก Key, Label และ Value');
      return;
    }
    setSaving(true);
    try {
      const data = {
        key: formKey.trim(),
        label: formLabel.trim(),
        value: formValue.trim(),
        icon: formIcon.trim() || null,
        url: formUrl.trim() || null,
        group: activeGroup,
      };
      if (editingItem) {
        await siteContactsApi.update(editingItem.id, data);
      } else {
        await siteContactsApi.create(data);
      }
      setShowModal(false);
      fetchContacts();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'บันทึกล้มเหลว');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: SiteContact) => {
    if (!confirm(`ลบ "${item.label}" ?`)) return;
    try {
      await siteContactsApi.delete(item.id);
      fetchContacts();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'ลบล้มเหลว');
    }
  };

  const handleToggle = async (item: SiteContact) => {
    try {
      await siteContactsApi.toggle(item.id);
      fetchContacts();
    } catch (err) {
      console.error('Toggle failed:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ข้อมูลติดต่อเว็บไซต์</h1>
          <p className="text-gray-600 mt-1">จัดการข้อมูลติดต่อ, โซเชียลมีเดีย และเวลาทำการ</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchContacts} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            รีเฟรช
          </Button>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            เพิ่มข้อมูล
          </Button>
        </div>
      </div>

      {/* Group Tabs */}
      <div className="flex gap-2">
        {GROUP_TABS.map((tab) => {
          const Icon = tab.icon;
          const count = contacts.filter((c) => c.group === tab.key).length;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveGroup(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeGroup === tab.key
                  ? tab.color === 'blue'
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : tab.color === 'purple'
                    ? 'bg-purple-100 text-purple-700 border border-purple-300'
                    : 'bg-green-100 text-green-700 border border-green-300'
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeGroup === tab.key ? 'bg-white/50' : 'bg-gray-100'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Contact List */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : groupedContacts.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Phone className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>ยังไม่มีข้อมูลในหมวดนี้</p>
            <Button variant="outline" onClick={openCreate} className="mt-4">
              <Plus className="w-4 h-4 mr-2" />
              เพิ่มข้อมูล
            </Button>
          </div>
        ) : (
          <div className="divide-y">
            {groupedContacts.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-4 px-6 py-4 ${
                  !item.is_active ? 'opacity-50 bg-gray-50' : ''
                }`}
              >
                <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{item.label}</span>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                      {item.key}
                    </span>
                    {item.icon && (
                      <span className="text-xs text-gray-400">🎨 {item.icon}</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 mt-0.5">{item.value}</div>
                  {item.url && (
                    <div className="text-xs text-blue-500 truncate mt-0.5">{item.url}</div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleToggle(item)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      item.is_active
                        ? 'text-green-600 hover:bg-green-50'
                        : 'text-gray-400 hover:bg-gray-100'
                    }`}
                    title={item.is_active ? 'ปิดการแสดง' : 'เปิดการแสดง'}
                  >
                    {item.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => openEdit(item)}
                    className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50"
                    title="แก้ไข"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-300">
              <h3 className="text-lg font-semibold">
                {editingItem ? 'แก้ไขข้อมูล' : 'เพิ่มข้อมูลใหม่'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <ContactFormFields
                formKey={formKey}
                setFormKey={setFormKey}
                formLabel={formLabel}
                setFormLabel={setFormLabel}
                formValue={formValue}
                setFormValue={setFormValue}
                formIcon={formIcon}
                setFormIcon={setFormIcon}
                formUrl={formUrl}
                setFormUrl={setFormUrl}
                activeGroup={activeGroup}
                editingItem={editingItem}
              />
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-300">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                ยกเลิก
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    บันทึก
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
