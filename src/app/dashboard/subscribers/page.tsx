'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import {
  Mail,
  Users,
  Loader2,
  Search,
  Trash2,
  Send,
  Eye,
  EyeOff,
  Download,
  RefreshCw,
  Plus,
  Settings,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  FileText,
  Play,
  Square,
  Save,
  TestTube,
  X,
  Filter,
  Pencil,
  Copy,
} from 'lucide-react';
import { subscriberApi, Subscriber, SubscriberStats, NewsletterItem, SubscriberSmtpConfig } from '@/lib/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.nexttripholiday.com/api';

type TabType = 'subscribers' | 'newsletters' | 'create-newsletter' | 'smtp';

const STATUS_LABELS: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'รอยืนยัน', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  active: { label: 'ใช้งาน', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  unsubscribed: { label: 'ยกเลิก', color: 'bg-gray-100 text-gray-600', icon: XCircle },
};

const NL_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: 'แบบร่าง', color: 'bg-gray-100 text-gray-600' },
  scheduled: { label: 'ตั้งเวลา', color: 'bg-blue-100 text-blue-700' },
  sending: { label: 'กำลังส่ง', color: 'bg-yellow-100 text-yellow-700' },
  sent: { label: 'ส่งแล้ว', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'ยกเลิก', color: 'bg-red-100 text-red-700' },
};

export default function SubscribersPage() {
  const [activeTab, setActiveTab] = useState<TabType>('subscribers');

  const tabs = [
    { key: 'subscribers' as TabType, label: 'รายชื่อ Subscribers', icon: Users },
    { key: 'newsletters' as TabType, label: 'Newsletters', icon: Mail },
    { key: 'create-newsletter' as TabType, label: 'สร้าง Newsletter', icon: Plus },
    { key: 'smtp' as TabType, label: 'ตั้งค่า SMTP', icon: Settings },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
          <span>/</span>
          <span className="text-gray-700">จัดการ Subscribers</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <Mail className="w-7 h-7 text-blue-600" />
          จัดการ Subscribers & Newsletter
        </h1>
        <p className="text-gray-500 mt-1">จัดการรายชื่อผู้สมัครรับข่าวสาร และส่ง Newsletter</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-0 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'subscribers' && <SubscribersList />}
      {activeTab === 'newsletters' && <NewslettersList />}
      {activeTab === 'create-newsletter' && <CreateNewsletter onCreated={() => setActiveTab('newsletters')} />}
      {activeTab === 'smtp' && <SmtpSettings />}
    </div>
  );
}

// ==================== Subscribers List ====================
function SubscribersList() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [stats, setStats] = useState<SubscriberStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<{ current_page: number; last_page: number; total: number }>({ current_page: 1, last_page: 1, total: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, per_page: 20 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const [listRes, statsRes] = await Promise.all([
        subscriberApi.list(params),
        subscriberApi.stats(),
      ]);

      if (listRes.success) {
        setSubscribers(listRes.data as Subscriber[]);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw = listRes as any;
        if (raw.pagination) setPagination(raw.pagination);
        if (raw.stats) setStats(raw.stats);
      }
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (error) {
      console.error('Failed to fetch subscribers:', error);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id: number) => {
    if (!confirm('ต้องการลบ subscriber นี้หรือไม่?')) return;
    try {
      await subscriberApi.destroy(id);
      fetchData();
    } catch (error) {
      alert('ลบไม่สำเร็จ');
      console.error(error);
    }
  };

  const handleExport = () => {
    const token = localStorage.getItem('access_token');
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    window.open(`${API_BASE_URL}/subscribers/export?${params.toString()}&token=${token}`, '_blank');
  };

  return (
    <div className="space-y-5">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">ทั้งหมด</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total.toLocaleString()}</p>
              </div>
              <div className="p-2.5 bg-blue-50 rounded-lg"><Users className="w-5 h-5 text-blue-600" /></div>
            </div>
          </Card>
          <Card className="p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">ใช้งาน</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.active.toLocaleString()}</p>
              </div>
              <div className="p-2.5 bg-green-50 rounded-lg"><CheckCircle className="w-5 h-5 text-green-600" /></div>
            </div>
          </Card>
          <Card className="p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">รอยืนยัน</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending.toLocaleString()}</p>
              </div>
              <div className="p-2.5 bg-yellow-50 rounded-lg"><Clock className="w-5 h-5 text-yellow-600" /></div>
            </div>
          </Card>
          <Card className="p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">ยกเลิก</p>
                <p className="text-2xl font-bold text-gray-500 mt-1">{stats.unsubscribed.toLocaleString()}</p>
              </div>
              <div className="p-2.5 bg-gray-100 rounded-lg"><XCircle className="w-5 h-5 text-gray-500" /></div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-3 border border-gray-200">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex-1 min-w-[240px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <Input
              placeholder="ค้นหาอีเมล..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-10 h-10 bg-gray-50 border-gray-200 focus:bg-white"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="h-10 border border-gray-200 rounded-lg px-3 text-sm bg-gray-50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
          >
            <option value="">สถานะทั้งหมด</option>
            <option value="active">ใช้งาน</option>
            <option value="pending">รอยืนยัน</option>
            <option value="unsubscribed">ยกเลิก</option>
          </select>
          <Button variant="outline" size="sm" onClick={handleExport} className="h-10">
            <Download className="w-4 h-4 mr-1.5" /> Export CSV
          </Button>
          <button
            onClick={fetchData}
            title="รีเฟรช"
            className="h-10 w-10 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : subscribers.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Mail className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium text-gray-500">ไม่พบ subscriber</p>
            <p className="text-sm mt-1">ลองปรับเงื่อนไขการค้นหา หรือรอผู้สมัครใหม่</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold text-xs text-gray-600 uppercase tracking-wide">อีเมล</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs text-gray-600 uppercase tracking-wide">สถานะ</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs text-gray-600 uppercase tracking-wide">แหล่งที่มา</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs text-gray-600 uppercase tracking-wide">ประเทศที่สนใจ</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs text-gray-600 uppercase tracking-wide">วันที่สมัคร</th>
                  <th className="text-right px-5 py-3 font-semibold text-xs text-gray-600 uppercase tracking-wide">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {subscribers.map((sub) => {
                  const statusInfo = STATUS_LABELS[sub.status] || STATUS_LABELS.pending;
                  const StatusIcon = statusInfo.icon;
                  const dateStr = sub.subscribed_at || sub.created_at;
                  return (
                    <tr key={sub.id} className="hover:bg-blue-50/40 transition-colors group">
                      <td className="px-5 py-3.5 align-middle">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {sub.email.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900 truncate" title={sub.email}>{sub.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 align-middle">
                        {sub.source_page ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs font-mono">
                            {sub.source_page}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 align-middle text-gray-700">
                        {sub.interest_country || <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3.5 align-middle text-gray-600 whitespace-nowrap">
                        {dateStr ? new Date(dateStr).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-5 py-3.5 text-right align-middle">
                        <button
                          onClick={() => handleDelete(sub.id)}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all p-1.5 rounded"
                          title="ลบ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.last_page > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200 bg-gray-50/70">
            <p className="text-sm text-gray-600">
              ทั้งหมด <span className="font-semibold text-gray-900">{pagination.total.toLocaleString()}</span> รายการ
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="h-8 w-8 flex items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-700 px-2">
                หน้า <span className="font-semibold">{pagination.current_page}</span> / {pagination.last_page}
              </span>
              <button
                disabled={page >= pagination.last_page}
                onClick={() => setPage(page + 1)}
                className="h-8 w-8 flex items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// ==================== Newsletters List ====================
function NewslettersList() {
  const [newsletters, setNewsletters] = useState<NewsletterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<{ current_page: number; last_page: number; total: number }>({ current_page: 1, last_page: 1, total: 0 });
  const [previewItem, setPreviewItem] = useState<NewsletterItem | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [editItem, setEditItem] = useState<NewsletterItem | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, per_page: 20 };
      if (statusFilter) params.status = statusFilter;

      const res = await subscriberApi.newsletters(params);
      if (res.success) {
        setNewsletters(res.data as NewsletterItem[]);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw = res as any;
        if (raw.pagination) setPagination(raw.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch newsletters:', error);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSend = async (nl: NewsletterItem) => {
    if (!confirm(`ต้องการส่ง "${nl.subject}" หรือไม่?`)) return;
    try {
      const res = await subscriberApi.sendNewsletter(nl.id);
      if (res.success) {
        alert(res.message || 'กำลังส่ง...');
        fetchData();
      } else {
        alert(res.message || 'ส่งไม่สำเร็จ');
      }
    } catch {
      alert('เกิดข้อผิดพลาด');
    }
  };

  const handleCancel = async (nl: NewsletterItem) => {
    if (!confirm('ต้องการยกเลิก newsletter นี้หรือไม่?')) return;
    try {
      await subscriberApi.cancelNewsletter(nl.id);
      fetchData();
    } catch {
      alert('ยกเลิกไม่สำเร็จ');
    }
  };

  const handleDelete = async (nl: NewsletterItem) => {
    if (!confirm('ต้องการลบ newsletter นี้หรือไม่?')) return;
    try {
      await subscriberApi.deleteNewsletter(nl.id);
      fetchData();
    } catch {
      alert('ลบไม่สำเร็จ');
    }
  };

  const handleDuplicate = async (nl: NewsletterItem) => {
    if (!confirm(`คัดลอก "${nl.subject}" เป็น Draft ใหม่เพื่อแก้ไข?`)) return;
    try {
      const res = await subscriberApi.createNewsletter({
        subject: `${nl.subject} (สำเนา)`,
        content_html: nl.content_html,
        content_text: nl.content_text,
        template: nl.template,
        recipient_filter: nl.recipient_filter,
        batch_size: nl.batch_size,
        batch_delay_seconds: nl.batch_delay_seconds,
      });
      if (res.success && res.data) {
        alert('คัดลอกเป็น Draft สำเร็จ — กดปุ่มแก้ไขเพื่อแก้เนื้อหา');
        fetchData();
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        alert((res as any).message || 'คัดลอกไม่สำเร็จ');
      }
    } catch {
      alert('เกิดข้อผิดพลาด');
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="">สถานะทั้งหมด</option>
            <option value="draft">แบบร่าง</option>
            <option value="sending">กำลังส่ง</option>
            <option value="sent">ส่งแล้ว</option>
            <option value="cancelled">ยกเลิก</option>
          </select>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      {/* List */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : newsletters.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>ไม่มี newsletter</p>
          </div>
        ) : (
          <div className="divide-y">
            {newsletters.map((nl) => {
              const statusInfo = NL_STATUS_LABELS[nl.status] || NL_STATUS_LABELS.draft;
              return (
                <div key={nl.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900 truncate">{nl.subject}</h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Template: {nl.template}</span>
                        {nl.total_recipients > 0 && (
                          <span>ผู้รับ: {nl.sent_count}/{nl.total_recipients}</span>
                        )}
                        {nl.failed_count > 0 && (
                          <span className="text-red-500">ล้มเหลว: {nl.failed_count}</span>
                        )}
                        <span>สร้าง: {new Date(nl.created_at).toLocaleDateString('th-TH')}</span>
                        {nl.sent_at && <span>ส่ง: {new Date(nl.sent_at).toLocaleDateString('th-TH')}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => setPreviewItem(nl)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="ดูตัวอย่าง"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDuplicate(nl)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="คัดลอกเป็น Draft ใหม่"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      {nl.status === 'draft' && (
                        <>
                          <button
                            onClick={() => setEditItem(nl)}
                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="แก้ไข"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleSend(nl)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="ส่ง"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(nl)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="ลบ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {nl.status === 'sending' && (
                        <button
                          onClick={() => handleCancel(nl)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="ยกเลิก"
                        >
                          <Square className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.last_page > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
            <p className="text-sm text-gray-500">ทั้งหมด {pagination.total} รายการ</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm">{pagination.current_page} / {pagination.last_page}</span>
              <Button variant="outline" size="sm" disabled={page >= pagination.last_page} onClick={() => setPage(page + 1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Preview Modal */}
      {previewItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setPreviewItem(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white">
              <div className="flex items-center gap-2 min-w-0">
                <Mail className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs text-gray-500">ตัวอย่างอีเมล #{previewItem.id}</div>
                  <div className="font-semibold text-gray-900 truncate">{previewItem.subject}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                  <button
                    onClick={() => setPreviewMode('desktop')}
                    className={`text-xs px-3 py-1 rounded cursor-pointer ${previewMode === 'desktop' ? 'bg-white shadow-sm text-blue-700 font-medium' : 'text-gray-500'}`}
                  >
                    Desktop
                  </button>
                  <button
                    onClick={() => setPreviewMode('mobile')}
                    className={`text-xs px-3 py-1 rounded cursor-pointer ${previewMode === 'mobile' ? 'bg-white shadow-sm text-blue-700 font-medium' : 'text-gray-500'}`}
                  >
                    Mobile
                  </button>
                </div>
                <button
                  onClick={() => setPreviewItem(null)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Meta */}
            <div className="px-6 py-3 border-b border-gray-200 bg-white grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <div className="text-gray-400">สถานะ</div>
                <div className="mt-0.5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium ${(NL_STATUS_LABELS[previewItem.status] || NL_STATUS_LABELS.draft).color}`}>
                    {(NL_STATUS_LABELS[previewItem.status] || NL_STATUS_LABELS.draft).label}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-gray-400">Template</div>
                <div className="mt-0.5 font-medium text-gray-700">{previewItem.template}</div>
              </div>
              <div>
                <div className="text-gray-400">ผู้รับ</div>
                <div className="mt-0.5 font-medium text-gray-700">
                  {previewItem.recipient_filter?.type === 'country'
                    ? `ประเทศ: ${previewItem.recipient_filter.country || '-'}`
                    : 'Active ทั้งหมด'}
                  {previewItem.total_recipients > 0 && ` (${previewItem.sent_count}/${previewItem.total_recipients})`}
                </div>
              </div>
              <div>
                <div className="text-gray-400">Batch</div>
                <div className="mt-0.5 font-medium text-gray-700">{previewItem.batch_size}/{previewItem.batch_delay_seconds}s</div>
              </div>
            </div>

            {/* Mock email envelope */}
            <div className="px-6 py-2.5 border-b border-gray-200 bg-gray-50 text-xs space-y-0.5">
              <div className="flex gap-2">
                <span className="text-gray-400 w-14 flex-shrink-0">From:</span>
                <span className="text-gray-700">NextTrip Holiday &lt;noreply@nexttripholiday.com&gt;</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-400 w-14 flex-shrink-0">Subject:</span>
                <span className="font-semibold text-gray-900">{previewItem.subject}</span>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-auto p-4 bg-gray-100 flex justify-center">
              <div
                className="bg-white shadow-sm transition-all"
                style={{ width: previewMode === 'mobile' ? 375 : '100%', maxWidth: previewMode === 'mobile' ? 375 : 720 }}
              >
                <iframe
                  title="newsletter-preview-modal"
                  srcDoc={`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><base target="_blank"><style>body{margin:0;padding:8px;font-family:sans-serif;background:#fff;color:#111;}img{max-width:100%;height:auto;}</style></head><body>${previewItem.content_html || ''}</body></html>`}
                  sandbox="allow-same-origin"
                  className="w-full border-0"
                  style={{ minHeight: 520 }}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-gray-200 bg-white flex items-center justify-between gap-3">
              <div className="text-xs text-gray-400">
                * ตัวอย่างจะถูก render ใน sandbox iframe — อาจต่างจาก email client จริงเล็กน้อย
              </div>
              <div className="flex items-center gap-2">
                {previewItem.status === 'draft' && (
                  <Button
                    onClick={async () => {
                      const item = previewItem;
                      setPreviewItem(null);
                      await handleSend(item);
                    }}
                  >
                    <Send className="w-4 h-4 mr-1" />
                    ส่งเลย
                  </Button>
                )}
                <Button variant="outline" onClick={() => setPreviewItem(null)}>ปิด</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal (draft only) */}
      {editItem && (
        <EditNewsletterModal
          item={editItem}
          onClose={() => setEditItem(null)}
          onSaved={() => {
            setEditItem(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
}

// ==================== Edit Newsletter Modal ====================
function EditNewsletterModal({
  item,
  onClose,
  onSaved,
}: {
  item: NewsletterItem;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [subject, setSubject] = useState(item.subject);
  const [contentHtml, setContentHtml] = useState(item.content_html);
  const [template, setTemplate] = useState(item.template);
  const [filterType, setFilterType] = useState(item.recipient_filter?.type || 'all');
  const [filterCountry, setFilterCountry] = useState(item.recipient_filter?.country || '');
  const [batchSize, setBatchSize] = useState(item.batch_size);
  const [batchDelay, setBatchDelay] = useState(item.batch_delay_seconds);
  const [expiresAt, setExpiresAt] = useState(item.expires_at ? item.expires_at.slice(0, 16) : '');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [saving, setSaving] = useState(false);

  const handleSave = async (andSend: boolean = false) => {
    if (!subject.trim() || !contentHtml.trim()) {
      alert('กรุณากรอกหัวข้อและเนื้อหา');
      return;
    }
    setSaving(true);
    try {
      const recipientFilter: Record<string, unknown> = { type: filterType };
      if (filterType === 'country') recipientFilter.country = filterCountry;

      const res = await subscriberApi.updateNewsletter(item.id, {
        subject,
        content_html: contentHtml,
        template,
        expires_at: expiresAt || undefined,
        recipient_filter: recipientFilter as NewsletterItem['recipient_filter'],
        batch_size: batchSize,
        batch_delay_seconds: batchDelay,
      });

      if (res.success) {
        if (andSend) {
          const sendRes = await subscriberApi.sendNewsletter(item.id);
          if (sendRes.success) {
            alert('บันทึกและส่ง Newsletter สำเร็จ');
          } else {
            alert(sendRes.message || 'บันทึกแล้ว แต่ส่งไม่สำเร็จ');
          }
        } else {
          alert('บันทึกการแก้ไขสำเร็จ');
        }
        onSaved();
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        alert((res as any).message || 'บันทึกไม่สำเร็จ');
      }
    } catch {
      alert('เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-amber-50 to-white">
          <div className="flex items-center gap-2">
            <Pencil className="w-5 h-5 text-amber-600" />
            <div>
              <div className="text-xs text-gray-500">แก้ไข Draft #{item.id}</div>
              <div className="font-semibold text-gray-900">Newsletter</div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg cursor-pointer">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-6 space-y-4">
          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">หัวข้อ (Subject)</label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>

          {/* Template */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Template</label>
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              <option value="promotion">โปรโมชั่น</option>
              <option value="review">รีวิว</option>
              <option value="welcome">Welcome</option>
            </select>
          </div>

          {/* Content + Preview */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">เนื้อหา HTML</label>
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => setPreviewMode('desktop')}
                  className={`text-xs px-2 py-1 rounded cursor-pointer ${previewMode === 'desktop' ? 'bg-white shadow-sm text-blue-700 font-medium' : 'text-gray-500'}`}
                >
                  Desktop
                </button>
                <button
                  onClick={() => setPreviewMode('mobile')}
                  className={`text-xs px-2 py-1 rounded cursor-pointer ${previewMode === 'mobile' ? 'bg-white shadow-sm text-blue-700 font-medium' : 'text-gray-500'}`}
                >
                  Mobile
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <textarea
                value={contentHtml}
                onChange={(e) => setContentHtml(e.target.value)}
                rows={14}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="border border-gray-300 rounded-lg overflow-hidden bg-gray-100 flex justify-center p-2">
                <div
                  className="bg-white shadow-sm transition-all w-full"
                  style={{ maxWidth: previewMode === 'mobile' ? 375 : 640 }}
                >
                  <iframe
                    title="edit-preview"
                    srcDoc={`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><base target="_blank"><style>body{margin:0;padding:8px;font-family:sans-serif;background:#fff;color:#111;}img{max-width:100%;height:auto;}</style></head><body>${contentHtml}</body></html>`}
                    sandbox="allow-same-origin"
                    className="w-full border-0"
                    style={{ height: 380 }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Filter */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ส่งถึง</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                <option value="all">Subscriber ทั้งหมด (Active)</option>
                <option value="country">ตามประเทศที่สนใจ</option>
              </select>
            </div>
            {filterType === 'country' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ประเทศ</label>
                <Input value={filterCountry} onChange={(e) => setFilterCountry(e.target.value)} placeholder="เช่น ญี่ปุ่น" />
              </div>
            )}
          </div>

          {/* Batch */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Batch Size</label>
              <Input type="number" value={batchSize} onChange={(e) => setBatchSize(Number(e.target.value))} min={1} max={500} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">หน่วงเวลา (วินาที)</label>
              <Input type="number" value={batchDelay} onChange={(e) => setBatchDelay(Number(e.target.value))} min={0} max={3600} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">วันหมดอายุ</label>
              <Input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onClose}>ยกเลิก</Button>
          <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
            บันทึก
          </Button>
          <Button onClick={() => handleSave(true)} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
            บันทึกและส่งทันที
          </Button>
        </div>
      </div>
    </div>
  );
}

// ==================== Create Newsletter ====================
function CreateNewsletter({ onCreated }: { onCreated: () => void }) {
  const [subject, setSubject] = useState('');
  const [contentHtml, setContentHtml] = useState('');
  const [template, setTemplate] = useState('promotion');
  const [expiresAt, setExpiresAt] = useState('');
  const [batchSize, setBatchSize] = useState(50);
  const [batchDelay, setBatchDelay] = useState(60);
  const [filterType, setFilterType] = useState('all');
  const [filterCountry, setFilterCountry] = useState('');
  const [saving, setSaving] = useState(false);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  const handlePreviewCount = async () => {
    try {
      const filter: Record<string, unknown> = { type: filterType };
      if (filterType === 'country') filter.country = filterCountry;
      const res = await subscriberApi.previewCount(filter);
      if (res.success && res.data) {
        setPreviewCount(res.data.count);
      }
    } catch {
      console.error('Failed to preview count');
    }
  };

  const handleSave = async (andSend: boolean = false) => {
    if (!subject.trim() || !contentHtml.trim()) {
      alert('กรุณากรอกหัวข้อและเนื้อหา');
      return;
    }
    setSaving(true);
    try {
      const recipientFilter: Record<string, unknown> = { type: filterType };
      if (filterType === 'country') recipientFilter.country = filterCountry;

      const res = await subscriberApi.createNewsletter({
        subject,
        content_html: contentHtml,
        template,
        expires_at: expiresAt || undefined,
        recipient_filter: recipientFilter as NewsletterItem['recipient_filter'],
        batch_size: batchSize,
        batch_delay_seconds: batchDelay,
      });

      if (res.success && res.data) {
        if (andSend) {
          const sendRes = await subscriberApi.sendNewsletter(res.data.id);
          if (sendRes.success) {
            alert('สร้างและส่ง Newsletter สำเร็จ!');
          }
        } else {
          alert('สร้าง Newsletter (Draft) สำเร็จ');
        }
        onCreated();
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        alert((res as any).message || 'สร้างไม่สำเร็จ');
      }
    } catch {
      alert('เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  };

  const loadTemplate = (type: string) => {
    setTemplate(type);
    if (type === 'promotion') {
      setContentHtml(`<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
  <div style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:32px;text-align:center;border-radius:16px 16px 0 0;">
    <h1 style="color:#fff;margin:0;font-size:24px;">NextTrip Holiday</h1>
    <p style="color:#bfdbfe;margin:8px 0 0;font-size:14px;">โปรโมชั่นพิเศษสำหรับคุณ</p>
  </div>
  <div style="background:#fff;padding:32px;border-radius:0 0 16px 16px;border:1px solid #e5e7eb;border-top:0;">
    <h2 style="color:#1f2937;font-size:20px;margin:0 0 16px;">ทัวร์ราคาพิเศษ!</h2>
    <p style="color:#4b5563;font-size:15px;line-height:1.6;">
      พบกับดีลสุดพิเศษที่คัดสรรมาเพื่อคุณโดยเฉพาะ
    </p>
    <div style="text-align:center;margin:24px 0;">
      <a href="https://nexttripholiday.com/tours" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:14px 40px;border-radius:8px;font-weight:600;">ดูทัวร์ทั้งหมด</a>
    </div>
  </div>
</div>`);
    } else if (type === 'review') {
      setContentHtml(`<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
  <div style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:32px;text-align:center;border-radius:16px 16px 0 0;">
    <h1 style="color:#fff;margin:0;font-size:24px;">NextTrip Holiday</h1>
    <p style="color:#fef3c7;margin:8px 0 0;font-size:14px;">รีวิวจากลูกค้า</p>
  </div>
  <div style="background:#fff;padding:32px;border-radius:0 0 16px 16px;border:1px solid #e5e7eb;border-top:0;">
    <h2 style="color:#1f2937;font-size:20px;margin:0 0 16px;">ดูรีวิวจากผู้เดินทาง</h2>
    <p style="color:#4b5563;font-size:15px;line-height:1.6;">
      อ่านประสบการณ์จริงจากลูกค้าที่ไว้วางใจเรา
    </p>
    <div style="text-align:center;margin:24px 0;">
      <a href="https://nexttripholiday.com/tours" style="display:inline-block;background:#f59e0b;color:#fff;text-decoration:none;padding:14px 40px;border-radius:8px;font-weight:600;">ดูรีวิวทั้งหมด</a>
    </div>
  </div>
</div>`);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-6 space-y-5">
        <h2 className="text-lg font-semibold text-gray-900">สร้าง Newsletter ใหม่</h2>

        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">หัวข้อ (Subject)</label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="เช่น โปรโมชั่นทัวร์ญี่ปุ่นสุดพิเศษ"
          />
        </div>

        {/* Template Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Template</label>
          <div className="flex gap-2">
            {[
              { value: 'promotion', label: 'โปรโมชั่น' },
              { value: 'review', label: 'รีวิว' },
              { value: 'welcome', label: 'Welcome' },
            ].map((t) => (
              <button
                key={t.value}
                onClick={() => loadTemplate(t.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  template === t.value
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content HTML */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">เนื้อหา HTML</label>
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showPreview ? 'ซ่อนตัวอย่าง' : 'แสดงตัวอย่าง'}
            </button>
          </div>
          <div className={`grid gap-3 ${showPreview ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
            <textarea
              value={contentHtml}
              onChange={(e) => setContentHtml(e.target.value)}
              rows={16}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="<div>...</div>"
            />
            {showPreview && (
              <div className="border border-gray-300 rounded-lg overflow-hidden bg-gray-100 flex flex-col">
                {/* Preview header (mock email client) */}
                <div className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <Mail className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span className="text-xs font-semibold text-gray-700">ตัวอย่างอีเมล</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPreviewMode('desktop')}
                      className={`text-[11px] px-2 py-1 rounded cursor-pointer ${previewMode === 'desktop' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                      Desktop
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewMode('mobile')}
                      className={`text-[11px] px-2 py-1 rounded cursor-pointer ${previewMode === 'mobile' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                      Mobile
                    </button>
                  </div>
                </div>
                {/* Mock email meta */}
                <div className="bg-white border-b border-gray-200 px-4 py-2 text-xs space-y-0.5">
                  <div className="flex gap-2">
                    <span className="text-gray-400 w-12 flex-shrink-0">From:</span>
                    <span className="text-gray-700 truncate">NextTrip Holiday &lt;noreply@nexttripholiday.com&gt;</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-gray-400 w-12 flex-shrink-0">To:</span>
                    <span className="text-gray-700 truncate">subscriber@example.com</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-gray-400 w-12 flex-shrink-0">Subject:</span>
                    <span className="font-semibold text-gray-900 truncate">{subject || <span className="text-gray-400 italic font-normal">(ยังไม่ได้กรอกหัวข้อ)</span>}</span>
                  </div>
                </div>
                {/* Preview body */}
                <div className="flex-1 overflow-auto p-3 flex justify-center">
                  <div
                    className="bg-white shadow-sm transition-all"
                    style={{ width: previewMode === 'mobile' ? 375 : '100%', maxWidth: previewMode === 'mobile' ? 375 : 640, minHeight: 300 }}
                  >
                    {contentHtml.trim() ? (
                      <iframe
                        title="newsletter-preview"
                        srcDoc={`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><base target="_blank"><style>body{margin:0;padding:8px;font-family:sans-serif;background:#fff;color:#111;}img{max-width:100%;height:auto;}</style></head><body>${contentHtml}</body></html>`}
                        sandbox="allow-same-origin"
                        className="w-full border-0"
                        style={{ height: 460 }}
                      />
                    ) : (
                      <div className="p-8 text-center text-sm text-gray-400">
                        กรอกเนื้อหาหรือเลือก Template เพื่อแสดงตัวอย่าง
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            * ตัวอย่างจะถูก render ใน sandbox iframe — JavaScript ในเนื้อหาจะไม่ทำงาน เหมือนกับ email client จริง
          </p>
        </div>

        {/* Recipient Filter */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ส่งถึง</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">Subscriber ทั้งหมด (Active)</option>
              <option value="country">ตามประเทศที่สนใจ</option>
            </select>
          </div>
          {filterType === 'country' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ประเทศ</label>
              <Input
                value={filterCountry}
                onChange={(e) => setFilterCountry(e.target.value)}
                placeholder="เช่น ญี่ปุ่น"
              />
            </div>
          )}
          <div className="flex items-end">
            <Button variant="outline" size="sm" onClick={handlePreviewCount}>
              <Eye className="w-4 h-4 mr-1" />
              ตรวจสอบจำนวน
              {previewCount !== null && <span className="ml-1 font-bold text-blue-600">({previewCount})</span>}
            </Button>
          </div>
        </div>

        {/* Batch Settings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">จำนวน/รอบ (Batch Size)</label>
            <Input type="number" value={batchSize} onChange={(e) => setBatchSize(Number(e.target.value))} min={1} max={500} />
            <p className="text-xs text-gray-400 mt-1">จำนวนอีเมลต่อรอบ (แนะนำ 20-50 สำหรับบัญชีใหม่)</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">หน่วงเวลา (วินาที)</label>
            <Input type="number" value={batchDelay} onChange={(e) => setBatchDelay(Number(e.target.value))} min={0} max={3600} />
            <p className="text-xs text-gray-400 mt-1">เวลาพักระหว่างรอบ (แนะนำ 30-120 วินาที)</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">วันหมดอายุ</label>
            <Input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
            <p className="text-xs text-gray-400 mt-1">หลังวันนี้จะไม่ถูกส่ง</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4 border-t">
          <Button
            onClick={() => handleSave(false)}
            disabled={saving}
            variant="outline"
          >
            {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
            บันทึกเป็น Draft
          </Button>
          <Button
            onClick={() => handleSave(true)}
            disabled={saving}
          >
            {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
            สร้างและส่งทันที
          </Button>
        </div>
      </Card>

      {/* Best Practices */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          Best Practices
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-600">
          <div>
            <p className="font-medium text-gray-700 mb-1">ความถี่การส่ง</p>
            <ul className="space-y-0.5 list-disc list-inside">
              <li>ส่ง 1-2 ครั้ง/สัปดาห์ เพื่อไม่ให้เป็น spam</li>
              <li>ส่งช่วง 10:00-14:00 น. จะได้ open rate สูงสุด</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-gray-700 mb-1">Warm-up Plan</p>
            <ul className="space-y-0.5 list-disc list-inside">
              <li>สัปดาห์แรก: 20-50 อีเมล/วัน</li>
              <li>สัปดาห์ที่ 2: 100-200 อีเมล/วัน</li>
              <li>สัปดาห์ที่ 3: 500+ อีเมล/วัน</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-gray-700 mb-1">เพิ่ม Open Rate</p>
            <ul className="space-y-0.5 list-disc list-inside">
              <li>ใช้หัวข้อสั้น ชัดเจน ไม่เกิน 50 ตัวอักษร</li>
              <li>หลีกเลี่ยง: &ldquo;ฟรี&rdquo;, &ldquo;!!!&rdquo;, ตัวพิมพ์ใหญ่ทั้งหมด</li>
              <li>ใส่ชื่อผู้ส่งที่น่าเชื่อถือ</li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-gray-700 mb-1">Segmentation</p>
            <ul className="space-y-0.5 list-disc list-inside">
              <li>แบ่งกลุ่มตามประเทศที่สนใจ</li>
              <li>ส่งเนื้อหาตรงกับความสนใจ</li>
              <li>Retarget: ส่งอีกครั้งหลัง 3-7 วัน</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ==================== SMTP Settings ====================
function SmtpSettings() {
  const [config, setConfig] = useState<SubscriberSmtpConfig>({
    host: '',
    port: 587,
    encryption: 'tls',
    username: '',
    from_address: '',
    from_name: 'NextTrip Holiday',
    reply_to: '',
    enabled: false,
  });
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [showTestModal, setShowTestModal] = useState(false);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res = await subscriberApi.getSmtp();
      if (res.success && res.data) {
        setConfig(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch SMTP config:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const data: Record<string, unknown> = { ...config };
      if (password) data.password = password;
      delete data.password_masked;
      delete data.has_password;

      const res = await subscriberApi.updateSmtp(data as Partial<SubscriberSmtpConfig>);
      if (res.success) {
        alert('บันทึกสำเร็จ');
        setPassword('');
        fetchConfig();
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        alert((res as any).message || 'บันทึกล้มเหลว');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด';
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!testEmail) return;
    setTesting(true);
    try {
      const res = await subscriberApi.testSmtp(testEmail);
      if (res.success) {
        alert('ส่งอีเมลทดสอบสำเร็จ!');
        setShowTestModal(false);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        alert((res as any).message || 'ส่งไม่สำเร็จ');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด';
      alert(msg);
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">ตั้งค่า SMTP สำหรับ Subscriber</h2>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setShowTestModal(true)}>
              <TestTube className="w-4 h-4 mr-1" /> ทดสอบ
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
              บันทึก
            </Button>
          </div>
        </div>

        <p className="text-sm text-gray-500 bg-blue-50 p-3 rounded-lg">
          SMTP นี้แยกจาก SMTP หลัก — ใช้สำหรับส่ง Newsletter และอีเมลยืนยันการสมัครรับข่าวสารเท่านั้น
          เพื่อป้องกัน reputation ของอีเมลหลักไม่ถูกกระทบ
        </p>

        {/* Enable/Disable */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">สถานะ:</label>
          <button
            onClick={() => setConfig({ ...config, enabled: !config.enabled })}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              config.enabled
                ? 'bg-green-50 text-green-700 hover:bg-green-100'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {config.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            {config.enabled ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
          </button>
        </div>

        {/* SMTP Config */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Host</label>
            <Input
              value={config.host}
              onChange={(e) => setConfig({ ...config, host: e.target.value })}
              placeholder="smtp.mailgun.org"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
            <Input
              type="number"
              value={config.port}
              onChange={(e) => setConfig({ ...config, port: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Encryption</label>
            <select
              value={config.encryption}
              onChange={(e) => setConfig({ ...config, encryption: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="tls">TLS (STARTTLS)</option>
              <option value="ssl">SSL</option>
              <option value="none">None</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <Input
              value={config.username}
              onChange={(e) => setConfig({ ...config, username: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password {config.has_password && <span className="text-xs text-gray-400">(เว้นว่างไว้ใช้ค่าเดิม: {config.password_masked})</span>}
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={config.has_password ? '••••••••' : 'รหัสผ่าน'}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Email</label>
            <Input
              type="email"
              value={config.from_address}
              onChange={(e) => setConfig({ ...config, from_address: e.target.value })}
              placeholder="newsletter@nexttripholiday.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Name</label>
            <Input
              value={config.from_name}
              onChange={(e) => setConfig({ ...config, from_name: e.target.value })}
              placeholder="NextTrip Holiday"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reply-To</label>
            <Input
              type="email"
              value={config.reply_to}
              onChange={(e) => setConfig({ ...config, reply_to: e.target.value })}
              placeholder="info@nexttripholiday.com"
            />
          </div>
        </div>

        {/* SPF/DKIM/DMARC Guide */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-amber-800 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            ป้องกัน Spam — DNS Records ที่ต้องตั้งค่า
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-amber-900">
            <div>
              <p className="font-medium mb-1">SPF Record</p>
              <code className="block bg-white/60 p-2 rounded text-[11px] break-all">v=spf1 include:mailgun.org include:amazonses.com ~all</code>
              <p className="text-amber-700 mt-1">ใส่ใน TXT record ของ domain</p>
            </div>
            <div>
              <p className="font-medium mb-1">DKIM</p>
              <p className="text-amber-700">ตั้งค่าผ่าน Mailgun/SES console แล้วเพิ่ม CNAME records</p>
            </div>
            <div>
              <p className="font-medium mb-1">DMARC</p>
              <code className="block bg-white/60 p-2 rounded text-[11px] break-all">v=DMARC1; p=quarantine; rua=mailto:dmarc@nexttripholiday.com</code>
              <p className="text-amber-700 mt-1">TXT record: _dmarc.yourdomain.com</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Test Modal */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <TestTube className="w-5 h-5 text-blue-600" />
                ทดสอบส่ง Email
              </h3>
              <button onClick={() => setShowTestModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ส่งไปที่อีเมล</label>
                <Input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="test@example.com"
                />
              </div>
              <Button onClick={handleTest} disabled={testing || !testEmail} className="w-full">
                {testing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
                ส่งทดสอบ
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
