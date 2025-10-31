<template>
  <div class="top_bar">
    <i class="pi pi-arrow-left"></i>
    <i class="pi pi-arrow-right"></i>
    <i class="pi pi-sync"></i>

    <IconField class="flex">
      <InputIcon class="pi pi-home" />
      <InputText class="locationBar" v-model="value" fluid disabled />
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
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const search = ref<string>("");

const value = computed(() => {
  const routeName = route.name as string;
  
  switch(routeName) {
    case 'landing':
      return 'Home';
    case 'profile':
      return 'Profile';
    case 'leaderboard':
      return 'Leaderboard';
    case 'settings':
      return 'Settings';
    case 'game':
      return route.params.id ? `Game  /  Level_${route.params.id}` : 'Game';
    case 'home':
      return route.params.id ? `Files  /  Folder_${route.params.id}` : 'Files';
    default:
      return 'File Explorers';
  }
});
</script>

<style lang="scss" scoped>
.top_bar {
  background: var(--background-secondary);
  border-bottom: 3px solid var(--border-color);
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  padding-left: 0.5rem;
  padding-right: 0.5rem;
  gap: 0.5rem;

}

.pi {
  scale: 1.2;
  padding-left: 0.4em;
  padding-right: 0.4em;
}

.flex {
  flex: 1;
}
</style>