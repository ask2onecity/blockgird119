import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Award } from 'lucide-react';

interface WalletProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  followers_count: number;
  sol_address: string | null;
}

export function Community() {
  const [profiles, setProfiles] = useState<WalletProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCommunity();
  }, []);

  const fetchCommunity = async () => {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('id, display_name, avatar_url, bio, followers_count, sol_address')
        .gt('followers_count', 0)
        .order('followers_count', { ascending: false })
        .limit(20);

      if (!error && data) {
        setProfiles(data);
      }
    } catch (err) {
      console.error('Failed to fetch community:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center gap-2 mb-8">
        <Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Community</h1>
      </div>

      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-6 mb-8">
        <p className="text-gray-700 dark:text-gray-200 leading-relaxed">
          Meet the XCITYDAO community members who are building their digital presence on the grid. Connect, collaborate, and grow together.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
            <div className="w-5 h-5 border-2 border-emerald-600 dark:border-emerald-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium">Loading community...</span>
          </div>
        </div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 dark:text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 dark:text-gray-500 dark:text-gray-400">No community members yet. Be the first to join!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {profiles.map((profile, i) => (
            <div key={profile.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow p-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-md">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg font-bold text-white">{(profile.display_name || 'M')[0].toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">{profile.display_name || 'Anonymous'}</h3>
                    {i === 0 && <Award className="w-5 h-5 text-amber-500 dark:text-amber-400 flex-shrink-0" />}
                    {profile.sol_address && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 dark:border-purple-900/30">
                        <span className="w-3 h-3 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
                          <span className="text-[6px] font-bold text-white">S</span>
                        </span>
                        <span className="text-[9px] font-mono font-medium text-purple-700 dark:text-purple-400">{profile.sol_address.slice(0, 4)}...{profile.sol_address.slice(-3)}</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 font-mono mb-2">{profile.id.slice(0, 12)}...</p>
                  {profile.bio && <p className="text-sm text-gray-600 dark:text-gray-300 dark:text-gray-600 mb-3 line-clamp-2">{profile.bio}</p>}
                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{profile.followers_count}</span>
                      <span className="text-gray-400 dark:text-gray-500 ml-1">followers</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
