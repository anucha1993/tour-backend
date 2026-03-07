import DashboardLayoutClient from './DashboardLayoutClient';

// Force all dashboard pages to be dynamic (no static prerendering)
// This prevents the "workUnitAsyncStorage" error for all 'use client' pages
export const dynamic = 'force-dynamic';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
