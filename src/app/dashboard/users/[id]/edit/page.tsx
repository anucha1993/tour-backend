'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Card, Input } from '@/components/ui';
import { ArrowLeft, Save, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { usersApi, ApiError } from '@/lib/api';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'staff';
  is_active: boolean;
  is_sales: boolean;
}

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'staff' as 'admin' | 'manager' | 'staff',
    is_active: true,
    is_sales: false,
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await usersApi.get(Number(params.id));
        if (response.success && response.data) {
          setFormData({
            name: response.data.name,
            email: response.data.email,
            password: '',
            password_confirmation: '',
            role: response.data.role,
            is_active: response.data.is_active,
            is_sales: response.data.is_sales ?? false,
          });
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setIsFetching(false);
      }
    };
    
    fetchUser();
  }, [params.id]);

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

    // Password is optional for edit, but if provided must be valid
    if (formData.password) {
      if (formData.password.length < 8) {
        newErrors.password = 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร';
      }
      if (formData.password !== formData.password_confirmation) {
        newErrors.password_confirmation = 'รหัสผ่านไม่ตรงกัน';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    setIsLoading(true);

    try {
      // Prepare payload - only include password if provided
      const payload: {
        name?: string;
        email?: string;
        password?: string;
        password_confirmation?: string;
        role?: string;
        is_active?: boolean;
        is_sales?: boolean;
      } = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        is_active: formData.is_active,
        is_sales: formData.is_sales,
      };
      
      if (formData.password) {
        payload.password = formData.password;
        payload.password_confirmation = formData.password_confirmation;
      }

      await usersApi.update(Number(params.id), payload);
      router.push(`/dashboard/users/${params.id}`);
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
      setIsLoading(true);
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/users/${params.id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">แก้ไขผู้ใช้งาน</h1>
          <p className="text-gray-500 mt-1">แก้ไขข้อมูลผู้ใช้งาน {formData.name}</p>
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
              <h2 className="text-lg font-semibold text-gray-900 mb-2">เปลี่ยนรหัสผ่าน</h2>
              <p className="text-sm text-gray-500 mb-4">เว้นว่างไว้ถ้าไม่ต้องการเปลี่ยน</p>
              <div className="space-y-4">
                <div className="relative">
                  <Input
                    label="รหัสผ่านใหม่"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="อย่างน้อย 8 ตัวอักษร"
                    value={formData.password}
                    onChange={handleChange}
                    error={errors.password}
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
                  label="ยืนยันรหัสผ่านใหม่"
                  type={showPassword ? 'text' : 'password'}
                  name="password_confirmation"
                  placeholder="กรอกรหัสผ่านอีกครั้ง"
                  value={formData.password_confirmation}
                  onChange={handleChange}
                  error={errors.password_confirmation}
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

                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_sales"
                      checked={formData.is_sales}
                      onChange={handleChange}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">Sales</span>
                      <p className="text-xs text-gray-500">แสดงในตัวเลือกเซลส์หน้าจอง</p>
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
                  บันทึกการแก้ไข
                </Button>
                <Link href={`/dashboard/users/${params.id}`} className="block">
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
