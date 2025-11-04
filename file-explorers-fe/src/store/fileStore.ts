import { FileOrDirectory, generateFiles } from "@/files";
import {
    useFileOrDirectoryStructure,
    useDirectoryPath,
    useDirectorySearch,
    buildFileStructure,
} from "@/composables/fileOrDirectory";
import { Module, MutationTree } from "vuex";
export interface FileState {
    filesystem: FileOrDirectory[];
    initialFilesystem: FileOrDirectory[];
    openFolder: number | null;
    searchQuery: string;
    history: {
        recentFoldersId: (number | null)[];
        index: number;
    };
    selectedFiles: FileOrDirectory[];
    copyBuffer: FileOrDirectory[];
    nextId: number;
}
export interface RootState {}
interface FileMutations extends MutationTree<FileState> {
    SET_FILESYSTEM(state: FileState, payload: FileOrDirectory[]): void;
    MOVE_FILE(state: FileState, payload: MoveFilePayload): void;
    SET_SEARCH_QUERY(state: FileState, payload: string): void;
    SET_OPEN_FOLDER(state: FileState, payload: number | null): void;
    ADD_TO_HISTORY(state: FileState, payload: number | null): void;
    HISTORY_BACK(state: FileState): void;
    HISTORY_FORWARD(state: FileState): void;
    SET_SELECTED_FILES(state: FileState, payload: FileOrDirectory[]): void;
    CREATE_FILE(state: FileState, payload: { name: string }): void;
    CREATE_FOLDER(state: FileState, payload: { name: string }): void;
    DELETE_FILES(state: FileState, payload: number[]): void;
    COPY_FILES(state: FileState, payload: number[]): void;
    PASTE_FILES(state: FileState): void;
    RENAME_FILE(
        state: FileState,
        payload: { id: number; newName: string }
    ): void;
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
            initialFilesystem: [] as FileOrDirectory[],
            openFolder: null,
            searchQuery: "",
            history: {
                recentFoldersId: [],
                index: -1,
            },
            selectedFiles: [],
            copyBuffer: [],
            nextId: 1,
        };
    },
    getters: {
        getFilesystem(state: FileState) {
            console.log("RETURNING FILESYSTEM", state.filesystem);
            return state.filesystem;
        },
        getSearchQuery(state: FileState) {
            return state.searchQuery;
        },
        getCurrentFile(state: FileState) {
            console.log("returning current file id", state.openFolder);
            return state.openFolder;
        },
        getPathToRoot(state: FileState) {
            if (!state.openFolder) {
                return [] as FileOrDirectory[];
            }
            var path = [] as FileOrDirectory[];
            var folderId = state.openFolder;
            var file = state.filesystem.find((file) => {
                return file.id == folderId;
            });
            while (file) {
                path.push(file);
                if (!file.parentDirectoryId) break;
                folderId = file.parentDirectoryId;
                file = state.filesystem.find((file) => file.id === folderId);
            }
            return path;
        },
        // Returns true if can go forward, false otherwise
        canHistoryNavigateForward(state: FileState): boolean {
            return (
                state.history.index < state.history.recentFoldersId.length - 1
            );
        },
        // Returns true if can go back, false otherwise
        canHistoryNavigateBack(state: FileState): boolean {
            return state.history.index >= 0;
        },
        getSelectedFiles(state: FileState) {
            return state.selectedFiles;
        },
        getCopyBuffer(state: FileState) {
            return state.copyBuffer;
        },
        getInitialFilesystem(state: FileState) {
            return state.initialFilesystem;
        },
    },
    mutations: {
        SET_FILESYSTEM(state, payload: FileOrDirectory[]) {
            console.log("payload ", payload, " typeof ", typeof payload);
            // normalize payload to an array to avoid calling .map on undefined
            const files = payload ?? [];

            // Deep copy into state so callers can't mutate the input later
            state.filesystem = JSON.parse(JSON.stringify(files));
            state.initialFilesystem = JSON.parse(JSON.stringify(files));

            console.log("set filesystem ", state.filesystem);

            // Compute nextId safely. If files is empty, Math.max(...[], 0) === 0
            state.nextId = Math.max(...files.map((f) => f.id), 0) + 1;
            state.history.index = -1;
            state.history.recentFoldersId = [];
            state.openFolder = null;
            state.selectedFiles = [];
            state.copyBuffer = [];
        },
        MOVE_FILE(state, payload: MoveFilePayload) {
            // Find the item in the filesystem array
            const itemToMove = state.filesystem.find(
                (item) => item.id === payload.itemId
            );

            if (itemToMove) {
                // Update its parentId
                itemToMove.parentDirectoryId = payload.newParentId || undefined;
            } else {
                console.warn(
                    `[store] MOVE_FILE: Item with id ${payload.itemId} not found.`
                );
            }
        },
        SET_SEARCH_QUERY(state, payload: string) {
            state.searchQuery = payload;
        },
        SET_OPEN_FOLDER(state, payload: number | null) {
            state.history.recentFoldersId = state.history.recentFoldersId.slice(
                0,
                state.history.index + 1
            );
            state.selectedFiles = [];
            state.history.recentFoldersId.push(payload);
            state.history.index = state.history.recentFoldersId.length - 1;
            state.openFolder = payload;
        },
        ADD_TO_HISTORY(state, payload: number | null) {
            state.history.recentFoldersId.splice(state.history.index); //clear saved future history
            state.history.recentFoldersId.push(payload);
            state.history.index++;
            state.openFolder = payload;
        },
        HISTORY_BACK(state) {
            state.selectedFiles = [];
            if (state.history.index <= 0) {
                state.history.index = -1;
                state.openFolder = null;
                // console.log("cannot go back in history");
                return;
            }

            state.history.index--;
            state.openFolder =
                state.history.recentFoldersId[state.history.index];
        },
        HISTORY_FORWARD(state) {
            state.selectedFiles = [];
            if (
                state.history.recentFoldersId.length <=
                state.history.index + 1
            ) {
                console.log("cannot go forward in history");
                return;
            }

            state.history.index++;
            state.openFolder =
                state.history.recentFoldersId[state.history.index];
        },
        SET_SELECTED_FILES(state, payload: FileOrDirectory[]) {
            state.selectedFiles = payload;
            console.log("set selected files to ", state.selectedFiles);
        },
        CREATE_FILE(state, payload: { name: string }) {
            const newFile: FileOrDirectory = {
                id: state.nextId++,
                name: payload.name,
                isDirectory: false,
                parentDirectoryId: state.openFolder ?? undefined,
            };
            state.filesystem.push(newFile);
        },
        CREATE_FOLDER(state, payload: { name: string }) {
            const newFolder: FileOrDirectory = {
                id: state.nextId++,
                name: payload.name,
                isDirectory: true,
                parentDirectoryId: state.openFolder ?? undefined,
            };
            state.filesystem.push(newFolder);
        },
        DELETE_FILES(state, payload: number[]) {
            const deletedIds = new Set<number>();

            const deleteRecursive = (id: number) => {
                deletedIds.add(id);
                const children = state.filesystem.filter(
                    (f) => f.parentDirectoryId === id
                );
                children.forEach((child) => deleteRecursive(child.id));
                state.filesystem = state.filesystem.filter((f) => f.id !== id);
            };

            payload.forEach((id) => deleteRecursive(id));
            state.selectedFiles = [];

            state.history.recentFoldersId =
                state.history.recentFoldersId.filter(
                    (folderId) => folderId === null || !deletedIds.has(folderId)
                );

            if (state.history.index >= state.history.recentFoldersId.length) {
                state.history.index = state.history.recentFoldersId.length - 1;
            }

            if (state.openFolder !== null && deletedIds.has(state.openFolder)) {
                if (state.history.index >= 0) {
                    state.openFolder =
                        state.history.recentFoldersId[state.history.index];
                } else {
                    state.openFolder = null;
                }
            }
        },
        COPY_FILES(state, payload: number[]) {
            const filesToCopy: FileOrDirectory[] = [];
            const addWithChildren = (id: number) => {
                const file = state.filesystem.find((f) => f.id === id);
                if (file) {
                    filesToCopy.push(file);
                    if (file.isDirectory) {
                        const children = state.filesystem.filter(
                            (f) => f.parentDirectoryId === id
                        );
                        children.forEach((child) => addWithChildren(child.id));
                    }
                }
            };

            payload.forEach((id) => addWithChildren(id));
            state.copyBuffer = filesToCopy;
        },
        PASTE_FILES(state) {
            const idMapping = new Map<number, number>();
            const rootItems = state.copyBuffer.filter(
                (file) =>
                    !state.copyBuffer.some(
                        (f) => f.id === file.parentDirectoryId
                    )
            );

            const copyRecursive = (
                file: FileOrDirectory,
                newParentId: number | undefined
            ): FileOrDirectory => {
                const newFile: FileOrDirectory = {
                    id: state.nextId++,
                    name: file.name,
                    isDirectory: file.isDirectory,
                    parentDirectoryId: newParentId,
                };
                state.filesystem.push(newFile);
                idMapping.set(file.id, newFile.id);

                const children = state.copyBuffer.filter(
                    (f) => f.parentDirectoryId === file.id
                );
                children.forEach((child) => copyRecursive(child, newFile.id));

                return newFile;
            };

            rootItems.forEach((file) => {
                copyRecursive(file, state.openFolder ?? undefined);
            });
        },
        RENAME_FILE(state, payload: { id: number; newName: string }) {
            const file = state.filesystem.find((f) => f.id === payload.id);
            if (file) {
                file.name = payload.newName;
            }
        },
    } as FileMutations,
    actions: {
        //add file
        //remove file
        //copy file

        generateRandomFilesystem({ commit }, payload: { count: number }) {
            // console.log("generating random filesystem")
            commit("SET_FILESYSTEM", generateFiles(payload.count));
        },
        setFilesystem({ commit }, payload: FileOrDirectory[]) {
            commit("SET_FILESYSTEM", payload);
        },
        addFile({ commit }, file: FileOrDirectory) {
            console.log("todo add file");
        },
        moveFile({ commit }, payload: MoveFilePayload) {
            commit("MOVE_FILE", payload);
        },
        setSearchQuery({ commit }, query: string) {
            console.log("setting search querry", query);
            commit("SET_SEARCH_QUERY", query);
        },
        setOpenFolder({ commit }, payload: number | null) {
            console.log("setting open folder to ", payload);
            commit("SET_OPEN_FOLDER", payload);
        },

        navigateHistoryBack({ commit }) {
            console.log("navigating history back");
            commit("HISTORY_BACK");
        },

        navigateHistoryForward({ commit }) {
            console.log("navigating history forward");
            commit("HISTORY_FORWARD");
        },
        setSelectedFiles({ commit }, payload: FileOrDirectory[]) {
            commit("SET_SELECTED_FILES", payload);
        },
        createFile({ commit }, payload: { name: string }) {
            commit("CREATE_FILE", payload);
        },
        createFolder({ commit }, payload: { name: string }) {
            commit("CREATE_FOLDER", payload);
        },
        deleteFiles({ commit }, payload: number[]) {
            commit("DELETE_FILES", payload);
        },
        copyFiles({ commit }, payload: number[]) {
            commit("COPY_FILES", payload);
        },
        pasteFiles({ commit }) {
            commit("PASTE_FILES");
        },
        renameFile({ commit }, payload: { id: number; newName: string }) {
            commit("RENAME_FILE", payload);
        },
    },
};
