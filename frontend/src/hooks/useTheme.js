import { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  const {
    theme,
    activeThemeId,
    userThemeId,
    forumThemeId,
    overrides,
    forumName,
    logoBase64,
    setBaseTheme,
    setUserTheme,
    setOverrides,
    setForumName,
    setLogoBase64,
    saveTheme,
    resetToDefault,
  } = ctx;

  return {
    theme,
    activeThemeId,
    userThemeId,
    forumThemeId,
    overrides,
    forumName,
    logoBase64,
    setBaseTheme,
    setUserTheme,
    setOverrides,
    setForumName,
    setLogoBase64,
    saveTheme,
    resetToDefault,
  };
}
