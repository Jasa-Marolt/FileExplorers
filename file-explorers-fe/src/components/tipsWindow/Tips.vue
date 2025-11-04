<template>
    <div class="tips_menu">
        <div class="level-info">
            <h2>{{ currentLevel?.name || 'Level Name' }}</h2>
            <p>{{ currentLevel?.description || 'Level description will appear here.' }}</p>
        </div>
    </div>
</template>


<script lang="ts" setup>
import { computed } from 'vue';
import { useStore } from 'vuex';

const store = useStore();

// Get the current level data from the Vuex store
const currentLevel = computed(() => store.getters['levelStoreModule/currentLevel']);
</script>

<style lang="scss" scoped>
.tips_menu {
    background: var(--background-secondary);
    width: 100%;
    height: 100%;
    border-left: 3px solid var(--border-color);
    padding: 1rem;
    box-sizing: border-box;
}

.level-info {
    color: var(--text);
    text-align: left;
}

.level-info h2 {
    margin: 0;
    font-size: 1.5rem;
    color: var(--text);
}

.level-info p {
    margin: 0.5rem 0 0;
    font-size: 1rem;
    color: var(--secondary-text);
}
</style>