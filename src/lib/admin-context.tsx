import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { supabase } from './supabase';
import { useWallet } from './wallet-context';

export interface AdminRole {
  id: string;
  role: 'super_admin' | 'admin' | 'moderator';
  is_active: boolean;
  granted_at: string;
}

interface AdminContextType {
  adminRole: AdminRole | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isModerator: boolean;
  loading: boolean;
  refreshRole: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const { wallet } = useWallet();
  const [adminRole, setAdminRole] = useState<AdminRole | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshRole = useCallback(async () => {
    if (!wallet) {
      setAdminRole(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('admin_roles')
      .select('id, role, is_active, granted_at')
      .eq('wallet_id', wallet.id)
      .eq('is_active', true)
      .maybeSingle();
    if (!error && data) {
      setAdminRole({
        id: data.id,
        role: data.role,
        is_active: data.is_active,
        granted_at: data.granted_at,
      });
    } else {
      setAdminRole(null);
    }
    setLoading(false);
  }, [wallet]);

  useEffect(() => { refreshRole(); }, [refreshRole]);

  const isAdmin = adminRole?.role === 'super_admin' || adminRole?.role === 'admin';
  const isSuperAdmin = adminRole?.role === 'super_admin';
  const isModerator = adminRole?.role === 'moderator' || isAdmin;

  return (
    <AdminContext.Provider value={{ adminRole, isAdmin, isSuperAdmin, isModerator, loading, refreshRole }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
}
