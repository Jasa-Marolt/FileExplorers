<template>
    <div class="side_menu">
        <div class="menu-group">
            <Button 
                type="button" 
                label="Home" 
                icon="pi pi-home" 
                @click="goToHome"
            />
            <Button 
                type="button" 
                :label="isAuthenticated ? user?.username : 'Guest'" 
                :icon="'pi pi-user'" 
                @click="goToProfile"
                class="profile-button"
            />
            <Button 
                type="button" 
                label="Leaderboard" 
                icon="pi pi-trophy" 
                @click="goToLeaderboard"
            /> 
            <Button 
                type="button" 
                label="Settings" 
                icon="pi pi-cog" 
                @click="goToSettings"
            /> 
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
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

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