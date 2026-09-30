import { useState } from 'react';
import { getBlockPrice, getBlockId, formatPrice, generateBlockHash, generateBlockKey, shortenHash } from '../lib/utils';
import { useWallet } from '../lib/wallet-context';
import { useCity } from '../lib/city-context';
import { supabase } from '../lib/supabase';
import { X, Copy, Check, Hash, Key, CreditCard, Wallet, Zap, ImageDown, FileDown } from 'lucide-react';
import { downloadCredentialsImage, downloadCredentialsPDF, type CredentialData } from '../lib/credential-export';

interface PurchaseModalProps {
  row: number;
  col: number;
  onClose: () => void;
  onComplete: () => void;
}

type PaymentMethod = 'demo' | 'solana' | 'card';
type Step = 'confirm' | 'payment' | 'success';

export function PurchaseModal({ row, col, onClose, onComplete }: PurchaseModalProps) {
  const { wallet } = useWallet();
  const { activeCity, activeDistrict } = useCity();
  const [step, setStep] = useState<Step>('confirm');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [blockHash, setBlockHash] = useState('');
  const [blockKey, setBlockKey] = useState('');

  const price = getBlockPrice(row, col);
  const blockId = getBlockId(row, col);

  const handlePurchase = async () => {
    if (!paymentMethod) return;
    setIsProcessing(true);
    setError('');
    try {
      const walletId = wallet?.id ?? null;
      let blockError = null;
      if (walletId) {
        const result = await supabase.from('blocks').upsert({
          row, col, price, owner_wallet_id: walletId, status: 'owned',
          purchased_at: new Date().toISOString(),
          city_id: activeCity?.id || null,
          district_id: activeDistrict?.id || null,
        }, { onConflict: 'row,col' });
        blockError = result.error;
      }
      if (blockError) {
        setError('Failed to purchase block. It may already be owned.');
        setIsProcessing(false);
        return;
      }
      const credentialOwner = walletId ?? 'demo-payment';
      const hash = await generateBlockHash(blockId, credentialOwner);
      const key = generateBlockKey(blockId, credentialOwner);
      setBlockHash(hash);
      setBlockKey(key);
      setStep('success');
      setIsProcessing(false);
    } catch {
      setError('An unexpected error occurred.');
      setIsProcessing(false);
    }
  };

  const credential: CredentialData = { blockId, hash: blockHash, key: blockKey, price };

  const copyField = (id: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(id);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const paymentMethods = [
    { id: 'demo' as const, label: 'Demo Payment', desc: 'Instant demo transaction', icon: Zap },
    { id: 'solana' as const, label: 'Solana Wallet', desc: 'Pay with SOL', icon: Wallet },
    { id: 'card' as const, label: 'Credit Card', desc: 'Visa / Mastercard', icon: CreditCard },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto scrollbar-thin transition-colors duration-300">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 dark:text-gray-500 transition-colors">
          <X className="w-5 h-5" />
        </button>

        {/* Step: Confirm */}
        {step === 'confirm' && (
          <>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Purchase Block #{blockId}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Block #{blockId} on the grid</p>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 mb-6 border border-emerald-100 dark:border-emerald-900/30">
              <div className="text-center">
                <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-1">Price</p>
                <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">{formatPrice(price)}</p>
              </div>
            </div>
            {error && <p className="text-sm text-red-500 dark:text-red-400 mb-4">{error}</p>}
            <button onClick={() => setStep('payment')}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-all shadow-lg shadow-emerald-200/50 active:scale-[0.98]">
              Continue to Payment
            </button>
          </>
        )}

        {/* Step: Payment Method */}
        {step === 'payment' && (
          <>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-200/50">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Select Payment Method</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Pay {formatPrice(price)} for Block #{blockId}</p>
              </div>
            </div>

            <div className="space-y-3 mb-5">
              {paymentMethods.map(method => {
                const isSelected = paymentMethod === method.id;
                return (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-md'
                        : 'border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700 bg-white dark:bg-gray-900'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isSelected
                        ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                    }`}>
                      <method.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-bold ${isSelected ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>{method.label}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{method.desc}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                    </div>
                  </button>
                );
              })}
            </div>

            {error && <p className="text-sm text-red-500 dark:text-red-400 mb-4">{error}</p>}

            <div className="flex gap-3">
              <button onClick={() => setStep('confirm')}
                className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 font-medium text-sm transition-colors">
                Back
              </button>
              <button onClick={handlePurchase} disabled={!paymentMethod || isProcessing}
                className="flex-[2] py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:from-gray-300 dark:disabled:from-gray-700 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-200/50 active:scale-[0.98]">
                {isProcessing ? 'Processing...' : `Pay ${formatPrice(price)}`}
              </button>
            </div>
          </>
        )}

        {/* Step: Success */}
        {step === 'success' && (
          <>
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4 animate-[fadeIn_0.4s_ease-out]">
                <Check className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Block #{blockId} Purchased!</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">You now own this block.</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">Each block has a unique hash and access key for verification.</p>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded-lg px-3 py-2 border border-emerald-100 dark:border-emerald-900/30">
                <Hash className="w-4 h-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">Block Hash</p>
                  <p className="text-xs font-mono text-gray-700 dark:text-gray-300 truncate" title={blockHash}>
                    {shortenHash(blockHash)}
                  </p>
                </div>
                <button
                  onClick={() => copyField('hash', blockHash)}
                  className="p-1.5 rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-gray-400 dark:text-gray-500 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors flex-shrink-0"
                >
                  {copiedField === 'hash' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded-lg px-3 py-2 border border-emerald-100 dark:border-emerald-900/30">
                <Key className="w-4 h-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">Access Key</p>
                  <p className="text-xs font-mono text-gray-700 dark:text-gray-300 truncate" title={blockKey}>
                    {blockKey}
                  </p>
                </div>
                <button
                  onClick={() => copyField('key', blockKey)}
                  className="p-1.5 rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-gray-400 dark:text-gray-500 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors flex-shrink-0"
                >
                  {copiedField === 'key' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              <button onClick={() => copyField('all', `${blockHash}\n${blockKey}`)}
                className="flex flex-col items-center gap-1 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-medium text-gray-600 dark:text-gray-300 transition-colors">
                {copiedField === 'all' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                {copiedField === 'all' ? 'Copied!' : 'Copy'}
              </button>
              <button onClick={() => downloadCredentialsImage([credential])}
                className="flex flex-col items-center gap-1 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-medium text-gray-600 dark:text-gray-300 transition-colors">
                <ImageDown className="w-4 h-4" />
                Image
              </button>
              <button onClick={() => downloadCredentialsPDF([credential])}
                className="flex flex-col items-center gap-1 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-medium text-gray-600 dark:text-gray-300 transition-colors">
                <FileDown className="w-4 h-4" />
                PDF
              </button>
            </div>

            <button onClick={onComplete}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-all">
              Continue
            </button>
          </>
        )}
      </div>
    </div>
  );
}
