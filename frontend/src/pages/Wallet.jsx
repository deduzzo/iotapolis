import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet as WalletIcon, Copy, CheckCircle, Send, ArrowDownCircle,
  ArrowUpCircle, Clock, Fuel, Award, RefreshCw, Coins,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApi } from '../hooks/useApi';
import { useRealtimeUpdate } from '../hooks/useWebSocket';
import { useIdentity } from '../hooks/useIdentity';
import { api } from '../api/endpoints';
import LoadingSpinner from '../components/LoadingSpinner';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
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

function formatCountdown(expiresAt) {
  if (!expiresAt) return '--';
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h ${Math.floor((diff % 3600000) / 60000)}m`;
}

const TX_TYPE_CONFIG = {
  tip_sent: { icon: ArrowUpCircle, color: 'var(--color-danger)', prefix: '-' },
  tip_received: { icon: ArrowDownCircle, color: 'var(--color-success)', prefix: '+' },
  subscription: { icon: RefreshCw, color: 'var(--color-warning)', prefix: '-' },
  purchase: { icon: Coins, color: 'var(--color-danger)', prefix: '-' },
  escrow_funded: { icon: Send, color: 'var(--color-warning)', prefix: '-' },
  escrow_released: { icon: ArrowDownCircle, color: 'var(--color-success)', prefix: '+' },
  escrow_refunded: { icon: ArrowDownCircle, color: 'var(--color-success)', prefix: '+' },
  faucet: { icon: Fuel, color: 'var(--color-primary)', prefix: '+' },
};

export default function Wallet() {
  const { t } = useTranslation();
  const { identity, signAndSend } = useIdentity();
  const [copied, setCopied] = useState(false);
  const [sendTo, setSendTo] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sending, setSending] = useState(false);
  const [requestingGas, setRequestingGas] = useState(false);

  // Fetch wallet data from user profile endpoint
  const { data: walletData, loading, error, setData: setWalletData, reload } = useApi(
    () => identity?.userId
      ? api.getUser(identity.userId).then(res => res?.user || res || null)
      : Promise.resolve(null),
    [identity?.userId],
    ['user', 'tip', 'subscription'],
  );

  // Real-time updates
  useRealtimeUpdate(
    useCallback(
      (wsData) => {
        if (
          wsData.entity === 'tip' ||
          wsData.entity === 'subscription' ||
          wsData.entity === 'escrow' ||
          wsData.entity === 'purchase'
        ) {
          reload();
        }
      },
      [reload],
    ),
    ['tip', 'subscription', 'escrow', 'purchase'],
  );

  const balance = walletData?.balance || 0;
  const address = walletData?.address || identity?.address || '';
  const transactions = walletData?.transactions || [];
  const subscriptions = walletData?.subscriptions || [];
  const badges = walletData?.badges || [];

  function handleCopy() {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleRequestGas() {
    if (requestingGas || !address) return;
    setRequestingGas(true);
    try {
      await fetch('/api/v1/faucet-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });
      setTimeout(reload, 3000);
    } catch (err) {
      console.error('[Wallet] Faucet request failed:', err);
    } finally {
      setRequestingGas(false);
    }
  }

  async function handleSend() {
    if (!sendTo.trim() || !sendAmount || parseFloat(sendAmount) <= 0 || sending) return;
    setSending(true);
    try {
      const { useWallet } = await import('../hooks/useWallet');
      const wallet = useWallet();
      await wallet.send(sendTo.trim(), parseFloat(sendAmount));
      setSendTo('');
      setSendAmount('');
      setTimeout(reload, 2000);
    } catch (err) {
      console.error('[Wallet] Send failed:', err);
    } finally {
      setSending(false);
    }
  }

  if (!identity) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <WalletIcon size={48} style={{ color: 'var(--color-text-muted)' }} />
        <p style={{ color: 'var(--color-text-muted)' }}>{t('wallet.loginRequired')}</p>
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

  return (
    <div className="max-w-4xl mx-auto">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-3 neon-text"
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        <WalletIcon size={28} style={{ color: 'var(--color-primary)' }} />
        {t('wallet.title')}
      </motion.h1>

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
        {/* Balance card */}
        <motion.div variants={item} className="glass-card text-center">
          <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>
            {t('wallet.balance')}
          </p>
          <motion.p
            key={balance}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-4xl md:text-5xl font-bold font-mono mb-1"
            style={{ color: 'var(--color-primary)' }}
          >
            {typeof balance === 'number' ? balance.toFixed(2) : balance}
          </motion.p>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>IOTA</p>

          {/* Address */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <code
              className="text-xs font-mono px-3 py-1.5 rounded-lg truncate max-w-xs"
              style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text-muted)' }}
            >
              {address ? `${address.slice(0, 16)}...${address.slice(-8)}` : '--'}
            </code>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
            >
              {copied ? (
                <CheckCircle size={14} style={{ color: 'var(--color-success)' }} />
              ) : (
                <Copy size={14} style={{ color: 'var(--color-text-muted)' }} />
              )}
            </button>
          </div>

          {/* Request Gas */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleRequestGas}
            disabled={requestingGas}
            className="mt-3 flex items-center gap-2 mx-auto px-4 py-2 rounded-xl text-xs font-medium transition-colors disabled:opacity-40"
            style={{
              backgroundColor: 'rgba(0,240,255,0.1)',
              color: 'var(--color-primary)',
              border: '1px solid rgba(0,240,255,0.2)',
            }}
          >
            <Fuel size={14} />
            {requestingGas ? t('wallet.requesting') : t('wallet.requestGas')}
          </motion.button>
        </motion.div>

        {/* Send IOTA */}
        <motion.div variants={item} className="glass-card">
          <h3
            className="text-sm font-semibold uppercase tracking-wider mb-3 flex items-center gap-2"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <Send size={14} />
            {t('wallet.sendIota')}
          </h3>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={sendTo}
              onChange={(e) => setSendTo(e.target.value)}
              placeholder={t('wallet.recipientAddress')}
              className="flex-1 px-3 py-2 rounded-lg border bg-transparent outline-none text-sm"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
            />
            <input
              type="number"
              value={sendAmount}
              onChange={(e) => setSendAmount(e.target.value)}
              placeholder={t('wallet.amount')}
              min="0.01"
              step="0.01"
              className="w-32 px-3 py-2 rounded-lg border bg-transparent outline-none text-sm"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
            />
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSend}
              disabled={sending || !sendTo.trim() || !sendAmount || parseFloat(sendAmount) <= 0}
              className="btn-primary px-5 py-2 rounded-xl text-sm disabled:opacity-40"
            >
              {sending ? t('wallet.sending') : t('wallet.send')}
            </motion.button>
          </div>
        </motion.div>

        {/* Active subscriptions */}
        {subscriptions.length > 0 && (
          <motion.div variants={item} className="glass-card">
            <h3
              className="text-sm font-semibold uppercase tracking-wider mb-3 flex items-center gap-2"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <RefreshCw size={14} />
              {t('wallet.activeSubscriptions')}
            </h3>
            <div className="space-y-2">
              {subscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ backgroundColor: 'var(--color-background)' }}
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                      {sub.tierName || t(`wallet.tier${sub.tier}`)}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {t('wallet.expiresIn')} {formatCountdown(sub.expiresAt)}
                    </p>
                  </div>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{
                      backgroundColor: 'rgba(0,255,136,0.1)',
                      color: 'var(--color-success)',
                    }}
                  >
                    {t('wallet.active')}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Owned badges */}
        {badges.length > 0 && (
          <motion.div variants={item} className="glass-card">
            <h3
              className="text-sm font-semibold uppercase tracking-wider mb-3 flex items-center gap-2"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <Award size={14} />
              {t('wallet.ownedBadges')}
            </h3>
            <div className="flex flex-wrap gap-2">
              {badges.map((badge) => (
                <motion.div
                  key={badge.id}
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border"
                  style={{
                    borderColor: 'var(--color-border)',
                    backgroundColor: 'var(--color-background)',
                  }}
                >
                  <span className="text-lg">{badge.icon || '🏆'}</span>
                  <span className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>
                    {badge.name}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Transaction history */}
        <motion.div variants={item} className="glass-card">
          <h3
            className="text-sm font-semibold uppercase tracking-wider mb-3 flex items-center gap-2"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <Clock size={14} />
            {t('wallet.transactionHistory')}
          </h3>

          {transactions.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: 'var(--color-text-muted)' }}>
              {t('wallet.noTransactions')}
            </p>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx, idx) => {
                const txConfig = TX_TYPE_CONFIG[tx.type] || TX_TYPE_CONFIG.tip_sent;
                const TxIcon = txConfig.icon;
                return (
                  <motion.div
                    key={tx.id || idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="flex items-center gap-3 p-3 rounded-lg"
                    style={{ backgroundColor: 'var(--color-background)' }}
                  >
                    <TxIcon size={16} style={{ color: txConfig.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: 'var(--color-text)' }}>
                        {tx.description || t(`wallet.txType.${tx.type}`)}
                      </p>
                      <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                        {formatTime(tx.createdAt)}
                      </p>
                    </div>
                    <span
                      className="font-mono text-sm font-medium"
                      style={{ color: txConfig.color }}
                    >
                      {txConfig.prefix}{tx.amount} IOTA
                    </span>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
