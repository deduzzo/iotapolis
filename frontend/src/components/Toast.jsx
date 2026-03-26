import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, XCircle, X, Info } from 'lucide-react';

const typeConfig = {
  success: { icon: CheckCircle, color: 'var(--color-success, #22c55e)', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)' },
  warning: { icon: AlertTriangle, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' },
  error: { icon: XCircle, color: 'var(--color-danger, #ff4444)', bg: 'rgba(255,68,68,0.12)', border: 'rgba(255,68,68,0.3)' },
  info: { icon: Info, color: 'var(--color-primary, #00f0ff)', bg: 'rgba(0,240,255,0.08)', border: 'rgba(0,240,255,0.2)' },
};

export default function Toast({ toasts, onDismiss }) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => {
          const cfg = typeConfig[t.type] || typeConfig.success;
          const Icon = cfg.icon;
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="rounded-xl px-4 py-3 flex items-center gap-3 min-w-[320px] max-w-[420px] border pointer-events-auto"
              style={{
                background: 'var(--color-background, #0f172a)',
                borderColor: cfg.border,
                boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${cfg.border}`,
              }}
            >
              <Icon size={18} style={{ color: cfg.color, flexShrink: 0 }} />
              <span className="text-sm flex-1" style={{ color: 'var(--color-text, #e2e8f0)' }}>
                {t.message}
              </span>
              <button
                onClick={() => onDismiss(t.id)}
                className="rounded p-1 transition-colors hover:bg-white/10 shrink-0"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
