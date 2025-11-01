import { FileOrDirectory, generateFiles } from "@/files"
import { useFileOrDirectoryStructure, useDirectoryPath, useDirectorySearch, buildFileStructure } from "@/composables/fileOrDirectory"
import { Module, MutationTree } from "vuex";
export interface FileState {
  filesystem: FileOrDirectory[];
  openFolder: number | null;
  searchQuery: string;
  history: {
    recentFoldersId: (number|null)[],
    index: number
  }
}
export interface RootState {

}
interface FileMutations extends MutationTree<FileState> {
  // Add any necessary mutation type definitions here
  SET_FILESYSTEM(state: FileState, payload: FileOrDirectory[]): void;
  MOVE_FILE(state: FileState, payload: MoveFilePayload): void;
  SET_SEARCH_QUERY(state: FileState, payload: string): void;
  SET_OPEN_FOLDER(state: FileState, payload: number | null): void;
  ADD_TO_HISTORY(state: FileState, payload: number|null): void;
  HISTORY_BACK(state: FileState): void;
  HISTORY_FORWARD(state: FileState): void;
}

interface MoveFilePayload {
  itemId: number; // Assuming IDs are numbers
  newParentId: number | null;
}
export const fileStoreModule: Module<FileState, RootState> = {
  namespaced: true,
  state() {
    return {
      filesystem: [] as FileOrDirectory[],
      openFolder: null,
      searchQuery: "",
      history: {
        recentFoldersId: [],
        index: -1,
      }
    }
  },
  getters: {
    getFilesystem(state: FileState) {
      console.log("RETURNING FILESYSTEM", state.filesystem)
      return state.filesystem
    },
    getSearchQuery(state: FileState) { return state.searchQuery },
    getCurrentFile(state: FileState) {
      console.log("returning current file id", state.openFolder)
      return state.openFolder
    },
    getPathToRoot(state: FileState) {
      if (!state.openFolder) {
        return [] as FileOrDirectory[]
      }
      var path = [] as FileOrDirectory[]
      var folderId = state.openFolder
      var file = state.filesystem.find((file) => { return file.id == folderId })
      while (file) {
        path.push(file);
        if (!file.parentDirectoryId) break
        folderId = file.parentDirectoryId
        file = state.filesystem.find(file => file.id === folderId)
      }
      return path
    },
    // Returns true if can go forward, false otherwise
    canHistoryNavigateForward(state:FileState): boolean {
      return state.history.index < state.history.recentFoldersId.length - 1;
    },
        // Returns true if can go back, false otherwise
    canHistoryNavigateBack(state:FileState): boolean {
      return state.history.index > 0;
    },
  },
  mutations: {
    SET_FILESYSTEM(state, payload: FileOrDirectory[]) {
      state.filesystem = payload;
      console.log("set filesystem ", state.filesystem)

      state.history.index = -1;
      state.history.recentFoldersId = []
      state.openFolder = null
    },
    MOVE_FILE(state, payload: MoveFilePayload) {
      // Find the item in the filesystem array
      const itemToMove = state.filesystem.find(item => item.id === payload.itemId);

      if (itemToMove) {
        // Update its parentId
        itemToMove.parentDirectoryId = payload.newParentId || undefined;
      } else {
        console.warn(`[store] MOVE_FILE: Item with id ${payload.itemId} not found.`);
      }
    },
    SET_SEARCH_QUERY(state, payload: string) {
      state.searchQuery = payload;
    },
    SET_OPEN_FOLDER(state, payload: number | null) {
      state.history.recentFoldersId = state.history.recentFoldersId.slice(0, state.history.index + 1);
      state.history.recentFoldersId.push(payload);
      state.history.index = state.history.recentFoldersId.length - 1;
      state.openFolder = payload;
    },
    ADD_TO_HISTORY(state, payload: number | null) {
      state.history.recentFoldersId.splice(state.history.index)//clear saved future history
      state.history.recentFoldersId.push(payload);
      state.history.index++;
      state.openFolder = payload;
    },
    HISTORY_BACK(state) {
      if (state.history.index <= 0) {
        console.log("cannot go back in history");
        return;
      }

      state.history.index--;
      state.openFolder = state.history.recentFoldersId[state.history.index];
    },
    HISTORY_FORWARD(state) {
      if (state.history.recentFoldersId.length <= state.history.index + 1) {
        console.log("cannot go forward in history");
        return;
      }

      state.history.index++;
      state.openFolder = state.history.recentFoldersId[state.history.index];
    }

  } as FileMutations,
  actions: {
    //add file
    //remove file
    //copy file

    generateRandomFilesystem({ commit }, payload: { count: number }) {

      // console.log("generating random filesystem")
      commit("SET_FILESYSTEM", generateFiles(payload.count));
    },
    setFilesystem({commit}, payload:FileOrDirectory[]){

      commit("SET_FILESYSTEM", payload);
    },
    addFile({ commit }, file: FileOrDirectory) {
      console.log("todo add file");
    },
    moveFile({ commit }, payload: MoveFilePayload) {
      commit('MOVE_FILE', payload);
    },
    setSearchQuery({ commit }, query: string) {
      console.log("setting search querry", query)
      commit('SET_SEARCH_QUERY', query);
    },
    setOpenFolder({ commit }, payload: number | null) {
      console.log("setting open folder to ", payload)
      commit("SET_OPEN_FOLDER", payload)
    },

    navigateHistoryBack({ commit }) {
      console.log("navigating history back")
      commit("HISTORY_BACK");
    },

    navigateHistoryForward({ commit }) {
      console.log("navigating history forward")
      commit("HISTORY_FORWARD");
    },




  },

}
