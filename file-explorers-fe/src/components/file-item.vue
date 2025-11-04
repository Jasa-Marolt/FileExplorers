<!-- Icons from 
 https://pictogrammers.com/library/mdi/icon/file/ 
 https://pictogrammers.com/library/mdi/icon/folder/ 
-->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { loadSettings } from '@/composables/useSettings';

defineProps<{
  isDirectory?: boolean
  name: string
}>()

const iconSizeMap: Record<string, string> = {
  small: '50px',
  medium: '75px',
  large: '100px'
};

const settings = ref(loadSettings());
const useFancyIcons = computed(() => settings.value.fancyIcons);
const iconSize = computed(() => iconSizeMap[settings.value.iconSize] || iconSizeMap.medium);

const handleSettingsUpdate = (event: Event) => {
  const customEvent = event as CustomEvent;
  settings.value = customEvent.detail;
};

onMounted(() => {
  window.addEventListener('settingsUpdated', handleSettingsUpdate);
});

onUnmounted(() => {
  window.removeEventListener('settingsUpdated', handleSettingsUpdate);
});
</script>

<template>
  <div class="file-item-container">
    <!-- Papa Icons (fancy) -->
    <div v-if="useFancyIcons" 
         :class="['papa', isDirectory ? 'papa-folder-closed' : 'papa-file']"
         :style="{ width: iconSize, height: iconSize }"
         :title="name">
    </div>
    
    <!-- SVG Icons (simple) -->
    <svg v-else role="presentation" viewBox="0 0 24 24" :style="{ height: iconSize, width: iconSize }" class="file-icon">
      <title>{{ name }}</title>
      <path v-if="isDirectory"
        d="M10,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V8C22,6.89 21.1,6 20,6H12L10,4Z"></path>

      <path v-else d="M13,9V3.5L18.5,9M6,2C4.89,2 4,2.89 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2H6Z"></path>
    </svg>
    
    <div class="item-label">
      {{ name }}
    </div>
  </div>
</template>

<style scoped>
.file-item-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: 1em;
  gap: 8px;
  padding: 4px;
  transition:
    color,
    background-color 0.2s ease-in-out;
  overflow: hidden;

  &:hover {
    background-color: var(--primary);
    border-radius: 0.5em;
    color: var(--text);
  }

  .item-label {
    max-width: 100%;
    color: var(--text);
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .file-icon {
    path {
      fill: var(--text);
      transition: fill 0.3s ease;
    }
  }

  /* Papa icons styling */
  .papa {
    flex-shrink: 0;
  }
}
</style>
