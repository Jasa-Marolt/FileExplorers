import { FileOrDirectory, generateFiles } from "@/files"
import { Module, MutationTree } from "vuex";
export interface FileState {
  filesystem: FileOrDirectory[];
  openFolder: number | null;
}
export interface RootState {

}
interface FileMutations extends MutationTree<FileState> {
  // Add any necessary mutation type definitions here
  SET_FILESYSTEM(state: FileState, payload: FileOrDirectory[]): void;
  MOVE_FILE(state: FileState, payload: MoveFilePayload): void;
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
      openFolder: null
    }
  },
  getters: {
    getFilesystem(state: FileState) { return state.filesystem }
  },
  mutations: {
    SET_FILESYSTEM(state, payload: FileOrDirectory[]) {
      state.filesystem = payload;
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
  } as FileMutations,
  actions: {
    //add file
    //remove file
    //copy file

    generateRandomFilesystem({ commit }, payload: { count: number }) {
      console.log("setting file mutation");
      commit("SET_FILESYSTEM", generateFiles(payload.count));
    },
    addFile({ commit }, file: FileOrDirectory) {
      console.log("todo add file");
    },
    moveFile({ commit }, payload: MoveFilePayload) {
      commit('MOVE_FILE', payload);
    }
  },

}