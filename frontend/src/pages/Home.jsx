import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Folder, MessageSquare, FileText, Clock, Plus, Share2, Copy, CheckCircle, X, ExternalLink, Globe, Shield, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApi } from '../hooks/useApi';
import { useRealtimeUpdate } from '../hooks/useWebSocket';
import { useIdentity } from '../hooks/useIdentity';
import { api } from '../api/endpoints';
import BlockchainInfo from '../components/BlockchainInfo';
import LoadingSpinner from '../components/LoadingSpinner';
import { useTheme } from '../hooks/useTheme';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

function formatTime(dateStr) {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  const now = Date.now();
  const diff = now - d.getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`;
  return d.toLocaleDateString();
}

export default function Home() {
  const { t } = useTranslation();
  const { identity } = useIdentity();
  const { data: categories, loading, error, setData: setCategories } = useApi(
    () => api.getCategories(),
    [],
  );

  // IDs categorie aggiornate di recente (per highlight)
  const [freshCatIds, setFreshCatIds] = useState(new Set());

  const markCatFresh = useCallback((catId) => {
    setFreshCatIds((prev) => new Set(prev).add(catId));
    setTimeout(() => {
      setFreshCatIds((prev) => {
        const next = new Set(prev);
        next.delete(catId);
        return next;
      });
    }, 3000);
  }, []);

  // WebSocket: aggiornamenti granulari per categorie
  useRealtimeUpdate(
    useCallback(
      (wsData) => {
        if (wsData.action === 'categoryCreated' || wsData.action === 'categoryEdited') {
          api.getCategories().then((fresh) => {
            if (fresh) {
              setCategories(fresh);
              if (wsData.categoryId) markCatFresh(wsData.categoryId);
            }
          });
        }

        // Un nuovo thread/post aggiorna i contatori della categoria
        if (wsData.action === 'threadCreated' && wsData.categoryId) {
          setCategories((prev) => {
            if (!prev) return prev;
            const list = Array.isArray(prev) ? prev : prev?.categories || prev?.data || [];
            const idx = list.findIndex((c) => c.id === wsData.categoryId);
            if (idx === -1) return prev;

            const updated = [...list];
            updated[idx] = {
              ...updated[idx],
              threadCount: (updated[idx].threadCount || 0) + 1,
              lastActivity: Date.now(),
            };

            markCatFresh(wsData.categoryId);

            if (Array.isArray(prev)) return updated;
            if (prev.categories) return { ...prev, categories: updated };
            return { ...prev, data: updated };
          });
        }

        if (wsData.action === 'postCreated' && wsData.threadId) {
          // Aggiorna i contatori post — serve sapere la categoryId.
          // Facciamo un refresh leggero.
          api.getCategories().then((fresh) => {
            if (fresh) setCategories(fresh);
          });
        }
      },
      [setCategories, markCatFresh],
    ),
    ['category', 'thread', 'post'],
  );
  const { activeThemeId } = useTheme();
  const isInvisionLayout = activeThemeId?.startsWith('invision');

  const { data: userProfile } = useApi(
    () => identity?.userId ? api.getUser(identity.userId) : Promise.resolve(null),
    [identity?.userId],
  );
  const isAdmin = userProfile?.user?.role === 'admin';

  // All hooks MUST be before any conditional return
  const [forumInfo, setForumInfo] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showShare, setShowShare] = useState(false);
  useEffect(() => {
    fetch('/api/v1/forum-info').then(r => r.json()).then(d => setForumInfo(d)).catch(() => {});
  }, []);

  if (loading) {
    return <LoadingSpinner size={32} className="min-h-[40vh]" />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p style={{ color: 'var(--color-danger)' }}>{error}</p>
      </div>
    );
  }

  const list = Array.isArray(categories) ? categories : categories?.categories || categories?.data || [];
  const moveNotDeployed = forumInfo && !forumInfo.moveMode;

  // Smart contract not deployed — block everything
  if (moveNotDeployed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 max-w-lg mx-auto text-center">
        <div className="p-4 rounded-full" style={{ backgroundColor: 'rgba(255,170,0,0.15)' }}>
          <AlertCircle size={48} style={{ color: 'var(--color-warning)' }} />
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
            {t('home.contractNotDeployed')}
          </h2>
          <p style={{ color: 'var(--color-text-muted)' }}>
            {t('home.contractNotDeployedDesc')}
          </p>
        </div>
        <div className="glass-card p-4 rounded-xl w-full text-left" style={{ borderRadius: 'var(--border-radius)' }}>
          <p className="text-sm font-medium mb-2">{t('home.runInTerminal')}</p>
          <code className="block p-3 rounded-lg text-sm font-mono" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-primary)' }}>
            npm run move:deploy
          </code>
          <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
            {t('home.thenRestart')} <code style={{ color: 'var(--color-text)' }}>npm run dev</code>
          </p>
        </div>
      </div>
    );
  }

  if (list.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <Folder size={48} style={{ color: 'var(--color-text-muted)' }} />
        <p className="text-lg" style={{ color: 'var(--color-text-muted)' }}>
          {t('home.noCategories')}
        </p>
        {isAdmin ? (
          <Link
            to="/admin"
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all"
            style={{
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-background)',
              borderRadius: 'var(--border-radius)',
            }}
          >
            <Plus size={18} />
            {t('home.createFirstCategory')}
          </Link>
        ) : (
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {t('home.adminMustCreate')}
          </p>
        )}
      </div>
    );
  }

  function copyConnectionString() {
    if (forumInfo?.connectionString) {
      navigator.clipboard.writeText(forumInfo.connectionString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header with share button */}
      <div className="flex items-center justify-between mb-6">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl md:text-3xl font-bold neon-text"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          {t('home.categories')}
        </motion.h1>

        {forumInfo?.connectionString && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowShare(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-primary)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--border-radius)',
            }}
          >
            <Share2 size={16} />
            <span className="hidden sm:inline">{t('home.shareForum')}</span>
          </motion.button>
        )}
      </div>

      {isInvisionLayout ? (
        /* ── IPB-style table layout ── */
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="rounded-xl overflow-hidden border"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
        >
          <div
            className="grid grid-cols-[1fr_auto_auto] md:grid-cols-[1fr_120px_200px] gap-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider"
            style={{ background: 'var(--color-primary)', color: 'var(--color-background)' }}
          >
            <span>{t('home.forum')}</span>
            <span className="text-center hidden md:block">{t('home.stats')}</span>
            <span className="hidden md:block">{t('home.lastPost')}</span>
          </div>

          {list.map((cat, idx) => {
            const isCatFresh = freshCatIds.has(cat.id);
            return (
            <motion.div key={cat.id} variants={item}>
              <Link to={`/c/${cat.id}`}>
                <div
                  className="grid grid-cols-[1fr_auto] md:grid-cols-[1fr_120px_200px] gap-2 px-4 py-3.5 items-center cursor-pointer transition-colors"
                  style={{
                    borderBottom: idx < list.length - 1 ? '1px solid var(--color-border)' : 'none',
                    background: isCatFresh ? 'rgba(0, 255, 136, 0.04)' : 'transparent',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface-hover, rgba(255,255,255,0.03))'}
                  onMouseLeave={(e) => e.currentTarget.style.background = isCatFresh ? 'rgba(0, 255, 136, 0.04)' : 'transparent'}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-background)' }}
                    >
                      <Folder size={18} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm truncate" style={{ color: 'var(--color-text)' }}>{cat.name}</h3>
                      {cat.description && (
                        <p className="text-xs truncate mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{cat.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-center hidden md:block">
                    <div className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                      {cat.threadCount ?? 0} <span className="text-xs font-normal" style={{ color: 'var(--color-text-muted)' }}>{t('home.topics')}</span>
                    </div>
                    <div className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                      {cat.postCount ?? 0} <span className="text-xs font-normal" style={{ color: 'var(--color-text-muted)' }}>{t('home.replies')}</span>
                    </div>
                  </div>
                  <div className="hidden md:flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ background: `hsl(${(cat.lastAuthor || cat.name || '').charCodeAt(0) * 7 % 360}, 65%, 50%)` }}
                    >
                      {(cat.lastAuthor?.[0] || cat.name?.[0] || '?').toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs truncate" style={{ color: 'var(--color-text)' }}>{cat.lastThreadTitle || '--'}</p>
                      <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                        {cat.lastAuthor ? `${t('home.by')} ${cat.lastAuthor}` : ''} {formatTime(cat.lastActivity)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs md:hidden" style={{ color: 'var(--color-text-muted)' }}>
                    <span>{cat.threadCount ?? 0}t</span>
                    <span>{cat.postCount ?? 0}p</span>
                    <span><Clock size={10} className="inline" /> {formatTime(cat.lastActivity)}</span>
                  </div>
                </div>
              </Link>
            </motion.div>
            );
          })}
        </motion.div>
      ) : (
        /* ── Default card grid layout ── */
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {list.map((cat) => {
            const isCatFresh = freshCatIds.has(cat.id);
            return (
            <motion.div key={cat.id} variants={item}>
              <Link to={`/c/${cat.id}`}>
                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="glass-card cursor-pointer hover:neon-border"
                  style={{
                    boxShadow: isCatFresh ? '0 0 12px rgba(0, 255, 136, 0.15)' : undefined,
                    borderColor: isCatFresh ? 'var(--color-success)' : undefined,
                    transition: 'box-shadow 0.6s ease, border-color 0.6s ease',
                  }}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-background)' }}
                    >
                      <Folder size={20} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-base truncate">{cat.name}</h3>
                      {cat.description && (
                        <p className="text-sm mt-0.5 line-clamp-2" style={{ color: 'var(--color-text-muted)' }}>{cat.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    <span className="flex items-center gap-1"><FileText size={12} />{cat.threadCount ?? 0} {t('home.threads')}</span>
                    <span className="flex items-center gap-1"><MessageSquare size={12} />{cat.postCount ?? 0} {t('home.posts')}</span>
                    <span className="flex items-center gap-1"><Clock size={12} />{formatTime(cat.lastActivity)}</span>
                    <span onClick={e => e.preventDefault()}>
                      <BlockchainInfo entityType="category" entityId={cat.id} />
                    </span>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Share Forum Modal */}
      <AnimatePresence>
        {showShare && forumInfo && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/60" onClick={() => setShowShare(false)} />
            <motion.div
              className="relative p-6 rounded-xl max-w-lg mx-4 w-full border"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                borderRadius: 'var(--border-radius)',
                background: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
                  <Share2 size={20} style={{ color: 'var(--color-primary)' }} />
                  {t('home.shareTitle')}
                </h3>
                <button onClick={() => setShowShare(false)} className="p-1 rounded-lg hover:bg-white/10">
                  <X size={18} style={{ color: 'var(--color-text-muted)' }} />
                </button>
              </div>

              <p className="mb-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                {t('home.shareDesc')}
              </p>

              {/* Connection string */}
              <div className="mb-4">
                <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                  {t('home.connectionString')}
                </label>
                <div className="flex items-center gap-2">
                  <code
                    className="flex-1 p-3 rounded-lg text-sm font-mono break-all"
                    style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-success)' }}
                  >
                    {forumInfo.connectionString}
                  </code>
                  <button
                    onClick={() => { navigator.clipboard.writeText(forumInfo.connectionString); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                    className="p-2 rounded-lg transition-all shrink-0"
                    style={{ backgroundColor: copied ? 'rgba(0,255,136,0.15)' : 'var(--color-surface)' }}
                  >
                    {copied ? <CheckCircle size={16} style={{ color: 'var(--color-success)' }} /> : <Copy size={16} style={{ color: 'var(--color-primary)' }} />}
                  </button>
                </div>
              </div>

              {/* Move contract info or legacy address */}
              {forumInfo.moveMode ? (
                <div className="mb-4 space-y-2">
                  <div>
                    <label className="text-xs font-medium block mb-1" style={{ color: 'var(--color-text-muted)' }}>
                      {t('home.packageId')}
                    </label>
                    <code className="block p-2 rounded-lg text-xs font-mono break-all"
                      style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-primary)' }}>
                      {forumInfo.packageId}
                    </code>
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1" style={{ color: 'var(--color-text-muted)' }}>
                      {t('home.forumObjectId')}
                    </label>
                    <code className="block p-2 rounded-lg text-xs font-mono break-all"
                      style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-primary)' }}>
                      {forumInfo.forumObjectId}
                    </code>
                  </div>
                </div>
              ) : (
                <div className="mb-4">
                  <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                    {t('home.walletAddress')}
                  </label>
                  <code className="block p-3 rounded-lg text-xs font-mono break-all"
                    style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-primary)' }}>
                    {forumInfo.address}
                  </code>
                </div>
              )}

              {/* Network + Explorer */}
              <div className="flex items-center justify-between mb-5">
                <span className="text-xs flex items-center gap-1.5" style={{ color: 'var(--color-text-muted)' }}>
                  <Globe size={12} />
                  {t('home.network')}: <strong style={{ color: 'var(--color-text)' }}>{forumInfo.network}</strong>
                  {forumInfo.moveMode && <span className="ml-1 px-1.5 py-0.5 rounded text-[10px]"
                    style={{ backgroundColor: 'rgba(0,240,255,0.15)', color: 'var(--color-primary)' }}>Move</span>}
                </span>
                {forumInfo.explorerUrl && forumInfo.address && (
                  <a
                    href={`${forumInfo.explorerUrl}/address/${forumInfo.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs flex items-center gap-1"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    <ExternalLink size={12} />
                    {t('home.viewOnExplorer')}
                  </a>
                )}
              </div>

              {/* Guide */}
              <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-background)', borderRadius: 'var(--border-radius)' }}>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                  <Shield size={14} style={{ color: 'var(--color-primary)' }} />
                  {t('home.howToConnect')}
                </h4>
                <ol className="text-xs space-y-1.5 list-decimal list-inside" style={{ color: 'var(--color-text-muted)' }}>
                  <li>{t('home.step1')}</li>
                  <li>{t('home.step2')} <code style={{ color: 'var(--color-text)' }}>npm run dev</code></li>
                  <li>{t('home.step3')} <strong style={{ color: 'var(--color-text)' }}>"{t('home.step3bold')}"</strong></li>
                  <li>{t('home.step4')} <code style={{ color: 'var(--color-success)' }}>{forumInfo.connectionString?.substring(0, 40)}...</code></li>
                  <li>{t('home.step5')}</li>
                  <li>{t('home.step6')}</li>
                </ol>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
