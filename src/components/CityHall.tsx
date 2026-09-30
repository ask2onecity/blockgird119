import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useWallet } from '../lib/wallet-context';
import { useCity } from '../lib/city-context';
import { useAuth } from '../lib/auth-context';
import { Building2, Crown, Vote, Loader2, Check, X, Coins, Users, Calendar, TrendingUp } from 'lucide-react';

interface Election {
  id: string;
  cityId: string;
  status: string;
  termStart: string | null;
  termEnd: string | null;
}

interface Candidate {
  walletId: string;
  displayName: string | null;
  avatarUrl: string | null;
  voteCount: number;
}

interface FundProposal {
  id: string;
  title: string;
  description: string;
  amount: number;
  status: string;
  proposedByWalletId: string;
  proposerName: string | null;
  createdAt: string;
  approveCount: number;
  rejectCount: number;
  myVote: string | null;
}

export function CityHall() {
  const { wallet } = useWallet();
  const { profile } = useAuth();
  const { activeCity, cities, selectCity } = useCity();
  const [election, setElection] = useState<Election | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [myMayorVote, setMyMayorVote] = useState<string | null>(null);
  const [proposals, setProposals] = useState<FundProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<string | null>(null);
  const [showNewProposal, setShowNewProposal] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ totalBlocks: 0, totalOwners: 0, cityFundBalance: 0 });

  const cityId = activeCity?.id;

  const fetchAll = useCallback(async () => {
    if (!cityId) return;
    setLoading(true);
    setError('');

    // Fetch election
    const { data: elec } = await supabase
      .from('mayor_elections')
      .select('*')
      .eq('city_id', cityId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let activeElection: Election | null = null;
    if (elec) {
      activeElection = {
        id: elec.id, cityId: elec.city_id, status: elec.status,
        termStart: elec.term_start, termEnd: elec.term_end,
      };
      setElection(activeElection);

      // Fetch mayor votes
      const { data: mv } = await supabase
        .from('mayor_votes')
        .select('candidate_wallet_id, voter_wallet_id')
        .eq('election_id', elec.id);

      if (mv) {
        const counts: Record<string, number> = {};
        let myVote = null;
        mv.forEach((v: any) => {
          counts[v.candidate_wallet_id] = (counts[v.candidate_wallet_id] || 0) + 1;
          if (wallet && v.voter_wallet_id === wallet.id) myVote = v.candidate_wallet_id;
        });

        // Fetch candidate wallet info
        const candidateIds = Object.keys(counts);
        if (candidateIds.length > 0) {
          const { data: wallets } = await supabase
            .from('wallets')
            .select('id, display_name, avatar_url')
            .in('id', candidateIds);
          const cands: Candidate[] = candidateIds.map(wid => {
            const w = wallets?.find((x: any) => x.id === wid);
            return {
              walletId: wid,
              displayName: w?.display_name || null,
              avatarUrl: w?.avatar_url || null,
              voteCount: counts[wid],
            };
          }).sort((a, b) => b.voteCount - a.voteCount);
          setCandidates(cands);
        } else {
          setCandidates([]);
        }
        setMyMayorVote(myVote);
      }
    } else {
      setElection(null);
      setCandidates([]);
      setMyMayorVote(null);
    }

    // Fetch fund proposals
    const { data: props } = await supabase
      .from('city_fund_proposals')
      .select('*')
      .eq('city_id', cityId)
      .order('created_at', { ascending: false });

    if (props) {
      const proposalIds = props.map((p: any) => p.id);
      let fundVotes: any[] = [];
      if (proposalIds.length > 0) {
        const { data: fv } = await supabase
          .from('city_fund_votes')
          .select('proposal_id, vote, voter_wallet_id')
          .in('proposal_id', proposalIds);
        fundVotes = fv || [];
      }

      // Fetch proposer names
      const proposerIds = [...new Set(props.map((p: any) => p.proposed_by_wallet_id))];
      let proposerMap: Record<string, string> = {};
      if (proposerIds.length > 0) {
        const { data: pw } = await supabase
          .from('wallets')
          .select('id, display_name')
          .in('id', proposerIds);
        pw?.forEach((w: any) => { proposerMap[w.id] = w.display_name || 'Anonymous'; });
      }

      const mapped: FundProposal[] = props.map((p: any) => {
        const votes = fundVotes.filter((v: any) => v.proposal_id === p.id);
        const approveCount = votes.filter((v: any) => v.vote === 'approve').length;
        const rejectCount = votes.filter((v: any) => v.vote === 'reject').length;
        const myVote = wallet ? votes.find((v: any) => v.voter_wallet_id === wallet.id)?.vote || null : null;
        return {
          id: p.id, title: p.title, description: p.description,
          amount: p.amount, status: p.status,
          proposedByWalletId: p.proposed_by_wallet_id,
          proposerName: proposerMap[p.proposed_by_wallet_id] || 'Anonymous',
          createdAt: p.created_at,
          approveCount, rejectCount, myVote,
        };
      });
      setProposals(mapped);
    } else {
      setProposals([]);
    }

    // Fetch stats
    const { count: blockCount } = await supabase
      .from('blocks')
      .select('*', { count: 'exact', head: true })
      .eq('city_id', cityId)
      .eq('status', 'owned');

    const { data: ownerData } = await supabase
      .from('blocks')
      .select('owner_wallet_id')
      .eq('city_id', cityId)
      .eq('status', 'owned');

    const uniqueOwners = new Set(ownerData?.map((o: any) => o.owner_wallet_id) || []);
    setStats({
      totalBlocks: blockCount || 0,
      totalOwners: uniqueOwners.size,
      cityFundBalance: 0,
    });

    setLoading(false);
  }, [cityId, wallet]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleVoteMayor = async (candidateWalletId: string) => {
    if (!wallet || !election) return;
    setVoting(candidateWalletId);
    setError('');
    try {
      const { error } = await supabase
        .from('mayor_votes')
        .insert({ election_id: election.id, candidate_wallet_id: candidateWalletId, voter_wallet_id: wallet.id });
      if (error) {
        if (error.code === '23505') setError('You have already voted in this election.');
        else setError('Could not submit your vote.');
      } else {
        await fetchAll();
      }
    } catch { setError('An unexpected error occurred.'); }
    setVoting(null);
  };

  const handleVoteFund = async (proposalId: string, vote: 'approve' | 'reject') => {
    if (!wallet) return;
    setVoting(proposalId + vote);
    setError('');
    try {
      const { error } = await supabase
        .from('city_fund_votes')
        .insert({ proposal_id: proposalId, voter_wallet_id: wallet.id, vote });
      if (error) {
        if (error.code === '23505') setError('You have already voted on this proposal.');
        else setError('Could not submit your vote.');
      } else {
        await fetchAll();
      }
    } catch { setError('An unexpected error occurred.'); }
    setVoting(null);
  };

  const isMayor = election && candidates.length > 0 && wallet && candidates[0].walletId === wallet.id;

  if (!activeCity) {
    return <div className="p-6 text-center text-gray-400 dark:text-gray-500 dark:text-gray-400">Select a city first.</div>;
  }

  return (
    <div className="p-6 max-w-4xl">
      {/* City selector */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">City Hall</h1>
        <div className="flex items-center gap-1.5 ml-auto flex-wrap">
          {cities.map(c => (
            <button
              key={c.id}
              onClick={() => selectCity(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeCity.id === c.id ? 'text-white shadow-md' : 'bg-gray-100 dark:bg-gray-800 dark:bg-gray-800 text-gray-600 dark:text-gray-300 dark:text-gray-600 dark:text-gray-300 dark:text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              style={activeCity.id === c.id ? { backgroundColor: c.themeColor } : {}}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 dark:border-red-900/30 mb-4">
          <span className="text-sm text-red-700 dark:text-red-400">{error}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <span className="text-xs text-gray-400 dark:text-gray-500 dark:text-gray-400">Blocks Sold</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalBlocks}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <span className="text-xs text-gray-400 dark:text-gray-500 dark:text-gray-400">Citizens</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalOwners}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1">
            <Coins className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <span className="text-xs text-gray-400 dark:text-gray-500 dark:text-gray-400">City Fund</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">${stats.cityFundBalance.toLocaleString()}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-emerald-500 dark:text-emerald-400 animate-spin" />
        </div>
      ) : (
        <>
          {/* Mayor Election Section */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Crown className="w-5 h-5 text-amber-500 dark:text-amber-400" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Mayor Election</h2>
            </div>

            {!election ? (
              <div className="text-center py-6">
                <p className="text-sm text-gray-400 dark:text-gray-500 dark:text-gray-400 mb-2">No active election for {activeCity.name}.</p>
                {profile?.isAdmin && (
                  <button
                    onClick={async () => {
                      await supabase.from('mayor_elections').insert({ city_id: activeCity.id, status: 'voting' });
                      fetchAll();
                    }}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium"
                  >
                    Start Election
                  </button>
                )}
              </div>
            ) : election.status === 'closed' ? (
              <div className="text-center py-4">
                <Check className="w-8 h-8 text-emerald-500 dark:text-emerald-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-300 dark:text-gray-600">
                  Election closed. {candidates[0]?.displayName || 'Anonymous'} is the mayor of {activeCity.name}.
                </p>
                {election.termEnd && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 dark:text-gray-400 mt-1">
                    Term ends {new Date(election.termEnd).toLocaleDateString()}
                  </p>
                )}
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-4 text-xs text-gray-400 dark:text-gray-500 dark:text-gray-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Status: {election.status === 'voting' ? 'Voting in progress' : 'Pending'}</span>
                </div>
                {candidates.length === 0 ? (
                  <p className="text-sm text-gray-400 dark:text-gray-500 dark:text-gray-400 text-center py-4">
                    No candidates yet. Citizens can nominate themselves by purchasing a block and receiving votes.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {candidates.map((c, i) => (
                      <div key={c.walletId} className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                        i === 0 ? 'border-amber-200 dark:border-amber-800 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-900/20 dark:bg-amber-900/20' : 'border-gray-100 dark:border-gray-800 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 dark:bg-gray-800'
                      }`}>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center overflow-hidden">
                          {c.avatarUrl ? <img src={c.avatarUrl} alt="" className="w-full h-full object-cover" /> :
                            <span className="text-sm font-bold text-white">{(c.displayName || 'A')[0].toUpperCase()}</span>}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 dark:text-white">{c.displayName || 'Anonymous'}</p>
                            {i === 0 && <Crown className="w-4 h-4 text-amber-500 dark:text-amber-400" />}
                          </div>
                          <p className="text-xs text-gray-400 dark:text-gray-500 dark:text-gray-400">{c.voteCount} vote{c.voteCount !== 1 ? 's' : ''}</p>
                        </div>
                        {wallet && c.walletId !== wallet.id && (
                          <button
                            onClick={() => handleVoteMayor(c.walletId)}
                            disabled={!!myMayorVote || voting === c.walletId}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              myMayorVote === c.walletId
                                ? 'bg-emerald-50 dark:bg-emerald-900/20 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 dark:border-emerald-800'
                                : myMayorVote
                                  ? 'bg-gray-100 dark:bg-gray-800 dark:bg-gray-800 text-gray-400 dark:text-gray-500 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            }`}
                          >
                            {voting === c.walletId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
                              myMayorVote === c.walletId ? 'Voted' : myMayorVote ? 'Already voted' : 'Vote'}
                          </button>
                        )}
                        {wallet && c.walletId === wallet.id && (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">You</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {!wallet && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 dark:text-gray-400 text-center mt-3">Connect a wallet to vote.</p>
                )}
                {wallet && !myMayorVote && candidates.length > 0 && (
                  <div className="mt-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                    <p className="text-xs text-emerald-700 dark:text-emerald-400">
                      You can also nominate yourself! Ask other citizens to vote for your wallet.
                    </p>
                    <button
                      onClick={() => handleVoteMayor(wallet.id)}
                      disabled={voting === wallet.id}
                      className="mt-2 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium"
                    >
                      {voting === wallet.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Nominate Myself'}
                    </button>
                  </div>
                )}
                {profile?.isAdmin && election.status === 'voting' && (
                  <button
                    onClick={async () => {
                      const termStart = new Date();
                      const termEnd = new Date();
                      termEnd.setMonth(termEnd.getMonth() + 3);
                      await supabase.from('mayor_elections').update({
                        status: 'closed',
                        term_start: termStart.toISOString(),
                        term_end: termEnd.toISOString(),
                      }).eq('id', election.id);
                      fetchAll();
                    }}
                    className="mt-4 w-full py-2 rounded-lg border border-amber-200 dark:border-amber-800 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-sm font-medium hover:bg-amber-100 dark:hover:bg-amber-900/30"
                  >
                    Close Election & Declare Winner
                  </button>
                )}
              </>
            )}
          </div>

          {/* City Fund Section */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">City Fund</h2>
              </div>
              {isMayor && (
                <button
                  onClick={() => setShowNewProposal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium"
                >
                  <Vote className="w-3.5 h-3.5" /> New Proposal
                </button>
              )}
            </div>

            {proposals.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 dark:text-gray-400 text-center py-6">
                No fund proposals yet. {isMayor ? 'Create one as mayor.' : 'The mayor can propose fund usage.'}
              </p>
            ) : (
              <div className="space-y-3">
                {proposals.map(p => (
                  <div key={p.id} className="rounded-xl border border-gray-100 dark:border-gray-800 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">{p.title}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 dark:text-gray-400">by {p.proposerName} · {new Date(p.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.status === 'approved' ? 'bg-emerald-50 dark:bg-emerald-900/20 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 dark:text-emerald-400' :
                        p.status === 'rejected' ? 'bg-red-50 dark:bg-red-900/20 dark:bg-red-900/20 text-red-600 dark:text-red-400 dark:text-red-400' :
                        p.status === 'executed' ? 'bg-blue-50 dark:bg-blue-900/20 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 dark:text-blue-400' :
                        'bg-amber-50 dark:bg-amber-900/20 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 dark:text-amber-400'
                      }`}>
                        {p.status}
                      </span>
                    </div>
                    {p.description && <p className="text-sm text-gray-600 dark:text-gray-300 dark:text-gray-600 mb-3">{p.description}</p>}
                    <div className="flex items-center gap-4 text-sm mb-3">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">${p.amount.toLocaleString()}</span>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-emerald-600 dark:text-emerald-400">{p.approveCount} approve</span>
                        <span className="text-red-500 dark:text-red-400">{p.rejectCount} reject</span>
                      </div>
                    </div>
                    {p.status === 'pending' && wallet && !p.myVote && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleVoteFund(p.id, 'approve')}
                          disabled={voting === p.id + 'approve'}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium border border-emerald-200 dark:border-emerald-800"
                        >
                          {voting === p.id + 'approve' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          Approve
                        </button>
                        <button
                          onClick={() => handleVoteFund(p.id, 'reject')}
                          disabled={voting === p.id + 'reject'}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-medium border border-red-200 dark:border-red-800 dark:border-red-900/30"
                        >
                          {voting === p.id + 'reject' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                          Reject
                        </button>
                      </div>
                    )}
                    {p.myVote && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 dark:text-gray-400">You voted: {p.myVote}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* New Proposal Modal */}
      {showNewProposal && wallet && (
        <NewProposalModal
          cityId={activeCity.id}
          walletId={wallet.id}
          onClose={() => setShowNewProposal(false)}
          onCreated={() => { setShowNewProposal(false); fetchAll(); }}
        />
      )}
    </div>
  );
}

function NewProposalModal({ cityId, walletId, onClose, onCreated }: {
  cityId: string; walletId: string; onClose: () => void; onCreated: () => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!title.trim() || !amount) { setError('Title and amount are required.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const { error } = await supabase.from('city_fund_proposals').insert({
        city_id: cityId,
        proposed_by_wallet_id: walletId,
        title: title.trim(),
        description: description.trim(),
        amount: parseInt(amount),
        status: 'pending',
      });
      if (error) setError('Could not create proposal. Please try again.');
      else onCreated();
    } catch { setError('An unexpected error occurred.'); }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 dark:bg-gray-800 text-gray-400 dark:text-gray-500 dark:text-gray-400">
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <Coins className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">New Fund Proposal</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Propose city fund usage for infrastructure or welfare</p>
          </div>
        </div>
        {error && <p className="text-sm text-red-500 dark:text-red-400 mb-3">{error}</p>}
        <div className="space-y-3">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Proposal title (e.g. Build Digital Park)"
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 focus:border-emerald-400 dark:focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/30 text-sm outline-none"
          />
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe how the funds will be used..."
            className="w-full h-20 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 focus:border-emerald-400 dark:focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/30 text-sm resize-none outline-none"
          />
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="Amount ($)"
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 focus:border-emerald-400 dark:focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/30 text-sm outline-none"
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="mt-4 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-bold text-sm transition-all"
        >
          {submitting ? 'Creating...' : 'Create Proposal'}
        </button>
      </div>
    </div>
  );
}
