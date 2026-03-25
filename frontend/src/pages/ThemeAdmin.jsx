import { motion } from 'framer-motion';
import {
  Shield,
  MessageSquare,
  Folder,
  Heart,
  Clock,
  User,
  ArrowLeft,
} from 'lucide-react';
import ThemeGallery from '../components/ThemeGallery';
import ThemeCustomizer from '../components/ThemeCustomizer';
import { useTheme } from '../hooks/useTheme';

/* ---------- Sample preview components ---------- */

function SampleCategoryCard() {
  return (
    <motion.div
      className="glass rounded-xl p-4 space-y-2"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-background)' }}
        >
          <Folder size={20} />
        </div>
        <div>
          <h4 className="font-semibold text-sm">General Discussion</h4>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Talk about anything IOTA related
          </p>
        </div>
      </div>
      <div className="flex gap-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>
        <span className="flex items-center gap-1"><MessageSquare size={12} /> 128 threads</span>
        <span className="flex items-center gap-1"><Clock size={12} /> 2 min ago</span>
      </div>
    </motion.div>
  );
}

function SampleThreadCard() {
  return (
    <motion.div
      className="rounded-xl p-4 space-y-2 border"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h4 className="font-semibold text-sm neon-text">
            How to set up an IOTA node in 2026?
          </h4>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Step-by-step guide for beginners...
          </p>
        </div>
        <span
          className="text-xs px-2 py-1 rounded-full"
          style={{ backgroundColor: 'var(--color-success)', color: 'var(--color-background)' }}
        >
          Pinned
        </span>
      </div>
      <div className="flex gap-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>
        <span className="flex items-center gap-1"><User size={12} /> satoshi_fan</span>
        <span className="flex items-center gap-1"><Heart size={12} /> 42</span>
        <span className="flex items-center gap-1"><MessageSquare size={12} /> 15 replies</span>
      </div>
    </motion.div>
  );
}

function SamplePostCard() {
  return (
    <motion.div
      className="rounded-xl p-4 border"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="flex gap-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-sm"
          style={{ backgroundColor: 'var(--color-secondary)', color: '#fff' }}
        >
          TN
        </div>
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">tangle_ninja</span>
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>3h ago</span>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text)' }}>
            Great question! First, make sure you have the latest Hornet version installed.
            The Shimmer network uses the same node software, so you can test there first.
          </p>
          <div className="flex gap-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            <button
              className="flex items-center gap-1 transition-colors cursor-pointer"
              style={{ color: 'var(--color-primary)' }}
            >
              <Heart size={12} /> Like
            </button>
            <button className="flex items-center gap-1 cursor-pointer">
              <MessageSquare size={12} /> Reply
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ---------- Main page ---------- */

export default function ThemeAdmin() {
  const { forumName } = useTheme();

  // TODO: Replace with real auth check
  // const { user } = useAuth();
  // if (!user || user.role !== 'admin') return <Navigate to="/" />;

  return (
    <div
      className="min-h-screen p-4 md:p-8"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      {/* Header */}
      <motion.div
        className="max-w-7xl mx-auto mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-4 mb-2">
          <button
            className="p-2 rounded-lg transition-colors cursor-pointer"
            style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-muted)' }}
            onClick={() => window.history.back()}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold neon-text" style={{ fontFamily: 'var(--font-heading)' }}>
              Theme Administration
            </h1>
            <p className="text-sm flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
              <Shield size={14} /> Admin-only area &mdash; Customize the look and feel of {forumName}
            </p>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto">
        {/* Main content: Gallery + Customizer */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          {/* Left: Gallery (1/3) */}
          <motion.div
            className="lg:w-1/3"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div
              className="glass rounded-2xl p-5 sticky top-8"
            >
              <ThemeGallery />
            </div>
          </motion.div>

          {/* Right: Customizer (2/3) */}
          <motion.div
            className="lg:w-2/3"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="glass rounded-2xl p-5">
              <ThemeCustomizer />
            </div>
          </motion.div>
        </div>

        {/* Bottom: Live Preview */}
        <motion.div
          className="glass rounded-2xl p-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2
            className="text-lg font-bold mb-4"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-primary)' }}
          >
            Live Preview
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
            See how your theme looks on real forum elements
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <span
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Category Card
              </span>
              <SampleCategoryCard />
            </div>
            <div className="space-y-2">
              <span
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Thread Card
              </span>
              <SampleThreadCard />
            </div>
            <div className="space-y-2">
              <span
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Post Card
              </span>
              <SamplePostCard />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
