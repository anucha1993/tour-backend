'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { countriesApi, COUNTRY_REGIONS } from '@/lib/api';

export default function CreateCountryPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    iso2: '',
    iso3: '',
    name_en: '',
    name_th: '',
    slug: '',
    region: '',
    flag_emoji: '',
    is_active: true,
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.iso2.trim() || formData.iso2.length !== 2) {
      newErrors.iso2 = 'กรุณากรอกรหัส ISO2 (2 ตัวอักษร)';
    }

    if (!formData.iso3.trim() || formData.iso3.length !== 3) {
      newErrors.iso3 = 'กรุณากรอกรหัส ISO3 (3 ตัวอักษร)';
    }

    if (!formData.name_en.trim()) {
      newErrors.name_en = 'กรุณากรอกชื่อภาษาอังกฤษ';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      const response = await countriesApi.create({
        iso2: formData.iso2.toUpperCase(),
        iso3: formData.iso3.toUpperCase(),
        name_en: formData.name_en,
        name_th: formData.name_th || undefined,
        slug: formData.slug || undefined,
        region: formData.region || undefined,
        flag_emoji: formData.flag_emoji || undefined,
        is_active: formData.is_active,
      });

      if (response.success) {
        alert('บันทึกข้อมูลเรียบร้อย');
        router.push('/dashboard/countries');
      } else {
        alert(response.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }
    } catch (error: any) {
      console.error('Failed to create country:', error);
      
      if (error.errors) {
        const fieldErrors: Record<string, string> = {};
        Object.entries(error.errors).forEach(([key, messages]) => {
          fieldErrors[key] = Array.isArray(messages) ? messages[0] : messages as string;
        });
        setErrors(fieldErrors);
      } else {
        alert(error.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/countries')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          กลับ
        </Button>
        <h1 className="text-2xl font-bold">เพิ่มประเทศ</h1>
        <p className="text-gray-500">เพิ่มข้อมูลประเทศใหม่</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>ข้อมูลประเทศ</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label htmlFor="iso2" className="block text-sm font-medium text-gray-700">
                  รหัส ISO2 <span className="text-red-500">*</span>
                </label>
                <Input
                  id="iso2"
                  value={formData.iso2}
                  onChange={(e) => handleInputChange('iso2', e.target.value.toUpperCase())}
                  placeholder="TH"
                  maxLength={2}
                  className="uppercase"
                />
                {errors.iso2 && (
                  <p className="text-sm text-red-500">{errors.iso2}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="iso3" className="block text-sm font-medium text-gray-700">
                  รหัส ISO3 <span className="text-red-500">*</span>
                </label>
                <Input
                  id="iso3"
                  value={formData.iso3}
                  onChange={(e) => handleInputChange('iso3', e.target.value.toUpperCase())}
                  placeholder="THA"
                  maxLength={3}
                  className="uppercase"
                />
                {errors.iso3 && (
                  <p className="text-sm text-red-500">{errors.iso3}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="flag_emoji" className="block text-sm font-medium text-gray-700">
                  ธงชาติ (Emoji)
                </label>
                <Input
                  id="flag_emoji"
                  value={formData.flag_emoji}
                  onChange={(e) => handleInputChange('flag_emoji', e.target.value)}
                  placeholder="🇹🇭"
                  maxLength={10}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="name_en" className="block text-sm font-medium text-gray-700">
                  ชื่อ (อังกฤษ) <span className="text-red-500">*</span>
                </label>
                <Input
                  id="name_en"
                  value={formData.name_en}
                  onChange={(e) => handleInputChange('name_en', e.target.value)}
                  placeholder="Thailand"
                />
                {errors.name_en && (
                  <p className="text-sm text-red-500">{errors.name_en}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="name_th" className="block text-sm font-medium text-gray-700">
                  ชื่อ (ไทย)
                </label>
                <Input
                  id="name_th"
                  value={formData.name_th}
                  onChange={(e) => handleInputChange('name_th', e.target.value)}
                  placeholder="ประเทศไทย"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
                  Slug (URL)
                </label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => handleInputChange('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  placeholder="thailand"
                />
                <p className="text-xs text-gray-500">ถ้าไม่กรอกจะสร้างอัตโนมัติจากชื่อภาษาอังกฤษ</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="region" className="block text-sm font-medium text-gray-700">
                  ภูมิภาค
                </label>
                <select
                  id="region"
                  value={formData.region}
                  onChange={(e) => handleInputChange('region', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                >
                  <option value="">เลือกภูมิภาค</option>
                  {Object.entries(COUNTRY_REGIONS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => handleInputChange('is_active', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700">เปิดใช้งาน</label>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={saving}
                className="flex-1"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    บันทึก
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard/countries')}
                disabled={saving}
              >
                ยกเลิก
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
