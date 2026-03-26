import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Crown, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useIdentity } from '../hooks/useIdentity';
import LoadingSpinner from './LoadingSpinner';

const TIER_ICONS = {
  0: null,
  1: Zap,
  2: Crown,
};

const TIER_COLORS = {
  0: 'var(--color-text-muted)',
  1: 'var(--color-primary)',
  2: 'var(--color-warning)',
};

export default function PaywallGate({ requiredTier = 1, tierName, tierPrice, children }) {
  const { t } = useTranslation();
  const { identity } = useIdentity();
  const [subscribing, setSubscribing] = useState(false);
  const [hasAccess, setHasAccess] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check subscription status
  useState(() => {
    if (!identity) {
      setHasAccess(false);
      setLoading(false);
      return;
    }

    (async () => {
      try {
        // useWallet hook will provide subscription check — built by another agent
        const { useWallet } = await import('../hooks/useWallet');
        const wallet = useWallet();
        const sub = await wallet.checkSubscription(identity.userId);
        setHasAccess(sub && sub.tier >= requiredTier);
      } catch {
        // If wallet hook not available yet, default to no access
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    })();
  });

  if (loading) {
    return <LoadingSpinner size={24} className="min-h-[20vh]" />;
  }

  if (hasAccess) {
    return children;
  }

  const TierIcon = TIER_ICONS[requiredTier] || Crown;
  const tierColor = TIER_COLORS[requiredTier] || 'var(--color-primary)';

  async function handleSubscribe() {
    if (!identity || subscribing) return;
    setSubscribing(true);
    try {
      const { useWallet } = await import('../hooks/useWallet');
      const wallet = useWallet();
      await wallet.subscribe(requiredTier);
      setHasAccess(true);
    } catch (err) {
      console.error('[PaywallGate] Subscribe failed:', err);
    } finally {
      setSubscribing(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card text-center max-w-md mx-auto"
    >
      {/* Animated lock */}
      <motion.div
        animate={{
          boxShadow: [
            `0 0 20px ${tierColor}33`,
            `0 0 40px ${tierColor}55`,
            `0 0 20px ${tierColor}33`,
          ],
        }}
        transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
        className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5"
        style={{
          background: `linear-gradient(135deg, ${tierColor}, var(--color-secondary))`,
        }}
      >
        <Lock size={36} className="text-white" />
      </motion.div>

      <h3
        className="text-xl font-bold mb-2"
        style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}
      >
        {t('paywall.premiumContent')}
      </h3>

      <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
        {t('paywall.requiresTier', { tier: tierName || t(`paywall.tier${requiredTier}`) })}
      </p>

      {/* Tier info card */}
      <div
        className="rounded-xl p-4 mb-4 border"
        style={{
          borderColor: tierColor,
          backgroundColor: `${tierColor}10`,
        }}
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          {TierIcon && <TierIcon size={18} style={{ color: tierColor }} />}
          <span className="font-semibold" style={{ color: tierColor }}>
            {tierName || t(`paywall.tier${requiredTier}`)}
          </span>
        </div>
        {tierPrice !== undefined && (
          <p className="text-lg font-bold font-mono" style={{ color: 'var(--color-text)' }}>
            {tierPrice} IOTA<span className="text-xs font-normal" style={{ color: 'var(--color-text-muted)' }}>/{t('paywall.month')}</span>
          </p>
        )}
      </div>

      {identity ? (
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleSubscribe}
          disabled={subscribing}
          className="btn-primary w-full py-3 rounded-xl font-semibold disabled:opacity-40"
        >
          {subscribing ? t('paywall.subscribing') : t('paywall.subscribe')}
        </motion.button>
      ) : (
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {t('paywall.loginRequired')}
        </p>
      )}
    </motion.div>
  );
}
