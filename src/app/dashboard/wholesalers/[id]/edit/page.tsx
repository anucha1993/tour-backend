'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Card, CardHeader, CardTitle, CardContent, Input } from '@/components/ui';
import { ArrowLeft, Building2, User, FileText, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { wholesalersApi, Wholesaler } from '@/lib/api';

export default function EditWholesalerPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    logo_url: '',
    website: '',
    is_active: true,
    notes: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    tax_id: '',
    company_name_th: '',
    company_name_en: '',
    branch_code: '00000',
    branch_name: '',
    address: '',
    phone: '',
    fax: '',
  });

  useEffect(() => {
    const fetchWholesaler = async () => {
      try {
        setLoading(true);
        const response = await wholesalersApi.get(id);
        
        if (response.success && response.data) {
          const w = response.data;
          setFormData({
            code: w.code || '',
            name: w.name || '',
            logo_url: w.logo_url || '',
            website: w.website || '',
            is_active: w.is_active ?? true,
            notes: w.notes || '',
            contact_name: w.contact_name || '',
            contact_email: w.contact_email || '',
            contact_phone: w.contact_phone || '',
            tax_id: w.tax_id || '',
            company_name_th: w.company_name_th || '',
            company_name_en: w.company_name_en || '',
            branch_code: w.branch_code || '00000',
            branch_name: w.branch_name || '',
            address: w.address || '',
            phone: w.phone || '',
            fax: w.fax || '',
          });
        } else {
          setApiError(response.message || 'ไม่พบข้อมูล Wholesaler');
        }
      } catch (err: any) {
        setApiError(err.message || 'ไม่สามารถโหลดข้อมูลได้');
      } finally {
        setLoading(false);
      }
    };

    fetchWholesaler();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    setApiError(null);

    try {
      const response = await wholesalersApi.update(id, formData);
      
      if (response.success) {
        router.push(`/dashboard/wholesalers/${id}`);
      } else {
        if (response.errors) {
          const newErrors: Record<string, string> = {};
          Object.entries(response.errors).forEach(([key, messages]) => {
            newErrors[key] = messages[0];
          });
          setErrors(newErrors);
        }
        setApiError(response.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }
    } catch (err: any) {
      if (err.errors) {
        const newErrors: Record<string, string> = {};
        Object.entries(err.errors).forEach(([key, messages]: [string, any]) => {
          newErrors[key] = messages[0];
        });
        setErrors(newErrors);
      }
      setApiError(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/dashboard/wholesalers/${id}`}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">แก้ไข Wholesaler</h1>
          <p className="text-gray-500 mt-1">แก้ไขข้อมูล {formData.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* API Error Alert */}
        {apiError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{apiError}</p>
          </div>
        )}

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <CardTitle>ข้อมูลพื้นฐาน</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="รหัส Wholesaler *"
              name="code"
              placeholder="เช่น ZEGO, TOURKRUB"
              value={formData.code}
              onChange={handleChange}
              error={errors.code}
              required
            />
            <Input
              label="ชื่อบริษัท *"
              name="name"
              placeholder="เช่น Zego Travel"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              required
            />
            <Input
              label="Logo URL"
              name="logo_url"
              type="url"
              placeholder="https://..."
              value={formData.logo_url}
              onChange={handleChange}
            />
            <Input
              label="Website"
              name="website"
              type="url"
              placeholder="https://..."
              value={formData.website}
              onChange={handleChange}
            />
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                หมายเหตุ
              </label>
              <textarea
                name="notes"
                rows={3}
                placeholder="บันทึกข้อมูลเพิ่มเติม..."
                value={formData.notes}
                onChange={handleChange}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <p className="font-medium text-gray-900">Active Status</p>
                  <p className="text-sm text-gray-500">เปิดใช้งาน Wholesaler นี้ในระบบ</p>
                </div>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <User className="w-5 h-5 text-green-600" />
              </div>
              <CardTitle>ข้อมูลติดต่อ</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="ชื่อผู้ติดต่อ"
              name="contact_name"
              placeholder="เช่น คุณสมชาย"
              value={formData.contact_name}
              onChange={handleChange}
            />
            <Input
              label="Email ติดต่อ"
              name="contact_email"
              type="email"
              placeholder="email@company.com"
              value={formData.contact_email}
              onChange={handleChange}
              error={errors.contact_email}
            />
            <Input
              label="เบอร์โทรติดต่อ"
              name="contact_phone"
              placeholder="02-xxx-xxxx"
              value={formData.contact_phone}
              onChange={handleChange}
            />
          </CardContent>
        </Card>

        {/* Tax Invoice Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <CardTitle>ข้อมูลใบกำกับภาษี</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="เลขประจำตัวผู้เสียภาษี"
              name="tax_id"
              placeholder="13 หลัก"
              value={formData.tax_id}
              onChange={handleChange}
              error={errors.tax_id}
              maxLength={13}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="รหัสสาขา"
                name="branch_code"
                placeholder="00000"
                value={formData.branch_code}
                onChange={handleChange}
              />
              <Input
                label="ชื่อสาขา"
                name="branch_name"
                placeholder="สำนักงานใหญ่"
                value={formData.branch_name}
                onChange={handleChange}
              />
            </div>
            <Input
              label="ชื่อบริษัท (ภาษาไทย)"
              name="company_name_th"
              placeholder="บริษัท xxx จำกัด"
              value={formData.company_name_th}
              onChange={handleChange}
            />
            <Input
              label="ชื่อบริษัท (English)"
              name="company_name_en"
              placeholder="XXX Co., Ltd."
              value={formData.company_name_en}
              onChange={handleChange}
            />
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                ที่อยู่
              </label>
              <textarea
                name="address"
                rows={3}
                placeholder="ที่อยู่เต็ม รวมถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์"
                value={formData.address}
                onChange={handleChange}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
              />
            </div>
            <Input
              label="เบอร์โทรบริษัท"
              name="phone"
              placeholder="02-xxx-xxxx"
              value={formData.phone}
              onChange={handleChange}
            />
            <Input
              label="แฟกซ์"
              name="fax"
              placeholder="02-xxx-xxxx"
              value={formData.fax}
              onChange={handleChange}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 pt-4">
          <Link href={`/dashboard/wholesalers/${id}`}>
            <Button variant="outline" type="button">
              ยกเลิก
            </Button>
          </Link>
          <Button type="submit" isLoading={isSubmitting}>
            <Save className="w-4 h-4" />
            บันทึกการเปลี่ยนแปลง
          </Button>
        </div>
      </form>
    </div>
  );
}
