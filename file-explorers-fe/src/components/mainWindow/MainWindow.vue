<template>
    <div class="main_window">
        <FileExplorer></FileExplorer>
    </div>
</template>


<script lang="ts" setup>
import FileExplorer from './FileExplorer.vue';
</script>

<style lang="scss" scoped>
.main_window {
    background: rgb(38, 64, 38);
    width: 100%;
    height: 100%;
}
</style>