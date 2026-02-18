'use client';

import { useState, useEffect, useCallback } from 'react';
import { webMembersApi, WebMember, WebMemberStatistics } from '@/lib/api';
import { 
  Users, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  UserCheck,
  UserX,
  Shield,
  Clock,
  Mail,
  Phone,
  MoreVertical,
  Eye,
  Lock,
  Unlock,
  Key,
  Trash2,
  Download,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react';

export default function WebMembersPage() {
  const [members, setMembers] = useState<WebMember[]>([]);
  const [statistics, setStatistics] = useState<WebMemberStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    perPage: 20,
    total: 0,
  });

  // Modal states
  const [selectedMember, setSelectedMember] = useState<WebMember | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState<number | null>(null);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await webMembersApi.list({
        page: pagination.currentPage,
        per_page: pagination.perPage,
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        verified: verifiedFilter || undefined,
      });

      if (response.success && response.data) {
        setMembers(response.data.data);
        setPagination({
          currentPage: response.data.current_page,
          lastPage: response.data.last_page,
          perPage: response.data.per_page,
          total: response.data.total,
        });
      }
    } catch (error) {
      console.error('Failed to fetch members:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, pagination.perPage, searchTerm, statusFilter, verifiedFilter]);

  const fetchStatistics = async () => {
    try {
      const response = await webMembersApi.statistics();
      if (response.success && response.data) {
        setStatistics(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    fetchMembers();
  };

  const handleStatusChange = async (member: WebMember, newStatus: 'active' | 'inactive' | 'suspended') => {
    setActionLoading(true);
    try {
      const response = await webMembersApi.updateStatus(member.id, newStatus);
      if (response.success) {
        fetchMembers();
        fetchStatistics();
        setDropdownOpen(null);
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnlock = async (member: WebMember) => {
    setActionLoading(true);
    try {
      const response = await webMembersApi.unlock(member.id);
      if (response.success) {
        fetchMembers();
        setDropdownOpen(null);
      }
    } catch (error) {
      console.error('Failed to unlock member:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedMember || newPassword !== confirmPassword) return;

    setActionLoading(true);
    try {
      const response = await webMembersApi.resetPassword(
        selectedMember.id,
        newPassword,
        confirmPassword
      );
      if (response.success) {
        setShowResetPasswordModal(false);
        setNewPassword('');
        setConfirmPassword('');
        alert('รีเซ็ตรหัสผ่านสำเร็จ');
      }
    } catch (error) {
      console.error('Failed to reset password:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedMember) return;

    setActionLoading(true);
    try {
      const response = await webMembersApi.delete(selectedMember.id);
      if (response.success) {
        setShowDeleteModal(false);
        fetchMembers();
        fetchStatistics();
      }
    } catch (error) {
      console.error('Failed to delete member:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">ใช้งาน</span>;
      case 'inactive':
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">ปิดใช้งาน</span>;
      case 'suspended':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">ระงับ</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">{status}</span>;
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">สมาชิกเว็บไซต์</h1>
          <p className="text-gray-500">จัดการสมาชิกที่ลงทะเบียนผ่านหน้าเว็บไซต์</p>
        </div>
        <button
          onClick={() => webMembersApi.export({ status: statusFilter, verified: verifiedFilter })}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-300">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Users className="w-4 h-4" />
              <span className="text-xs">ทั้งหมด</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{(statistics.total ?? 0).toLocaleString()}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-300">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <UserCheck className="w-4 h-4" />
              <span className="text-xs">ใช้งาน</span>
            </div>
            <p className="text-xl font-bold text-green-600">{(statistics.active ?? 0).toLocaleString()}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-300">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <UserX className="w-4 h-4" />
              <span className="text-xs">ปิดใช้งาน</span>
            </div>
            <p className="text-xl font-bold text-gray-600">{(statistics.inactive ?? 0).toLocaleString()}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-300">
            <div className="flex items-center gap-2 text-red-600 mb-1">
              <Shield className="w-4 h-4" />
              <span className="text-xs">ระงับ</span>
            </div>
            <p className="text-xl font-bold text-red-600">{(statistics.suspended ?? 0).toLocaleString()}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-300">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <CheckCircle className="w-4 h-4" />
              <span className="text-xs">ยืนยันแล้ว</span>
            </div>
            <p className="text-xl font-bold text-blue-600">{(statistics.verified ?? 0).toLocaleString()}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-300">
            <div className="flex items-center gap-2 text-amber-600 mb-1">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs">ยังไม่ยืนยัน</span>
            </div>
            <p className="text-xl font-bold text-amber-600">{(statistics.unverified ?? 0).toLocaleString()}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-300">
            <div className="flex items-center gap-2 text-purple-600 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs">เดือนนี้</span>
            </div>
            <p className="text-xl font-bold text-purple-600">{(statistics.new_this_month ?? 0).toLocaleString()}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-300">
            <div className="flex items-center gap-2 text-indigo-600 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs">วันนี้</span>
            </div>
            <p className="text-xl font-bold text-indigo-600">{(statistics.new_today ?? 0).toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-300 mb-6">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ค้นหาชื่อ, อีเมล, เบอร์โทร..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border border-gray-300-blue-500"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPagination(prev => ({ ...prev, currentPage: 1 }));
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">ทุกสถานะ</option>
            <option value="active">ใช้งาน</option>
            <option value="inactive">ปิดใช้งาน</option>
            <option value="suspended">ระงับ</option>
          </select>
          <select
            value={verifiedFilter}
            onChange={(e) => {
              setVerifiedFilter(e.target.value);
              setPagination(prev => ({ ...prev, currentPage: 1 }));
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">ทุกการยืนยัน</option>
            <option value="1">ยืนยันแล้ว</option>
            <option value="0">ยังไม่ยืนยัน</option>
          </select>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Filter className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-300 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">สมาชิก</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ติดต่อ</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">สถานะ</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ยืนยัน</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">เข้าสู่ระบบล่าสุด</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">สมัครเมื่อ</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border border-gray-300-2 border border-gray-300-blue-600 border border-gray-300-t-transparent rounded-full animate-spin"></div>
                      <span className="text-gray-500">กำลังโหลด...</span>
                    </div>
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    ไม่พบข้อมูล
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium">
                          {member.first_name?.[0] || member.email?.[0] || '?'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">
                              {member.full_name || `${member.first_name} ${member.last_name}`}
                            </p>
                            {member.level && (
                              <span
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium"
                                style={{
                                  backgroundColor: member.level.color ? `${member.level.color}20` : '#f3f4f6',
                                  color: member.level.color || '#6b7280',
                                }}
                                title={member.level.name}
                              >
                                {member.level.icon || '🏅'} {member.level.name}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">ID: {member.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Mail className="w-3 h-3" />
                          <span className="truncate max-w-[180px]">{member.email || '-'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Phone className="w-3 h-3" />
                          <span>{member.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(member.status)}
                      {member.locked_until && new Date(member.locked_until) > new Date() && (
                        <span className="ml-1 px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded-full">
                          ล็อก
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {member.phone_verified ? (
                          <span title="โทรศัพท์ยืนยันแล้ว"><CheckCircle className="w-4 h-4 text-green-500" /></span>
                        ) : (
                          <span title="โทรศัพท์ยังไม่ยืนยัน"><XCircle className="w-4 h-4 text-gray-300" /></span>
                        )}
                        {member.email_verified ? (
                          <span title="อีเมลยืนยันแล้ว"><CheckCircle className="w-4 h-4 text-green-500" /></span>
                        ) : (
                          <span title="อีเมลยังไม่ยืนยัน"><XCircle className="w-4 h-4 text-gray-300" /></span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {member.last_login_at ? (
                        <div>
                          <p>{new Date(member.last_login_at).toLocaleDateString('th-TH')}</p>
                          <p className="text-xs text-gray-400">{member.last_login_ip}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(member.created_at).toLocaleDateString('th-TH')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="relative">
                        <button
                          onClick={() => setDropdownOpen(dropdownOpen === member.id ? null : member.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-500" />
                        </button>
                        
                        {dropdownOpen === member.id && (
                          <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-300 z-10">
                            <button
                              onClick={() => {
                                setSelectedMember(member);
                                setShowDetailModal(true);
                                setDropdownOpen(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" /> ดูรายละเอียด
                            </button>
                            <button
                              onClick={() => {
                                setSelectedMember(member);
                                setShowResetPasswordModal(true);
                                setDropdownOpen(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Key className="w-4 h-4" /> รีเซ็ตรหัสผ่าน
                            </button>
                            {member.locked_until && new Date(member.locked_until) > new Date() ? (
                              <button
                                onClick={() => handleUnlock(member)}
                                disabled={actionLoading}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-orange-600"
                              >
                                <Unlock className="w-4 h-4" /> ปลดล็อก
                              </button>
                            ) : null}
                            <hr className="my-1" />
                            {member.status === 'active' ? (
                              <button
                                onClick={() => handleStatusChange(member, 'inactive')}
                                disabled={actionLoading}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Lock className="w-4 h-4" /> ปิดใช้งาน
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStatusChange(member, 'active')}
                                disabled={actionLoading}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-green-600"
                              >
                                <Unlock className="w-4 h-4" /> เปิดใช้งาน
                              </button>
                            )}
                            {member.status !== 'suspended' ? (
                              <button
                                onClick={() => handleStatusChange(member, 'suspended')}
                                disabled={actionLoading}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                              >
                                <Shield className="w-4 h-4" /> ระงับบัญชี
                              </button>
                            ) : null}
                            <hr className="my-1" />
                            <button
                              onClick={() => {
                                setSelectedMember(member);
                                setShowDeleteModal(true);
                                setDropdownOpen(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                            >
                              <Trash2 className="w-4 h-4" /> ลบบัญชี
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && members.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-300 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              แสดง {(pagination.currentPage - 1) * pagination.perPage + 1} - {Math.min(pagination.currentPage * pagination.perPage, pagination.total)} จาก {pagination.total.toLocaleString()} รายการ
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                disabled={pagination.currentPage === 1}
                className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded">
                {pagination.currentPage} / {pagination.lastPage}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                disabled={pagination.currentPage === pagination.lastPage}
                className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border border-gray-300-b">
              <h2 className="text-lg font-bold">รายละเอียดสมาชิก</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl font-medium">
                  {selectedMember.first_name?.[0] || '?'}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{selectedMember.full_name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-gray-500">ID: {selectedMember.id}</p>
                    {selectedMember.level && (
                      <span
                        className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: selectedMember.level.color ? `${selectedMember.level.color}20` : '#f3f4f6',
                          color: selectedMember.level.color || '#6b7280',
                        }}
                      >
                        {selectedMember.level.icon || '🏅'} {selectedMember.level.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">ชื่อ</p>
                  <p className="font-medium">{selectedMember.first_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">นามสกุล</p>
                  <p className="font-medium">{selectedMember.last_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">อีเมล</p>
                  <p className="font-medium">{selectedMember.email || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">เบอร์โทร</p>
                  <p className="font-medium">{selectedMember.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">LINE ID</p>
                  <p className="font-medium">{selectedMember.line_id || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">เพศ</p>
                  <p className="font-medium">
                    {selectedMember.gender === 'male' ? 'ชาย' : 
                     selectedMember.gender === 'female' ? 'หญิง' : 
                     selectedMember.gender === 'other' ? 'อื่นๆ' : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">วันเกิด</p>
                  <p className="font-medium">
                    {selectedMember.birth_date 
                      ? new Date(selectedMember.birth_date).toLocaleDateString('th-TH')
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">สถานะ</p>
                  {getStatusBadge(selectedMember.status)}
                </div>
              </div>

              <hr />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-500">ยืนยันเบอร์โทร</p>
                  <p className={selectedMember.phone_verified ? 'text-green-600' : 'text-red-600'}>
                    {selectedMember.phone_verified ? '✓ ยืนยันแล้ว' : '✕ ยังไม่ยืนยัน'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">ยืนยันอีเมล</p>
                  <p className={selectedMember.email_verified ? 'text-green-600' : 'text-red-600'}>
                    {selectedMember.email_verified ? '✓ ยืนยันแล้ว' : '✕ ยังไม่ยืนยัน'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">ยอมรับข้อกำหนด</p>
                  <p>{selectedMember.consent_terms ? '✓' : '✕'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">ยอมรับนโยบาย</p>
                  <p>{selectedMember.consent_privacy ? '✓' : '✕'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">รับข่าวสาร</p>
                  <p>{selectedMember.consent_marketing ? '✓' : '✕'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Login ผิดพลาด</p>
                  <p>{selectedMember.failed_login_attempts} ครั้ง</p>
                </div>
              </div>

              <hr />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-500">สมัครเมื่อ</p>
                  <p>{new Date(selectedMember.created_at).toLocaleString('th-TH')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">เข้าสู่ระบบล่าสุด</p>
                  <p>{selectedMember.last_login_at 
                    ? new Date(selectedMember.last_login_at).toLocaleString('th-TH') 
                    : '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">IP ล่าสุด</p>
                  <p>{selectedMember.last_login_ip || '-'}</p>
                </div>
                {selectedMember.locked_until && (
                  <div>
                    <p className="text-xs text-gray-500">ล็อกจนถึง</p>
                    <p className="text-red-600">
                      {new Date(selectedMember.locked_until).toLocaleString('th-TH')}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="p-4 border border-gray-300-t flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPasswordModal && selectedMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md mx-4">
            <div className="p-6 border border-gray-300-b">
              <h2 className="text-lg font-bold">รีเซ็ตรหัสผ่าน</h2>
              <p className="text-sm text-gray-500">{selectedMember.full_name}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  รหัสผ่านใหม่
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="รหัสผ่านอย่างน้อย 8 ตัวอักษร"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ยืนยันรหัสผ่าน
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="ยืนยันรหัสผ่านอีกครั้ง"
                />
              </div>
              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-sm text-red-600">รหัสผ่านไม่ตรงกัน</p>
              )}
            </div>
            <div className="p-4 border border-gray-300-t flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowResetPasswordModal(false);
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleResetPassword}
                disabled={actionLoading || !newPassword || newPassword !== confirmPassword}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {actionLoading ? 'กำลังบันทึก...' : 'รีเซ็ตรหัสผ่าน'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md mx-4">
            <div className="p-6 border border-gray-300-b">
              <h2 className="text-lg font-bold text-red-600">ยืนยันการลบ</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-600">
                คุณต้องการลบบัญชีสมาชิก <strong>{selectedMember.full_name}</strong> ใช่หรือไม่?
              </p>
              <p className="text-sm text-red-600 mt-2">
                การดำเนินการนี้ไม่สามารถย้อนกลับได้
              </p>
            </div>
            <div className="p-4 border border-gray-300-t flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? 'กำลังลบ...' : 'ลบบัญชี'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
