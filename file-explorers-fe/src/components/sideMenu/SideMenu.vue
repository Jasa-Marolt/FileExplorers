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
            <Button v-for="(level, idx) in levels" :key="level.level_id ?? idx" type="button"
                :label="level.name ?? `Level ${idx + 1}`"
                :icon="currentLevel?.level_id === (level.level_id ?? idx + 1) && isGame ? 'pi pi-folder-open' : 'pi pi-folder'"
                @click="openLevel(level.level_id ?? idx + 1)" />
        </div>
    </div>
</template>


<script lang="ts" setup>
import Button from 'primevue/button';
import Divider from 'primevue/divider';
import { computed, onBeforeMount, onMounted, ref, watch } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import { FileOrDirectory } from '@/files';
import { Level } from '@/store/levelStore';

const store = useStore();
const router = useRouter();
const route = useRoute();
const loading = ref(true);
const error = ref('');

const isAuthenticated = computed(() => store.getters['userStoreModule/isAuthenticated']);
const user = computed(() => store.getters['userStoreModule/getUser']);

const isGame = computed(() => {
    const routeName = route.name as string;
    return routeName == "game";
})

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

const levels = ref<null | Level[]>(null);

const currentLevel = computed(() => store.getters["levelStoreModule/currentLevel"]);

watch(
    () => store.getters["levelStoreModule/levels"],
    (newLevels) => {
        console.log("levels updated", newLevels);
        levels.value = newLevels;
    },
    { immediate: true }
);

async function openLevel(num: number) {
    let newLevel = [] as FileOrDirectory[];
    newLevel = (await store.dispatch("levelStoreModule/fetchLevel", num)).data;
    console.log("opening new level ", newLevel)

    router.push({ name: 'game' });
    store.dispatch("fileStoreModule/setFilesystem", newLevel);
}



onBeforeMount(() => {

    store.dispatch("levelStoreModule/fetchLevels");

});

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
    overflow-y: auto;
    overflow-x: hidden;
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