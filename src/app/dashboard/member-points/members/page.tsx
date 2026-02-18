'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  memberPointsApi,
  MemberWithPoints,
  MemberLevel,
  PointTransaction,
  MemberPointDetail,
} from '@/lib/api';
import {
  Users,
  Search,
  Trophy,
  ArrowLeft,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Plus,
  Minus,
  X,
  ArrowUpCircle,
  ArrowDownCircle,
  Clock,
  AlertTriangle,
  Settings,
  Filter,
} from 'lucide-react';
import Link from 'next/link';

export default function MemberPointsMembersPage() {
  const [members, setMembers] = useState<MemberWithPoints[]>([]);
  const [levels, setLevels] = useState<MemberLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<number | undefined>();
  const [sortBy, setSortBy] = useState('lifetime_spending');
  const [sortDir, setSortDir] = useState('desc');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    perPage: 20,
    total: 0,
  });

  // Detail modal
  const [detailData, setDetailData] = useState<MemberPointDetail | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // Transaction history modal
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [showTransactions, setShowTransactions] = useState(false);
  const [txnLoading, setTxnLoading] = useState(false);
  const [txnMemberId, setTxnMemberId] = useState<number | null>(null);
  const [txnMemberName, setTxnMemberName] = useState('');
  const [txnPagination, setTxnPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
  });

  // Adjust modal
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjustMemberId, setAdjustMemberId] = useState<number | null>(null);
  const [adjustMemberName, setAdjustMemberName] = useState('');
  const [adjustPoints, setAdjustPoints] = useState<number>(0);
  const [adjustDescription, setAdjustDescription] = useState('');
  const [adjusting, setAdjusting] = useState(false);
  const [adjustError, setAdjustError] = useState('');

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await memberPointsApi.listMembers({
        page: pagination.currentPage,
        per_page: pagination.perPage,
        search: searchTerm || undefined,
        level_id: levelFilter,
        sort_by: sortBy,
        sort_dir: sortDir,
      });
      if (res.success && res.data) {
        setMembers(res.data.data);
        setPagination({
          currentPage: res.data.current_page,
          lastPage: res.data.last_page,
          perPage: res.data.per_page,
          total: res.data.total,
        });
      }
    } catch (err) {
      console.error('Failed to fetch members:', err);
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, pagination.perPage, searchTerm, levelFilter, sortBy, sortDir]);

  const fetchLevels = useCallback(async () => {
    try {
      const res = await memberPointsApi.listLevels();
      if (res.success && res.data) {
        setLevels(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch levels:', err);
    }
  }, []);

  useEffect(() => {
    fetchLevels();
  }, [fetchLevels]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination({ ...pagination, currentPage: 1 });
  };

  const openDetail = async (memberId: number) => {
    setDetailLoading(true);
    setShowDetail(true);
    try {
      const res = await memberPointsApi.getMemberDetail(memberId);
      if (res.success && res.data) {
        setDetailData(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const openTransactions = async (memberId: number, memberName: string) => {
    setTxnMemberId(memberId);
    setTxnMemberName(memberName);
    setShowTransactions(true);
    setTxnLoading(true);
    try {
      const res = await memberPointsApi.getMemberTransactions(memberId, {
        page: 1,
        per_page: 20,
      });
      if (res.success && res.data) {
        setTransactions(res.data.data);
        setTxnPagination({
          currentPage: res.data.current_page,
          lastPage: res.data.last_page,
          total: res.data.total,
        });
      }
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setTxnLoading(false);
    }
  };

  const loadTxnPage = async (page: number) => {
    if (!txnMemberId) return;
    setTxnLoading(true);
    try {
      const res = await memberPointsApi.getMemberTransactions(txnMemberId, {
        page,
        per_page: 20,
      });
      if (res.success && res.data) {
        setTransactions(res.data.data);
        setTxnPagination({
          currentPage: res.data.current_page,
          lastPage: res.data.last_page,
          total: res.data.total,
        });
      }
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setTxnLoading(false);
    }
  };

  const openAdjust = (memberId: number, memberName: string) => {
    setAdjustMemberId(memberId);
    setAdjustMemberName(memberName);
    setAdjustPoints(0);
    setAdjustDescription('');
    setAdjustError('');
    setShowAdjust(true);
  };

  const handleAdjust = async () => {
    if (!adjustMemberId || adjustPoints === 0) {
      setAdjustError('กรุณาระบุจำนวนคะแนน (ไม่ใช่ 0)');
      return;
    }
    if (!adjustDescription.trim()) {
      setAdjustError('กรุณาระบุเหตุผล');
      return;
    }
    setAdjusting(true);
    setAdjustError('');
    try {
      const res = await memberPointsApi.adjustMemberPoints(adjustMemberId, {
        points: adjustPoints,
        description: adjustDescription,
      });
      if (res.success) {
        setShowAdjust(false);
        fetchMembers();
      } else {
        setAdjustError((res as { message?: string }).message || 'เกิดข้อผิดพลาด');
      }
    } catch (err: unknown) {
      setAdjustError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setAdjusting(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'earn':
        return 'text-green-600 bg-green-50';
      case 'spend':
        return 'text-red-600 bg-red-50';
      case 'expire':
        return 'text-gray-500 bg-gray-50';
      case 'adjust':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'earn':
        return 'ได้รับ';
      case 'spend':
        return 'ใช้';
      case 'expire':
        return 'หมดอายุ';
      case 'adjust':
        return 'ปรับ';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/member-points" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-7 h-7 text-blue-500" />
              คะแนนสมาชิก
            </h1>
            <p className="text-gray-500 mt-1">
              ดูและจัดการคะแนนของสมาชิก ({pagination.total.toLocaleString()} คน)
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาชื่อ, อีเมล, เบอร์โทร..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </form>
          <select
            value={levelFilter || ''}
            onChange={(e) => {
              setLevelFilter(e.target.value ? parseInt(e.target.value) : undefined);
              setPagination({ ...pagination, currentPage: 1 });
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">ทุกระดับ</option>
            {levels.map((lvl) => (
              <option key={lvl.id} value={lvl.id}>
                {lvl.icon} {lvl.name}
              </option>
            ))}
          </select>
          <select
            value={`${sortBy}:${sortDir}`}
            onChange={(e) => {
              const [sb, sd] = e.target.value.split(':');
              setSortBy(sb);
              setSortDir(sd);
              setPagination({ ...pagination, currentPage: 1 });
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="lifetime_spending:desc">ยอดสั่งซื้อ (มาก→น้อย)</option>
            <option value="lifetime_spending:asc">ยอดสั่งซื้อ (น้อย→มาก)</option>
            <option value="lifetime_points:desc">คะแนนสะสม (มาก→น้อย)</option>
            <option value="lifetime_points:asc">คะแนนสะสม (น้อย→มาก)</option>
            <option value="total_points:desc">คะแนนคงเหลือ (มาก→น้อย)</option>
            <option value="total_points:asc">คะแนนคงเหลือ (น้อย→มาก)</option>
            <option value="created_at:desc">สมัครล่าสุด</option>
          </select>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-12 text-gray-500">ไม่พบสมาชิก</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">สมาชิก</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">ระดับ</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">
                      คะแนนคงเหลือ
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">
                      คะแนนสะสม
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">
                      ยอดสั่งซื้อสะสม
                    </th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">สถานะ</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {members.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">
                            {member.first_name} {member.last_name}
                          </p>
                          <p className="text-xs text-gray-500">{member.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {member.level ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                            {member.level.icon || '🏅'} {member.level.name}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-bold text-gray-900">
                          {member.total_points.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-gray-600">
                          {member.lifetime_points.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-semibold text-emerald-700">
                          ฿{Number(member.lifetime_spending).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                            member.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : member.status === 'suspended'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {member.status === 'active'
                            ? 'ใช้งาน'
                            : member.status === 'suspended'
                              ? 'ระงับ'
                              : 'ปิด'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openDetail(member.id)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="ดูรายละเอียด"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              openTransactions(
                                member.id,
                                `${member.first_name} ${member.last_name}`
                              )
                            }
                            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                            title="ประวัติธุรกรรม"
                          >
                            <Clock className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              openAdjust(
                                member.id,
                                `${member.first_name} ${member.last_name}`
                              )
                            }
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg"
                            title="ปรับคะแนน"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.lastPage > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  หน้า {pagination.currentPage} / {pagination.lastPage} (ทั้งหมด{' '}
                  {pagination.total.toLocaleString()} คน)
                </p>
                <div className="flex gap-1">
                  <button
                    onClick={() =>
                      setPagination({ ...pagination, currentPage: pagination.currentPage - 1 })
                    }
                    disabled={pagination.currentPage <= 1}
                    className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() =>
                      setPagination({ ...pagination, currentPage: pagination.currentPage + 1 })
                    }
                    disabled={pagination.currentPage >= pagination.lastPage}
                    className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-30"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {showDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">รายละเอียดคะแนน</h3>
              <button
                onClick={() => setShowDetail(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {detailLoading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : detailData ? (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">
                    {detailData.member.first_name} {detailData.member.last_name}
                  </p>
                  <p className="text-sm text-gray-500">{detailData.member.email}</p>
                </div>

                {/* Level */}
                {detailData.summary.level && (
                  <div className="text-center">
                    <span className="text-3xl">{detailData.summary.level.icon || '🏅'}</span>
                    <p className="font-semibold text-gray-900 mt-1">
                      {detailData.summary.level.name}
                    </p>
                  </div>
                )}

                {/* Points */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-green-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-green-600">คะแนนคงเหลือ</p>
                    <p className="text-xl font-bold text-green-700">
                      {detailData.summary.total_points.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-blue-600">คะแนนสะสมทั้งหมด</p>
                    <p className="text-xl font-bold text-blue-700">
                      {detailData.summary.lifetime_points.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-3 text-center col-span-2">
                    <p className="text-xs text-emerald-600">ยอดสั่งซื้อสะสม</p>
                    <p className="text-xl font-bold text-emerald-700">
                      ฿{Number(detailData.summary.lifetime_spending).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-amber-600">ได้รับเดือนนี้</p>
                    <p className="text-xl font-bold text-amber-700">
                      +{detailData.summary.this_month_earned.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-red-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-red-600">กำลังหมดอายุ (30 วัน)</p>
                    <p className="text-xl font-bold text-red-700">
                      {detailData.summary.expiring_points.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Next level progress */}
                {detailData.summary.next_level && (
                  <div className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-700">
                        ถัดไป: {detailData.summary.next_level.icon}{' '}
                        {detailData.summary.next_level.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {detailData.summary.next_level.progress_percent.toFixed(1)}%
                      </p>
                    </div>
                    <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all"
                        style={{
                          width: `${Math.min(detailData.summary.next_level.progress_percent, 100)}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      ต้องการอีก ฿{Number(detailData.summary.next_level.spending_needed).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                      เพื่ออัปเกรด
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-center text-gray-500">ไม่พบข้อมูล</p>
            )}
          </div>
        </div>
      )}

      {/* Transactions Modal */}
      {showTransactions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-2xl w-full mx-4 my-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">ประวัติธุรกรรม</h3>
                <p className="text-sm text-gray-500">{txnMemberName}</p>
              </div>
              <button
                onClick={() => setShowTransactions(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {txnLoading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : transactions.length === 0 ? (
              <p className="text-center py-8 text-gray-500">ไม่มีประวัติธุรกรรม</p>
            ) : (
              <>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {transactions.map((txn) => (
                    <div
                      key={txn.id}
                      className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${getTypeColor(txn.type)}`}
                        >
                          {txn.type === 'earn' && <ArrowUpCircle className="w-4 h-4" />}
                          {txn.type === 'spend' && <ArrowDownCircle className="w-4 h-4" />}
                          {txn.type === 'expire' && <AlertTriangle className="w-4 h-4" />}
                          {txn.type === 'adjust' && <Settings className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {txn.description || getTypeLabel(txn.type)}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{new Date(txn.created_at).toLocaleDateString('th-TH')}</span>
                            <span>{new Date(txn.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
                            {txn.rule && (
                              <span className="px-1.5 py-0.5 bg-gray-100 rounded">
                                {txn.rule.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-bold ${
                            txn.points > 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {txn.points > 0 ? '+' : ''}
                          {txn.points.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          คงเหลือ {txn.balance_after.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                {txnPagination.lastPage > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-500">
                      หน้า {txnPagination.currentPage} / {txnPagination.lastPage}
                    </p>
                    <div className="flex gap-1">
                      <button
                        onClick={() => loadTxnPage(txnPagination.currentPage - 1)}
                        disabled={txnPagination.currentPage <= 1}
                        className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-30"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => loadTxnPage(txnPagination.currentPage + 1)}
                        disabled={txnPagination.currentPage >= txnPagination.lastPage}
                        className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-30"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Adjust Points Modal */}
      {showAdjust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">ปรับคะแนนสมาชิก</h3>
                <p className="text-sm text-gray-500">{adjustMemberName}</p>
              </div>
              <button
                onClick={() => setShowAdjust(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {adjustError && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                {adjustError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  จำนวนคะแนน
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setAdjustPoints((v) => (v > 0 ? -Math.abs(v) : v))
                    }
                    className={`px-3 py-2 rounded-lg text-sm font-medium ${
                      adjustPoints < 0
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    value={Math.abs(adjustPoints) || ''}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setAdjustPoints(adjustPoints < 0 ? -val : val);
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-center font-bold text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                    min="0"
                  />
                  <button
                    onClick={() =>
                      setAdjustPoints((v) => (v < 0 ? Math.abs(v) : Math.max(v, 0)))
                    }
                    className={`px-3 py-2 rounded-lg text-sm font-medium ${
                      adjustPoints >= 0
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {adjustPoints > 0
                    ? `จะเพิ่ม ${adjustPoints.toLocaleString()} คะแนน`
                    : adjustPoints < 0
                      ? `จะหัก ${Math.abs(adjustPoints).toLocaleString()} คะแนน`
                      : 'ระบุจำนวนคะแนนที่ต้องการปรับ'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  เหตุผล *
                </label>
                <textarea
                  value={adjustDescription}
                  onChange={(e) => setAdjustDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="ระบุเหตุผลในการปรับคะแนน..."
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3 justify-end">
              <button
                onClick={() => setShowAdjust(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleAdjust}
                disabled={adjusting || adjustPoints === 0}
                className={`px-6 py-2 text-sm text-white rounded-lg flex items-center gap-2 disabled:opacity-50 ${
                  adjustPoints < 0
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {adjusting && <Loader2 className="w-4 h-4 animate-spin" />}
                {adjustPoints > 0 ? 'เพิ่มคะแนน' : adjustPoints < 0 ? 'หักคะแนน' : 'ปรับคะแนน'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
