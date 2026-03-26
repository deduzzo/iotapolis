import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Folder, Users, Flag,
  Plus, Edit3, Save, X, Search, Trash2, EyeOff, Eye, AlertTriangle, Loader2,
} from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { api } from '../api/endpoints';
import { useIdentity } from '../hooks/useIdentity';
import { useToast } from '../components/Layout';
import BlockchainInfo from '../components/BlockchainInfo';
import LoadingSpinner from '../components/LoadingSpinner';

const tabs = [
  { id: 'categories', label: 'Categories', icon: Folder },
  { id: 'roles', label: 'Roles', icon: Users },
  { id: 'moderation', label: 'Moderation', icon: Flag },
];

export default function Admin() {
  const [activeTab, setActiveTab] = useState('categories');

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-6"
      >
        <Shield size={28} style={{ color: 'var(--color-primary)' }} />
        <h1
          className="text-2xl md:text-3xl font-bold neon-text"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Admin Panel
        </h1>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap"
            style={{
              backgroundColor:
                activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-surface)',
              color:
                activeTab === tab.id ? 'var(--color-background)' : 'var(--color-text-muted)',
              border:
                activeTab === tab.id
                  ? 'none'
                  : '1px solid var(--color-border)',
            }}
          >
            <tab.icon size={16} />
            {tab.label}
          </motion.button>
        ))}
      </div>

      {/* Tab content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'categories' && <CategoriesTab />}
        {activeTab === 'roles' && <RolesTab />}
        {activeTab === 'moderation' && <ModerationTab />}
      </motion.div>
    </div>
  );
}

/* ── Categories Tab ────────────────────────────────────────────── */

function CategoriesTab() {
  const { identity, signAndSend } = useIdentity();
  const { addToast } = useToast();
  const { data, loading, error, reload } = useApi(
    () => api.getCategories(),
    [],
    ['category'],
  );

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // { cat, action }
  const [actionLoading, setActionLoading] = useState(false);

  const categories = Array.isArray(data) ? data : data?.categories || data?.data || [];

  function startCreate() {
    setEditId(null);
    setName('');
    setDescription('');
    setShowForm(true);
  }

  function startEdit(cat) {
    setEditId(cat.id);
    setName(cat.name);
    setDescription(cat.description || '');
    setShowForm(true);
  }

  async function executeAction() {
    if (!confirmAction || !identity) return;
    const { cat, action } = confirmAction;
    setActionLoading(true);
    try {
      const res = await signAndSend('/api/v1/moderate', 'POST', {
        postId: cat.id,
        action,
        reason: action === 'hide' ? 'Admin nasconde categoria' : 'Admin ripristina categoria',
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok && d.success) {
        addToast(
          action === 'hide'
            ? `Categoria "${cat.name}" nascosta — TX: ${d.digest?.substring(0, 12) || 'ok'}...`
            : `Categoria "${cat.name}" ripristinata — TX: ${d.digest?.substring(0, 12) || 'ok'}...`,
          'success'
        );
        reload();
      } else {
        addToast('Errore: ' + (d.error || res.statusText), 'error');
      }
    } catch (err) {
      addToast('Errore: ' + err.message, 'error');
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    console.log('[Admin] handleSubmit called. name:', name, 'identity:', !!identity, 'signAndSend:', typeof signAndSend);
    if (!name.trim()) { addToast('Nome categoria richiesto', 'error'); return; }
    if (!identity) { addToast('Identita non trovata — vai su /identity', 'error'); return; }
    if (!signAndSend) { addToast('signAndSend non disponibile', 'error'); return; }

    setSubmitting(true);
    try {
      const url = editId
        ? `/api/v1/categories/${editId}`
        : '/api/v1/categories';
      const method = editId ? 'PUT' : 'POST';
      console.log('[Admin] Sending to', method, url);
      const res = await signAndSend(url, method, {
        name: name.trim(),
        description: description.trim(),
      });
      console.log('[Admin] Response status:', res.status);
      const resData = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error('[Admin] Category failed:', resData);
        addToast('Errore: ' + (resData.error || res.statusText), 'error');
        return;
      }
      console.log('[Admin] Category OK:', resData);
      addToast(editId ? 'Categoria aggiornata' : 'Categoria creata con TX on-chain!', 'success');
      setShowForm(false);
      setName('');
      setDescription('');
      reload();
    } catch (err) {
      console.error('[Admin] Error:', err);
      addToast('Errore: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingSpinner size={24} className="py-8" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Categories</h2>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={startCreate}
          className="btn-primary flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
        >
          <Plus size={16} />
          Add Category
        </motion.button>
      </div>

      {showForm && (
        <motion.form
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="glass-card space-y-3"
        >
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Category name"
            className="w-full px-3 py-2 rounded-xl border bg-transparent outline-none text-sm"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="w-full px-3 py-2 rounded-xl border bg-transparent outline-none text-sm resize-none"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
          />
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border hover:bg-white/5"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
            >
              <X size={12} />
              Cancel
            </button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={submitting || !name.trim()}
              className="btn-primary flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg disabled:opacity-40"
            >
              <Save size={12} />
              {submitting ? 'Saving...' : editId ? 'Update' : 'Create'}
            </motion.button>
          </div>
        </motion.form>
      )}

      {categories.length === 0 && !showForm && (
        <div className="glass-card text-center py-8">
          <Folder size={32} className="mx-auto mb-2" style={{ color: 'var(--color-text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No categories yet</p>
        </div>
      )}

      {categories.map((cat) => (
        <motion.div
          key={cat.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card flex items-center justify-between"
          style={{ opacity: cat.hidden ? 0.5 : 1 }}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm">{cat.name}</h3>
              {cat.hidden && (
                <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(255,68,68,0.15)', color: 'var(--color-danger)' }}>
                  nascosta
                </span>
              )}
              <span className="text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>
                {cat.id}
              </span>
            </div>
            {cat.description && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                {cat.description}
              </p>
            )}
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
              {cat.threadCount || 0} thread · {cat.postCount || 0} post
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <BlockchainInfo entityType="category" entityId={cat.id} />
            <button
              onClick={() => startEdit(cat)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              style={{ color: 'var(--color-text-muted)' }}
              title="Modifica"
            >
              <Edit3 size={14} />
            </button>
            <button
              onClick={() => setConfirmAction({ cat, action: cat.hidden ? 'unhide' : 'hide' })}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              style={{ color: cat.hidden ? 'var(--color-success)' : 'var(--color-danger)' }}
              title={cat.hidden ? 'Ripristina' : 'Nascondi'}
            >
              {cat.hidden ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
          </div>
        </motion.div>
      ))}

      {/* Confirm action modal */}
      <AnimatePresence>
        {confirmAction && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/60" onClick={actionLoading ? undefined : () => setConfirmAction(null)} />
            <motion.div
              className="glass-card relative p-6 rounded-xl max-w-md mx-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{ borderRadius: 'var(--border-radius)' }}
            >
              {actionLoading ? (
                <div className="text-center py-4">
                  <Loader2 size={36} className="animate-spin mx-auto mb-3" style={{ color: 'var(--color-primary)' }} />
                  <h3 className="text-lg font-bold mb-1">Transazione in corso...</h3>
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    Pubblicazione sulla blockchain IOTA e verifica. Non chiudere.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <AlertTriangle size={24} style={{ color: confirmAction.action === 'hide' ? 'var(--color-danger)' : 'var(--color-success)' }} />
                    <h3 className="text-lg font-bold">
                      {confirmAction.action === 'hide' ? 'Nascondi categoria' : 'Ripristina categoria'}
                    </h3>
                  </div>
                  <p className="mb-2" style={{ color: 'var(--color-text-muted)' }}>
                    {confirmAction.action === 'hide'
                      ? <>Vuoi nascondere la categoria <strong style={{ color: 'var(--color-text)' }}>"{confirmAction.cat.name}"</strong>? Non sara piu visibile agli utenti.</>
                      : <>Vuoi ripristinare la categoria <strong style={{ color: 'var(--color-text)' }}>"{confirmAction.cat.name}"</strong>? Tornera visibile a tutti.</>
                    }
                  </p>
                  <p className="mb-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    Questa azione verra registrata sulla blockchain come transazione firmata e verificabile.
                  </p>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setConfirmAction(null)}
                      className="px-4 py-2 rounded-lg text-sm"
                      style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)', borderRadius: 'var(--border-radius)' }}
                    >
                      Annulla
                    </button>
                    <button
                      onClick={executeAction}
                      className="px-4 py-2 rounded-lg text-sm font-medium"
                      style={{
                        backgroundColor: confirmAction.action === 'hide' ? 'var(--color-danger)' : 'var(--color-success)',
                        color: '#fff',
                        borderRadius: 'var(--border-radius)',
                      }}
                    >
                      {confirmAction.action === 'hide' ? 'Nascondi' : 'Ripristina'}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Roles Tab ─────────────────────────────────────────────────── */

function RolesTab() {
  const { identity, signAndSend } = useIdentity();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searching, setSearching] = useState(false);
  const [assigning, setAssigning] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchResult(null);
    try {
      const res = await fetch(`/api/v1/user/${encodeURIComponent(searchQuery.trim())}`);
      if (!res.ok) throw new Error('User not found');
      setSearchResult(await res.json());
    } catch {
      setSearchResult({ error: 'User not found' });
    } finally {
      setSearching(false);
    }
  }

  async function assignRole(userId, role) {
    if (!identity) return;
    setAssigning(true);
    try {
      const res = await signAndSend('/api/v1/user/role', 'POST', { userId, role });
      if (!res.ok) throw new Error('Failed');
      // Re-search
      const r2 = await fetch(`/api/v1/user/${encodeURIComponent(userId)}`);
      if (r2.ok) setSearchResult(await r2.json());
    } catch (err) {
      console.error(err);
    } finally {
      setAssigning(false);
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Role Management</h2>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--color-text-muted)' }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search user by ID or username..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border bg-transparent outline-none text-sm"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          type="submit"
          disabled={searching}
          className="btn-primary px-4 py-2 rounded-xl text-sm disabled:opacity-40"
        >
          {searching ? 'Searching...' : 'Search'}
        </motion.button>
      </form>

      {searchResult && !searchResult.error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card"
        >
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="font-semibold">{searchResult.username || 'Anonymous'}</h3>
              <p className="font-mono text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {searchResult.userId || searchResult.id}
              </p>
              <p className="text-xs mt-1">
                Current role:{' '}
                <span
                  className="font-semibold"
                  style={{ color: 'var(--color-primary)' }}
                >
                  {searchResult.role || 'user'}
                </span>
              </p>
            </div>
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => assignRole(searchResult.userId || searchResult.id, 'moderator')}
                disabled={assigning}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:bg-white/5 disabled:opacity-40"
                style={{
                  borderColor: 'var(--color-warning)',
                  color: 'var(--color-warning)',
                }}
              >
                Make Moderator
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => assignRole(searchResult.userId || searchResult.id, 'user')}
                disabled={assigning}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:bg-white/5 disabled:opacity-40"
                style={{
                  borderColor: 'var(--color-text-muted)',
                  color: 'var(--color-text-muted)',
                }}
              >
                Remove Role
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {searchResult?.error && (
        <div className="glass-card text-center">
          <p className="text-sm" style={{ color: 'var(--color-danger)' }}>
            {searchResult.error}
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Moderation Tab ────────────────────────────────────────────── */

function ModerationTab() {
  const { identity, signAndSend } = useIdentity();

  // Placeholder: fetch moderation queue
  const { data, loading, reload } = useApi(
    () => fetch('/api/v1/moderation/queue').then((r) => r.ok ? r.json() : []),
    [],
    ['moderation'],
  );

  const items = Array.isArray(data) ? data : data?.data || [];

  async function handleAction(postId, action) {
    if (!identity) return;
    try {
      await signAndSend(`/api/v1/moderation/${action}`, 'POST', { postId });
      reload();
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) return <LoadingSpinner size={24} className="py-8" />;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Moderation Queue</h2>

      {items.length === 0 && (
        <div className="glass-card text-center py-8">
          <Flag size={32} className="mx-auto mb-2" style={{ color: 'var(--color-text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            No flagged content. Everything looks good!
          </p>
        </div>
      )}

      {items.map((item) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>
                {item.type || 'post'} by {item.authorName || item.authorId?.slice(0, 12)}
              </p>
              <p className="text-sm line-clamp-3">{item.content}</p>
              {item.reason && (
                <p className="text-xs mt-1" style={{ color: 'var(--color-warning)' }}>
                  Reason: {item.reason}
                </p>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAction(item.id, 'approve')}
                className="px-3 py-1.5 rounded-lg text-xs border transition-colors hover:bg-white/5"
                style={{ borderColor: 'var(--color-success)', color: 'var(--color-success)' }}
              >
                Approve
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAction(item.id, 'remove')}
                className="px-3 py-1.5 rounded-lg text-xs border transition-colors hover:bg-white/5"
                style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}
              >
                <Trash2 size={12} />
              </motion.button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
