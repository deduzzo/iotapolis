import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { History, Clock } from 'lucide-react';
import Modal from './Modal';
import LoadingSpinner from './LoadingSpinner';
import { useApi } from '../hooks/useApi';
import { api } from '../api/endpoints';

function formatDate(dateStr) {
  if (!dateStr) return '--';
  return new Date(dateStr).toLocaleString();
}

export default function EditHistory({ entityType, entityId, isOpen, onClose }) {
  const fetcher = useMemo(() => {
    if (entityType === 'post') return () => api.getPostHistory(entityId);
    if (entityType === 'thread') return () => api.getThreadHistory(entityId);
    return () => Promise.resolve([]);
  }, [entityType, entityId]);

  const { data, loading, error } = useApi(fetcher, [entityType, entityId]);

  const versions = Array.isArray(data) ? data : data?.history || data?.versions || [];
  // Most recent first
  const sorted = [...versions].sort(
    (a, b) => (b.version ?? 0) - (a.version ?? 0),
  );

  return (
    <Modal open={isOpen} onClose={onClose} title="Edit History" wide>
      {loading && <LoadingSpinner size={24} className="py-8" />}

      {error && (
        <p className="text-sm py-4" style={{ color: 'var(--color-danger)' }}>
          {error}
        </p>
      )}

      {!loading && !error && sorted.length === 0 && (
        <div className="flex flex-col items-center py-8 gap-2">
          <History size={32} style={{ color: 'var(--color-text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            No version history available
          </p>
        </div>
      )}

      {!loading && sorted.length > 0 && (
        <div className="space-y-4">
          {sorted.map((ver, idx) => (
            <motion.div
              key={ver.version ?? idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="rounded-xl p-4 border"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
              }}
            >
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: idx === 0 ? 'var(--color-primary)' : 'var(--color-surface-hover)',
                    color: idx === 0 ? 'var(--color-background)' : 'var(--color-text-muted)',
                  }}
                >
                  v{ver.version ?? idx + 1}
                  {idx === 0 && ' (current)'}
                </span>
                <span
                  className="flex items-center gap-1 text-xs"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  <Clock size={12} />
                  {formatDate(ver.timestamp || ver.data?.createdAt || ver.createdAt)}
                </span>
                {ver.digest && (
                  <span className="text-[10px] font-mono" style={{ color: 'var(--color-text-muted)' }}>
                    TX: {ver.digest.slice(0, 12)}...
                  </span>
                )}
              </div>
              <p
                className="text-sm line-clamp-4 whitespace-pre-wrap"
                style={{ color: 'var(--color-text)' }}
              >
                {ver.data?.content || ver.content || ver.data?.title || ver.title || '(empty)'}
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </Modal>
  );
}
