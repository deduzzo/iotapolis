import { motion } from 'framer-motion';
import { Check, Moon, Sun } from 'lucide-react';
import { themes } from '../data/themes';
import { useTheme } from '../hooks/useTheme';

function ColorDot({ color, label }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="w-6 h-6 rounded-full border border-white/10"
        style={{ backgroundColor: color }}
        title={label}
      />
      <span className="text-[10px] opacity-50">{label}</span>
    </div>
  );
}

function ThemeCard({ theme: preset }) {
  const { activeThemeId, setBaseTheme } = useTheme();
  const isSelected = activeThemeId === preset.id;

  return (
    <motion.button
      onClick={() => setBaseTheme(preset.id)}
      className="relative w-full text-left rounded-xl p-4 cursor-pointer border transition-all"
      style={{
        backgroundColor: preset.base.surface,
        borderColor: isSelected ? preset.accent.primary : preset.base.border,
        color: preset.base.text,
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{
        scale: 1.03,
        boxShadow: `0 0 20px ${preset.accent.primary}33`,
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      {/* Selected glow */}
      {isSelected && (
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            boxShadow: `0 0 15px ${preset.accent.primary}66, inset 0 0 15px ${preset.accent.primary}11`,
          }}
          layoutId="theme-glow"
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm" style={{ fontFamily: preset.typography.headingFamily }}>
          {preset.name}
        </h3>
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium"
            style={{
              backgroundColor: preset.category === 'dark'
                ? 'rgba(255,255,255,0.08)'
                : 'rgba(0,0,0,0.06)',
              color: preset.base.textMuted,
            }}
          >
            {preset.category === 'dark' ? (
              <span className="flex items-center gap-1"><Moon size={10} /> Dark</span>
            ) : (
              <span className="flex items-center gap-1"><Sun size={10} /> Light</span>
            )}
          </span>
          {isSelected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-5 h-5 rounded-full flex items-center justify-center"
              style={{ backgroundColor: preset.accent.primary }}
            >
              <Check size={12} style={{ color: preset.base.background }} />
            </motion.div>
          )}
        </div>
      </div>

      {/* Color palette preview */}
      <div className="flex items-center gap-3">
        <ColorDot color={preset.base.background} label="bg" />
        <ColorDot color={preset.base.surface} label="srf" />
        <ColorDot color={preset.accent.primary} label="pri" />
        <ColorDot color={preset.accent.secondary} label="sec" />
        <ColorDot color={preset.base.text} label="txt" />
      </div>

      {/* Preview bar */}
      <div
        className="mt-3 h-1.5 rounded-full overflow-hidden flex"
        style={{ backgroundColor: preset.base.background }}
      >
        <div className="flex-1" style={{ backgroundColor: preset.accent.primary }} />
        <div className="flex-1" style={{ backgroundColor: preset.accent.secondary }} />
        <div className="flex-1" style={{ backgroundColor: preset.accent.success }} />
        <div className="flex-1" style={{ backgroundColor: preset.accent.warning }} />
      </div>
    </motion.button>
  );
}

export default function ThemeGallery() {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
        Theme Presets
      </h2>
      <div className="grid grid-cols-1 gap-3">
        {themes.map((preset, i) => (
          <motion.div
            key={preset.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <ThemeCard theme={preset} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
