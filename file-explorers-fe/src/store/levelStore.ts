import { Module, MutationTree } from "vuex";
// import { LevelInterface } from "./levels";
import { FileOrDirectory } from "@/files";
// export interface Level {
//     id: number;
//     name?: string;
//     description?: string;
//     solved?: boolean;
// }
export interface Level {
    id: number,
    name: string,
    startingFilesystem: FileOrDirectory[],
    levelSolution: solutionFileInterface[],
    difficulty: string,
    description: string,
    instructions: string,
    solved:boolean;
}
export interface solutionFileInterface {
    id?: number,
    name?: string,
    parentDirectoryId?: number | undefined,
    removed: boolean
}

export interface LevelState {
    levels: Level[];
    currentLevel: Level | null;
}

export interface RootState {}

interface LevelMutations extends MutationTree<LevelState> {
    SET_LEVELS(state: LevelState, payload: Level[]): void;
    SET_CURRENT_LEVEL(state: LevelState, payload: Level | null): void;
    MARK_LEVEL_SOLVED(state: LevelState, levelId: number): void;
}

export const levelStoreModule: Module<LevelState, RootState> = {
    namespaced: true,
    state() {
        return {
            levels: [],
            currentLevel: null,
        };
    },
    getters: {
        levels(state) {
            return state.levels;
        },
        currentLevel(state) {
            console.log("Getting current level:", state.currentLevel);
            return state.currentLevel;
        },
    },
    mutations: {
        SET_LEVELS(state, payload) {
            state.levels = payload;
        },
        SET_CURRENT_LEVEL(state, payload) {
            state.currentLevel = payload;
        },
        CLEAR_LEVELS(state) {
            state.levels = [];
            state.currentLevel = null;
        },
        MARK_LEVEL_SOLVED(state, levelId) {
            const level = state.levels.find((l) => l.id === levelId);
            if (level) level.solved = true;
            if (state.currentLevel?.id === levelId)
                state.currentLevel.solved = true;
        },
    } as LevelMutations,
    actions: {
        async fetchLevels({ commit, rootGetters }) {
            try {
                const token = rootGetters["userStoreModule/getToken"];

                const res = await fetch(
                    `${
                        process.env.VUE_APP_API_URL || "http://localhost:8080"
                    }/level`,
                    {
                        headers: token
                            ? { Authorization: `Bearer ${token}` }
                            : {},
                    }
                );

                if (!res.ok) throw new Error("Failed to fetch levels");

                const result = await res.json();
                console.log("Fetched level:", result);
                commit("SET_LEVELS", result.data);
            } catch (error) {
                console.error("Error fetching levels:", error);
            }
        },

        async fetchLevel({ commit }, levelId: number) {
            const res = await fetch(
                `${
                    process.env.VUE_APP_API_URL || "http://localhost:8080"
                }/level/${levelId}`
            );
            const result = await res.json();

            commit("SET_CURRENT_LEVEL", result.data);
            return result.data;
        },

        async solveLevel({ commit, rootGetters }, levelId: number) {
            const token = rootGetters["userStoreModule/getToken"];
            if (!token) {
                return;
            }

            const res = await fetch(
                `${
                    process.env.VUE_APP_API_URL || "http://localhost:8080"
                }/level/${levelId}`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (res.ok) commit("MARK_LEVEL_SOLVED", levelId);
        },
    },
};
