<template>
    <div class="terminal-container" ref="terminalContainer">
        <Terminal welcomeMessage="For help use the 'help' command" prompt="$ " class="custom-terminal"
            @keydown="handleKeyDown" />
    </div>
</template>

<script setup lang="ts">
import Terminal from 'primevue/terminal';
import TerminalService from 'primevue/terminalservice';
import { onMounted, onUnmounted, ref, nextTick } from 'vue';
import { useStore } from 'vuex';
import { FileOrDirectory } from '@/files';

const store = useStore();
const terminalContainer = ref<HTMLElement | null>(null);

const commandHistory = ref<string[]>([]);
const historyIndex = ref<number>(-1);
const currentInput = ref<string>('');

function matchGlob(pattern: string, text: string): boolean {
    const regexPattern = pattern
        .replace(/[.+^${}()|[\]\\]/g, '\\$&')
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.');

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(text);
}

function findMatchingFiles(pattern: string, filesystem: FileOrDirectory[], currentFolderId: number | null): FileOrDirectory[] {
    return filesystem.filter(f =>
        f.parentDirectoryId === currentFolderId &&
        matchGlob(pattern, f.name)
    );
}

function findCommonPrefix(strings: string[]): string {
    if (strings.length === 0) return '';
    if (strings.length === 1) return strings[0];

    let prefix = strings[0];
    for (let i = 1; i < strings.length; i++) {
        while (strings[i].indexOf(prefix) !== 0) {
            prefix = prefix.substring(0, prefix.length - 1);
            if (prefix === '') return '';
        }
    }
    return prefix;
}

function resolvePath(path: string): { item: FileOrDirectory | null, parentId: number | null, fileName: string } {
    const filesystem: FileOrDirectory[] = store.getters['fileStoreModule/getFilesystem'];
    const currentFolderId: number | null = store.getters['fileStoreModule/getCurrentFile'];

    if (path === '.' || path === '') {
        return { item: null, parentId: currentFolderId, fileName: '' };
    }

    if (path === '..') {
        const currentFolder = currentFolderId ? filesystem.find(f => f.id === currentFolderId) : null;
        return { item: null, parentId: currentFolder?.parentDirectoryId ?? null, fileName: '' };
    }

    const cleanPath = path.endsWith('/') ? path.slice(0, -1) : path;

    const parts = cleanPath.split('/').filter(p => p && p !== '.');

    if (parts.length === 0) {
        return { item: null, parentId: path.startsWith('/') ? null : currentFolderId, fileName: '' };
    }

    let currentId: number | null = cleanPath.startsWith('/') ? null : currentFolderId;

    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isLast = i === parts.length - 1;

        if (part === '..') {
            const current = currentId ? filesystem.find(f => f.id === currentId) : null;
            currentId = current?.parentDirectoryId ?? null;
            continue;
        }

        const found = filesystem.find(f =>
            f.name === part &&
            f.parentDirectoryId === currentId
        );

        if (!found) {
            return { item: null, parentId: currentId, fileName: part };
        }

        if (isLast) {
            if (path.endsWith('/') && found.isDirectory) {
                return { item: null, parentId: found.id, fileName: '' };
            }
            return { item: found, parentId: currentId, fileName: found.name };
        }

        if (!found.isDirectory) {
            return { item: null, parentId: currentId, fileName: part };
        }

        currentId = found.id;
    }

    return { item: null, parentId: currentId, fileName: '' };
}// Tab completion function
function handleTabCompletion(input: string): string | null {
    const parts = input.trim().split(/\s+/);
    if (parts.length === 0) return null;

    const lastPart = parts[parts.length - 1];
    if (!lastPart) return null;

    const filesystem: FileOrDirectory[] = store.getters['fileStoreModule/getFilesystem'];

    // Parse the path to get directory and partial filename
    const lastSlashIndex = lastPart.lastIndexOf('/');
    let dirPath = '';
    let partial = lastPart;

    if (lastSlashIndex !== -1) {
        dirPath = lastPart.substring(0, lastSlashIndex + 1);
        partial = lastPart.substring(lastSlashIndex + 1);
    }

    const { parentId } = resolvePath(dirPath || '.');

    const matches = filesystem.filter(f =>
        f.parentDirectoryId === parentId &&
        f.name.startsWith(partial)
    );

    if (matches.length === 0) {
        return null;
    }

    if (matches.length === 1) {
        const completed = dirPath + matches[0].name;
        parts[parts.length - 1] = completed;
        return parts.join(' ');
    }

    const names = matches.map(f => f.name);
    const commonPrefix = findCommonPrefix(names);

    if (commonPrefix.length > partial.length) {
        parts[parts.length - 1] = dirPath + commonPrefix;
        return parts.join(' ');
    }

    const options = names.join('  ');
    TerminalService.emit('response', options);
    return null;
}

const commandHandlers: Record<string, (args: string[]) => string | void> = {
    help(args) {
        if (args[0]) {
            return helpFor(args[0]);
        }

        return `Available commands:
  help [command]
  
  ls              - List files and directories
  pwd             - Print working directory
  echo <text>     - Display text
  cd <dir>        - Change directory
  mkdir <dir>     - Create directory
  rm <file|dir>   - Remove file or directory
  touch <file>    - Create file
  cp <src> <dst>  - Copy file or directory
  mv <src> <dst>  - Move or rename file or directory
  find <name>     - Search for files and directories`;
    },

    find(args) {
        if (!args[0]) {
            return 'find: missing search pattern';
        }

        const searchPattern = args[0];
        const filesystem: FileOrDirectory[] = store.getters['fileStoreModule/getFilesystem'];

        const pathMap = new Map<number, string>();

        function buildPath(fileId: number): string {
            if (pathMap.has(fileId)) {
                return pathMap.get(fileId)!;
            }

            const file = filesystem.find(f => f.id === fileId);
            if (!file) return '';

            if (file.parentDirectoryId === null || file.parentDirectoryId === undefined) {
                const path = '/' + file.name;
                pathMap.set(fileId, path);
                return path;
            }

            const parentPath = buildPath(file.parentDirectoryId);
            const path = parentPath + '/' + file.name;
            pathMap.set(fileId, path);
            return path;
        }

        const matches: { file: FileOrDirectory, path: string }[] = [];

        for (const file of filesystem) {
            if (file.name.includes(searchPattern)) {
                const path = buildPath(file.id);
                matches.push({ file, path });
            }
        }

        if (matches.length === 0) {
            return `find: no files or directories matching '${searchPattern}'`;
        }

        const results = matches.map(m => {
            const type = m.file.isDirectory ? 'd' : 'f';
            return `[${type}] ${m.path}`;
        });

        return results.join('\n');
    },

    ls(args) {
        const filesystem: FileOrDirectory[] = store.getters['fileStoreModule/getFilesystem'];
        const currentFolderId: number | null = store.getters['fileStoreModule/getCurrentFile'];

        const items = filesystem.filter(f => f.parentDirectoryId === currentFolderId);

        if (items.length === 0) {
            return 'Directory is empty';
        }

        const dirs = items.filter(f => f.isDirectory).map(f => f.name + '/');
        const files = items.filter(f => !f.isDirectory).map(f => f.name);

        return [...dirs, ...files].join('  ');
    },

    pwd(args) {
        const pathToRoot: FileOrDirectory[] = store.getters['fileStoreModule/getPathToRoot'];

        if (pathToRoot.length === 0) {
            return '/';
        }

        const path = pathToRoot.reverse().map(f => f.name).join('/');
        return '/' + path;
    },


    echo(args) {
        return args.join(' ');
    },

    cd(args) {
        if (!args[0]) {
            store.dispatch('fileStoreModule/setOpenFolder', null);
            return 'Changed to root directory';
        }

        const path = args[0];
        const filesystem: FileOrDirectory[] = store.getters['fileStoreModule/getFilesystem'];
        const currentFolderId: number | null = store.getters['fileStoreModule/getCurrentFile'];

        if (path === '/') {
            store.dispatch('fileStoreModule/setOpenFolder', null);
            return 'Changed to root directory';
        }

        if (path === '..') {
            if (currentFolderId === null) {
                return 'Already at root directory';
            }

            const currentFolder = filesystem.find(f => f.id === currentFolderId);
            if (currentFolder) {
                store.dispatch('fileStoreModule/setOpenFolder', currentFolder.parentDirectoryId ?? null);
                return 'Changed to parent directory';
            }
            return 'Error: Current directory not found';
        }

        if (path === '.') {
            return 'Already in current directory';
        }

        const resolved = resolvePath(path);

        let targetId: number | null;
        if (path.endsWith('/')) {
            targetId = resolved.parentId;
        } else if (resolved.item) {
            if (!resolved.item.isDirectory) {
                return `cd: ${path}: Not a directory`;
            }
            targetId = resolved.item.id;
        } else {
            return `cd: ${path}: No such directory`;
        }

        store.dispatch('fileStoreModule/setOpenFolder', targetId);
        return `Changed to ${path}`;
    },

    mkdir(args) {
        if (!args[0]) {
            return 'mkdir: missing directory name';
        }

        const dirName = args[0];
        const filesystem: FileOrDirectory[] = store.getters['fileStoreModule/getFilesystem'];
        const currentFolderId: number | null = store.getters['fileStoreModule/getCurrentFile'];

        const exists = filesystem.some(f =>
            f.name === dirName &&
            f.parentDirectoryId === currentFolderId
        );

        if (exists) {
            return `mkdir: ${dirName}: File or directory already exists`;
        }

        store.dispatch('fileStoreModule/createFolder', { name: dirName });
        return `Created directory: ${dirName}`;
    },

    rm(args) {
        if (!args[0]) {
            return 'rm: missing file or directory name';
        }

        const isRecursive = args[0] === '-r';
        const targetName = isRecursive ? args[1] : args[0];

        if (!targetName) {
            return 'rm: missing file or directory name';
        }

        const filesystem: FileOrDirectory[] = store.getters['fileStoreModule/getFilesystem'];
        const currentFolderId: number | null = store.getters['fileStoreModule/getCurrentFile'];

        if (targetName.includes('*') || targetName.includes('?')) {
            const matchingFiles = findMatchingFiles(targetName, filesystem, currentFolderId);

            if (matchingFiles.length === 0) {
                return `rm: ${targetName}: No matches found`;
            }

            const hasDirectories = matchingFiles.some(f => f.isDirectory);
            if (hasDirectories && !isRecursive) {
                return `rm: cannot remove directories matching '${targetName}' (use -r to remove directories)`;
            }

            const fileIds = matchingFiles.map(f => f.id);
            store.dispatch('fileStoreModule/deleteFiles', fileIds);
            return `Removed ${matchingFiles.length} file(s) matching '${targetName}'`;
        }

        console.log(filesystem)
        const target = filesystem.find(f =>
            f.name === targetName &&
            f.parentDirectoryId === currentFolderId
        );

        if (!target) {
            return `rm: ${targetName}: No such file or directory`;
        }

        if (target.isDirectory && !isRecursive) {
            return `rm: ${targetName}: is a directory (use -r to remove directories)`;
        }

        store.dispatch('fileStoreModule/deleteFiles', [target.id]);
        return `Removed: ${targetName}`;
    },

    touch(args) {
        if (!args[0]) {
            return 'touch: missing file name';
        }

        const fileName = args[0];
        const filesystem: FileOrDirectory[] = store.getters['fileStoreModule/getFilesystem'];
        const currentFolderId: number | null = store.getters['fileStoreModule/getCurrentFile'];

        const exists = filesystem.some(f =>
            f.name === fileName &&
            f.parentDirectoryId === currentFolderId
        );

        if (exists) {
            return `File already exists: ${fileName}`;
        }

        store.dispatch('fileStoreModule/createFile', { name: fileName });
        return `Created file: ${fileName}`;
    },

    cp(args) {
        if (args.length < 2) {
            return 'cp: missing source or destination';
        }

        const sourceName = args[0];
        const destName = args[1];
        const filesystem: FileOrDirectory[] = store.getters['fileStoreModule/getFilesystem'];
        const currentFolderId: number | null = store.getters['fileStoreModule/getCurrentFile'];

        // Resolve source path
        const sourceResolved = resolvePath(sourceName);
        const source = sourceResolved.item;

        // Resolve destination path
        const destResolved = resolvePath(destName);
        let destDir = destResolved.item;
        let destParentId = destResolved.parentId;
        let newName = destResolved.fileName;

        // If destination is '.', use current directory
        if (destName === '.') {
            destParentId = currentFolderId;
            newName = '';
        }

        if (sourceName.includes('*') || sourceName.includes('?')) {
            const matchingFiles = findMatchingFiles(sourceName, filesystem, currentFolderId);

            if (matchingFiles.length === 0) {
                return `cp: ${sourceName}: No matches found`;
            }

            if (!destDir || !destDir.isDirectory) {
                return `cp: ${destName}: Target must be a directory when copying multiple files`;
            }

            const fileIds = matchingFiles.map(f => f.id);
            store.dispatch('fileStoreModule/copyFiles', fileIds);

            const originalFolder = currentFolderId;
            store.dispatch('fileStoreModule/setOpenFolder', destDir.id);
            store.dispatch('fileStoreModule/pasteFiles');
            store.dispatch('fileStoreModule/setOpenFolder', originalFolder);

            return `Copied ${matchingFiles.length} file(s) matching '${sourceName}' to ${destName}/`;
        }

        if (!source) {
            return `cp: ${sourceName}: No such file or directory`;
        }

        store.dispatch('fileStoreModule/copyFiles', [source.id]);

        if (destDir && destDir.isDirectory) {
            const originalFolder = currentFolderId;
            store.dispatch('fileStoreModule/setOpenFolder', destDir.id);
            store.dispatch('fileStoreModule/pasteFiles');
            store.dispatch('fileStoreModule/setOpenFolder', originalFolder);
            return `Copied ${sourceName} to ${destName}/`;
        } else if (destName === '.' || !newName) {
            const originalFolder = currentFolderId;
            store.dispatch('fileStoreModule/setOpenFolder', destParentId);
            store.dispatch('fileStoreModule/pasteFiles');
            store.dispatch('fileStoreModule/setOpenFolder', originalFolder);
            return `Copied ${sourceName} to ${destName}`;
        } else {
            const originalFolder = currentFolderId;
            store.dispatch('fileStoreModule/setOpenFolder', destParentId);
            store.dispatch('fileStoreModule/pasteFiles');

            const copiedItems = store.getters['fileStoreModule/getFilesystem'].filter((f: FileOrDirectory) =>
                f.parentDirectoryId === destParentId
            );
            const lastItem = copiedItems[copiedItems.length - 1];

            if (lastItem && lastItem.name === source.name) {
                store.dispatch('fileStoreModule/renameFile', {
                    id: lastItem.id,
                    newName: newName
                });
            }
            store.dispatch('fileStoreModule/setOpenFolder', originalFolder);
            return `Copied ${sourceName} to ${destName}`;
        }
    },

    mv(args) {
        if (args.length < 2) {
            return 'mv: missing source or destination';
        }

        const sourceName = args[0];
        const destName = args[1];
        const filesystem: FileOrDirectory[] = store.getters['fileStoreModule/getFilesystem'];
        const currentFolderId: number | null = store.getters['fileStoreModule/getCurrentFile'];

        // Resolve source path
        const sourceResolved = resolvePath(sourceName);
        const source = sourceResolved.item;

        // Resolve destination path
        const destResolved = resolvePath(destName);
        let destDir = destResolved.item;
        let destParentId = destResolved.parentId;
        let newName = destResolved.fileName;

        // If destination is '.', use current directory
        if (destName === '.') {
            destParentId = currentFolderId;
            destDir = null;
        }

        if (sourceName.includes('*') || sourceName.includes('?')) {
            const matchingFiles = findMatchingFiles(sourceName, filesystem, currentFolderId);

            if (matchingFiles.length === 0) {
                return `mv: ${sourceName}: No matches found`;
            }

            if (!destDir || !destDir.isDirectory) {
                return `mv: ${destName}: Target must be a directory when moving multiple files`;
            }

            let movedCount = 0;
            matchingFiles.forEach(file => {
                store.dispatch('fileStoreModule/moveFile', {
                    itemId: file.id,
                    newParentId: destDir!.id
                });
                movedCount++;
            });

            return `Moved ${movedCount} file(s) matching '${sourceName}' to ${destName}/`;
        }

        if (!source) {
            return `mv: ${sourceName}: No such file or directory`;
        }

        if (destDir && destDir.isDirectory) {
            store.dispatch('fileStoreModule/moveFile', {
                itemId: source.id,
                newParentId: destDir.id
            });
            return `Moved ${sourceName} to ${destName}/`;
        } else if (destName === '.') {
            store.dispatch('fileStoreModule/moveFile', {
                itemId: source.id,
                newParentId: destParentId ?? null
            });
            return `Moved ${sourceName} to current directory`;
        } else if (!newName && destParentId !== null) {
            store.dispatch('fileStoreModule/moveFile', {
                itemId: source.id,
                newParentId: destParentId
            });
            return `Moved ${sourceName} to ${destName}`;
        } else {
            if (destParentId !== source.parentDirectoryId) {
                store.dispatch('fileStoreModule/moveFile', {
                    itemId: source.id,
                    newParentId: destParentId ?? null
                });
            }
            if (newName && newName !== source.name) {
                store.dispatch('fileStoreModule/renameFile', {
                    id: source.id,
                    newName: newName
                });
            }
            return `Moved ${sourceName} to ${destName}`;
        }
    }
};

function helpFor(cmd: string): string {
    const help: Record<string, string> = {
        find: `find - Search for files and directories by name

Usage:
  find <pattern>

Examples:
  find Civilian         - Find all files/folders containing 'Civilian'
  find .txt             - Find all files containing '.txt'
  find New              - Find all files/folders containing 'New'

Output Format:
  [f] /path/to/file     - Regular file
  [d] /path/to/dir      - Directory`,

        ls: `ls - List directory contents

Usage:
  ls

Examples:
  ls`,

        pwd: `pwd - Print working directory

Usage:
  pwd

Examples:
  pwd`,

        cd: `cd - Change directory

Usage:
  cd <directory>
  cd ..
  cd

Examples:
  cd folder1       - Change to folder1 in current directory
  cd ..            - Go to parent directory
  cd               - Go to root directory`,

        mkdir: `mkdir - Create a new directory

Usage:
  mkdir <directory>

Examples:
  mkdir newfolder
  mkdir my_project`,

        rm: `rm - Remove a file or directory

Usage:
  rm <file>
  rm -r <directory>
  rm <pattern>
  rm -r <pattern>

Options:
  -r    Recursively remove directory contents

Glob Patterns:
  *    - Matches any characters
  ?    - Matches single character

Examples:
  rm file.txt
  rm -r folder1
  rm *.txt              - Remove all .txt files
  rm temp*              - Remove all files starting with 'temp'
  rm -r test*           - Remove all directories/files starting with 'test'`,

        touch: `touch - Create a new file

Usage:
  touch <file>

Examples:
  touch newfile.txt
  touch script.js`,

        cp: `cp - Copy files or directories

Usage:
  cp <source> <destination>
  cp <pattern> <directory>

Glob Patterns:
  *    - Matches any characters
  ?    - Matches single character

Examples:
  cp file.txt copy.txt
  cp folder1 folder2
  cp *.txt backup/      - Copy all .txt files to backup folder
  cp file* archive/     - Copy all files starting with 'file' to archive`,

        mv: `mv - Move or rename files or directories

Usage:
  mv <source> <destination>
  mv <pattern> <directory>

Glob Patterns:
  *    - Matches any characters
  ?    - Matches single character

Examples:
  mv old.txt new.txt      - Rename file
  mv file.txt folder1     - Move file to folder
  mv *.txt folder1        - Move all .txt files to folder1
  mv file* folder1        - Move all files starting with 'file' to folder1
  mv folder1 folder2      - Move or rename folder`,

        echo: `echo - Display text

Usage:
  echo <text>

Examples:
  echo Hello World
  echo Test message`
    };

    return help[cmd] ?? `No help available for: ${cmd}`;
}

function parseArgs(text: string): string[] {
    const args: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';

    for (let i = 0; i < text.length; i++) {
        const char = text[i];

        if ((char === '"' || char === "'") && !inQuotes) {
            inQuotes = true;
            quoteChar = char;
        } else if (char === quoteChar && inQuotes) {
            inQuotes = false;
            quoteChar = '';
        } else if (char === ' ' && !inQuotes) {
            if (current) {
                args.push(current);
                current = '';
            }
        } else {
            current += char;
        }
    }

    if (current) {
        args.push(current);
    }

    return args;
}

function onCommand(text: string) {
    const args = parseArgs(text.trim());
    if (args.length === 0) return;

    const command = args[0];
    const commandArgs = args.slice(1);

    if (text.trim() && (commandHistory.value.length === 0 || commandHistory.value[commandHistory.value.length - 1] !== text.trim())) {
        commandHistory.value.push(text.trim());
    }

    historyIndex.value = commandHistory.value.length;
    currentInput.value = '';

    const handler = commandHandlers[command];
    if (!handler) {
        TerminalService.emit('response', `Command not found: ${command}`);
        return;
    }

    const result = handler(commandArgs);
    if (typeof result === 'string') {
        TerminalService.emit('response', result);
    }
}

function handleKeyDown(event: KeyboardEvent) {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown' && event.key !== 'Tab') {
        return;
    }

    const terminalInput = terminalContainer.value?.querySelector('input') as HTMLInputElement;

    if (!terminalInput) {
        console.warn('Terminal input element not found');
        return;
    }

    if (event.key === 'Tab') {
        event.preventDefault();
        event.stopPropagation();

        const currentValue = terminalInput.value;
        const completed = handleTabCompletion(currentValue);

        if (completed !== null) {
            terminalInput.value = completed;
            terminalInput.dispatchEvent(new Event('input', { bubbles: true }));

            setTimeout(() => {
                terminalInput.setSelectionRange(completed.length, completed.length);
            }, 0);
        }
        return;
    }

    if (event.key === 'ArrowUp') {
        event.preventDefault();
        event.stopPropagation();

        if (historyIndex.value === commandHistory.value.length) {
            currentInput.value = terminalInput.value;
        }

        if (historyIndex.value > 0) {
            historyIndex.value--;
            const historyCommand = commandHistory.value[historyIndex.value];
            terminalInput.value = historyCommand;

            terminalInput.dispatchEvent(new Event('input', { bubbles: true }));

            setTimeout(() => {
                terminalInput.setSelectionRange(historyCommand.length, historyCommand.length);
            }, 0);
        }
    } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        event.stopPropagation();

        if (historyIndex.value < commandHistory.value.length) {
            historyIndex.value++;

            let newValue = '';
            if (historyIndex.value === commandHistory.value.length) {
                newValue = currentInput.value;
            } else {
                newValue = commandHistory.value[historyIndex.value];
            }

            terminalInput.value = newValue;

            terminalInput.dispatchEvent(new Event('input', { bubbles: true }));

            setTimeout(() => {
                terminalInput.setSelectionRange(newValue.length, newValue.length);
            }, 0);
        }
    }
}

onMounted(() => {
    TerminalService.on('command', onCommand);
});

onUnmounted(() => {
    TerminalService.off('command', onCommand);
});
</script>

<style scoped>
.terminal-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
}

.custom-terminal {
    width: 100%;
    height: 100%;
    flex: 1;
}

:deep(.p-terminal) {
    height: 100%;
    border: 1px solid var(--accent);
    background-color: var(--element-background);
    color: var(--text);
    text-align: left;
    white-space: pre-wrap;
}

:deep(.p-terminal-content) {
    text-align: left;
    white-space: pre-wrap;
}

:deep(.p-terminal-command) {
    display: block;
    text-align: left;
}

:deep(.p-terminal-input) {
    color: var(--text);
    text-align: left;
}

:deep(.p-terminal-prompt) {
    color: var(--text);
    text-align: left;
}

:deep(.p-terminal-response) {
    display: block;
    text-align: left;
    margin-left: 0;
    padding-left: 0;
    white-space: pre-wrap;
}
</style>
