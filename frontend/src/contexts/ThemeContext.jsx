import { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { themes } from '../data/themes';

export const ThemeContext = createContext(null);

const FONT_URLS = {
  'Inter': 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  'Space Grotesk': 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap',
  'JetBrains Mono': 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&display=swap',
  'Outfit': 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap',
  'Orbitron': 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&display=swap',
  'IBM Plex Sans': 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap',
};

function loadFont(fontName) {
  const url = FONT_URLS[fontName];
  if (!url) return;
  const id = `font-${fontName.replace(/\s+/g, '-').toLowerCase()}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = url;
  document.head.appendChild(link);
}

function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      target[key] &&
      typeof target[key] === 'object'
    ) {
      result[key] = deepMerge(target[key], source[key]);
    } else if (source[key] !== undefined && source[key] !== null && source[key] !== '') {
      result[key] = source[key];
    }
  }
  return result;
}

function resolveTheme(baseTheme, overrides) {
  if (!overrides || Object.keys(overrides).length === 0) return baseTheme;
  return deepMerge(baseTheme, overrides);
}

function applyThemeToRoot(theme) {
  const root = document.documentElement;
  const { base, accent, typography, effects } = theme;

  root.style.setProperty('--color-background', base.background);
  root.style.setProperty('--color-surface', base.surface);
  root.style.setProperty('--color-surface-hover', base.surfaceHover);
  root.style.setProperty('--color-border', base.border);
  root.style.setProperty('--color-text', base.text);
  root.style.setProperty('--color-text-muted', base.textMuted);

  root.style.setProperty('--color-primary', accent.primary);
  root.style.setProperty('--color-secondary', accent.secondary);
  root.style.setProperty('--color-success', accent.success);
  root.style.setProperty('--color-warning', accent.warning);
  root.style.setProperty('--color-danger', accent.danger);

  const fontFamily = `'${typography.fontFamily}', system-ui, sans-serif`;
  const headingFamily = typography.headingFamily !== typography.fontFamily
    ? `'${typography.headingFamily}', '${typography.fontFamily}', system-ui, sans-serif`
    : fontFamily;

  root.style.setProperty('--font-family', fontFamily);
  root.style.setProperty('--font-heading', headingFamily);
  root.style.setProperty('--border-radius', typography.borderRadius);

  root.style.setProperty('--glassmorphism', effects.glassmorphism ? '1' : '0');
  root.style.setProperty('--neon-glow', effects.neonGlow ? '1' : '0');

  // Load required fonts
  loadFont(typography.fontFamily);
  if (typography.headingFamily !== typography.fontFamily) {
    loadFont(typography.headingFamily);
  }
}

export function ThemeProvider({ children }) {
  const [activeThemeId, setActiveThemeId] = useState('neon-cyber');
  const [overrides, setOverrides] = useState({});
  const [forumName, setForumName] = useState('IOTA Free Forum');
  const [logoBase64, setLogoBase64] = useState(null);

  const activeTheme = useMemo(
    () => themes.find((t) => t.id === activeThemeId) || themes[0],
    [activeThemeId],
  );

  const resolvedTheme = useMemo(
    () => resolveTheme(activeTheme, overrides),
    [activeTheme, overrides],
  );

  // Fetch saved theme config on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/v1/config/theme');
        if (!res.ok) throw new Error('No saved theme');
        const config = await res.json();
        if (config.themeId && themes.some((t) => t.id === config.themeId)) {
          setActiveThemeId(config.themeId);
        }
        if (config.overrides) setOverrides(config.overrides);
        if (config.forumName) setForumName(config.forumName);
        if (config.logoBase64) setLogoBase64(config.logoBase64);
      } catch {
        // Default to neon-cyber with no overrides
      }
    })();
  }, []);

  // Apply CSS custom properties whenever resolvedTheme changes
  useEffect(() => {
    applyThemeToRoot(resolvedTheme);
  }, [resolvedTheme]);

  const setBaseTheme = useCallback((themeId) => {
    setActiveThemeId(themeId);
  }, []);

  const saveTheme = useCallback(async () => {
    try {
      const payload = {
        themeId: activeThemeId,
        overrides,
        forumName,
        logoBase64,
      };
      const res = await fetch('/api/v1/config/theme', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to save theme');
      return true;
    } catch (err) {
      console.error('Failed to save theme:', err);
      return false;
    }
  }, [activeThemeId, overrides, forumName, logoBase64]);

  const resetToDefault = useCallback(() => {
    setActiveThemeId('neon-cyber');
    setOverrides({});
    setForumName('IOTA Free Forum');
    setLogoBase64(null);
  }, []);

  const value = useMemo(
    () => ({
      theme: resolvedTheme,
      activeThemeId,
      overrides,
      forumName,
      logoBase64,
      setBaseTheme,
      setOverrides,
      setForumName,
      setLogoBase64,
      saveTheme,
      resetToDefault,
    }),
    [resolvedTheme, activeThemeId, overrides, forumName, logoBase64, setBaseTheme, setOverrides, setForumName, setLogoBase64, saveTheme, resetToDefault],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
