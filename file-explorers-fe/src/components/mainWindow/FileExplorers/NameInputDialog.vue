<template>
    <div v-if="visible" class="dialog-overlay" @click="onOverlayClick">
        <div class="dialog-container" @click.stop>
            <div class="dialog-header">
                <h3>{{ title }}</h3>
            </div>
            <div class="dialog-body">
                <InputText v-model="inputValue" fluid :placeholder="placeholder" @keyup.enter="onConfirm"
                    @keyup.esc="onCancel" autofocus />
            </div>
            <div class="dialog-footer">
                <Button label="Cancel" @click="onCancel" />
                <Button label="OK" @click="onConfirm" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';

interface Props {
    visible: boolean;
    title: string;
    placeholder?: string;
    defaultValue?: string;
}

const props = withDefaults(defineProps<Props>(), {
    placeholder: 'Enter name',
    defaultValue: '',
});

const emit = defineEmits<{
    confirm: [value: string];
    cancel: [];
}>();

const inputValue = ref(props.defaultValue);

watch(() => props.visible, (newVal) => {
    if (newVal) {
        inputValue.value = props.defaultValue;
    }
});

watch(() => props.defaultValue, (newVal) => {
    inputValue.value = newVal;
});

function onConfirm() {
    if (inputValue.value.trim()) {
        emit('confirm', inputValue.value.trim());
        inputValue.value = '';
    }
}

function onCancel() {
    emit('cancel');
    inputValue.value = '';
}

function onOverlayClick() {
    onCancel();
}
</script>

<style scoped>
.dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.dialog-container {
    background-color: var(--primary);
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    min-width: 400px;
    max-width: 90vw;
    padding: 0;
    display: flex;
    flex-direction: column;
}

.dialog-header {
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
}

.dialog-header h3 {
    margin: 0;
    font-size: 18px;
    color: var(--text);
    font-weight: 600;
}

.dialog-body {
    padding: 20px;
}




.dialog-footer {
    padding: 12px 20px;
    border-top: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}
</style>
