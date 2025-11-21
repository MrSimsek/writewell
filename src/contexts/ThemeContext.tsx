'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '@/lib/storage';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'writewell-theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Initialize theme from localStorage if available
    if (typeof window !== 'undefined') {
      try {
        const savedTheme = storage.get<Theme>(THEME_STORAGE_KEY);
        if (savedTheme === 'dark' || savedTheme === 'light') {
          return savedTheme;
        }
      } catch (error) {
        // If parsing fails, try reading as plain string
        const plainTheme = localStorage.getItem(THEME_STORAGE_KEY);
        if (plainTheme === 'dark' || plainTheme === 'light') {
          return plainTheme as Theme;
        }
      }
    }
    return 'dark';
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Apply theme to document immediately
    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(theme);
    
    // Save to localStorage
    storage.set(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

