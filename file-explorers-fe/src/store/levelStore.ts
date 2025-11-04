import { Module, MutationTree } from "vuex";
import { FileOrDirectory } from "@/files";
export interface Level {
    level_id: number;
    name?: string;
    description?: string;
    solved?: boolean;
    startingFileSystem?: FileOrDirectory[];
    difficulty?: number;
    instructions?: string;
    solution?: SolutionFile[];
}
export interface SolutionFile {
  id?: number,
  name?: string,
  isDirectory?: boolean,
  parentDirectoryId?: number | null,
  removed?: boolean
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
            console.log("level store: getting current level:", state.currentLevel);
            return state.currentLevel;
        },
    },
    mutations: {
        SET_LEVELS(state, payload) {
            state.levels = payload;
        },
        SET_CURRENT_LEVEL(state, payload) {
            console.log("level store: setting current level ", payload)
            state.currentLevel = payload;

            

        },
        CLEAR_LEVELS(state) {
            state.levels = [];
            state.currentLevel = null;
        },
        MARK_LEVEL_SOLVED(state, levelId) {
            const level = state.levels.find((l) => l.level_id === levelId);
            if (level) level.solved = true;
            if (state.currentLevel?.level_id === levelId)
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

                if (!res.ok) {
                    console.error("Failed to fetch levels, status:", res);
                    throw new Error("Failed to fetch levels");
                }

                const result = await res.json();
                console.log("Fetched levels:", result);
                commit("SET_LEVELS", result.data);
            } catch (error) {
                console.error("Error fetching levels:", error);
            }
        },

        async fetchLevel({ commit, rootGetters }, levelId: number) {
            try {
                const token = rootGetters["userStoreModule/getToken"];
                const res = await fetch(
                    `${
                        process.env.VUE_APP_API_URL || "http://localhost:8080"
                    }/level/${levelId}`,
                    {
                        headers: token
                            ? { Authorization: `Bearer ${token}` }
                            : {},
                    }
                );
                console.log("got getLevel response ", res)
                if (!res.ok) {
                    console.error("Failed to fetch level, status:", res);
                    throw new Error("Failed to fetch level");
                }

                const result = await res.json();
                console.log("Fetched level:", result.data);
                commit("SET_CURRENT_LEVEL", result.data);
                return result.data;
            } catch (error) {
                console.error("Error fetching level:", error);
            }
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
