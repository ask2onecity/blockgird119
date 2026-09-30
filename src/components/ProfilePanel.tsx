import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, Users, ExternalLink, Image } from 'lucide-react';

interface ProfilePanelProps { walletId: string; onClose: () => void; }

interface WalletProfile {
  id: string; display_name: string | null; avatar_url: string | null;
  bio: string | null; followers_count: number; following_count: number;
  works: any[]; social_links: Record<string, string>;
  sol_address: string | null;
}

interface OwnedBlock { row: number; col: number; image_url: string | null; }

export function ProfilePanel({ walletId, onClose }: ProfilePanelProps) {
  const [profile, setProfile] = useState<WalletProfile | null>(null);
  const [ownedBlocks, setOwnedBlocks] = useState<OwnedBlock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchProfile(); fetchOwnedBlocks(); }, [walletId]);

  const fetchProfile = async () => {
    const { data, error } = await supabase.from('wallets').select('*').eq('id', walletId).maybeSingle();
    if (!error && data) setProfile(data);
    setLoading(false);
  };

  const fetchOwnedBlocks = async () => {
    const { data, error } = await supabase.from('blocks').select('row, col, image_url').eq('owner_wallet_id', walletId).eq('status', 'owned');
    if (!error && data) setOwnedBlocks(data);
  };

  const socialLabels: Record<string, string> = {
    twitter: 'X/Twitter', github: 'GitHub', discord: 'Discord',
    telegram: 'Telegram', website: 'Website', opensea: 'OpenSea',
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 dark:bg-gray-800 text-gray-400 dark:text-gray-500 dark:text-gray-400">
          <X className="w-5 h-5" />
        </button>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : profile ? (
          <>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center overflow-hidden shadow-lg shadow-emerald-200/50">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-white">{(profile.display_name || 'A')[0].toUpperCase()}</span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{profile.display_name || 'Anonymous'}</h2>
                  {profile.sol_address && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 dark:border-purple-900/30">
                      <span className="w-3 h-3 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
                        <span className="text-[6px] font-bold text-white">S</span>
                      </span>
                      <span className="text-[9px] font-mono font-medium text-purple-700 dark:text-purple-400">{profile.sol_address.slice(0, 4)}...{profile.sol_address.slice(-3)}</span>
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400 dark:text-gray-500 dark:text-gray-400 font-mono">{walletId.slice(0, 8)}...</p>
              </div>
            </div>
            {profile.bio && <p className="text-sm text-gray-600 dark:text-gray-300 dark:text-gray-600 mb-4 leading-relaxed">{profile.bio}</p>}
            <div className="flex items-center gap-6 mb-6">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{profile.followers_count} followers</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-gray-400 dark:text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{profile.following_count} following</span>
              </div>
            </div>
            {profile.social_links && Object.keys(profile.social_links).length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Social Links</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(profile.social_links).map(([key, value]) => (
                    <a key={key} href={value} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 dark:text-gray-600 hover:bg-emerald-50 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/20 hover:border-emerald-200 dark:border-emerald-800 dark:hover:border-emerald-800 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-400 transition-colors">
                      <ExternalLink className="w-3 h-3" />{socialLabels[key] || key}
                    </a>
                  ))}
                </div>
              </div>
            )}
            {profile.works && profile.works.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Works</h3>
                <div className="grid grid-cols-3 gap-2">
                  {profile.works.map((work: any, i: number) => (
                    <div key={i} className="aspect-square rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden border border-gray-200 dark:border-gray-700">
                      {work.image ? <img src={work.image} alt={work.title || ''} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><Image className="w-5 h-5 text-gray-300 dark:text-gray-600 dark:text-gray-300" /></div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Owned Blocks ({ownedBlocks.length})</h3>
              <div className="flex flex-wrap gap-1.5">
                {ownedBlocks.map((b) => (
                  <div key={`${b.row}-${b.col}`}
                    className="w-10 h-10 rounded-md bg-gradient-to-br from-emerald-400 to-green-500 border border-emerald-500 overflow-hidden"
                    title={`Row ${b.row}, Col ${b.col}`}>
                    {b.image_url ? <img src={b.image_url} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center">
                          <span className="text-[7px] font-mono text-white font-bold">
                            {String(b.row).padStart(2, '0')}{String(b.col).padStart(2, '0')}
                          </span>
                        </div>}
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12"><p className="text-gray-400 dark:text-gray-500 dark:text-gray-400">Profile not found</p></div>
        )}
      </div>
    </div>
  );
}
