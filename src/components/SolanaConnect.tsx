import { useEffect, useState, useCallback, useRef } from 'react';
import { useWallet as useSolWallet } from '@solana/wallet-adapter-react';
import { useWallet } from '../lib/wallet-context';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Unplug, Link2, Loader2, AlertCircle, Check } from 'lucide-react';

export function SolanaConnect() {
  const { wallet: cityWallet, connectSolWallet, disconnectSolWallet } = useWallet();
  const { publicKey, connected, disconnecting } = useSolWallet();
  const [linking, setLinking] = useState(false);
  const [linked, setLinked] = useState(false);
  const [error, setError] = useState('');
  const linkedRef = useRef(false);

  const handleLink = useCallback(async (pubKey: string) => {
    if (!cityWallet || linkedRef.current) return;
    linkedRef.current = true;
    setLinking(true);
    setError('');
    const success = await connectSolWallet(pubKey);
    if (success) {
      setLinked(true);
      setTimeout(() => setLinked(false), 3000);
    } else {
      setError('This Solana wallet is already linked to another account.');
    }
    setLinking(false);
  }, [cityWallet, connectSolWallet]);

  useEffect(() => {
    if (connected && publicKey && cityWallet && !cityWallet.solAddress) {
      handleLink(publicKey.toBase58());
    }
  }, [connected, publicKey, cityWallet?.solAddress, handleLink]);

  const handleUnlink = async () => {
    linkedRef.current = false;
    await disconnectSolWallet();
  };

  const shortenAddress = (addr: string) =>
    `${addr.slice(0, 4)}...${addr.slice(-4)}`;

  if (!cityWallet) return null;

  if (cityWallet.solAddress) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200">
          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
            <span className="text-[8px] font-bold text-white">S</span>
          </div>
          <span className="text-sm font-medium text-purple-800 font-mono">
            {shortenAddress(cityWallet.solAddress)}
          </span>
          <Link2 className="w-3 h-3 text-purple-400" />
        </div>
        <button
          onClick={handleUnlink}
          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
          title="Unlink Solana wallet"
        >
          <Unplug className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="[&_button]:!rounded-full [&_button]:!py-1.5 [&_button]:!px-3 [&_button]:!text-xs [&_button]:!font-medium [&_button]:!bg-gradient-to-r [&_button]:!from-purple-600 [&_button]:!to-violet-600 [&_button]:!border-0 [&_button]:!shadow-md [&_button]:!shadow-purple-200/50">
        <WalletMultiButton />
      </div>
      {linking && (
        <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
      )}
      {linked && (
        <Check className="w-4 h-4 text-emerald-500" />
      )}
      {error && (
        <div className="flex items-center gap-1 text-red-500">
          <AlertCircle className="w-3.5 h-3.5" />
          <span className="text-xs">{error}</span>
        </div>
      )}
      {disconnecting && (
        <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
      )}
    </div>
  );
}
