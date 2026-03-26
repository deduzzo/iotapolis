import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown, Zap, Star, Check, Clock, RefreshCw, FileText,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApi } from '../hooks/useApi';
import { useRealtimeUpdate } from '../hooks/useWebSocket';
import { useIdentity } from '../hooks/useIdentity';
import { api } from '../api/endpoints';
import LoadingSpinner from '../components/LoadingSpinner';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const TIER_CONFIG = {
  0: { icon: Star, color: 'var(--color-text-muted)', gradient: 'linear-gradient(135deg, #666, #888)' },
  1: { icon: Zap, color: 'var(--color-primary)', gradient: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' },
  2: { icon: Crown, color: 'var(--color-warning)', gradient: 'linear-gradient(135deg, #f59e0b, #f97316)' },
};

function formatCountdown(expiresAt) {
  if (!expiresAt) return '--';
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h ${Math.floor((diff % 3600000) / 60000)}m`;
}

function formatDate(dateStr) {
  if (!dateStr) return '--';
  return new Date(dateStr).toLocaleDateString();
}

export default function Subscription() {
  const { t } = useTranslation();
  const { identity, signAndSend } = useIdentity();
  const [subscribingTier, setSubscribingTier] = useState(null);

  const { data, loading, error, reload } = useApi(
    () => identity?.userId
      ? api.getSubscriptionStatus(identity.userId).catch(() => null)
      : Promise.resolve(null),
    [identity?.userId],
  );

  // Real-time updates
  useRealtimeUpdate(
    useCallback(
      (wsData) => {
        if (wsData.entity === 'subscription') {
          reload();
        }
      },
      [reload],
    ),
    ['subscription'],
  );

  const currentSub = data?.subscription || null;
  const tiers = data?.tiers || [
    {
      tier: 0,
      name: t('subscription.tierFree'),
      price: 0,
      features: [
        t('subscription.featureRead'),
        t('subscription.featureBasicPosts'),
        t('subscription.featureLimitedCategories'),
      ],
    },
    {
      tier: 1,
      name: t('subscription.tierPro'),
      price: 1,
      features: [
        t('subscription.featureAllCategories'),
        t('subscription.featurePremiumThreads'),
        t('subscription.featureProBadge'),
        t('subscription.featurePrioritySupport'),
      ],
    },
    {
      tier: 2,
      name: t('subscription.tierPremium'),
      price: 5,
      features: [
        t('subscription.featureEverythingPro'),
        t('subscription.featureMarketplaceSeller'),
        t('subscription.featureVipSections'),
        t('subscription.featurePremiumBadge'),
        t('subscription.featureCustomTitle'),
      ],
    },
  ];
  const billingHistory = data?.billingHistory || [];

  async function handleSubscribe(tier) {
    if (!identity || subscribingTier !== null) return;
    setSubscribingTier(tier);
    try {
      await signAndSend('/api/v1/subscribe', 'POST', { tier });
      reload();
    } catch (err) {
      console.error('[Subscription] Subscribe failed:', err);
    } finally {
      setSubscribingTier(null);
    }
  }

  if (!identity) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <Crown size={48} style={{ color: 'var(--color-text-muted)' }} />
        <p style={{ color: 'var(--color-text-muted)' }}>{t('subscription.loginRequired')}</p>
      </div>
    );
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

  const currentTier = currentSub?.tier ?? 0;

  return (
    <div className="max-w-4xl mx-auto">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-3 neon-text"
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        <Crown size={28} style={{ color: 'var(--color-warning)' }} />
        {t('subscription.title')}
      </motion.h1>

      {/* Current plan */}
      {currentSub && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {(() => {
                const config = TIER_CONFIG[currentSub.tier] || TIER_CONFIG[0];
                const TierIcon = config.icon;
                return (
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: config.gradient }}
                  >
                    <TierIcon size={24} className="text-white" />
                  </div>
                );
              })()}
              <div>
                <p className="font-semibold" style={{ color: 'var(--color-text)' }}>
                  {currentSub.tierName || t(`subscription.tier${currentSub.tier === 1 ? 'Pro' : currentSub.tier === 2 ? 'Premium' : 'Free'}`)}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {t('subscription.currentPlan')}
                </p>
              </div>
            </div>
            {currentSub.expiresAt && (
              <div className="text-right">
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {t('subscription.expiresIn')}
                </p>
                <p className="text-sm font-mono font-medium flex items-center gap-1" style={{ color: 'var(--color-warning)' }}>
                  <Clock size={12} />
                  {formatCountdown(currentSub.expiresAt)}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Tier cards */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
      >
        {tiers.map((tierData) => {
          const config = TIER_CONFIG[tierData.tier] || TIER_CONFIG[0];
          const TierIcon = config.icon;
          const isCurrent = tierData.tier === currentTier;
          const isUpgrade = tierData.tier > currentTier;
          const isDowngrade = tierData.tier < currentTier;

          return (
            <motion.div
              key={tierData.tier}
              variants={item}
              whileHover={{ y: -4 }}
              className="glass-card relative overflow-hidden"
              style={{
                borderColor: isCurrent ? config.color : undefined,
                boxShadow: isCurrent ? `0 0 20px ${config.color}30` : undefined,
              }}
            >
              {isCurrent && (
                <div
                  className="absolute top-0 right-0 px-3 py-1 rounded-bl-lg text-[10px] font-bold uppercase"
                  style={{ backgroundColor: config.color, color: 'var(--color-background)' }}
                >
                  {t('subscription.current')}
                </div>
              )}

              <div className="text-center mb-4">
                <motion.div
                  animate={isCurrent ? {
                    boxShadow: [
                      `0 0 15px ${config.color}33`,
                      `0 0 30px ${config.color}55`,
                      `0 0 15px ${config.color}33`,
                    ],
                  } : {}}
                  transition={{ repeat: Infinity, duration: 2.5 }}
                  className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: config.gradient }}
                >
                  <TierIcon size={28} className="text-white" />
                </motion.div>
                <h3 className="text-lg font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
                  {tierData.name}
                </h3>
                <div className="mt-1">
                  {tierData.price > 0 ? (
                    <p>
                      <span className="text-2xl font-bold font-mono" style={{ color: config.color }}>
                        {tierData.price}
                      </span>
                      <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                        {' '}IOTA/{t('subscription.month')}
                      </span>
                    </p>
                  ) : (
                    <p className="text-2xl font-bold" style={{ color: config.color }}>
                      {t('subscription.free')}
                    </p>
                  )}
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-2 mb-4">
                {(tierData.features || []).map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs">
                    <Check size={14} className="shrink-0 mt-0.5" style={{ color: config.color }} />
                    <span style={{ color: 'var(--color-text-muted)' }}>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Action button */}
              {tierData.price > 0 && (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleSubscribe(tierData.tier)}
                  disabled={subscribingTier !== null || (isCurrent && !currentSub?.expiresAt)}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40"
                  style={{
                    backgroundColor: isCurrent ? 'rgba(255,255,255,0.05)' : config.color,
                    color: isCurrent ? config.color : 'var(--color-background)',
                    border: isCurrent ? `1px solid ${config.color}` : 'none',
                  }}
                >
                  {subscribingTier === tierData.tier
                    ? t('subscription.processing')
                    : isCurrent
                      ? t('subscription.renew')
                      : isUpgrade
                        ? t('subscription.upgrade')
                        : t('subscription.subscribe')
                  }
                </motion.button>
              )}
            </motion.div>
          );
        })}
      </motion.div>

      {/* Billing history */}
      {billingHistory.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card"
        >
          <h3
            className="text-sm font-semibold uppercase tracking-wider mb-3 flex items-center gap-2"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <FileText size={14} />
            {t('subscription.billingHistory')}
          </h3>
          <div className="space-y-2">
            {billingHistory.map((entry, idx) => (
              <div
                key={entry.id || idx}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ backgroundColor: 'var(--color-background)' }}
              >
                <div>
                  <p className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>
                    {entry.tierName || t(`subscription.tier${entry.tier === 1 ? 'Pro' : 'Premium'}`)}
                  </p>
                  <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                    {formatDate(entry.createdAt)}
                  </p>
                </div>
                <span className="font-mono text-sm" style={{ color: 'var(--color-primary)' }}>
                  {entry.amount} IOTA
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
