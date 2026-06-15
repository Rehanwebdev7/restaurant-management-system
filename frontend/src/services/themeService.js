// ==========================================
// Theme Service - Fetch and Apply Theme from API
// ==========================================

import { server_api } from '../utils/constants';

// LocalStorage keys
const THEME_STORAGE_KEY = 'app_theme';
const THEME_DOMAIN_KEY = 'theme_domain'; // For testing with custom domain
const RESTAURANT_ID_KEY = 'CustomerRestaurantId'; // Store restaurant ID from API

// Default theme configuration (fallback when API fails)
export const DEFAULT_THEME = {
  primary: '#667eea',
  secondary: '#764ba2',
  tertiary: '#40E0D0',
  fontColor: '#334155',
  fontName: 'Inter',
  logoUrl: null,
  feviconUrl: null,
  restaurantName: 'Restaurant',
  restaurantId: 101,
  backgroundColor: '#f8fafc',
  headerColor: '#000000',
  buttonGradient: 'linear-gradient(135deg, #40E0D0 0%, #1cb8b0 100%)',
  buttonHoverGradient: 'linear-gradient(135deg, #1cb8b0 0%, #169c96 100%)',
  // Contact Info
  address: '',
  phone: '',
  alternatePhone: '',
  email: '',
};

const normalizeHex = (hex, fallback = DEFAULT_THEME.primary) => {
  if (typeof hex !== 'string') return fallback;
  const cleaned = hex.trim().replace('#', '');
  if (/^[0-9a-fA-F]{6}$/.test(cleaned)) {
    return `#${cleaned}`;
  }
  return fallback;
};

const blendHex = (from, to, ratio) => {
  const start = normalizeHex(from).replace('#', '');
  const end = normalizeHex(to).replace('#', '');
  const mix = Math.max(0, Math.min(1, ratio));

  const sr = parseInt(start.substring(0, 2), 16);
  const sg = parseInt(start.substring(2, 4), 16);
  const sb = parseInt(start.substring(4, 6), 16);
  const tr = parseInt(end.substring(0, 2), 16);
  const tg = parseInt(end.substring(2, 4), 16);
  const tb = parseInt(end.substring(4, 6), 16);

  const r = Math.round(sr + (tr - sr) * mix);
  const g = Math.round(sg + (tg - sg) * mix);
  const b = Math.round(sb + (tb - sb) * mix);

  return `#${[r, g, b].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
};

/**
 * Extract root domain from hostname (ignores subdomains)
 * Examples:
 *   localhost → localhost
 *   192.168.1.1 → 192.168.1.1
 *   admin.rms.com → rms.com
 *   test.admin.rms.com → rms.com
 *   uat.example.cloud → example.cloud
 * @returns {string} - Root domain name
 */
export const getDomainFromUrl = () => {
  const hostname = window.location.hostname;

  // Handle localhost
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'localhost';
  }

  // Handle IP addresses (IPv4) - return as-is
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(hostname)) {
    return hostname;
  }

  // Split hostname into parts
  const parts = hostname.split('.');

  // If only 2 parts or less (e.g., "example.com"), return as-is
  if (parts.length <= 2) {
    return hostname;
  }

  // Handle common country-code second-level domains (ccSLDs)
  // e.g., .co.uk, .com.au, .co.in, .org.uk, .net.au
  const ccSLDs = ['co', 'com', 'org', 'net', 'gov', 'edu', 'ac', 'or', 'ne'];
  const secondLast = parts[parts.length - 2];

  // Check if it's a ccSLD pattern (e.g., co.uk, com.au)
  if (parts.length >= 3 && ccSLDs.includes(secondLast) && parts[parts.length - 1].length === 2) {
    // Return last 3 parts for ccSLD domains (e.g., example.co.uk)
    return parts.slice(-3).join('.');
  }

  // For standard domains, return last 2 parts (e.g., rms.com)
  return parts.slice(-2).join('.');
};

/**
 * Set custom domain for theme (useful for testing)
 * @param {string} domain - Domain name (e.g., https://tajhotel.com)
 */
export const setThemeDomain = (domain) => {
  if (domain) {
    localStorage.setItem(THEME_DOMAIN_KEY, domain);
    console.log('Theme domain set to:', domain);
  }
};

/**
 * Clear custom domain (will use current URL)
 */
export const clearThemeDomain = () => {
  localStorage.removeItem(THEME_DOMAIN_KEY);
  console.log('Theme domain cleared, using current URL');
};

/**
 * Fetch theme from API based on domain name
 * @param {string} domainName - The domain name to fetch theme for
 * @returns {Promise<Object|null>} - Theme data or null if failed
 */
export const fetchThemeFromApi = async (domainName) => {
  try {
    const baseUrl = server_api();
    const encodedDomain = encodeURIComponent(domainName);
    const apiUrl = `${baseUrl}/api/global/theme/getByDomain?domainName=${encodedDomain}`;

    console.log('Fetching theme from:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const result = await response.json();
      if (result.Status === 'SUCCESS' && result.data) {
        console.log('Theme fetched successfully by domain:', result.data);
        return result.data;
      }
    }

    // Domain lookup failed - try fallback with restaurant ID from localStorage
    const savedRestId = localStorage.getItem(RESTAURANT_ID_KEY);
    if (savedRestId) {
      console.log('Domain lookup failed, trying getByRestId with:', savedRestId);
      const restIdUrl = `${baseUrl}/api/global/theme/getByRestId?restId=${savedRestId}`;
      const restIdResponse = await fetch(restIdUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (restIdResponse.ok) {
        const restIdResult = await restIdResponse.json();
        if (restIdResult.Status === 'SUCCESS' && restIdResult.data) {
          console.log('Theme fetched successfully by restId:', restIdResult.data);
          return restIdResult.data;
        }
      }
    }

    console.warn('Theme API: both domain and restId lookups failed');
    return null;
  } catch (error) {
    console.error('Error fetching theme from API:', error);
    return null;
  }
};

/**
 * Save theme data to localStorage
 * @param {Object} themeData - Theme data to save
 */
export const saveThemeToLocalStorage = (themeData) => {
  try {
    const themeToSave = {
      ...themeData,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(themeToSave));
    console.log('Theme saved to localStorage:', {
      primary: themeToSave.primary,
      secondary: themeToSave.secondary,
      tertiary: themeToSave.tertiary,
    });
  } catch (error) {
    console.error('Error saving theme to localStorage:', error);
  }
};

/**
 * Get theme data from localStorage
 * @returns {Object|null} - Theme data or null if not found
 */
export const getThemeFromLocalStorage = () => {
  try {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme) {
      return JSON.parse(savedTheme);
    }
    return null;
  } catch (error) {
    console.error('Error getting theme from localStorage:', error);
    return null;
  }
};

/**
 * Clear theme from localStorage
 */
export const clearThemeFromLocalStorage = () => {
  try {
    localStorage.removeItem(THEME_STORAGE_KEY);
    console.log('Theme cleared from localStorage');
  } catch (error) {
    console.error('Error clearing theme from localStorage:', error);
  }
};

/**
 * Map API response to theme object
 * @param {Object} apiData - API response data
 * @returns {Object} - Mapped theme object
 */
export const mapApiDataToTheme = (apiData) => {
  console.log('Raw API data received:', apiData);

  // Handle both 'primary' and 'primarys' field names from API
  const primaryColor = apiData.primarys || apiData.primary;
  const secondaryColor = apiData.secondary;
  const tertiaryColor = apiData.tertiary;

  console.log('Extracted colors from API:', { primaryColor, secondaryColor, tertiaryColor });

  const mappedTheme = {
    id: apiData.id,
    restaurantId: apiData.restaurantId?.id,
    restaurantName: apiData.restaurantName || DEFAULT_THEME.restaurantName,
    // Use API colors directly, only fallback to DEFAULT if not provided
    primary: primaryColor || DEFAULT_THEME.primary,
    secondary: secondaryColor || DEFAULT_THEME.secondary,
    tertiary: tertiaryColor || DEFAULT_THEME.tertiary,
    fontColor: apiData.fontColour || apiData.fontColor || DEFAULT_THEME.fontColor,
    fontName: apiData.fontName || DEFAULT_THEME.fontName,
    logoUrl: apiData.logoUrl || DEFAULT_THEME.logoUrl,
    feviconUrl: apiData.feviconUrl || DEFAULT_THEME.feviconUrl,
    backgroundColor: apiData.backgroundColor || DEFAULT_THEME.backgroundColor,
    headerColor: apiData.headerColor || DEFAULT_THEME.headerColor,
    buttonGradient: apiData.buttonGradient || DEFAULT_THEME.buttonGradient,
    buttonHoverGradient: apiData.buttonHoverGradient || DEFAULT_THEME.buttonHoverGradient,
    website: apiData.website,
    gstNumber: apiData.gstNumber,
    // Contact Info
    address: apiData.address || DEFAULT_THEME.address,
    phone: apiData.phone || DEFAULT_THEME.phone,
    whatsappNumber: apiData.whatsappNumber || null,
    alternatePhone: apiData.alternatePhone || DEFAULT_THEME.alternatePhone,
    email: apiData.email || apiData.restaurantId?.email || DEFAULT_THEME.email,
    // About Us Content
    aboutUs: apiData.aboutUs || null,
    ourMission: apiData.ourMission || null,
    ourVision: apiData.ourVision || null,
    // Store original API colors separately for reference
    apiColors: {
      primary: primaryColor,
      secondary: secondaryColor,
      tertiary: tertiaryColor,
    },
    // Social Media Details
    socialMediaDetails: apiData.socialMediaDetails || null,
  };

  console.log('Mapped theme object:', mappedTheme);
  return mappedTheme;
};

/**
 * Convert hex color to RGB values
 * @param {string} hex - Hex color (e.g., #667eea)
 * @returns {string} - RGB values as string (e.g., "102, 126, 234")
 */
const hexToRgb = (hex) => {
  // Remove # if present
  const cleanHex = hex.replace('#', '');

  // Parse hex values
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  return `${r}, ${g}, ${b}`;
};

/**
 * Darken a hex color by a percentage
 */
const darkenHex = (hex, percent) => {
  const clean = hex.replace('#', '');
  let r = parseInt(clean.substring(0, 2), 16);
  let g = parseInt(clean.substring(2, 4), 16);
  let b = parseInt(clean.substring(4, 6), 16);
  r = Math.max(0, Math.floor(r * (1 - percent / 100)));
  g = Math.max(0, Math.floor(g * (1 - percent / 100)));
  b = Math.max(0, Math.floor(b * (1 - percent / 100)));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

/**
 * Calculate WCAG relative luminance of a hex color
 * Returns a value between 0 (black) and 1 (white)
 */
const getLuminance = (hex) => {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  const toLinear = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
};

/**
 * Return #000000 or #ffffff — whichever has better contrast against the given hex color
 */
export const getContrastColor = (hex) => {
  if (!hex || typeof hex !== 'string') return '#ffffff';
  return getLuminance(hex) > 0.179 ? '#000000' : '#ffffff';
};

/**
 * Lighten a hex color by a percentage
 */
const lightenHex = (hex, percent) => {
  const clean = hex.replace('#', '');
  let r = parseInt(clean.substring(0, 2), 16);
  let g = parseInt(clean.substring(2, 4), 16);
  let b = parseInt(clean.substring(4, 6), 16);
  r = Math.min(255, Math.floor(r + (255 - r) * (percent / 100)));
  g = Math.min(255, Math.floor(g + (255 - g) * (percent / 100)));
  b = Math.min(255, Math.floor(b + (255 - b) * (percent / 100)));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

/**
 * Apply theme to CSS variables on document root
 * @param {Object} theme - Theme object to apply
 */
export const applyThemeToCSS = (theme) => {
  const root = document.documentElement;
  const primary = normalizeHex(theme.primary);
  const secondary = normalizeHex(theme.secondary, blendHex(primary, '#0f172a', 0.2));
  const tertiary = normalizeHex(theme.tertiary, blendHex(primary, '#14b8a6', 0.35));
  const softSurface = blendHex(primary, '#ffffff', 0.94);
  const softSurfaceAlt = blendHex(primary, '#f8fafc', 0.92);
  const primaryRgb = hexToRgb(primary);

  // Apply color variables (both hex and RGB for rgba usage)
  if (primary) {
    root.style.setProperty('--theme-primary', primary);
    root.style.setProperty('--theme-primary-rgb', primaryRgb);
    root.style.setProperty('--theme-primary-dark', darkenHex(primary, 15));
    root.style.setProperty('--theme-primary-light', lightenHex(primary, 30));
    // Aliases used by mesh-gradient tint system
    root.style.setProperty('--primary-color', primary);
    root.style.setProperty('--primary-color-rgb', primaryRgb);
    // Auto contrast: #000 on light primaries, #fff on dark primaries
    root.style.setProperty('--primary-color-contrast', getContrastColor(primary));
    root.style.setProperty('--theme-accent-soft', `rgba(${primaryRgb}, 0.10)`);
    root.style.setProperty('--theme-accent-subtle', `rgba(${primaryRgb}, 0.06)`);
    root.style.setProperty('--theme-accent-strong', `rgba(${primaryRgb}, 0.18)`);
    root.style.setProperty('--theme-surface', softSurface);
    root.style.setProperty('--theme-surface-alt', softSurfaceAlt);
    root.style.setProperty('--theme-border', `rgba(${primaryRgb}, 0.12)`);
    root.style.setProperty('--theme-shadow', `0 20px 60px rgba(${primaryRgb}, 0.15)`);
    root.style.setProperty('--theme-auth-gradient', `linear-gradient(135deg, ${primary} 0%, ${secondary} 58%, ${tertiary} 100%)`);
    root.style.setProperty('--theme-shell-gradient', `radial-gradient(circle at top left, rgba(${primaryRgb}, 0.18), transparent 30%), radial-gradient(circle at bottom right, rgba(${primaryRgb}, 0.12), transparent 28%)`);
  }
  if (theme.secondary) {
    root.style.setProperty('--theme-secondary', secondary);
    root.style.setProperty('--theme-secondary-rgb', hexToRgb(secondary));
  }
  if (theme.tertiary) {
    root.style.setProperty('--theme-tertiary', tertiary);
    root.style.setProperty('--theme-tertiary-rgb', hexToRgb(tertiary));
  }
  if (theme.fontColor) {
    root.style.setProperty('--theme-font-color', theme.fontColor);
    root.style.setProperty('--theme-font-color-rgb', hexToRgb(theme.fontColor));
  }
  // Compute tinted backgrounds — always driven by primary color so the
  // whole UI gets a visible wash of the primary hue.
  if (primary) {
    const _p  = primary.replace('#', '');
    const _pr = parseInt(_p.substring(0, 2), 16);
    const _pg = parseInt(_p.substring(2, 4), 16);
    const _pb = parseInt(_p.substring(4, 6), 16);
    const toHex = (c) => Math.min(255, Math.max(0, Math.round(c))).toString(16).padStart(2, '0');

    // Light-mode tinted bg: blend primary at 8% over #f8fafc (248, 250, 252)
    const lightBg = '#' + [
      248 * 0.92 + _pr * 0.08,
      250 * 0.92 + _pg * 0.08,
      252 * 0.92 + _pb * 0.08,
    ].map(toHex).join('');
    root.style.setProperty('--theme-background', lightBg);
    root.style.setProperty('--page-bg', lightBg);

    // Dark-mode tinted bg: blend primary at 10% over #0e0e16 (14, 14, 22)
    const darkBg = '#' + [
      14 * 0.90 + _pr * 0.10,
      14 * 0.90 + _pg * 0.10,
      22 * 0.90 + _pb * 0.10,
    ].map(toHex).join('');
    root.style.setProperty('--theme-background-dark', darkBg);
  }
  if (theme.headerColor) {
    root.style.setProperty('--theme-header-color', theme.headerColor);
  }

  // Apply button gradients
  if (theme.buttonGradient) {
    root.style.setProperty('--theme-button-color', theme.buttonGradient);
  }
  if (theme.buttonHoverGradient) {
    root.style.setProperty('--theme-button-hover', theme.buttonHoverGradient);
  }

  // Apply font family
  if (theme.fontName) {
    root.style.setProperty('--theme-font-family', `'${theme.fontName}', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`);
    document.body.style.fontFamily = `'${theme.fontName}', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
  }
  // Apply font size
  if (theme.fontSize) {
    root.style.setProperty('--theme-font-size', theme.fontSize);
    document.body.style.fontSize = theme.fontSize;
  }
  // Apply font weight
  if (theme.fontWeight) {
    root.style.setProperty('--theme-font-weight', theme.fontWeight);
    document.body.style.fontWeight = theme.fontWeight;
  }

  // Apply favicon (falls back to neutral app icon)
  updateFavicon(theme.feviconUrl || null);

  // Update browser tab title
  document.title = theme.restaurantName
    ? `${theme.restaurantName}`
    : 'Restaurant App';

  root.dataset.brandTone = theme.restaurantName ? 'tenant' : 'default';
  root.dataset.themeShell = theme.restaurantName ? 'branded' : 'default';

  console.log('Theme applied to CSS variables');
};

/**
 * Update favicon dynamically
 * @param {string} faviconUrl - URL of the favicon
 */
export const updateFavicon = (faviconUrl) => {
  try {
    const href = faviconUrl || '/app-favicon.svg';

    // Update existing favicon links rather than removing/recreating them
    // (avoids flickering on hot-reload and re-theme)
    const iconLink = document.querySelector("link[rel='icon'], link[rel='shortcut icon']");
    const appleLink = document.querySelector("link[rel='apple-touch-icon']");

    if (iconLink) {
      iconLink.href = href;
    } else {
      const link = document.createElement('link');
      link.type = 'image/x-icon';
      link.rel = 'shortcut icon';
      link.href = href;
      document.head.appendChild(link);
    }

    if (appleLink) {
      appleLink.href = href;
    } else {
      const link = document.createElement('link');
      link.rel = 'apple-touch-icon';
      link.href = href;
      document.head.appendChild(link);
    }

    console.log('Favicon updated:', href);
  } catch (error) {
    console.error('Error updating favicon:', error);
  }
};

/**
 * Fetch theme by restaurant ID directly
 * Used when a user is logged in and we know their restaurant ID
 */
const fetchThemeByRestId = async (restId) => {
  try {
    const baseUrl = server_api();
    const apiUrl = `${baseUrl}/api/global/theme/getByRestId?restId=${restId}`;
    console.log('Fetching theme by restId:', apiUrl);
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (response.ok) {
      const result = await response.json();
      if (result.Status === 'SUCCESS' && result.data) {
        console.log('Theme fetched successfully by restId:', result.data);
        return result.data;
      }
    }
    return null;
  } catch (error) {
    console.error('Error fetching theme by restId:', error);
    return null;
  }
};

/**
 * Initialize theme - main function to call on app load
 * Fetches from API, saves to localStorage, and applies to CSS
 * Falls back to localStorage or default theme if API fails
 *
 * Priority: logged-in user's restaurant ID > domain lookup > cached > default
 */
export const initializeTheme = async () => {
  try {
    const domainName = getDomainFromUrl();
    console.log('Initializing theme for domain:', domainName);

    // If a user is logged in, prefer their restaurant's theme over domain-based lookup
    // This ensures impersonated/restaurant users see their own theme on shared domains
    let apiData = null;
    const loggedInUser = localStorage.getItem('user');
    if (loggedInUser) {
      try {
        const user = JSON.parse(loggedInUser);
        const userId = user?.id || localStorage.getItem('UserId');
        // userType from login, role from impersonation/refresh
        const userRole = user?.userType || user?.role || localStorage.getItem('UserRole');
        // Only restaurant users use direct restId lookup.
        // Branch/kitchen/cashier/delivery screens should not force a global theme API call here,
        // because many deployments do not expose /api/global/theme/getByRestId for those roles.
        if (userId && userRole === 'restaurant') {
          console.log('Logged-in restaurant user detected, fetching theme by restId:', userId);
          apiData = await fetchThemeByRestId(userId);
        }
      } catch (e) {
        console.warn('Could not parse logged-in user for theme lookup:', e);
      }
    }

    // Fall back to domain-based lookup if no user-specific theme found
    if (!apiData) {
      apiData = await fetchThemeFromApi(domainName);
    }

    if (apiData) {
      // API succeeded - map data, save to localStorage, and apply
      console.log('API data received successfully, mapping theme...');
      const theme = mapApiDataToTheme(apiData);

      // Save restaurantId to localStorage
      if (apiData.restaurantId?.id) {
        localStorage.setItem(RESTAURANT_ID_KEY, apiData.restaurantId.id);
        console.log('Restaurant ID saved to localStorage:', apiData.restaurantId.id);
      }

      // Clear old theme first to ensure fresh data
      clearThemeFromLocalStorage();

      // Save new theme from API
      saveThemeToLocalStorage(theme);

      // Apply theme with primary color as main theme color
      applyThemeToCSS(theme);

      console.log('Theme initialized from API with colors:', {
        primary: theme.primary,
        secondary: theme.secondary,
        tertiary: theme.tertiary,
      });

      return theme;
    } else {
      // API failed - try to use cached theme from localStorage
      console.log('API failed, trying localStorage...');
      const cachedTheme = getThemeFromLocalStorage();

      if (cachedTheme) {
        console.log('Using cached theme from localStorage');
        applyThemeToCSS(cachedTheme);
        return cachedTheme;
      } else {
        // No cached theme - use default
        console.log('No cached theme, using default theme');
        applyThemeToCSS(DEFAULT_THEME);
        return DEFAULT_THEME;
      }
    }
  } catch (error) {
    console.error('Error initializing theme:', error);
    // On any error, apply default theme
    applyThemeToCSS(DEFAULT_THEME);
    return DEFAULT_THEME;
  }
};

/**
 * Get current theme (from localStorage or default)
 * @returns {Object} - Current theme
 */
export const getCurrentTheme = () => {
  const savedTheme = getThemeFromLocalStorage();
  return savedTheme || DEFAULT_THEME;
};

/**
 * Force refresh theme from API
 * Useful when user wants to get latest theme
 */
export const refreshTheme = async () => {
  clearThemeFromLocalStorage();
  return await initializeTheme();
};

/**
 * Get restaurant ID from localStorage
 * @returns {string|null} - Restaurant ID or null if not found
 */
export const getRestaurantId = () => {
  return localStorage.getItem(RESTAURANT_ID_KEY);
};
