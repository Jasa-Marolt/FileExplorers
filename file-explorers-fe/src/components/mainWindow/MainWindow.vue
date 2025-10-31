<template>
    <div class="main_window">
        <FileExplorer v-if="!showProfile" :fileId=fileId></FileExplorer>
        <ProfilePanel v-else></ProfilePanel>
    </div>
</template>


<script lang="ts" setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import FileExplorer from './FileExplorer.vue';
import ProfilePanel from './ProfilePanel.vue';

const props = defineProps<{
  fileId?: string
}>()

const route = useRoute();
const showProfile = computed(() => route.name === 'profile');
</script>

<style lang="scss" scoped>
.main_window {
    background: rgb(38, 64, 38);
    width: 100%;
    height: 100%;
}
</style>