<template>
    <div class="side_menu">
        <div class="menu-group">
            <Button type="button" label="Level_1" icon="pi pi-folder" />
            <Button type="button" label="Level_2" icon="pi pi-folder" />
            <Button type="button" label="Level_3" icon="pi pi-folder" />
        </div>

        <Divider />

        <div class="menu-group">
            <Button type="button" label="Level_1" icon="pi pi-folder" />
            <Button type="button" label="Level_2" icon="pi pi-folder" />
            <Button type="button" label="Level_3" icon="pi pi-folder" />
        </div>
    </div>
</template>


<script lang="ts" setup>
import Button from 'primevue/button';
import Divider from 'primevue/divider';
</script>

<style lang="scss" scoped>
.side_menu {
    display: flex;
    flex-direction: column;
    background: var(--background-secondary);
    border-right: 3px solid var(--border-color);
    min-width: 13vw;
    height: 100%;
    padding: 0.5rem;
    gap: 0.5rem;
}

.menu-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    /* spacing only between buttons */
}

::v-deep(.p-divider) {
    margin: 0.25rem 0;
}
</style>