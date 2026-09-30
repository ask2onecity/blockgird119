import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth-context';
import {
  Shield, Users, Blocks, Activity, Search,
  UserCheck, UserX, Ban, Eye, Clock,
  Loader2
} from 'lucide-react';

interface ProfileRecord {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  wallet_id: string | null;
  is_admin: boolean;
  created_at: string;
}

interface BlockRecord {
  id: string;
  row: number;
  col: number;
  price: number;
  owner_wallet_id: string | null;
  status: string;
  purchased_at: string | null;
}

interface AuditEntry {
  id: string;
  admin_wallet_id: string;
  action: string;
  target_type: string;
  target_id: string;
  details: Record<string, any>;
  created_at: string;
}

type AdminTab = 'overview' | 'users' | 'blocks' | 'audit';

export function AdminDashboard() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
  const [blocks, setBlocks] = useState<BlockRecord[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({ totalUsers: 0, totalBlocks: 0, ownedBlocks: 0, totalRevenue: 0, adminCount: 0 });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview' || activeTab === 'users') {
        const { data: pData } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
        if (pData) {
          setProfiles(pData);
          setStats(prev => ({
            ...prev,
            totalUsers: pData.length,
            adminCount: pData.filter(p => p.is_admin).length,
          }));
        }
      }
      if (activeTab === 'overview' || activeTab === 'blocks') {
        const { data: bData } = await supabase
          .from('blocks')
          .select('*')
          .order('purchased_at', { ascending: false })
          .limit(200);
        if (bData) {
          setBlocks(bData);
          const owned = bData.filter((b: any) => b.status === 'owned');
          const revenue = owned.reduce((s: number, b: any) => s + (b.price || 0), 0);
          setStats(prev => ({ ...prev, totalBlocks: bData.length, ownedBlocks: owned.length, totalRevenue: revenue }));
        }
      }
      if (activeTab === 'audit') {
        const { data: aData } = await supabase
          .from('admin_audit_log')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);
        if (aData) setAuditLog(aData);
      }
    } catch (e) {
      console.error('Failed to fetch admin data', e);
    }
    setLoading(false);
  }, [activeTab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleAdmin = async (userId: string, currentIsAdmin: boolean) => {
    setActionLoading(userId);
    const { error } = await supabase
      .from('profiles')
      .update({ is_admin: !currentIsAdmin })
      .eq('id', userId);
    if (!error) {
      setProfiles(prev => prev.map(p =>
        p.id === userId ? { ...p, is_admin: !currentIsAdmin } : p
      ));
      setStats(prev => ({
        ...prev,
        adminCount: prev.adminCount + (currentIsAdmin ? -1 : 1),
      }));
    }
    setActionLoading(null);
  };

  const revokeBlock = async (blockId: string) => {
    const { error } = await supabase
      .from('blocks')
      .update({ status: 'available', owner_wallet_id: null, purchased_at: null })
      .eq('id', blockId);
    if (!error) fetchData();
  };

  const filteredProfiles = profiles.filter(p =>
    !searchQuery ||
    p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.display_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBlocks = blocks.filter(b =>
    !searchQuery ||
    `${b.row}-${b.col}`.includes(searchQuery) ||
    b.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs: { id: AdminTab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'blocks', label: 'Blocks', icon: Blocks },
    { id: 'audit', label: 'Audit Log', icon: Clock },
  ];

  if (!profile?.isAdmin) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Shield className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 dark:text-gray-500 text-lg">Access Denied</p>
          <p className="text-gray-300 dark:text-gray-600 text-sm mt-1">You do not have admin privileges</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-lg shadow-rose-200/50">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Manage users, blocks, and platform settings</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 bg-gray-50 dark:bg-gray-800 rounded-xl p-1 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-white dark:bg-gray-900 text-rose-700 dark:text-rose-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 dark:text-gray-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-rose-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Users" value={stats.totalUsers} icon={Users} color="from-blue-500 to-cyan-600" />
                <StatCard title="Admin Users" value={stats.adminCount} icon={Shield} color="from-rose-500 to-red-600" />
                <StatCard title="Owned Blocks" value={stats.ownedBlocks} icon={Blocks} color="from-emerald-500 to-green-600" />
                <StatCard title="Total Revenue" value={`$${stats.totalRevenue.toLocaleString()}`} icon={Activity} color="from-amber-500 to-orange-600" />
              </div>

              {/* Recent Users */}
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">Recent Users</h3>
                <div className="space-y-2">
                  {profiles.slice(0, 8).map(p => (
                    <div key={p.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-800">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center overflow-hidden">
                          {p.avatar_url ? (
                            <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-bold text-white">{(p.display_name || p.email)[0].toUpperCase()}</span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{p.display_name || p.email.split('@')[0]}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">{p.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {p.is_admin && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:text-rose-400 text-[10px] font-bold">ADMIN</span>
                        )}
                        <span className="text-xs text-gray-400 dark:text-gray-500">{new Date(p.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search users by email or name..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 text-sm outline-none"
                  />
                </div>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 dark:text-gray-600">User</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 dark:text-gray-600">Email</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 dark:text-gray-600">Joined</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 dark:text-gray-600">Role</th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 dark:text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProfiles.map(p => (
                        <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-md bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                {p.avatar_url ? (
                                  <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-[10px] font-bold text-white">{(p.display_name || p.email)[0].toUpperCase()}</span>
                                )}
                              </div>
                              <span className="font-medium text-gray-900 dark:text-white truncate max-w-[140px]">
                                {p.display_name || p.email.split('@')[0]}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-gray-600 dark:text-gray-300 dark:text-gray-600 text-xs font-mono">{p.email}</span>
                          </td>
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-400 dark:text-gray-500 text-xs">{new Date(p.created_at).toLocaleDateString()}</td>
                          <td className="px-4 py-3">
                            {p.is_admin ? (
                              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:text-rose-400 text-[10px] font-bold">Admin</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">Member</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {p.id !== profile?.id && (
                              <button
                                onClick={() => toggleAdmin(p.id, p.is_admin)}
                                disabled={actionLoading === p.id}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors inline-flex items-center gap-1 ${
                                  p.is_admin
                                    ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100'
                                    : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100'
                                } disabled:opacity-50`}
                              >
                                {actionLoading === p.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : p.is_admin ? (
                                  <><UserX className="w-3 h-3" /> Revoke Admin</>
                                ) : (
                                  <><UserCheck className="w-3 h-3" /> Grant Admin</>
                                )}
                              </button>
                            )}
                            {p.id === profile?.id && (
                              <span className="text-xs text-gray-400 dark:text-gray-500 italic">You</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredProfiles.length === 0 && (
                  <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">No users found</div>
                )}
              </div>
            </div>
          )}

          {/* Blocks Tab */}
          {activeTab === 'blocks' && (
            <div>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search blocks by row-col or status..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 text-sm outline-none"
                  />
                </div>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 dark:text-gray-600">Block</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 dark:text-gray-600">Price</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 dark:text-gray-600">Status</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 dark:text-gray-600">Purchased</th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-600 dark:text-gray-300 dark:text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBlocks.map(b => (
                        <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="px-4 py-3">
                            <span className="font-mono font-bold text-gray-900 dark:text-white">R{b.row} C{b.col}</span>
                          </td>
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-200 font-medium">${b.price.toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              b.status === 'owned' ? 'bg-emerald-100 text-emerald-700 dark:text-emerald-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 dark:text-gray-600'
                            }`}>
                              {b.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-400 dark:text-gray-500">
                            {b.purchased_at ? new Date(b.purchased_at).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {b.status === 'owned' && (
                              <button
                                onClick={() => revokeBlock(b.id)}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 transition-colors inline-flex items-center gap-1"
                              >
                                <Ban className="w-3 h-3" /> Revoke
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredBlocks.length === 0 && (
                  <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">No blocks found</div>
                )}
              </div>
            </div>
          )}

          {/* Audit Log Tab */}
          {activeTab === 'audit' && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
                <h3 className="font-semibold text-gray-700 dark:text-gray-200">Recent Admin Actions</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {auditLog.map(entry => (
                  <div key={entry.id} className="px-4 py-3 hover:bg-gray-50/50">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Eye className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{entry.action}</span>
                          {entry.target_type && (
                            <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[10px] text-gray-500 dark:text-gray-400 dark:text-gray-500 font-medium">
                              {entry.target_type}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-mono truncate">
                          Target: {entry.target_id || 'N/A'}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                        {new Date(entry.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
                {auditLog.length === 0 && (
                  <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">No audit log entries</div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: {
  title: string; value: number | string; icon: any; color: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className={`h-1 bg-gradient-to-r ${color}`} />
      <div className="p-5">
        <Icon className={`w-5 h-5 mb-2 bg-gradient-to-br ${color} bg-clip-text text-transparent`} />
        <p className="text-sm text-gray-600 dark:text-gray-300 dark:text-gray-600 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}
