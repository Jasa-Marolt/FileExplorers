import { createStore } from 'vuex'
import {fileStoreModule, FileState}  from "./fileStore"

export interface State {
  fileStoreModule: FileState;
}
export default createStore({
  state: {
  },
  getters: {
  },
  mutations: {
  },
  actions: {
  },
  modules: {
    fileStoreModule
  }
})
