<template>
  <div class="leaderboard-container">
    <div class="leaderboard-header">
      <h1> Leaderboard</h1>
      <p class="subtitle">See who's crushing it!</p>
    </div>

    <div class="filters">
      <button 
        :class="['filter-btn', { active: timeFilter === 'all' }]"
        @click="timeFilter = 'all'"
      >
        All Time
      </button>
      <button 
        :class="['filter-btn', { active: timeFilter === 'month' }]"
        @click="timeFilter = 'month'"
      >
        This Month
      </button>
      <button 
        :class="['filter-btn', { active: timeFilter === 'week' }]"
        @click="timeFilter = 'week'"
      >
        This Week
      </button>
    </div>

    <div v-if="loading" class="loading">
      <i class="pi pi-spinner pi-spin"></i>
      <p>Loading leaderboard...</p>
    </div>

    <div v-else-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-else class="leaderboard-list">
      <!-- Current User Rank (if authenticated) -->
      <div v-if="isAuthenticated && currentUserRank" class="user-rank-card">
        <div class="rank-badge your-rank">Your Rank</div>
        <div class="rank-number">#{{ currentUserRank.rank }}</div>
        <div class="player-info">
          <div class="player-name">{{ currentUserRank.username }}</div>
          <div class="player-stats">
            <span><i class="pi pi-flag"></i> {{ currentUserRank.levelsCompleted }} levels</span>
            <span><i class="pi pi-clock"></i> {{ formatAvgTime(currentUserRank.avgTime) }} avg</span>
          </div>
        </div>
      </div>

      <!-- Top Players -->
      <div class="top-players">
        <div 
          v-for="(player, index) in leaderboardData" 
          :key="player.id"
          :class="['player-card', { 'is-current-user': isCurrentUser(player) }]"
        >
          <div :class="['rank-badge', getRankClass(index + 1)]">
            <i v-if="index < 3" :class="['pi', 'medal', getMedal(index + 1)]"></i>
            <span v-else>#{{ index + 1 }}</span>
          </div>
          
          <div class="player-details">
            <div class="player-name">
              {{ player.username }}
              <i v-if="isCurrentUser(player)" class="pi pi-check-circle you-badge"></i>
            </div>
            <div class="player-stats">
              <span><i class="pi pi-flag"></i> {{ player.levelsCompleted }} levels</span>
              <span><i class="pi pi-clock"></i> {{ formatAvgTime(player.avgTime) }} avg</span>
            </div>
          </div>
          <!--
          <div class="player-time">
            {{ player.levelsCompleted }} <i class="pi pi-flag"></i> | {{ formatAvgTime(player.avgTime) }}
          </div>
          -->
        </div>
      </div>

      <div v-if="leaderboardData.length === 0" class="no-data">
        <i class="pi pi-trophy"></i>
        <p>No players yet. Be the first to complete a level!</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useStore } from 'vuex';

interface LeaderboardEntry {
  id: number;
  username: string;
  score: number;
  levelsCompleted: number;
  avgTime: number;
  rank: number;
}

const store = useStore();
const loading = ref(true);
const error = ref('');
const timeFilter = ref<'all' | 'month' | 'week'>('all');
const leaderboardData = ref<LeaderboardEntry[]>([]);
const currentUserRank = ref<LeaderboardEntry | null>(null);

const isAuthenticated = computed(() => store.getters['userStoreModule/isAuthenticated']);
const user = computed(() => store.getters['userStoreModule/getUser']);

const isCurrentUser = (player: LeaderboardEntry) => {
  return isAuthenticated.value && player.username === user.value?.username;
};

const getMedal = (rank: number): string => {
  switch(rank) {
    case 1: return 'pi-crown';
    case 2: return 'pi-circle';
    case 3: return 'pi-circle';
    default: return '';
  }
};

const getRankClass = (rank: number): string => {
  if (rank === 1) return 'gold';
  if (rank === 2) return 'silver';
  if (rank === 3) return 'bronze';
  return '';
};

const formatAvgTime = (seconds: number): string => {
  if (!seconds || seconds === 0) return '0s';
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
};

const fetchLeaderboard = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    // Build URL with time filter query parameter
    const url = `${process.env.VUE_APP_API_URL || 'http://localhost:8080'}/leaderboard?timeFilter=${timeFilter.value}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch leaderboard');
    }

    const result = await response.json();
    console.log('Leaderboard API response:', result);
    
    if (result.success && result.data) {
      leaderboardData.value = result.data.map((entry: any, index: number) => {
        console.log('Mapping entry:', entry);
        const totalTime = entry.total_time || entry.totalTime || entry.TotalTime || 0;
        const levelsCompleted = entry.levels_solved || entry.levelsSolved || entry.LevelsSolved || entry.levels_completed || entry.levelsCompleted || 0;
        const avgTime = levelsCompleted > 0 ? totalTime / levelsCompleted : 0;
        
        return {
          id: entry.user_id || entry.id || entry.userId || index,
          username: entry.username || entry.Username,
          score: totalTime,
          levelsCompleted: levelsCompleted,
          avgTime: avgTime,
          rank: index + 1
        };
      });

      console.log('Mapped leaderboard data:', leaderboardData.value);

      // Find current user's rank
      if (isAuthenticated.value && user.value) {
        const userEntry = leaderboardData.value.find(entry => 
          entry.username === user.value.username
        );
        if (userEntry) {
          currentUserRank.value = userEntry;
        }
      }
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to load leaderboard';
  } finally {
    loading.value = false;
  }
};

// Watch for time filter changes and refetch data
watch(timeFilter, () => {
  fetchLeaderboard();
});

onMounted(() => {
  fetchLeaderboard();
});
</script>

<style scoped lang="scss">
.leaderboard-container {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  padding: 40px 20px;
  color: var(--text);
}

.leaderboard-header {
  text-align: center;
  margin-bottom: 40px;
  max-width: 900px;
  margin: 0 auto 40px;

  h1 {
    font-size: 48px;
    margin: 0 0 10px 0;
    color: var(--text);
  }

  .subtitle {
    font-size: 20px;
    color: var(--secondary-text);
    margin: 0;
  }
}

.filters {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 40px;
  max-width: 900px;
  margin: 0 auto 40px;
}

.filter-btn {
  padding: 10px 24px;
  background: var(--element-background);
  color: var(--text);
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: var(--primary);
  }

  &.active {
    background: var(--primary);
    border-color: var(--primary);
  }
}

.loading, .error-message {
  text-align: center;
  padding: 60px 20px;
  font-size: 18px;
  max-width: 900px;
  margin: 0 auto;

  i {
    font-size: 48px;
    margin-bottom: 20px;
  }
}

.error-message {
  color: #ff6b6b;
}

.leaderboard-list {
  max-width: 900px;
  margin: 0 auto;
}

.user-rank-card {
  background: linear-gradient(135deg, var(--primary), var(--background-secondary));
  border: 2px solid var(--border-color);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 30px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

  .your-rank {
    background: rgba(255, 255, 255, 0.2);
    font-size: 14px;
    padding: 8px 16px;
    color: var(--text);
  }

  .rank-number {
    font-size: 36px;
    font-weight: 900;
    color: var(--text);
    min-width: 80px;
    text-align: center;
  }

  .player-info {
    flex: 1;
  }
}

.top-players {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.player-card {
  background: var(--element-background);
  border: 2px solid var(--border-color);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateX(5px);
    border-color: var(--primary);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  &.is-current-user {
    border-color: var(--primary);
    background: linear-gradient(90deg, var(--element-background), var(--primary));
  }
}

.rank-badge {
  min-width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  font-weight: 900;
  font-size: 20px;
  background: var(--background-secondary);
  color: var(--text);
  border: 2px solid var(--border-color);

  &.gold {
    background: linear-gradient(135deg, #FFD700, #FFA500);
    color: #1a1a1a;
  }

  &.silver {
    background: linear-gradient(135deg, #C0C0C0, #808080);
    color: #1a1a1a;
  }

  &.bronze {
    background: linear-gradient(135deg, #CD7F32, #8B4513);
    color: #ffffff;
  }

  .medal {
    font-size: 32px;
  }
}

.player-avatar {
  width: 50px;
  height: 50px;
  background: var(--primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  font-size: 20px;
  color: var(--text);
  border: 2px solid var(--border-color);
}

.player-details {
  flex: 1;
}

.player-name {
  font-size: 20px;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 8px;

  .you-badge {
    color: var(--primary);
    font-size: 16px;
  }
}

.player-stats {
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: var(--secondary-text);
}

.player-time {
  font-size: 24px;
  font-weight: 700;
  color: var(--primary);
  min-width: 120px;
  text-align: right;
}

.no-data {
  text-align: center;
  padding: 60px 20px;
  color: var(--secondary-text);

  i {
    font-size: 64px;
    margin-bottom: 20px;
  }

  p {
    font-size: 18px;
  }
}

@media (max-width: 768px) {
  .player-card {
    flex-wrap: wrap;
  }

  .player-time {
    width: 100%;
    text-align: center;
  }
}
</style>
