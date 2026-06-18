'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Card } from '@/components/ui';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Mail, 
  Calendar,
  Shield,
  ShieldCheck,
  User as UserIcon,
  Check,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usersApi, ApiError } from '@/lib/api';
import { UserRole, ROLE_OPTIONS, getRolePermissionMatrix } from '@/lib/permissions';

interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const roleBadges: Record<string, {
  bg: string; text: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string; description: string;
}> = {
  admin: {
    bg: 'bg-purple-50', text: 'text-purple-700', icon: ShieldCheck,
    label: 'ผู้ดูแลระบบ',
    description: 'เข้าถึงทุกฟังก์ชันในระบบ — สามารถดู สร้าง แก้ไข และลบข้อมูลได้ทุกเมนู',
  },
  sale: {
    bg: 'bg-green-50', text: 'text-green-700', icon: UserIcon,
    label: 'ฝ่ายขาย',
    description: 'เข้าถึงได้เฉพาะเมนูที่เกี่ยวข้องกับงานขาย ได้แก่ แดชบอร์ด, ขาย, ใบจอง และทัวร์',
  },
  it: {
    bg: 'bg-blue-50', text: 'text-blue-700', icon: Shield,
    label: 'ฝ่ายไอที',
    description: 'เข้าถึงได้เกือบทุกเมนู ยกเว้น Integrations, ผู้ใช้งาน และตั้งค่า',
  },
};

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await usersApi.get(Number(params.id));
        if (response.success && response.data) {
          setUser(response.data);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUser();
  }, [params.id]);

  const handleDelete = async () => {
    if (!user) return;
    
    setIsDeleting(true);
    try {
      await usersApi.delete(user.id);
      router.push('/dashboard/users');
    } catch (error) {
      if (error instanceof ApiError) {
        alert(error.message);
      }
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-500 mb-4">ไม่พบข้อมูลผู้ใช้งาน</p>
          <Link href="/dashboard/users">
            <Button variant="outline">กลับไปหน้ารายการ</Button>
          </Link>
        </div>
      </div>
    );
  }

  const roleBadge = roleBadges[user.role] || { bg: 'bg-gray-100', text: 'text-gray-700', icon: UserIcon, label: user.role, description: 'ไม่ทราบสิทธิ์' };
  const RoleIcon = roleBadge.icon;
  const permMatrix = getRolePermissionMatrix((user.role as UserRole) || 'sale');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/users">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">รายละเอียดผู้ใช้งาน</h1>
            <p className="text-gray-500 mt-1">ดูข้อมูลและจัดการผู้ใช้งาน</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href={`/dashboard/users/${user.id}/edit`}>
            <Button variant="outline">
              <Edit className="w-4 h-4" />
              <span className="hidden sm:inline">แก้ไข</span>
            </Button>
          </Link>
          <Button 
            variant="danger" 
            onClick={() => setShowDeleteModal(true)}
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">ลบ</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Card */}
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-3xl">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
                <div className="flex items-center gap-2 text-gray-500 mt-1">
                  <Mail className="w-4 h-4" />
                  {user.email}
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${roleBadge.bg} ${roleBadge.text}`}>
                    <RoleIcon className="w-4 h-4" />
                    {roleBadge.label}
                  </span>
                  {user.is_active ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-green-50 text-green-700">
                      <Check className="w-4 h-4" />
                      ใช้งาน
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
                      <X className="w-4 h-4" />
                      ปิดใช้งาน
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Details */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">ข้อมูลทั่วไป</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">ชื่อ-นามสกุล</p>
                <p className="font-medium text-gray-900">{user.name}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">อีเมล</p>
                <p className="font-medium text-gray-900">{user.email}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">บทบาท</p>
                <p className="font-medium text-gray-900">{roleBadge.label}</p>
                <p className="text-xs text-gray-500 mt-1">{roleBadge.description}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">สถานะ</p>
                <p className="font-medium text-gray-900">
                  {user.is_active ? 'ใช้งาน' : 'ปิดใช้งาน'}
                </p>
              </div>
            </div>
          </Card>

          {/* Permission Summary — detailed table */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">สิทธิ์การเข้าถึงทั้งหมด</h3>
            <p className="text-sm text-gray-500 mb-4">
              ตารางแสดงสิทธิ์ของบทบาท <span className="font-medium text-gray-700">{roleBadge.label}</span> ในแต่ละเมนู
            </p>
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 pr-4 font-medium text-gray-600">เมนู</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-600 w-16">เข้าถึง</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-600 w-16">ดู (R)</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-600 w-24">สร้าง/แก้ไข (W)</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-600 w-16">ลบ (D)</th>
                  </tr>
                </thead>
                <tbody>
                  {permMatrix.map((row, i) => (
                    <tr key={i} className={`border-b border-gray-100 ${!row.visible ? 'bg-gray-50 text-gray-400' : ''}`}>
                      <td className="py-2.5 pr-4 font-medium">{row.menu}</td>
                      <td className="text-center py-2.5 px-3">
                        {row.visible
                          ? <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600"><Check className="w-3.5 h-3.5" /></span>
                          : <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-500"><X className="w-3.5 h-3.5" /></span>}
                      </td>
                      <td className="text-center py-2.5 px-3">
                        {row.read
                          ? <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600"><Check className="w-3.5 h-3.5" /></span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="text-center py-2.5 px-3">
                        {row.write
                          ? <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600"><Check className="w-3.5 h-3.5" /></span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="text-center py-2.5 px-3">
                        {row.delete
                          ? <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600"><Check className="w-3.5 h-3.5" /></span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-green-100 text-green-600"><Check className="w-3 h-3" /></span> มีสิทธิ์</span>
              <span className="flex items-center gap-1"><span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-100 text-red-500"><X className="w-3 h-3" /></span> ไม่มีสิทธิ์</span>
              <span className="flex items-center gap-1"><span className="text-gray-300">—</span> ไม่เกี่ยวข้อง</span>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timestamps */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">ข้อมูลระบบ</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">สร้างเมื่อ</p>
                  <p className="font-medium text-gray-900">
                    {new Date(user.created_at).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">แก้ไขล่าสุด</p>
                  <p className="font-medium text-gray-900">
                    {new Date(user.updated_at).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">ดำเนินการ</h3>
            <div className="space-y-3">
              <Link href={`/dashboard/users/${user.id}/edit`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Edit className="w-4 h-4" />
                  แก้ไขข้อมูล
                </Button>
              </Link>
              <Button 
                variant="outline" 
                className="w-full justify-start text-red-600 hover:bg-red-50 hover:border-red-200"
                onClick={() => setShowDeleteModal(true)}
              >
                <Trash2 className="w-4 h-4" />
                ลบผู้ใช้งาน
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">ยืนยันการลบ</h3>
              <p className="text-gray-500 mb-6">
                คุณต้องการลบผู้ใช้ <span className="font-medium text-gray-900">{user?.name}</span> ใช่หรือไม่?
                <br />
                <span className="text-sm text-red-500">การกระทำนี้ไม่สามารถย้อนกลับได้</span>
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                >
                  ยกเลิก
                </Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={handleDelete}
                  isLoading={isDeleting}
                >
                  ลบ
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
