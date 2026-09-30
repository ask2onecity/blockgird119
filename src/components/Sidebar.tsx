import { LayoutGrid, Wallet, Info, Users, Settings, ChevronLeft, ChevronRight, BookOpen, TrendingUp, Shield, Crown, Building2 } from 'lucide-react';
import { useAuth } from '../lib/auth-context';

interface SidebarProps {
  isCollapsed: boolean;
  activeView: string;
  onNavigate: (view: string) => void;
  onToggleCollapse: () => void;
}

export function Sidebar({ isCollapsed, activeView, onNavigate, onToggleCollapse }: SidebarProps) {
  const { profile } = useAuth();
  const isAdmin = profile?.isAdmin ?? false;

  const menuItems = [
    { id: 'grid', label: 'Block Grid', icon: LayoutGrid, description: 'Browse and purchase blocks' },
    { id: 'wallet', label: 'My Wallet', icon: Wallet, description: 'Manage your profile and blocks' },
    { id: 'membership', label: 'Membership', icon: Crown, description: 'View your plan' },
    { id: 'guide', label: 'Getting Started', icon: BookOpen, description: 'Learn how XCITYDAO works' },
    { id: 'stats', label: 'Statistics', icon: TrendingUp, description: 'View grid analytics' },
    { id: 'community', label: 'Community', icon: Users, description: 'Connect with other users' },
    { id: 'cityhall', label: 'City Hall', icon: Building2, description: 'Mayor elections & city fund' },
  ];

  const adminItems = [
    { id: 'admin', label: 'Admin Dashboard', icon: Shield, description: 'Manage the platform' },
  ];

  const bottomItems = [
    { id: 'about', label: 'About XCITYDAO', icon: Info, description: 'Project information' },
    { id: 'settings', label: 'Settings', icon: Settings, description: 'Preferences' },
  ];

  return (
    <aside className={`fixed left-0 top-16 h-[calc(100vh-64px)] bg-white border-r border-gray-100 flex flex-col transition-all duration-300 z-40 ${
      isCollapsed ? 'w-20' : 'w-64'
    }`}>
      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
        {!isCollapsed && (
          <div className="px-3 py-2 mb-2">
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
              Navigation
            </p>
          </div>
        )}

        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${
              activeView === item.id
                ? 'bg-emerald-50 text-emerald-700 font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            } ${isCollapsed ? 'justify-center' : ''}`}
            title={isCollapsed ? item.label : ''}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && (
              <div className="text-left">
                <div className="text-sm font-medium">{item.label}</div>
                <div className="text-xs text-gray-400">{item.description}</div>
              </div>
            )}
          </button>
        ))}

        {/* Admin Section */}
        {isAdmin && (
          <>
            {!isCollapsed && (
              <div className="px-3 py-2 mt-4 mb-2 border-t border-gray-100 pt-4">
                <p className="text-xs font-bold text-rose-500 uppercase tracking-wider">
                  Admin
                </p>
              </div>
            )}
            {isCollapsed && <div className="border-t border-gray-100 my-3" />}
            {adminItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${
                  activeView === item.id
                    ? 'bg-rose-50 text-rose-700 font-medium'
                    : 'text-gray-600 hover:bg-rose-50 hover:text-rose-600'
                } ${isCollapsed ? 'justify-center' : ''}`}
                title={isCollapsed ? item.label : ''}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && (
                  <div className="text-left">
                    <div className="text-sm font-medium">{item.label}</div>
                    <div className="text-xs text-gray-400">{item.description}</div>
                  </div>
                )}
              </button>
            ))}
          </>
        )}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-gray-100 p-3 space-y-2">
        {bottomItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-gray-600 hover:bg-gray-50 ${
              activeView === item.id ? 'bg-emerald-50 text-emerald-700' : ''
            } ${isCollapsed ? 'justify-center' : ''}`}
            title={isCollapsed ? item.label : ''}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span className="text-sm">{item.label}</span>}
          </button>
        ))}

        {/* Collapse/Expand Button */}
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all mt-2 border-t border-gray-100 pt-3"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {!isCollapsed && <span className="text-xs font-medium">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
