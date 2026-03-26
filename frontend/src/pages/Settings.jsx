import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RotateCcw, Trash2, Database, HardDrive, User,
  AlertTriangle, CheckCircle, Loader2, Download, Bug,
} from 'lucide-react';
import { useIdentity } from '../hooks/useIdentity';
import { useToast } from '../components/Layout';

function ActionCard({ icon: Icon, title, description, buttonText, buttonColor, onAction, loading, danger }) {
  return (
    <motion.div
      className="glass-card p-6 rounded-xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ borderRadius: 'var(--border-radius)' }}
    >
      <div className="flex items-start gap-4">
        <div
          className="p-3 rounded-lg shrink-0"
          style={{ backgroundColor: danger ? 'rgba(255,68,68,0.15)' : 'rgba(var(--color-primary-rgb, 0,240,255),0.15)' }}
        >
          <Icon size={24} style={{ color: danger ? 'var(--color-danger)' : 'var(--color-primary)' }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>{title}</h3>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>{description}</p>
        </div>
        <button
          onClick={onAction}
          disabled={loading}
          className="px-4 py-2 rounded-lg font-medium text-sm transition-all shrink-0 flex items-center gap-2"
          style={{
            backgroundColor: danger ? 'var(--color-danger)' : 'var(--color-primary)',
            color: 'var(--color-background)',
            opacity: loading ? 0.6 : 1,
            borderRadius: 'var(--border-radius)',
          }}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : null}
          {buttonText}
        </button>
      </div>
    </motion.div>
  );
}

export default function Settings() {
  const { identity, clearIdentity, exportIdentity } = useIdentity();
  const addToast = useToast();
  const [loading, setLoading] = useState({});
  const [confirmReset, setConfirmReset] = useState(null);
  const [logs, setLogs] = useState([]);

  const addLog = (msg, type = 'info') => {
    const ts = new Date().toLocaleTimeString();
    setLogs(prev => [{ ts, msg, type }, ...prev].slice(0, 100));
  };

  // Reset solo cache SQLite server-side
  const resetCache = async () => {
    setLoading(l => ({ ...l, cache: true }));
    addLog('Resetting server cache...');
    try {
      const res = await fetch('/api/v1/sync-reset', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        addLog('Server cache cleared + resync started', 'success');
        addToast('Cache server azzerata e resync avviata', 'success');
      } else {
        addLog(`Cache reset failed: ${data.error}`, 'error');
        addToast('Errore reset cache: ' + (data.error || 'Unknown'), 'error');
      }
    } catch (err) {
      addLog(`Cache reset error: ${err.message}`, 'error');
      addToast('Errore: ' + err.message, 'error');
    }
    setLoading(l => ({ ...l, cache: false }));
  };

  // Reset identità locale (localStorage)
  const resetIdentity = () => {
    addLog('Clearing local identity...');
    clearIdentity();
    addLog('Local identity cleared', 'success');
    addToast('Identità locale cancellata', 'success');
    setConfirmReset(null);
  };

  // Full reset: cache + identity + localStorage
  const fullReset = async () => {
    setLoading(l => ({ ...l, full: true }));
    addLog('Starting FULL reset...');

    // 1. Reset server cache
    try {
      await fetch('/api/v1/sync-reset', { method: 'POST' });
      addLog('Server cache cleared', 'success');
    } catch (err) {
      addLog(`Server cache reset failed: ${err.message}`, 'error');
    }

    // 2. Clear all localStorage
    localStorage.clear();
    addLog('localStorage cleared', 'success');

    // 3. Clear sessionStorage
    sessionStorage.clear();
    addLog('sessionStorage cleared', 'success');

    addToast('Reset completo! Ricarica la pagina.', 'success');
    addLog('Full reset complete. Reload recommended.', 'success');
    setLoading(l => ({ ...l, full: false }));
    setConfirmReset(null);

    // Auto-reload after 1.5s
    setTimeout(() => window.location.reload(), 1500);
  };

  // Export dei dati del server
  const exportData = async () => {
    setLoading(l => ({ ...l, export: true }));
    addLog('Exporting server data...');
    try {
      const res = await fetch('/api/v1/export-data');
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `iota-forum-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      addLog('Data exported successfully', 'success');
      addToast('Dati esportati', 'success');
    } catch (err) {
      addLog(`Export failed: ${err.message}`, 'error');
      addToast('Errore export: ' + err.message, 'error');
    }
    setLoading(l => ({ ...l, export: false }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
          Impostazioni
        </h1>
        <p className="mt-2" style={{ color: 'var(--color-text-muted)' }}>
          Strumenti di gestione e debug per il forum
        </p>
      </div>

      {/* Stato corrente */}
      <div className="glass-card p-6 rounded-xl" style={{ borderRadius: 'var(--border-radius)' }}>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Database size={20} style={{ color: 'var(--color-primary)' }} />
          Stato corrente
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--color-surface)' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Identità locale</span>
            <div className="font-mono mt-1" style={{ color: identity ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
              {identity ? `${identity.username || 'No username'} (${identity.userId?.substring(0, 12)}...)` : 'Nessuna'}
            </div>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--color-surface)' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>localStorage</span>
            <div className="font-mono mt-1">
              {Object.keys(localStorage).length} chiavi
            </div>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--color-surface)' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Keypair</span>
            <div className="font-mono mt-1" style={{ color: identity?.publicKey ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
              {identity?.publicKey ? 'RSA-2048 presente' : 'Non generato'}
            </div>
          </div>
        </div>
      </div>

      {/* Azioni */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <HardDrive size={20} style={{ color: 'var(--color-primary)' }} />
          Azioni
        </h2>

        <ActionCard
          icon={Download}
          title="Esporta dati"
          description="Scarica un dump JSON di tutti i dati nel database SQLite del server."
          buttonText="Esporta"
          onAction={exportData}
          loading={loading.export}
        />

        {identity && (
          <ActionCard
            icon={Download}
            title="Esporta identità"
            description="Salva le chiavi RSA e l'username in un file JSON per backup o migrazione su altro dispositivo."
            buttonText="Esporta"
            onAction={exportIdentity}
          />
        )}

        <ActionCard
          icon={RotateCcw}
          title="Reset cache server"
          description="Svuota il database SQLite locale e avvia una risincronizzazione dalla blockchain. I dati on-chain non vengono toccati."
          buttonText="Reset Cache"
          buttonColor="warning"
          onAction={resetCache}
          loading={loading.cache}
        />

        <ActionCard
          icon={User}
          title="Cancella identità locale"
          description="Rimuove il keypair RSA e l'username dal browser. Potrai generarne uno nuovo o importarne uno esistente."
          buttonText="Cancella"
          danger
          onAction={() => setConfirmReset('identity')}
        />

        <ActionCard
          icon={Trash2}
          title="Reset completo"
          description="Cancella TUTTO: cache server, identità locale, localStorage, sessionStorage. Il forum riparte da zero. I dati on-chain restano."
          buttonText="Reset Totale"
          danger
          onAction={() => setConfirmReset('full')}
          loading={loading.full}
        />
      </div>

      {/* Confirm modal */}
      <AnimatePresence>
        {confirmReset && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/60" onClick={() => setConfirmReset(null)} />
            <motion.div
              className="glass-card relative p-6 rounded-xl max-w-md mx-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{ borderRadius: 'var(--border-radius)' }}
            >
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle size={24} style={{ color: 'var(--color-danger)' }} />
                <h3 className="text-lg font-bold">Conferma</h3>
              </div>
              <p className="mb-6" style={{ color: 'var(--color-text-muted)' }}>
                {confirmReset === 'identity'
                  ? 'Sei sicuro di voler cancellare la tua identità locale? Se non hai un backup, perderai l\'accesso al tuo account.'
                  : 'Sei sicuro di voler fare un reset completo? Cache server, identità locale e tutti i dati nel browser verranno cancellati.'
                }
              </p>
              <div className="flex justify-end gap-3">
                <button
                  className="px-4 py-2 rounded-lg text-sm"
                  style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)', borderRadius: 'var(--border-radius)' }}
                  onClick={() => setConfirmReset(null)}
                >
                  Annulla
                </button>
                <button
                  className="px-4 py-2 rounded-lg text-sm font-medium"
                  style={{ backgroundColor: 'var(--color-danger)', color: '#fff', borderRadius: 'var(--border-radius)' }}
                  onClick={confirmReset === 'identity' ? resetIdentity : fullReset}
                >
                  Conferma
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Log console */}
      <div className="glass-card p-6 rounded-xl" style={{ borderRadius: 'var(--border-radius)' }}>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Bug size={20} style={{ color: 'var(--color-primary)' }} />
          Log operazioni
        </h2>
        <div
          className="font-mono text-xs space-y-1 max-h-64 overflow-y-auto p-3 rounded-lg"
          style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text-muted)' }}
        >
          {logs.length === 0 && <div>Nessuna operazione eseguita</div>}
          {logs.map((log, i) => (
            <div key={i} className="flex gap-2">
              <span style={{ color: 'var(--color-text-muted)' }}>{log.ts}</span>
              <span style={{
                color: log.type === 'error' ? 'var(--color-danger)'
                  : log.type === 'success' ? 'var(--color-success)'
                  : 'var(--color-text)',
              }}>
                {log.msg}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
