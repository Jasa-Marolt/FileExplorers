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
  // Patch AudioContext.suspend to avoid "Cannot suspend a closed AudioContext" errors
  try {
    const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (AC && !AC.prototype.__suspendPatched) {
      const origSuspend = AC.prototype.suspend;
      AC.prototype.suspend = function() {
        try {
          if (this.state === 'closed') return Promise.resolve();
        } catch (e) {}
        return origSuspend.apply(this, arguments);
      };
      AC.prototype.__suspendPatched = true;
    }
  } catch (e) {}

  if (gameContainer.value) {
    // @ts-ignore: allow non-standard config fields like 'resolution'
    const config: any = {
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

    // set resolution dynamically to avoid GameConfig literal type errors
    (config as any).resolution = window.devicePixelRatio || 1;

    game = new Phaser.Game(config as Phaser.Types.Core.GameConfig);
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
