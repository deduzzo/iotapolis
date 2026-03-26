import { useState, useCallback, createContext, useContext } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home, BarChart3, Fingerprint, ShieldCheck,
  Search, Wifi, WifiOff, Menu, Settings,
} from 'lucide-react';
import Sidebar from './Sidebar';
import IdentityBadge from './IdentityBadge';
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

const navItems = [
  { to: '/', icon: Home, label: 'Home', group: 'Forum' },
  { to: '/dashboard', icon: BarChart3, label: 'Dashboard', group: 'Forum' },
  { to: '/identity', icon: Fingerprint, label: 'Identity', group: 'Account' },
  { to: '/admin', icon: ShieldCheck, label: 'Admin', group: 'Account' },
  { to: '/settings', icon: Settings, label: 'Impostazioni', group: 'Account' },
];

/* ── Layout ────────────────────────────────────────────────────── */

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

  /* Search */
  const [searchQuery, setSearchQuery] = useState('');

  function handleSearch(e) {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  }

  const isSynced = syncStatus?.synced ?? null;

  return (
    <ToastContext.Provider value={{ addToast }}>
      <div className="flex min-h-screen">
        {/* Desktop sidebar */}
        <div className="hidden md:block">
          <Sidebar
            collapsed={collapsed}
            onToggle={() => setCollapsed((c) => !c)}
            navItems={navItems}
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
                navItems={navItems}
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

            {/* Sync status */}
            <div className="flex items-center gap-2 shrink-0">
              {isSynced !== null && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg"
                  style={{
                    color: isSynced ? 'var(--color-success)' : 'var(--color-warning)',
                    background: isSynced
                      ? 'rgba(0,255,136,0.1)'
                      : 'rgba(255,170,0,0.1)',
                  }}
                >
                  {isSynced ? <Wifi size={14} /> : <WifiOff size={14} />}
                  <span className="hidden sm:inline">
                    {isSynced ? 'Synced' : 'Syncing...'}
                  </span>
                </motion.div>
              )}

              {/* Identity badge */}
              {identity?.username ? (
                <IdentityBadge
                  userId={identity.userId}
                  username={identity.username}
                  size="sm"
                />
              ) : identity ? (
                <IdentityBadge
                  userId={identity.userId}
                  size="sm"
                />
              ) : null}
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 p-4 md:p-6">
            <Outlet />
          </main>
        </div>

        {/* Toasts */}
        <Toast toasts={toasts} onDismiss={dismissToast} />
      </div>
    </ToastContext.Provider>
  );
}
