import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Palette,
  Type,
  Sliders,
  Sparkles,
  Save,
  RotateCcw,
  Upload,
  Check,
  Loader2,
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { availableFonts } from '../data/themes';

function Section({ title, icon: Icon, children }) {
  return (
    <div className="glass rounded-xl p-4 space-y-3">
      <h3 className="flex items-center gap-2 font-semibold text-sm" style={{ color: 'var(--color-primary)' }}>
        <Icon size={16} />
        {title}
      </h3>
      {children}
    </div>
  );
}

function ColorField({ label, value, onChange }) {
  return (
    <label className="flex items-center justify-between gap-3">
      <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>
          {value}
        </span>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
        />
      </div>
    </label>
  );
}

function ToggleSwitch({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{label}</span>
      <motion.button
        type="button"
        onClick={() => onChange(!checked)}
        className="relative w-11 h-6 rounded-full p-0.5 transition-colors"
        style={{
          backgroundColor: checked ? 'var(--color-primary)' : 'var(--color-border)',
        }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          className="w-5 h-5 rounded-full"
          style={{ backgroundColor: 'var(--color-background)' }}
          animate={{ x: checked ? 20 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </motion.button>
    </label>
  );
}

export default function ThemeCustomizer() {
  const {
    theme,
    overrides,
    setOverrides,
    forumName,
    setForumName,
    logoBase64,
    setLogoBase64,
    saveTheme,
    resetToDefault,
  } = useTheme();

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const updateOverride = useCallback(
    (path, value) => {
      setOverrides((prev) => {
        const next = { ...prev };
        const keys = path.split('.');
        let obj = next;
        for (let i = 0; i < keys.length - 1; i++) {
          obj[keys[i]] = { ...(obj[keys[i]] || {}) };
          obj = obj[keys[i]];
        }
        obj[keys[keys.length - 1]] = value;
        return next;
      });
    },
    [setOverrides],
  );

  const getVal = (path) => {
    const keys = path.split('.');
    let obj = theme;
    for (const k of keys) {
      obj = obj?.[k];
    }
    return obj;
  };

  const handleSave = async () => {
    setSaving(true);
    const ok = await saveTheme();
    setSaving(false);
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogoBase64(reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
        Customize Theme
      </h2>

      {/* Colors */}
      <Section title="Colors" icon={Palette}>
        <div className="space-y-2">
          <ColorField
            label="Primary"
            value={getVal('accent.primary')}
            onChange={(v) => updateOverride('accent.primary', v)}
          />
          <ColorField
            label="Secondary"
            value={getVal('accent.secondary')}
            onChange={(v) => updateOverride('accent.secondary', v)}
          />
          <ColorField
            label="Background"
            value={getVal('base.background')}
            onChange={(v) => updateOverride('base.background', v)}
          />
          <ColorField
            label="Surface"
            value={getVal('base.surface')}
            onChange={(v) => updateOverride('base.surface', v)}
          />
          <ColorField
            label="Text"
            value={getVal('base.text')}
            onChange={(v) => updateOverride('base.text', v)}
          />
        </div>
      </Section>

      {/* Typography */}
      <Section title="Typography" icon={Type}>
        <div className="space-y-3">
          <label className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Font Family</span>
            <select
              value={getVal('typography.fontFamily')}
              onChange={(e) => updateOverride('typography.fontFamily', e.target.value)}
              className="rounded-lg px-3 py-1.5 text-sm border-0 cursor-pointer"
              style={{
                backgroundColor: 'var(--color-surface-hover)',
                color: 'var(--color-text)',
              }}
            >
              {availableFonts.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </label>

          <label className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Heading Font</span>
            <select
              value={getVal('typography.headingFamily')}
              onChange={(e) => updateOverride('typography.headingFamily', e.target.value)}
              className="rounded-lg px-3 py-1.5 text-sm border-0 cursor-pointer"
              style={{
                backgroundColor: 'var(--color-surface-hover)',
                color: 'var(--color-text)',
              }}
            >
              {availableFonts.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Border Radius</span>
              <span className="text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>
                {getVal('typography.borderRadius')}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="24"
              value={parseInt(getVal('typography.borderRadius')) || 12}
              onChange={(e) => updateOverride('typography.borderRadius', `${e.target.value}px`)}
              className="w-full accent-[var(--color-primary)]"
            />
          </label>
        </div>
      </Section>

      {/* Effects */}
      <Section title="Effects" icon={Sparkles}>
        <div className="space-y-2">
          <ToggleSwitch
            label="Glassmorphism"
            checked={getVal('effects.glassmorphism')}
            onChange={(v) => updateOverride('effects.glassmorphism', v)}
          />
          <ToggleSwitch
            label="Neon Glow"
            checked={getVal('effects.neonGlow')}
            onChange={(v) => updateOverride('effects.neonGlow', v)}
          />
          <ToggleSwitch
            label="Animations"
            checked={getVal('effects.animations')}
            onChange={(v) => updateOverride('effects.animations', v)}
          />
        </div>
      </Section>

      {/* Forum Branding */}
      <Section title="Branding" icon={Sliders}>
        <div className="space-y-3">
          <label className="space-y-1">
            <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Forum Name</span>
            <input
              type="text"
              value={forumName}
              onChange={(e) => setForumName(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm border-0 outline-none"
              style={{
                backgroundColor: 'var(--color-surface-hover)',
                color: 'var(--color-text)',
              }}
              placeholder="IOTA Free Forum"
            />
          </label>

          <div className="space-y-1">
            <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Logo</span>
            <div className="flex items-center gap-3">
              {logoBase64 && (
                <img
                  src={logoBase64}
                  alt="Logo preview"
                  className="w-10 h-10 rounded-lg object-contain"
                  style={{ backgroundColor: 'var(--color-surface-hover)' }}
                />
              )}
              <label
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors"
                style={{
                  backgroundColor: 'var(--color-surface-hover)',
                  color: 'var(--color-text-muted)',
                }}
              >
                <Upload size={14} />
                Upload Logo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </Section>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <motion.button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all neon-border cursor-pointer"
          style={{
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-background)',
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <AnimatePresence mode="wait">
            {saving ? (
              <motion.span key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Loader2 size={16} className="animate-spin" />
              </motion.span>
            ) : saved ? (
              <motion.span key="saved" initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                <Check size={16} />
              </motion.span>
            ) : (
              <motion.span key="save" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Save size={16} />
              </motion.span>
            )}
          </AnimatePresence>
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Theme'}
        </motion.button>

        <motion.button
          onClick={resetToDefault}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all cursor-pointer"
          style={{
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text-muted)',
            border: '1px solid var(--color-border)',
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <RotateCcw size={16} />
          Reset
        </motion.button>
      </div>
    </div>
  );
}
