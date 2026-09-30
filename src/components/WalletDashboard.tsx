import { useState, useEffect } from 'react';
import { useWallet } from '../lib/wallet-context';
import { useMembership } from '../lib/membership-context';
import { supabase } from '../lib/supabase';
import { getBlockId, formatPrice } from '../lib/utils';
import { X, Image, User, Link, Briefcase, Save, Plus, Trash2, Crown, Wallet as WalletIcon, Hash, Key, Copy, Check, ImageDown, FileDown } from 'lucide-react';
import { SolanaConnect } from './SolanaConnect';
import { downloadCredentialsImage, downloadCredentialsPDF, type CredentialData } from '../lib/credential-export';
import { shortenHash } from '../lib/utils';

interface OwnedBlock { id: string; row: number; col: number; price: number; image_url: string | null; block_hash: string | null; access_key: string | null; }
interface WorkItem { title: string; image: string; description: string; }

export function WalletDashboard() {
  const { wallet, updateProfile } = useWallet();
  const { membership } = useMembership();
  const [ownedBlocks, setOwnedBlocks] = useState<OwnedBlock[]>([]);
  const [activeTab, setActiveTab] = useState<'blocks' | 'profile' | 'works' | 'social'>('blocks');
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState(wallet?.displayName || '');
  const [avatarUrl, setAvatarUrl] = useState(wallet?.avatarUrl || '');
  const [bio, setBio] = useState(wallet?.bio || '');
  const [works, setWorks] = useState<WorkItem[]>(wallet?.works || []);
  const [newWork, setNewWork] = useState<WorkItem>({ title: '', image: '', description: '' });
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>(wallet?.socialLinks || {});
  const [newLinkKey, setNewLinkKey] = useState('');
  const [newLinkValue, setNewLinkValue] = useState('');
  const [editingBlock, setEditingBlock] = useState<string | null>(null);
  const [editImageUrl, setEditImageUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    if (wallet) {
      fetchOwnedBlocks();
      setDisplayName(wallet.displayName || '');
      setAvatarUrl(wallet.avatarUrl || '');
      setBio(wallet.bio || '');
      setWorks(wallet.works || []);
      setSocialLinks(wallet.socialLinks || {});
    }
  }, [wallet]);

  const fetchOwnedBlocks = async () => {
    if (!wallet) return;
    setLoading(true);
    const { data, error } = await supabase.from('blocks').select('id, row, col, price, image_url, block_hash, access_key').eq('owner_wallet_id', wallet.id).eq('status', 'owned');
    if (!error && data) setOwnedBlocks(data);
    setLoading(false);
  };

  const handleSaveProfile = async () => {
    setSaving(true); setSaveMessage('');
    await updateProfile({ displayName, avatarUrl, bio });
    setSaving(false); setSaveMessage('Profile saved!');
    setTimeout(() => setSaveMessage(''), 2000);
  };

  const handleSaveWorks = async () => {
    setSaving(true); setSaveMessage('');
    await updateProfile({ works });
    setSaving(false); setSaveMessage('Works saved!');
    setTimeout(() => setSaveMessage(''), 2000);
  };

  const handleSaveSocial = async () => {
    setSaving(true); setSaveMessage('');
    await updateProfile({ socialLinks });
    setSaving(false); setSaveMessage('Social links saved!');
    setTimeout(() => setSaveMessage(''), 2000);
  };

  const handleUpdateBlockImage = async (blockId: string) => {
    if (!wallet) return;
    const { error } = await supabase.from('blocks').update({ image_url: editImageUrl || null }).eq('id', blockId);
    if (!error) {
      setOwnedBlocks(prev => prev.map(b => b.id === blockId ? { ...b, image_url: editImageUrl || null } : b));
      setEditingBlock(null); setEditImageUrl('');
    }
  };

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const copyField = (id: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(id);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleExportImage = (block: OwnedBlock) => {
    if (!block.block_hash || !block.access_key) return;
    const cred: CredentialData = { blockId: getBlockId(block.row, block.col), hash: block.block_hash, key: block.access_key, price: block.price };
    downloadCredentialsImage([cred]);
  };

  const handleExportPDF = (block: OwnedBlock) => {
    if (!block.block_hash || !block.access_key) return;
    const cred: CredentialData = { blockId: getBlockId(block.row, block.col), hash: block.block_hash, key: block.access_key, price: block.price };
    downloadCredentialsPDF([cred]);
  };

  if (!wallet) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <p className="text-gray-400 dark:text-gray-500 dark:text-gray-400 text-lg mb-2">No wallet connected</p>
          <p className="text-gray-300 dark:text-gray-600 dark:text-gray-300 text-sm">Purchase a block or restore your wallet to get started</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'blocks' as const, label: 'My Blocks', icon: Image },
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'works' as const, label: 'Works', icon: Briefcase },
    { id: 'social' as const, label: 'Social', icon: Link },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <div className="bg-gradient-to-r from-emerald-600 to-green-600 rounded-2xl p-6 mb-6 text-white shadow-xl shadow-emerald-200/30">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden">
            {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              : <span className="text-2xl font-bold">{(displayName || 'A')[0].toUpperCase()}</span>}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">{displayName || 'Anonymous'}</h2>
              {membership?.tier && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ backgroundColor: membership.tier.badge_color + '30', color: '#fff' }}
                >
                  <Crown className="w-3 h-3" />
                  {membership.tier.name}
                </span>
              )}
            </div>
            <p className="text-sm text-emerald-100 font-mono">{wallet.id.slice(0, 12)}...</p>
          </div>
        </div>
        <div className="flex items-center gap-6 mt-4">
          <div className="text-center"><p className="text-2xl font-bold">{ownedBlocks.length}</p><p className="text-xs text-emerald-200">Blocks</p></div>
          <div className="text-center"><p className="text-2xl font-bold">{wallet.followersCount}</p><p className="text-xs text-emerald-200">Followers</p></div>
          <div className="text-center"><p className="text-2xl font-bold">{wallet.followingCount}</p><p className="text-xs text-emerald-200">Following</p></div>
        </div>
      </div>

      <div className="flex items-center gap-1 mb-6 bg-gray-50 dark:bg-gray-800 rounded-xl p-1">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id ? 'bg-white dark:bg-gray-900 dark:bg-gray-900 text-emerald-700 dark:text-emerald-400 dark:text-emerald-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 dark:text-gray-200 dark:hover:text-gray-200'
            }`}>
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'blocks' && (
        <div>
          {loading ? (
            <div className="flex items-center justify-center py-12"><div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" /></div>
          ) : ownedBlocks.length === 0 ? (
            <div className="text-center py-12"><p className="text-gray-400 dark:text-gray-500 dark:text-gray-400">No blocks owned yet</p></div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {ownedBlocks.map(block => (
                <div key={block.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <div className="aspect-square bg-gradient-to-br from-emerald-50 to-green-50 dark:from-gray-800 dark:to-gray-700 relative overflow-hidden">
                    {block.image_url ? <img src={block.image_url} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><span className="text-lg font-mono font-bold text-emerald-300 dark:text-emerald-700 dark:text-emerald-400">#{getBlockId(block.row, block.col)}</span></div>}
                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/50 backdrop-blur-sm rounded-md">
                      <span className="text-[10px] font-mono text-white">#{getBlockId(block.row, block.col)}</span>
                    </div>
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{formatPrice(block.price)}</span>
                      <button onClick={() => { setEditingBlock(block.id); setEditImageUrl(block.image_url || ''); }}
                        className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium">Edit Image</button>
                    </div>
                    {block.block_hash && block.access_key && (
                      <>
                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-lg px-2 py-1.5">
                          <Hash className="w-3 h-3 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[8px] text-gray-400 dark:text-gray-500 uppercase">Hash</p>
                            <p className="text-[10px] font-mono text-gray-600 dark:text-gray-300 truncate" title={block.block_hash}>{shortenHash(block.block_hash)}</p>
                          </div>
                          <button onClick={() => copyField(`${block.id}-hash`, block.block_hash!)}
                            className="p-1 rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-gray-400 hover:text-emerald-500 transition-colors flex-shrink-0">
                            {copiedField === `${block.id}-hash` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-lg px-2 py-1.5">
                          <Key className="w-3 h-3 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[8px] text-gray-400 dark:text-gray-500 uppercase">Key</p>
                            <p className="text-[10px] font-mono text-gray-600 dark:text-gray-300 truncate" title={block.access_key}>{block.access_key}</p>
                          </div>
                          <button onClick={() => copyField(`${block.id}-key`, block.access_key!)}
                            className="p-1 rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-gray-400 hover:text-emerald-500 transition-colors flex-shrink-0">
                            {copiedField === `${block.id}-key` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                        <div className="flex gap-1.5 pt-1">
                          <button onClick={() => copyField(`${block.id}-both`, `${block.block_hash}\n${block.access_key}`)}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-[10px] font-medium text-gray-600 dark:text-gray-300 transition-colors">
                            {copiedField === `${block.id}-both` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                            Copy
                          </button>
                          <button onClick={() => handleExportImage(block)}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-[10px] font-medium text-gray-600 dark:text-gray-300 transition-colors">
                            <ImageDown className="w-3 h-3" />Image
                          </button>
                          <button onClick={() => handleExportPDF(block)}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-[10px] font-medium text-gray-600 dark:text-gray-300 transition-colors">
                            <FileDown className="w-3 h-3" />PDF
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {editingBlock && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 relative">
                <button onClick={() => { setEditingBlock(null); setEditImageUrl(''); }} className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 dark:bg-gray-800 text-gray-400 dark:text-gray-500 dark:text-gray-400">
                  <X className="w-5 h-5" />
                </button>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Set Block Image</h3>
                <input type="url" value={editImageUrl} onChange={(e) => setEditImageUrl(e.target.value)} placeholder="Image URL (https://...)"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 focus:border-emerald-400 dark:focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/30 text-sm outline-none mb-4" />
                {editImageUrl && (
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800 mb-4 border border-gray-200 dark:border-gray-700">
                    <img src={editImageUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <button onClick={() => handleUpdateBlockImage(editingBlock)}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors">Save Image</button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Digital Identity</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Display Name</label>
                <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your display name"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 focus:border-emerald-400 dark:focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/30 text-sm outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Avatar URL</label>
                <input type="url" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://example.com/avatar.jpg"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 focus:border-emerald-400 dark:focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/30 text-sm outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Bio</label>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell the world about yourself..." rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 focus:border-emerald-400 dark:focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/30 text-sm outline-none resize-none" />
              </div>
            </div>
            <button onClick={handleSaveProfile} disabled={saving}
              className="mt-6 flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-semibold text-sm transition-colors">
              <Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save Profile'}
            </button>
            {saveMessage && <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">{saveMessage}</p>}
          </div>

          {/* Connected Wallets */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <WalletIcon className="w-5 h-5 text-gray-700 dark:text-gray-200" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Connected Wallets</h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-4">Link your Solana wallet to verify your Web3 identity on the grid.</p>
            <div className="space-y-3">
              {/* Solana wallet row */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-white">SOL</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Solana</p>
                    {wallet.solAddress ? (
                      <p className="text-xs text-gray-400 dark:text-gray-500 dark:text-gray-400 font-mono">{wallet.solAddress.slice(0, 6)}...{wallet.solAddress.slice(-4)}</p>
                    ) : (
                      <p className="text-xs text-gray-400 dark:text-gray-500 dark:text-gray-400">Not connected</p>
                    )}
                  </div>
                </div>
                <SolanaConnect />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'works' && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Personal Works</h3>
          {works.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {works.map((work, i) => (
                <div key={i} className="relative group rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                  <div className="aspect-square bg-gray-50 dark:bg-gray-800">
                    {work.image ? <img src={work.image} alt={work.title} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><Briefcase className="w-6 h-6 text-gray-300 dark:text-gray-600 dark:text-gray-300" /></div>}
                  </div>
                  <div className="p-2"><p className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate">{work.title}</p></div>
                  <button onClick={() => setWorks(prev => prev.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 p-1 rounded-md bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Add Work</h4>
            <div className="space-y-3">
              <input type="text" value={newWork.title} onChange={(e) => setNewWork(prev => ({ ...prev, title: e.target.value }))} placeholder="Title"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 focus:border-emerald-400 dark:focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/30 text-sm outline-none" />
              <input type="url" value={newWork.image} onChange={(e) => setNewWork(prev => ({ ...prev, image: e.target.value }))} placeholder="Image URL"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 focus:border-emerald-400 dark:focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/30 text-sm outline-none" />
              <input type="text" value={newWork.description} onChange={(e) => setNewWork(prev => ({ ...prev, description: e.target.value }))} placeholder="Description"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 focus:border-emerald-400 dark:focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/30 text-sm outline-none" />
              <button onClick={() => { if (newWork.title) { setWorks(prev => [...prev, { ...newWork }]); setNewWork({ title: '', image: '', description: '' }); } }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors">
                <Plus className="w-4 h-4" />Add Work
              </button>
            </div>
          </div>
          <button onClick={handleSaveWorks} disabled={saving}
            className="mt-4 flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-semibold text-sm transition-colors">
            <Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save Works'}
          </button>
          {saveMessage && <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">{saveMessage}</p>}
        </div>
      )}

      {activeTab === 'social' && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Social Links</h3>
          {Object.keys(socialLinks).length > 0 && (
            <div className="space-y-2 mb-6">
              {Object.entries(socialLinks).map(([key, value]) => (
                <div key={key} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200 capitalize">{key}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 dark:text-gray-400 truncate">{value}</p>
                  </div>
                  <button onClick={() => { const updated = { ...socialLinks }; delete updated[key]; setSocialLinks(updated); }}
                    className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 dark:bg-red-900/20 text-gray-400 dark:text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 dark:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Add Link</h4>
            <div className="flex gap-2">
              <select value={newLinkKey} onChange={(e) => setNewLinkKey(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 focus:border-emerald-400 dark:focus:border-emerald-600 text-sm outline-none bg-white dark:bg-gray-900">
                <option value="">Platform</option>
                <option value="twitter">X/Twitter</option>
                <option value="github">GitHub</option>
                <option value="discord">Discord</option>
                <option value="telegram">Telegram</option>
                <option value="website">Website</option>
                <option value="opensea">OpenSea</option>
              </select>
              <input type="url" value={newLinkValue} onChange={(e) => setNewLinkValue(e.target.value)} placeholder="URL"
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 focus:border-emerald-400 dark:focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/30 text-sm outline-none" />
              <button onClick={() => { if (newLinkKey && newLinkValue) { setSocialLinks(prev => ({ ...prev, [newLinkKey]: newLinkValue })); setNewLinkKey(''); setNewLinkValue(''); } }}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          <button onClick={handleSaveSocial} disabled={saving}
            className="mt-4 flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-semibold text-sm transition-colors">
            <Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save Social Links'}
          </button>
          {saveMessage && <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">{saveMessage}</p>}
        </div>
      )}
    </div>
  );
}
