import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Info, ExternalLink, Clock, Hash, Layers, Copy, CheckCircle, Loader2, X,
} from 'lucide-react';

/**
 * BlockchainInfo — shows on-chain transaction details for any entity.
 * Triggered by an (i) button. Opens a modal with TX history, digests, explorer links.
 *
 * Props:
 * - entityType: 'thread' | 'post' | 'category' | 'user' | 'config'
 * - entityId: the entity ID
 * - trigger: optional custom trigger element (defaults to info icon button)
 */

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="p-1 rounded transition-all hover:bg-white/10"
      title="Copia"
    >
      {copied ? <CheckCircle size={12} style={{ color: 'var(--color-success)' }} /> : <Copy size={12} style={{ color: 'var(--color-text-muted)' }} />}
    </button>
  );
}

export default function BlockchainInfo({ entityType, entityId, trigger }) {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [forumInfo, setForumInfo] = useState(null);

  // Map entityType to API endpoint
  const historyUrl = {
    thread: `/api/v1/thread/${entityId}/history`,
    post: `/api/v1/post/${entityId}/history`,
    user: `/api/v1/user/${entityId}/history`,
    category: `/api/v1/thread/${entityId}/history`, // categories don't have history yet — use generic
    config: `/api/v1/config/theme/history`,
  }[entityType];

  useEffect(() => {
    if (!open) return;
    setLoading(true);

    // Fetch forum info for explorer URL
    fetch('/api/v1/forum-info').then(r => r.json()).then(d => setForumInfo(d)).catch(() => {});

    // Fetch history
    if (historyUrl) {
      fetch(historyUrl)
        .then(r => r.json())
        .then(d => {
          const items = d.history || d.data || d.versions || [];
          setHistory(Array.isArray(items) ? items : []);
        })
        .catch(() => setHistory([]))
        .finally(() => setLoading(false));
    } else {
      setHistory([]);
      setLoading(false);
    }
  }, [open, historyUrl]);

  const explorerBase = forumInfo?.explorerUrl || 'https://explorer.rebased.iota.org';
  const network = forumInfo?.network || 'testnet';

  function getExplorerUrl(digest) {
    return `https://explorer.iota.org/txblock/${digest}?network=${network}`;
  }

  return (
    <>
      {/* Trigger button */}
      {trigger ? (
        <span onClick={() => setOpen(true)}>{trigger}</span>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="p-1.5 rounded-lg transition-all hover:bg-white/10"
          title="Info blockchain"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <Info size={14} />
        </button>
      )}

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
            <motion.div
              className="glass-card relative p-6 rounded-xl max-w-lg mx-4 w-full max-h-[80vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{ borderRadius: 'var(--border-radius)' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
                  <Layers size={20} style={{ color: 'var(--color-primary)' }} />
                  Blockchain Info
                </h3>
                <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-white/10">
                  <X size={18} style={{ color: 'var(--color-text-muted)' }} />
                </button>
              </div>

              {/* Entity info */}
              <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: 'var(--color-background)' }}>
                <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  <span className="px-2 py-0.5 rounded font-mono text-xs" style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-primary)' }}>
                    {entityType.toUpperCase()}
                  </span>
                  <code className="font-mono flex-1 truncate">{entityId}</code>
                  <CopyButton text={entityId} />
                </div>
              </div>

              {/* Wallet info */}
              {forumInfo?.address && (
                <div className="mb-4 p-3 rounded-lg text-xs" style={{ backgroundColor: 'var(--color-background)' }}>
                  <p style={{ color: 'var(--color-text-muted)' }}>Wallet pubblicante:</p>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="font-mono truncate" style={{ color: 'var(--color-text)' }}>{forumInfo.address}</code>
                    <CopyButton text={forumInfo.address} />
                    <a
                      href={`${explorerBase}/address/${forumInfo.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      <ExternalLink size={12} />
                    </a>
                  </div>
                  <p className="mt-1" style={{ color: 'var(--color-text-muted)' }}>
                    Network: {network}
                  </p>
                </div>
              )}

              {/* TX History */}
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                <Clock size={14} style={{ color: 'var(--color-primary)' }} />
                Transazioni on-chain
              </h4>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
                </div>
              ) : history && history.length > 0 ? (
                <div className="space-y-2">
                  {history.map((tx, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg text-xs"
                      style={{ backgroundColor: 'var(--color-background)' }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold" style={{ color: 'var(--color-text)' }}>
                          Versione {tx.version || tx.data?.version || i + 1}
                        </span>
                        <span style={{ color: 'var(--color-text-muted)' }}>
                          {tx.timestamp ? new Date(tx.timestamp).toLocaleString() : '--'}
                        </span>
                      </div>
                      {tx.digest && (
                        <div className="flex items-center gap-1 mt-1">
                          <Hash size={10} style={{ color: 'var(--color-text-muted)' }} />
                          <code className="font-mono truncate" style={{ color: 'var(--color-primary)' }}>{tx.digest}</code>
                          <CopyButton text={tx.digest} />
                          <a
                            href={getExplorerUrl(tx.digest)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-1"
                            style={{ color: 'var(--color-primary)' }}
                          >
                            <ExternalLink size={10} />
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  Nessuna transazione trovata per questa entita.
                  {entityType === 'category' && ' Le categorie non supportano ancora lo storico versioni.'}
                </p>
              )}

              {/* Legend */}
              <div className="mt-4 pt-3 border-t text-xs" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
                <p>Ogni dato e firmato crittograficamente dall'autore e pubblicato sulla blockchain IOTA 2.0. Le transazioni sono immutabili e verificabili da chiunque.</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
