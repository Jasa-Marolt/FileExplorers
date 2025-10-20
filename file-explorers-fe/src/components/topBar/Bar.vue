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
import { ref } from 'vue';
const value = ref<string>("C:  /  root  /  level_1  /  random_folder");
const search = ref<string>("");
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

.locationBar {}
</style>