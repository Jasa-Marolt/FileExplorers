import { createStore } from 'vuex'
import {fileStoreModule, FileState}  from "./fileStore"
import {userStoreModule, UserState}  from "./userStore"

export interface State {
  fileStoreModule: FileState;
  userStoreModule: UserState;
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
    fileStoreModule,
    userStoreModule
  }
})
