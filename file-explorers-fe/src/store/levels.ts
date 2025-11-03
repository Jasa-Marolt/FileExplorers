import { FileOrDirectory } from "@/files";
// export interface FileOrDirectory {
//   id: number
//   name: string
//   isDirectory: boolean
//   parentDirectoryId: number | undefined
// }

//LEVEL 1
// C:.
// │   Guide.txt
// └───Folder1
//     └───Folder2
//             message.txt
// export interface Level {
//     id: number,
//     name: string,
//     startingFilesystem: FileOrDirectory[],
//     levelSolution: solutionFileInterface[],
//     difficulty: string,
//     description: string,
//     instructions: string
// }
// export interface solutionFileInterface {
//     id?: number,
//     name?: string,
//     parentDirectoryId?: number | undefined,
//     removed: boolean
// }

import { Level, solutionFileInterface } from "./levelStore";

export const Level1Filesystem = {
    id: 1,
    name: "Level 1",
    difficulty: "easy",
    description: "Learning how to move files",
    instructions: "Move the .txt file into Folder 2",
    levelSolution: [
        {
            id: 3,
            parentDirectoryId: 3
        }

    ],
    startingFilesystem: [
        {
            id: 0,
            name: "guide.txt",
            isDirectory: false,
            parentDirectoryId: undefined
        },
        {
            id: 1,
            name: "Folder1",
            isDirectory: true,
            parentDirectoryId: undefined
        },
        {
            id: 2,
            name: "Folder2",
            isDirectory: true,
            parentDirectoryId: 1
        },
        {
            id: 3,
            name: "message.txt",
            isDirectory: false,
            parentDirectoryId: 2
        }
    ] as FileOrDirectory[]
} as Level


//LEVEL 2
// C:.
// │   Guide.txt
// │  Civilian
// │  Civilian
// │  Civilian
// └───Folder1

export const Level2Filesystem = {

    id: 2,
    name: "Level 2",
    difficulty: "easy",
    description: "Saving civvies",
    instructions: "Move all the civilians into the folder, try using control or shift clicking",
    levelSolution: [
        {
            id: 1,
            parentDirectoryId: 4
        },
        {
            id: 2,
            parentDirectoryId: 4
        },
        {
            id: 3,
            parentDirectoryId: 4
        },
    ],
    startingFilesystem: [

        {
            id: 0,
            name: "guide.txt",
            isDirectory: false,
            parentDirectoryId: undefined
        },
        {
            id: 1,
            name: "Civilian",
            isDirectory: false,
            parentDirectoryId: undefined
        },
        {
            id: 2,
            name: "Civilian",
            isDirectory: false,
            parentDirectoryId: undefined
        },
        {
            id: 3,
            name: "Civilian",
            isDirectory: false,
            parentDirectoryId: undefined
        },
        {
            id: 4,
            name: "Folder1",
            isDirectory: true,
            parentDirectoryId: undefined
        }
    ] as FileOrDirectory[]

}

//LEVEL 3
// C:.
// │ Guide.txt
// │ Zombie
// │ Civilian
// │ Civilian

export const Level3Filesystem = {
    id: 3,
    name: "Level 3",
    difficulty: "medium",
    description: "Killing zombies",
    instructions: "Remove the zombie by right clicking it and pressing remove",
    levelSolution: [
        {
            id: 1,
            removed: true
        }

    ],

    startingFileSystem: [
        {
            id: 0,
            name: "guide.txt",
            isDirectory: false,
            parentDirectoryId: undefined
        },
        {
            id: 1,
            name: "Zombie",
            isDirectory: false,
            parentDirectoryId: undefined
        },
        {
            id: 2,
            name: "Civilian",
            isDirectory: false,
            parentDirectoryId: undefined
        },
        {
            id: 3,
            name: "Civilian",
            isDirectory: false,
            parentDirectoryId: undefined
        },
        {
            id: 4,
            name: "Civilian",
            isDirectory: false,
            parentDirectoryId: undefined
        }
    ]
}

// C:.
// │ Civilian
// └───New folder
//     └───New folder
//         └───New folder
//             └───New folder
//                     end.txt
export const level4Filesystem = {

    id: 4,
    name: "Level 4",
    difficulty: "medium",
    description: "Cut and paste",
    instructions: "right click on a civilian, press cut, then go to the last folder and paste them in",
    levelSolution: [
        {
            id: 1,
            removed: true
        }

    ],

    startingFileSystem: [

        {
            id: 0,
            name: "Civilian",
            isDirectory: false,
            parentDirectoryId: undefined
        },
        {
            id: 1,
            name: "New folder",
            isDirectory: true,
            parentDirectoryId: undefined
        },
        {
            id: 2,
            name: "New folder",
            isDirectory: true,
            parentDirectoryId: 1
        },
        {
            id: 3,
            name: "New folder",
            isDirectory: true,
            parentDirectoryId: 2
        },
        {
            id: 4,
            name: "New folder",
            isDirectory: true,
            parentDirectoryId: 3
        },
        {
            id: 5,
            name: "end.txt",
            isDirectory: false,
            parentDirectoryId: 4
        }
    ] as FileOrDirectory[]
}
// D:.
// │Civilian
// │Civilian
// │Civilian
// │Civilian
export const Level5Filesystem = {
    id: 5,
    name: "Level 5",
    difficulty: "medium",
    description: "Renaming",
    instructions: "Right click a civilian and rename them to Bob",
    levelSolution: [
        {
            id: 1,
            name:"Bob"
        }

    ],
    startingFileSystem: [
        {
            id: 0,
            name: "guide.txt",
            isDirectory: false,
            parentDirectoryId: undefined
        },
        {
            id: 1,
            name: "Civilian",
            isDirectory: false,
            parentDirectoryId: undefined
        },
        {
            id: 2,
            name: "Civilian",
            isDirectory: false,
            parentDirectoryId: undefined
        },
        {
            id: 3,
            name: "Civilian",
            isDirectory: false,
            parentDirectoryId: undefined
        },
        {
            id: 4,
            name: "Civilian",
            isDirectory: false,
            parentDirectoryId: undefined
        }
    ]

}
// D:.
// ├───New folder
// │   └───New folder
// │       └───New folder
// │           └───New folder
// ├───New folder - Copy
// │   └───New folder
// │       └───New folder
// │           └───New folder
// ├───New folder - Copy (2)
// │   └───New folder
// │       └───New folder
// │           └───New folder
// └───New folder - Copy (3)
//     └───New folder
//         └───New folder
//             └───New folder
//                     Civilian
export const Level6Filesystem = {

    id: 6,
    name: "Level 6",
    difficulty: "Hard",
    description: "Finding files",
    instructions: "Find the civilian by searching for them in the search bar, then rename them to Bob",
    levelSolution: [
        {
            id: 23,
            name:"Bob"
        }

    ],
    startingFileSystem: [
        {
            id: 0,
            name: "New folder",
            isDirectory: true,
            parentDirectoryId: undefined
        },
        {
            id: 1,
            name: "New folder",
            isDirectory: true,
            parentDirectoryId: 0
        },
        {
            id: 2,
            name: "New folder",
            isDirectory: true,
            parentDirectoryId: 1
        },
        {
            id: 3,
            name: "New folder",
            isDirectory: true,
            parentDirectoryId: 2
        },
        {
            id: 4,
            name: "New folder",
            isDirectory: true,
            parentDirectoryId: 3
        },
        {
            id: 5,
            name: "New Folder",
            isDirectory: true,
            parentDirectoryId: 4
        },
        //second folder

        {
            id: 6,
            name: "New folder",
            isDirectory: true,
            parentDirectoryId: undefined
        },
        {
            id: 7,
            name: "New folder",
            isDirectory: true,
            parentDirectoryId: 6
        },
        {
            id: 8,
            name: "New folder",
            isDirectory: true,
            parentDirectoryId: 7
        },
        {
            id: 9,
            name: "New folder",
            isDirectory: true,
            parentDirectoryId: 8
        },
        {
            id: 10,
            name: "New folder",
            isDirectory: true,
            parentDirectoryId: 9
        },
        {
            id: 11,
            name: "New folder",
            isDirectory: true,
            parentDirectoryId: 10
        },

        //third folder
        {
            id: 12,
            name: "New folder",
            isDirectory: true,
            parentDirectoryId: undefined
        },
        {
            id: 13,
            name: "New folder",
            isDirectory: true,
            parentDirectoryId: 12
        },
        {
            id: 14,
            name: "New folder",
            isDirectory: true,
            parentDirectoryId: 13
        },
        {
            id: 15,
            name: "New folder",
            isDirectory: true,
            parentDirectoryId: 14
        },
        {
            id: 16,
            name: "New folder",
            isDirectory: true,
            parentDirectoryId: 15
        },
        {
            id: 17,
            name: "New folder",
            isDirectory: true,
            parentDirectoryId: 16
        },


        //fourth folder
        {
            id: 18,
            name: "New folder",
            isDirectory: true,
            parentDirectoryId: undefined
        },
        {
            id: 19,
            name: "New folder",
            isDirectory: true,
            parentDirectoryId: 18
        },
        {
            id: 20,
            name: "New folder",
            isDirectory: true,
            parentDirectoryId: 19
        },
        {
            id: 21,
            name: "New folder",
            isDirectory: true,
            parentDirectoryId: 20
        },
        {
            id: 22,
            name: "New folder",
            isDirectory: true,
            parentDirectoryId: 21
        },
        {
            id: 23,
            name: "Civilian",
            isDirectory: false,
            parentDirectoryId: 22
        }



    ] as FileOrDirectory[]
}