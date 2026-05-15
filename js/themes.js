export const THEME_STORAGE_KEY = 'sudoku-theme';

export const THEMES = ['light', 'dark', 'neon', 'pastel'];

export const THEME_LABELS = {
  light: 'Світла',
  dark: 'Темна',
  neon: 'Неонова',
  pastel: 'Пастельна'
};

export function getStoredTheme() {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return THEMES.includes(stored) ? stored : 'light';
  } catch {
    return 'light';
  }
}

export function applyTheme(theme) {
  const resolved = THEMES.includes(theme) ? theme : 'light';
  document.documentElement.setAttribute('data-theme', resolved);

  try {
    localStorage.setItem(THEME_STORAGE_KEY, resolved);
  } catch {
    /* ignore quota / private mode */
  }

  return resolved;
}

export function initTheme() {
  return applyTheme(getStoredTheme());
}
