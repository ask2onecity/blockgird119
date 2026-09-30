import { useState } from 'react';
import { useCart } from '../lib/cart-context';
import { getBlockId, formatPrice, COLS } from '../lib/utils';
import { ShoppingCart, X, ChevronUp, ChevronDown, Trash2, ShoppingBag } from 'lucide-react';
import { BatchCheckoutModal } from './BatchCheckoutModal';

const BLOCK_SIZE = 70;
const CART_W = COLS * BLOCK_SIZE;

export function CartBar() {
  const { items, isOpen, setOpen, removeItem, clearCart, totalPrice, totalCount } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);

  if (totalCount === 0) return null;

  return (
    <>
      <div className="sticky bottom-0 z-50">
        <div className="overflow-x-auto">
          <div className="min-w-fit px-4 sm:px-6 mx-auto w-fit" style={{ width: CART_W + 32 }}>
            <div style={{ width: CART_W }}>
            {/* Expanded panel */}
            {isOpen && (
              <div className="bg-white dark:bg-gray-900 border-t border-x border-gray-200 dark:border-gray-700 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] max-h-[40vh] overflow-y-auto scrollbar-thin rounded-t-xl transition-colors duration-300">
                <div className="py-3 px-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                      Selected Blocks ({totalCount})
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={clearCart}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Clear All
                      </button>
                      <button
                        onClick={() => setOpen(false)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                    {items.map(item => {
                      const blockId = getBlockId(item.row, item.col);
                      return (
                        <div
                          key={blockId}
                          className="flex-shrink-0 flex items-center gap-2.5 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-all group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/40 dark:to-emerald-800/40 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center">
                            <span className="text-[9px] font-mono font-bold text-emerald-700 dark:text-emerald-400">
                              {String(item.row).padStart(2, '0')}{String(item.col).padStart(2, '0')}
                            </span>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-800 dark:text-gray-200">#{blockId}</p>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500">R{item.row} C{item.col}</p>
                          </div>
                          <span className="text-xs font-bold text-emerald-600 ml-1">
                            {formatPrice(item.price)}
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); removeItem(item.row, item.col); }}
                            className="p-1 rounded-md text-gray-300 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Bottom bar */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 border-t border-x border-gray-700 shadow-[0_-4px_20px_rgba(0,0,0,0.15)] rounded-t-xl">
              <div className="px-4">
                <div className="flex items-center justify-between h-14">
                  <button
                    onClick={() => setOpen(!isOpen)}
                    className="flex items-center gap-3 text-white hover:text-emerald-300 transition-colors"
                  >
                    <div className="relative">
                      <ShoppingCart className="w-5 h-5" />
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-emerald-500 text-[9px] font-bold text-white flex items-center justify-center">
                        {totalCount}
                      </span>
                    </div>
                    <span className="text-sm font-medium hidden sm:inline">
                      {totalCount} block{totalCount !== 1 ? 's' : ''} selected
                    </span>
                    {isOpen ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    )}
                  </button>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">Total</p>
                      <p className="text-lg font-bold text-white">{formatPrice(totalPrice)}</p>
                    </div>
                    <button
                      onClick={() => setShowCheckout(true)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white text-sm font-bold transition-all shadow-lg shadow-emerald-900/30 active:scale-95"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      Checkout
                    </button>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>

      {showCheckout && (
        <BatchCheckoutModal onClose={() => setShowCheckout(false)} />
      )}
    </>
  );
}
