import { createStore } from "vuex";
import { fileStoreModule, FileState } from "./fileStore";
import { userStoreModule, UserState } from "./userStore";
import { levelStoreModule, LevelState } from "./levelStore";

export interface State {
    fileStoreModule: FileState;
    userStoreModule: UserState;
    levelStoreModule: LevelState;
}
export default createStore({
    state: {},
    getters: {},
    mutations: {},
    actions: {},
    modules: {
        fileStoreModule,
        userStoreModule,
        levelStoreModule,
    },
});
