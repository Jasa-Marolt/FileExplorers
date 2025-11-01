<template>
    <div class="side_menu">
        <div class="menu-group">
            <Button type="button" label="Home" icon="pi pi-home" @click="goToHome" />
            <Button type="button" :label="isAuthenticated ? user?.username : 'Guest'" :icon="'pi pi-user'"
                @click="goToProfile" class="profile-button" />
            <Button type="button" label="Leaderboard" icon="pi pi-trophy" @click="goToLeaderboard" />
            <Button type="button" label="Settings" icon="pi pi-cog" @click="goToSettings" />
        </div>

        <Divider />

        <div class="menu-group">
            <Button type="button" label="Level_1" icon="pi pi-folder" @click="openLevel(1)"/>
            <Button type="button" label="Level_2" icon="pi pi-folder"  @click="openLevel(2)"/>
            <Button type="button" label="Level_3" icon="pi pi-folder"  @click="openLevel(3)"/>
            <Button type="button" label="Level_4" icon="pi pi-folder"  @click="openLevel(4)"/>
            <Button type="button" label="Level_5" icon="pi pi-folder"  @click="openLevel(5)"/>
        </div>
    </div>
</template>


<script lang="ts" setup>
import Button from 'primevue/button';
import Divider from 'primevue/divider';
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { FileOrDirectory } from '@/files';
import { Level1Filesystem, Level2Filesystem, Level3Filesystem, Level4Filesystem, Level5Filesystem } from '@/store/levels';

const store = useStore();
const router = useRouter();

const isAuthenticated = computed(() => store.getters['userStoreModule/isAuthenticated']);
const user = computed(() => store.getters['userStoreModule/getUser']);

const goToHome = () => {
    router.push({ name: 'landing' });
};

const goToProfile = () => {
    router.push({ name: 'profile' });
};

const goToLeaderboard = () => {
    router.push({ name: 'leaderboard' });
};

const goToSettings = () => {
    router.push({ name: 'settings' });
};

function openLevel(num: number) {
    let newLevel = [] as FileOrDirectory[];
    switch (num) {
        case 1:
            newLevel = Level1Filesystem;
            break;
        case 2:
            newLevel = Level2Filesystem;
            break;
        case 3:
            newLevel = Level3Filesystem;
            break;
        case 4:
            newLevel = Level4Filesystem;
            break;
        case 5:
            newLevel = Level5Filesystem;
            break;

    }

    if (newLevel.length === 0) {
        return;
    }
    console.log("opening new level")
   store.dispatch("fileStoreModule/setFilesystem", newLevel);
}

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