export interface AppSettings {
    folderColor: string;
    textColor: string;
    iconSize: string;
    soundEnabled: boolean;
    animationsEnabled: boolean;
    showTips: boolean;
    fancyIcons: boolean;
}

export const defaultSettings: AppSettings = {
    folderColor: "default",
    textColor: "light",
    iconSize: "medium",
    soundEnabled: true,
    animationsEnabled: true,
    showTips: false,
    fancyIcons: false,
};

export const folderColorMap: Record<string, string> = {
    default: "#294e26",
    black: "#333333",
    blue: "#2563eb",
    purple: "#7c3aed",
    orange: "#ea580c",
    pink: "#db2777",
    teal: "#0d9488",
    yellow: "#ca8a04",
    red: "#dc2626",
};

export const textColorMap: Record<string, string> = {
    light: "#ffffff",
    warm: "#ffe4b5",
    cool: "#b0e0e6",
    neutral: "#e0e0e0",
};

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16),
          }
        : null;
}

/**
 * Darken a color by a percentage
 */
function darkenColor(hex: string, percent: number): string {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;

    const r = Math.max(0, Math.floor(rgb.r * (1 - percent)));
    const g = Math.max(0, Math.floor(rgb.g * (1 - percent)));
    const b = Math.max(0, Math.floor(rgb.b * (1 - percent)));

    return `#${r.toString(16).padStart(2, "0")}${g
        .toString(16)
        .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

/**
 * Adjust text color brightness
 */
function adjustTextBrightness(hex: string, percent: number): string {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;

    const r = Math.min(255, Math.floor(rgb.r * (1 + percent)));
    const g = Math.min(255, Math.floor(rgb.g * (1 + percent)));
    const b = Math.min(255, Math.floor(rgb.b * (1 + percent)));

    return `#${r.toString(16).padStart(2, "0")}${g
        .toString(16)
        .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

/**
 * Load settings from localStorage
 */
export function loadSettings(): AppSettings {
    const saved = localStorage.getItem("fileExplorersSettings");
    if (saved) {
        try {
            const settings = JSON.parse(saved);
            return {
                folderColor:
                    settings.folderColor || defaultSettings.folderColor,
                textColor: settings.textColor || defaultSettings.textColor,
                iconSize: settings.iconSize || defaultSettings.iconSize,
                soundEnabled:
                    settings.soundEnabled !== undefined
                        ? settings.soundEnabled
                        : defaultSettings.soundEnabled,
                animationsEnabled:
                    settings.animationsEnabled !== undefined
                        ? settings.animationsEnabled
                        : defaultSettings.animationsEnabled,
                showTips:
                    settings.showTips !== undefined
                        ? settings.showTips
                        : defaultSettings.showTips,
                fancyIcons:
                    settings.fancyIcons !== undefined
                        ? settings.fancyIcons
                        : defaultSettings.fancyIcons,
            };
        } catch (error) {
            console.error("Failed to load settings:", error);
            return defaultSettings;
        }
    }
    return defaultSettings;
}

/**
 * Apply settings to the application (CSS variables, etc.)
 */
export function applySettings(settings: AppSettings): void {
    // Apply folder color and generate darker variations
    const colorHex =
        folderColorMap[settings.folderColor] || folderColorMap.default;
    document.documentElement.style.setProperty("--primary", colorHex);
    document.documentElement.style.setProperty(
        "--background-secondary",
        darkenColor(colorHex, 0.3)
    );
    document.documentElement.style.setProperty(
        "--element-background",
        darkenColor(colorHex, 0.5)
    );
    document.documentElement.style.setProperty(
        "--border-color",
        darkenColor(colorHex, 0.6)
    );
    document.documentElement.style.setProperty(
        "--accent",
        darkenColor(colorHex, -0.6)
    );
    document.documentElement.style.setProperty(
        "--focusAccent",
        darkenColor(colorHex, -0.9)
    );
    document.documentElement.style.setProperty(
        "--activeAccent",
        darkenColor(colorHex, -0.6)
    );
    // Apply text color and generate variations
    const textHex = textColorMap[settings.textColor] || textColorMap.light;
    const secondaryTextHex = darkenColor(textHex, 0.3);

    document.documentElement.style.setProperty("--text", textHex);
    document.documentElement.style.setProperty(
        "--secondary-text",
        secondaryTextHex
    );

    console.log("Applying text colors:", {
        textColor: settings.textColor,
        primaryText: textHex,
        secondaryText: secondaryTextHex,
    });

    // Apply icon size
    document.documentElement.setAttribute("data-icon-size", settings.iconSize);
    
    // Apply grid sizing based on icon size
    const gridSizeMap: Record<string, string> = {
        small: '80px',
        medium: '110px',
        large: '140px'
    };
    const gridSize = gridSizeMap[settings.iconSize] || gridSizeMap.medium;
    document.documentElement.style.setProperty("--grid-item-size", gridSize);

    // Apply animations
    if (!settings.animationsEnabled) {
        document.documentElement.style.setProperty(
            "--transition-duration",
            "0s"
        );
    } else {
        document.documentElement.style.removeProperty("--transition-duration");
    }

    console.log("Settings applied:", settings);
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
    localStorage.setItem("fileExplorersSettings", JSON.stringify(settings));
    applySettings(settings);

    // Dispatch custom event to notify other components
    window.dispatchEvent(
        new CustomEvent("settingsUpdated", { detail: settings })
    );
}
