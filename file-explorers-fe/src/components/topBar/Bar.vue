<template>
  <div class="top_bar">
    <i class="pi pi-arrow-left"></i>
    <i class="pi pi-arrow-right"></i>
    <i class="pi pi-sync"></i>

    <!-- <IconField class="flex">
      <InputIcon class="pi pi-home" />
      <InputText class="locationBar" v-model="breadcrumbs" fluid disabled />
    </IconField> -->
    <!-- {{ JSON.stringify(breadcrumbs) }} -->
    <IconField>
      <InputText class="searchField" v-model="search" placeholder="Search" />
      <InputIcon class="pi pi-search" />
    </IconField>
    {{ JSON.stringify(filesystem) }}

  </div>

</template>


<script lang="ts" setup>
import InputText from 'primevue/inputtext';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import 'primeicons/primeicons.css'
import { ref, computed, watch } from 'vue';
import { useStore } from 'vuex'; 
import { type State } from '@/store';
import { buildPathToRoot } from '@/composables/fileOrDirectory';
import { FileOrDirectory } from '@/files';

const store = useStore<State>(); 
const filesystem = computed(()=>store.getters["filesStoreModule/getFilesystem"])
const activeId = computed(()=>store.getters["filesStoreModule/getCurrentFile"])
const breadcrumbs = ref<FileOrDirectory[]>([]);

watch(
    [filesystem, activeId], 
    ([newFilesystem, newActiveId]) => {
      console.log("WATCH TRIGGERED ", filesystem, activeId)
        breadcrumbs.value = buildPathToRoot(newFilesystem, newActiveId, []);
    }, 
    {
        deep: true,
        immediate: true 
    }
);

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
  /* let it expand */
}

</style>