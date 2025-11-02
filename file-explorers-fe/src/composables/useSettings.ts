export interface AppSettings {
  folderColor: string;
  iconSize: string;
  soundEnabled: boolean;
  animationsEnabled: boolean;
  showTips: boolean;
}

export const defaultSettings: AppSettings = {
  folderColor: 'default',
  iconSize: 'medium',
  soundEnabled: true,
  animationsEnabled: true,
  showTips: false,
};

export const folderColorMap: Record<string, string> = {
  default: '#294e26',
  blue: '#2563eb',
  purple: '#7c3aed',
  orange: '#ea580c',
  pink: '#db2777',
  teal: '#0d9488',
  yellow: '#ca8a04',
  red: '#dc2626',
};

/**
 * Load settings from localStorage
 */
export function loadSettings(): AppSettings {
  const saved = localStorage.getItem('fileExplorersSettings');
  if (saved) {
    try {
      const settings = JSON.parse(saved);
      return {
        folderColor: settings.folderColor || defaultSettings.folderColor,
        iconSize: settings.iconSize || defaultSettings.iconSize,
        soundEnabled: settings.soundEnabled !== undefined ? settings.soundEnabled : defaultSettings.soundEnabled,
        animationsEnabled: settings.animationsEnabled !== undefined ? settings.animationsEnabled : defaultSettings.animationsEnabled,
        showTips: settings.showTips !== undefined ? settings.showTips : defaultSettings.showTips,
      };
    } catch (error) {
      console.error('Failed to load settings:', error);
      return defaultSettings;
    }
  }
  return defaultSettings;
}

/**
 * Apply settings to the application (CSS variables, etc.)
 */
export function applySettings(settings: AppSettings): void {
  // Apply folder color
  const colorHex = folderColorMap[settings.folderColor] || folderColorMap.default;
  document.documentElement.style.setProperty('--primary', colorHex);

  // Apply icon size (you can add more logic here if needed)
  document.documentElement.setAttribute('data-icon-size', settings.iconSize);

  // Apply animations
  if (!settings.animationsEnabled) {
    document.documentElement.style.setProperty('--transition-duration', '0s');
  } else {
    document.documentElement.style.removeProperty('--transition-duration');
  }

  console.log('Settings applied:', settings);
}

/**
 * Initialize and apply settings on app startup
 */
export function initializeSettings(): AppSettings {
  const settings = loadSettings();
  applySettings(settings);
  return settings;
}

/**
 * Save settings to localStorage
 */
export function saveSettings(settings: AppSettings): void {
  localStorage.setItem('fileExplorersSettings', JSON.stringify(settings));
  applySettings(settings);
  
  // Dispatch custom event to notify other components
  window.dispatchEvent(new CustomEvent('settingsUpdated', { detail: settings }));
}
