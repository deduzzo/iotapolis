import { useState, useCallback, useEffect } from 'react';

/**
 * Global transaction tracker.
 * Singleton state shared across all hook instances.
 *
 * Transaction states:
 *   'signing'    — user is signing the TX
 *   'submitted'  — TX sent to blockchain, waiting for confirmation
 *   'confirmed'  — TX confirmed on-chain (success)
 *   'failed'     — TX failed
 */

let _transactions = [];
let _listeners = new Set();
let _nextId = 1;

function _notify() {
  const snapshot = [..._transactions];
  _listeners.forEach(fn => fn(snapshot));
}

export function addTransaction(label, tag = '') {
  const id = _nextId++;
  const tx = {
    id,
    label,
    tag,
    status: 'signing',
    digest: null,
    error: null,
    startedAt: Date.now(),
    completedAt: null,
  };
  _transactions = [tx, ..._transactions].slice(0, 50); // keep last 50
  _notify();
  return id;
}

export function updateTransaction(id, updates) {
  _transactions = _transactions.map(tx =>
    tx.id === id ? { ...tx, ...updates } : tx
  );
  _notify();
}

export function completeTransaction(id, digest) {
  updateTransaction(id, {
    status: 'confirmed',
    digest,
    completedAt: Date.now(),
  });
  // Auto-remove after 10 seconds
  setTimeout(() => {
    _transactions = _transactions.filter(tx => tx.id !== id);
    _notify();
  }, 10000);
}

export function failTransaction(id, error) {
  updateTransaction(id, {
    status: 'failed',
    error: typeof error === 'string' ? error : error?.message || 'Unknown error',
    completedAt: Date.now(),
  });
  // Auto-remove after 15 seconds
  setTimeout(() => {
    _transactions = _transactions.filter(tx => tx.id !== id);
    _notify();
  }, 15000);
}

export function getTransactionStatus(id) {
  const tx = _transactions.find(t => t.id === id);
  return tx?.status || null;
}

export function useTransactions() {
  const [transactions, setTransactions] = useState(_transactions);

  useEffect(() => {
    const listener = (txs) => setTransactions(txs);
    _listeners.add(listener);
    setTransactions([..._transactions]);
    return () => _listeners.delete(listener);
  }, []);

  const pending = transactions.filter(tx => tx.status === 'signing' || tx.status === 'submitted');
  const recent = transactions.filter(tx => tx.status === 'confirmed' || tx.status === 'failed');

  return { transactions, pending, recent };
}
