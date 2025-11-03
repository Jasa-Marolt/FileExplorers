<template>
    <div class="grid-layout" :class="{ 'no-tips': !showTips }">
        <Bar class="bar" />
        <SideMenu class="side-menu" />
        <MainWindow class="main-window" :fileId=props.id />
        <Tips v-if="showTips" class="tips" />
    </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import Bar from '@/components/topBar/Bar.vue'
import MainWindow from '@/components/mainWindow/MainWindow.vue'
import SideMenu from '@/components/sideMenu/SideMenu.vue'
import Tips from '@/components/tipsWindow/Tips.vue'
import { watch } from 'vue'
import { useStore } from 'vuex' // Import Vuex
import { type State } from '@/store' // Assuming you have a typed store setup
import { loadSettings } from '@/composables/useSettings'

const props = defineProps<{
    id?: string
}>()

const route = useRoute()
const tipsEnabled = ref(false)

// Only show tips on game/file explorer pages, not on landing, profile, leaderboard, or settings
const showTips = computed(() => {
  const routeName = route.name as string
  const isGamePage = routeName === 'game' || routeName === 'home'
  return isGamePage && tipsEnabled.value
})

const loadTipsSetting = () => {
  const settings = loadSettings()
  tipsEnabled.value = settings.showTips
}

// Watch for changes in settings
const handleStorageChange = () => {
  loadTipsSetting()
}

onMounted(() => {
  loadTipsSetting()
  window.addEventListener('storage', handleStorageChange)
  // Also listen for custom event when settings are saved
  window.addEventListener('settingsUpdated', handleStorageChange)
})

// Clean up event listeners when component unmounts
onUnmounted(() => {
  window.removeEventListener('storage', handleStorageChange)
  window.removeEventListener('settingsUpdated', handleStorageChange)
})

const store = useStore<State>() // Initialize the store
watch(
  () => props.id, // The source to watch (a getter function)
  (newId) => {
    // This runs on initial setup and every time props.id changes
    store.dispatch('fileStoreModule/setOpenFolder', newId);
  },
  { immediate: true } // Run the handler immediately on component setup
);
</script>

<style scoped lang="scss">
.grid-layout {
    display: grid;
    grid-template-columns: auto 2.5fr 0.75fr;
    /* 3 columns: left, middle, right */
    grid-template-rows: auto 1fr;
    /* 2 rows: top bar + main content */
    height: 100%;
    width: 100%;
    overflow: hidden;

    &.no-tips {
        grid-template-columns: auto 1fr;
        /* 2 columns when tips are hidden */
    }
}

/* Place components in specific grid areas */
.bar {
    grid-column: 1 / 4;
    /* spans all 3 columns */
    grid-row: 1;

    .no-tips & {
        grid-column: 1 / 3;
        /* spans 2 columns when tips are hidden */
    }
}

.side-menu {
    grid-column: 1;
    grid-row: 2;
}

.main-window {
    grid-column: 2;
    grid-row: 2;
}

.tips {
    grid-column: 3;
    grid-row: 2;
}
</style>
