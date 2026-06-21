'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui';
import {
  Building2,
  RefreshCw,
  Loader2,
  ArrowRight,
  Eye,
  ShoppingCart,
  Wallet,
  Users,
  Globe2,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { dashboardApi, DashboardSummary } from '@/lib/api';

const STATUS_CHART = [
  { key: 'pending', label: 'รอดำเนินการ', color: '#f59e0b' },
  { key: 'confirmed', label: 'ยืนยันแล้ว', color: '#3b82f6' },
  { key: 'paid', label: 'ชำระแล้ว', color: '#10b981' },
  { key: 'completed', label: 'เสร็จสิ้น', color: '#22c55e' },
  { key: 'cancelled', label: 'ยกเลิก', color: '#ef4444' },
];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await dashboardApi.getSummary();
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError('Failed to load dashboard');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (n: number) => n.toLocaleString('th-TH');
  const formatMoney = (n: number) =>
    '฿' + n.toLocaleString('th-TH', { maximumFractionDigits: 0 });

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const diffMin = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diffMin < 1) return 'เมื่อสักครู่';
    if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} ชั่วโมงที่แล้ว`;
    return `${Math.floor(diffHr / 24)} วันที่แล้ว`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <span className="ml-3 text-gray-500">กำลังโหลด Dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={fetchDashboard} className="text-blue-600 hover:underline">
          ลองใหม่
        </button>
      </div>
    );
  }

  if (!data) return null;

  const stats = data.stats;
  const booking_stats = data.booking_stats ?? {
    total: 0, pending: 0, confirmed: 0, paid: 0, completed: 0,
    cancelled: 0, this_month: 0, revenue: 0, from_website: 0, from_flash_sale: 0,
  };
  const views_by_country = data.views_by_country ?? [];
  const bookings_by_country = data.bookings_by_country ?? [];
  const recent_bookings = data.recent_bookings ?? [];

  // Chart data
  const statusFunnelData = STATUS_CHART
    .map((s) => ({
      name: s.label,
      value: (booking_stats as unknown as Record<string, number>)[s.key] || 0,
      fill: s.color,
      label: `${s.label} : ${((booking_stats as unknown as Record<string, number>)[s.key] || 0).toLocaleString('th-TH')}`,
    }))
    .filter((d) => d.value > 0);

  const viewsChartData = views_by_country.map((c) => ({
    name: `${c.flag || '🌍'} ${c.name}`,
    views: c.total_views,
  }));

  const bookingsChartData = bookings_by_country.map((c) => ({
    name: `${c.flag || '🌍'} ${c.name}`,
    bookings: c.bookings_count,
    revenue: c.revenue,
  }));

  // Recent bookings amounts grouped by country for HLC (high/low/close)
  const hlcMap = new Map<string, { name: string; high: number; low: number; close: number }>();
  for (const b of recent_bookings) {
    const key = `${b.flag || '🌍'} ${b.country || 'อื่นๆ'}`;
    const cur = hlcMap.get(key);
    if (!cur) {
      hlcMap.set(key, { name: key, high: b.total_amount, low: b.total_amount, close: b.total_amount });
    } else {
      cur.high = Math.max(cur.high, b.total_amount);
      cur.low = Math.min(cur.low, b.total_amount);
      // close = ยอดล่าสุด (รายการแรกสุดที่เจอ = ใหม่สุด) ไม่ทับ
    }
  }
  const hlcData = Array.from(hlcMap.values()).map((d) => ({
    ...d,
    range: [d.low, d.high] as [number, number],
  }));

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 p-6 sm:p-8 text-white shadow-lg shadow-blue-500/20">
        {/* Decorative blobs */}
        <div className="absolute -top-16 -right-10 w-56 h-56 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-20 left-1/3 w-64 h-64 bg-cyan-300/20 rounded-full blur-3xl" />
        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-xs font-medium mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />
              ข้อมูลเรียลไทม์
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">ภาพรวมสถิติ</h1>
            <p className="text-blue-100 mt-1 text-sm">สถิติผู้เข้าชมเว็บไซต์และการจองทัวร์</p>
          </div>
          <button
            onClick={fetchDashboard}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur text-sm font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            รีเฟรช
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="ยอดเข้าชมทัวร์ทั้งหมด"
          value={formatNumber(stats.total_views ?? 0)}
          hint={`${formatNumber(stats.published_tours ?? 0)} ทัวร์เผยแพร่`}
          icon={<Eye className="w-6 h-6" />}
          color="blue"
        />
        <KpiCard
          label="การจองทั้งหมด"
          value={formatNumber(booking_stats.total)}
          hint={`${formatNumber(booking_stats.this_month)} รายการเดือนนี้`}
          icon={<ShoppingCart className="w-6 h-6" />}
          color="orange"
        />
        <KpiCard
          label="รายได้ (ยืนยัน/ชำระแล้ว)"
          value={formatMoney(booking_stats.revenue)}
          hint={`${formatNumber(booking_stats.paid + booking_stats.completed)} รายการสำเร็จ`}
          icon={<Wallet className="w-6 h-6" />}
          color="green"
        />
        <KpiCard
          label="สมาชิกเว็บไซต์"
          value={formatNumber(stats.total_members ?? 0)}
          hint={`${formatNumber(booking_stats.from_website)} จองผ่านเว็บ`}
          icon={<Users className="w-6 h-6" />}
          color="purple"
        />
      </div>

      {/* Booking status donut + KPI summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">สถานะการจอง</h2>
          </div>
          <CardContent className="p-5">
            {statusFunnelData.length === 0 ? (
              <p className="text-center text-gray-400 py-10">ยังไม่มีข้อมูลการจอง</p>
            ) : (
              <div className="flex flex-col">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Tooltip
                      formatter={(value) => [`${Number(value).toLocaleString('th-TH')} รายการ`, '']}
                      contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
                    />
                    <Pie
                      data={statusFunnelData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={110}
                      paddingAngle={1}
                      stroke="#fff"
                      strokeWidth={2}
                      isAnimationActive
                      label={({ percent }) => `${Math.round((percent ?? 0) * 100)}%`}
                      labelLine={false}
                    >
                      {statusFunnelData.map((d) => (
                        <Cell key={d.name} fill={d.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 w-full">
                  {STATUS_CHART.map((s) => (
                    <div key={s.key} className="flex items-center gap-2 text-sm">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                      <span className="text-gray-600 flex-1">{s.label}</span>
                      <span className="font-semibold text-gray-900">
                        {formatNumber((booking_stats as unknown as Record<string, number>)[s.key] || 0)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Views by country bar chart */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <Globe2 className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900">ความสนใจแยกตามประเทศ</h2>
            <span className="text-xs text-gray-400 ml-auto">ยอดเข้าชม</span>
          </div>
          <CardContent className="p-5">
            {viewsChartData.length === 0 ? (
              <p className="text-center text-gray-400 py-10">ยังไม่มีข้อมูล</p>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(300, viewsChartData.length * 30)}>
                <RadarChart data={viewsChartData} outerRadius="78%" margin={{ top: 12, right: 24, bottom: 12, left: 24 }}>
                  <defs>
                    <linearGradient id="viewsGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#60a5fa" />
                      <stop offset="100%" stopColor="#2563eb" />
                    </linearGradient>
                  </defs>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="name" tick={{ fontSize: 12, fill: '#475569' }} />
                  <PolarRadiusAxis angle={90} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} />
                  <Tooltip
                    formatter={(value) => [`${Number(value).toLocaleString('th-TH')} วิว`, 'ยอดเข้าชม']}
                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
                  />
                  <Radar
                    name="ยอดเข้าชม"
                    dataKey="views"
                    stroke="#2563eb"
                    strokeWidth={2}
                    fill="url(#viewsGrad)"
                    fillOpacity={0.55}
                    isAnimationActive
                  />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Bookings by country line chart */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-gray-900">การจองแยกตามประเทศ</h2>
            <span className="text-xs text-gray-400 ml-auto">จำนวนการจอง</span>
          </div>
          <CardContent className="p-5">
            {bookingsChartData.length === 0 ? (
              <p className="text-center text-gray-400 py-10">ยังไม่มีข้อมูลการจอง</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={bookingsChartData} margin={{ top: 12, right: 16, bottom: 4, left: -8 }}>
                  <defs>
                    <linearGradient id="bookingsLineGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#fb923c" />
                      <stop offset="100%" stopColor="#ea580c" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#475569' }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(value) => [`${Number(value).toLocaleString('th-TH')} รายการ`, 'การจอง']}
                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="bookings"
                    stroke="url(#bookingsLineGrad)"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#ea580c', strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                    isAnimationActive
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent bookings */}
      <Card>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <h2 className="text-lg font-semibold text-gray-900">การจองล่าสุด</h2>
            <span className="text-xs text-gray-400">ยอดเงิน สูงสุด/ต่ำสุด/ล่าสุด ต่อประเทศ</span>
          </div>
          <Link href="/dashboard/bookings" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
            ดูทั้งหมด <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <CardContent className="p-5">
          {hlcData.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-400">ยังไม่มีการจอง</div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart data={hlcData} margin={{ top: 12, right: 16, bottom: 40, left: 8 }}>
                <defs>
                  <linearGradient id="hlcAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#475569' }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tickFormatter={(v: number) => formatMoney(v)}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  width={80}
                />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === 'range' && Array.isArray(value)) {
                      return [`${formatMoney(Number(value[0]))} – ${formatMoney(Number(value[1]))}`, 'ต่ำสุด–สูงสุด'];
                    }
                    return [formatMoney(Number(value)), 'ล่าสุด'];
                  }}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Area
                  dataKey="range"
                  stroke="#a5b4fc"
                  strokeWidth={1}
                  fill="url(#hlcAreaGrad)"
                  isAnimationActive
                  activeDot={false}
                />
                <Line
                  type="monotone"
                  dataKey="close"
                  stroke="#4f46e5"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#4f46e5', strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                  isAnimationActive
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* System / Sync Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Syncs */}
        <div className="lg:col-span-2">
          <Card>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Sync ทัวร์ล่าสุด</h2>
              <Link href="/dashboard/integrations" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                ดูทั้งหมด <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                {data.recent_syncs.length === 0 ? (
                  <div className="px-6 py-8 text-center text-gray-400">ยังไม่มีข้อมูล Sync</div>
                ) : (
                  data.recent_syncs.map((sync) => (
                    <div key={sync.id} className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50 transition-colors">
                      <div className="flex-shrink-0">
                        {sync.status === 'completed' ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : sync.status === 'failed' ? (
                          <XCircle className="w-4 h-4 text-red-500" />
                        ) : sync.status === 'running' ? (
                          <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                        ) : (
                          <Clock className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-gray-900">{sync.wholesaler_name}</span>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {sync.tours_received} ทัวร์
                          {sync.tours_created > 0 && <span className="text-green-600"> · +{sync.tours_created} ใหม่</span>}
                          {sync.tours_updated > 0 && <span className="text-blue-600"> · {sync.tours_updated} อัพเดท</span>}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0">{formatTimeAgo(sync.started_at)}</span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tours per Wholesaler */}
        <div>
          <Card>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">ทัวร์ต่อ Wholesaler</h2>
              <Link href="/dashboard/wholesalers" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                ดูทั้งหมด <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                {data.tours_per_wholesaler.slice(0, 6).map((ws) => (
                  <div key={ws.id} className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 transition-colors">
                    <div className="flex-shrink-0">
                      {ws.logo_url ? (
                        <img src={ws.logo_url} alt={ws.name} className="w-8 h-8 rounded-lg object-contain bg-white border border-gray-100" />
                      ) : (
                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-blue-500" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{ws.name}</p>
                      <span className="text-xs text-gray-400 font-mono">{ws.code}</span>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                      {ws.tours_count} ทัวร์
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ===== Sub-components =====
function KpiCard({
  label,
  value,
  hint,
  icon,
  color,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
  color: 'blue' | 'orange' | 'green' | 'purple';
}) {
  const colorMap: Record<string, { grad: string; glow: string; text: string }> = {
    blue: { grad: 'from-blue-500 to-cyan-500', glow: 'shadow-blue-500/30', text: 'text-blue-50' },
    orange: { grad: 'from-orange-500 to-amber-500', glow: 'shadow-orange-500/30', text: 'text-orange-50' },
    green: { grad: 'from-emerald-500 to-green-500', glow: 'shadow-emerald-500/30', text: 'text-emerald-50' },
    purple: { grad: 'from-violet-500 to-purple-500', glow: 'shadow-purple-500/30', text: 'text-violet-50' },
  };
  const c = colorMap[color];
  return (
    <div className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${c.grad} p-5 text-white shadow-lg ${c.glow} transition-transform duration-300 hover:-translate-y-1`}>
      {/* Decorative circle */}
      <div className="absolute -top-8 -right-8 w-28 h-28 bg-white/10 rounded-full transition-transform duration-500 group-hover:scale-125" />
      <div className="relative flex items-start justify-between">
        <div className="min-w-0">
          <p className={`text-sm font-medium ${c.text}`}>{label}</p>
          <p className="text-3xl font-bold mt-1.5 truncate tracking-tight">{value}</p>
          <p className={`text-xs mt-2 flex items-center gap-1 ${c.text}`}>
            <TrendingUp className="w-3 h-3" />
            {hint}
          </p>
        </div>
        <div className="p-3 rounded-xl flex-shrink-0 bg-white/20 backdrop-blur">{icon}</div>
      </div>
    </div>
  );
}
