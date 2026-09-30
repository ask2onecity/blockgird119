import { formatPrice } from '../lib/utils';

export function GridLegend() {
  return (
    <div className="px-4 sm:px-6 py-4">
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-500">
        <span className="font-semibold text-gray-700">Price Tiers:</span>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200" />
          <span>{formatPrice(99)} - {formatPrice(200)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-gradient-to-br from-emerald-100 to-emerald-200 border border-emerald-300" />
          <span>{formatPrice(201)} - {formatPrice(500)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-gradient-to-br from-emerald-200 to-emerald-300 border border-emerald-400" />
          <span>{formatPrice(501)} - {formatPrice(800)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-gradient-to-br from-emerald-300 to-emerald-400 border border-emerald-500" />
          <span>{formatPrice(801)} - {formatPrice(1000)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-gradient-to-br from-emerald-400 to-emerald-500 border border-emerald-600" />
          <span>{formatPrice(1001)}+</span>
        </div>
        <div className="w-px h-4 bg-gray-200" />
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-gradient-to-br from-amber-100 to-amber-200 border border-amber-300" />
          <span>Owned by others</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-gradient-to-br from-emerald-400 to-green-500 border border-emerald-500" />
          <span>My blocks</span>
        </div>
      </div>
    </div>
  );
}
