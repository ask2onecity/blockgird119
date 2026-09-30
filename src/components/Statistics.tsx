import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TrendingUp, Blocks, Users, DollarSign, Activity, Crown } from 'lucide-react';

export function Statistics() {
  const [stats, setStats] = useState({
    totalBlocks: 1188,
    blocksOwned: 0,
    uniqueOwners: 0,
    totalValue: 0,
    avgBlockPrice: 0,
    totalMembers: 0,
    activeMemberships: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const { data, error } = await supabase
        .from('blocks')
        .select('price, owner_wallet_id')
        .eq('status', 'owned');

      if (!error && data) {
        const owners = new Set(data.map((b: any) => b.owner_wallet_id)).size;
        const totalValue = data.reduce((sum: number, b: any) => sum + (b.price || 0), 0);
        const avgPrice = data.length > 0 ? Math.round(totalValue / data.length) : 0;

        setStats(prev => ({
          ...prev,
          blocksOwned: data.length,
          uniqueOwners: owners,
          totalValue,
          avgBlockPrice: avgPrice,
        }));
      }

      const { data: memberData } = await supabase
        .from('memberships')
        .select('status')
        .in('status', ['active', 'expired', 'cancelled']);

      if (memberData) {
        const active = memberData.filter((m: any) => m.status === 'active').length;
        setStats(prev => ({
          ...prev,
          totalMembers: memberData.length,
          activeMemberships: active,
        }));
      }
    } catch (err) {
      console.error('Failed to fetch statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Blocks',
      value: stats.totalBlocks,
      icon: Blocks,
      color: 'from-emerald-500 to-green-600',
      description: '12 columns x 99 rows',
    },
    {
      title: 'Blocks Owned',
      value: stats.blocksOwned,
      icon: Activity,
      color: 'from-blue-500 to-cyan-600',
      description: `${Math.round((stats.blocksOwned / stats.totalBlocks) * 100)}% of grid`,
    },
    {
      title: 'Unique Owners',
      value: stats.uniqueOwners,
      icon: Users,
      color: 'from-rose-500 to-red-600',
      description: 'Community members',
    },
    {
      title: 'Total Value',
      value: `$${stats.totalValue.toLocaleString()}`,
      icon: DollarSign,
      color: 'from-amber-500 to-orange-600',
      description: `Avg: $${stats.avgBlockPrice.toLocaleString()}`,
    },
    {
      title: 'Active Members',
      value: stats.activeMemberships,
      icon: Crown,
      color: 'from-yellow-500 to-amber-600',
      description: 'Premium subscribers',
    },
  ];

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center gap-2 mb-8">
        <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Grid Statistics</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
            <div className="w-5 h-5 border-2 border-emerald-600 dark:border-emerald-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium">Loading statistics...</span>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {statCards.map((card, i) => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className={`h-1 bg-gradient-to-r ${card.color}`} />
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <card.icon className={`w-5 h-5 bg-gradient-to-br ${card.color} bg-clip-text text-transparent`} />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 dark:text-gray-600 mb-1">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{card.value}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 dark:text-gray-400">{card.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">Growth Insights</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300 dark:text-gray-600">Grid Occupancy</span>
                  <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{Math.round((stats.blocksOwned / stats.totalBlocks) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(stats.blocksOwned / stats.totalBlocks) * 100}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-gray-600 dark:text-gray-300 dark:text-gray-600">Membership Adoption</span>
                  <span className="text-lg font-bold text-amber-600 dark:text-amber-400">{stats.activeMemberships}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-yellow-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((stats.activeMemberships / Math.max(stats.uniqueOwners, 1)) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-gray-800 dark:to-gray-700 rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">About XCITYDAO</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 dark:text-gray-600 leading-relaxed">
                XCITYDAO is a decentralized pixel grid combining identity, traffic, and community. Each block represents a piece of the Web3 ecosystem where creators and communities can establish their digital presence.
              </p>
              <div className="mt-4 pt-4 border-t border-emerald-200 dark:border-emerald-800">
                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Membership tiers unlock premium features like custom images, works showcase, and priority support.</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
