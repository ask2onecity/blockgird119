import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useWallet } from '../lib/wallet-context';
import { X, Lock, Vote, Check, AlertCircle, Loader2 } from 'lucide-react';
import type { District } from '../lib/city-context';

interface DistrictVotePanelProps {
  cityId: string;
  cityName: string;
  districts: District[];
  onVoted: () => Promise<void>;
  onClose: () => void;
}

export function DistrictVotePanel({ cityId, cityName, districts, onVoted, onClose }: DistrictVotePanelProps) {
  const { wallet } = useWallet();
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [myVotes, setMyVotes] = useState<Set<string>>(new Set());
  const [voting, setVoting] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const lockedDistricts = districts.filter(d => d.status === 'locked' || d.status === 'voting');
  const sortedLocked = [...lockedDistricts].sort((a, b) => a.letter.localeCompare(b.letter));

  useEffect(() => {
    fetchVoteData();
  }, [cityId]);

  const fetchVoteData = async () => {
    setLoading(true);
    const lockedIds = lockedDistricts.map(d => d.id);
    if (lockedIds.length === 0) { setLoading(false); return; }

    const { data: votes } = await supabase
      .from('district_unlock_votes')
      .select('district_id, voter_wallet_id')
      .in('district_id', lockedIds);

    const counts: Record<string, number> = {};
    const mySet = new Set<string>();
    votes?.forEach((v: any) => {
      counts[v.district_id] = (counts[v.district_id] || 0) + 1;
      if (wallet && v.voter_wallet_id === wallet.id) mySet.add(v.district_id);
    });
    setVoteCounts(counts);
    setMyVotes(mySet);
    setLoading(false);
  };

  const handleVote = async (districtId: string) => {
    if (!wallet) { setError('You need a wallet to vote. Purchase a block first.'); return; }
    setVoting(districtId);
    setError('');
    try {
      const { error } = await supabase
        .from('district_unlock_votes')
        .insert({ district_id: districtId, voter_wallet_id: wallet.id });
      if (error) {
        if (error.code === '23505') setError('You have already voted for this district.');
        else setError('Could not submit your vote. Please try again.');
      } else {
        await fetchVoteData();
        await onVoted();
      }
    } catch {
      setError('An unexpected error occurred.');
    }
    setVoting(null);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg p-6 relative max-h-[80vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 dark:bg-gray-800 text-gray-400 dark:text-gray-500">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <Vote className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Unlock New Districts</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{cityName} — Vote to expand the city</p>
          </div>
        </div>

        {!wallet && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 mb-4">
            <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-400">You need a wallet and at least one block to vote. Purchase a block in an unlocked district first.</p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 mb-4">
            <span className="text-sm text-red-700 dark:text-red-400">{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
          </div>
        ) : sortedLocked.length === 0 ? (
          <div className="text-center py-8">
            <Check className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">All districts are already unlocked!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedLocked.map(d => {
              const votes = voteCounts[d.id] || 0;
              const hasVoted = myVotes.has(d.id);
              const threshold = d.unlockVoteThreshold;
              const pct = threshold > 0 ? Math.min(100, (votes / threshold) * 100) : 0;

              return (
                <div key={d.id} className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <Lock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">District {d.letter.toUpperCase()}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">99×12 blocks available</p>
                      </div>
                    </div>
                    {hasVoted && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                        <Check className="w-3 h-3" /> Voted
                      </span>
                    )}
                  </div>

                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-1">
                      <span>{votes} votes</span>
                      <span>{threshold} needed</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                      <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  <button
                    onClick={() => handleVote(d.id)}
                    disabled={hasVoted || !wallet || voting === d.id}
                    className="w-full py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed
                      ${hasVoted
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-amber-500 hover:bg-amber-600 text-white'}"
                  >
                    {voting === d.id ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Voting...
                      </span>
                    ) : hasVoted ? 'Vote Submitted' : 'Vote to Unlock'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-4">
          Districts unlock sequentially. Sell out District A before B can open, and so on.
        </p>
      </div>
    </div>
  );
}
