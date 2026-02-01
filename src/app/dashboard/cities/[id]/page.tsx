'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Input } from '@/components/ui';
import { ArrowLeft, Loader2, Save, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { citiesApi, City } from '@/lib/api';

export default function EditCityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [countries, setCountries] = useState<Array<{ id: number; iso2: string; name_en: string; name_th: string | null }>>([]);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [city, setCity] = useState<City | null>(null);
  
  const [formData, setFormData] = useState({
    name_en: '',
    name_th: '',
    slug: '',
    country_id: '',
    description: '',
    is_popular: false,
    is_active: true,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch countries
        const countriesResponse = await citiesApi.getCountries();
        if (countriesResponse.success && countriesResponse.data) {
          setCountries(countriesResponse.data);
        }

        // Fetch city
        const cityResponse = await citiesApi.get(parseInt(id));
        if (cityResponse.success && cityResponse.data) {
          const cityData = cityResponse.data;
          setCity(cityData);
          setFormData({
            name_en: cityData.name_en,
            name_th: cityData.name_th || '',
            slug: cityData.slug,
            country_id: cityData.country_id.toString(),
            description: cityData.description || '',
            is_popular: cityData.is_popular,
            is_active: cityData.is_active,
          });
        }
      } catch (err: any) {
        console.error('Failed to load data:', err);
        alert(err.message || 'Failed to load city');
        router.push('/dashboard/cities');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    try {
      setSaving(true);
      
      const data = {
        ...formData,
        country_id: parseInt(formData.country_id),
        description: formData.description || null,
      };

      const response = await citiesApi.update(parseInt(id), data);
      
      if (response.success) {
        router.push('/dashboard/cities');
      } else {
        setErrors(response.errors || {});
      }
    } catch (err: any) {
      if (err.errors) {
        setErrors(err.errors);
      } else {
        alert(err.message || 'Failed to update city');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('คุณต้องการลบข้อมูลนี้หรือไม่?')) return;

    try {
      setDeleting(true);
      const response = await citiesApi.delete(parseInt(id));
      
      if (response.success) {
        router.push('/dashboard/cities');
      } else {
        alert(response.message || 'Failed to delete city');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete city');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/cities">
            <Button variant="secondary" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">แก้ไขเมือง</h1>
            <p className="text-gray-600">{city?.name_th || city?.name_en}</p>
          </div>
        </div>
        <Button variant="danger" onClick={handleDelete} disabled={deleting}>
          {deleting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Trash2 className="w-4 h-4 mr-2" />
              ลบ
            </>
          )}
        </Button>
      </div>

      {/* Form */}
      <Card>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Country */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ประเทศ <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.country_id}
                onChange={(e) => setFormData({ ...formData, country_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">เลือกประเทศ</option>
                {countries.map((country) => (
                  <option key={country.id} value={country.id}>
                    {country.name_th || country.name_en} ({country.iso2})
                  </option>
                ))}
              </select>
              {errors.country_id && (
                <p className="mt-1 text-sm text-red-500">{errors.country_id[0]}</p>
              )}
            </div>

            {/* Name EN */}
            <div>
              <Input
                label="ชื่อ (อังกฤษ)"
                required
                value={formData.name_en}
                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                placeholder="Bangkok"
                error={errors.name_en?.[0]}
              />
            </div>

            {/* Name TH */}
            <div>
              <Input
                label="ชื่อ (ไทย)"
                value={formData.name_th}
                onChange={(e) => setFormData({ ...formData, name_th: e.target.value })}
                placeholder="กรุงเทพมหานคร"
                error={errors.name_th?.[0]}
              />
            </div>

            {/* Slug */}
            <div className="md:col-span-2">
              <Input
                label="Slug (URL)"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                placeholder="bangkok"
                error={errors.slug?.[0]}
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                รายละเอียด
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="รายละเอียดเกี่ยวกับเมืองนี้..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-500">{errors.description[0]}</p>
              )}
            </div>

            {/* Checkboxes */}
            <div className="md:col-span-2 flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_popular}
                  onChange={(e) => setFormData({ ...formData, is_popular: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">เมืองยอดนิยม</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">เปิดใช้งาน</span>
              </label>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Link href="/dashboard/cities">
              <Button type="button" variant="secondary">
                ยกเลิก
              </Button>
            </Link>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              บันทึก
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
