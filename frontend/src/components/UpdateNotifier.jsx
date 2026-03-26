import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, RefreshCw, CheckCircle, AlertCircle, X, Loader2 } from 'lucide-react';

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function formatSpeed(bps) {
  if (!bps) return '';
  if (bps < 1048576) return `${(bps / 1024).toFixed(0)} KB/s`;
  return `${(bps / 1048576).toFixed(1)} MB/s`;
}

export default function UpdateNotifier() {
  const [state, setState] = useState('idle'); // idle | checking | available | downloading | downloaded | error
  const [updateInfo, setUpdateInfo] = useState(null);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    function handleUpdate(e) {
      const data = e.detail;
      switch (data.event) {
        case 'checking':
          setState('checking');
          break;
        case 'available':
          setState('available');
          setUpdateInfo(data);
          setDismissed(false);
          break;
        case 'not-available':
          setState('idle');
          break;
        case 'progress':
          setState('downloading');
          setProgress(data);
          break;
        case 'downloaded':
          setState('downloaded');
          setUpdateInfo(data);
          break;
        case 'error':
          setState('error');
          setError(data.message);
          break;
      }
    }

    window.addEventListener('electron-update', handleUpdate);
    return () => window.removeEventListener('electron-update', handleUpdate);
  }, []);

  function startDownload() {
    window.__electronUpdateAction = 'download';
    setState('downloading');
    setProgress({ percent: 0 });
  }

  function installNow() {
    window.__electronUpdateAction = 'install';
  }

  // Don't show anything if idle or dismissed
  if (state === 'idle' || state === 'checking' || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[300] flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/70" onClick={() => state === 'available' && setDismissed(true)} />
        <motion.div
          className="relative w-full max-w-md mx-4 rounded-2xl border overflow-hidden"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', boxShadow: '0 25px 80px rgba(0,0,0,0.5)' }}
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b flex items-center justify-between"
            style={{ borderColor: 'var(--color-border)' }}>
            <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
              {state === 'downloaded' ? <CheckCircle size={20} style={{ color: 'var(--color-success)' }} /> :
                state === 'error' ? <AlertCircle size={20} style={{ color: 'var(--color-danger)' }} /> :
                state === 'downloading' ? <Loader2 size={20} className="animate-spin" style={{ color: 'var(--color-primary)' }} /> :
                <Download size={20} style={{ color: 'var(--color-primary)' }} />}
              Aggiornamento
            </h3>
            {state === 'available' && (
              <button onClick={() => setDismissed(true)} className="p-1 rounded-lg hover:bg-white/10">
                <X size={16} style={{ color: 'var(--color-text-muted)' }} />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="px-6 py-5">
            {/* Update available */}
            {state === 'available' && updateInfo && (
              <div>
                <p className="text-sm mb-1" style={{ color: 'var(--color-text)' }}>
                  Nuova versione disponibile:
                </p>
                <p className="text-2xl font-bold mb-3" style={{ color: 'var(--color-primary)' }}>
                  v{updateInfo.version}
                </p>
                {updateInfo.releaseDate && (
                  <p className="text-xs mb-4" style={{ color: 'var(--color-text-muted)' }}>
                    Rilasciata il {new Date(updateInfo.releaseDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}

            {/* Downloading */}
            {state === 'downloading' && progress && (
              <div>
                <p className="text-sm mb-3" style={{ color: 'var(--color-text)' }}>
                  Download in corso...
                </p>
                {/* Progress bar */}
                <div className="w-full h-3 rounded-full overflow-hidden mb-2"
                  style={{ background: 'var(--color-background)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: 'var(--color-primary)' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress.percent || 0}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <div className="flex justify-between text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  <span>{progress.percent || 0}%</span>
                  <span>
                    {formatBytes(progress.transferred)} / {formatBytes(progress.total)}
                    {progress.speed ? ` — ${formatSpeed(progress.speed)}` : ''}
                  </span>
                </div>
              </div>
            )}

            {/* Downloaded */}
            {state === 'downloaded' && (
              <div>
                <p className="text-sm mb-2" style={{ color: 'var(--color-success)' }}>
                  Aggiornamento scaricato con successo!
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  L'app si riavvierà per installare la versione {updateInfo?.version || 'nuova'}.
                </p>
              </div>
            )}

            {/* Error */}
            {state === 'error' && (
              <div>
                <p className="text-sm mb-2" style={{ color: 'var(--color-danger)' }}>
                  Errore durante l'aggiornamento
                </p>
                <p className="text-xs font-mono p-2 rounded" style={{ color: 'var(--color-text-muted)', background: 'var(--color-background)' }}>
                  {error}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="px-6 py-4 border-t flex items-center justify-end gap-3"
            style={{ borderColor: 'var(--color-border)' }}>
            {state === 'available' && (
              <>
                <button onClick={() => setDismissed(true)}
                  className="px-4 py-2 rounded-xl text-sm border transition-colors hover:bg-white/5"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
                  Più tardi
                </button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={startDownload}
                  className="btn-primary px-5 py-2 rounded-xl text-sm flex items-center gap-2"
                >
                  <Download size={16} />
                  Scarica aggiornamento
                </motion.button>
              </>
            )}

            {state === 'downloaded' && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={installNow}
                className="btn-primary px-5 py-2 rounded-xl text-sm flex items-center gap-2"
              >
                <RefreshCw size={16} />
                Riavvia e installa
              </motion.button>
            )}

            {state === 'error' && (
              <button onClick={() => { setState('idle'); setDismissed(true); }}
                className="px-4 py-2 rounded-xl text-sm border transition-colors hover:bg-white/5"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
                Chiudi
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
