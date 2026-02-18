'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  contactMessagesApi,
  ContactMessage,
} from '@/lib/api';
import {
  MessageSquare,
  Mail,
  Phone,
  Clock,
  Search,
  Eye,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  Send,
  Archive,
  MailOpen,
  Filter,
} from 'lucide-react';

// ─── Helpers ───
type StatusFilter = 'all' | 'new' | 'read' | 'replied' | 'archived';

function statusBadge(status: string) {
  switch (status) {
    case 'new':
      return 'bg-red-100 text-red-700';
    case 'read':
      return 'bg-blue-100 text-blue-700';
    case 'replied':
      return 'bg-green-100 text-green-700';
    case 'archived':
      return 'bg-gray-100 text-gray-500';
    default:
      return 'bg-gray-100 text-gray-500';
  }
}

function statusLabel(status: string) {
  switch (status) {
    case 'new': return 'ใหม่';
    case 'read': return 'อ่านแล้ว';
    case 'replied': return 'ตอบแล้ว';
    case 'archived': return 'จัดเก็บ';
    default: return status;
  }
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const d = new Date(dateStr);
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return 'เมื่อสักครู่';
  if (diff < 3600) return `${Math.floor(diff / 60)} นาทีที่แล้ว`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ชั่วโมงที่แล้ว`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} วันที่แล้ว`;
  return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
}

type ViewMode = 'list' | 'detail';

export default function ContactMessagesPage() {
  // List state
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [counts, setCounts] = useState<Record<string, number>>({});

  // Detail state
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const res = await contactMessagesApi.list({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchQuery || undefined,
        page,
        per_page: 20,
      });
      setMessages((res.data || []) as ContactMessage[]);
      if (res.meta) setMeta(res.meta as { current_page: number; last_page: number; total: number });
      if (res.counts) setCounts(res.counts);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery, page]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // ─── Handlers ───
  const openDetail = async (msg: ContactMessage) => {
    try {
      const res = await contactMessagesApi.get(msg.id);
      const detailed = res.data as ContactMessage | undefined;
      setSelectedMessage(detailed || msg);
      setAdminNotes(detailed?.admin_notes || msg.admin_notes || '');
      setViewMode('detail');
      // Refresh list to update counts
      fetchMessages();
    } catch {
      setSelectedMessage(msg);
      setAdminNotes(msg.admin_notes || '');
      setViewMode('detail');
    }
  };

  const updateStatus = async (status: string) => {
    if (!selectedMessage) return;
    try {
      setSaving(true);
      await contactMessagesApi.update(selectedMessage.id, { status, admin_notes: adminNotes });
      setSelectedMessage({ ...selectedMessage, status: status as ContactMessage['status'], admin_notes: adminNotes });
      fetchMessages();
    } catch (err) {
      console.error('Error updating:', err);
    } finally {
      setSaving(false);
    }
  };

  const saveNotes = async () => {
    if (!selectedMessage) return;
    try {
      setSaving(true);
      await contactMessagesApi.update(selectedMessage.id, { admin_notes: adminNotes });
      setSelectedMessage({ ...selectedMessage, admin_notes: adminNotes });
    } catch (err) {
      console.error('Error saving notes:', err);
    } finally {
      setSaving(false);
    }
  };

  const deleteMessage = async (id: number) => {
    if (!confirm('ยืนยันลบข้อความนี้?')) return;
    try {
      await contactMessagesApi.delete(id);
      if (viewMode === 'detail') {
        setViewMode('list');
        setSelectedMessage(null);
      }
      fetchMessages();
    } catch (err) {
      console.error('Error deleting:', err);
    }
  };

  // ─── Detail View ───
  if (viewMode === 'detail' && selectedMessage) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => { setViewMode('list'); setSelectedMessage(null); }} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 truncate">
              {selectedMessage.subject}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              จาก {selectedMessage.name} • {timeAgo(selectedMessage.created_at)}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge(selectedMessage.status)}`}>
            {statusLabel(selectedMessage.status)}
          </span>
        </div>

        <div className="space-y-4">
          {/* Sender Info */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">ข้อมูลผู้ส่ง</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-gray-500 text-xs">อีเมล</p>
                  <a href={`mailto:${selectedMessage.email}`} className="text-blue-600 hover:underline">
                    {selectedMessage.email}
                  </a>
                </div>
              </div>
              {selectedMessage.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-gray-500 text-xs">โทรศัพท์</p>
                    <a href={`tel:${selectedMessage.phone}`} className="text-blue-600 hover:underline">
                      {selectedMessage.phone}
                    </a>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-gray-500 text-xs">ส่งเมื่อ</p>
                  <p className="text-gray-700">
                    {new Date(selectedMessage.created_at).toLocaleString('th-TH')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Message Content */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">ข้อความ</h3>
            <div className="text-gray-800 text-sm whitespace-pre-wrap leading-relaxed bg-gray-50 rounded-lg p-4">
              {selectedMessage.message}
            </div>
          </div>

          {/* Admin Notes */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">โน้ตของแอดมิน</h3>
            <textarea
              rows={3}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="เขียนโน้ตสำหรับทีมงาน..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={saveNotes}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm transition"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                บันทึกโน้ต
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">เปลี่ยนสถานะ</h3>
            <div className="flex flex-wrap gap-2">
              {selectedMessage.status !== 'read' && (
                <button
                  onClick={() => updateStatus('read')}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-sm font-medium transition"
                >
                  <MailOpen className="w-4 h-4" />
                  อ่านแล้ว
                </button>
              )}
              {selectedMessage.status !== 'replied' && (
                <button
                  onClick={() => updateStatus('replied')}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 text-sm font-medium transition"
                >
                  <Send className="w-4 h-4" />
                  ตอบแล้ว
                </button>
              )}
              {selectedMessage.status !== 'archived' && (
                <button
                  onClick={() => updateStatus('archived')}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 text-sm font-medium transition"
                >
                  <Archive className="w-4 h-4" />
                  จัดเก็บ
                </button>
              )}
              <button
                onClick={() => deleteMessage(selectedMessage.id)}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 text-sm font-medium transition ml-auto"
              >
                <Trash2 className="w-4 h-4" />
                ลบ
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── List View ───
  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-blue-500" />
            ข้อความติดต่อ
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            จัดการข้อความที่ส่งมาจากหน้าติดต่อเรา
          </p>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-1 mb-4 bg-gray-50 rounded-xl p-1 overflow-x-auto">
        {([
          { key: 'all', label: 'ทั้งหมด', icon: Filter },
          { key: 'new', label: 'ใหม่', icon: Mail },
          { key: 'read', label: 'อ่านแล้ว', icon: MailOpen },
          { key: 'replied', label: 'ตอบแล้ว', icon: Send },
          { key: 'archived', label: 'จัดเก็บ', icon: Archive },
        ] as { key: StatusFilter; label: string; icon: React.ComponentType<{ className?: string }> }[]).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => { setStatusFilter(key); setPage(1); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
              statusFilter === key
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
            {counts[key] !== undefined && counts[key] > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                key === 'new' ? 'bg-red-100 text-red-600' : 'bg-gray-200 text-gray-600'
              }`}>
                {counts[key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
          placeholder="ค้นหาชื่อ, อีเมล, เรื่อง, เบอร์โทร..."
          className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
        />
        {searchQuery && (
          <button
            onClick={() => { setSearchQuery(''); setPage(1); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-100 rounded"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Messages List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">ยังไม่มีข้อความ</p>
          <p className="text-sm mt-1">
            {statusFilter !== 'all' ? `ไม่มีข้อความสถานะ "${statusLabel(statusFilter)}"` : 'ข้อความจากหน้าติดต่อเราจะแสดงที่นี่'}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {messages.map((msg) => (
              <div
                key={msg.id}
                onClick={() => openDetail(msg)}
                className={`bg-white border rounded-xl p-4 cursor-pointer hover:shadow-md transition group ${
                  msg.status === 'new' ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm ${
                    msg.status === 'new' ? 'bg-blue-500' : 'bg-gray-300'
                  }`}>
                    {msg.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className={`font-medium truncate ${msg.status === 'new' ? 'text-gray-900' : 'text-gray-700'}`}>
                        {msg.name}
                      </p>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ${statusBadge(msg.status)}`}>
                        {statusLabel(msg.status)}
                      </span>
                    </div>
                    <p className={`text-sm truncate ${msg.status === 'new' ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>
                      {msg.subject}
                    </p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                      {msg.message.substring(0, 120)}...
                    </p>
                  </div>

                  {/* Meta */}
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-xs text-gray-400">{timeAgo(msg.created_at)}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteMessage(msg.id); }}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                        title="ลบ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); openDetail(msg); }}
                        className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg"
                        title="ดูรายละเอียด"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {meta.last_page > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-30 rounded-lg hover:bg-gray-100"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-gray-500">
                หน้า {meta.current_page} / {meta.last_page} ({meta.total} รายการ)
              </span>
              <button
                onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
                disabled={page === meta.last_page}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-30 rounded-lg hover:bg-gray-100"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
