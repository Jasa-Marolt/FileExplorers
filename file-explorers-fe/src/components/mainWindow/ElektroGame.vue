<template>
  <div class="elektro-game-container">
    <div ref="gameContainer" class="phaser-container"></div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue';
import Phaser from 'phaser';
import WorkspaceScene from '@/phaser/workspaceScene.js';

const gameContainer = ref<HTMLDivElement | null>(null);
let game: Phaser.Game | null = null;

onMounted(() => {
  if (gameContainer.value) {
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: gameContainer.value,
      width: gameContainer.value.offsetWidth,
      height: gameContainer.value.offsetHeight,
      scene: [WorkspaceScene],
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false
        }
      },
      backgroundColor: '#e0c9a6',
      render: {
        pixelArt: false,
      }
    };
    game = new Phaser.Game(config);
  }
});

onUnmounted(() => {
  if (game) {
    game.destroy(true);
    game = null;
  }
});
</script>

<style scoped lang="scss">
.elektro-game-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--primary);
}

.phaser-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
