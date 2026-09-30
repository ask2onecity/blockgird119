import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { getBlockPrice, getBlockId, formatPrice, ROWS, COLS, generateBlockKey, shortenHash } from '../lib/utils';
import { useWallet } from '../lib/wallet-context';
import { useCart } from '../lib/cart-context';
import { useCity } from '../lib/city-context';
import { ProfilePanel } from './ProfilePanel';
import { Check, Hash } from 'lucide-react';

interface BlockData {
  id: string; row: number; col: number; price: number;
  owner_wallet_id: string | null; image_url: string | null; status: string;
}

const BLOCK_SIZE = 70;
const INITIAL_ROWS = 20;
const ROWS_PER_LOAD = 10;

export function BlockGrid() {
  const { wallet } = useWallet();
  const { toggleItem, isSelected: isInCart, clearCart } = useCart();
  const { activeCity, activeDistrict } = useCity();
  const [blocks, setBlocks] = useState<Record<string, BlockData>>({});
  const [viewingProfile, setViewingProfile] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [visibleRows, setVisibleRows] = useState(INITIAL_ROWS);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeDistrict) {
      fetchBlocks();
      clearCart();
    }
  }, [activeDistrict]);

  const fetchBlocks = async () => {
    if (!activeDistrict) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('blocks')
      .select('*')
      .eq('district_id', activeDistrict.id)
      .eq('status', 'owned');
    if (!error && data) {
      const map: Record<string, BlockData> = {};
      data.forEach((b: any) => {
        map[getBlockId(b.row, b.col)] = {
          id: b.id, row: b.row, col: b.col, price: b.price,
          owner_wallet_id: b.owner_wallet_id, image_url: b.image_url, status: b.status,
        };
      });
      setBlocks(map);
    } else {
      setBlocks({});
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleRows < ROWS) {
          setVisibleRows(prev => Math.min(prev + ROWS_PER_LOAD, ROWS));
        }
      },
      { rootMargin: '400px' }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [visibleRows]);

  const handleClick = useCallback((row: number, col: number) => {
    const blockId = getBlockId(row, col);
    const block = blocks[blockId];
    if (block?.owner_wallet_id) {
      setViewingProfile(block.owner_wallet_id);
    } else {
      toggleItem(row, col);
    }
  }, [blocks, toggleItem]);

  if (!activeCity || !activeDistrict) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative pb-20">
      {/* Grid */}
      <div className="overflow-x-auto pb-4">
        <div className="min-w-fit px-4 sm:px-6 mx-auto w-fit">
          {Array.from({ length: visibleRows }, (_, i) => i + 1).map(row => (
            <div key={row} className="flex items-center">
              {Array.from({ length: COLS }, (_, j) => j + 1).map(col => {
                const blockId = getBlockId(row, col);
                const block = blocks[blockId];
                const price = getBlockPrice(row, col);
                const isOwned = block?.status === 'owned';
                const isMyBlock = isOwned && wallet && block.owner_wallet_id === wallet.id;
                const selected = !isOwned && isInCart(row, col);

                return (
                  <div
                    key={blockId}
                    className={`flex-shrink-0 border cursor-pointer transition-all duration-150 relative
                      ${isOwned
                        ? isMyBlock
                          ? 'bg-gradient-to-br from-emerald-400 to-green-500 border-emerald-500 shadow-md shadow-emerald-200/50'
                          : 'bg-gradient-to-br from-amber-100 to-amber-200 border-amber-300'
                        : selected
                          ? 'bg-gradient-to-br from-emerald-300 to-green-400 border-emerald-500 shadow-md shadow-emerald-200/50 ring-2 ring-emerald-400 ring-offset-1'
                          : 'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-gray-800 dark:to-gray-700 border-emerald-200 dark:border-gray-600'
                      }
                      hover:scale-110 hover:z-10 hover:shadow-lg
                    `}
                    style={{ width: BLOCK_SIZE, height: BLOCK_SIZE }}
                    onClick={() => handleClick(row, col)}
                  >
                    {isOwned && block?.image_url ? (
                      <img src={block.image_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                    ) : isOwned ? (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-0.5">
                        {isMyBlock ? (
                          <>
                            <Hash className="w-3 h-3 text-emerald-100" />
                            <span className="text-[6px] font-mono text-emerald-100/80 leading-none truncate w-full text-center px-0.5">
                              {shortenHash(generateBlockKey(blockId, wallet!.id))}
                            </span>
                          </>
                        ) : (
                          <div className="w-3 h-3 rounded-full bg-amber-400/60" />
                        )}
                      </div>
                    ) : selected ? (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-0.5">
                        <span className="text-sm font-mono font-bold text-white leading-none">{blockId}</span>
                        <span className="text-sm font-mono font-bold text-white/80 leading-none">{formatPrice(price)}</span>
                        <Check className="w-3 h-3 text-white/70" strokeWidth={3} />
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-sm font-mono font-bold text-emerald-700/70 dark:text-emerald-400/50 leading-none">{blockId}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          {visibleRows < ROWS && (
            <div ref={sentinelRef} className="flex items-center justify-center py-6">
              <div className="flex items-center gap-3 text-emerald-500">
                <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-medium">Loading more blocks...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {viewingProfile && (
        <ProfilePanel walletId={viewingProfile} onClose={() => setViewingProfile(null)} />
      )}

      {loading && (
        <div className="absolute inset-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-20">
          <div className="flex items-center gap-3 text-emerald-600">
            <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium">Loading grid...</span>
          </div>
        </div>
      )}
    </div>
  );
}
