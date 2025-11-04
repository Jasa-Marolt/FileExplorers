<template>
  <div class="top_bar">
    <i class="pi pi-arrow-left" :class="{ 'disabled-arrow': !historyBackPossible }" @click="historyGoBack"></i>

    <i class="pi pi-arrow-right" :class="{ 'disabled-arrow': !historyForwardPossible }" @click="historyGoForward"></i>
    <i class="pi pi-sync" :class="{ 'disabled-arrow': isNotGame }" @click="resetLevel"></i>

    <IconField class="flex">
      <InputIcon class="pi pi-home" />
      <InputText class="locationBar" v-model="pathValue" fluid disabled />
    </IconField>

    <IconField>
      <InputText class="searchField" v-model="search" placeholder="Search" />
      <InputIcon class="pi pi-search" />
    </IconField>

  </div>

</template>


<script lang="ts" setup>
import InputText from 'primevue/inputtext';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import 'primeicons/primeicons.css'

import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';

import { useStore } from 'vuex';
import { type State } from '@/store';
import { buildPathToRoot } from '@/composables/fileOrDirectory';
import { FileOrDirectory } from '@/files';
import { playSound, SoundEffect } from '@/composables/useSounds';

const route = useRoute();


const isNotGame = computed(() => {
  const routeName = route.name as string;
  return routeName != "game";
})

const resetLevel = async () => {
  const level = store.getters["levelStoreModule/currentLevel"];
  store.dispatch("fileStoreModule/setFilesystem", level.data);
}
const pathValue = computed(() => {
  const routeName = route.name as string;

  switch (routeName) {
    case 'landing':
      return 'Home';
    case 'profile':
      return 'Profile';
    case 'leaderboard':
      return 'Leaderboard';
    case 'settings':
      return 'Settings';
    case 'game':
      return breadcrumbsPath.value;
    case 'home':
      return "home";
    default:
      return 'File Explorers';
  }
});



const store = useStore<State>();
const filesystem = computed(() => store.getters["fileStoreModule/getFilesystem"])

const activeId = computed(() => store.getters["fileStoreModule/getCurrentFile"])
const breadcrumbs = computed(() => store.getters["fileStoreModule/getPathToRoot"])

const historyForwardPossible = computed(() => (store.getters["fileStoreModule/canHistoryNavigateForward"] && !isNotGame.value))
const historyBackPossible = computed(() => (store.getters["fileStoreModule/canHistoryNavigateBack"] && !isNotGame.value))

const breadcrumbsPath = computed(() => {
  if (!breadcrumbs.value || !Array.isArray(breadcrumbs.value)) {
    return "" // Return an empty string if there are no breadcrumbs
  }
  const level = store.getters["levelStoreModule/currentLevel"];
  const prefix = "C: " + level.name + " / "

  return prefix + breadcrumbs.value.reverse()
    .map((file: FileOrDirectory) => file.name)
    .join(" / ")
})

function historyGoBack() {
  playSound(SoundEffect.Backward);
  store.dispatch("fileStoreModule/navigateHistoryBack");
}
function historyGoForward() {
  playSound(SoundEffect.Forward);
  store.dispatch("fileStoreModule/navigateHistoryForward");
}

const search = computed<string>({
  get: () => store.getters['fileStoreModule/getSearchQuery'],
  set: (val) => {
    store.dispatch('fileStoreModule/setSearchQuery', val)

    console.log("called set")
  }
});


</script>

<style lang="scss" scoped>
.top_bar {
  background: var(--background-secondary);
  border-bottom: 3px solid var(--border-color);
  width: 100%;
  height: auto;
  display: flex;
  align-items: center;
  padding: 0.5rem;
  gap: 0.5rem;

}

.pi {
  color: var(--text);
  scale: 1.2;
  padding-left: 0.4em;
  padding-right: 0.4em;
}

.flex {
  flex: 1;
}

.disabled-arrow {
  color: #ccc;
  cursor: default;
  opacity: 0.6;
}
</style>