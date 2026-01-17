<script setup lang="ts">
import { RouterView } from 'vue-router'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import { setToastService, setLevelCompleteHandler } from './service/toastService'
import { onMounted, ref } from 'vue'
import LevelCompleteDialog from './components/LevelCompleteDialog.vue'

const toast = useToast()

const levelCompleteDialog = ref({
  visible: false,
  levelName: '',
})

onMounted(() => {
  setToastService(toast)
  setLevelCompleteHandler((levelName: string) => {
    levelCompleteDialog.value.visible = true
    levelCompleteDialog.value.levelName = levelName
  })
})

const closeLevelCompleteDialog = () => {
  levelCompleteDialog.value.visible = false
}

</script>

<template>
  <Toast />
  <LevelCompleteDialog 
    :visible="levelCompleteDialog.visible" 
    :levelName="levelCompleteDialog.levelName"
    @close="closeLevelCompleteDialog" 
  />
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
