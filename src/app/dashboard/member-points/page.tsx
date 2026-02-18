'use client';

import { useState, useEffect } from 'react';
import { memberPointsApi, MemberPointStats } from '@/lib/api';
import {
  Trophy,
  Users,
  TrendingUp,
  TrendingDown,
  Gift,
  Award,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';

export default function MemberPointsDashboard() {
  const [stats, setStats] = useState<MemberPointStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await memberPointsApi.stats();
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12 text-gray-500">
        ไม่สามารถโหลดข้อมูลได้
      </div>
    );
  }

  const statCards = [
    {
      title: 'สมาชิกทั้งหมด',
      value: stats.total_members.toLocaleString(),
      icon: Users,
      color: 'bg-blue-500',
      link: '/dashboard/member-points/members',
    },
    {
      title: 'คะแนนหมุนเวียน',
      value: stats.total_points_circulating.toLocaleString(),
      icon: Trophy,
      color: 'bg-amber-500',
    },
    {
      title: 'คะแนนได้รับวันนี้',
      value: `+${stats.points_earned_today.toLocaleString()}`,
      icon: TrendingUp,
      color: 'bg-green-500',
    },
    {
      title: 'คะแนนใช้ไปวันนี้',
      value: stats.points_spent_today.toLocaleString(),
      icon: TrendingDown,
      color: 'bg-red-500',
    },
    {
      title: 'แลกคะแนนวันนี้',
      value: `${stats.redemptions_today} ครั้ง`,
      icon: Gift,
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Trophy className="w-7 h-7 text-amber-500" />
            ระบบคะแนนสมาชิก
          </h1>
          <p className="text-gray-500 mt-1">ภาพรวมระบบคะแนนและระดับสมาชิก</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/member-points/levels"
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <Award className="w-4 h-4" />
            จัดการระดับ
          </Link>
          <Link
            href="/dashboard/member-points/rules"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
          >
            <Gift className="w-4 h-4" />
            กฎการให้คะแนน
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <div
            key={card.title}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow"
          >
            {card.link ? (
              <Link href={card.link} className="block">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{card.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                  </div>
                  <div className={`${card.color} p-2 rounded-lg`}>
                    <card.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </Link>
            ) : (
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                </div>
                <div className={`${card.color} p-2 rounded-lg`}>
                  <card.icon className="w-5 h-5 text-white" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Level Distribution */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          การกระจายระดับสมาชิก
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.level_distribution.map((level) => {
            const percentage =
              stats.total_members > 0
                ? ((level.count / stats.total_members) * 100).toFixed(1)
                : '0';
            return (
              <div
                key={level.name}
                className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{level.icon || '🏅'}</span>
                  <div>
                    <p className="font-semibold text-gray-900">{level.name}</p>
                    <p className="text-xs text-gray-500">{level.color}</p>
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {level.count.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">สมาชิก</p>
                  </div>
                  <p className="text-sm font-medium text-gray-600">{percentage}%</p>
                </div>
                <div className="mt-2 bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/dashboard/member-points/levels"
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group"
        >
          <Award className="w-8 h-8 text-amber-500 mb-3" />
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
            จัดการระดับสมาชิก
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            ตั้งค่าระดับ Bronze, Silver, Gold, Platinum
          </p>
        </Link>
        <Link
          href="/dashboard/member-points/rules"
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group"
        >
          <Gift className="w-8 h-8 text-green-500 mb-3" />
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
            กฎการให้คะแนน
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            ตั้งค่าคะแนนจากการดูหน้า, รีวิว, จอง
          </p>
        </Link>
        <Link
          href="/dashboard/member-points/members"
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group"
        >
          <Users className="w-8 h-8 text-blue-500 mb-3" />
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
            คะแนนสมาชิก
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            ดูและปรับคะแนนสมาชิก, ประวัติธุรกรรม
          </p>
        </Link>
      </div>
    </div>
  );
}
