import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Key, User, Download, Upload, Shield, Copy, RefreshCw,
  CheckCircle, AlertTriangle, ChevronDown, ChevronUp, Fingerprint,
} from 'lucide-react';
import { useIdentity } from '../hooks/useIdentity';

const fadeSlide = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.4, ease: 'easeOut' },
};

export default function Identity() {
  const {
    identity, loading,
    generateIdentity, registerUsername,
    exportIdentity, importIdentity, clearIdentity,
  } = useIdentity();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
        >
          <Key size={32} className="text-[var(--color-primary)]" />
        </motion.div>
      </div>
    );
  }

  const state = !identity
    ? 'none'
    : !identity.username
      ? 'no-username'
      : 'registered';

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-8 flex items-center gap-3"
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        <Shield size={28} className="text-[var(--color-primary)]" />
        Identity
      </motion.h1>

      <AnimatePresence mode="wait">
        {state === 'none' && <NoIdentityCard key="none" onGenerate={generateIdentity} onImport={importIdentity} />}
        {state === 'no-username' && <UsernameCard key="username" identity={identity} onRegister={registerUsername} onExport={exportIdentity} />}
        {state === 'registered' && (
          <RegisteredCard
            key="registered"
            identity={identity}
            onExport={exportIdentity}
            onImport={importIdentity}
            onGenerate={generateIdentity}
            onClear={clearIdentity}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// State 1: No identity
// ---------------------------------------------------------------------------

function NoIdentityCard({ onGenerate, onImport }) {
  const [generating, setGenerating] = useState(false);
  const fileRef = useRef(null);

  async function handleGenerate() {
    setGenerating(true);
    try {
      await onGenerate();
    } finally {
      setGenerating(false);
    }
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (file) {
      try {
        await onImport(file);
      } catch (err) {
        alert(err.message);
      }
    }
  }

  return (
    <motion.div {...fadeSlide} className="glass-card">
      {/* Animated key icon */}
      <div className="flex justify-center mb-6">
        <motion.div
          animate={{
            boxShadow: [
              '0 0 20px rgba(var(--color-primary-rgb, 0, 240, 255), 0.2)',
              '0 0 40px rgba(var(--color-primary-rgb, 0, 240, 255), 0.4)',
              '0 0 20px rgba(var(--color-primary-rgb, 0, 240, 255), 0.2)',
            ],
          }}
          transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
          className="w-24 h-24 rounded-2xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
          }}
        >
          <Key size={44} className="text-white" />
        </motion.div>
      </div>

      <h2 className="text-2xl font-bold text-center mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
        Generate Your Identity
      </h2>
      <p className="text-center mb-6" style={{ color: 'var(--color-text-muted)' }}>
        Your identity is an RSA-2048 cryptographic keypair stored only in your browser.
        No passwords, no accounts — just math. You sign every action you take.
      </p>

      <div className="flex flex-col gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleGenerate}
          disabled={generating}
          className="btn-primary flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-lg disabled:opacity-50"
        >
          {generating ? (
            <>
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                <RefreshCw size={20} />
              </motion.div>
              Generating...
            </>
          ) : (
            <>
              <Fingerprint size={20} />
              Generate Keypair
            </>
          )}
        </motion.button>

        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 transition-colors"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <Upload size={18} />
          Import Existing Identity
        </button>
        <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleFileChange} />
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// State 2: Has keypair, no username
// ---------------------------------------------------------------------------

function UsernameCard({ identity, onRegister, onExport }) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isValid = /^[a-zA-Z0-9_]{3,20}$/.test(username);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isValid) return;
    setError('');
    setSubmitting(true);
    try {
      await onRegister(username);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.div {...fadeSlide} className="glass-card">
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' }}
        >
          <CheckCircle size={22} className="text-white" />
        </div>
        <div>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Keypair generated</p>
          <p className="font-mono text-sm" style={{ color: 'var(--color-primary)' }}>{identity.userId}</p>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
        Choose a Username
      </h2>
      <p className="text-sm mb-5" style={{ color: 'var(--color-text-muted)' }}>
        This username is linked to your public key on the network.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="relative">
            <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your_username"
              maxLength={20}
              className="w-full pl-10 pr-4 py-3 rounded-xl border bg-transparent outline-none transition-colors"
              style={{
                borderColor: username && !isValid ? 'var(--color-danger)' : 'var(--color-border)',
                color: 'var(--color-text)',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary)')}
              onBlur={(e) => (e.target.style.borderColor = username && !isValid ? 'var(--color-danger)' : 'var(--color-border)')}
            />
          </div>
          <p className="text-xs mt-1.5" style={{ color: username && !isValid ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>
            3-20 characters: letters, numbers, underscores
          </p>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-danger)' }}>
            <AlertTriangle size={16} />
            {error}
          </motion.div>
        )}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={!isValid || submitting}
          className="btn-primary w-full py-3 rounded-xl font-semibold disabled:opacity-40"
        >
          {submitting ? 'Registering...' : 'Register Username'}
        </motion.button>
      </form>

      <button
        onClick={onExport}
        className="mt-4 flex items-center justify-center gap-2 w-full py-2 rounded-xl border border-white/10 hover:bg-white/5 transition-colors text-sm"
        style={{ color: 'var(--color-text-muted)' }}
      >
        <Download size={16} />
        Backup Identity
      </button>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// State 3: Fully registered
// ---------------------------------------------------------------------------

function RegisteredCard({ identity, onExport, onImport, onGenerate, onClear }) {
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const fileRef = useRef(null);

  function handleCopy() {
    navigator.clipboard.writeText(identity.userId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleReset() {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    onClear();
    await onGenerate();
    setConfirmReset(false);
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (file) {
      try {
        await onImport(file);
      } catch (err) {
        alert(err.message);
      }
    }
  }

  return (
    <motion.div {...fadeSlide} className="space-y-4">
      {/* Profile card */}
      <div className="glass-card">
        <div className="flex items-center gap-4 mb-5">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold text-white shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' }}
          >
            {identity.username?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold truncate">{identity.username}</h2>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm truncate" style={{ color: 'var(--color-text-muted)' }}>
                {identity.userId}
              </span>
              <button
                onClick={handleCopy}
                className="shrink-0 p-1 rounded hover:bg-white/10 transition-colors"
                title="Copy User ID"
              >
                {copied ? (
                  <CheckCircle size={14} style={{ color: 'var(--color-success)' }} />
                ) : (
                  <Copy size={14} style={{ color: 'var(--color-text-muted)' }} />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Public key collapsible */}
        <button
          onClick={() => setShowKey(!showKey)}
          className="flex items-center gap-2 text-sm w-full py-2 px-3 rounded-lg hover:bg-white/5 transition-colors"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <Key size={14} />
          Public Key
          {showKey ? <ChevronUp size={14} className="ml-auto" /> : <ChevronDown size={14} className="ml-auto" />}
        </button>
        <AnimatePresence>
          {showKey && (
            <motion.pre
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden font-mono text-xs p-3 rounded-lg mt-1 break-all whitespace-pre-wrap"
              style={{ background: 'var(--color-surface)', color: 'var(--color-text-muted)' }}
            >
              {identity.publicKey}
            </motion.pre>
          )}
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div className="glass-card space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-muted)' }}>
          Actions
        </h3>

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={onExport}
          className="flex items-center gap-3 w-full py-2.5 px-4 rounded-xl border border-white/10 hover:bg-white/5 transition-colors"
        >
          <Download size={18} style={{ color: 'var(--color-primary)' }} />
          <div className="text-left">
            <p className="text-sm font-medium">Export Identity</p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Download your keypair as JSON backup</p>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-3 w-full py-2.5 px-4 rounded-xl border border-white/10 hover:bg-white/5 transition-colors"
        >
          <Upload size={18} style={{ color: 'var(--color-secondary)' }} />
          <div className="text-left">
            <p className="text-sm font-medium">Import Identity</p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Restore from a JSON backup file</p>
          </div>
        </motion.button>
        <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleFileChange} />

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={handleReset}
          className="flex items-center gap-3 w-full py-2.5 px-4 rounded-xl border transition-colors"
          style={{
            borderColor: confirmReset ? 'var(--color-danger)' : 'rgba(255,255,255,0.1)',
            backgroundColor: confirmReset ? 'rgba(255,68,68,0.1)' : 'transparent',
          }}
        >
          <AlertTriangle size={18} style={{ color: 'var(--color-danger)' }} />
          <div className="text-left">
            <p className="text-sm font-medium" style={{ color: confirmReset ? 'var(--color-danger)' : undefined }}>
              {confirmReset ? 'Click again to confirm — this is irreversible!' : 'Generate New Identity'}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {confirmReset ? 'Your current identity will be permanently lost' : 'Discard current keypair and create a new one'}
            </p>
          </div>
        </motion.button>
      </div>

      {/* Activity placeholder */}
      <div className="glass-card">
        <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-muted)' }}>
          Activity
        </h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { label: 'Threads', value: '--' },
            { label: 'Posts', value: '--' },
            { label: 'Reputation', value: '--' },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-xl font-bold" style={{ color: 'var(--color-primary)' }}>{stat.value}</p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
