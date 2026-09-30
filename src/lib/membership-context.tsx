import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { supabase } from './supabase';
import { useAuth } from './auth-context';

export interface MembershipTier {
  id: string;
  name: string;
  slug: string;
  price_monthly: number;
  price_yearly: number;
  max_blocks: number;
  max_images: number;
  can_custom_image: boolean;
  can_social_links: boolean;
  can_works_showcase: boolean;
  priority_support: boolean;
  badge_color: string;
  description: string;
  sort_order: number;
}

export interface Membership {
  id: string;
  tier_id: string;
  tier?: MembershipTier;
  status: 'active' | 'expired' | 'cancelled';
  billing_cycle: 'monthly' | 'yearly';
  started_at: string;
  expires_at: string | null;
}

interface MembershipContextType {
  tier: MembershipTier | null;
  membership: Membership | null;
  loading: boolean;
  activateMembership: () => Promise<boolean>;
  refresh: () => Promise<void>;
}

const MembershipContext = createContext<MembershipContextType | null>(null);

export function MembershipProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [tier, setTier] = useState<MembershipTier | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTier = useCallback(async () => {
    const { data, error } = await supabase
      .from('membership_tiers')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (!error && data) {
      setTier({
        id: data.id,
        name: data.name,
        slug: data.slug,
        price_monthly: data.price_monthly,
        price_yearly: data.price_yearly,
        max_blocks: data.max_blocks,
        max_images: data.max_images,
        can_custom_image: data.can_custom_image,
        can_social_links: data.can_social_links,
        can_works_showcase: data.can_works_showcase,
        priority_support: data.priority_support,
        badge_color: data.badge_color,
        description: data.description,
        sort_order: data.sort_order,
      });
    }
  }, []);

  const fetchMembership = useCallback(async () => {
    if (!user) { setMembership(null); return; }
    const { data, error } = await supabase
      .from('memberships')
      .select('*, tier:membership_tiers(*)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();
    if (!error && data) {
      setMembership({
        id: data.id,
        tier_id: data.tier_id,
        tier: data.tier,
        status: data.status,
        billing_cycle: data.billing_cycle,
        started_at: data.started_at,
        expires_at: data.expires_at,
      });
    } else {
      setMembership(null);
    }
  }, [user]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchTier(), fetchMembership()]);
    setLoading(false);
  }, [fetchTier, fetchMembership]);

  useEffect(() => { refresh(); }, [refresh]);

  const activateMembership = useCallback(async (): Promise<boolean> => {
    if (!user || !tier) return false;
    const now = new Date();
    const expires = new Date(now);
    expires.setFullYear(expires.getFullYear() + 100);

    const { error } = await supabase.from('memberships').insert({
      user_id: user.id,
      tier_id: tier.id,
      status: 'active',
      billing_cycle: 'yearly',
      started_at: now.toISOString(),
      expires_at: expires.toISOString(),
    });
    if (error) return false;
    await fetchMembership();
    return true;
  }, [user, tier, fetchMembership]);

  return (
    <MembershipContext.Provider value={{ tier, membership, loading, activateMembership, refresh }}>
      {children}
    </MembershipContext.Provider>
  );
}

export function useMembership() {
  const ctx = useContext(MembershipContext);
  if (!ctx) throw new Error('useMembership must be used within MembershipProvider');
  return ctx;
}
