<template>
  <div class="landing-page">
    <div class="hero-section">
      <h1 class="title">File Explorers</h1>
      <p class="tagline">Level Up Your Tech Skills with Epic File System Challenges</p>

      <div class="description">
        <p>
          Think you know your way around computers? <strong>Think again.</strong> Dive into <strong>File
            Explorers</strong>
          and master the hidden skills that separate casual users from tech pros. Compete with friends,
          unlock achievements, and become the ultimate file system master!
        </p>
      </div>

      <div class="cta-buttons">
        <button @click="startPlaying" class="btn btn-primary">
          <i class="pi pi-play"></i>
          Start Playing Now
        </button>

      </div>
    </div>

    <div class="features-section">
      <h2>Why This Game Slaps</h2>
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">
            <i class="pi pi-folder-open"></i>
          </div>
          <h3>Navigate Like a Boss</h3>
          <p>Speed through folders and files faster than your friends. Learn shortcuts that'll blow their minds.</p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">
            <i class="pi pi-copy"></i>
          </div>
          <h3>Master the Moves</h3>
          <p>Drag, drop, copy, paste - become a file-moving wizard. These skills work on any computer or phone.</p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">
            <i class="pi pi-trash"></i>
          </div>
          <h3>Clean Up Your Game</h3>
          <p>Delete, organize, and manage files like a pro. Your desktop will never be messy again.</p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">
            <i class="pi pi-chart-line"></i>
          </div>
          <h3>Level Up Gradually</h3>
          <p>Start easy, end epic. Each level gets more challenging but never feels impossible.</p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">
            <i class="pi pi-trophy"></i>
          </div>
          <h3>Flex Your Achievements</h3>
          <p>Earn badges, climb the leaderboard, and show everyone who's the real tech genius.</p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">
            <i class="pi pi-users"></i>
          </div>
          <h3>Squad Up</h3>
          <p>Challenge your friends, share tips, and compete to see who's the fastest file explorer.</p>
        </div>
      </div>
    </div>

    <div class="how-it-works">
      <h2>How It Works</h2>
      <div class="steps">
        <div class="step">
          <div class="step-number">1</div>
          <h3>Pick Your Challenge</h3>
          <p>Start easy or jump straight to hard mode</p>
        </div>
        <i class="pi pi-arrow-right"></i>
        <div class="step">
          <div class="step-number">2</div>
          <h3>Crush the Mission</h3>
          <p>Complete tasks, solve puzzles, beat the clock</p>
        </div>
        <i class="pi pi-arrow-right"></i>
        <div class="step">
          <div class="step-number">3</div>
          <h3>Unlock & Repeat</h3>
          <p>Get rewards and move to the next challenge</p>
        </div>
      </div>
    </div>

    <div class="cta-section">
      < <p>Start now and become a tech legend. Your friends won't know what hit 'em!</p>
        <button @click="startPlaying" class="btn btn-primary btn-large">
          <i class="pi pi-play"></i>
          Let's Go!
        </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { Level } from '@/store/levelStore';

const store = useStore();
const router = useRouter();

const isAuthenticated = computed(() => store.getters['userStoreModule/isAuthenticated']);

const startPlaying = async () => {
  if (isAuthenticated.value) {
    let level: Level = store.getters["levelStoreModule/currentLevel"];
    if (level == null || level == undefined) {
      level = (await store.dispatch("levelStoreModule/fetchLevel", 1));
      console.log("opening new level")

      router.push({ name: 'game' });
      store.dispatch("fileStoreModule/setFilesystem", level.data);
    }
    router.push({ name: 'game', });
    store.dispatch("fileStoreModule/setFilesystem", level.data);

  } else {
    router.push({ name: 'profile' });
  }
};

const goToProfile = () => {
  router.push({ name: 'profile' });
};
</script>

<style scoped lang="scss">
.landing-page {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  padding: 40px 20px;
  color: var(--text);
}

.hero-section {
  text-align: center;
  padding: 40px 20px;
  max-width: 900px;
  margin: 0 auto;
}

.title {
  font-size: 64px;
  font-weight: 900;
  margin: 0 0 20px 0;
  color: var(--text);
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  letter-spacing: -1px;
}

.tagline {
  font-size: 24px;
  color: var(--secondary-text);
  margin-bottom: 40px;
  font-weight: 300;
}

.description {
  font-size: 18px;
  line-height: 1.8;
  margin-bottom: 40px;
  color: var(--text);

  p {
    margin: 0;
  }

  strong {
    color: var(--text);
    font-weight: 700;
  }
}

.cta-buttons {
  display: flex;
  gap: 20px;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  padding: 16px 32px;
  border: none;
  border-radius: 8px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 10px;

  i {
    font-size: 20px;
  }

  &:hover {
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.btn-primary {
  background: var(--primary);
  color: var(--text);
  border: 2px solid var(--border-color);

  &:hover {
    background: #356d31;
    box-shadow: 0 4px 12px rgba(41, 78, 38, 0.4);
  }
}

.btn-secondary {
  background: var(--element-background);
  color: var(--text);
  border: 2px solid var(--border-color);

  &:hover {
    background: var(--background-secondary);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
}

.btn-large {
  padding: 20px 48px;
  font-size: 20px;
}

.features-section {
  max-width: 1200px;
  margin: 80px auto;
  padding: 0 20px;

  h2 {
    text-align: center;
    font-size: 42px;
    margin-bottom: 60px;
    color: var(--text);
  }
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
}

.feature-card {
  background: var(--element-background);
  border: 2px solid var(--border-color);
  border-radius: 12px;
  padding: 30px;
  text-align: center;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    border-color: var(--primary);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  }
}

.feature-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  background: var(--primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;

  i {
    font-size: 40px;
    color: var(--text);
  }
}

.feature-card h3 {
  font-size: 24px;
  margin-bottom: 15px;
  color: var(--text);
}

.feature-card p {
  font-size: 16px;
  line-height: 1.6;
  color: var(--secondary-text);
}

.how-it-works {
  max-width: 1200px;
  margin: 80px auto;
  padding: 40px 20px;
  text-align: center;
  background: var(--element-background);
  border: 2px solid var(--border-color);
  border-radius: 12px;

  h2 {
    font-size: 42px;
    margin-bottom: 60px;
    color: var(--text);
  }
}

.steps {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 30px;
}

.step {
  flex: 1;
  min-width: 200px;
  max-width: 300px;
}

.step-number {
  width: 60px;
  height: 60px;
  margin: 0 auto 20px;
  background: var(--primary);
  color: var(--text);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 700;
  border: 3px solid var(--border-color);
}

.step h3 {
  font-size: 22px;
  margin-bottom: 10px;
  color: var(--text);
}

.step p {
  font-size: 16px;
  color: var(--secondary-text);
}

.cta-section {
  text-align: center;
  padding: 0px 20px;
  max-width: 800px;
  margin: 0 auto;

  h2 {
    font-size: 42px;
    margin-bottom: 20px;
    color: var(--text);
  }

  p {
    font-size: 20px;
    color: var(--secondary-text);
    margin-bottom: 40px;
  }
}

@media (max-width: 768px) {
  .title {
    font-size: 42px;
  }

  .tagline {
    font-size: 18px;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .steps {
    flex-direction: column;
  }
}
</style>
