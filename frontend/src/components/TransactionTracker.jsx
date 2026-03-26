import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle, XCircle, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useTransactions } from '../hooks/useTransactions';
import { useIdentity } from '../hooks/useIdentity';
import { useTranslation } from 'react-i18next';

const statusConfig = {
  signing: { icon: Loader2, color: 'var(--color-warning)', label: 'Firma in corso...' },
  submitted: { icon: Loader2, color: 'var(--color-primary)', label: 'Conferma blockchain...' },
  confirmed: { icon: CheckCircle, color: 'var(--color-success)', label: 'Confermata' },
  failed: { icon: XCircle, color: 'var(--color-danger)', label: 'Fallita' },
};

function formatElapsed(startedAt, completedAt) {
  const elapsed = (completedAt || Date.now()) - startedAt;
  if (elapsed < 1000) return '<1s';
  return `${Math.round(elapsed / 1000)}s`;
}

export default function TransactionTracker() {
  const { t } = useTranslation();
  const { transactions, pending } = useTransactions();
  const { forumConfig } = useIdentity();
  const [expanded, setExpanded] = useState(false);

  if (transactions.length === 0) return null;

  const explorerBase = forumConfig?.explorerUrl || 'https://explorer.rebased.iota.org';
  const network = forumConfig?.network || 'testnet';

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full" style={{ pointerEvents: 'auto' }}>
      <AnimatePresence>
        {/* Collapsed: show only the badge */}
        {!expanded && pending.length > 0 && (
          <motion.button
            key="badge"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            onClick={() => setExpanded(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border shadow-lg ml-auto"
            style={{
              background: 'var(--color-surface)',
              borderColor: 'var(--color-primary)',
              color: 'var(--color-text)',
              boxShadow: '0 0 20px rgba(0, 240, 255, 0.15)',
            }}
          >
            <Loader2 size={16} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
            <span className="text-sm font-medium">
              {pending.length} {pending.length === 1 ? 'transazione' : 'transazioni'} in corso...
            </span>
            <ChevronUp size={14} style={{ color: 'var(--color-text-muted)' }} />
          </motion.button>
        )}

        {/* Expanded panel */}
        {(expanded || (transactions.length > 0 && pending.length === 0)) && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="rounded-xl border shadow-xl overflow-hidden"
            style={{
              background: 'var(--color-background)',
              borderColor: 'var(--color-border)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-2.5 cursor-pointer"
              style={{ borderBottom: '1px solid var(--color-border)' }}
              onClick={() => setExpanded(!expanded)}
            >
              <div className="flex items-center gap-2">
                {pending.length > 0 && (
                  <Loader2 size={14} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
                )}
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
                  Transazioni {pending.length > 0 ? `(${pending.length} attive)` : ''}
                </span>
              </div>
              <ChevronDown size={14} style={{ color: 'var(--color-text-muted)' }} />
            </div>

            {/* Transaction list */}
            <div className="max-h-64 overflow-y-auto">
              {transactions.map(tx => {
                const cfg = statusConfig[tx.status] || statusConfig.submitted;
                const Icon = cfg.icon;
                const isSpinning = tx.status === 'signing' || tx.status === 'submitted';

                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 px-4 py-2.5"
                    style={{ borderBottom: '1px solid var(--color-border)' }}
                  >
                    <Icon
                      size={18}
                      className={isSpinning ? 'animate-spin shrink-0' : 'shrink-0'}
                      style={{ color: cfg.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{tx.label}</p>
                      <div className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                        <span style={{ color: cfg.color }}>{cfg.label}</span>
                        <span>{formatElapsed(tx.startedAt, tx.completedAt)}</span>
                        {tx.tag && <span className="opacity-60">{tx.tag}</span>}
                      </div>
                      {tx.error && (
                        <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--color-danger)' }}>
                          {tx.error}
                        </p>
                      )}
                    </div>
                    {tx.digest && (
                      <a
                        href={`${explorerBase}/txblock/${tx.digest}?network=${network}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 p-1 rounded hover:bg-white/5 transition-colors"
                        title="Vedi su Explorer"
                      >
                        <ExternalLink size={14} style={{ color: 'var(--color-primary)' }} />
                      </a>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
