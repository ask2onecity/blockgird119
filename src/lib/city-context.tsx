import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { supabase } from './supabase';

export interface City {
  id: string;
  name: string;
  slug: string;
  description: string;
  themeColor: string;
  sortOrder: number;
}

export interface District {
  id: string;
  cityId: string;
  letter: string;
  name: string;
  status: 'locked' | 'voting' | 'unlocked';
  unlockedAt: string | null;
  unlockVoteThreshold: number;
}

interface CityContextType {
  cities: City[];
  activeCity: City | null;
  districts: District[];
  activeDistrict: District | null;
  loading: boolean;
  selectCity: (cityId: string) => void;
  selectDistrict: (districtId: string) => void;
  refreshDistricts: () => Promise<void>;
}

const CityContext = createContext<CityContextType | null>(null);

const STORAGE_KEY = 'xcitydao_active_city';

export function CityProvider({ children }: { children: ReactNode }) {
  const [cities, setCities] = useState<City[]>([]);
  const [activeCity, setActiveCity] = useState<City | null>(null);
  const [districts, setDistricts] = useState<District[]>([]);
  const [activeDistrict, setActiveDistrict] = useState<District | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCities = useCallback(async () => {
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (!error && data) {
      const mapped: City[] = data.map((c: any) => ({
        id: c.id, name: c.name, slug: c.slug,
        description: c.description, themeColor: c.theme_color,
        sortOrder: c.sort_order,
      }));
      setCities(mapped);
      const stored = localStorage.getItem(STORAGE_KEY);
      const initial = stored ? mapped.find(c => c.id === stored) : null;
      setActiveCity(initial || mapped[0] || null);
    }
    setLoading(false);
  }, []);

  const fetchDistricts = useCallback(async (cityId: string) => {
    const { data, error } = await supabase
      .from('districts')
      .select('*')
      .eq('city_id', cityId)
      .order('letter', { ascending: true });
    if (!error && data) {
      const mapped: District[] = data.map((d: any) => ({
        id: d.id, cityId: d.city_id, letter: d.letter,
        name: d.name, status: d.status,
        unlockedAt: d.unlocked_at,
        unlockVoteThreshold: d.unlock_vote_threshold,
      }));
      setDistricts(mapped);
      const unlocked = mapped.find(d => d.status === 'unlocked');
      setActiveDistrict(unlocked || mapped[0] || null);
    }
  }, []);

  useEffect(() => { fetchCities(); }, [fetchCities]);

  useEffect(() => {
    if (activeCity) {
      fetchDistricts(activeCity.id);
    } else {
      setDistricts([]);
      setActiveDistrict(null);
    }
  }, [activeCity, fetchDistricts]);

  const selectCity = useCallback((cityId: string) => {
    const city = cities.find(c => c.id === cityId);
    if (city) {
      setActiveCity(city);
      localStorage.setItem(STORAGE_KEY, cityId);
    }
  }, [cities]);

  const selectDistrict = useCallback((districtId: string) => {
    const d = districts.find(d => d.id === districtId);
    if (d && d.status === 'unlocked') {
      setActiveDistrict(d);
    }
  }, [districts]);

  const refreshDistricts = useCallback(async () => {
    if (activeCity) await fetchDistricts(activeCity.id);
  }, [activeCity, fetchDistricts]);

  return (
    <CityContext.Provider value={{
      cities, activeCity, districts, activeDistrict,
      loading, selectCity, selectDistrict, refreshDistricts,
    }}>
      {children}
    </CityContext.Provider>
  );
}

export function useCity() {
  const ctx = useContext(CityContext);
  if (!ctx) throw new Error('useCity must be used within CityProvider');
  return ctx;
}
