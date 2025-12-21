<template>
  <div class="main_window">
    <LandingPage v-if="showLanding"></LandingPage>
    <ProfilePanel v-else-if="showProfile"></ProfilePanel>
    <Leaderboard v-else-if="showLeaderboard"></Leaderboard>
    <Settings v-else-if="showSettings"></Settings>
    <ElektroGame v-else-if="showElektroGame"></ElektroGame>
    <BooleanGame v-else-if="showBoolGame"></BooleanGame>
    <FileExplorer v-else :fileId=currentFileId></FileExplorer>

    <!-- Game specific custom context menu -->
    < </div>
</template>


<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import FileExplorer from './FileExplorer.vue';
import ProfilePanel from './ProfilePanel.vue';
import LandingPage from './LandingPage.vue';
import Leaderboard from './Leaderboard.vue';
import Settings from './Settings.vue';
import ElektroGame from './ElektroGame.vue';
import BooleanGame from './BooleanGame.vue';


const props = defineProps<{
  fileId?: string
}>()

const route = useRoute();
const showProfile = computed(() => route.name === 'profile');
const showLanding = computed(() => route.name === 'landing');
const showLeaderboard = computed(() => route.name === 'leaderboard');
const showSettings = computed(() => route.name === 'settings');
const showElektroGame = computed(() => route.name === 'gameElektro');
const showBoolGame = computed(() => route.name === 'gameBool');
const currentFileId = computed(() => {
  if (route.name === 'game') {
    return route.params.id as string;
  }
  return props.fileId;
});


</script>

<style lang="scss" scoped>
.main_window {
  background: var(--primary);
  color: var(--text);
  width: 100%;
  height: 100%;
  position: relative;
  /* needed for absolute menu positioning */
  overflow: hidden;
}
</style>