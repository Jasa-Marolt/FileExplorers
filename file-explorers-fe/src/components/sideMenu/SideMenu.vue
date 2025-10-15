<template>
    <div class="side_menu">
        <div class="menu-header">
            <h3>Levels</h3>
        </div>
        
        <div class="menu-group">
            <Button 
                v-for="level in levels" 
                :key="level.id"
                type="button" 
                :label="level.name" 
                :icon="getLevelIcon(level)"
                :disabled="!level.isUnlocked"
                :class="{
                    'level-button': true,
                    'level-active': level.id === currentLevel,
                    'level-completed': level.isCompleted,
                    'level-locked': !level.isUnlocked
                }"
                @click="selectLevel(level.id)"
            >
                <template #default>
                    <span class="level-icon">
                        <i :class="getLevelIcon(level)"></i>
                    </span>
                    <span class="level-info">
                        <span class="level-name">{{ level.name }}</span>
                        <span class="level-description">{{ level.description }}</span>
                    </span>
                    <span v-if="level.isCompleted" class="level-status">
                        <i class="pi pi-check"></i>
                    </span>
                    <span v-else-if="!level.isUnlocked" class="level-status">
                        <i class="pi pi-lock"></i>
                    </span>
                </template>
            </Button>
        </div>
    </div>
</template>


<script lang="ts" setup>
import { computed } from 'vue'
import { useStore } from 'vuex'
import Button from 'primevue/button'
import type { Level } from '@/store/modules/levels'

const store = useStore()

const levels = computed(() => store.getters['levels/allLevels'])
const currentLevel = computed(() => store.getters['levels/currentLevel'])

const getLevelIcon = (level: Level) => {
    if (!level.isUnlocked) {
        return 'pi pi-lock'
    } else if (level.isCompleted) {
        return 'pi pi-check-circle'
    } else if (level.id === currentLevel.value) {
        return 'pi pi-folder-open'
    } else {
        return 'pi pi-folder'
    }
}

const selectLevel = (levelId: number) => {
    const level = levels.value.find((l: Level) => l.id === levelId)
    if (level && level.isUnlocked) {
        store.dispatch('levels/selectLevel', levelId)
    }
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
    overflow-y: auto;
}

.menu-header {
    padding: 0.5rem;
    border-bottom: 2px solid var(--border-color);
    margin-bottom: 0.5rem;

    h3 {
        margin: 0;
        color: var(--text);
        font-size: 1.2rem;
        font-weight: 600;
    }
}

.menu-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.level-button {
    width: 100%;
    text-align: left;
    padding: 0.75rem !important;
    transition: all 0.2s ease;

    &:not(.level-locked):hover {
        transform: translateX(4px);
    }
}

.level-active {
    background: var(--primary) !important;
    border-left: 3px solid var(--text);
}

.level-completed {
    opacity: 0.85;
}

.level-locked {
    opacity: 0.5;
    cursor: not-allowed !important;
}

::v-deep(.p-button) {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    height: auto;
    min-height: 3rem;
}

.level-icon {
    font-size: 1.2rem;
    min-width: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
}

.level-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex: 1;
}

.level-name {
    font-weight: 600;
    font-size: 1rem;
    color: var(--text);
}

.level-description {
    font-size: 0.75rem;
    color: var(--secondary-text);
    font-weight: 400;
}

.level-status {
    font-size: 1rem;
    display: flex;
    align-items: center;
    
    .pi-check {
        color: #4caf50;
    }
    
    .pi-lock {
        color: var(--secondary-text);
    }
}
</style>