"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import type { User, UserRole } from '@/lib/types';
import { mockUsers } from '@/lib/mockData';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password_DO_NOT_USE_IN_PROD: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Simulate checking for persisted auth state (e.g., from localStorage)
    const storedUser = localStorage.getItem('freightflow-user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading && !user && !pathname.startsWith('/login')) {
      router.push('/login');
    }
  }, [user, loading, pathname, router]);

  const login = async (email: string, password_DO_NOT_USE_IN_PROD: string, role: UserRole): Promise<boolean> => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Hardcoded validation
    const foundUser = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase() && u.role === role);
    
    // For prototype, let's ignore password and just check email and role
    if (foundUser) {
      const userToLogin = { ...foundUser, token: `mock-token-${Date.now()}` };
      setUser(userToLogin);
      localStorage.setItem('freightflow-user', JSON.stringify(userToLogin));
      setLoading(false);
      return true;
    }
    
    setUser(null);
    setLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('freightflow-user');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
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
