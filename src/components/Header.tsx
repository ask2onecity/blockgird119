import { useState, useRef, useEffect } from 'react';
import { useWallet } from '../lib/wallet-context';
import { useAuth } from '../lib/auth-context';
import { useMembership } from '../lib/membership-context';
import { useCity } from '../lib/city-context';
import { LogOut, KeyRound, X, Shield, Crown, User, MapPin, ChevronDown, LayoutGrid, Wallet, BookOpen, TrendingUp, Users, Building2, Info, Settings, Sun, Moon } from 'lucide-react';
import { useWallet as useSolWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { AuthModal } from './AuthModal';
import { useTheme } from '../lib/theme-context';

interface HeaderProps {
  activeView: string;
  onNavigate: (view: string) => void;
}

export function Header({ activeView, onNavigate }: HeaderProps) {
  const { wallet, logout, restoreWallet } = useWallet();
  const { user, profile, signOut } = useAuth();
  const { membership } = useMembership();
  const { cities, activeCity, selectCity } = useCity();
  const { theme, toggleTheme } = useTheme();
  const { connected: solConnected, publicKey } = useSolWallet();
  const [showRestore, setShowRestore] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showCityMenu, setShowCityMenu] = useState(false);
  const [showNavMenu, setShowNavMenu] = useState(false);
  const [mnemonicInput, setMnemonicInput] = useState('');
  const [restoreError, setRestoreError] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);
  const cityMenuRef = useRef<HTMLDivElement>(null);
  const navMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cityMenuRef.current && !cityMenuRef.current.contains(e.target as Node)) setShowCityMenu(false);
      if (navMenuRef.current && !navMenuRef.current.contains(e.target as Node)) setShowNavMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRestore = async () => {
    setIsRestoring(true);
    setRestoreError('');
    const success = await restoreWallet(mnemonicInput.trim());
    setIsRestoring(false);
    if (success) { setShowRestore(false); setMnemonicInput(''); }
    else setRestoreError('Invalid mnemonic or wallet not found');
  };

  const solAddressShort = publicKey
    ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
    : '';

  const handleSignOut = async () => {
    await signOut();
    if (wallet) logout();
  };

  const navItems = [
    { id: 'grid', label: 'Grid', icon: LayoutGrid },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'cityhall', label: 'City Hall', icon: Building2 },
    { id: 'stats', label: 'Stats', icon: TrendingUp },
    { id: 'community', label: 'Community', icon: Users },
    { id: 'guide', label: 'Guide', icon: BookOpen },
    { id: 'about', label: 'About', icon: Info },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const adminItems = [
    { id: 'admin', label: 'Admin', icon: Shield },
  ];

  if (profile?.isAdmin) {
    navItems.push(...adminItems);
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-emerald-100 dark:border-gray-800 transition-colors duration-300">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-md shadow-emerald-200">
                <span className="text-white font-bold text-sm">XCD</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white leading-none">
                  XCITY<span className="text-emerald-600">DAO</span>
                </h1>
                <p className="text-[9px] text-gray-400 dark:text-gray-500 tracking-widest uppercase leading-none mt-0.5">Identity + Traffic + Community</p>
              </div>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeView === item.id
                      ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  <item.icon className="w-3.5 h-3.5" />
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Mobile Nav Dropdown */}
            <div className="lg:hidden relative" ref={navMenuRef}>
              <button
                onClick={() => setShowNavMenu(!showNavMenu)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Menu</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              {showNavMenu && (
                <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 py-1.5 w-44 z-50">
                  {navItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => { onNavigate(item.id); setShowNavMenu(false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors ${
                        activeView === item.id ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <item.icon className="w-3.5 h-3.5" />
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: City Switcher + Auth */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* City Switcher */}
            {activeCity && (
              <div className="relative" ref={cityMenuRef}>
                <button
                  onClick={() => setShowCityMenu(!showCityMenu)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border"
                  style={{
                    backgroundColor: activeCity.themeColor + '10',
                    borderColor: activeCity.themeColor + '30',
                    color: activeCity.themeColor,
                  }}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{activeCity.name}</span>
                  <span className="sm:hidden">{activeCity.name.slice(0, 2)}</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
                {showCityMenu && (
                  <div className="absolute top-full right-0 mt-1 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 py-1.5 w-52 z-50">
                    <p className="px-3 py-1 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">US Cities</p>
                    {cities.map(c => (
                      <button
                        key={c.id}
                        onClick={() => { selectCity(c.id); setShowCityMenu(false); }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors ${
                          activeCity.id === c.id ? 'bg-gray-50 dark:bg-gray-800' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.themeColor }} />
                        <span className="text-gray-700 dark:text-gray-200">{c.name}</span>
                        {activeCity.id === c.id && <span className="ml-auto text-emerald-600 dark:text-emerald-400 text-[10px]">Active</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            {/* Auth section */}
            {user && profile ? (
              <div className="flex items-center gap-2">
                {profile.isAdmin && (
                  <span className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-full bg-rose-50 border border-rose-200">
                    <Shield className="w-3 h-3 text-rose-600" />
                    <span className="text-[10px] font-bold text-rose-700 uppercase">Admin</span>
                  </span>
                )}
                {membership?.tier && (
                  <span className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-full border"
                    style={{
                      backgroundColor: membership.tier.badge_color + '15',
                      borderColor: membership.tier.badge_color + '40',
                    }}
                  >
                    <Crown className="w-3 h-3" style={{ color: membership.tier.badge_color }} />
                    <span className="text-[10px] font-bold" style={{ color: membership.tier.badge_color }}>
                      {membership.tier.name}
                    </span>
                  </span>
                )}
                {wallet?.solAddress && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 border border-purple-200">
                    <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
                      <span className="text-[7px] font-bold text-white">S</span>
                    </span>
                    <span className="text-xs font-mono font-medium text-purple-700">{wallet.solAddress.slice(0, 4)}...{wallet.solAddress.slice(-4)}</span>
                  </span>
                )}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center overflow-hidden">
                    {profile.avatarUrl ? (
                      <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] font-bold text-white">{(profile.displayName || profile.email)[0].toUpperCase()}</span>
                    )}
                  </div>
                  <span className="text-sm font-medium text-emerald-800 truncate max-w-[120px]">
                    {profile.displayName || profile.email.split('@')[0]}
                  </span>
                </div>
                <button onClick={handleSignOut} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors" title="Sign out">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="[&_button]:!flex [&_button]:!items-center [&_button]:!gap-1.5 [&_button]:!px-3 [&_button]:!py-2 [&_button]:!rounded-lg [&_button]:!text-xs [&_button]:!font-semibold [&_button]:!bg-gradient-to-r [&_button]:!from-purple-600 [&_button]:!to-violet-600 [&_button]:!hover:from-purple-700 [&_button]:!hover:to-violet-700 [&_button]:!text-white [&_button]:!shadow-md [&_button]:!shadow-purple-200/50 [&_button]:!border-0 [&_button]:!transition-all">
                  <WalletMultiButton />
                </div>
                {solConnected && publicKey && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-purple-50 border border-purple-200">
                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                    <span className="text-xs font-mono font-medium text-purple-700">{solAddressShort}</span>
                  </span>
                )}
                <button
                  onClick={() => setShowAuth(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white text-xs font-semibold shadow-md shadow-emerald-200/50 transition-all"
                >
                  <User className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Login / Register</span>
                  <span className="sm:hidden">Login</span>
                </button>
                <button
                  onClick={() => setShowRestore(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-medium transition-colors"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Restore Wallet</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />

      {showRestore && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6 relative transition-colors duration-300">
            <button onClick={() => { setShowRestore(false); setMnemonicInput(''); setRestoreError(''); }} className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 dark:text-gray-500">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-200/50">
                <KeyRound className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Restore Wallet</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Enter your 12-word mnemonic to restore your wallet</p>
              </div>
            </div>
            <textarea
              value={mnemonicInput}
              onChange={(e) => setMnemonicInput(e.target.value)}
              placeholder="Enter your mnemonic phrase..."
              className="w-full h-24 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 text-sm resize-none outline-none transition-colors"
            />
            {restoreError && <p className="text-sm text-red-500 mt-2">{restoreError}</p>}
            <button
              onClick={handleRestore}
              disabled={isRestoring || !mnemonicInput.trim()}
              className="mt-4 w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-300 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-200/50"
            >
              {isRestoring ? 'Restoring...' : 'Restore Wallet'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
