import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { getBlockPrice } from './utils';

export interface CartItem {
  row: number;
  col: number;
  price: number;
}

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  addItem: (row: number, col: number) => void;
  removeItem: (row: number, col: number) => void;
  toggleItem: (row: number, col: number) => void;
  isSelected: (row: number, col: number) => boolean;
  clearCart: () => void;
  totalPrice: number;
  totalCount: number;
  setOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const addItem = useCallback((row: number, col: number) => {
    setItems(prev => {
      const exists = prev.some(i => i.row === row && i.col === col);
      if (exists) return prev;
      return [...prev, { row, col, price: getBlockPrice(row, col) }];
    });
  }, []);

  const removeItem = useCallback((row: number, col: number) => {
    setItems(prev => prev.filter(i => !(i.row === row && i.col === col)));
  }, []);

  const toggleItem = useCallback((row: number, col: number) => {
    setItems(prev => {
      const exists = prev.some(i => i.row === row && i.col === col);
      if (exists) return prev.filter(i => !(i.row === row && i.col === col));
      return [...prev, { row, col, price: getBlockPrice(row, col) }];
    });
  }, []);

  const isSelected = useCallback((row: number, col: number) => {
    return items.some(i => i.row === row && i.col === col);
  }, [items]);

  const clearCart = useCallback(() => { setItems([]); }, []);

  const totalPrice = items.reduce((sum, i) => sum + i.price, 0);
  const totalCount = items.length;

  return (
    <CartContext.Provider value={{
      items, isOpen, addItem, removeItem, toggleItem,
      isSelected, clearCart, totalPrice, totalCount, setOpen: setIsOpen,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
