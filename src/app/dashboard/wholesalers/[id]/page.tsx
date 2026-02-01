'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { 
  ArrowLeft, 
  Building2, 
  User, 
  FileText, 
  Edit, 
  Trash2,
  Loader2,
  Power,
  Check,
  X,
  Mail,
  Phone,
  Globe,
  MapPin,
} from 'lucide-react';
import Link from 'next/link';
import { wholesalersApi, Wholesaler } from '@/lib/api';

export default function ViewWholesalerPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [wholesaler, setWholesaler] = useState<Wholesaler | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    const fetchWholesaler = async () => {
      try {
        setLoading(true);
        const response = await wholesalersApi.get(id);
        
        if (response.success && response.data) {
          setWholesaler(response.data);
        } else {
          setError(response.message || 'ไม่พบข้อมูล Wholesaler');
        }
      } catch (err: any) {
        setError(err.message || 'ไม่สามารถโหลดข้อมูลได้');
      } finally {
        setLoading(false);
      }
    };

    fetchWholesaler();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('คุณต้องการลบ Wholesaler นี้หรือไม่?')) return;

    try {
      setDeleting(true);
      const response = await wholesalersApi.delete(id);
      
      if (response.success) {
        router.push('/dashboard/wholesalers');
      } else {
        alert(response.message || 'ไม่สามารถลบได้');
      }
    } catch (err: any) {
      alert(err.message || 'ไม่สามารถลบได้');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleActive = async () => {
    try {
      setToggling(true);
      const response = await wholesalersApi.toggleActive(id);
      
      if (response.success && wholesaler) {
        setWholesaler({ ...wholesaler, is_active: !wholesaler.is_active });
      } else {
        alert(response.message || 'ไม่สามารถเปลี่ยนสถานะได้');
      }
    } catch (err: any) {
      alert(err.message || 'ไม่สามารถเปลี่ยนสถานะได้');
    } finally {
      setToggling(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error || !wholesaler) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="p-12 text-center">
          <p className="text-red-500">{error || 'ไม่พบข้อมูล'}</p>
          <Link href="/dashboard/wholesalers" className="mt-4 inline-block">
            <Button>กลับไปหน้ารายการ</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/wholesalers"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{wholesaler.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-xs text-gray-600">
                  {wholesaler.code}
                </span>
                {wholesaler.is_active ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                    <Check className="w-3 h-3" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    <X className="w-3 h-3" />
                    Inactive
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-14 sm:ml-0">
          <Button 
            variant="outline" 
            onClick={handleToggleActive}
            disabled={toggling}
          >
            {toggling ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Power className="w-4 h-4" />
            )}
            {wholesaler.is_active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
          </Button>
          <Link href={`/dashboard/wholesalers/${id}/edit`}>
            <Button variant="outline">
              <Edit className="w-4 h-4" />
              แก้ไข
            </Button>
          </Link>
          <Button 
            variant="outline" 
            className="text-red-600 hover:bg-red-50"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            ลบ
          </Button>
        </div>
      </div>

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
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-gray-500">รหัส Wholesaler</dt>
              <dd className="mt-1 font-mono bg-gray-100 px-2 py-1 rounded inline-block">
                {wholesaler.code}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">ชื่อบริษัท</dt>
              <dd className="mt-1 font-medium text-gray-900">{wholesaler.name}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">สร้างเมื่อ</dt>
              <dd className="mt-1 text-gray-900">{formatDate(wholesaler.created_at)}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">อัปเดตล่าสุด</dt>
              <dd className="mt-1 text-gray-900">{formatDate(wholesaler.updated_at)}</dd>
            </div>
          </dl>
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
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-gray-500">ชื่อผู้ติดต่อ</dt>
              <dd className="mt-1 text-gray-900 flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                {wholesaler.contact_name || '-'}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Email</dt>
              <dd className="mt-1 text-gray-900 flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                {wholesaler.contact_email ? (
                  <a href={`mailto:${wholesaler.contact_email}`} className="text-blue-600 hover:underline">
                    {wholesaler.contact_email}
                  </a>
                ) : '-'}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">เบอร์โทรศัพท์</dt>
              <dd className="mt-1 text-gray-900 flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                {wholesaler.contact_phone || '-'}
              </dd>
            </div>
          </dl>
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
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-gray-500">เลขประจำตัวผู้เสียภาษี</dt>
              <dd className="mt-1 font-mono text-gray-900">{wholesaler.tax_id || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">ชื่อบริษัท (ภาษาไทย)</dt>
              <dd className="mt-1 text-gray-900">{wholesaler.company_name_th || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">ชื่อบริษัท (English)</dt>
              <dd className="mt-1 text-gray-900">{wholesaler.company_name_en || '-'}</dd>
            </div>
            <div className="md:col-span-2">
              <dt className="text-sm text-gray-500">ที่อยู่</dt>
              <dd className="mt-1 text-gray-900 flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                {wholesaler.address || '-'}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
