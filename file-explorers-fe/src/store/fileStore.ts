import { FileOrDirectory, generateFiles } from "@/files"
import { Module, MutationTree } from "vuex";
export interface FileState {
  filesystem: FileOrDirectory[];
  openFolder:number|null;
}
export interface RootState{

}
interface FileMutations extends MutationTree<FileState> {
    // Add any necessary mutation type definitions here
    SET_FILESYSTEM(state: FileState, payload: FileOrDirectory[]): void;
}


export const fileStoreModule: Module<FileState, RootState> = {
  state(){
    return{
      filesystem: [] as FileOrDirectory[],
      openFolder:null
    }
  },
  getters:{
    getFilesystem(state: FileState){return state.filesystem}
  },
  mutations: {
    SET_FILESYSTEM(state, payload: FileOrDirectory[]) {
        state.filesystem = payload;
    }
  } as FileMutations,
  actions:{
    //add file
    //remove file
    //copy file

    generateRandomFilesystem({commit},payload:{count:number}){
      commit("SET_FILESYSTEM", generateFiles(payload.count));
    },
    addFile({commit},file:FileOrDirectory){
      console.log("todo add file");
    }
  },

}