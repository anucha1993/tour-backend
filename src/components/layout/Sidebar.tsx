'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { toursApi, TourCounts } from '@/lib/api';
import QueueStatus from './QueueStatus';
import {
  LayoutDashboard,
  Building2,
  Map,
  Calendar,
  Settings,
  Users,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Database,
  Plane,
  Globe,
  MapPin,
  ImageIcon,
  Plug,
  Cloud,
  PenLine,
  CheckCircle,
  FileEdit,
  XCircle,
  Search,
  ShoppingCart,
  Mail,
  Smartphone,
  Tag,
  Layers,
  Star,
  Shield,
  Megaphone,
  Menu,
  Phone,
} from 'lucide-react';

interface MenuItem {
  title: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: MenuItem[];
  countKey?: string; // Key to lookup count from TourCounts
}

// Function to build menu items with counts
const buildMenuItems = (counts?: TourCounts): MenuItem[] => [
  {
    title: 'แดชบอร์ด',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'โฮลเซลล์',
    href: '/dashboard/wholesalers',
    icon: Building2,
  },
  {
    title: 'Integrations',
    href: '/dashboard/integrations',
    icon: Plug,
  },
  {
    title: 'ขาย',
    icon: ShoppingCart,
    children: [
      {
        title: 'ค้นหาทัวร์ (Realtime)',
        href: '/dashboard/sales/search',
        icon: Search,
      },
    ],
  },
  {
    title: 'ทัวร์',
    icon: Map,
    children: [
      {
        title: `ทั้งหมด${counts ? ` (${counts.total})` : ''}`,
        href: '/dashboard/tours',
        icon: Map,
      },
      {
        title: `จาก API${counts ? ` (${counts.by_data_source.api})` : ''}`,
        href: '/dashboard/tours?data_source=api',
        icon: Cloud,
      },
      {
        title: `สร้างเอง${counts ? ` (${counts.by_data_source.manual})` : ''}`,
        href: '/dashboard/tours?data_source=manual',
        icon: PenLine,
      },
      {
        title: `เปิดใช้งาน${counts ? ` (${counts.by_status.active})` : ''}`,
        href: '/dashboard/tours?status=active',
        icon: CheckCircle,
      },
      {
        title: `แบบร่าง${counts ? ` (${counts.by_status.draft})` : ''}`,
        href: '/dashboard/tours?status=draft',
        icon: FileEdit,
      },
      {
        title: `ปิดใช้งาน${counts ? ` (${counts.by_status.inactive})` : ''}`,
        href: '/dashboard/tours?status=inactive',
        icon: XCircle,
      },
    ],
  },
  {
    title: 'Gallery รูปภาพ',
    href: '/dashboard/gallery',
    icon: ImageIcon,
  },

  // TODO: สร้างหน้า departures
  // {
  //   title: 'รอบเดินทาง',
  //   href: '/dashboard/departures',
  //   icon: Calendar,
  // },
  {
    title: 'ข้อมูลหลัก',
    icon: Database,
    children: [
      {
        title: 'ผู้ให้บริการขนส่ง',
        href: '/dashboard/transports',
        icon: Plane,
      },
      {
        title: 'ประเทศ',
        href: '/dashboard/countries',
        icon: Globe,
      },
      {
        title: 'เมือง',
        href: '/dashboard/cities',
        icon: Building2,
      },
      // TODO: สร้างหน้า airports
      // {
      //   title: 'สนามบิน',
      //   href: '/dashboard/airports',
      //   icon: MapPin,
      // },
    ],
  },
  
  {
    title: 'ผู้ใช้งาน',
    href: '/dashboard/users',
    icon: Users,
  },
  {
    title: 'สมาชิกเว็บ',
    href: '/dashboard/web-members',
    icon: Users,
  },
  {
    title: 'รีวิวทัวร์',
    href: '/dashboard/reviews',
    icon: Star,
  },
  {
    title: 'จัดการเว็บไซต์',
    icon: FileText,
    children: [
        {
    title: 'Hero Slides',
    href: '/dashboard/hero-slides',
    icon: ImageIcon,
  },
  {
    title: 'ประเทศยอดนิยม',
    href: '/dashboard/website/popular-countries',
    icon: Globe,
  },
  {
    title: 'โปรโมชั่น',
    href: '/dashboard/website/promotions',
    icon: Tag,
  },
  {
    title: 'การจัดการโปรโมชั่น',
    href: '/dashboard/website/promotion-management',
    icon: Layers,
  },
  {
    title: 'ทัวร์แนะนำ',
    href: '/dashboard/website/recommended-tours',
    icon: Star,
  },
  {
    title: 'ทัวร์ต่างประเทศ',
    href: '/dashboard/website/international-tours',
    icon: Globe,
  },
  {
    title: 'ทัวร์ในประเทศ',
    href: '/dashboard/website/domestic-tours',
    icon: MapPin,
  },
  {
    title: 'ทัวร์ตามเทศกาล',
    href: '/dashboard/website/festival-tours',
    icon: Calendar,
  },
  {
    title: 'ทำไมต้องเลือกเรา',
    href: '/dashboard/website/why-choose-us',
    icon: Star,
  },
  {
    title: 'ลูกค้าของเรา',
    href: '/dashboard/website/our-clients',
    icon: Users,
  },
  {
    title: 'Popup',
    href: '/dashboard/website/popups',
    icon: Megaphone,
  },
  {
    title: 'เมนูเว็บไซต์',
    href: '/dashboard/website/menus',
    icon: Menu,
  },
  {
    title: 'SEO',
    href: '/dashboard/website/seo',
    icon: Search,
  },
  {
    title: 'ข้อมูลติดต่อ',
    href: '/dashboard/website/site-contacts',
    icon: Phone,
  },
  {
    title: 'Subscribers & Newsletter',
    href: '/dashboard/subscribers',
    icon: Mail,
  },
      {
        title: 'ทั่วไป',
        icon: FileText,
        children: [
          {
            title: 'นโยบายคุกกี้',
            href: '/dashboard/website/general/cookie-policy',
            icon: FileText,
          },
          {
            title: 'นโยบายความเป็นส่วนตัว',
            href: '/dashboard/website/general/privacy-policy',
            icon: FileText,
          },
          {
            title: 'เงื่อนไขการให้บริการ',
            href: '/dashboard/website/member/terms',
            icon: FileText,
          },
          {
            title: 'เงื่อนไขการชำระเงิน',
            href: '/dashboard/website/member/payment-terms',
            icon: FileText,
          },
          {
            title: 'ช่องทางการชำระเงิน',
            href: '/dashboard/website/general/payment-channels',
            icon: FileText,
          },
        ],
      },
      {
        title: 'หน้าสมาชิก',
        icon: Users,
        children: [
          {
            title: 'เข้าสู่ระบบ (Login)',
            href: '/dashboard/website/member/login-page',
            icon: FileText,
          },
          {
            title: 'สมัครสมาชิก (Register)',
            href: '/dashboard/website/member/register-page',
            icon: FileText,
          },
        ],
      },
    ],
  },
  // TODO: สร้างหน้า reports
  // {
  //   title: 'รายงาน',
  //   href: '/dashboard/reports',
  //   icon: FileText,
  // },
  {
    title: 'ตั้งค่า',
    icon: Settings,
    children: [
      {
        title: 'Smart Sync',
        href: '/dashboard/settings/smart-sync',
        icon: Shield,
      },
      {
        title: 'Aggregation',
        href: '/dashboard/settings/aggregation',
        icon: Settings,
      },
      {
        title: 'SMTP',
        href: '/dashboard/settings/smtp',
        icon: Mail,
      },
      {
        title: 'OTP',
        href: '/dashboard/settings/otp',
        icon: Smartphone,
      },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [tourCounts, setTourCounts] = useState<TourCounts | null>(null);
  
  // Fetch tour counts
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const response = await toursApi.getCounts();
        if (response.success && response.data) {
          setTourCounts(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch tour counts:', error);
      }
    };
    fetchCounts();
    
    // Refresh counts every 60 seconds
    const interval = setInterval(fetchCounts, 60000);
    return () => clearInterval(interval);
  }, []);
  
  // Build menu items with counts
  const menuItems = buildMenuItems(tourCounts || undefined);
  
  // Build current full URL for matching
  const currentUrl = searchParams.toString() 
    ? `${pathname}?${searchParams.toString()}`
    : pathname;
  
  // Helper to check if menu item is active
  const isMenuItemActive = (href: string) => {
    if (!href) return false;
    
    // Exact match for URLs with query params
    if (href.includes('?')) {
      return currentUrl === href;
    }
    
    // For URLs without query params, match only if no query params in current URL
    if (pathname === href && !searchParams.toString()) {
      return true;
    }
    
    // Prefix match for nested routes (but not for /dashboard/tours with query params)
    if (href !== '/dashboard' && !href.includes('?') && pathname.startsWith(href + '/')) {
      return true;
    }
    
    return false;
  };

  const [expandedMenus, setExpandedMenus] = useState<string[]>(() => {
    // Auto-expand parent menu if child is active
    const expanded: string[] = [];
    menuItems.forEach((item) => {
      if (item.children) {
        const hasActiveChild = item.children.some(
          (child) => child.href && isMenuItemActive(child.href)
        );
        if (hasActiveChild || (pathname.startsWith('/dashboard/tours'))) {
          if (item.title === 'ทัวร์' && pathname.startsWith('/dashboard/tours')) {
            expanded.push(item.title);
          } else if (hasActiveChild) {
            expanded.push(item.title);
          }
        }
      }
    });
    return expanded;
  });

  const closeMobile = () => setMobileOpen(false);

  const toggleMenu = (title: string) => {
    setExpandedMenus((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  const isMenuExpanded = (title: string) => expandedMenus.includes(title);

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen bg-white border-r border-gray-200 transition-all duration-300 flex flex-col',
          // Desktop - always visible
          'lg:translate-x-0',
          collapsed ? 'lg:w-[72px]' : 'lg:w-64',
          // Mobile - slide in/out
          'w-[280px] -translate-x-full',
          mobileOpen && 'translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100">
          <Link href="/dashboard" className="flex items-center gap-3" onClick={closeMobile}>
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-lg">N</span>
            </div>
            {(!collapsed || mobileOpen) && (
              <span className="text-xl font-bold text-gray-900">NextTrip</span>
            )}
          </Link>
          
          {/* Close button - Mobile */}
          <button
            onClick={closeMobile}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Collapse button - Desktop */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors hidden lg:block"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = isMenuExpanded(item.title);
            
            // Check if any child is active
            const hasActiveChild = hasChildren && item.children!.some(
              (child) => child.href && isMenuItemActive(child.href)
            );
            
            const isActive = item.href 
              ? isMenuItemActive(item.href)
              : hasActiveChild;

            if (hasChildren) {
              return (
                <div key={item.title}>
                  <button
                    onClick={() => toggleMenu(item.title)}
                    className={cn(
                      'flex items-center justify-between w-full px-3 py-2.5 rounded-lg transition-all duration-200',
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                      collapsed && !mobileOpen && 'lg:justify-center lg:px-2'
                    )}
                    title={collapsed && !mobileOpen ? item.title : undefined}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={cn(
                        'w-5 h-5 shrink-0',
                        isActive ? 'text-blue-600' : 'text-gray-500'
                      )} />
                      {(!collapsed || mobileOpen) && (
                        <span className="truncate">{item.title}</span>
                      )}
                    </div>
                    {(!collapsed || mobileOpen) && (
                      <ChevronDown className={cn(
                        'w-4 h-4 transition-transform duration-200',
                        isExpanded && 'rotate-180'
                      )} />
                    )}
                  </button>
                  
                  {/* Submenu */}
                  {(!collapsed || mobileOpen) && isExpanded && (
                    <div className="mt-1 ml-4 pl-4 border-l border-gray-200 space-y-1">
                      {item.children!.map((child) => {
                        const ChildIcon = child.icon;
                        const hasGrandChildren = child.children && child.children.length > 0;
                        const isGrandExpanded = isMenuExpanded(child.title);
                        
                        // Check if any grandchild is active
                        const hasActiveGrandChild = hasGrandChildren && child.children!.some(
                          (grandChild) => grandChild.href && isMenuItemActive(grandChild.href)
                        );
                        
                        const isChildActive = child.href 
                          ? isMenuItemActive(child.href)
                          : hasActiveGrandChild;

                        if (hasGrandChildren) {
                          return (
                            <div key={child.title}>
                              <button
                                onClick={() => toggleMenu(child.title)}
                                className={cn(
                                  'flex items-center justify-between w-full px-3 py-2 rounded-lg transition-all duration-200 text-sm',
                                  isChildActive
                                    ? 'bg-blue-50 text-blue-700 font-medium'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  <ChildIcon className={cn(
                                    'w-4 h-4 shrink-0',
                                    isChildActive ? 'text-blue-600' : 'text-gray-500'
                                  )} />
                                  <span className="truncate">{child.title}</span>
                                </div>
                                <ChevronDown className={cn(
                                  'w-3 h-3 transition-transform duration-200',
                                  isGrandExpanded && 'rotate-180'
                                )} />
                              </button>
                              
                              {/* Grandchild submenu */}
                              {isGrandExpanded && (
                                <div className="mt-1 ml-4 pl-3 border-l border-gray-100 space-y-1">
                                  {child.children!.map((grandChild) => {
                                    const GrandChildIcon = grandChild.icon;
                                    const isGrandChildActive = grandChild.href && isMenuItemActive(grandChild.href);

                                    return (
                                      <Link
                                        key={grandChild.href}
                                        href={grandChild.href!}
                                        onClick={closeMobile}
                                        className={cn(
                                          'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 text-xs',
                                          isGrandChildActive
                                            ? 'bg-blue-50 text-blue-700 font-medium'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        )}
                                      >
                                        <GrandChildIcon className={cn(
                                          'w-3.5 h-3.5 shrink-0',
                                          isGrandChildActive ? 'text-blue-600' : 'text-gray-500'
                                        )} />
                                        <span className="truncate">{grandChild.title}</span>
                                      </Link>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        }

                        return (
                          <Link
                            key={child.href}
                            href={child.href!}
                            onClick={closeMobile}
                            className={cn(
                              'flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm',
                              isChildActive
                                ? 'bg-blue-50 text-blue-700 font-medium'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            )}
                          >
                            <ChildIcon className={cn(
                              'w-4 h-4 shrink-0',
                              isChildActive ? 'text-blue-600' : 'text-gray-500'
                            )} />
                            <span className="truncate">{child.title}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href!}
                onClick={closeMobile}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  collapsed && !mobileOpen && 'lg:justify-center lg:px-2'
                )}
                title={collapsed && !mobileOpen ? item.title : undefined}
              >
                <Icon className={cn(
                  'w-5 h-5 shrink-0',
                  isActive ? 'text-blue-600' : 'text-gray-500'
                )} />
                {(!collapsed || mobileOpen) && (
                  <span className="truncate">{item.title}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Queue Status */}
        {(!collapsed || mobileOpen) && <QueueStatus />}

        {/* Footer */}
        {(!collapsed || mobileOpen) && (
          <div className="p-4 border-t border-gray-100 bg-white shrink-0">
            <div className="text-xs text-gray-400 text-center">
              NextTrip แอดมิน v1.0
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
