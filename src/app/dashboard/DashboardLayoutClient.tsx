'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar, Header } from '@/components/layout';
import { cn } from '@/lib/utils';
import { ShieldAlert } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, canAccessRoute } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  // Sidebar state
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, []);

  const hasRouteAccess = canAccessRoute(pathname);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar 
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <div className={cn(
        'transition-all duration-300',
        // Desktop - adjust for sidebar
        collapsed ? 'lg:pl-[72px]' : 'lg:pl-64',
        // Mobile - no padding
        'pl-0'
      )}>
        <Header onMenuClick={() => setMobileOpen(true)} />
        <main className="p-4 lg:p-6">
          {hasRouteAccess ? children : (
            <div className="flex flex-col items-center justify-center py-20">
              <ShieldAlert className="w-16 h-16 text-red-400 mb-4" />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">ไม่มีสิทธิ์เข้าถึง</h2>
              <p className="text-gray-500 mb-6">คุณไม่มีสิทธิ์เข้าถึงหน้านี้ กรุณาติดต่อผู้ดูแลระบบ</p>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                กลับหน้าแดชบอร์ด
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
