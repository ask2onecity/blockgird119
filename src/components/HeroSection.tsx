import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useWallet } from '../lib/wallet-context';
import { ArrowDown, Blocks, Users, TrendingUp, Zap, Wallet, KeyRound, Loader2 } from 'lucide-react';
import { useWallet as useSolWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export function HeroSection() {
  const [stats, setStats] = useState({ blocks: 0, owners: 0, totalValue: 0 });
  const { wallet, restoreWallet } = useWallet();
  const { connected: solConnected } = useSolWallet();
  const [showRestore, setShowRestore] = useState(false);
  const [mnemonicInput, setMnemonicInput] = useState('');
  const [restoreError, setRestoreError] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    const { data } = await supabase.from('blocks').select('price, owner_wallet_id').eq('status', 'owned');
    if (data && data.length > 0) {
      const owners = new Set(data.map((b: any) => b.owner_wallet_id)).size;
      const totalValue = data.reduce((sum: number, b: any) => sum + (b.price || 0), 0);
      setStats({ blocks: data.length, owners, totalValue });
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    setRestoreError('');
    const success = await restoreWallet(mnemonicInput.trim());
    setIsRestoring(false);
    if (success) { setShowRestore(false); setMnemonicInput(''); }
    else setRestoreError('Invalid mnemonic or wallet not found');
  };

  return (
    <>
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/80 via-white to-white" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl" />
        <div className="absolute top-20 right-1/4 w-64 h-64 bg-green-200/20 rounded-full blur-3xl" />
        <div className="relative max-w-[1600px] mx-auto px-4 sm:px-6 pt-12 pb-8">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 mb-6">
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-xs font-semibold text-emerald-700 tracking-wide uppercase">Decentralized Identity Grid</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 leading-tight">
              Own Your Space on the
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-500"> Blockchain</span>
            </h1>
            <p className="text-lg text-gray-500 mb-8 leading-relaxed">
              XCITYDAO is a decentralized pixel grid where identity, traffic, and community converge.
              Purchase blocks, build your digital presence, and connect with the Web3 ecosystem.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
              {/* Solana Wallet Connect */}
              <div className="w-full sm:w-auto">
                <div className="[&_button]:!w-full [&_button]:!sm:w-auto [&_button]:!flex [&_button]:!items-center [&_button]:!justify-center [&_button]:!gap-2.5 [&_button]:!px-6 [&_button]:!py-3.5 [&_button]:!rounded-xl [&_button]:!text-sm [&_button]:!font-bold [&_button]:!bg-gradient-to-r [&_button]:!from-purple-600 [&_button]:!to-violet-600 [&_button]:!hover:from-purple-700 [&_button]:!hover:to-violet-700 [&_button]:!text-white [&_button]:!shadow-lg [&_button]:!shadow-purple-200/50 [&_button]:!border-0 [&_button]:!transition-all [&_button]:!active:scale-[0.98]">
                  <WalletMultiButton />
                </div>
              </div>

              {/* Membership Login / Restore Wallet */}
              {!wallet ? (
                <button
                  onClick={() => setShowRestore(true)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-bold bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg shadow-emerald-200/50 transition-all active:scale-[0.98]"
                >
                  <KeyRound className="w-4 h-4" />
                  Member Login
                </button>
              ) : (
                <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center">
                    <Wallet className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm font-medium text-emerald-800">
                    {wallet.displayName || 'Anonymous'}
                  </span>
                  <span className="text-xs text-emerald-500">Connected</span>
                </div>
              )}
            </div>

            {/* Status indicators */}
            {(solConnected || wallet) && (
              <div className="flex items-center justify-center gap-3 mb-6">
                {solConnected && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-xs font-medium text-purple-700">
                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                    Solana Connected
                  </span>
                )}
                {wallet && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Wallet Active
                  </span>
                )}
              </div>
            )}

            <div className="flex items-center justify-center gap-8 mb-8">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Blocks className="w-4 h-4 text-emerald-500" />
                  <span className="text-2xl font-bold text-gray-900">{stats.blocks}</span>
                </div>
                <p className="text-xs text-gray-400">Blocks Sold</p>
              </div>
              <div className="w-px h-8 bg-gray-200" />
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Users className="w-4 h-4 text-emerald-500" />
                  <span className="text-2xl font-bold text-gray-900">{stats.owners}</span>
                </div>
                <p className="text-xs text-gray-400">Owners</p>
              </div>
              <div className="w-px h-8 bg-gray-200" />
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <span className="text-2xl font-bold text-gray-900">${stats.totalValue.toLocaleString()}</span>
                </div>
                <p className="text-xs text-gray-400">Total Value</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 text-gray-400 animate-bounce">
              <ArrowDown className="w-4 h-4" />
              <span className="text-xs">Scroll to explore the grid</span>
            </div>
          </div>
        </div>
      </div>

      {/* Restore Wallet Modal */}
      {showRestore && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
            <button onClick={() => { setShowRestore(false); setMnemonicInput(''); setRestoreError(''); }} className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100 text-gray-400">
              <span className="text-gray-400 text-lg leading-none">&times;</span>
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-200/50">
                <KeyRound className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Member Login</h2>
                <p className="text-sm text-gray-500">Enter your mnemonic to restore your account</p>
              </div>
            </div>
            <textarea
              value={mnemonicInput}
              onChange={(e) => setMnemonicInput(e.target.value)}
              placeholder="Enter your 12-word mnemonic phrase..."
              className="w-full h-24 px-3 py-2 rounded-lg border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 text-sm resize-none outline-none"
            />
            {restoreError && <p className="text-sm text-red-500 mt-2">{restoreError}</p>}
            <button
              onClick={handleRestore}
              disabled={isRestoring || !mnemonicInput.trim()}
              className="mt-4 w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-300 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-200/50"
            >
              {isRestoring ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Restoring...
                </span>
              ) : (
                'Restore My Account'
              )}
            </button>
            <p className="text-xs text-gray-400 text-center mt-3">
              Your mnemonic is your account key. Never share it with anyone.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
