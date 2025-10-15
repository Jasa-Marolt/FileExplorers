export interface Level {
  id: number
  name: string
  description: string
  isUnlocked: boolean
  isCompleted: boolean
}

export interface LevelsState {
  levels: Level[]
  currentLevel: number | null
}

const state: LevelsState = {
  levels: [
    {
      id: 1,
      name: 'Level 1',
      description: 'Enter folders, Go back, Side bar',
      isUnlocked: true,
      isCompleted: false
    },
    {
      id: 2,
      name: 'Level 2',
      description: 'Drag and drop',
      isUnlocked: false,
      isCompleted: false
    },
    {
      id: 3,
      name: 'Level 3',
      description: 'Delete files',
      isUnlocked: false,
      isCompleted: false
    },
    {
      id: 4,
      name: 'Level 4',
      description: 'Cut and paste',
      isUnlocked: false,
      isCompleted: false
    },
    {
      id: 5,
      name: 'Level 5',
      description: 'Rename files',
      isUnlocked: false,
      isCompleted: false
    },
    {
      id: 6,
      name: 'Level 6',
      description: 'Search functionality',
      isUnlocked: false,
      isCompleted: false
    }
  ],
  currentLevel: 1
}

const getters = {
  allLevels: (state: LevelsState) => state.levels,
  currentLevel: (state: LevelsState) => state.currentLevel,
  unlockedLevels: (state: LevelsState) => state.levels.filter(level => level.isUnlocked),
  completedLevels: (state: LevelsState) => state.levels.filter(level => level.isCompleted)
}

const mutations = {
  SET_CURRENT_LEVEL(state: LevelsState, levelId: number) {
    state.currentLevel = levelId
  },
  UNLOCK_LEVEL(state: LevelsState, levelId: number) {
    const level = state.levels.find(l => l.id === levelId)
    if (level) {
      level.isUnlocked = true
    }
  },
  COMPLETE_LEVEL(state: LevelsState, levelId: number) {
    const level = state.levels.find(l => l.id === levelId)
    if (level) {
      level.isCompleted = true
      // Unlock next level
      const nextLevel = state.levels.find(l => l.id === levelId + 1)
      if (nextLevel) {
        nextLevel.isUnlocked = true
      }
    }
  }
}

const actions = {
  selectLevel({ commit }: any, levelId: number) {
    commit('SET_CURRENT_LEVEL', levelId)
  },
  unlockLevel({ commit }: any, levelId: number) {
    commit('UNLOCK_LEVEL', levelId)
  },
  completeLevel({ commit }: any, levelId: number) {
    commit('COMPLETE_LEVEL', levelId)
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}
