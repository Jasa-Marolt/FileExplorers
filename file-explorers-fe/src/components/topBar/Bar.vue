<template>
  <div class="top_bar">
    <Textarea v-model="value" rows="2" fluid />
  </div>

</template>


<script lang="ts" setup>
import Textarea from 'primevue/textarea';
import { ref } from 'vue';
const value = ref<string>("C:");
</script>

<style lang="scss" scoped>
.top_bar {
  background: #045908;
  width: 100%;
  height: 100%;
}

Button {
  height: 100%;
  width: 100%;
}
</style>