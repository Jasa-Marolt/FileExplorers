<template>
    <div class="grid-layout">
        <Bar class="bar" />
        <SideMenu class="side-menu" />
        <MainWindow class="main-window" :fileId=props.id />
        <TIps class="tips" />
    </div>
</template>

<script lang="ts" setup>
import Bar from '@/components/topBar/Bar.vue'
import MainWindow from '@/components/mainWindow/MainWindow.vue'
import SideMenu from '@/components/sideMenu/SideMenu.vue'
import TIps from '@/components/tipsWindow/TIps.vue'

const props = defineProps<{
  id?: string
}>()
</script>

<style scoped lang="scss">
.grid-layout {
    display: grid;
    grid-template-columns: 0.5fr 2.5fr 0.75fr;
    /* 3 columns: left, middle, right */
    grid-template-rows: 5% 1fr;
    /* 2 rows: top bar + main content */
    height: 100vh;
    width: 100vw;
}

/* Place components in specific grid areas */
.bar {
    grid-column: 1 / 4;
    /* spans all 3 columns */
    grid-row: 1;
}

.side-menu {
    grid-column: 1;
    grid-row: 2;
}

.main-window {
    grid-column: 2;
    grid-row: 2;
}

.tips {
    grid-column: 3;
    grid-row: 2;
}
</style>
