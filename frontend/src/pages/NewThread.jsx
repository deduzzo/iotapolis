import { useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Send, Lock, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useIdentity } from '../hooks/useIdentity';
import { useRealtimeUpdate } from '../hooks/useWebSocket';
import { useToast } from '../components/Layout';
import RichEditor from '../components/RichEditor';

export default function NewThread() {
  const { t } = useTranslation();
  const { id: categoryId } = useParams();
  const navigate = useNavigate();
  const { identity, postEvent } = useIdentity();
  const { addToast } = useToast();
  const pendingThreadRef = useRef(null);

  // Listen for WebSocket: when backend indexes our thread, navigate to it
  useRealtimeUpdate(
    useCallback((wsData) => {
      if (pendingThreadRef.current && wsData.entityId === pendingThreadRef.current) {
        const threadId = pendingThreadRef.current;
        pendingThreadRef.current = null;
        addToast(t('newThread.threadReady', 'Thread pubblicato on-chain!'), 'success');
        navigate(`/t/${threadId}`);
      }
    }, [navigate, addToast, t]),
    ['thread'],
  );

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [encrypted, setEncrypted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!identity) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="glass-card text-center">
          <p style={{ color: 'var(--color-text-muted)' }}>
            {t('newThread.needIdentity')}
          </p>
          <Link
            to="/identity"
            className="inline-block mt-3 text-sm underline"
            style={{ color: 'var(--color-primary)' }}
          >
            {t('newThread.generateIdentity')}
          </Link>
        </div>
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError(t('newThread.titleRequired'));
      return;
    }
    if (!content.trim()) {
      setError(t('newThread.contentRequired'));
      return;
    }

    setSubmitting(true);
    try {
      const threadId = `THR_${Date.now().toString(36).toUpperCase()}`;
      const result = await postEvent('FORUM_THREAD', threadId, {
        id: threadId,
        title: title.trim(),
        content: content.trim(),
        categoryId,
        encrypted,
        createdAt: Date.now(),
      }, 1);

      if (result.effects?.status?.status !== 'success') {
        throw new Error('Failed to create thread');
      }

      // Set pending — WebSocket listener will navigate when backend indexes it
      pendingThreadRef.current = threadId;
      // Fallback: navigate after 60s even if no WS event
      setTimeout(() => {
        if (pendingThreadRef.current === threadId) {
          pendingThreadRef.current = null;
          navigate(`/t/${threadId}`);
        }
      }, 60000);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <nav
        className="flex items-center gap-2 text-sm mb-4"
        style={{ color: 'var(--color-text-muted)' }}
      >
        <Link
          to="/"
          className="flex items-center gap-1 hover:underline"
          style={{ color: 'var(--color-primary)' }}
        >
          <Home size={14} />
          {t('common.home')}
        </Link>
        <span>/</span>
        <Link
          to={`/c/${categoryId}`}
          className="hover:underline"
          style={{ color: 'var(--color-primary)' }}
        >
          {t('common.category')}
        </Link>
        <span>/</span>
        <span>{t('newThread.title')}</span>
      </nav>

      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold mb-6 neon-text"
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        {t('newThread.title')}
      </motion.h1>

      <form onSubmit={handleSubmit}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Title */}
          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {t('newThread.titleLabel')}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('newThread.titlePlaceholder')}
              maxLength={200}
              className="w-full px-4 py-3 rounded-xl border bg-transparent outline-none text-base transition-colors"
              style={{
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
            />
          </div>

          {/* Content */}
          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {t('newThread.contentLabel')}
            </label>
            <RichEditor
              value={content}
              onChange={setContent}
              placeholder={t('newThread.contentPlaceholder')}
              minHeight="200px"
            />
          </div>

          {/* Encryption toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={encrypted}
                onChange={(e) => setEncrypted(e.target.checked)}
                className="sr-only"
              />
              <div
                className="w-10 h-5 rounded-full transition-colors"
                style={{
                  backgroundColor: encrypted
                    ? 'var(--color-primary)'
                    : 'var(--color-border)',
                }}
              >
                <motion.div
                  animate={{ x: encrypted ? 20 : 2 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="w-4 h-4 rounded-full bg-white mt-0.5"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Lock size={14} style={{ color: 'var(--color-text-muted)' }} />
              <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                {t('newThread.encrypt')}
              </span>
            </div>
          </label>

          {/* Error */}
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm"
              style={{ color: 'var(--color-danger)' }}
            >
              {error}
            </motion.p>
          )}

          {/* Submit */}
          <div className="flex justify-end pt-2">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={submitting}
              className="btn-primary flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold disabled:opacity-40"
            >
              <Send size={16} />
              {submitting ? t('newThread.creating') : t('newThread.createThread')}
            </motion.button>
          </div>
        </motion.div>
      </form>
    </div>
  );
}
