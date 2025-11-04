<script setup lang="ts">
import { RouterView } from 'vue-router'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import { setToastService } from './service/toastService'
import { onMounted } from 'vue'

const toast = useToast()

onMounted(() => {
  setToastService(toast)
})

</script>

<template>
  <Toast />
  <RouterView />
</template>



<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: var(--text);
  background: var(--primary);
}

html,
body,
#app {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
</style>
