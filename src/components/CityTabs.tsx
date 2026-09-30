import { useCity } from '../lib/city-context';
import { MapPin } from 'lucide-react';

export function CityTabs() {
  const { cities, activeCity, selectCity } = useCity();

  if (cities.length === 0) return null;

  return (
    <div className="px-4 sm:px-6 pt-4 pb-2">
      <div className="flex items-center gap-2 flex-wrap">
        <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">City:</span>
        {cities.map(c => (
          <button
            key={c.id}
            onClick={() => selectCity(c.id)}
            className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-all ${
              activeCity?.id === c.id
                ? 'text-white shadow-md scale-105'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
            style={activeCity?.id === c.id ? { backgroundColor: c.themeColor } : {}}
          >
            {c.name}
          </button>
        ))}
      </div>
      {activeCity && (
        <p className="text-xs text-gray-400 mt-2 ml-6">{activeCity.description}</p>
      )}
    </div>
  );
}
