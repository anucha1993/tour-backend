'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Input, Select } from '@/components/ui';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import Link from 'next/link';
import { transportsApi, TRANSPORT_TYPES } from '@/lib/api';

export default function CreateTransportPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  
  const [formData, setFormData] = useState({
    code: '',
    code1: '',
    name: '',
    type: 'airline',
    image: '',
    status: 'on',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setErrors({});

      const response = await transportsApi.create({
        code: formData.code,
        name: formData.name,
        type: formData.type as "airline" | "bus" | "van" | "boat",
        status: formData.status as "on" | "off",
        code1: formData.code1 || undefined,
        image: formData.image || undefined,
      });

      if (response.success) {
        router.push('/dashboard/transports');
      } else {
        if (response.errors) {
          setErrors(response.errors);
        }
      }
    } catch (err: any) {
      if (err.errors) {
        setErrors(err.errors);
      } else {
        alert(err.message || 'เกิดข้อผิดพลาด');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/transports">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">เพิ่ม Transport ใหม่</h1>
          <p className="text-gray-500 mt-1">สร้างข้อมูลสายการบินหรือยานพาหนะ</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <div className="p-6 space-y-6">
            {/* Basic Info */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">ข้อมูลพื้นฐาน</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    รหัส IATA <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    placeholder="TG, SQ, EK..."
                    maxLength={10}
                    error={errors.code?.[0]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    รหัส ICAO
                  </label>
                  <Input
                    name="code1"
                    value={formData.code1}
                    onChange={handleChange}
                    placeholder="THA, SIA, UAE..."
                    maxLength={10}
                    error={errors.code1?.[0]}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ชื่อ <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Thai Airways International"
                    error={errors.name?.[0]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ประเภท <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                  >
                    {Object.entries(TRANSPORT_TYPES).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  {errors.type && (
                    <p className="mt-1 text-sm text-red-500">{errors.type[0]}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    สถานะ <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                  >
                    <option value="on">เปิดใช้งาน</option>
                    <option value="off">ปิดใช้งาน</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL รูปภาพ
                  </label>
                  <Input
                    name="image"
                    value={formData.image}
                    onChange={handleChange}
                    placeholder="https://imagedelivery.net/..."
                    error={errors.image?.[0]}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    URL ของรูปภาพโลโก้ (Cloudflare Images หรือ URL อื่น)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
            <Link href="/dashboard/transports">
              <Button variant="outline" type="button">
                ยกเลิก
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              บันทึก
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
