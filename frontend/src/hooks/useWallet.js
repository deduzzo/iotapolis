import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Transaction,
  CLOCK_OBJECT_ID,
  getClient,
  gzipCompress,
} from '../api/crypto';
import { useIdentity } from './useIdentity';
import { api } from '../api/endpoints';

// 1 IOTA = 1_000_000_000 nanos
const NANOS_PER_IOTA = 1_000_000_000n;

/**
 * Format a nanos balance as a human-readable IOTA string.
 */
export function formatIota(nanos) {
  if (nanos == null) return '0';
  const n = BigInt(nanos);
  const whole = n / NANOS_PER_IOTA;
  const frac = n % NANOS_PER_IOTA;
  if (frac === 0n) return whole.toString();
  // Show up to 4 decimal places
  const fracStr = frac.toString().padStart(9, '0').slice(0, 4).replace(/0+$/, '');
  return fracStr ? `${whole}.${fracStr}` : whole.toString();
}

/**
 * Convert a human-readable IOTA amount (e.g. "1.5") to nanos bigint.
 */
export function iotaToNanos(amount) {
  const parts = String(amount).split('.');
  const whole = BigInt(parts[0] || '0') * NANOS_PER_IOTA;
  if (!parts[1]) return whole;
  const fracStr = parts[1].padEnd(9, '0').slice(0, 9);
  return whole + BigInt(fracStr);
}

/**
 * Hook for wallet operations: balance, tips, subscriptions, purchases, escrow.
 *
 * All write operations build a Transaction, call the appropriate Move function,
 * and sign/execute with the user's Ed25519 keypair via useIdentity().signAndSendTx().
 */
export function useWallet() {
  const { identity, unlocked, signAndSendTx, forumConfig } = useIdentity();
  const [balance, setBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const refreshTimerRef = useRef(null);

  const pkg = forumConfig?.packageId;
  const forum = forumConfig?.forumObjectId;

  // ── Balance ───────────────────────────────────────────────────────────────

  const refreshBalance = useCallback(async () => {
    if (!identity?.address) { setBalance(null); return null; }
    setBalanceLoading(true);
    try {
      const client = getClient();
      const result = await client.getBalance({ owner: identity.address });
      setBalance(result);
      return result;
    } catch (err) {
      console.error('[useWallet] balance error:', err);
      return null;
    } finally {
      setBalanceLoading(false);
    }
  }, [identity?.address]);

  // Auto-refresh balance when address is available and unlocked
  useEffect(() => {
    if (identity?.address && unlocked) {
      refreshBalance();
      // Refresh every 30 seconds
      refreshTimerRef.current = setInterval(refreshBalance, 30_000);
      return () => clearInterval(refreshTimerRef.current);
    }
    return undefined;
  }, [identity?.address, unlocked, refreshBalance]);

  // ── Helper: ensure prerequisites ──────────────────────────────────────────

  function requireReady() {
    if (!unlocked) throw new Error('Wallet not unlocked');
    if (!pkg || !forum) throw new Error('Forum contract not configured');
  }

  // ── Tip a post author ─────────────────────────────────────────────────────

  /**
   * Send a tip to a post author.
   * amount is in IOTA (e.g. "0.5"), converted to nanos internally.
   */
  const tip = useCallback(async (postId, recipientAddress, amount) => {
    requireReady();
    const nanos = iotaToNanos(amount);

    const tx = new Transaction();
    const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(nanos.toString())]);

    tx.moveCall({
      target: `${pkg}::forum::tip`,
      arguments: [
        tx.object(forum),
        tx.pure.vector('u8', Array.from(new TextEncoder().encode(postId))),
        coin,
        tx.pure.address(recipientAddress),
        tx.object(CLOCK_OBJECT_ID),
      ],
    });
    tx.setGasBudget(50_000_000);

    const result = await signAndSendTx(tx);
    if (result.effects?.status?.status !== 'success') {
      throw new Error(result.effects?.status?.error || 'Tip failed');
    }
    // Refresh balance after spending
    setTimeout(refreshBalance, 1000);
    return result;
  }, [pkg, forum, signAndSendTx, unlocked, refreshBalance]);

  // ── Subscribe to a tier ───────────────────────────────────────────────────

  const subscribe = useCallback(async (tierId, amount) => {
    requireReady();
    const nanos = iotaToNanos(amount);

    const tx = new Transaction();
    const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(nanos.toString())]);

    tx.moveCall({
      target: `${pkg}::forum::subscribe`,
      arguments: [
        tx.object(forum),
        tx.pure.u8(tierId),
        coin,
        tx.object(CLOCK_OBJECT_ID),
      ],
    });
    tx.setGasBudget(50_000_000);

    const result = await signAndSendTx(tx);
    if (result.effects?.status?.status !== 'success') {
      throw new Error(result.effects?.status?.error || 'Subscription failed');
    }
    setTimeout(refreshBalance, 1000);
    return result;
  }, [pkg, forum, signAndSendTx, unlocked, refreshBalance]);

  // ── Purchase paid content ─────────────────────────────────────────────────

  const purchaseContent = useCallback(async (contentId, amount) => {
    requireReady();
    const nanos = iotaToNanos(amount);

    const tx = new Transaction();
    const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(nanos.toString())]);

    tx.moveCall({
      target: `${pkg}::forum::purchase_content`,
      arguments: [
        tx.object(forum),
        tx.pure.vector('u8', Array.from(new TextEncoder().encode(contentId))),
        coin,
        tx.object(CLOCK_OBJECT_ID),
      ],
    });
    tx.setGasBudget(50_000_000);

    const result = await signAndSendTx(tx);
    if (result.effects?.status?.status !== 'success') {
      throw new Error(result.effects?.status?.error || 'Purchase failed');
    }
    setTimeout(refreshBalance, 1000);
    return result;
  }, [pkg, forum, signAndSendTx, unlocked, refreshBalance]);

  // ── Purchase badge ────────────────────────────────────────────────────────

  const purchaseBadge = useCallback(async (badgeId, amount) => {
    requireReady();
    const nanos = iotaToNanos(amount);

    const tx = new Transaction();
    const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(nanos.toString())]);

    tx.moveCall({
      target: `${pkg}::forum::purchase_badge`,
      arguments: [
        tx.object(forum),
        tx.pure.u8(badgeId),
        coin,
        tx.object(CLOCK_OBJECT_ID),
      ],
    });
    tx.setGasBudget(50_000_000);

    const result = await signAndSendTx(tx);
    if (result.effects?.status?.status !== 'success') {
      throw new Error(result.effects?.status?.error || 'Badge purchase failed');
    }
    setTimeout(refreshBalance, 1000);
    return result;
  }, [pkg, forum, signAndSendTx, unlocked, refreshBalance]);

  // ── Create escrow ─────────────────────────────────────────────────────────

  const createEscrow = useCallback(async (seller, arbitrator, description, deadline, amount) => {
    requireReady();
    const nanos = iotaToNanos(amount);
    const descCompressed = await gzipCompress({ description });

    const tx = new Transaction();
    const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(nanos.toString())]);

    tx.moveCall({
      target: `${pkg}::forum::create_escrow`,
      arguments: [
        tx.object(forum),
        tx.pure.address(seller),
        tx.pure.address(arbitrator),
        tx.pure.vector('u8', Array.from(descCompressed)),
        tx.pure.u64(deadline),
        coin,
        tx.object(CLOCK_OBJECT_ID),
      ],
    });
    tx.setGasBudget(50_000_000);

    const result = await signAndSendTx(tx);
    if (result.effects?.status?.status !== 'success') {
      throw new Error(result.effects?.status?.error || 'Escrow creation failed');
    }
    setTimeout(refreshBalance, 1000);
    return result;
  }, [pkg, forum, signAndSendTx, unlocked, refreshBalance]);

  // ── Escrow votes ──────────────────────────────────────────────────────────

  const voteRelease = useCallback(async (escrowId) => {
    requireReady();

    const tx = new Transaction();
    tx.moveCall({
      target: `${pkg}::forum::vote_release`,
      arguments: [
        tx.object(forum),
        tx.pure.vector('u8', Array.from(new TextEncoder().encode(escrowId))),
        tx.object(CLOCK_OBJECT_ID),
      ],
    });
    tx.setGasBudget(50_000_000);

    const result = await signAndSendTx(tx);
    if (result.effects?.status?.status !== 'success') {
      throw new Error(result.effects?.status?.error || 'Vote release failed');
    }
    setTimeout(refreshBalance, 1000);
    return result;
  }, [pkg, forum, signAndSendTx, unlocked, refreshBalance]);

  const voteRefund = useCallback(async (escrowId) => {
    requireReady();

    const tx = new Transaction();
    tx.moveCall({
      target: `${pkg}::forum::vote_refund`,
      arguments: [
        tx.object(forum),
        tx.pure.vector('u8', Array.from(new TextEncoder().encode(escrowId))),
        tx.object(CLOCK_OBJECT_ID),
      ],
    });
    tx.setGasBudget(50_000_000);

    const result = await signAndSendTx(tx);
    if (result.effects?.status?.status !== 'success') {
      throw new Error(result.effects?.status?.error || 'Vote refund failed');
    }
    setTimeout(refreshBalance, 1000);
    return result;
  }, [pkg, forum, signAndSendTx, unlocked, refreshBalance]);

  // ── Rate a trade ──────────────────────────────────────────────────────────

  const rateTrade = useCallback(async (escrowId, rated, score, comment) => {
    requireReady();
    const commentCompressed = await gzipCompress({ comment });

    const tx = new Transaction();
    tx.moveCall({
      target: `${pkg}::forum::rate_trade`,
      arguments: [
        tx.object(forum),
        tx.pure.vector('u8', Array.from(new TextEncoder().encode(escrowId))),
        tx.pure.address(rated),
        tx.pure.u8(score),
        tx.pure.vector('u8', Array.from(commentCompressed)),
        tx.object(CLOCK_OBJECT_ID),
      ],
    });
    tx.setGasBudget(50_000_000);

    const result = await signAndSendTx(tx);
    if (result.effects?.status?.status !== 'success') {
      throw new Error(result.effects?.status?.error || 'Rating failed');
    }
    return result;
  }, [pkg, forum, signAndSendTx, unlocked]);

  // ── Request faucet (gas from backend) ─────────────────────────────────────

  const requestFaucet = useCallback(async () => {
    if (!identity?.address) throw new Error('No wallet address');
    const result = await api.requestFaucet(identity.address);
    if (!result.success) {
      throw new Error(result.error || 'Faucet request failed');
    }
    // Refresh balance after receiving gas
    setTimeout(refreshBalance, 3000);
    return result;
  }, [identity?.address, refreshBalance]);

  return {
    // State
    balance,
    balanceLoading,
    balanceFormatted: balance ? formatIota(balance.totalBalance) : '0',

    // Actions
    refreshBalance,
    tip,
    subscribe,
    purchaseContent,
    purchaseBadge,
    createEscrow,
    voteRelease,
    voteRefund,
    rateTrade,
    requestFaucet,

    // Utilities
    formatIota,
    iotaToNanos,
  };
}
