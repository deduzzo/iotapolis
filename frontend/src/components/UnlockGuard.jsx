import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Loader2 } from 'lucide-react';
import { useIdentity } from '../hooks/useIdentity';

/**
 * Wraps children and shows an unlock prompt if the wallet is locked.
 * Use this around any page/component that needs to sign transactions.
 */
export default function UnlockGuard({ children }) {
  const { identity, unlocked, unlockIdentity } = useIdentity();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // No identity at all — don't block, let the page handle it
  if (!identity) return children;

  // Already unlocked — render children
  if (unlocked) return children;

  return (
    <div className="max-w-md mx-auto py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card text-center"
      >
        <Lock size={40} className="mx-auto mb-4" style={{ color: 'var(--color-primary)' }} />
        <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
          Sblocca il wallet
        </h2>
        <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
          Inserisci la password per firmare transazioni on-chain.
        </p>
        <form onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          setError('');
          try {
            await unlockIdentity(password);
          } catch {
            setError('Password errata');
          } finally {
            setLoading(false);
          }
        }}>
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            placeholder="Password wallet"
            className="w-full px-4 py-2.5 rounded-xl border bg-transparent text-sm outline-none mb-3"
            style={{
              borderColor: error ? 'var(--color-danger)' : 'var(--color-border)',
              color: 'var(--color-text)',
            }}
            autoFocus
          />
          {error && <p className="text-xs mb-3" style={{ color: 'var(--color-danger)' }}>{error}</p>}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading || !password}
            className="btn-primary w-full py-2.5 rounded-xl font-semibold disabled:opacity-40"
          >
            {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Sblocca'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
