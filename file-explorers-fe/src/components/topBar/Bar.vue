<template>
  <div class="top_bar">
    <i class="pi pi-arrow-left"></i>
    <i class="pi pi-arrow-right"></i>
    <i class="pi pi-sync"></i>

    <IconField class="flex">
      <InputIcon class="pi pi-home" />
      <InputText class="locationBar" v-model="breadcrumbsPath" fluid disabled />
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



const store = useStore<State>(); 
const filesystem = computed(()=>store.getters["fileStoreModule/getFilesystem"])

const activeId = computed(()=>store.getters["fileStoreModule/getCurrentFile"])
const breadcrumbs =  computed(()=>store.getters["fileStoreModule/getPathToRoot"])

const breadcrumbsPath = computed(()=>{
  if (!breadcrumbs.value || !Array.isArray(breadcrumbs.value)) {
    return "" // Return an empty string if there are no breadcrumbs
  }

  // Map the array to extract the 'name' property and join them with '/'
  return breadcrumbs.value.reverse()
    .map((file: FileOrDirectory) => file.name)
    .join("/")
})

// const search = computed<string>({
//   get: () => store.getters['fileStoreModule/getSearchQuery'],
//   set: (val) => {
//     store.dispatch('fileStoreModule/setSearchQuery', val)
    
//     console.log("called set")
//   }
// });


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