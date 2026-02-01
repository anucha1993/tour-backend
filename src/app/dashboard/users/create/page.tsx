'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Input } from '@/components/ui';
import { ArrowLeft, Save, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { usersApi, ApiError } from '@/lib/api';

export default function CreateUserPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'staff',
    is_active: true,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
    // Clear error when field changes
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'กรุณาระบุชื่อ';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'กรุณาระบุอีเมล';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    }

    if (!formData.password) {
      newErrors.password = 'กรุณาระบุรหัสผ่าน';
    } else if (formData.password.length < 8) {
      newErrors.password = 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร';
    }

    if (formData.password !== formData.password_confirmation) {
      newErrors.password_confirmation = 'รหัสผ่านไม่ตรงกัน';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    setIsLoading(true);

    try {
      await usersApi.create(formData);
      router.push('/dashboard/users');
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.errors) {
          const newErrors: Record<string, string> = {};
          Object.entries(error.errors).forEach(([key, messages]) => {
            newErrors[key] = messages[0];
          });
          setErrors(newErrors);
        } else {
          alert(error.message);
        }
      } else {
        alert('เกิดข้อผิดพลาด กรุณาลองใหม่');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/users">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">เพิ่มผู้ใช้งานใหม่</h1>
          <p className="text-gray-500 mt-1">กรอกข้อมูลเพื่อสร้างบัญชีผู้ใช้งานใหม่</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">ข้อมูลพื้นฐาน</h2>
              <div className="space-y-4">
                <Input
                  label="ชื่อ-นามสกุล"
                  name="name"
                  placeholder="เช่น สมชาย ใจดี"
                  value={formData.name}
                  onChange={handleChange}
                  error={errors.name}
                  required
                />

                <Input
                  label="อีเมล"
                  type="email"
                  name="email"
                  placeholder="example@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email}
                  required
                />
              </div>
            </Card>

            {/* Password */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">รหัสผ่าน</h2>
              <div className="space-y-4">
                <div className="relative">
                  <Input
                    label="รหัสผ่าน"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="อย่างน้อย 8 ตัวอักษร"
                    value={formData.password}
                    onChange={handleChange}
                    error={errors.password}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <Input
                  label="ยืนยันรหัสผ่าน"
                  type={showPassword ? 'text' : 'password'}
                  name="password_confirmation"
                  placeholder="กรอกรหัสผ่านอีกครั้ง"
                  value={formData.password_confirmation}
                  onChange={handleChange}
                  error={errors.password_confirmation}
                  required
                />
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Role & Status */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">บทบาทและสถานะ</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    บทบาท <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-white"
                  >
                    <option value="admin">ผู้ดูแลระบบ</option>
                    <option value="manager">ผู้จัดการ</option>
                    <option value="staff">พนักงาน</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.role === 'admin' && 'เข้าถึงทุกฟังก์ชันในระบบ'}
                    {formData.role === 'manager' && 'จัดการทัวร์และตัวแทน'}
                    {formData.role === 'staff' && 'ดูข้อมูลและบันทึกพื้นฐาน'}
                  </p>
                </div>

                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleChange}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">เปิดใช้งาน</span>
                      <p className="text-xs text-gray-500">ผู้ใช้สามารถเข้าระบบได้</p>
                    </div>
                  </label>
                </div>
              </div>
            </Card>

            {/* Actions */}
            <Card className="p-6">
              <div className="space-y-3">
                <Button type="submit" className="w-full" isLoading={isLoading}>
                  <Save className="w-4 h-4" />
                  บันทึก
                </Button>
                <Link href="/dashboard/users" className="block">
                  <Button type="button" variant="outline" className="w-full">
                    ยกเลิก
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
