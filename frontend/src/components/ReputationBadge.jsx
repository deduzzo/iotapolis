import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, StarHalf, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function getStars(rating) {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.25 && rating - fullStars < 0.75;
  const roundUp = rating - fullStars >= 0.75;

  for (let i = 0; i < (roundUp ? fullStars + 1 : fullStars); i++) {
    stars.push('full');
  }
  if (hasHalf) stars.push('half');
  while (stars.length < 5) stars.push('empty');
  return stars.slice(0, 5);
}

function getRatingColor(rating) {
  if (rating === null || rating === undefined) return 'var(--color-text-muted)';
  if (rating >= 4) return 'var(--color-success)';
  if (rating >= 3) return 'var(--color-warning)';
  return 'var(--color-danger)';
}

export default function ReputationBadge({ userId, reputation }) {
  const { t } = useTranslation();
  const [showTooltip, setShowTooltip] = useState(false);

  const totalTrades = reputation?.totalTrades || 0;
  const ratingCount = reputation?.ratingCount || 0;
  const ratingSum = reputation?.ratingSum || 0;
  const avgRating = ratingCount > 0 ? ratingSum / ratingCount : null;
  const successfulTrades = reputation?.successful || 0;
  const disputesWon = reputation?.disputesWon || 0;
  const disputesLost = reputation?.disputesLost || 0;
  const totalVolume = reputation?.totalVolume || 0;

  const color = getRatingColor(avgRating);
  const stars = avgRating !== null ? getStars(avgRating) : [];

  if (totalTrades === 0 && ratingCount === 0) {
    return (
      <span
        className="inline-flex items-center gap-1 text-[11px]"
        style={{ color: 'var(--color-text-muted)' }}
      >
        <Star size={10} />
        {t('reputation.noTrades')}
      </span>
    );
  }

  return (
    <div
      className="relative inline-flex items-center gap-1"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Stars */}
      <div className="flex items-center gap-px">
        {stars.map((type, i) => {
          if (type === 'full') {
            return <Star key={i} size={11} fill={color} style={{ color }} />;
          }
          if (type === 'half') {
            return <StarHalf key={i} size={11} fill={color} style={{ color }} />;
          }
          return <Star key={i} size={11} style={{ color: 'var(--color-text-muted)', opacity: 0.3 }} />;
        })}
      </div>

      {/* Trade count */}
      <span className="text-[10px] font-medium" style={{ color }}>
        ({totalTrades})
      </span>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full mt-1 z-50 w-52 p-3 rounded-xl text-xs pointer-events-none"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={14} style={{ color: 'var(--color-primary)' }} />
              <span className="font-semibold" style={{ color: 'var(--color-text)' }}>
                {t('reputation.stats')}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between">
                <span style={{ color: 'var(--color-text-muted)' }}>{t('reputation.avgRating')}</span>
                <span style={{ color }}>{avgRating !== null ? avgRating.toFixed(1) : '--'}/5</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--color-text-muted)' }}>{t('reputation.totalTrades')}</span>
                <span style={{ color: 'var(--color-text)' }}>{totalTrades}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--color-text-muted)' }}>{t('reputation.successRate')}</span>
                <span style={{ color: 'var(--color-success)' }}>
                  {totalTrades > 0 ? Math.round((successfulTrades / totalTrades) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--color-text-muted)' }}>{t('reputation.disputesWon')}</span>
                <span style={{ color: 'var(--color-text)' }}>{disputesWon}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--color-text-muted)' }}>{t('reputation.disputesLost')}</span>
                <span style={{ color: 'var(--color-text)' }}>{disputesLost}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--color-text-muted)' }}>{t('reputation.totalVolume')}</span>
                <span className="font-mono" style={{ color: 'var(--color-primary)' }}>
                  {totalVolume.toFixed(2)} IOTA
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
