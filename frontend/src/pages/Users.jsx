import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users as UsersIcon, Search, Filter, Shield, Star, MessageSquare,
  FileText, Coins, ArrowUpDown, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApi } from '../hooks/useApi';
import { useRealtimeUpdate } from '../hooks/useWebSocket';
import { api } from '../api/endpoints';
import IdentityBadge from '../components/IdentityBadge';
import LoadingSpinner from '../components/LoadingSpinner';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};
const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

const ROLE_COLORS = {
  admin: { bg: 'rgba(255,68,68,0.15)', color: '#ff4444', border: '#ff444430' },
  moderator: { bg: 'rgba(168,85,247,0.15)', color: '#a855f7', border: '#a855f730' },
  user: { bg: 'rgba(0,240,255,0.15)', color: 'var(--color-primary)', border: 'var(--color-primary)30' },
  banned: { bg: 'rgba(100,100,100,0.15)', color: '#888', border: '#88888830' },
};

const SORT_OPTIONS = [
  { value: 'newest', label: 'Piu recenti' },
  { value: 'oldest', label: 'Piu vecchi' },
  { value: 'mostPosts', label: 'Piu post' },
  { value: 'mostThreads', label: 'Piu thread' },
  { value: 'mostTips', label: 'Piu tip ricevuti' },
  { value: 'alphabetical', label: 'Alfabetico' },
];

function formatDate(ts) {
  if (!ts) return '--';
  return new Date(ts).toLocaleDateString();
}

function formatIota(nanos) {
  if (!nanos) return '0';
  return (Number(nanos) / 1e9).toFixed(2);
}

export default function Users() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);

  const { data, loading, error, reload } = useApi(
    () => api.getUsers({ search: search || undefined, role: role || undefined, sort, page }),
    [search, role, sort, page],
    ['user'],
  );

  useRealtimeUpdate(
    useCallback(() => { reload(); }, [reload]),
    ['user'],
  );

  const users = data?.users || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / (data?.perPage || 50));
  const roleSummary = data?.roleSummary || {};
  const active24h = data?.active24h || 0;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-6"
      >
        <UsersIcon size={28} style={{ color: 'var(--color-primary)' }} />
        <h1
          className="text-2xl md:text-3xl font-bold neon-text"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          {t('users.title', 'Utenti')}
        </h1>
      </motion.div>

      {/* Stats bar — clickable to filter */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6"
      >
        {[
          { label: 'Totale', value: total, color: 'var(--color-primary)', filterRole: '' },
          { label: 'Admin', value: roleSummary.admin || 0, color: '#ff4444', filterRole: 'admin' },
          { label: 'Moderatori', value: roleSummary.moderator || 0, color: '#a855f7', filterRole: 'moderator' },
          { label: 'Utenti', value: roleSummary.user || 0, color: 'var(--color-primary)', filterRole: 'user' },
          { label: 'Attivi 24h', value: active24h, color: 'var(--color-success)', filterRole: '' },
        ].map((stat) => (
          <motion.button
            key={stat.label}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { if (stat.filterRole !== undefined) { setRole(stat.filterRole); setPage(1); } }}
            className="glass-card p-3 text-center cursor-pointer transition-all"
            style={{
              borderColor: role === stat.filterRole && stat.filterRole ? stat.color : undefined,
              boxShadow: role === stat.filterRole && stat.filterRole ? `0 0 12px ${stat.color}30` : undefined,
            }}
          >
            <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{stat.label}</p>
          </motion.button>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-card p-4 mb-6"
      >
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="flex-1 min-w-[200px] relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder={t('users.searchPlaceholder', 'Cerca per username...')}
              className="w-full pl-9 pr-3 py-2 rounded-xl border bg-transparent text-sm outline-none"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
            />
          </div>

          {/* Role filter */}
          <div className="flex items-center gap-1.5">
            <Filter size={14} style={{ color: 'var(--color-text-muted)' }} />
            {['', 'admin', 'moderator', 'user', 'banned'].map((r) => (
              <button
                key={r}
                onClick={() => { setRole(r); setPage(1); }}
                className="px-2.5 py-1 text-xs rounded-full transition-all"
                style={{
                  backgroundColor: role === r ? 'var(--color-primary)' : 'var(--color-surface)',
                  color: role === r ? 'var(--color-background)' : 'var(--color-text-muted)',
                  border: `1px solid ${role === r ? 'var(--color-primary)' : 'var(--color-border)'}`,
                }}
              >
                {r || 'Tutti'}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1.5">
            <ArrowUpDown size={14} style={{ color: 'var(--color-text-muted)' }} />
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1); }}
              className="text-xs px-2 py-1 rounded-lg bg-transparent border outline-none"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* User list */}
      {loading ? (
        <LoadingSpinner size={32} className="min-h-[30vh]" />
      ) : error ? (
        <div className="text-center py-8">
          <p style={{ color: 'var(--color-danger)' }}>{error}</p>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12">
          <UsersIcon size={40} className="mx-auto mb-3" style={{ color: 'var(--color-text-muted)' }} />
          <p style={{ color: 'var(--color-text-muted)' }}>
            {search ? t('users.noResults', 'Nessun utente trovato') : t('users.noUsers', 'Nessun utente registrato')}
          </p>
        </div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-2">
          {users.map((user) => {
            const rc = ROLE_COLORS[user.role] || ROLE_COLORS.user;
            return (
              <motion.div key={user.id} variants={item}>
                <Link to={`/u/${user.id}`}>
                  <motion.div
                    whileHover={{ scale: 1.005, x: 2 }}
                    className="glass-card p-4 flex items-center gap-4 cursor-pointer hover:neon-border transition-all"
                  >
                    {/* Avatar + Identity */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <IdentityBadge
                        userId={user.id}
                        username={user.username}
                        showUsername={true}
                        size="md"
                        asLink={false}
                      />
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0"
                        style={{ backgroundColor: rc.bg, color: rc.color, border: `1px solid ${rc.border}` }}
                      >
                        {user.role}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="hidden md:flex items-center gap-6 text-xs shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                      <div className="flex items-center gap-1" title="Thread">
                        <FileText size={13} style={{ color: 'var(--color-primary)' }} />
                        <span className="font-medium">{user.threadCount}</span>
                      </div>
                      <div className="flex items-center gap-1" title="Post">
                        <MessageSquare size={13} style={{ color: 'var(--color-secondary, #a855f7)' }} />
                        <span className="font-medium">{user.postCount}</span>
                      </div>
                      <div className="flex items-center gap-1" title="Tip ricevuti">
                        <Coins size={13} style={{ color: 'var(--color-warning, #f59e0b)' }} />
                        <span className="font-medium">{user.tipsReceived}</span>
                      </div>
                      {user.avgRating && (
                        <div className="flex items-center gap-1" title="Rating">
                          <Star size={13} style={{ color: '#f59e0b' }} />
                          <span className="font-medium">{user.avgRating}</span>
                        </div>
                      )}
                      {user.totalTrades > 0 && (
                        <div className="flex items-center gap-1" title="Trade completati">
                          <Shield size={13} style={{ color: 'var(--color-success)' }} />
                          <span className="font-medium">{user.totalTrades}</span>
                        </div>
                      )}
                    </div>

                    {/* Join date */}
                    <div className="hidden lg:block text-xs shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                      {formatDate(user.createdAt)}
                    </div>

                    {/* Mobile stats */}
                    <div className="flex md:hidden items-center gap-3 text-xs shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                      <span><FileText size={11} className="inline" /> {user.threadCount}</span>
                      <span><MessageSquare size={11} className="inline" /> {user.postCount}</span>
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="flex items-center gap-1 px-3 py-2 rounded-xl border text-sm transition-colors disabled:opacity-30"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
          >
            <ChevronLeft size={16} />
          </motion.button>
          <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {page} / {totalPages}
          </span>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="flex items-center gap-1 px-3 py-2 rounded-xl border text-sm transition-colors disabled:opacity-30"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
          >
            <ChevronRight size={16} />
          </motion.button>
        </div>
      )}
    </div>
  );
}
