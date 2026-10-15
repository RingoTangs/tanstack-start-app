import { SYSTEM_THEME_QUERY, THEME_STORAGE_KEY } from './theme'

const serialize = (value: string) =>
  JSON.stringify(value).replace(/</g, '\\u003c')

// Run in the head before the body is parsed; never overwrite saved preferences.
export const themeScript = `(() => {
  let theme = 'system';
  try {
    const stored = localStorage.getItem(${serialize(THEME_STORAGE_KEY)});
    if (stored === 'light' || stored === 'dark') theme = stored;
  } catch {}
  const dark = theme === 'dark' || (theme === 'system' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia(${serialize(SYSTEM_THEME_QUERY)}).matches);
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
})();`
