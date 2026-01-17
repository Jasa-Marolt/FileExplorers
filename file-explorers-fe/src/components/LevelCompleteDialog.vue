<template>
    <div v-if="visible" class="dialog-overlay" @click.self="close">
        <div class="dialog-container">
            <div class="dialog-header">
                <h2>🎉 Level Complete!</h2>
            </div>
            <div class="dialog-body">
                <p class="message">Amazing work! You've successfully completed <strong>{{ levelName }}</strong>.</p>
                <p class="subtitle">Ready for the next challenge?</p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, watch } from 'vue';

const props = defineProps<{
    visible: boolean;
    levelName: string;
}>();

const emit = defineEmits<{
    close: [];
}>();

const close = () => {
    emit('close');
};

// Auto-close after 3 seconds
watch(() => props.visible, (newVal) => {
    if (newVal) {
        setTimeout(() => {
            close();
        }, 3000);
    }
});
</script>

<style scoped>
.dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
    backdrop-filter: blur(2px);
    animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

.dialog-container {
    background-color: var(--primary);
    border: 2px solid var(--border-color);
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
    min-width: 450px;
    max-width: 90vw;
    display: flex;
    flex-direction: column;
    animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
    from {
        transform: translateY(-30px);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
}

.dialog-header {
    padding: 20px 24px;
    border-bottom: 1px solid var(--border-color);
}

.dialog-header h2 {
    margin: 0;
    font-size: 24px;
    color: var(--text);
    font-weight: 600;
}

.dialog-body {
    padding: 24px;
}

.message {
    font-size: 16px;
    color: var(--text);
    margin: 0 0 12px 0;
    line-height: 1.5;
}

.message strong {
    font-weight: 600;
    color: var(--text);
}

.subtitle {
    font-size: 14px;
    color: var(--text);
    opacity: 0.8;
    margin: 0;
}
</style>
