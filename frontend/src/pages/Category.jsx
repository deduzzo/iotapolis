import { useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, ChevronLeft, ChevronRight, Home } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { useRealtimeUpdate } from '../hooks/useWebSocket';
import { api } from '../api/endpoints';
import { useIdentity } from '../hooks/useIdentity';
import ThreadList from '../components/ThreadList';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Category() {
  const { id } = useParams();
  const { identity } = useIdentity();
  const [page, setPage] = useState(1);

  // Nessun realtimeEntities — gestiamo granularmente
  const { data, loading, error, setData } = useApi(
    () => api.getThreads(id, page),
    [id, page],
  );

  // IDs di thread appena aggiornati (per highlight)
  const [freshThreadIds, setFreshThreadIds] = useState(new Set());

  const markThreadFresh = useCallback((threadId) => {
    setFreshThreadIds((prev) => new Set(prev).add(threadId));
    setTimeout(() => {
      setFreshThreadIds((prev) => {
        const next = new Set(prev);
        next.delete(threadId);
        return next;
      });
    }, 3000);
  }, []);

  // WebSocket: aggiornamenti granulari
  useRealtimeUpdate(
    useCallback(
      (wsData) => {
        // Nuovo post in un thread di questa categoria
        if (wsData.action === 'postCreated' && wsData.threadId) {
          setData((prev) => {
            if (!prev) return prev;
            const threads = Array.isArray(prev) ? prev : prev?.threads || prev?.data || [];
            const idx = threads.findIndex((t) => t.id === wsData.threadId);
            if (idx === -1) return prev;

            const updated = [...threads];
            updated[idx] = {
              ...updated[idx],
              postCount: (updated[idx].postCount || 0) + 1,
              lastActivity: Date.now(),
              lastPostAt: Date.now(),
            };

            markThreadFresh(wsData.threadId);

            if (Array.isArray(prev)) return updated;
            if (prev.threads) return { ...prev, threads: updated };
            return { ...prev, data: updated };
          });
        }

        // Nuovo thread in questa categoria
        if (wsData.action === 'threadCreated' && wsData.categoryId === id) {
          // Fetch la lista aggiornata
          api.getThreads(id, page).then((fresh) => {
            if (fresh) {
              setData(fresh);
              if (wsData.threadId) markThreadFresh(wsData.threadId);
            }
          });
        }

        // Thread modificato
        if (
          (wsData.action === 'threadEdited' || wsData.action === 'threadModerated') &&
          wsData.threadId
        ) {
          api.getThreads(id, page).then((fresh) => {
            if (fresh) {
              setData(fresh);
              markThreadFresh(wsData.threadId);
            }
          });
        }
      },
      [id, page, setData, markThreadFresh],
    ),
    ['post', 'thread'],
  );

  const threads = Array.isArray(data) ? data : data?.threads || data?.data || [];
  const totalPages = data?.totalPages ?? 1;
  const categoryName = data?.categoryName ?? threads[0]?.categoryName ?? 'Category';

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

  return (
    <div className="max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
        <Link to="/" className="flex items-center gap-1 hover:underline" style={{ color: 'var(--color-primary)' }}>
          <Home size={14} />
          Home
        </Link>
        <span>/</span>
        <span>{categoryName}</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl md:text-3xl font-bold neon-text"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          {categoryName}
        </motion.h1>

        {identity && (
          <Link to={`/c/${id}/new`}>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="btn-primary flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
            >
              <Plus size={16} />
              New Thread
            </motion.button>
          </Link>
        )}
      </div>

      {/* Thread list */}
      <ThreadList threads={threads} freshThreadIds={freshThreadIds} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="flex items-center gap-1 px-3 py-2 rounded-xl border text-sm transition-colors disabled:opacity-30"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
          >
            <ChevronLeft size={16} />
            Prev
          </motion.button>
          <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Page {page} of {totalPages}
          </span>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="flex items-center gap-1 px-3 py-2 rounded-xl border text-sm transition-colors disabled:opacity-30"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
          >
            Next
            <ChevronRight size={16} />
          </motion.button>
        </div>
      )}
    </div>
  );
}
