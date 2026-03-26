import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Sparkles, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useIdentity } from '../hooks/useIdentity';

const PRESET_AMOUNTS = [0.1, 0.5, 1.0];

export default function TipButton({ postId, authorId, tipCount = 0, totalTips = 0 }) {
  const { t } = useTranslation();
  const { identity } = useIdentity();
  const [open, setOpen] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [sending, setSending] = useState(false);
  const [showSparkle, setShowSparkle] = useState(false);
  const [localTipCount, setLocalTipCount] = useState(tipCount);
  const [localTotalTips, setLocalTotalTips] = useState(totalTips);
  const popoverRef = useRef(null);

  const isOwnPost = identity?.userId === authorId;
  const isDisabled = !identity || isOwnPost;

  // Close popover on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  async function handleTip(amount) {
    if (!amount || amount <= 0 || sending) return;
    setSending(true);
    try {
      // useWallet hook will be built by another agent
      const { useWallet } = await import('../hooks/useWallet');
      const wallet = useWallet();
      await wallet.tip(postId, authorId, amount);

      // Optimistic update
      setLocalTipCount((c) => c + 1);
      setLocalTotalTips((t) => t + amount);
      setOpen(false);

      // Sparkle animation
      setShowSparkle(true);
      setTimeout(() => setShowSparkle(false), 1500);
    } catch (err) {
      console.error('[TipButton] Tip failed:', err);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="relative inline-flex items-center" ref={popoverRef}>
      <motion.button
        whileHover={isDisabled ? {} : { scale: 1.05 }}
        whileTap={isDisabled ? {} : { scale: 0.95 }}
        onClick={() => !isDisabled && setOpen(!open)}
        disabled={isDisabled}
        className="flex items-center gap-1 text-xs transition-colors relative"
        style={{
          color: isDisabled ? 'var(--color-text-muted)' : 'var(--color-warning)',
          opacity: isDisabled ? 0.5 : 1,
          cursor: isDisabled ? 'default' : 'pointer',
        }}
        title={isOwnPost ? t('tip.cannotTipSelf') : !identity ? t('tip.loginRequired') : t('tip.sendTip')}
      >
        <Coins size={14} />
        <span>{t('tip.tip')}</span>
        {localTipCount > 0 && (
          <span
            className="ml-0.5 px-1.5 py-0 rounded-full text-[10px] font-medium"
            style={{
              backgroundColor: 'rgba(255,170,0,0.15)',
              color: 'var(--color-warning)',
            }}
          >
            {localTipCount}
          </span>
        )}

        {/* Sparkle animation */}
        <AnimatePresence>
          {showSparkle && (
            <motion.div
              initial={{ opacity: 1, scale: 0.5, y: 0 }}
              animate={{ opacity: 0, scale: 1.5, y: -20 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="absolute -top-2 left-1/2 -translate-x-1/2 pointer-events-none"
            >
              <Sparkles size={16} style={{ color: 'var(--color-warning)' }} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Popover */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full mt-2 z-50 w-56 rounded-xl border p-3 shadow-lg"
            style={{
              background: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
              boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
                {t('tip.sendTip')}
              </span>
              <button
                onClick={() => setOpen(false)}
                className="p-0.5 rounded hover:bg-white/10"
              >
                <X size={12} style={{ color: 'var(--color-text-muted)' }} />
              </button>
            </div>

            {/* Preset amounts */}
            <div className="flex gap-2 mb-2">
              {PRESET_AMOUNTS.map((amount) => (
                <motion.button
                  key={amount}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleTip(amount)}
                  disabled={sending}
                  className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-40"
                  style={{
                    backgroundColor: 'rgba(255,170,0,0.1)',
                    color: 'var(--color-warning)',
                    border: '1px solid rgba(255,170,0,0.2)',
                  }}
                >
                  {amount} IOTA
                </motion.button>
              ))}
            </div>

            {/* Custom amount */}
            <div className="flex gap-1.5">
              <input
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder={t('tip.customAmount')}
                min="0.01"
                step="0.01"
                className="flex-1 px-2 py-1.5 rounded-lg border bg-transparent outline-none text-xs"
                style={{
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text)',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
              />
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleTip(parseFloat(customAmount))}
                disabled={sending || !customAmount || parseFloat(customAmount) <= 0}
                className="btn-primary px-3 py-1.5 rounded-lg text-xs disabled:opacity-40"
              >
                {sending ? '...' : t('tip.send')}
              </motion.button>
            </div>

            {/* Total tips info */}
            {localTotalTips > 0 && (
              <div
                className="mt-2 pt-2 border-t text-[10px] text-center"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
              >
                {t('tip.totalReceived', { amount: localTotalTips.toFixed(2), count: localTipCount })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
