<template>
    <div class="main_window">
        <LandingPage v-if="showLanding"></LandingPage>
        <ProfilePanel v-else-if="showProfile"></ProfilePanel>
        <FileExplorer v-else :fileId=currentFileId></FileExplorer>
    </div>
</template>


<script lang="ts" setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import FileExplorer from './FileExplorer.vue';
import ProfilePanel from './ProfilePanel.vue';
import LandingPage from './LandingPage.vue';

const props = defineProps<{
  fileId?: string
}>()

const route = useRoute();
const showProfile = computed(() => route.name === 'profile');
const showLanding = computed(() => route.name === 'landing');
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