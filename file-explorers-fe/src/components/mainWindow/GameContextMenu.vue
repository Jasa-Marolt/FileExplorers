<template>
    <div class="game-context-menu" :style="{ left: x + 'px', top: y + 'px' }" ref="menu" @click.stop>
        <ul>
            <li v-for="(item, idx) in items" :key="idx" @click="onSelect(item)">
                {{ item.label }}
            </li>
        </ul>
    </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps<{
    x: number
    y: number
    items: { label: string; action: string }[]
}>()

const emit = defineEmits<{
    (e: 'select', action: string): void
    (e: 'close'): void
}>()

const menu = ref<HTMLElement | null>(null)

function onSelect(item: { label: string; action: string }) {
    emit('select', item.action)
}

function onDocClick(e: MouseEvent) {
    // Close when clicking outside
    if (!menu.value) return
    if (!(e.target as Node) || menu.value.contains(e.target as Node)) return
    emit('close')
}

onMounted(() => {
    document.addEventListener('click', onDocClick)
})

onBeforeUnmount(() => {
    document.removeEventListener('click', onDocClick)
})
</script>

<style scoped lang="scss">
.game-context-menu {
    position: fixed;
    z-index: 9999;
    background: var(--background-secondary);
    color: var(--text);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 1em;
    min-width: 200px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
    /* ensure text inside menu is left-aligned */
    text-align: left;
}

.game-context-menu ul {
    list-style: none;
    margin: 0;
    padding: 4px 0;
    padding-left: 8px;
}

.game-context-menu li {
    padding: 8px 12px;
    cursor: pointer;
    /* align text to left and make full-width clickable */
    text-align: left;
    display: block;
}

.game-context-menu li:hover {
    background: rgba(255, 255, 255, 0.05);
}
</style>
