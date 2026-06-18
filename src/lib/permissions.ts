// ─── Role-Based Access Control (RBAC) ────────────────────────────
// Profiles: admin, sale, it
//
// sale  : ขาย(R), ใบจอง(R/W/D), ทัวร์(R)
// it    : ทุกเมนู ยกเว้น integrations, ผู้ใช้งาน, ตั้งค่า
// admin : ทุกเมนู + ทุกสิทธิ์

export type UserRole = 'admin' | 'sale' | 'it';

export type Permission = 'read' | 'write' | 'delete';

// ─── Menu Keys ───────────────────────────────────────────────────
// Each key maps to a top-level sidebar section
export type MenuKey =
  | 'dashboard'
  | 'wholesalers'
  | 'integrations'
  | 'sales'
  | 'bookings'
  | 'tours'
  | 'gallery'
  | 'gallery-videos'
  | 'master-data'
  | 'users'
  | 'web-members'
  | 'member-points'
  | 'reviews'
  | 'website'
  | 'settings';

// ─── Per-role menu access & permissions ──────────────────────────
interface MenuPermission {
  visible: boolean;
  permissions: Permission[];
}

type RolePermissions = Record<MenuKey, MenuPermission>;

const ALL_PERMISSIONS: Permission[] = ['read', 'write', 'delete'];
const READ_ONLY: Permission[] = ['read'];

const FULL_ACCESS: MenuPermission = { visible: true, permissions: ALL_PERMISSIONS };
const READ_ACCESS: MenuPermission = { visible: true, permissions: READ_ONLY };
const NO_ACCESS: MenuPermission = { visible: false, permissions: [] };

// ─── Admin: ทุกเมนู ─────────────────────────────────────────────
const adminPermissions: RolePermissions = {
  dashboard: FULL_ACCESS,
  wholesalers: FULL_ACCESS,
  integrations: FULL_ACCESS,
  sales: FULL_ACCESS,
  bookings: FULL_ACCESS,
  tours: FULL_ACCESS,
  gallery: FULL_ACCESS,
  'gallery-videos': FULL_ACCESS,
  'master-data': FULL_ACCESS,
  users: FULL_ACCESS,
  'web-members': FULL_ACCESS,
  'member-points': FULL_ACCESS,
  reviews: FULL_ACCESS,
  website: FULL_ACCESS,
  settings: FULL_ACCESS,
};

// ─── Sale: ขาย(R), ใบจอง(R/W/D), ทัวร์(R) ─────────────────────
const salePermissions: RolePermissions = {
  dashboard: READ_ACCESS,
  wholesalers: NO_ACCESS,
  integrations: NO_ACCESS,
  sales: READ_ACCESS,
  bookings: { visible: true, permissions: ALL_PERMISSIONS },
  tours: READ_ACCESS,
  gallery: NO_ACCESS,
  'gallery-videos': NO_ACCESS,
  'master-data': NO_ACCESS,
  users: NO_ACCESS,
  'web-members': NO_ACCESS,
  'member-points': NO_ACCESS,
  reviews: NO_ACCESS,
  website: NO_ACCESS,
  settings: NO_ACCESS,
};

// ─── IT: ทุกเมนู ยกเว้น integrations, ผู้ใช้งาน, ตั้งค่า ──────
const itPermissions: RolePermissions = {
  dashboard: FULL_ACCESS,
  wholesalers: FULL_ACCESS,
  integrations: NO_ACCESS,
  sales: FULL_ACCESS,
  bookings: FULL_ACCESS,
  tours: FULL_ACCESS,
  gallery: FULL_ACCESS,
  'gallery-videos': FULL_ACCESS,
  'master-data': FULL_ACCESS,
  users: NO_ACCESS,
  'web-members': FULL_ACCESS,
  'member-points': FULL_ACCESS,
  reviews: FULL_ACCESS,
  website: FULL_ACCESS,
  settings: NO_ACCESS,
};

const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  admin: adminPermissions,
  sale: salePermissions,
  it: itPermissions,
};

// ─── Route → MenuKey mapping ─────────────────────────────────────
// Maps URL path prefixes to menu keys for route-level protection
const ROUTE_MENU_MAP: { prefix: string; menuKey: MenuKey }[] = [
  { prefix: '/dashboard/integrations', menuKey: 'integrations' },
  { prefix: '/dashboard/wholesalers', menuKey: 'wholesalers' },
  { prefix: '/dashboard/sales', menuKey: 'sales' },
  { prefix: '/dashboard/bookings', menuKey: 'bookings' },
  { prefix: '/dashboard/tours', menuKey: 'tours' },
  { prefix: '/dashboard/gallery-videos', menuKey: 'gallery-videos' },
  { prefix: '/dashboard/gallery', menuKey: 'gallery' },
  { prefix: '/dashboard/transports', menuKey: 'master-data' },
  { prefix: '/dashboard/countries', menuKey: 'master-data' },
  { prefix: '/dashboard/cities', menuKey: 'master-data' },
  { prefix: '/dashboard/users', menuKey: 'users' },
  { prefix: '/dashboard/web-members', menuKey: 'web-members' },
  { prefix: '/dashboard/member-points', menuKey: 'member-points' },
  { prefix: '/dashboard/reviews', menuKey: 'reviews' },
  { prefix: '/dashboard/hero-slides', menuKey: 'website' },
  { prefix: '/dashboard/about', menuKey: 'website' },
  { prefix: '/dashboard/blog', menuKey: 'website' },
  { prefix: '/dashboard/website', menuKey: 'website' },
  { prefix: '/dashboard/subscribers', menuKey: 'website' },
  { prefix: '/dashboard/settings', menuKey: 'settings' },
];

// ─── Sidebar Menu Title → MenuKey mapping ────────────────────────
// Used by Sidebar to filter visible menus
export const MENU_TITLE_KEY_MAP: Record<string, MenuKey> = {
  'แดชบอร์ด': 'dashboard',
  'โฮลเซลล์': 'wholesalers',
  'Integrations': 'integrations',
  'ขาย': 'sales',
  'ใบจอง': 'bookings',
  'ทัวร์': 'tours',
  'Gallery รูปภาพ': 'gallery',
  'Gallery วิดีโอ': 'gallery-videos',
  'ข้อมูลหลัก': 'master-data',
  'ผู้ใช้งาน': 'users',
  'สมาชิกเว็บ': 'web-members',
  'ระบบคะแนนสมาชิก': 'member-points',
  'รีวิวทัวร์': 'reviews',
  'จัดการเว็บไซต์': 'website',
  'ตั้งค่า': 'settings',
};

// ─── Public API ──────────────────────────────────────────────────

/** Get permission config for a menu item */
export function getMenuPermission(role: UserRole, menuKey: MenuKey): MenuPermission {
  return ROLE_PERMISSIONS[role]?.[menuKey] ?? NO_ACCESS;
}

/** Check if a menu is visible for a role */
export function canSeeMenu(role: UserRole, menuKey: MenuKey): boolean {
  return getMenuPermission(role, menuKey).visible;
}

/** Check if role has a specific permission on a menu */
export function hasPermission(role: UserRole, menuKey: MenuKey, permission: Permission): boolean {
  const mp = getMenuPermission(role, menuKey);
  return mp.visible && mp.permissions.includes(permission);
}

/** Resolve which menu key a given pathname belongs to */
export function getMenuKeyForPath(pathname: string): MenuKey | null {
  // /dashboard exact = dashboard
  if (pathname === '/dashboard') return 'dashboard';
  for (const { prefix, menuKey } of ROUTE_MENU_MAP) {
    if (pathname === prefix || pathname.startsWith(prefix + '/') || pathname.startsWith(prefix + '?')) {
      return menuKey;
    }
  }
  return null;
}

/** Check if a user role can access a given route */
export function canAccessRoute(role: UserRole, pathname: string): boolean {
  const menuKey = getMenuKeyForPath(pathname);
  if (!menuKey) return true; // Unknown routes default to allowed
  return canSeeMenu(role, menuKey);
}

/** Role display labels */
export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'ผู้ดูแลระบบ',
  sale: 'ฝ่ายขาย',
  it: 'ฝ่ายไอที',
};

export const ROLE_OPTIONS: { value: UserRole; label: string; description: string }[] = [
  { value: 'admin', label: 'ผู้ดูแลระบบ', description: 'เข้าถึงทุกฟังก์ชันในระบบ' },
  { value: 'sale', label: 'ฝ่ายขาย', description: 'เมนูขาย, ใบจอง, ทัวร์' },
  { value: 'it', label: 'ฝ่ายไอที', description: 'ทุกเมนู ยกเว้น Integration, ผู้ใช้งาน, ตั้งค่า' },
];

/** Menu labels in display order */
export const MENU_LABELS: { key: MenuKey; label: string }[] = [
  { key: 'dashboard', label: 'แดชบอร์ด' },
  { key: 'wholesalers', label: 'โฮลเซลล์' },
  { key: 'integrations', label: 'Integrations' },
  { key: 'sales', label: 'ขาย' },
  { key: 'bookings', label: 'ใบจอง' },
  { key: 'tours', label: 'ทัวร์' },
  { key: 'gallery', label: 'Gallery รูปภาพ' },
  { key: 'gallery-videos', label: 'Gallery วิดีโอ' },
  { key: 'master-data', label: 'ข้อมูลหลัก' },
  { key: 'users', label: 'ผู้ใช้งาน' },
  { key: 'web-members', label: 'สมาชิกเว็บ' },
  { key: 'member-points', label: 'ระบบคะแนนสมาชิก' },
  { key: 'reviews', label: 'รีวิวทัวร์' },
  { key: 'website', label: 'จัดการเว็บไซต์' },
  { key: 'settings', label: 'ตั้งค่า' },
];

/** Get detailed permission matrix for a role */
export function getRolePermissionMatrix(role: UserRole) {
  return MENU_LABELS.map(({ key, label }) => {
    const mp = getMenuPermission(role, key);
    return {
      menu: label,
      visible: mp.visible,
      read: mp.permissions.includes('read'),
      write: mp.permissions.includes('write'),
      delete: mp.permissions.includes('delete'),
    };
  });
}
