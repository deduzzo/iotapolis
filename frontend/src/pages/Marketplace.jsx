import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Store, FileText, Briefcase, Award, Search,
  ShoppingCart, Users, Clock, Coins, Lock,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApi } from '../hooks/useApi';
import { useRealtimeUpdate } from '../hooks/useWebSocket';
import { useIdentity } from '../hooks/useIdentity';
import IdentityBadge from '../components/IdentityBadge';
import LoadingSpinner from '../components/LoadingSpinner';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const TABS = [
  { key: 'content', icon: FileText, label: 'marketplace.paidContent' },
  { key: 'services', icon: Briefcase, label: 'marketplace.services' },
  { key: 'badges', icon: Award, label: 'marketplace.badges' },
];

export default function Marketplace() {
  const { t } = useTranslation();
  const { identity } = useIdentity();
  const [activeTab, setActiveTab] = useState('content');
  const [searchQuery, setSearchQuery] = useState('');
  const [buyingBadgeId, setBuyingBadgeId] = useState(null);

  const { data, loading, error, setData, reload } = useApi(
    () => fetch('/api/v1/marketplace').then((r) => r.json()),
    [],
  );

  // Real-time updates
  useRealtimeUpdate(
    useCallback(
      (wsData) => {
        if (
          wsData.entity === 'purchase' ||
          wsData.entity === 'badge' ||
          wsData.entity === 'escrow'
        ) {
          reload();
        }
      },
      [reload],
    ),
    ['purchase', 'badge', 'escrow'],
  );

  const paidContent = data?.paidContent || [];
  const services = data?.services || [];
  const badges = data?.badges || [];

  // Filter by search
  const filterBySearch = (items, fields) => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter((item) =>
      fields.some((f) => (item[f] || '').toLowerCase().includes(q)),
    );
  };

  const filteredContent = filterBySearch(paidContent, ['title', 'authorName']);
  const filteredServices = filterBySearch(services, ['title', 'description', 'sellerName']);
  const filteredBadges = filterBySearch(badges, ['name', 'description']);

  async function handleBuyBadge(badgeId) {
    if (!identity || buyingBadgeId) return;
    setBuyingBadgeId(badgeId);
    try {
      const { useWallet } = await import('../hooks/useWallet');
      const wallet = useWallet();
      await wallet.purchaseBadge(badgeId);
      reload();
    } catch (err) {
      console.error('[Marketplace] Badge purchase failed:', err);
    } finally {
      setBuyingBadgeId(null);
    }
  }

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
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-3 neon-text"
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        <Store size={28} style={{ color: 'var(--color-primary)' }} />
        {t('marketplace.title')}
      </motion.h1>

      {/* Search bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
      >
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--color-text-muted)' }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('marketplace.search')}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border bg-transparent outline-none text-sm transition-colors"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
          />
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl" style={{ backgroundColor: 'var(--color-surface)' }}>
        {TABS.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <motion.button
              key={tab.key}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(tab.key)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: isActive ? 'var(--color-primary)' : 'transparent',
                color: isActive ? 'var(--color-background)' : 'var(--color-text-muted)',
              }}
            >
              <TabIcon size={16} />
              <span className="hidden sm:inline">{t(tab.label)}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {activeTab === 'content' && (
          <motion.div
            key="content"
            variants={container}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0 }}
          >
            {filteredContent.length === 0 ? (
              <EmptyState icon={FileText} message={t('marketplace.noContent')} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredContent.map((thread) => (
                  <motion.div key={thread.id} variants={item}>
                    <Link to={`/t/${thread.id}`}>
                      <motion.div
                        whileHover={{ scale: 1.02, y: -2 }}
                        className="glass-card cursor-pointer hover:neon-border"
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                            style={{ backgroundColor: 'rgba(255,170,0,0.15)' }}
                          >
                            <Lock size={18} style={{ color: 'var(--color-warning)' }} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-sm truncate" style={{ color: 'var(--color-text)' }}>
                              {thread.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <IdentityBadge
                                userId={thread.authorId}
                                username={thread.authorName}
                                showUsername={!!thread.authorName}
                                size="sm"
                                asLink={false}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span
                            className="font-mono text-sm font-bold"
                            style={{ color: 'var(--color-primary)' }}
                          >
                            {thread.price} IOTA
                          </span>
                          <span
                            className="flex items-center gap-1 text-[10px]"
                            style={{ color: 'var(--color-text-muted)' }}
                          >
                            <ShoppingCart size={10} />
                            {thread.purchaseCount || 0} {t('marketplace.purchases')}
                          </span>
                        </div>
                      </motion.div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'services' && (
          <motion.div
            key="services"
            variants={container}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0 }}
          >
            {filteredServices.length === 0 ? (
              <EmptyState icon={Briefcase} message={t('marketplace.noServices')} />
            ) : (
              <div className="space-y-3">
                {filteredServices.map((service) => (
                  <motion.div key={service.id} variants={item}>
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      className="glass-card cursor-pointer hover:neon-border"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
                          {service.title}
                        </h3>
                        <span
                          className="font-mono text-sm font-bold"
                          style={{ color: 'var(--color-primary)' }}
                        >
                          {service.price} IOTA
                        </span>
                      </div>
                      {service.description && (
                        <p className="text-xs mb-2 line-clamp-2" style={{ color: 'var(--color-text-muted)' }}>
                          {service.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <IdentityBadge
                          userId={service.sellerId}
                          username={service.sellerName}
                          showUsername={!!service.sellerName}
                          size="sm"
                          asLink={false}
                        />
                        <div className="flex items-center gap-3 text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                          <span className="flex items-center gap-1">
                            <Users size={10} />
                            {service.completedCount || 0} {t('marketplace.completed')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={10} />
                            {service.deliveryTime || '--'}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'badges' && (
          <motion.div
            key="badges"
            variants={container}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0 }}
          >
            {filteredBadges.length === 0 ? (
              <EmptyState icon={Award} message={t('marketplace.noBadges')} />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {filteredBadges.map((badge) => (
                  <motion.div key={badge.id} variants={item}>
                    <motion.div
                      whileHover={{ scale: 1.03, y: -2 }}
                      className="glass-card text-center"
                    >
                      <div className="text-3xl mb-2">{badge.icon || '🏆'}</div>
                      <h4 className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text)' }}>
                        {badge.name}
                      </h4>
                      {badge.description && (
                        <p className="text-[10px] mb-3 line-clamp-2" style={{ color: 'var(--color-text-muted)' }}>
                          {badge.description}
                        </p>
                      )}
                      <p className="font-mono text-sm font-bold mb-3" style={{ color: 'var(--color-primary)' }}>
                        {badge.price} IOTA
                      </p>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleBuyBadge(badge.id)}
                        disabled={!identity || buyingBadgeId === badge.id}
                        className="btn-primary w-full py-2 rounded-lg text-xs font-medium disabled:opacity-40"
                      >
                        {buyingBadgeId === badge.id ? t('marketplace.buying') : t('marketplace.buy')}
                      </motion.button>
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EmptyState({ icon: Icon, message }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-16 gap-3"
    >
      <Icon size={40} style={{ color: 'var(--color-text-muted)' }} />
      <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{message}</p>
    </motion.div>
  );
}
