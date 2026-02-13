'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import {
  Save,
  Loader2,
  Plus,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
  ChevronDown,
  Shield,
  CreditCard,
  Headphones,
  Phone,
  Mail,
  MapPin,
  Clock,
  Star,
  Heart,
  Award,
  CheckCircle,
  Globe,
  Plane,
  Users,
  Zap,
  ThumbsUp,
  Sparkles,
  Crown,
  Target,
  TrendingUp,
  Briefcase,
  Gift,
} from 'lucide-react';
import { whyChooseUsApi, WhyChooseUsItem } from '@/lib/api';

// Icon mapping
const ICON_MAP: Record<string, React.ElementType> = {
  Shield, CreditCard, Headphones, Phone, Mail, MapPin, Clock, Star, Heart,
  Award, CheckCircle, Globe, Plane, Users, Zap, ThumbsUp, Sparkles, Crown,
  Target, TrendingUp, Briefcase, Gift,
};

const ICON_OPTIONS = [
  { value: 'Shield', label: 'Shield (โล่)' },
  { value: 'Award', label: 'Award (รางวัล)' },
  { value: 'Clock', label: 'Clock (นาฬิกา)' },
  { value: 'Plane', label: 'Plane (เครื่องบิน)' },
  { value: 'Star', label: 'Star (ดาว)' },
  { value: 'Heart', label: 'Heart (หัวใจ)' },
  { value: 'CheckCircle', label: 'CheckCircle (ถูก)' },
  { value: 'Globe', label: 'Globe (โลก)' },
  { value: 'CreditCard', label: 'CreditCard (บัตรเครดิต)' },
  { value: 'Headphones', label: 'Headphones (หูฟัง)' },
  { value: 'Phone', label: 'Phone (โทรศัพท์)' },
  { value: 'Mail', label: 'Mail (อีเมล)' },
  { value: 'MapPin', label: 'MapPin (แผนที่)' },
  { value: 'Users', label: 'Users (กลุ่มคน)' },
  { value: 'Zap', label: 'Zap (สายฟ้า)' },
  { value: 'ThumbsUp', label: 'ThumbsUp (ไลค์)' },
  { value: 'Sparkles', label: 'Sparkles (ระยิบ)' },
  { value: 'Crown', label: 'Crown (มงกุฎ)' },
  { value: 'Target', label: 'Target (เป้าหมาย)' },
  { value: 'TrendingUp', label: 'TrendingUp (กราฟขาขึ้น)' },
  { value: 'Briefcase', label: 'Briefcase (กระเป๋า)' },
  { value: 'Gift', label: 'Gift (ของขวัญ)' },
];

export default function WhyChooseUsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Config state
  const [title, setTitle] = useState('ทำไมต้องเลือกเรา?');
  const [subtitle, setSubtitle] = useState('NextTrip พร้อมให้บริการคุณด้วยมาตรฐานสูงสุด');
  const [show, setShow] = useState(true);
  const [items, setItems] = useState<WhyChooseUsItem[]>([]);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const response = await whyChooseUsApi.get();
      if (response.success && response.data) {
        const data = response.data;
        setTitle(data.title || '');
        setSubtitle(data.subtitle || '');
        setShow(data.show ?? true);
        setItems(data.items || []);
        setDirty(false);
      }
    } catch (error) {
      console.error('Failed to fetch config:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const markDirty = () => setDirty(true);

  const handleSave = async () => {
    // Validate items
    const invalidItems = items.filter(item => !item.title.trim());
    if (invalidItems.length > 0) {
      alert('กรุณากรอกชื่อหัวข้อให้ครบทุกรายการ');
      return;
    }

    setSaving(true);
    try {
      await whyChooseUsApi.update({ title, subtitle, show, items });
      setDirty(false);
      alert('บันทึกสำเร็จ');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'บันทึกล้มเหลว');
    } finally {
      setSaving(false);
    }
  };

  const addItem = () => {
    setItems([...items, { icon: 'Shield', title: '', description: '' }]);
    markDirty();
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
    markDirty();
  };

  const updateItem = (index: number, field: keyof WhyChooseUsItem, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
    markDirty();
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    setItems(newItems);
    markDirty();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
            <span>/</span>
            <span className="text-gray-700">จัดการเว็บไซต์</span>
            <span>/</span>
            <span className="text-gray-700">ทำไมต้องเลือกเรา</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Star className="w-7 h-7 text-yellow-500" />
            ทำไมต้องเลือกเรา
          </h1>
          <p className="text-gray-500 mt-1">จัดการจุดเด่นที่แสดงบนหน้าแรกของเว็บไซต์</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving || !dirty}
          className="flex items-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          บันทึก
        </Button>
      </div>

      {/* Section Settings */}
      <Card className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">ตั้งค่า Section</h2>
          <button
            onClick={() => { setShow(!show); markDirty(); }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              show
                ? 'bg-green-50 text-green-700 hover:bg-green-100'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {show ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            {show ? 'แสดง' : 'ซ่อน'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">หัวข้อ</label>
            <Input
              value={title}
              onChange={(e) => { setTitle(e.target.value); markDirty(); }}
              placeholder="ทำไมต้องเลือกเรา?"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">คำอธิบาย</label>
            <Input
              value={subtitle}
              onChange={(e) => { setSubtitle(e.target.value); markDirty(); }}
              placeholder="NextTrip พร้อมให้บริการคุณด้วยมาตรฐานสูงสุด"
            />
          </div>
        </div>
      </Card>

      {/* Items */}
      <Card className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            จุดเด่น ({items.length} รายการ)
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={addItem}
            disabled={items.length >= 12}
            className="flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            เพิ่มจุดเด่น
          </Button>
        </div>

        {items.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Star className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>ยังไม่มีจุดเด่น</p>
            <p className="text-sm mt-1">คลิก &quot;เพิ่มจุดเด่น&quot; เพื่อเริ่มต้น</p>
          </div>
        )}

        <div className="space-y-4">
          {items.map((item, index) => {
            const IconComponent = ICON_MAP[item.icon] || Shield;
            return (
              <div
                key={index}
                className="border border-gray-200 rounded-xl p-4 hover:border-blue-200 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {/* Drag handle & order */}
                  <div className="flex flex-col items-center gap-1 pt-1">
                    <button
                      onClick={() => moveItem(index, 'up')}
                      disabled={index === 0}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      title="ย้ายขึ้น"
                    >
                      <ChevronDown className="w-4 h-4 rotate-180" />
                    </button>
                    <GripVertical className="w-4 h-4 text-gray-300" />
                    <button
                      onClick={() => moveItem(index, 'down')}
                      disabled={index === items.length - 1}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      title="ย้ายลง"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Icon Preview */}
                  <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <IconComponent className="w-6 h-6 text-blue-600" />
                  </div>

                  {/* Form */}
                  <div className="flex-1 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Icon Select */}
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">ไอคอน</label>
                        <select
                          value={item.icon}
                          onChange={(e) => updateItem(index, 'icon', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {ICON_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                      {/* Title */}
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">ชื่อหัวข้อ</label>
                        <Input
                          value={item.title}
                          onChange={(e) => updateItem(index, 'title', e.target.value)}
                          placeholder="เช่น ใบอนุญาตถูกต้อง"
                        />
                      </div>
                      {/* Description */}
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">คำอธิบาย</label>
                        <Input
                          value={item.description}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          placeholder="คำอธิบายสั้นๆ"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => removeItem(index)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1 flex-shrink-0"
                    title="ลบ"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Preview */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">ตัวอย่างการแสดงผล</h2>
        {!show && (
          <div className="text-center py-8 text-gray-400">
            <EyeOff className="w-8 h-8 mx-auto mb-2" />
            <p>Section นี้ถูกซ่อนอยู่</p>
          </div>
        )}
        {show && (
          <div className="bg-blue-50/60 rounded-2xl p-8">
            <div className="text-center mb-8">
              <h3 className="text-xl font-bold text-gray-800">{title || 'ทำไมต้องเลือกเรา?'}</h3>
              <p className="text-gray-500 mt-1 text-sm">{subtitle || 'คำอธิบาย'}</p>
            </div>
            <div className={`grid gap-4 ${
              items.length <= 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
            }`}>
              {items.map((item, i) => {
                const IC = ICON_MAP[item.icon] || Shield;
                return (
                  <div key={i} className="bg-white rounded-xl p-5 text-center shadow-sm">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-50 flex items-center justify-center">
                      <IC className="w-6 h-6 text-blue-600" />
                    </div>
                    <h4 className="font-semibold text-gray-800 text-sm mb-1">{item.title || '(ไม่มีชื่อ)'}</h4>
                    <p className="text-xs text-gray-500">{item.description || '(ไม่มีคำอธิบาย)'}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
