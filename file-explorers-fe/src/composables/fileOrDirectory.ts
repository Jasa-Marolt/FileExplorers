import type { FileOrDirectory } from '@/files'
import { computed, readonly, type ComputedRef, type Ref } from 'vue'

export type Directory = FileOrDirectory & { children?: FileOrDirectory[] }
type FlatDirectory = Map<number, Directory>

/**
 * Constructs a flat directory structure containing all directories and the files/subdirectories in them
 * Preferring this flat structure to a recursive one because it makes lookup easier and faster
 * @param files The files from which to build the structure
 */
export function buildFileStructure(files: FileOrDirectory[]) {
  const flatDirectory: FlatDirectory = new Map()
  const rootDirectory: FileOrDirectory[] = []

  for (const file of files) {
    if (file.isDirectory) {
      flatDirectory.set(file.id, {
        ...file,
        children: files.filter(({ parentDirectoryId }) => parentDirectoryId === file.id)
      })
    }

    if (!file.parentDirectoryId) {
      rootDirectory.push(file)
    }
  }

  return {
    flatDirectory,
    rootDirectory
  }
}

export function buildPathToRoot(flatDirectory: FlatDirectory, directoryId: number, paths: Directory[]) {
  const directory = flatDirectory.get(directoryId)
  if (directory) {
    paths.push(directory)
  }

  if (directory?.parentDirectoryId) {
    buildPathToRoot(flatDirectory, directory.parentDirectoryId, paths)
  }

  return paths
}
export function useDirectoryPath(
  directoryStructure: ComputedRef<ReturnType<typeof buildFileStructure>>,
  currentDirectoryId: ComputedRef<number | undefined>
) {
  const currentDirectoryPathToRoot: Record<string, Directory[] | undefined> = {}

  const pathToRoot = computed(() => {
    const id = currentDirectoryId.value
    if (id === undefined) {
      return []
    }

    // Check cache
    const cachedPath = currentDirectoryPathToRoot[id]
    if (cachedPath) {
      return cachedPath.slice().reverse() // Return reversed for display
    }

    // Build and cache
    const directoryHierarchy = buildPathToRoot(
      directoryStructure.value.flatDirectory,
      id,
      []
    )
    currentDirectoryPathToRoot[id] = directoryHierarchy

    // Return reversed for display
    return directoryHierarchy.slice().reverse()
  })

  return { pathToRoot }
}

// --- Directory Search Utility (e.g., in a separate file: 'search-utils.ts') ---

/**
 * Checks if a filename (needle) exists within a directory or any of its subdirectories.
 * Performs a recursive search.
 */
export function useDirectorySearch(
  directoryStructure: ComputedRef<ReturnType<typeof buildFileStructure>>
) {
  function isInDirectory(directoryId: number, filename?: string): boolean {
    const needle = filename?.toLowerCase()

    if (!needle) {
      return true
    }

    const directory = directoryStructure.value.flatDirectory.get(directoryId)
    if (!directory) {
      return false
    }

    // 1. Check current directory name
    if (directory.name.toLowerCase().includes(needle)) {
      return true
    }

    if (!directory.children) {
      return false
    }

    // 2. Check direct children (files and directories)
    const matchFoundInChildren = directory.children.some(
      (file) => file.name.toLowerCase().includes(needle)
    )
    if (matchFoundInChildren) {
      return true
    }

    // 3. Recurse into subdirectories
    const directoriesInChildren = directory.children.filter(({ isDirectory }) => isDirectory)

    for (const subDirectory of directoriesInChildren) {
      if (isInDirectory(subDirectory.id, needle)) {
        return true
      }
    }

    return false
  }

  return { isInDirectory }
}


// --- Main Composable (Original file) ---

export function useFileOrDirectoryStructure(
  files: FileOrDirectory[],
  currentDirectoryId: ComputedRef<number | undefined>
) {
  const directoryStructure = computed(() => buildFileStructure(files))

  // Extracted utilities
  const { pathToRoot } = useDirectoryPath(directoryStructure, currentDirectoryId)
  const { isInDirectory } = useDirectorySearch(directoryStructure)

  const itemsAtDirectory = computed(() => {
    const id = currentDirectoryId.value

    if (id === undefined) {
      return {
        files: directoryStructure.value.rootDirectory,
        pathToRoot: [],
      }
    }

    const currentDirectory = directoryStructure.value.flatDirectory.get(id)

    if (!currentDirectory) {
      // PathToRoot is already an empty array if id is invalid/not found
      return {
        files: [],
        pathToRoot: [],
      }
    }

    return {
      files: currentDirectory.children ?? [],
      pathToRoot: pathToRoot.value, // Already computed and reversed
    }
  })

  return {
    itemsAtDirectory: readonly(itemsAtDirectory),
    isInDirectory,
  }
}