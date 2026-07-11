'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { webMembersApi, WebMember, WebMemberStatistics } from '@/lib/api';
import {
  Users,
  Search,
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
  Trophy,
  Sparkles,
  Coins,
  TrendingUp,
  RefreshCw,
  X,
} from 'lucide-react';

/* ---------- helpers ---------- */
const initials = (m: WebMember) =>
  (m.first_name?.[0] || m.email?.[0] || '?').toUpperCase();

const fmt = (n?: number | null) =>
  n == null ? '0' : Number(n).toLocaleString('th-TH');

const fmtMoney = (n?: number | null) =>
  n == null ? '฿0' : `฿${Number(n).toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const relTime = (d?: string | null) => {
  if (!d) return '-';
  const diff = Date.now() - new Date(d).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'เมื่อสักครู่';
  if (min < 60) return `${min} นาทีที่แล้ว`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} ชม.ที่แล้ว`;
  const d2 = Math.floor(h / 24);
  if (d2 < 30) return `${d2} วันที่แล้ว`;
  return new Date(d).toLocaleDateString('th-TH');
};

const StatusPill = ({ status }: { status: string }) => {
  const map: Record<string, { label: string; cls: string; dot: string }> = {
    active:    { label: 'ใช้งาน',   cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500' },
    inactive:  { label: 'ปิดใช้งาน', cls: 'bg-gray-50 text-gray-700 ring-gray-200',         dot: 'bg-gray-400' },
    suspended: { label: 'ระงับ',     cls: 'bg-rose-50 text-rose-700 ring-rose-200',         dot: 'bg-rose-500' },
  };
  const s = map[status] ?? map.inactive;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ring-1 ${s.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
};

const LevelChip = ({ level }: { level?: WebMember['level'] }) => {
  if (!level) return null;
  const c = level.color || '#f59e0b';
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-medium ring-1"
      style={{ backgroundColor: `${c}18`, color: c, borderColor: `${c}40` }}
      title={level.name}
    >
      <span>{level.icon || '🏅'}</span>
      {level.name}
    </span>
  );
};

const StatCard = ({
  icon: Icon, label, value, gradient, iconBg,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  gradient: string;
  iconBg: string;
}) => (
  <div className={`relative overflow-hidden rounded-2xl p-5 text-white shadow-sm ${gradient}`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-white/80">{label}</p>
        <p className="mt-1 text-3xl font-bold tracking-tight">{fmt(value)}</p>
      </div>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconBg}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
    <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-white/10 blur-2xl" />
  </div>
);

/* ---------- page ---------- */
export default function WebMembersPage() {
  const [members, setMembers] = useState<WebMember[]>([]);
  const [statistics, setStatistics] = useState<WebMemberStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState('');
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, perPage: 20, total: 0 });

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
        setPagination((p) => ({
          ...p,
          currentPage: response.data!.current_page,
          lastPage: response.data!.last_page,
          perPage: response.data!.per_page,
          total: response.data!.total,
        }));
      }
    } catch (e) {
      console.error('Failed to fetch members:', e);
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, pagination.perPage, searchTerm, statusFilter, verifiedFilter]);

  const fetchStatistics = async () => {
    try {
      const r = await webMembersApi.statistics();
      if (r.success && r.data) setStatistics(r.data);
    } catch (e) {
      console.error('Failed to fetch statistics:', e);
    }
  };

  useEffect(() => { fetchMembers(); }, [fetchMembers]);
  useEffect(() => { fetchStatistics(); }, []);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setPagination((p) => ({ ...p, currentPage: 1 }));
      fetchMembers();
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const handleStatusChange = async (m: WebMember, s: 'active' | 'inactive' | 'suspended') => {
    setActionLoading(true);
    try {
      const r = await webMembersApi.updateStatus(m.id, s);
      if (r.success) { fetchMembers(); fetchStatistics(); setDropdownOpen(null); }
    } finally { setActionLoading(false); }
  };

  const handleUnlock = async (m: WebMember) => {
    setActionLoading(true);
    try {
      const r = await webMembersApi.unlock(m.id);
      if (r.success) { fetchMembers(); setDropdownOpen(null); }
    } finally { setActionLoading(false); }
  };

  const handleResetPassword = async () => {
    if (!selectedMember || newPassword !== confirmPassword) return;
    setActionLoading(true);
    try {
      const r = await webMembersApi.resetPassword(selectedMember.id, newPassword, confirmPassword);
      if (r.success) {
        setShowResetPasswordModal(false);
        setNewPassword(''); setConfirmPassword('');
        alert('รีเซ็ตรหัสผ่านสำเร็จ');
      }
    } finally { setActionLoading(false); }
  };

  const handleDelete = async () => {
    if (!selectedMember) return;
    setActionLoading(true);
    try {
      const r = await webMembersApi.delete(selectedMember.id);
      if (r.success) { setShowDeleteModal(false); fetchMembers(); fetchStatistics(); }
    } finally { setActionLoading(false); }
  };

  const filterChips = useMemo(() => ([
    { key: '',          label: 'ทั้งหมด' },
    { key: 'active',    label: 'ใช้งาน' },
    { key: 'inactive',  label: 'ปิดใช้งาน' },
    { key: 'suspended', label: 'ระงับ' },
  ]), []);

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">สมาชิกเว็บไซต์</h1>
            <p className="text-sm text-gray-500">จัดการสมาชิกที่ลงทะเบียนผ่านหน้าเว็บ • {fmt(pagination.total)} คน</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/member-points/members"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white ring-1 ring-amber-200 text-amber-700 rounded-xl hover:bg-amber-50 transition"
          >
            <Trophy className="w-4 h-4" />
            จัดการคะแนน
          </Link>
          <button
            onClick={() => { fetchMembers(); fetchStatistics(); }}
            className="inline-flex items-center gap-2 px-3 py-2 bg-white ring-1 ring-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition"
            title="รีเฟรช"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => webMembersApi.export({ status: statusFilter, verified: verifiedFilter })}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:opacity-90 transition shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Statistics — 4 hero cards */}
      {statistics && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <StatCard icon={Users}       label="สมาชิกทั้งหมด" value={statistics.total ?? 0}          gradient="bg-gradient-to-br from-blue-500 to-blue-600"       iconBg="bg-white/20" />
            <StatCard icon={UserCheck}   label="ใช้งาน"        value={statistics.active ?? 0}         gradient="bg-gradient-to-br from-emerald-500 to-green-600"    iconBg="bg-white/20" />
            <StatCard icon={CheckCircle} label="ยืนยันแล้ว"    value={statistics.verified ?? 0}       gradient="bg-gradient-to-br from-violet-500 to-purple-600"    iconBg="bg-white/20" />
            <StatCard icon={Sparkles}    label="สมัครเดือนนี้" value={statistics.new_this_month ?? 0} gradient="bg-gradient-to-br from-amber-500 to-orange-600"     iconBg="bg-white/20" />
          </div>

          {/* Mini stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="flex items-center gap-3 bg-white p-3 rounded-xl ring-1 ring-gray-200">
              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center"><UserX className="w-4 h-4 text-gray-600" /></div>
              <div><p className="text-xs text-gray-500">ปิดใช้งาน</p><p className="font-semibold text-gray-900">{fmt(statistics.inactive)}</p></div>
            </div>
            <div className="flex items-center gap-3 bg-white p-3 rounded-xl ring-1 ring-gray-200">
              <div className="w-9 h-9 rounded-lg bg-rose-100 flex items-center justify-center"><Shield className="w-4 h-4 text-rose-600" /></div>
              <div><p className="text-xs text-gray-500">ระงับ</p><p className="font-semibold text-rose-600">{fmt(statistics.suspended)}</p></div>
            </div>
            <div className="flex items-center gap-3 bg-white p-3 rounded-xl ring-1 ring-gray-200">
              <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center"><AlertTriangle className="w-4 h-4 text-amber-600" /></div>
              <div><p className="text-xs text-gray-500">ยังไม่ยืนยัน</p><p className="font-semibold text-amber-600">{fmt(statistics.unverified)}</p></div>
            </div>
            <div className="flex items-center gap-3 bg-white p-3 rounded-xl ring-1 ring-gray-200">
              <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center"><Clock className="w-4 h-4 text-indigo-600" /></div>
              <div><p className="text-xs text-gray-500">สมัครวันนี้</p><p className="font-semibold text-indigo-600">{fmt(statistics.new_today)}</p></div>
            </div>
          </div>
        </>
      )}

      {/* Search + Filter chips */}
      <div className="bg-white rounded-2xl ring-1 ring-gray-200 p-4 mb-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาชื่อ, อีเมล, เบอร์โทร..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {filterChips.map((c) => (
              <button
                key={c.key || 'all'}
                onClick={() => { setStatusFilter(c.key); setPagination((p) => ({ ...p, currentPage: 1 })); }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition ring-1 ${
                  statusFilter === c.key
                    ? 'bg-blue-600 text-white ring-blue-600'
                    : 'bg-white text-gray-600 ring-gray-200 hover:bg-gray-50'
                }`}
              >
                {c.label}
              </button>
            ))}
            <div className="h-6 w-px bg-gray-200 mx-1" />
            {[
              { key: '',  label: 'ทั้งหมด' },
              { key: '1', label: 'ยืนยันแล้ว' },
              { key: '0', label: 'ยังไม่ยืนยัน' },
            ].map((c) => (
              <button
                key={c.key || 'all-v'}
                onClick={() => { setVerifiedFilter(c.key); setPagination((p) => ({ ...p, currentPage: 1 })); }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition ring-1 ${
                  verifiedFilter === c.key
                    ? 'bg-violet-600 text-white ring-violet-600'
                    : 'bg-white text-gray-600 ring-gray-200 hover:bg-gray-50'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl ring-1 ring-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/80">
              <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="px-5 py-3 text-left">สมาชิก</th>
                <th className="px-5 py-3 text-left">ติดต่อ</th>
                <th className="px-5 py-3 text-left">คะแนน / ยอดใช้จ่าย</th>
                <th className="px-5 py-3 text-left">สถานะ</th>
                <th className="px-5 py-3 text-left">ยืนยัน</th>
                <th className="px-5 py-3 text-left">กิจกรรม</th>
                <th className="px-5 py-3 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <div className="inline-flex items-center gap-2 text-gray-500">
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      กำลังโหลด...
                    </div>
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <div className="inline-flex flex-col items-center gap-2 text-gray-400">
                      <Users className="w-10 h-10 opacity-40" />
                      <p>ไม่พบสมาชิก</p>
                    </div>
                  </td>
                </tr>
              ) : (
                members.map((m) => {
                  const isLocked = !!m.locked_until && new Date(m.locked_until) > new Date();
                  return (
                    <tr key={m.id} className="hover:bg-blue-50/30 transition">
                      {/* member */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {m.avatar ? (
                            <Image
                              src={m.avatar} alt={m.first_name || 'avatar'}
                              width={40} height={40}
                              className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow"
                              unoptimized
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold shadow">
                              {initials(m)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-gray-900 text-sm truncate max-w-[180px]">
                                {m.full_name || `${m.first_name} ${m.last_name}`}
                              </p>
                              <LevelChip level={m.level} />
                            </div>
                            <p className="text-[11px] text-gray-400">ID: {m.id}</p>
                          </div>
                        </div>
                      </td>

                      {/* contact */}
                      <td className="px-5 py-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <Mail className="w-3 h-3 text-gray-400" />
                            <span className="truncate max-w-[200px]">{m.email || '-'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <Phone className="w-3 h-3 text-gray-400" />
                            <span>{m.phone || '-'}</span>
                          </div>
                        </div>
                      </td>

                      {/* points */}
                      <td className="px-5 py-3">
                        <Link
                          href={`/dashboard/member-points/members?search=${encodeURIComponent(m.email || m.phone || '')}`}
                          className="group block"
                        >
                          <div className="flex items-center gap-1.5 text-amber-700">
                            <Coins className="w-3.5 h-3.5" />
                            <span className="text-sm font-semibold group-hover:underline">
                              {fmt(m.total_points)} <span className="text-[11px] font-normal text-gray-400">pts</span>
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                            <TrendingUp className="w-3 h-3" />
                            <span>{fmtMoney(m.lifetime_spending)}</span>
                          </div>
                        </Link>
                      </td>

                      {/* status */}
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <StatusPill status={m.status} />
                          {isLocked && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700 ring-1 ring-orange-200">
                              <Lock className="w-3 h-3" /> ล็อก
                            </span>
                          )}
                        </div>
                      </td>

                      {/* verify */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1">
                          <span title={m.phone_verified ? 'โทรศัพท์ยืนยันแล้ว' : 'โทรศัพท์ยังไม่ยืนยัน'}
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${m.phone_verified ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-400'}`}>
                            <Phone className="w-2.5 h-2.5" />
                            {m.phone_verified ? '✓' : '✕'}
                          </span>
                          <span title={m.email_verified ? 'อีเมลยืนยันแล้ว' : 'อีเมลยังไม่ยืนยัน'}
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${m.email_verified ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-400'}`}>
                            <Mail className="w-2.5 h-2.5" />
                            {m.email_verified ? '✓' : '✕'}
                          </span>
                        </div>
                      </td>

                      {/* activity */}
                      <td className="px-5 py-3">
                        <div className="text-xs text-gray-600">
                          <p className="flex items-center gap-1"><Clock className="w-3 h-3 text-gray-400" /> {relTime(m.last_login_at)}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">สมัคร {new Date(m.created_at).toLocaleDateString('th-TH')}</p>
                        </div>
                      </td>

                      {/* actions */}
                      <td className="px-5 py-3 text-right">
                        <div className="relative inline-block">
                          <button
                            onClick={() => setDropdownOpen(dropdownOpen === m.id ? null : m.id)}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                          >
                            <MoreVertical className="w-4 h-4 text-gray-500" />
                          </button>
                          {dropdownOpen === m.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(null)} />
                              <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl shadow-lg ring-1 ring-gray-200 z-20 overflow-hidden">
                                <button
                                  onClick={() => { setSelectedMember(m); setShowDetailModal(true); setDropdownOpen(null); }}
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <Eye className="w-4 h-4 text-gray-500" /> ดูรายละเอียด
                                </button>
                                <Link
                                  href={`/dashboard/member-points/members?search=${encodeURIComponent(m.email || m.phone || '')}`}
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-amber-700"
                                  onClick={() => setDropdownOpen(null)}
                                >
                                  <Trophy className="w-4 h-4" /> จัดการคะแนน
                                </Link>
                                <button
                                  onClick={() => { setSelectedMember(m); setShowResetPasswordModal(true); setDropdownOpen(null); }}
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <Key className="w-4 h-4 text-gray-500" /> รีเซ็ตรหัสผ่าน
                                </button>
                                {isLocked && (
                                  <button
                                    onClick={() => handleUnlock(m)}
                                    disabled={actionLoading}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-orange-600"
                                  >
                                    <Unlock className="w-4 h-4" /> ปลดล็อก
                                  </button>
                                )}
                                <div className="h-px bg-gray-100" />
                                {m.status === 'active' ? (
                                  <button
                                    onClick={() => handleStatusChange(m, 'inactive')}
                                    disabled={actionLoading}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                                  >
                                    <Lock className="w-4 h-4 text-gray-500" /> ปิดใช้งาน
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleStatusChange(m, 'active')}
                                    disabled={actionLoading}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-emerald-600"
                                  >
                                    <Unlock className="w-4 h-4" /> เปิดใช้งาน
                                  </button>
                                )}
                                {m.status !== 'suspended' && (
                                  <button
                                    onClick={() => handleStatusChange(m, 'suspended')}
                                    disabled={actionLoading}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                                  >
                                    <Shield className="w-4 h-4" /> ระงับบัญชี
                                  </button>
                                )}
                                <div className="h-px bg-gray-100" />
                                <button
                                  onClick={() => { setSelectedMember(m); setShowDeleteModal(true); setDropdownOpen(null); }}
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-2 text-red-600"
                                >
                                  <Trash2 className="w-4 h-4" /> ลบบัญชี
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && members.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/40">
            <p className="text-xs text-gray-500">
              แสดง <span className="font-semibold text-gray-700">{(pagination.currentPage - 1) * pagination.perPage + 1}</span>–
              <span className="font-semibold text-gray-700">{Math.min(pagination.currentPage * pagination.perPage, pagination.total)}</span>
              {' '}จาก <span className="font-semibold text-gray-700">{pagination.total.toLocaleString()}</span> รายการ
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPagination((p) => ({ ...p, currentPage: p.currentPage - 1 }))}
                disabled={pagination.currentPage === 1}
                className="p-1.5 rounded-lg hover:bg-white ring-1 ring-transparent hover:ring-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 bg-white ring-1 ring-gray-200 rounded-lg text-xs font-medium">
                หน้า {pagination.currentPage} / {pagination.lastPage}
              </span>
              <button
                onClick={() => setPagination((p) => ({ ...p, currentPage: p.currentPage + 1 }))}
                disabled={pagination.currentPage === pagination.lastPage}
                className="p-1.5 rounded-lg hover:bg-white ring-1 ring-transparent hover:ring-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedMember && (
        <Modal onClose={() => setShowDetailModal(false)} widthCls="max-w-2xl">
          <div className="p-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-2xl relative">
            <button onClick={() => setShowDetailModal(false)} className="absolute top-4 right-4 p-1.5 hover:bg-white/20 rounded-lg">
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-4">
              {selectedMember.avatar ? (
                <Image src={selectedMember.avatar} alt="" width={64} height={64} className="w-16 h-16 rounded-full object-cover ring-4 ring-white/30" unoptimized />
              ) : (
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold ring-4 ring-white/20">
                  {initials(selectedMember)}
                </div>
              )}
              <div>
                <h3 className="text-xl font-bold">{selectedMember.full_name}</h3>
                <div className="flex items-center gap-2 mt-1 text-sm text-white/90">
                  <span>ID: {selectedMember.id}</span>
                  {selectedMember.level && (
                    <>
                      <span>•</span>
                      <span>{selectedMember.level.icon || '🏅'} {selectedMember.level.name}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* points summary strip */}
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="bg-white/15 backdrop-blur rounded-xl px-3 py-2">
                <p className="text-[11px] text-white/70">คะแนนคงเหลือ</p>
                <p className="text-lg font-bold">{fmt(selectedMember.total_points)}</p>
              </div>
              <div className="bg-white/15 backdrop-blur rounded-xl px-3 py-2">
                <p className="text-[11px] text-white/70">สะสมตลอดชีพ</p>
                <p className="text-lg font-bold">{fmt(selectedMember.lifetime_points)}</p>
              </div>
              <div className="bg-white/15 backdrop-blur rounded-xl px-3 py-2">
                <p className="text-[11px] text-white/70">ยอดใช้จ่ายรวม</p>
                <p className="text-lg font-bold">{fmtMoney(selectedMember.lifetime_spending)}</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
            <Section title="ข้อมูลติดต่อ">
              <Field label="อีเมล" value={selectedMember.email} />
              <Field label="เบอร์โทร" value={selectedMember.phone} />
              <Field label="LINE ID" value={selectedMember.line_id} />
              <Field label="เพศ" value={selectedMember.gender === 'male' ? 'ชาย' : selectedMember.gender === 'female' ? 'หญิง' : selectedMember.gender === 'other' ? 'อื่นๆ' : null} />
              <Field label="วันเกิด" value={selectedMember.birth_date ? new Date(selectedMember.birth_date).toLocaleDateString('th-TH') : null} />
              <Field label="สถานะ" value={<StatusPill status={selectedMember.status} />} />
            </Section>

            <Section title="ยืนยันตัวตน & ยินยอม">
              <Field label="ยืนยันเบอร์โทร" value={<VerifyBadge ok={selectedMember.phone_verified} />} />
              <Field label="ยืนยันอีเมล" value={<VerifyBadge ok={selectedMember.email_verified} />} />
              <Field label="ยอมรับข้อกำหนด" value={<VerifyBadge ok={selectedMember.consent_terms} />} />
              <Field label="ยอมรับนโยบาย" value={<VerifyBadge ok={selectedMember.consent_privacy} />} />
              <Field label="รับข่าวสาร" value={<VerifyBadge ok={selectedMember.consent_marketing} />} />
              <Field label="Login ผิดพลาด" value={`${selectedMember.failed_login_attempts} ครั้ง`} />
            </Section>

            <Section title="กิจกรรม">
              <Field label="สมัครเมื่อ" value={new Date(selectedMember.created_at).toLocaleString('th-TH')} />
              <Field label="เข้าล่าสุด" value={selectedMember.last_login_at ? new Date(selectedMember.last_login_at).toLocaleString('th-TH') : null} />
              <Field label="IP ล่าสุด" value={selectedMember.last_login_ip} />
              {selectedMember.locked_until && (
                <Field label="ล็อกจนถึง" value={<span className="text-red-600">{new Date(selectedMember.locked_until).toLocaleString('th-TH')}</span>} />
              )}
            </Section>
          </div>

          <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/60">
            <Link
              href={`/dashboard/member-points/members?search=${encodeURIComponent(selectedMember.email || selectedMember.phone || '')}`}
              className="inline-flex items-center gap-2 px-3 py-2 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 text-sm ring-1 ring-amber-200"
            >
              <Trophy className="w-4 h-4" /> ไปหน้าคะแนน
            </Link>
            <button
              onClick={() => setShowDetailModal(false)}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black text-sm"
            >
              ปิด
            </button>
          </div>
        </Modal>
      )}

      {/* Reset password Modal */}
      {showResetPasswordModal && selectedMember && (
        <Modal onClose={() => { setShowResetPasswordModal(false); setNewPassword(''); setConfirmPassword(''); }}>
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Key className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">รีเซ็ตรหัสผ่าน</h2>
                <p className="text-xs text-gray-500">{selectedMember.full_name}</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่านใหม่</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="อย่างน้อย 8 ตัวอักษร"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ยืนยันรหัสผ่าน</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="ยืนยันรหัสผ่านอีกครั้ง"
              />
            </div>
            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-sm text-red-600 flex items-center gap-1"><XCircle className="w-4 h-4" /> รหัสผ่านไม่ตรงกัน</p>
            )}
          </div>
          <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50/60">
            <button
              onClick={() => { setShowResetPasswordModal(false); setNewPassword(''); setConfirmPassword(''); }}
              className="px-4 py-2 bg-white ring-1 ring-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleResetPassword}
              disabled={actionLoading || !newPassword || newPassword !== confirmPassword}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
            >
              {actionLoading ? 'กำลังบันทึก...' : 'รีเซ็ตรหัสผ่าน'}
            </button>
          </div>
        </Modal>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedMember && (
        <Modal onClose={() => setShowDeleteModal(false)}>
          <div className="p-6 border-b border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-red-600">ยืนยันการลบบัญชี</h2>
          </div>
          <div className="p-6">
            <p className="text-gray-700">
              คุณต้องการลบบัญชี <strong>{selectedMember.full_name}</strong> ใช่หรือไม่?
            </p>
            <div className="mt-3 p-3 bg-red-50 rounded-lg text-sm text-red-700 flex gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              การดำเนินการนี้ไม่สามารถย้อนกลับได้ ประวัติการจอง คะแนน และข้อมูลทั้งหมดจะสูญหาย
            </div>
          </div>
          <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50/60">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 bg-white ring-1 ring-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleDelete}
              disabled={actionLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm"
            >
              {actionLoading ? 'กำลังลบ...' : 'ลบบัญชี'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---------- small components ---------- */
function Modal({
  children, onClose, widthCls = 'max-w-md',
}: { children: React.ReactNode; onClose: () => void; widthCls?: string }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className={`bg-white rounded-2xl w-full ${widthCls} shadow-2xl max-h-[90vh] overflow-hidden`} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{title}</h4>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] text-gray-500">{label}</p>
      <div className="text-sm text-gray-900 font-medium mt-0.5">{value || <span className="text-gray-400">-</span>}</div>
    </div>
  );
}

function VerifyBadge({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="inline-flex items-center gap-1 text-emerald-600"><CheckCircle className="w-4 h-4" /> ยืนยันแล้ว</span>
  ) : (
    <span className="inline-flex items-center gap-1 text-gray-400"><XCircle className="w-4 h-4" /> ยังไม่ยืนยัน</span>
  );
}
