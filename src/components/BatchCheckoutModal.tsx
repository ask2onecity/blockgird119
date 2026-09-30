import { useState, useRef } from 'react';
import { getBlockId, formatPrice, generateBlockHash, generateBlockKey, shortenHash } from '../lib/utils';
import { useWallet } from '../lib/wallet-context';
import { useCart } from '../lib/cart-context';
import { useCity } from '../lib/city-context';
import { supabase } from '../lib/supabase';
import { X, Copy, Check, AlertCircle, ShoppingBag, Lock, Hash, Key, Loader2, CreditCard, Wallet, Zap, ImageDown, FileDown } from 'lucide-react';
import { downloadCredentialsImage, downloadCredentialsPDF, type CredentialData } from '../lib/credential-export';

interface BlockResult {
  blockId: string;
  row: number;
  col: number;
  price: number;
  hash: string;
  key: string;
  status: 'pending' | 'processing' | 'done';
}

interface BatchCheckoutModalProps {
  onClose: () => void;
}

type PaymentMethod = 'demo' | 'solana' | 'card';
type Step = 'confirm' | 'payment' | 'processing' | 'success';

export function BatchCheckoutModal({ onClose }: BatchCheckoutModalProps) {
  const { wallet } = useWallet();
  const { items, totalPrice, totalCount, clearCart } = useCart();
  const { activeCity, activeDistrict } = useCity();
  const [step, setStep] = useState<Step>('confirm');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [blockResults, setBlockResults] = useState<BlockResult[]>([]);
  const [allCopied, setAllCopied] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleProceedToPayment = () => {
    setStep('payment');
  };

  const handleCheckout = async () => {
    if (!paymentMethod) return;
    setError('');
    await executePurchase(wallet?.id ?? null);
  };

  const executePurchase = async (walletId: string | null) => {
    const results: BlockResult[] = items.map(item => ({
      blockId: getBlockId(item.row, item.col),
      row: item.row,
      col: item.col,
      price: item.price,
      hash: '',
      key: '',
      status: 'pending',
    }));

    setBlockResults(results);
    setStep('processing');
    setIsProcessing(true);

    for (let i = 0; i < results.length; i++) {
      const item = items[i];
      const blockId = getBlockId(item.row, item.col);

      setBlockResults(prev => prev.map((r, idx) =>
        idx === i ? { ...r, status: 'processing' } : r
      ));

      if (scrollRef.current) {
        const el = scrollRef.current.children[i] as HTMLElement;
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

      await new Promise(res => setTimeout(res, 400 + Math.random() * 300));

      const credentialOwner = walletId ?? 'demo-payment';
      const blockHash = await generateBlockHash(blockId, credentialOwner);
      const blockKey = generateBlockKey(blockId, credentialOwner);

      let blockError = null;
      if (walletId) {
        const result = await supabase.from('blocks').upsert({
          row: item.row, col: item.col, price: item.price,
          owner_wallet_id: walletId, status: 'owned',
          purchased_at: new Date().toISOString(),
          city_id: activeCity?.id || null,
          district_id: activeDistrict?.id || null,
          block_hash: blockHash,
          access_key: blockKey,
        }, { onConflict: 'row,col' });
        blockError = result.error;
      }

      setBlockResults(prev => prev.map((r, idx) =>
        idx === i ? { ...r, hash: blockHash, key: blockKey, status: 'done' } : r
      ));
    }

    setIsProcessing(false);
    setStep('success');
  };

  const copyField = (id: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(id);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const copyAllKeys = () => {
    const text = blockResults.map(r =>
      `Block #${r.blockId} | Hash: ${r.hash} | Key: ${r.key}`
    ).join('\n');
    navigator.clipboard.writeText(text);
    setAllCopied(true);
    setTimeout(() => setAllCopied(false), 2000);
  };

  const doneCount = blockResults.filter(r => r.status === 'done').length;

  const completedCredentials: CredentialData[] = blockResults
    .filter(r => r.status === 'done')
    .map(r => ({ blockId: r.blockId, hash: r.hash, key: r.key, price: r.price }));

  const handleDownloadImage = () => downloadCredentialsImage(completedCredentials);
  const handleDownloadPDF = () => downloadCredentialsPDF(completedCredentials);

  const handleFinish = () => {
    clearCart();
    onClose();
  };

  const paymentMethods = [
    { id: 'demo' as const, label: 'Demo Payment', desc: 'Instant demo transaction', icon: Zap },
    { id: 'solana' as const, label: 'Solana Wallet', desc: 'Pay with SOL', icon: Wallet },
    { id: 'card' as const, label: 'Credit Card', desc: 'Visa / Mastercard', icon: CreditCard },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto scrollbar-thin transition-colors duration-300">
        {(step === 'confirm' || step === 'payment') && (
          <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 dark:text-gray-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Step: Confirm */}
        {step === 'confirm' && (
          <>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-200/50">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Checkout</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{totalCount} block{totalCount !== 1 ? 's' : ''} to purchase</p>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-5 border border-gray-200 dark:border-gray-700 max-h-[200px] overflow-y-auto scrollbar-thin">
              <div className="space-y-2">
                {items.map(item => {
                  const blockId = getBlockId(item.row, item.col);
                  return (
                    <div key={blockId} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/30 flex items-center justify-center">
                          <span className="text-[8px] font-mono font-bold text-emerald-700 dark:text-emerald-400">#{blockId}</span>
                        </div>
                        <span className="text-sm font-mono font-bold text-gray-800 dark:text-gray-100">Block #{blockId}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{formatPrice(item.price)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 mb-5 border border-emerald-100 dark:border-emerald-900/30">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Total</span>
                <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{formatPrice(totalPrice)}</span>
              </div>
            </div>

            {error && <p className="text-sm text-red-500 dark:text-red-400 mb-4">{error}</p>}

            <button onClick={handleProceedToPayment}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-200/50 active:scale-[0.98]">
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
                <p className="text-sm text-gray-500 dark:text-gray-400">Choose how to pay {formatPrice(totalPrice)}</p>
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
              <button onClick={handleCheckout} disabled={!paymentMethod || isProcessing}
                className="flex-[2] py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 disabled:from-gray-300 dark:disabled:from-gray-700 disabled:to-gray-300 dark:disabled:to-gray-700 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-200/50 active:scale-[0.98]">
                {isProcessing ? 'Processing...' : `Pay ${formatPrice(totalPrice)}`}
              </button>
            </div>
          </>
        )}

        {/* Step: Processing */}
        {step === 'processing' && (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                <Lock className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Minting Blocks</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {doneCount}/{totalCount} blocks secured
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full mb-4 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(doneCount / totalCount) * 100}%` }}
              />
            </div>

            {/* Block results list */}
            <div ref={scrollRef} className="space-y-2 max-h-[45vh] overflow-y-auto scrollbar-thin pr-1">
              {blockResults.map((result) => {
                const hashId = `${result.blockId}-hash`;
                const keyId = `${result.blockId}-key`;
                return (
                <div
                  key={result.blockId}
                  className={`rounded-xl border p-3 transition-all duration-500 ${
                    result.status === 'done'
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                      : result.status === 'processing'
                        ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 ring-2 ring-amber-300/50'
                        : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-mono font-bold ${
                        result.status === 'done'
                          ? 'bg-gradient-to-br from-emerald-400 to-green-500 text-white'
                          : result.status === 'processing'
                            ? 'bg-amber-200 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                      }`}>
                        {result.status === 'done' ? (
                          <Check className="w-4 h-4" strokeWidth={3} />
                        ) : result.status === 'processing' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          `#${result.blockId}`
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-800 dark:text-gray-200">Block #{result.blockId}</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">R{result.row} C{result.col} | {formatPrice(result.price)}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                      result.status === 'done' ? 'text-emerald-600 dark:text-emerald-400' : result.status === 'processing' ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400 dark:text-gray-500'
                    }`}>
                      {result.status === 'done' ? 'Secured' : result.status === 'processing' ? 'Minting...' : 'Queued'}
                    </span>
                  </div>

                  {result.status === 'done' && (
                    <div className="mt-2 space-y-1.5">
                      <div className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded-lg px-2.5 py-1.5 border border-emerald-100 dark:border-emerald-900/30">
                        <Hash className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[9px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">Block Hash</p>
                          <p className="text-[11px] font-mono text-gray-700 dark:text-gray-300 truncate" title={result.hash}>
                            {shortenHash(result.hash)}
                          </p>
                        </div>
                        <button
                          onClick={() => copyField(hashId, result.hash)}
                          className="p-1 rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-gray-400 dark:text-gray-500 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors flex-shrink-0"
                        >
                          {copiedField === hashId ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                      <div className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded-lg px-2.5 py-1.5 border border-emerald-100 dark:border-emerald-900/30">
                        <Key className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[9px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">Access Key</p>
                          <p className="text-[11px] font-mono text-gray-700 dark:text-gray-300 truncate" title={result.key}>
                            {result.key}
                          </p>
                        </div>
                        <button
                          onClick={() => copyField(keyId, result.key)}
                          className="p-1 rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-gray-400 dark:text-gray-500 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors flex-shrink-0"
                        >
                          {copiedField === keyId ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                );
              })}
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
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Purchase Complete!</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Successfully purchased {doneCount} of {totalCount} block{totalCount !== 1 ? 's' : ''}.
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">Each block has a unique hash and access key for verification.</p>
            </div>

            {/* All block hashes and keys */}
            <div className="space-y-2 max-h-[40vh] overflow-y-auto scrollbar-thin pr-1 mb-4">
              {blockResults.filter(r => r.status === 'done').map(result => {
                const hashId = `success-${result.blockId}-hash`;
                const keyId = `success-${result.blockId}-key`;
                return (
                <div key={result.blockId} className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center">
                      <span className="text-[8px] font-mono font-bold text-white">#{result.blockId}</span>
                    </div>
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Block #{result.blockId}</span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-auto">{formatPrice(result.price)}</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded-lg px-2.5 py-1.5 border border-emerald-100 dark:border-emerald-900/30">
                      <Hash className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">Block Hash</p>
                        <p className="text-[11px] font-mono text-gray-700 dark:text-gray-300 truncate" title={result.hash}>
                          {shortenHash(result.hash)}
                        </p>
                      </div>
                      <button
                        onClick={() => copyField(hashId, result.hash)}
                        className="p-1 rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-gray-400 dark:text-gray-500 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors flex-shrink-0"
                      >
                        {copiedField === hashId ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                    <div className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded-lg px-2.5 py-1.5 border border-emerald-100 dark:border-emerald-900/30">
                      <Key className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">Access Key</p>
                        <p className="text-[11px] font-mono text-gray-700 dark:text-gray-300 truncate" title={result.key}>
                          {result.key}
                        </p>
                      </div>
                      <button
                        onClick={() => copyField(keyId, result.key)}
                        className="p-1 rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-gray-400 dark:text-gray-500 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors flex-shrink-0"
                      >
                        {copiedField === keyId ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              <button onClick={copyAllKeys}
                className="flex flex-col items-center gap-1 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-medium text-gray-600 dark:text-gray-300 transition-colors">
                {allCopied ? <Check className="w-4 h-4 text-emerald-500 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {allCopied ? 'Copied!' : 'Copy All'}
              </button>
              <button onClick={handleDownloadImage}
                className="flex flex-col items-center gap-1 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-medium text-gray-600 dark:text-gray-300 transition-colors">
                <ImageDown className="w-4 h-4" />
                Image
              </button>
              <button onClick={handleDownloadPDF}
                className="flex flex-col items-center gap-1 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-medium text-gray-600 dark:text-gray-300 transition-colors">
                <FileDown className="w-4 h-4" />
                PDF
              </button>
            </div>

            <button onClick={handleFinish}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-all">
              Continue
            </button>
          </>
        )}
      </div>
    </div>
  );
}
