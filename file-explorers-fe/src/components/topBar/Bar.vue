<template>
  <div class="top_bar">
    <InputText v-model="value" fluid disabled />
  </div>

</template>


<script lang="ts" setup>
import InputText from 'primevue/inputtext';
import { ref } from 'vue';
const value = ref<string>("C:");
</script>

<style lang="scss" scoped>
.top_bar {
  background: #045908;
  width: 100%;
  height: 100%;
}
</style>