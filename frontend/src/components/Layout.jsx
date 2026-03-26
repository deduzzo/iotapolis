import { useState, useCallback, useEffect, createContext, useContext } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home, BarChart3, Fingerprint, ShieldCheck,
  Search, Wifi, WifiOff, Menu, Settings, Globe, Wallet,
  Loader2, AlertTriangle, Fuel,
} from 'lucide-react';
import Sidebar from './Sidebar';
import IdentityBadge from './IdentityBadge';
import OnboardingGuard from './OnboardingGuard';
import Toast from './Toast';
import { useTheme } from '../hooks/useTheme';
import { useIdentity } from '../hooks/useIdentity';
import { useApi } from '../hooks/useApi';
import { api } from '../api/endpoints';

/* ── Toast context ─────────────────────────────────────────────── */

const ToastContext = createContext(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within Layout');
  return ctx;
}

let _toastId = 0;

/* ── Forum nav items (same shape as Sidebar expects) ──────────── */

function getNavItems(isAdmin) {
  const items = [
    { to: '/', icon: Home, label: 'Home', group: 'Forum' },
    { to: '/dashboard', icon: BarChart3, label: 'Dashboard', group: 'Forum' },
    { to: '/identity', icon: Fingerprint, label: 'Identity', group: 'Account' },
  ];
  if (isAdmin) {
    items.push({ to: '/admin', icon: ShieldCheck, label: 'Admin', group: 'Account' });
  }
  items.push(
    { to: '/settings', icon: Settings, label: 'Impostazioni', group: 'Account' },
    { to: '/setup', icon: Globe, label: 'Setup / Connetti', group: 'Account' },
  );
  return items;
}

/* ── Layout ────────────────────────────────────────────────────── */

function SyncInfoButton({ isSynced, syncState, syncStatus }) {
  const [showPanel, setShowPanel] = useState(false);
  const [integrity, setIntegrity] = useState(null);
  const [loadingIntegrity, setLoadingIntegrity] = useState(false);

  async function fetchIntegrity() {
    setLoadingIntegrity(true);
    try {
      const res = await fetch('/api/v1/integrity-check');
      const data = await res.json();
      setIntegrity(data);
    } catch { setIntegrity(null); }
    setLoadingIntegrity(false);
  }

  useEffect(() => {
    if (showPanel) fetchIntegrity();
  }, [showPanel]);

  return (
    <div className="relative">
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={() => setShowPanel(p => !p)}
        className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg cursor-pointer"
        style={{
          color: isSynced ? 'var(--color-success)' : syncState === 'error' ? 'var(--color-danger)' : 'var(--color-warning)',
          background: isSynced ? 'rgba(0,255,136,0.1)' : syncState === 'error' ? 'rgba(255,68,68,0.1)' : 'rgba(255,170,0,0.1)',
        }}
      >
        {isSynced ? <Wifi size={14} /> : <WifiOff size={14} />}
        <span className="hidden sm:inline">
          {isSynced ? 'Synced' : syncState === 'syncing' ? 'Syncing...' : syncState === 'error' ? 'Error' : 'Idle'}
        </span>
      </motion.button>

      {showPanel && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowPanel(false)} />
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="absolute right-0 top-full mt-2 z-50 w-80 rounded-xl border p-4 text-xs shadow-lg"
            style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', boxShadow: '0 10px 40px rgba(0,0,0,0.4)' }}
          >
            <h4 className="font-bold text-sm mb-3" style={{ color: 'var(--color-text)' }}>Stato Sincronizzazione</h4>

            {/* Sync info */}
            <div className="space-y-1.5 mb-3">
              <div className="flex justify-between">
                <span style={{ color: 'var(--color-text-muted)' }}>Status</span>
                <span style={{ color: isSynced ? 'var(--color-success)' : 'var(--color-warning)' }}>
                  {isSynced ? 'Sincronizzato' : syncState}
                </span>
              </div>
              {syncStatus?.sync?.lastSync && (
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-text-muted)' }}>Ultima sync</span>
                  <span style={{ color: 'var(--color-text)' }}>{new Date(syncStatus.sync.lastSync).toLocaleString()}</span>
                </div>
              )}
              {syncStatus?.sync?.stats && (
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-text-muted)' }}>Sync stats</span>
                  <span style={{ color: 'var(--color-text)' }}>
                    U:{syncStatus.sync.stats.users} C:{syncStatus.sync.stats.categories} T:{syncStatus.sync.stats.threads} P:{syncStatus.sync.stats.posts} V:{syncStatus.sync.stats.votes}
                  </span>
                </div>
              )}
            </div>

            {/* Wallet */}
            {syncStatus?.wallet && (
              <div className="space-y-1.5 mb-3 pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-text-muted)' }}>Wallet</span>
                  <span className="font-mono" style={{ color: 'var(--color-text)' }}>{syncStatus.wallet.address?.slice(0, 16)}...</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-text-muted)' }}>Balance</span>
                  <span className="font-mono" style={{ color: 'var(--color-primary)' }}>{syncStatus.wallet.balance}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-text-muted)' }}>Network</span>
                  <span style={{ color: 'var(--color-text)' }}>{syncStatus.wallet.network}</span>
                </div>
              </div>
            )}

            {/* Integrity check */}
            <div className="pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <h5 className="font-bold mb-2" style={{ color: 'var(--color-text)' }}>Integrity Check (DB vs Blockchain)</h5>
              {loadingIntegrity && <span style={{ color: 'var(--color-text-muted)' }}>Verificando...</span>}
              {integrity && !loadingIntegrity && (
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--color-text-muted)' }}>Stato</span>
                    <span style={{ color: integrity.synced ? 'var(--color-success)' : 'var(--color-danger)' }}>
                      {integrity.synced ? 'IN SYNC' : 'MISMATCH'}
                    </span>
                  </div>
                  {integrity.local && (
                    <>
                      <div className="flex justify-between">
                        <span style={{ color: 'var(--color-text-muted)' }}>DB locale</span>
                        <span style={{ color: 'var(--color-text)' }}>
                          U:{integrity.local.users} C:{integrity.local.categories} T:{integrity.local.threads} P:{integrity.local.posts} V:{integrity.local.votes}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: 'var(--color-text-muted)' }}>Blockchain</span>
                        <span style={{ color: 'var(--color-text)' }}>
                          U:{integrity.chain.users} C:{integrity.chain.categories} T:{integrity.chain.threads} P:{integrity.chain.posts} V:{integrity.chain.votes}
                        </span>
                      </div>
                    </>
                  )}
                  {integrity.mismatches?.map((m, i) => (
                    <div key={i} className="px-2 py-1 rounded" style={{ background: 'rgba(255,68,68,0.1)', color: 'var(--color-danger)' }}>
                      {m.entity}: locale={m.local} chain={m.chain} (diff: {m.diff > 0 ? '+' : ''}{m.diff})
                    </div>
                  ))}
                  <button
                    onClick={fetchIntegrity}
                    className="mt-1 text-[10px] underline"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    Ricontrolla
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}

export default function Layout() {
  const { forumName } = useTheme();
  const { identity } = useIdentity();
  const navigate = useNavigate();

  /* Sidebar collapse */
  const [collapsed, setCollapsed] = useState(false);

  /* Mobile sidebar toggle */
  const [mobileOpen, setMobileOpen] = useState(false);

  /* Toast state */
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = ++_toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /* Sync status */
  const { data: syncStatus } = useApi(
    () => api.getSyncStatus(),
    [],
    ['sync'],
  );

  /* User role (check if admin) */
  const { data: userProfile } = useApi(
    () => identity?.userId ? api.getUser(identity.userId) : Promise.resolve(null),
    [identity?.userId],
    ['user'],
  );
  const isAdmin = userProfile?.user?.role === 'admin' || userProfile?.role === 'admin';

  /* Search */
  const [searchQuery, setSearchQuery] = useState('');

  function handleSearch(e) {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  }

  const syncState = syncStatus?.sync?.status || null;
  const isSynced = syncState === 'idle' && syncStatus?.sync?.lastSync;

  // Wallet balance check — block the entire site if insufficient
  const walletBalance = syncStatus?.wallet?.balance || '';
  const walletNetwork = syncStatus?.wallet?.network || 'testnet';
  const isTestnet = walletNetwork === 'testnet' || walletNetwork === 'devnet';
  // Parse balance: "9.999.000.000 nanos [9 IOTA]" → extract IOTA number
  const iotaMatch = walletBalance.match(/\[(\d+) IOTA\]/);
  const iotaBalance = iotaMatch ? parseInt(iotaMatch[1]) : null;
  const isLowBalance = iotaBalance !== null && iotaBalance < 1;
  const [refuelRequested, setRefuelRequested] = useState(false);

  // Auto-request faucet when balance is low (testnet only)
  useEffect(() => {
    if (!isLowBalance || refuelRequested) return;
    if (!isTestnet) return;

    setRefuelRequested(true);
    console.log('[Layout] Low balance detected, requesting faucet...');
    fetch('/api/v1/sync-status').then(r => r.json()).then(() => {
      // The server-side faucet monitor will handle it
      // We just trigger a refresh after a delay
      setTimeout(() => setRefuelRequested(false), 15000);
    }).catch(() => setTimeout(() => setRefuelRequested(false), 15000));
  }, [isLowBalance, isTestnet, refuelRequested]);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {/* Low balance blocker modal */}
      {isLowBalance && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card p-8 rounded-xl max-w-lg mx-4 text-center"
            style={{ borderRadius: 'var(--border-radius)' }}
          >
            {isTestnet ? (
              <>
                <Loader2 size={48} className="animate-spin mx-auto mb-4" style={{ color: 'var(--color-primary)' }} />
                <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
                  Ricarica in corso...
                </h2>
                <p className="mb-4" style={{ color: 'var(--color-text-muted)' }}>
                  Il bilancio del wallet e insufficiente ({iotaBalance} IOTA).
                  Richiesta fondi dal faucet {walletNetwork} in corso.
                  Il forum sara disponibile appena i fondi arriveranno.
                </p>
                <div className="flex items-center justify-center gap-2 text-sm" style={{ color: 'var(--color-warning)' }}>
                  <Fuel size={16} />
                  Faucet richiesto automaticamente
                </div>
              </>
            ) : (
              <>
                <AlertTriangle size={48} className="mx-auto mb-4" style={{ color: 'var(--color-danger)' }} />
                <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
                  Bilancio insufficiente
                </h2>
                <p className="mb-4" style={{ color: 'var(--color-text-muted)' }}>
                  Il wallet del forum ha {iotaBalance} IOTA sulla rete {walletNetwork}.
                  Per pubblicare transazioni e necessario ricaricare il wallet.
                </p>
                <p className="text-sm font-mono p-3 rounded-lg mb-4" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-primary)' }}>
                  {syncStatus?.wallet?.address || 'Indirizzo non disponibile'}
                </p>
                <p className="text-sm" style={{ color: 'var(--color-danger)' }}>
                  Invia almeno 1 IOTA a questo indirizzo per ripristinare il funzionamento.
                </p>
              </>
            )}
          </motion.div>
        </div>
      )}
      <div className="flex min-h-screen">
        {/* Desktop sidebar */}
        <div className="hidden md:block">
          <Sidebar
            collapsed={collapsed}
            onToggle={() => setCollapsed((c) => !c)}
            navItems={getNavItems(isAdmin)}
          />
        </div>

        {/* Mobile sidebar overlay */}
        {mobileOpen && (
          <div className="md:hidden fixed inset-0 z-40">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setMobileOpen(false)}
            />
            <div className="relative z-50">
              <Sidebar
                collapsed={false}
                onToggle={() => setMobileOpen(false)}
                navItems={getNavItems(isAdmin)}
              />
            </div>
          </div>
        )}

        {/* Main area */}
        <div
          className="flex-1 flex flex-col min-h-screen transition-[margin] duration-300"
          style={{ marginLeft: collapsed ? 72 : 260 }}
        >
          {/* Top bar */}
          <header
            className="sticky top-0 z-30 glass-static border-b border-white/10 px-4 md:px-6 py-3 flex items-center gap-4"
          >
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <Menu size={20} />
            </button>

            {/* Forum name */}
            <h1
              className="text-lg font-bold neon-text hidden sm:block shrink-0"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {forumName}
            </h1>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 max-w-md mx-auto">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--color-text-muted)' }}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl border bg-transparent outline-none text-sm transition-colors"
                  style={{
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text)',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
                />
              </div>
            </form>

            {/* Wallet balance (visible to all) + Sync status */}
            <div className="flex items-center gap-2 shrink-0">
              {iotaBalance !== null && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg cursor-pointer"
                  style={{
                    color: isLowBalance ? 'var(--color-danger)' : 'var(--color-primary)',
                    background: isLowBalance ? 'rgba(255,68,68,0.1)' : 'rgba(0,240,255,0.08)',
                  }}
                  title={`Wallet: ${syncStatus?.wallet?.address || ''}\nNetwork: ${walletNetwork}`}
                  onClick={() => navigate('/dashboard')}
                >
                  <Wallet size={13} />
                  <span className="font-mono">
                    {iotaBalance} <span style={{ color: 'var(--color-text-muted)' }}>IOTA</span>
                  </span>
                </motion.div>
              )}
              {syncState && (
                <SyncInfoButton
                  isSynced={isSynced}
                  syncState={syncState}
                  syncStatus={syncStatus}
                />
              )}

              {/* Identity badge + role */}
              {identity && (
                <div className="flex items-center gap-2">
                  <IdentityBadge
                    userId={identity.userId}
                    username={identity.username}
                    size="sm"
                  />
                  {userProfile?.user?.role && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded font-medium uppercase"
                      style={{
                        backgroundColor: isAdmin ? 'rgba(255,68,68,0.15)' : 'rgba(0,240,255,0.15)',
                        color: isAdmin ? 'var(--color-danger)' : 'var(--color-primary)',
                      }}
                    >
                      {userProfile.user.role}
                    </span>
                  )}
                </div>
              )}
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 p-4 md:p-6">
            <OnboardingGuard>
              <Outlet />
            </OnboardingGuard>
          </main>
        </div>

        {/* Toasts */}
        <Toast toasts={toasts} onDismiss={dismissToast} />
      </div>
    </ToastContext.Provider>
  );
}
