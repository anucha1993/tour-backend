'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authApi } from '@/lib/api';
import {
  UserRole,
  MenuKey,
  Permission,
  canSeeMenu,
  hasPermission,
  canAccessRoute,
  getMenuKeyForPath,
} from '@/lib/permissions';

interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Check if user can see a sidebar menu */
  canSeeMenu: (menuKey: MenuKey) => boolean;
  /** Check if user has a specific permission on a menu section */
  hasPermission: (menuKey: MenuKey, permission: Permission) => boolean;
  /** Check if user can access a route by pathname */
  canAccessRoute: (pathname: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      // ดึงข้อมูล user ล่าสุดจาก API เพื่อให้ได้ role ที่ถูกต้อง
      try {
        const res = await authApi.me();
        if (res.success && res.data) {
          const freshUser = res.data as User;
          localStorage.setItem('user', JSON.stringify(freshUser));
          setUser(freshUser);
        } else {
          // Token หมดอายุ
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
        }
      } catch {
        // Fallback ไป localStorage ถ้า API ไม่ตอบ
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      }
      setIsLoading(false);
    };
    init();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    
    if (response.success && response.data) {
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setUser(response.data.user);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      // Ignore error, just clear local storage
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  const role = (user?.role as UserRole) || 'sale'; // Default to most restrictive

  const canSeeMenuFn = useCallback(
    (menuKey: MenuKey) => canSeeMenu(role, menuKey),
    [role]
  );

  const hasPermissionFn = useCallback(
    (menuKey: MenuKey, permission: Permission) => hasPermission(role, menuKey, permission),
    [role]
  );

  const canAccessRouteFn = useCallback(
    (pathname: string) => canAccessRoute(role, pathname),
    [role]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        canSeeMenu: canSeeMenuFn,
        hasPermission: hasPermissionFn,
        canAccessRoute: canAccessRouteFn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
