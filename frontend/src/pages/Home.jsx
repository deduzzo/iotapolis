import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Folder, MessageSquare, FileText, Clock, Plus, Share2, Copy, CheckCircle, X, ExternalLink, Globe, Shield, AlertCircle } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { useIdentity } from '../hooks/useIdentity';
import { api } from '../api/endpoints';
import BlockchainInfo from '../components/BlockchainInfo';
import LoadingSpinner from '../components/LoadingSpinner';

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
  const { identity } = useIdentity();
  const { data: categories, loading, error } = useApi(
    () => api.getCategories(),
    [],
    ['category'],
  );
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
            Smart Contract non deployato
          </h2>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Per usare il forum devi prima deployare lo smart contract Move sulla blockchain IOTA.
          </p>
        </div>
        <div className="glass-card p-4 rounded-xl w-full text-left" style={{ borderRadius: 'var(--border-radius)' }}>
          <p className="text-sm font-medium mb-2">Esegui nel terminale:</p>
          <code className="block p-3 rounded-lg text-sm font-mono" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-primary)' }}>
            npm run move:deploy
          </code>
          <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
            Poi riavvia il server con <code style={{ color: 'var(--color-text)' }}>npm run dev</code>
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
          Nessuna categoria
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
            Crea la prima categoria
          </Link>
        ) : (
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Un amministratore deve creare la prima categoria.
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
          Categories
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
            <span className="hidden sm:inline">Condividi Forum</span>
          </motion.button>
        )}
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {list.map((cat) => (
          <motion.div key={cat.id} variants={item}>
            <Link to={`/c/${cat.id}`}>
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                className="glass-card cursor-pointer hover:neon-border transition-shadow"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: 'var(--color-primary)',
                      color: 'var(--color-background)',
                    }}
                  >
                    <Folder size={20} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-base truncate">{cat.name}</h3>
                    {cat.description && (
                      <p
                        className="text-sm mt-0.5 line-clamp-2"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        {cat.description}
                      </p>
                    )}
                  </div>
                </div>

                <div
                  className="flex flex-wrap items-center gap-4 text-xs"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  <span className="flex items-center gap-1">
                    <FileText size={12} />
                    {cat.threadCount ?? 0} threads
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare size={12} />
                    {cat.postCount ?? 0} posts
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {formatTime(cat.lastActivity)}
                  </span>
                  <span onClick={e => e.preventDefault()}>
                    <BlockchainInfo entityType="category" entityId={cat.id} />
                  </span>
                </div>
              </motion.div>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* Share Forum Modal */}
      <AnimatePresence>
        {showShare && forumInfo && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/60" onClick={() => setShowShare(false)} />
            <motion.div
              className="glass-card relative p-6 rounded-xl max-w-lg mx-4 w-full"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{ borderRadius: 'var(--border-radius)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
                  <Share2 size={20} style={{ color: 'var(--color-primary)' }} />
                  Condividi questo forum
                </h3>
                <button onClick={() => setShowShare(false)} className="p-1 rounded-lg hover:bg-white/10">
                  <X size={18} style={{ color: 'var(--color-text-muted)' }} />
                </button>
              </div>

              <p className="mb-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Chiunque puo collegarsi a questo forum con le informazioni qui sotto. I dati sono pubblici sulla blockchain IOTA.
              </p>

              {/* Connection string */}
              <div className="mb-4">
                <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                  Stringa di connessione
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
                      Package ID (Smart Contract)
                    </label>
                    <code className="block p-2 rounded-lg text-xs font-mono break-all"
                      style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-primary)' }}>
                      {forumInfo.packageId}
                    </code>
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1" style={{ color: 'var(--color-text-muted)' }}>
                      Forum Object ID
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
                    Indirizzo wallet IOTA
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
                  Network: <strong style={{ color: 'var(--color-text)' }}>{forumInfo.network}</strong>
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
                    Vedi su Explorer
                  </a>
                )}
              </div>

              {/* Guide */}
              <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-background)', borderRadius: 'var(--border-radius)' }}>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                  <Shield size={14} style={{ color: 'var(--color-primary)' }} />
                  Come collegarsi
                </h4>
                <ol className="text-xs space-y-1.5 list-decimal list-inside" style={{ color: 'var(--color-text-muted)' }}>
                  <li>L'utente installa il progetto IOTA Free Forum sul proprio PC</li>
                  <li>Avvia il server con <code style={{ color: 'var(--color-text)' }}>npm run dev</code></li>
                  <li>Alla schermata di setup, sceglie <strong style={{ color: 'var(--color-text)' }}>"Collegati a un forum esistente"</strong></li>
                  <li>Incolla la stringa di connessione: <code style={{ color: 'var(--color-success)' }}>{forumInfo.connectionString?.substring(0, 40)}...</code></li>
                  <li>Il sistema si collega allo smart contract e scarica tutti gli eventi</li>
                  <li>Registra la propria identita e interagisce direttamente con la blockchain</li>
                </ol>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
