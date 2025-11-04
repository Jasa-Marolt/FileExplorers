<template>
  <div class="settings-container">
    <div class="settings-header">
      <h1>Settings</h1>
      <p class="subtitle">Customize your experience</p>
    </div>

    <div class="settings-content">
      <!-- Appearance Settings -->
      <div class="settings-section">
        <h2>Appearance</h2>
        
        <div class="setting-card">
          <div class="setting-info">
            <h3>Theme Color</h3>
            <p>Choose your theme color - backgrounds will be automatically adjusted</p>
          </div>
          <div class="setting-control">
            <div class="color-options">
              <button
                v-for="color in folderColors"
                :key="color.value"
                :class="['color-btn', { active: selectedFolderColor === color.value }]"
                :style="{ backgroundColor: color.hex }"
                @click="selectFolderColor(color.value)"
                :title="color.name"
              >
                <i v-if="selectedFolderColor === color.value" class="pi pi-check"></i>
              </button>
            </div>
          </div>
        </div>

        <div class="setting-card">
          <div class="setting-info">
            <h3>Text Color</h3>
            <p>Choose your preferred text color scheme</p>
          </div>
          <div class="setting-control">
            <div class="color-options">
              <button
                v-for="color in textColors"
                :key="color.value"
                :class="['color-btn', { active: selectedTextColor === color.value }]"
                :style="{ backgroundColor: color.hex }"
                @click="selectTextColor(color.value)"
                :title="color.name"
              >
                <i v-if="selectedTextColor === color.value" class="pi pi-check" style="color:#333;"></i>
              </button>
            </div>
          </div>
        </div>

        <div class="setting-card">
          <div class="setting-info">
            <h3>File Icon Size</h3>
            <p>Adjust the size of file and folder icons</p>
          </div>
          <div class="setting-control">
            <select v-model="iconSize" class="select-input">
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
        </div>

        <div class="setting-card">
          <div class="setting-info">
            <h3>Fancy Icons</h3>
            <p>Use colorful modern icons instead of simple ones</p>
          </div>
          <div class="setting-control">
            <label class="toggle-switch">
              <input type="checkbox" v-model="fancyIcons">
              <span class="slider"></span>
            </label>
          </div>
        </div>
      </div>

      <!-- Game Settings -->
      <div class="settings-section">
        <h2>Game Settings</h2>
        
        <div class="setting-card">
          <div class="setting-info">
            <h3>Sound Effects</h3>
            <p>Enable or disable sound effects</p>
          </div>
          <div class="setting-control">
            <label class="toggle-switch">
              <input type="checkbox" v-model="soundEnabled">
              <span class="slider"></span>
            </label>
          </div>
        </div>
        <!--
        <div class="setting-card">
          <div class="setting-info">
            <h3>Show Tips</h3>
            <p>Display helpful tips during gameplay</p>
          </div>
          <div class="setting-control">
            <label class="toggle-switch">
              <input type="checkbox" v-model="showTips">
              <span class="slider"></span>
            </label>
          </div>
        </div>
        -->
      </div>
    
      <!-- Action Buttons -->
      <div class="settings-actions">
        <button @click="saveSettings" class="btn btn-primary">
          <i class="pi pi-check"></i>
          Save Settings
        </button>
        <button @click="resetSettings" class="btn btn-secondary">
          <i class="pi pi-refresh"></i>
          Reset to Default
        </button>
      </div>

      <div v-if="saveMessage" class="save-message" :class="{ success: saveSuccess }">
        {{ saveMessage }}
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { loadSettings, saveSettings as saveSetting, defaultSettings, folderColorMap } from '@/composables/useSettings';

// Settings state
const selectedFolderColor = ref('default');
const selectedTextColor = ref('light');
const iconSize = ref('medium');
const soundEnabled = ref(true);
const animationsEnabled = ref(true);
const showTips = ref(false);
const fancyIcons = ref(false);
const saveMessage = ref('');
const saveSuccess = ref(false);

// Color options
const folderColors = [
  { name: 'Default Green', value: 'default', hex: '#294e26' },
  { name: 'Black', value: 'black', hex: '#333333' },
  { name: 'Blue', value: 'blue', hex: '#2563eb' },
  { name: 'Purple', value: 'purple', hex: '#7c3aed' },
  { name: 'Orange', value: 'orange', hex: '#ea580c' },
  { name: 'Pink', value: 'pink', hex: '#db2777' },
  { name: 'Teal', value: 'teal', hex: '#0d9488' },
  { name: 'Yellow', value: 'yellow', hex: '#ca8a04' },
  { name: 'Red', value: 'red', hex: '#dc2626' },
];

const textColors = [
  { name: 'White', value: 'light', hex: '#ffffff' },
  { name: 'Warm Beige', value: 'warm', hex: '#ffe4b5' },
  { name: 'Cool Blue', value: 'cool', hex: '#b0e0e6' },
  { name: 'Gray', value: 'neutral', hex: '#e0e0e0' },
  { name: 'Neon Green', value: 'neon_green', hex: '#00ff00' },
];

const selectFolderColor = (color: string) => {
  selectedFolderColor.value = color;
  applyColors();
};

const selectTextColor = (color: string) => {
  selectedTextColor.value = color;
  applyColors();
};

const applyColors = () => {
  const settings = {
    folderColor: selectedFolderColor.value,
    textColor: selectedTextColor.value,
    iconSize: iconSize.value,
    soundEnabled: soundEnabled.value,
    animationsEnabled: animationsEnabled.value,
    showTips: showTips.value,
    fancyIcons: fancyIcons.value,
  };
  saveSetting(settings);
};

const saveSettings = () => {
  applyColors();
  
  saveMessage.value = 'Settings saved successfully!';
  saveSuccess.value = true;
  
  setTimeout(() => {
    saveMessage.value = '';
  }, 3000);
};

const resetSettings = () => {
  selectedFolderColor.value = defaultSettings.folderColor;
  selectedTextColor.value = defaultSettings.textColor;
  iconSize.value = defaultSettings.iconSize;
  soundEnabled.value = defaultSettings.soundEnabled;
  animationsEnabled.value = defaultSettings.animationsEnabled;
  showTips.value = defaultSettings.showTips;
  fancyIcons.value = defaultSettings.fancyIcons;

  localStorage.removeItem('fileExplorersSettings');
  
  // Apply default settings
  saveSetting(defaultSettings);

  saveMessage.value = 'Settings reset to default';
  saveSuccess.value = true;

  setTimeout(() => {
    saveMessage.value = '';
  }, 3000);
};

const loadSettingsFromStorage = () => {
  const settings = loadSettings();
  selectedFolderColor.value = settings.folderColor;
  selectedTextColor.value = settings.textColor;
  iconSize.value = settings.iconSize;
  soundEnabled.value = settings.soundEnabled;
  animationsEnabled.value = settings.animationsEnabled;
  fancyIcons.value = settings.fancyIcons;
  showTips.value = settings.showTips;

  // Apply colors immediately
  applyColors();
};

onMounted(() => {
  loadSettingsFromStorage();
});
</script>

<style scoped lang="scss">
.settings-container {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  padding: 40px 20px;
  color: var(--text);
}

.settings-header {
  text-align: center;
  margin-bottom: 40px;

  h1 {
    font-size: 48px;
    margin: 0 0 10px 0;
    color: var(--text);
  }

  .subtitle {
    font-size: 20px;
    color: var(--secondary-text);
    margin: 0;
  }
}

.settings-content {
  max-width: 900px;
  margin: 0 auto;
}

.settings-section {
  margin-bottom: 40px;

  h2 {
    font-size: 28px;
    margin-bottom: 20px;
    color: var(--text);
    padding-bottom: 10px;
    border-bottom: 2px solid var(--border-color);
  }
}

.setting-card {
  background: var(--element-background);
  border: 2px solid var(--border-color);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  transition: all 0.3s ease;

  &:hover {
    border-color: var(--primary);
  }
}

.setting-info {
  flex: 1;

  h3 {
    font-size: 20px;
    margin: 0 0 8px 0;
    color: var(--text);
  }

  p {
    margin: 0;
    color: var(--secondary-text);
    font-size: 14px;
  }
}

.setting-control {
  flex-shrink: 0;
}

.color-options {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.color-btn {
  width: 50px;
  height: 50px;
  border: 3px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    transform: scale(1.1);
    border-color: var(--text);
  }

  &.active {
    border-color: var(--text);
    border-width: 4px;

    i {
      color: var(--text);
      font-size: 24px;
      text-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
    }
  }
}

.select-input {
  padding: 10px 16px;
  background: var(--background-secondary);
  color: var(--text);
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  min-width: 150px;

  &:focus {
    outline: none;
    border-color: var(--primary);
  }
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;

  input {
    opacity: 0;
    width: 0;
    height: 0;

    &:checked + .slider {
      background-color: var(--primary);
    }

    &:checked + .slider:before {
      transform: translateX(26px);
    }
  }

  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--background-secondary);
    border: 2px solid var(--border-color);
    transition: 0.4s;
    border-radius: 34px;

    &:before {
      position: absolute;
      content: "";
      height: 20px;
      width: 20px;
      left: 5px;
      bottom: 5px;
      background-color: var(--text);
      transition: 0.4s;
      border-radius: 50%;
    }
  }
}

.settings-actions {
  display: flex;
  gap: 16px;
  margin-top: 40px;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  padding: 14px 28px;
  border: none;
  border-radius: 8px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    transform: translateY(-2px);
  }
}

.btn-primary {
  background: var(--primary);
  color: var(--text);
  border: 2px solid var(--border-color);

  &:hover {
    box-shadow: 0 4px 12px rgba(41, 78, 38, 0.4);
  }
}

.btn-secondary {
  background: var(--element-background);
  color: var(--text);
  border: 2px solid var(--border-color);

  &:hover {
    background: var(--background-secondary);
  }
}

.save-message {
  text-align: center;
  padding: 16px;
  margin-top: 20px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  background: rgba(220, 53, 69, 0.2);
  color: #ff6b6b;
  border: 2px solid rgba(220, 53, 69, 0.4);

  &.success {
    background: rgba(41, 78, 38, 0.3);
    color: var(--text);
    border-color: var(--primary);
  }
}

@media (max-width: 768px) {
  .setting-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .color-options {
    width: 100%;
    justify-content: center;
  }
}
</style>
