import { getBlockPrice, getBlockId, formatPrice, generateBlockHash, generateBlockKey, shortenHash } from '../lib/utils';
import { useWallet } from '../lib/wallet-context';
import { useCart } from '../lib/cart-context';
import { useState, useEffect } from 'react';
import { Hash, Key, Copy, Check } from 'lucide-react';

interface BlockTooltipProps {
  row: number;
  col: number;
  block: { owner_wallet_id: string | null; image_url: string | null; status: string } | null;
  x: number;
  y: number;
}

export function BlockTooltip({ row, col, block, x, y }: BlockTooltipProps) {
  const { wallet } = useWallet();
  const { isSelected } = useCart();
  const price = getBlockPrice(row, col);
  const blockId = getBlockId(row, col);
  const isOwned = block?.status === 'owned';
  const isMyBlock = isOwned && wallet && block.owner_wallet_id === wallet.id;
  const inCart = !isOwned && isSelected(row, col);

  const [blockHash, setBlockHash] = useState('');
  const [blockKey, setBlockKey] = useState('');
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    if (isMyBlock && wallet) {
      generateBlockHash(blockId, wallet.id).then(setBlockHash);
      setBlockKey(generateBlockKey(blockId, wallet.id));
    } else {
      setBlockHash('');
      setBlockKey('');
    }
  }, [isMyBlock, blockId, wallet]);

  const copyToClipboard = (text: string, type: 'hash' | 'key') => {
    navigator.clipboard.writeText(text);
    if (type === 'hash') {
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 1500);
    } else {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 1500);
    }
  };

  return (
    <div className="fixed z-[60] pointer-events-none" style={{ left: x, top: y }}>
      <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-3 min-w-[200px]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono text-gray-400">#{blockId}</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            isOwned
              ? isMyBlock ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              : inCart ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
          }`}>
            {isOwned ? (isMyBlock ? 'My Block' : 'Owned') : inCart ? 'In Cart' : 'Available'}
          </span>
        </div>
        <div className="text-lg font-bold text-gray-900">{formatPrice(price)}</div>
        <div className="text-[10px] text-gray-400 mt-1">Row {row} / Col {col}</div>

        {isMyBlock && blockHash && (
          <div className="mt-2 pt-2 border-t border-gray-100 space-y-1.5 pointer-events-auto">
            <div className="flex items-center gap-1.5 bg-gray-50 rounded-md px-2 py-1">
              <Hash className="w-3 h-3 text-emerald-500 flex-shrink-0" />
              <span className="text-[10px] font-mono text-gray-600 truncate flex-1" title={blockHash}>
                {shortenHash(blockHash)}
              </span>
              <button onClick={() => copyToClipboard(blockHash, 'hash')} className="flex-shrink-0">
                {copiedHash
                  ? <Check className="w-3 h-3 text-emerald-500" />
                  : <Copy className="w-3 h-3 text-gray-300 hover:text-gray-500" />}
              </button>
            </div>
            <div className="flex items-center gap-1.5 bg-gray-50 rounded-md px-2 py-1">
              <Key className="w-3 h-3 text-emerald-500 flex-shrink-0" />
              <span className="text-[10px] font-mono text-gray-600 truncate flex-1" title={blockKey}>
                {blockKey}
              </span>
              <button onClick={() => copyToClipboard(blockKey, 'key')} className="flex-shrink-0">
                {copiedKey
                  ? <Check className="w-3 h-3 text-emerald-500" />
                  : <Copy className="w-3 h-3 text-gray-300 hover:text-gray-500" />}
              </button>
            </div>
          </div>
        )}

        {isOwned && !isMyBlock && <div className="text-[10px] text-gray-400 mt-1">Click to view profile</div>}
        {!isOwned && inCart && <div className="text-[10px] text-emerald-600 mt-1 font-medium">Click to remove from cart</div>}
        {!isOwned && !inCart && <div className="text-[10px] text-emerald-600 mt-1 font-medium">Click to add to cart</div>}
      </div>
    </div>
  );
}
