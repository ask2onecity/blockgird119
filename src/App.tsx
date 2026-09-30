import { useState } from 'react';
import { AuthProvider } from './lib/auth-context';
import { WalletProvider } from './lib/wallet-context';
import { CartProvider } from './lib/cart-context';
import { MembershipProvider } from './lib/membership-context';
import { CityProvider } from './lib/city-context';
import { ThemeProvider } from './lib/theme-context';
import { SolanaWalletContextProvider } from './lib/solana-wallet-provider';
import { Header } from './components/Header';
import { BlockGrid } from './components/BlockGrid';
import { CartBar } from './components/CartBar';
import { WalletDashboard } from './components/WalletDashboard';
import { GettingStarted } from './components/GettingStarted';
import { Statistics } from './components/Statistics';
import { Community } from './components/Community';
import { About } from './components/About';
import { Settings } from './components/Settings';
import { AdminDashboard } from './components/AdminDashboard';
import { MembershipPage } from './components/MembershipPage';
import { CityHall } from './components/CityHall';

type ViewType = 'grid' | 'wallet' | 'guide' | 'stats' | 'community' | 'about' | 'settings' | 'admin' | 'membership' | 'cityhall';

function App() {
  const [activeView, setActiveView] = useState<ViewType>('grid');

  const renderContent = () => {
    switch (activeView) {
      case 'grid':
        return (
          <BlockGrid />
        );
      case 'wallet':
        return <WalletDashboard />;
      case 'guide':
        return <GettingStarted />;
      case 'stats':
        return <Statistics />;
      case 'community':
        return <Community />;
      case 'about':
        return <About />;
      case 'settings':
        return <Settings />;
      case 'admin':
        return <AdminDashboard />;
      case 'membership':
        return <MembershipPage />;
      case 'cityhall':
        return <CityHall />;
      default:
        return null;
    }
  };

  return (
    <SolanaWalletContextProvider>
      <ThemeProvider>
      <AuthProvider>
        <WalletProvider>
            <CityProvider>
              <MembershipProvider>
                <CartProvider>
                <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300">
                  <Header activeView={activeView} onNavigate={(view: string) => setActiveView(view as ViewType)} />

                  <main className="pt-16">
                    <div className="min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
                      {renderContent()}
                      <CartBar />
                    </div>

                    <footer className="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 py-8 mt-12 transition-colors duration-300">
                      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center">
                            <span className="text-white font-bold text-[10px]">XCD</span>
                          </div>
                          <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                            XCITY<span className="text-emerald-600">DAO</span>
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          Decentralized Identity + Traffic + Community
                        </p>
                        <p className="text-xs text-gray-300 dark:text-gray-600 mt-2">
                          12 columns x 99 rows = 1,188 blocks. Each block is a piece of the decentralized web.
                        </p>
                      </div>
                    </footer>
                  </main>
                </div>
                </CartProvider>
              </MembershipProvider>
            </CityProvider>
        </WalletProvider>
      </AuthProvider>
      </ThemeProvider>
    </SolanaWalletContextProvider>
  );
}

export default App;
