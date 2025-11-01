<template>
    <div class="main_window">
        <LandingPage v-if="showLanding"></LandingPage>
        <ProfilePanel v-else-if="showProfile"></ProfilePanel>
        <Leaderboard v-else-if="showLeaderboard"></Leaderboard>
        <Settings v-else-if="showSettings"></Settings>
        <FileExplorer v-else :fileId=currentFileId></FileExplorer>
    </div>
</template>


<script lang="ts" setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import FileExplorer from './FileExplorer.vue';
import ProfilePanel from './ProfilePanel.vue';
import LandingPage from './LandingPage.vue';
import Leaderboard from './Leaderboard.vue';
import Settings from './Settings.vue';

const props = defineProps<{
  fileId?: string
}>()

const route = useRoute();
const showProfile = computed(() => route.name === 'profile');
const showLanding = computed(() => route.name === 'landing');
const showLeaderboard = computed(() => route.name === 'leaderboard');
const showSettings = computed(() => route.name === 'settings');
const currentFileId = computed(() => {
  if (route.name === 'game') {
    return route.params.id as string;
  }
  return props.fileId;
});
</script>

<style lang="scss" scoped>
.main_window {
    background: rgb(38, 64, 38);
    width: 100%;
    height: 100%;
}
</style>