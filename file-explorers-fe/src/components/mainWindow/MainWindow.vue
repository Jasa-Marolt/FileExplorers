<template>
    <div class="main_window">
        <FileExplorer :fileId=fileId></FileExplorer>
       
    </div>
</template>


<script lang="ts" setup>
import FileExplorer from './FileExplorer.vue';

const props = defineProps<{
  fileId?: string
}>()
</script>

<style lang="scss" scoped>
.main_window {
    background: rgb(38, 64, 38);
    width: 100%;
    height: 100%;
}
</style>