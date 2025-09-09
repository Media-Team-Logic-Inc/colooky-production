import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark' | 'auto';
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<'light' | 'dark' | 'auto'>('dark');
  const [isLoaded, setIsLoaded] = useState(false);

  // Apply theme to document
  const applyTheme = (newTheme: 'light' | 'dark' | 'auto') => {
    if (typeof window === 'undefined') return;

    // Remove existing theme classes
    document.documentElement.classList.remove('dark', 'light');
    document.body.classList.remove('bg-slate-900', 'bg-white', 'text-white', 'text-slate-900');

    if (newTheme === 'light') {
      // Apply light theme
      document.documentElement.classList.add('light');
      document.body.classList.add('bg-white', 'text-slate-900');
      
      // Update CSS variables for light mode
      document.documentElement.style.setProperty('--background', '#ffffff');
      document.documentElement.style.setProperty('--foreground', '#0f172a');
      document.documentElement.style.setProperty('--card', '#f8fafc');
      document.documentElement.style.setProperty('--card-foreground', '#0f172a');
      document.documentElement.style.setProperty('--popover', '#ffffff');
      document.documentElement.style.setProperty('--popover-foreground', '#0f172a');
      document.documentElement.style.setProperty('--primary', '#0f172a');
      document.documentElement.style.setProperty('--primary-foreground', '#f8fafc');
      document.documentElement.style.setProperty('--secondary', '#f1f5f9');
      document.documentElement.style.setProperty('--secondary-foreground', '#0f172a');
      document.documentElement.style.setProperty('--muted', '#f1f5f9');
      document.documentElement.style.setProperty('--muted-foreground', '#64748b');
      document.documentElement.style.setProperty('--accent', '#f1f5f9');
      document.documentElement.style.setProperty('--accent-foreground', '#0f172a');
      document.documentElement.style.setProperty('--destructive', '#ef4444');
      document.documentElement.style.setProperty('--destructive-foreground', '#f8fafc');
      document.documentElement.style.setProperty('--border', '#e2e8f0');
      document.documentElement.style.setProperty('--input', '#e2e8f0');
      document.documentElement.style.setProperty('--ring', '#94a3b8');
      
    } else if (newTheme === 'auto') {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        applyDarkTheme();
      } else {
        // Apply light theme for auto mode when system prefers light
        document.documentElement.classList.add('light');
        document.body.classList.add('bg-white', 'text-slate-900');
      }
    } else {
      // Apply dark theme (default)
      applyDarkTheme();
    }
  };

  const applyDarkTheme = () => {
    document.documentElement.classList.add('dark');
    document.body.classList.add('bg-slate-900', 'text-white');
    
    // Reset CSS variables to default (dark mode)
    document.documentElement.style.removeProperty('--background');
    document.documentElement.style.removeProperty('--foreground');
    // ... remove other custom properties to let Tailwind defaults take over
  };

  // Set theme and save to localStorage
  const setTheme = (newTheme: 'light' | 'dark' | 'auto') => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('colooky_theme', newTheme);
    }
  };

  // Load theme from localStorage and Supabase on mount
  useEffect(() => {
    const loadTheme = async () => {
      if (typeof window === 'undefined') return;

      try {
        // Try to load from API first (Supabase)
        const response = await fetch('/api/user/settings');
        if (response.ok) {
          const settings = await response.json();
          if (settings?.theme) {
            setThemeState(settings.theme);
            applyTheme(settings.theme);
            console.log('✅ Theme loaded from Supabase:', settings.theme);
            setIsLoaded(true);
            return;
          }
        }
      } catch (error) {
        console.log('📦 Supabase theme loading failed, using localStorage fallback');
      }

      // Fallback to localStorage
      const savedTheme = localStorage.getItem('colooky_theme');
      const finalTheme = (savedTheme as 'light' | 'dark' | 'auto') || 'dark';
      
      setThemeState(finalTheme);
      applyTheme(finalTheme);
      console.log('✅ Theme loaded from localStorage:', finalTheme);
      setIsLoaded(true);
    };

    loadTheme();
  }, []);

  // Listen for system theme changes when in auto mode
  useEffect(() => {
    if (theme !== 'auto') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => applyTheme('auto');
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Don't render children until theme is loaded to prevent flash
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}