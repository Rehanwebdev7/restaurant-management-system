// ==========================================
// Theme Context - Access theme data in React components
// ==========================================

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getCurrentTheme,
  initializeTheme,
  refreshTheme,
  updateFavicon,
  getContrastColor,
  DEFAULT_THEME,
} from '../services/themeService';

// Create the context
const ThemeContext = createContext();

/**
 * Theme Provider Component
 * Wrap your app with this to provide theme data to all components
 */
export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(getCurrentTheme());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Reactive browser tab title — updates whenever restaurantName changes
  useEffect(() => {
    document.title = theme?.restaurantName
      ? `${theme.restaurantName}`
      : 'Restaurant App';
  }, [theme?.restaurantName]);

  // Reactive favicon — updates whenever feviconUrl changes
  useEffect(() => {
    updateFavicon(theme?.feviconUrl || null);
  }, [theme?.feviconUrl]);

  // Initialize theme on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        setLoading(true);
        const loadedTheme = await initializeTheme();
        setTheme(loadedTheme);
        setError(null);
      } catch (err) {
        console.error('Error loading theme:', err);
        setError(err);
        setTheme(DEFAULT_THEME);
      } finally {
        setLoading(false);
      }
    };

    loadTheme();
  }, []);

  /**
   * Refresh theme from API
   */
  const reloadTheme = async () => {
    try {
      setLoading(true);
      const newTheme = await refreshTheme();
      setTheme(newTheme);
      setError(null);
    } catch (err) {
      console.error('Error refreshing theme:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Context value
  const value = {
    theme,
    loading,
    error,
    reloadTheme,
    // Convenient getters for commonly used values
    logoUrl: theme?.logoUrl,
    feviconUrl: theme?.feviconUrl,
    restaurantName: theme?.restaurantName,
    primaryColor: theme?.primary,
    primaryContrast: getContrastColor(theme?.primary),
    secondaryColor: theme?.secondary,
    tertiaryColor: theme?.tertiary,
    fontName: theme?.fontName,
    fontColor: theme?.fontColor,
    restaurantId: theme?.restaurantId,
    socialMediaDetails: theme?.socialMediaDetails,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Custom hook to use theme context
 * @returns {Object} Theme context value
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
