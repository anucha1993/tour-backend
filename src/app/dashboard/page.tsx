'use client';

import { Card, CardContent } from '@/components/ui';
import { 
  Building2, 
  Map, 
  Calendar, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  DollarSign,
} from 'lucide-react';

const stats = [
  {
    title: 'Total Wholesalers',
    value: '12',
    change: '+2',
    changeType: 'positive',
    icon: Building2,
    color: 'blue',
  },
  {
    title: 'Active Tours',
    value: '248',
    change: '+18',
    changeType: 'positive',
    icon: Map,
    color: 'green',
  },
  {
    title: 'Departures This Month',
    value: '56',
    change: '-3',
    changeType: 'negative',
    icon: Calendar,
    color: 'purple',
  },
  {
    title: 'Bookings Today',
    value: '24',
    change: '+12%',
    changeType: 'positive',
    icon: TrendingUp,
    color: 'orange',
  },
];

const recentActivities = [
  { action: 'New tour added', tour: 'ทัวร์ญี่ปุ่น โตเกียว 5D4N', time: '5 นาทีที่แล้ว', icon: Map },
  { action: 'Wholesaler synced', tour: 'ZEGO - 45 tours updated', time: '15 นาทีที่แล้ว', icon: Building2 },
  { action: 'New departure', tour: 'ทัวร์เกาหลี 25 ม.ค. 2026', time: '1 ชั่วโมงที่แล้ว', icon: Calendar },
  { action: 'Price updated', tour: 'ทัวร์จีน กวางเจา 4D3N', time: '2 ชั่วโมงที่แล้ว', icon: DollarSign },
];

const colorClasses = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  purple: 'bg-purple-50 text-purple-600',
  orange: 'bg-orange-50 text-orange-600',
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} hover>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                    <div className="flex items-center gap-1 mt-2">
                      {stat.changeType === 'positive' ? (
                        <ArrowUpRight className="w-4 h-4 text-green-500" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-500" />
                      )}
                      <span className={stat.changeType === 'positive' ? 'text-green-600 text-sm' : 'text-red-600 text-sm'}>
                        {stat.change}
                      </span>
                      <span className="text-gray-400 text-sm">vs last month</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-xl ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <Card>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
              <a href="#" className="text-sm text-blue-600 hover:text-blue-700">View all</a>
            </div>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                {recentActivities.map((activity, index) => {
                  const Icon = activity.icon;
                  return (
                    <div key={index} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="p-2 rounded-lg bg-gray-100">
                        <Icon className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                        <p className="text-sm text-gray-500 truncate">{activity.tour}</p>
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap">{activity.time}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <Card>
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            </div>
            <CardContent className="space-y-3">
              <button className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-left">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Add Wholesaler</p>
                  <p className="text-xs text-gray-500">Register new partner</p>
                </div>
              </button>
              <button className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors text-left">
                <div className="p-2 rounded-lg bg-green-100">
                  <Map className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Sync Tours</p>
                  <p className="text-xs text-gray-500">Pull latest tour data</p>
                </div>
              </button>
              <button className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors text-left">
                <div className="p-2 rounded-lg bg-purple-100">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Manage Users</p>
                  <p className="text-xs text-gray-500">Add or edit team members</p>
                </div>
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
