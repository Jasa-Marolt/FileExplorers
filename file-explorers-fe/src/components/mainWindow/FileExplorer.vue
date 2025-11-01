<template>
  <div class="main-container">
    <div>
      <!-- <div class="breadcrumb">
        <router-link :to="{ name: 'home' }"> Home </router-link>
        <span v-if="currentDirectory.pathToRoot.length > 0"> / </span>
        <template v-for="(file, index) in currentDirectory.pathToRoot" :key="file.id">
          <router-link :to="{ name: 'home', params: { id: file.id } }" class="link">
            {{ file.name }}
          </router-link>
          <span v-if="index !== currentDirectory.pathToRoot.length - 1"> / </span>
        </template>
      </div> -->
      <!-- <div style="color: white">
        {{ currentDirectoryId }}
        {{ searchQuery }}
        {{ JSON.stringify(files) }}
      </div> -->
      <div v-if="filteredFiles.length === 0" class="no-files outline-container">
        No files in this directory
      </div>
      <div v-else class="grid-container outline-container">
        <!-- @dragover.prevent is needed to register the @drop event -->
        <file-item v-for="file in filteredFiles" :key="file.id" :is-directory="file.isDirectory" :name="file.name"
          draggable="true" @dragover.prevent @dragstart="handleDragStart($event, file)"
          @drop="file.isDirectory ? handleDrop($event, file) : undefined" @click="handleFileClick(file)" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import FileItem from '@/components/file-item.vue'
// Removed 'generateFiles' import as store handles file generation
import { type FileOrDirectory } from '@/files'
import { computed, ref, onMounted } from 'vue' // Added onMounted
import { useFileOrDirectoryStructure } from '@/composables/fileOrDirectory'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex' // Import Vuex
import { type State } from '@/store' // Assuming you have a typed store setup


// --- STORE SETUP ---
const store = useStore<State>() // Initialize the store

// 1. Get files from the store using a getter
const files = computed(() => store.getters['fileStoreModule/getFilesystem'])
const searchQuery = computed(() => store.getters['fileStoreModule/getSearchQuery'])
const currentDirectoryId = computed(() => store.getters["fileStoreModule/getCurrentFile"])
// 2. Dispatch an action to generate initial files when the component mounts
// (or you could do this in the main app setup)
onMounted(() => {
  // Check if the filesystem is empty before generating
  if (files.value.length === 0) {
    store.dispatch('fileStoreModule/generateRandomFilesystem', { count: 100 })
  }
})
// --- END STORE SETUP ---







const filteredFiles = computed(() => {
  const currentDirectoryFiles = files.value.filter((file: FileOrDirectory) =>{
    //console.log("file ", file.parentDirectoryId, "current dir", currentDirectoryId.value, "evals ", file.parentDirectoryId == currentDirectoryId.value)

   return  file.parentDirectoryId == (currentDirectoryId.value) || (!file.parentDirectoryId && !currentDirectoryId.value) 
  }
  );

  console.log("currentDirectoryFiles", currentDirectoryFiles,"files", files)
  console.log("recalculating filtered files");
  if (!searchQuery.value) {
    console.log("no search querry")
    return currentDirectoryFiles
  }

  const lowerSearch = searchQuery.value.toLowerCase()
  return currentDirectoryFiles.filter((file: FileOrDirectory) =>
    file.name.toLowerCase().includes(lowerSearch)
  )
})

const router = useRouter()
function handleFileClick(file: FileOrDirectory) {
  if (!file.isDirectory) {
    console.error('File opening is not implemented yet')
    return
  }

  router.push({ name: 'home', params: { id: file.id } })
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
}

.outline-container {
  width: 70vw;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 24px;
}

.no-files {
  font-size: 20px;
  text-align: center;
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
</style>
