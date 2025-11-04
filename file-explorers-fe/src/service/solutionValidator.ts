import { FileOrDirectory } from "@/files";
import { SolutionFile } from "@/store/levelStore";

export interface SolutionRequirement extends SolutionFile {
    type?: string;
}

/**
 * Validates if the current filesystem meets all the solution requirements
 * @param filesystem Current filesystem state
 * @param solution Array of requirements that must be met
 * @param openFolderId Currently open folder ID (for openFolder win condition)
 * @returns true if all requirements are satisfied, false otherwise
 */
export function validateSolution(
    filesystem: FileOrDirectory[],
    solution: SolutionRequirement[],
    openFolderId?: number | null
): boolean {
    if (!solution || solution.length === 0) {
        return false;
    }

    // Check all requirements - ALL must be satisfied
    for (const requirement of solution) {
        // Handle "openFolder" type requirement (supports both type:"openFolder" and isOpened:true)
        if (requirement.type === "openFolder" || requirement.isOpened === true) {
            if (openFolderId !== requirement.id) {
                console.log(`❌ Folder ${requirement.id} must be opened. Currently open: ${openFolderId}`);
                return false;
            }
            console.log(`✅ Folder ${requirement.id} is correctly opened`);
            continue;
        }

        // Handle standard file/folder requirements (move, delete, rename)
        if (!checkRequirement(filesystem, requirement)) {
            return false;
        }
    }

    console.log("✅ All solution requirements satisfied!");
    return true;
}

/**
 * Checks if a single requirement is satisfied
 */
function checkRequirement(
    filesystem: FileOrDirectory[],
    requirement: SolutionFile
): boolean {
    const { id, name, parentDirectoryId, removed } = requirement;

    // Find the file - either by ID or by name (if ID is undefined/null)
    let file: FileOrDirectory | undefined;
    
    if (id !== undefined && id !== null) {
        // Standard ID-based lookup
        file = filesystem.find((f) => f.id === id);
    } else if (name !== undefined) {
        // Name-based lookup (for cut/paste scenarios where ID changes)
        file = filesystem.find((f) => f.name === name);
        if (file) {
            console.log(`🔍 Found file by name "${name}" with id ${file.id}`);
        }
    }

    // If the file should be removed (deleted)
    if (removed === true) {
        if (file !== undefined) {
            console.log(`❌ File "${name || id}" should be removed but still exists`);
            return false;
        }
        console.log(`✅ File "${name || id}" is correctly removed`);
        return true;
    }

    // If file should exist but doesn't
    if (!file) {
        console.log(`❌ File "${name || id}" not found in filesystem`);
        return false;
    }

    // Check name if specified (and we looked up by ID)
    if (id !== undefined && id !== null && name !== undefined && file.name !== name) {
        console.log(
            `❌ File ${id} name mismatch: expected "${name}", got "${file.name}"`
        );
        return false;
    }

    // Check parentDirectoryId if specified
    if (parentDirectoryId !== undefined) {
        const expectedParent = parentDirectoryId === null ? undefined : parentDirectoryId;
        const actualParent = file.parentDirectoryId === undefined ? null : file.parentDirectoryId;
        
        if (expectedParent !== actualParent) {
            console.log(
                `❌ File "${name || id}" parent mismatch: expected ${expectedParent}, got ${actualParent}`
            );
            return false;
        }
    }

    console.log(`✅ File "${name || id}" meets requirement`);
    return true;
}

/**
 * Gets a detailed report of which requirements are met and which aren't
 */
export function getSolutionReport(
    filesystem: FileOrDirectory[],
    solution: SolutionRequirement[],
    openFolderId?: number | null
): { satisfied: boolean; details: string[] } {
    const details: string[] = [];

    if (!solution || solution.length === 0) {
        return { satisfied: false, details: ["No solution requirements defined"] };
    }

    let allSatisfied = true;

    for (const requirement of solution) {
        // Handle openFolder requirement (supports both type:"openFolder" and isOpened:true)
        if (requirement.type === "openFolder" || requirement.isOpened === true) {
            if (openFolderId !== requirement.id) {
                details.push(`❌ Open folder with ID ${requirement.id}`);
                allSatisfied = false;
            } else {
                details.push(`✅ Folder ${requirement.id} is opened`);
            }
            continue;
        }

        // Find file by ID or name
        let file: FileOrDirectory | undefined;
        if (requirement.id !== undefined && requirement.id !== null) {
            file = filesystem.find((f) => f.id === requirement.id);
        } else if (requirement.name !== undefined) {
            file = filesystem.find((f) => f.name === requirement.name);
        }

        const fileLabel = requirement.name || `ID ${requirement.id}`;

        if (requirement.removed === true) {
            if (file !== undefined) {
                details.push(`❌ File "${fileLabel}" should be deleted`);
                allSatisfied = false;
            } else {
                details.push(`✅ File "${fileLabel}" is deleted`);
            }
            continue;
        }

        if (!file) {
            details.push(`❌ File "${fileLabel}" not found`);
            allSatisfied = false;
            continue;
        }

        // Check name if we looked up by ID
        if (requirement.id !== undefined && requirement.id !== null && 
            requirement.name !== undefined && file.name !== requirement.name) {
            details.push(
                `❌ File "${fileLabel}": rename to "${requirement.name}"`
            );
            allSatisfied = false;
        }

        if (requirement.parentDirectoryId !== undefined) {
            const expectedParent = requirement.parentDirectoryId === null ? undefined : requirement.parentDirectoryId;
            const actualParent = file.parentDirectoryId === undefined ? null : file.parentDirectoryId;
            
            if (expectedParent !== actualParent) {
                details.push(
                    `❌ File "${fileLabel}": move to folder ${expectedParent}`
                );
                allSatisfied = false;
            }
        }

        if (
            (requirement.name === undefined ||
                file.name === requirement.name) &&
            (requirement.parentDirectoryId === undefined ||
                file.parentDirectoryId === requirement.parentDirectoryId)
        ) {
            details.push(`✅ File "${fileLabel}" is correct`);
        }
    }

    return { satisfied: allSatisfied, details };
}
