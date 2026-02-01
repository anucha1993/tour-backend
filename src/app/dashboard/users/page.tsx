'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Card } from '@/components/ui';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  UserCircle,
  Check,
  X,
  Shield,
  ShieldCheck,
  User as UserIcon,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { usersApi, ApiError } from '@/lib/api';

// Types
interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'staff';
  is_active: boolean;
  created_at: string;
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

// Role badge colors
const roleBadges = {
  admin: { 
    bg: 'bg-purple-50', 
    text: 'text-purple-700', 
    icon: ShieldCheck,
    label: 'ผู้ดูแลระบบ' 
  },
  manager: { 
    bg: 'bg-blue-50', 
    text: 'text-blue-700', 
    icon: Shield,
    label: 'ผู้จัดการ' 
  },
  staff: { 
    bg: 'bg-gray-100', 
    text: 'text-gray-700', 
    icon: UserIcon,
    label: 'พนักงาน' 
  },
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showActionMenu, setShowActionMenu] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch users from API
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await usersApi.list({
        page: currentPage,
        per_page: 15,
        search: search || undefined,
        role: roleFilter || undefined,
      });
      
      if (response.success && response.data) {
        setUsers(response.data.data || []);
        setMeta(response.data.meta || null);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, search, roleFilter]);

  // Initial load and when filters change
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Handle delete
  const handleDelete = async (user: User) => {
    setIsDeleting(true);
    try {
      await usersApi.delete(user.id);
      setShowDeleteModal(null);
      fetchUsers(); // Refresh list
    } catch (err) {
      if (err instanceof ApiError) {
        alert(err.message);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Stats calculation
  const stats = {
    total: meta?.total || users.length,
    admin: users.filter(u => u.role === 'admin').length,
    active: users.filter(u => u.is_active).length,
    inactive: users.filter(u => !u.is_active).length,
  };

  // Loading state
  if (isLoading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={fetchUsers}>
            <RefreshCw className="w-4 h-4" />
            ลองใหม่
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ผู้ใช้งาน</h1>
          <p className="text-gray-500 mt-1">จัดการข้อมูลผู้ใช้งานในระบบ</p>
        </div>
        <Link href="/dashboard/users/create">
          <Button>
            <Plus className="w-4 h-4" />
            เพิ่มผู้ใช้งาน
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <UserCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              <p className="text-sm text-gray-500">ทั้งหมด</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.role === 'admin').length}
              </p>
              <p className="text-sm text-gray-500">ผู้ดูแล</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.is_active).length}
              </p>
              <p className="text-sm text-gray-500">ใช้งานอยู่</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <X className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => !u.is_active).length}
              </p>
              <p className="text-sm text-gray-500">ปิดใช้งาน</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card>
        <div className="p-4 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อหรืออีเมล..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-white"
          >
            <option value="">ทุกบทบาท</option>
            <option value="admin">ผู้ดูแลระบบ</option>
            <option value="manager">ผู้จัดการ</option>
            <option value="staff">พนักงาน</option>
          </select>
        </div>
      </Card>

      {/* Table - Desktop */}
      <Card className="hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  ผู้ใช้งาน
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  บทบาท
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  สถานะ
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  วันที่สร้าง
                </th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => {
                const roleBadge = roleBadges[user.role];
                const RoleIcon = roleBadge.icon;

                return (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium ${roleBadge.bg} ${roleBadge.text}`}>
                        <RoleIcon className="w-3.5 h-3.5" />
                        {roleBadge.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-sm font-medium bg-green-50 text-green-700">
                          <Check className="w-3.5 h-3.5" />
                          ใช้งาน
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
                          <X className="w-3.5 h-3.5" />
                          ปิดใช้งาน
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-500">{user.created_at}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="relative inline-block">
                        <button
                          onClick={() => setShowActionMenu(showActionMenu === user.id ? null : user.id)}
                          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <MoreHorizontal className="w-4 h-4 text-gray-500" />
                        </button>
                        {showActionMenu === user.id && (
                          <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg border border-gray-200 shadow-lg py-1 z-10">
                            <Link
                              href={`/dashboard/users/${user.id}`}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Eye className="w-4 h-4" />
                              ดูรายละเอียด
                            </Link>
                            <Link
                              href={`/dashboard/users/${user.id}/edit`}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Edit className="w-4 h-4" />
                              แก้ไข
                            </Link>
                            <button
                              onClick={() => {
                                setShowActionMenu(null);
                                setShowDeleteModal(user);
                              }}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                              ลบ
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            แสดง <span className="font-medium">{((meta?.current_page || 1) - 1) * (meta?.per_page || 15) + 1}</span> ถึง{' '}
            <span className="font-medium">{Math.min((meta?.current_page || 1) * (meta?.per_page || 15), meta?.total || users.length)}</span> จาก{' '}
            <span className="font-medium">{meta?.total || users.length}</span> รายการ
          </p>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={!meta || meta.current_page <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            >
              ก่อนหน้า
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              disabled={!meta || meta.current_page >= meta.last_page}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              ถัดไป
            </Button>
          </div>
        </div>
      </Card>

      {/* Cards - Mobile/Tablet */}
      <div className="lg:hidden space-y-4">
        {users.map((user) => {
          const roleBadge = roleBadges[user.role];
          const RoleIcon = roleBadge.icon;

          return (
            <Card key={user.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-white font-medium text-lg">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{user.name}</h3>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
                {user.is_active ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 shrink-0">
                    <Check className="w-3 h-3" />
                    ใช้งาน
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 shrink-0">
                    <X className="w-3 h-3" />
                    ปิด
                  </span>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium ${roleBadge.bg} ${roleBadge.text}`}>
                  <RoleIcon className="w-3.5 h-3.5" />
                  {roleBadge.label}
                </span>
                <span className="text-sm text-gray-500">{user.created_at}</span>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                <Link href={`/dashboard/users/${user.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <Eye className="w-4 h-4" />
                    ดู
                  </Button>
                </Link>
                <Link href={`/dashboard/users/${user.id}/edit`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <Edit className="w-4 h-4" />
                    แก้ไข
                  </Button>
                </Link>
              </div>
            </Card>
          );
        })}

        {/* Mobile Pagination */}
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-gray-500">
            {users.length} จาก {meta?.total || users.length}
          </p>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={!meta || meta.current_page <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            >
              ก่อนหน้า
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              disabled={!meta || meta.current_page >= meta.last_page}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              ถัดไป
            </Button>
          </div>
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
                คุณต้องการลบผู้ใช้ <span className="font-medium text-gray-900">{showDeleteModal.name}</span> ใช่หรือไม่?
                <br />
                <span className="text-sm text-red-500">การกระทำนี้ไม่สามารถย้อนกลับได้</span>
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowDeleteModal(null)}
                  disabled={isDeleting}
                >
                  ยกเลิก
                </Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={() => handleDelete(showDeleteModal)}
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
