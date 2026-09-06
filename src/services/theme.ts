import { useState, useEffect } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

type ThemeListener = (theme: ThemeMode, isDark: boolean) => void;

class ThemeService {
  private currentMode: ThemeMode = 'light';
  private listeners: Set<ThemeListener> = new Set();
  private mediaQuery: MediaQueryList | null = null;

  constructor() {
    // Check initial saved theme from localStorage
    const saved = typeof window !== 'undefined' ? (localStorage.getItem('schoolsafe_theme') as ThemeMode | null) : null;
    if (saved && (saved === 'light' || saved === 'dark' || saved === 'system')) {
      this.currentMode = saved;
    } else {
      // Default to light
      this.currentMode = 'light';
    }

    if (typeof window !== 'undefined') {
      this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.mediaQuery.addEventListener('change', () => {
        if (this.currentMode === 'system') {
          this.applyTheme();
        }
      });
      this.applyTheme();
    }
  }

  public getMode(): ThemeMode {
    return this.currentMode;
  }

  public isDark(): boolean {
    if (this.currentMode === 'dark') return true;
    if (this.currentMode === 'light') return false;
    return this.mediaQuery ? this.mediaQuery.matches : false;
  }

  public setMode(mode: ThemeMode) {
    this.currentMode = mode;
    if (typeof window !== 'undefined') {
      localStorage.setItem('schoolsafe_theme', mode);
    }
    this.applyTheme();
    this.notify();
  }

  public toggle() {
    const currentlyDark = this.isDark();
    this.setMode(currentlyDark ? 'light' : 'dark');
  }

  public subscribe(listener: ThemeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private applyTheme() {
    if (typeof document === 'undefined') return;
    const dark = this.isDark();
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }

  private notify() {
    const dark = this.isDark();
    this.listeners.forEach((listener) => {
      try {
        listener(this.currentMode, dark);
      } catch (e) {
        console.error('Error notifying theme listener', e);
      }
    });
  }
}

export const themeService = new ThemeService();

export function useTheme() {
  const [mode, setModeState] = useState<ThemeMode>(() => themeService.getMode());
  const [isDark, setIsDarkState] = useState<boolean>(() => themeService.isDark());

  useEffect(() => {
    return themeService.subscribe((newMode, dark) => {
      setModeState(newMode);
      setIsDarkState(dark);
    });
  }, []);

  const setMode = (newMode: ThemeMode) => themeService.setMode(newMode);
  const toggle = () => themeService.toggle();

  return { mode, isDark, setMode, toggle };
}
