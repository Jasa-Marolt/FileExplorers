<template>
  <div class="main-container" @contextmenu.prevent="onContextMenu" @click="handleBackgroundClick">

    <div v-if="filteredFiles.length === 0" class="no-files outline-container">
      No files in this directory
    </div>
    <div v-else class="grid-container outline-container">
      <file-item class="file-item" v-for="file in filteredFiles" :key="file.id" :is-directory="file.isDirectory"
        :name="file.name"
        :class="{ 'selected': (store.getters['fileStoreModule/getSelectedFiles'] as FileOrDirectory[]).some((f: FileOrDirectory) => f.id === file.id) }"
        draggable="true" @dragover.prevent @dragstart="handleDragStart($event, file)"
        @drop="file.isDirectory ? handleDrop($event, file) : undefined"
        @click="(event: MouseEvent) => handleFileClick(file, event)" @dblclick="() => handleFileDoubleClick(file)"
        @contextmenu.prevent.stop="(event: MouseEvent) => onFileContextMenu(event, file)" />
    </div>

    <GameContextMenu v-if="menu.visible" :x="menu.x" :y="menu.y" :items="menu.items" @select="onMenuSelect"
      @close="closeMenu" />

    <NameInputDialog :visible="dialog.visible" :title="dialog.title" :placeholder="dialog.placeholder"
      :default-value="dialog.defaultValue" @confirm="onDialogConfirm" @cancel="onDialogCancel" />
  </div>
</template>

<script setup lang="ts">
import FileItem from '@/components/file-item.vue'
import { type FileOrDirectory } from '@/files'
import { computed, ref, onMounted } from 'vue'
import { useFileOrDirectoryStructure } from '@/composables/fileOrDirectory'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { type State } from '@/store'
import GameContextMenu from './GameContextMenu.vue';
import NameInputDialog from './FileExplorers/NameInputDialog.vue';
import { EContextMenuAction } from "@/components/mainWindow/FileExplorers/helper"
const store = useStore<State>()
const files = computed(() => store.getters['fileStoreModule/getFilesystem'])
const searchQuery = computed(() => store.getters['fileStoreModule/getSearchQuery'])
const currentDirectoryId = computed(() => store.getters["fileStoreModule/getCurrentFile"])
onMounted(() => {
  if (files.value.length === 0) {
    store.dispatch('fileStoreModule/generateRandomFilesystem', { count: 100 })
  }
})
const filteredFiles = computed(() => {
  const currentDirectoryFiles = files.value.filter((file: FileOrDirectory) => {
    return file.parentDirectoryId == (currentDirectoryId.value) || (!file.parentDirectoryId && !currentDirectoryId.value)
  });
  if (!searchQuery.value) {
    return currentDirectoryFiles
  }
  const lowerSearch = searchQuery.value.toLowerCase()
  return currentDirectoryFiles.filter((file: FileOrDirectory) =>
    file.name.toLowerCase().includes(lowerSearch)
  )
})
const router = useRouter()
function handleFileClick(file: FileOrDirectory, event: MouseEvent) {
  const selectedFiles = store.getters['fileStoreModule/getSelectedFiles'] as FileOrDirectory[];
  if (event.ctrlKey || event.metaKey) {
    const index = selectedFiles.findIndex((f: FileOrDirectory) => f.id === file.id);
    if (index === -1) {
      selectedFiles.push(file);
    } else {
      selectedFiles.splice(index, 1);
    }
  } else if (event.shiftKey) {
    const currentIndex = filteredFiles.value.findIndex((f: FileOrDirectory) => f.id === file.id);
    const lastSelectedIndex = filteredFiles.value.findIndex((f: FileOrDirectory) => f.id === selectedFiles[selectedFiles.length - 1]?.id);
    if (lastSelectedIndex !== -1) {
      const [start, end] = [currentIndex, lastSelectedIndex].sort((a, b) => a - b);
      store.dispatch('fileStoreModule/setSelectedFiles', filteredFiles.value.slice(start, end + 1));
    } else {
      store.dispatch('fileStoreModule/setSelectedFiles', [file]);
    }
  } else {
    store.dispatch('fileStoreModule/setSelectedFiles', [file]);
  }
}
function handleBackgroundClick(event: MouseEvent) {
  const target = event.target as HTMLElement;
  if (target.closest('.file-item')) {
    return;
  }
  store.dispatch('fileStoreModule/setSelectedFiles', []);
}
function handleFileDoubleClick(file: FileOrDirectory) {
  if (file.isDirectory) {
    store.dispatch("fileStoreModule/setOpenFolder", file.id);
  } else {
    console.error('File opening is not implemented yet');
  }
}
function handleDragStart(event: DragEvent, file: unknown) {
  event.dataTransfer!.setData('moved-item', JSON.stringify(file))
}
function moveFile(draggedItemId: number, newFolderId: number) {
  store.dispatch('fileStoreModule/moveFile', {
    itemId: draggedItemId,
    newParentId: newFolderId
  })
}
function handleDrop(event: DragEvent, file: FileOrDirectory) {
  const draggedItemData = event.dataTransfer?.getData('moved-item')
  if (!draggedItemData) {
    return
  }
  const draggedItem = JSON.parse(draggedItemData) as FileOrDirectory
  const isDroppingToSameFolder = file.id === draggedItem.id
  if (isDroppingToSameFolder || !file.isDirectory) {
    return
  }
  moveFile(draggedItem.id, file.id)
}
const menu = ref<{ visible: boolean; x: number; y: number; items: { label: string; action: string }[] }>({
  visible: false,
  x: 0,
  y: 0,
  items: [],
})
const dialog = ref<{
  visible: boolean;
  title: string;
  placeholder: string;
  defaultValue: string;
  action: 'createFile' | 'createFolder' | 'rename' | null;
}>({
  visible: false,
  title: '',
  placeholder: '',
  defaultValue: '',
  action: null,
})
function showDialog(action: 'createFile' | 'createFolder' | 'rename', title: string, placeholder: string, defaultValue = '') {
  dialog.value = {
    visible: true,
    title,
    placeholder,
    defaultValue,
    action,
  }
}
function onDialogConfirm(value: string) {
  const selectedFiles = store.getters['fileStoreModule/getSelectedFiles'] as FileOrDirectory[];
  switch (dialog.value.action) {
    case 'createFile':
      store.dispatch('fileStoreModule/createFile', { name: value });
      break;
    case 'createFolder':
      store.dispatch('fileStoreModule/createFolder', { name: value });
      break;
    case 'rename':
      if (selectedFiles.length === 1) {
        store.dispatch('fileStoreModule/renameFile', { id: selectedFiles[0].id, newName: value });
      }
      break;
  }
  dialog.value.visible = false;
}
function onDialogCancel() {
  dialog.value.visible = false;
}
function onFileContextMenu(e: MouseEvent, file: FileOrDirectory) {
  const selectedFiles = store.getters['fileStoreModule/getSelectedFiles'] as FileOrDirectory[];
  if (!selectedFiles.some((f: FileOrDirectory) => f.id === file.id)) {
    store.dispatch('fileStoreModule/setSelectedFiles', [file]);
  }
  onContextMenu(e);
}
function onContextMenu(e: MouseEvent) {
  menu.value.items = [
    { label: 'Open', action: EContextMenuAction.Open },
    { label: 'Create new folder', action: EContextMenuAction.NewFolder },
    { label: 'Create new file', action: EContextMenuAction.NewFile },
    { label: 'Copy', action: EContextMenuAction.Copy },
    { label: 'Cut', action: EContextMenuAction.Cut },
    { label: 'Paste', action: EContextMenuAction.Paste },
    { label: 'Rename', action: EContextMenuAction.Rename },
    { label: 'Delete', action: EContextMenuAction.Delete },
  ]
  const x = e.clientX
  const y = e.clientY
  const vw = window.innerWidth
  const vh = window.innerHeight
  const menuW = 200
  const menuH = menu.value.items.length * 36
  menu.value.x = x + (x + menuW > vw ? -menuW : 0)
  menu.value.y = y + (y + menuH > vh ? -menuH : 0)
  menu.value.visible = true
}
function closeMenu() {
  menu.value.visible = false
}
function onMenuSelect(action: string) {
  const selectedFiles = store.getters['fileStoreModule/getSelectedFiles'] as FileOrDirectory[];
  function openItem() {
    if (selectedFiles.length === 1 && selectedFiles[0].isDirectory) {
      store.dispatch('fileStoreModule/setOpenFolder', selectedFiles[0].id);
    }
  }
  function createNewFolder() {
    showDialog('createFolder', 'Create New Folder', 'Folder name');
  }
  function createNewFile() {
    showDialog('createFile', 'Create New File', 'File name');
  }
  function copyItem() {
    const selectedIds = selectedFiles.map(f => f.id);
    store.dispatch('fileStoreModule/copyFiles', selectedIds);
  }
  function cutItem() {
    const selectedIds = selectedFiles.map(f => f.id);
    store.dispatch('fileStoreModule/copyFiles', selectedIds);
    store.dispatch('fileStoreModule/deleteFiles', selectedIds);
  }
  function pasteItem() {
    store.dispatch('fileStoreModule/pasteFiles');
  }
  function renameItem() {
    if (selectedFiles.length === 1) {
      showDialog('rename', 'Rename', 'New name', selectedFiles[0].name);
    }
  }
  function deleteItem() {
    const selectedIds = selectedFiles.map(f => f.id);
    store.dispatch('fileStoreModule/deleteFiles', selectedIds);
  }
  const enumAction = action as unknown as EContextMenuAction;
  switch (enumAction) {
    case EContextMenuAction.Open:
      openItem();
      break;
    case EContextMenuAction.NewFolder:
      createNewFolder();
      break;
    case EContextMenuAction.NewFile:
      createNewFile();
      break;
    case EContextMenuAction.Copy:
      copyItem();
      break;
    case EContextMenuAction.Cut:
      cutItem();
      break;
    case EContextMenuAction.Paste:
      pasteItem();
      break;
    case EContextMenuAction.Rename:
      renameItem();
      break;
    case EContextMenuAction.Delete:
      deleteItem();
      break;
    default:
      console.warn('Unknown context menu action:', action);
  }
  closeMenu()
}
</script>


<style scoped>
.main-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  overflow-y: auto;
}

.grid-container {
  display: grid;
  grid-auto-rows: 100px;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 24px;
  justify-content: start;
  padding: 10px;
  width: 100%;
  height: 100%;
}

.outline-container {
  width: 100%;
  border-radius: 4px;
  padding: 24px;
  height: 100%;
}

.no-files {
  font-size: 20px;
  text-align: center;
  color: var(--text);
}

.breadcrumb {
  display: flex;
  gap: 4px;
  width: 70vw;
  font-size: 16px;
  color: rgba(0, 0, 0, 0.7);
  margin-top: 24px;
  margin-bottom: 4px;
  align-self: start;
}

.breadcrumb a {
  color: white;
  text-decoration: none;
}

.router-link-exact-active {
  color: red !important;
}

.search-container {
  display: flex;
  width: fit-content;
  border: 1px solid #ccc;
  border-radius: 5px;
  margin-top: 24px;
}

.search-field {
  padding: 8px;
  font-size: 16px;
  border: none;
  outline: none;
  width: 100%;
  background-color: rgba(255, 255, 255, 0.6);
  color: rgba(0, 0, 0, 0.7);
  border-radius: 4px;
}

.selected {
  background-color: var(--element-background);
  border: 2px solid var(--p-button-primary-border-color, #007bff);
  border-radius: 1em;
}
</style>
