import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { hashMnemonic } from '../lib/utils';
import { supabase } from '../lib/supabase';

export interface WalletData {
  id: string;
  mnemonic: string;
  mnemonicHash: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  followersCount: number;
  followingCount: number;
  works: any[];
  socialLinks: Record<string, string>;
  isAdmin: boolean;
  membershipTierId: string | null;
  solAddress: string | null;
  solConnectedAt: string | null;
}

interface WalletContextType {
  wallet: WalletData | null;
  isRestoring: boolean;
  createWallet: (mnemonic: string, mnemonicHash: string, walletId: string) => void;
  restoreWallet: (mnemonic: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updates: Partial<WalletData>) => Promise<void>;
  connectSolWallet: (address: string) => Promise<boolean>;
  disconnectSolWallet: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | null>(null);

const WALLET_STORAGE_KEY = 'xcitydao_wallet';

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<WalletData | null>(() => {
    try {
      const stored = localStorage.getItem(WALLET_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return null;
  });
  const [isRestoring, setIsRestoring] = useState(false);

  const persist = (w: WalletData) => {
    setWallet(w);
    localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(w));
  };

  const createWallet = useCallback((mnemonic: string, mnemonicHash: string, walletId: string) => {
    const newWallet: WalletData = {
      id: walletId, mnemonic, mnemonicHash,
      displayName: null, avatarUrl: null, bio: null,
      followersCount: 0, followingCount: 0,
      works: [], socialLinks: {},
      isAdmin: false, membershipTierId: null,
      solAddress: null, solConnectedAt: null,
    };
    persist(newWallet);
  }, []);

  const restoreWallet = useCallback(async (mnemonic: string): Promise<boolean> => {
    setIsRestoring(true);
    try {
      const mHash = await hashMnemonic(mnemonic);
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('mnemonic_hash', mHash)
        .maybeSingle();
      if (error || !data) { setIsRestoring(false); return false; }
      const restored: WalletData = {
        id: data.id, mnemonic, mnemonicHash: data.mnemonic_hash,
        displayName: data.display_name, avatarUrl: data.avatar_url,
        bio: data.bio, followersCount: data.followers_count,
        followingCount: data.following_count,
        works: data.works || [], socialLinks: data.social_links || {},
        isAdmin: data.is_admin || false, membershipTierId: data.membership_tier_id || null,
        solAddress: data.sol_address || null, solConnectedAt: data.sol_connected_at || null,
      };
      persist(restored);
      setIsRestoring(false);
      return true;
    } catch { setIsRestoring(false); return false; }
  }, []);

  const logout = useCallback(() => {
    setWallet(null);
    localStorage.removeItem(WALLET_STORAGE_KEY);
  }, []);

  const updateProfile = useCallback(async (updates: Partial<WalletData>) => {
    if (!wallet) return;
    const dbUpdates: Record<string, any> = {};
    if (updates.displayName !== undefined) dbUpdates.display_name = updates.displayName;
    if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
    if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
    if (updates.works !== undefined) dbUpdates.works = updates.works;
    if (updates.socialLinks !== undefined) dbUpdates.social_links = updates.socialLinks;
    const { error } = await supabase.from('wallets').update(dbUpdates).eq('id', wallet.id);
    if (!error) {
      persist({ ...wallet, ...updates });
    }
  }, [wallet]);

  const connectSolWallet = useCallback(async (address: string): Promise<boolean> => {
    if (!wallet) return false;
    const { data: existing } = await supabase
      .from('wallets')
      .select('id')
      .eq('sol_address', address)
      .maybeSingle();
    if (existing && existing.id !== wallet.id) return false;

    const now = new Date().toISOString();
    const { error } = await supabase
      .from('wallets')
      .update({ sol_address: address, sol_connected_at: now })
      .eq('id', wallet.id);
    if (!error) {
      persist({ ...wallet, solAddress: address, solConnectedAt: now });
      return true;
    }
    return false;
  }, [wallet]);

  const disconnectSolWallet = useCallback(async () => {
    if (!wallet) return;
    const { error } = await supabase
      .from('wallets')
      .update({ sol_address: null, sol_connected_at: null })
      .eq('id', wallet.id);
    if (!error) {
      persist({ ...wallet, solAddress: null, solConnectedAt: null });
    }
  }, [wallet]);

  return (
    <WalletContext.Provider value={{
      wallet, isRestoring, createWallet, restoreWallet, logout, updateProfile,
      connectSolWallet, disconnectSolWallet,
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}
