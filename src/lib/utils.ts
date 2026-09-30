/**
 * Grid: 12 columns (horizontal) x 99 rows (vertical)
 * Block ID: row(2 digits) + col(2 digits), e.g. row=1 col=1 => "0101"
 * Pricing: bottom-right (row=99, col=12) = $99
 * Goes right-to-left, then bottom-to-top, each step +$1
 * Price = 99 + (99 - row) * 12 + (12 - col)
 * Top-left (row=1, col=1) = 99 + 98*12 + 11 = 99 + 1176 + 11 = $1,286
 */

export const COLS = 12;
export const ROWS = 99;

export function getBlockPrice(row: number, col: number): number {
  return 99 + (ROWS - row) * COLS + (COLS - col);
}

/** Block ID string like "0101" for row=1, col=1 */
export function getBlockId(row: number, col: number): string {
  return `${String(row).padStart(2, '0')}${String(col).padStart(2, '0')}`;
}

/** Parse block ID string back to row/col */
export function parseBlockId(id: string): { row: number; col: number } {
  return { row: parseInt(id.slice(0, 2)), col: parseInt(id.slice(2, 4)) };
}

/** Generate a random 12-word mnemonic (simplified for demo) */
export function generateMnemonic(): string {
  const words = [
    'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
    'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid',
    'acoustic', 'acquire', 'across', 'act', 'action', 'actor', 'actress', 'actual',
    'adapt', 'add', 'addict', 'address', 'adjust', 'admit', 'adult', 'advance',
    'advice', 'aerobic', 'affair', 'afford', 'afraid', 'again', 'age', 'agent',
    'agree', 'ahead', 'aim', 'air', 'airport', 'aisle', 'alarm', 'album',
  ];
  const result: string[] = [];
  for (let i = 0; i < 12; i++) {
    result.push(words[Math.floor(Math.random() * words.length)]);
  }
  return result.join(' ');
}

/** Simple hash for mnemonic storage (not crypto-grade, demo only) */
export async function hashMnemonic(mnemonic: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(mnemonic);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Price tier color for visual grouping */
export function getPriceTierColor(price: number): string {
  if (price <= 200) return 'from-emerald-50 to-emerald-100';
  if (price <= 500) return 'from-emerald-100 to-emerald-200';
  if (price <= 800) return 'from-emerald-200 to-emerald-300';
  if (price <= 1000) return 'from-emerald-300 to-emerald-400';
  return 'from-emerald-400 to-emerald-500';
}

export function getPriceTierBorder(price: number): string {
  if (price <= 200) return 'border-emerald-200';
  if (price <= 500) return 'border-emerald-300';
  if (price <= 800) return 'border-emerald-400';
  if (price <= 1000) return 'border-emerald-500';
  return 'border-emerald-600';
}

export function formatPrice(price: number): string {
  return `$${price.toLocaleString()}`;
}

/** Generate a deterministic block hash from block ID + wallet ID */
export async function generateBlockHash(blockId: string, walletId: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`XCITYDAO:${blockId}:${walletId}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Generate a block access key (hex, 32 chars) */
export function generateBlockKey(blockId: string, walletId: string): string {
  const chars = '0123456789abcdef';
  let seed = 0;
  const src = blockId + walletId;
  for (let i = 0; i < src.length; i++) {
    seed = ((seed << 5) - seed + src.charCodeAt(i)) | 0;
  }
  const result: string[] = [];
  for (let i = 0; i < 32; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    result.push(chars[seed % 16]);
  }
  return result.join('');
}

/** Shorten hash for display (first 8 + ... + last 4) */
export function shortenHash(hash: string): string {
  if (hash.length <= 16) return hash;
  return `${hash.slice(0, 8)}...${hash.slice(-4)}`;
}
