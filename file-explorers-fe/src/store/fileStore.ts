import { FileOrDirectory, generateFiles } from "@/files"
import { useFileOrDirectoryStructure, useDirectoryPath, useDirectorySearch, buildFileStructure, buildPathToRoot } from "@/composables/fileOrDirectory"

import { Module, MutationTree } from "vuex";
export interface FileState {
  filesystem: FileOrDirectory[];
  openFolder: number | null;
  searchQuery: string;
}
export interface RootState {

}
interface FileMutations extends MutationTree<FileState> {
  // Add any necessary mutation type definitions here
  SET_FILESYSTEM(state: FileState, payload: FileOrDirectory[]): void;
  MOVE_FILE(state: FileState, payload: MoveFilePayload): void;
  SET_SEARCH_QUERY(state: FileState, payload: string): void;
  SET_OPEN_FOLDER(state: FileState, payload: number | null): void;
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
    }
  },
  getters: {
    getFilesystem(state: FileState) { return state.filesystem },
    getSearchQuery(state: FileState) { return state.searchQuery },
    getCurrentFile(state: FileState) {
      console.log("returning current file id", state.openFolder)
      return state.openFolder
    },

  },
  mutations: {
    SET_FILESYSTEM(state, payload: FileOrDirectory[]) {
      state.filesystem = payload;
      console.log("set filesystem ", state.filesystem)
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
      state.openFolder = payload
    }
  } as FileMutations,
  actions: {
    //add file
    //remove file
    //copy file

    generateRandomFilesystem({ commit }, payload: { count: number }) {

      console.log("generating random filesystem")
      commit("SET_FILESYSTEM", generateFiles(payload.count));
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
    }
  },

}
