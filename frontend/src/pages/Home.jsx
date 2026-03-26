import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Folder, MessageSquare, FileText, Clock, Plus } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { useIdentity } from '../hooks/useIdentity';
import { api } from '../api/endpoints';
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

  return (
    <div className="max-w-4xl mx-auto">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl md:text-3xl font-bold mb-6 neon-text"
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        Categories
      </motion.h1>

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
                  className="flex flex-wrap gap-4 text-xs"
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
                </div>
              </motion.div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
