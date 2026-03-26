import { useState } from 'react';
import { motion } from 'framer-motion';
import { Image, X, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const HOSTING_SERVICES = [
  { name: 'Imgur', url: 'https://imgur.com/upload' },
  { name: 'ImgBB', url: 'https://imgbb.com' },
  { name: 'Postimages', url: 'https://postimages.org' },
];

export default function ImageInsertPopover({ onInsert, onClose }) {
  const { t } = useTranslation();
  const [url, setUrl] = useState('');
  const [alt, setAlt] = useState('');
  const [previewError, setPreviewError] = useState(false);

  const isValidUrl = url.trim().startsWith('http');

  function handleInsert() {
    if (!isValidUrl) return;
    onInsert({ src: url.trim(), alt: alt.trim() || '' });
    onClose();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="absolute z-50 top-full left-0 mt-2 p-4 rounded-xl border shadow-lg"
      style={{
        background: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
        width: 340,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold flex items-center gap-1.5" style={{ color: 'var(--color-text)' }}>
          <Image size={14} style={{ color: 'var(--color-primary)' }} />
          {t('editor.insertImage')}
        </h4>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10">
          <X size={14} style={{ color: 'var(--color-text-muted)' }} />
        </button>
      </div>

      <input
        type="url"
        value={url}
        onChange={(e) => { setUrl(e.target.value); setPreviewError(false); }}
        placeholder="https://i.imgur.com/esempio.jpg"
        className="w-full px-3 py-2 rounded-lg text-sm border outline-none mb-2"
        style={{
          background: 'var(--color-background)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-text)',
        }}
        autoFocus
        onKeyDown={(e) => e.key === 'Enter' && handleInsert()}
      />

      <input
        type="text"
        value={alt}
        onChange={(e) => setAlt(e.target.value)}
        placeholder={t('editor.descriptionOptional')}
        className="w-full px-3 py-2 rounded-lg text-sm border outline-none mb-3"
        style={{
          background: 'var(--color-background)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-text)',
        }}
        onKeyDown={(e) => e.key === 'Enter' && handleInsert()}
      />

      {/* Preview */}
      {isValidUrl && !previewError && (
        <div className="mb-3 rounded-lg overflow-hidden border" style={{ borderColor: 'var(--color-border)' }}>
          <img
            src={url}
            alt={alt || 'preview'}
            className="w-full max-h-32 object-contain"
            style={{ background: 'var(--color-background)' }}
            onError={() => setPreviewError(true)}
          />
        </div>
      )}

      {/* Hosting suggestions */}
      <div className="mb-3 p-2.5 rounded-lg" style={{ background: 'var(--color-background)' }}>
        <p className="text-xs mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
          {t('editor.freeUpload')}
        </p>
        <div className="flex flex-wrap gap-2">
          {HOSTING_SERVICES.map((s) => (
            <a
              key={s.name}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-md border transition-colors hover:bg-white/5"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-primary)' }}
            >
              {s.name}
              <ExternalLink size={10} />
            </a>
          ))}
        </div>
        <p className="text-[10px] mt-1.5" style={{ color: 'var(--color-text-muted)' }}>
          {t('editor.uploadThenPaste')}
        </p>
      </div>

      <button
        onClick={handleInsert}
        disabled={!isValidUrl}
        className="btn-primary w-full py-2 rounded-lg text-sm disabled:opacity-40"
      >
        {t('editor.insert')}
      </button>
    </motion.div>
  );
}
