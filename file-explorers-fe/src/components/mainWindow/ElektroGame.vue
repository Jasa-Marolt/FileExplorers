<template>
  <div class="elektro-game-container">
    <div ref="gameContainer" class="phaser-container"></div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue';
import Phaser from 'phaser';
import WorkspaceScene from '@/phaser/workspaceScene.js';
import { loadSettings } from '@/composables/useSettings';
import { folderColorMap } from '@/composables/useSettings';

const gameContainer = ref<HTMLDivElement | null>(null);
let game: Phaser.Game | null = null;

onMounted(() => {
  // Patch AudioContext methods to avoid errors with closed contexts
  try {
    const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (AC && !AC.prototype.__audioPatched) {
      const origSuspend = AC.prototype.suspend;
      const origResume = AC.prototype.resume;
      const origClose = AC.prototype.close;
      
      AC.prototype.suspend = function() {
        try {
          if (this.state === 'closed') return Promise.resolve();
        } catch (e) {}
        return origSuspend.apply(this, arguments);
      };
      
      AC.prototype.resume = function() {
        try {
          if (this.state === 'closed') return Promise.resolve();
        } catch (e) {}
        return origResume.apply(this, arguments);
      };
      
      AC.prototype.close = function() {
        try {
          if (this.state === 'closed') return Promise.resolve();
        } catch (e) {}
        return origClose.apply(this, arguments);
      };
      
      AC.prototype.__audioPatched = true;
    }
  } catch (e) {
    console.warn('Failed to patch AudioContext:', e);
  }

  if (gameContainer.value) {
    // Load settings and calculate desk color
    const settings = loadSettings();
    const primaryColorHex = folderColorMap[settings.folderColor] || folderColorMap.default;
    
    // Calculate darker desk color
    const darken = (hex: string, percent: number) => {
      const num = parseInt(hex.replace('#', ''), 16);
      const r = Math.max(0, Math.floor(((num >> 16) & 0xff) * (1 - percent)));
      const g = Math.max(0, Math.floor(((num >> 8) & 0xff) * (1 - percent)));
      const b = Math.max(0, Math.floor((num & 0xff) * (1 - percent)));
      return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    };
    
    const deskColor = darken(primaryColorHex, 0.4);
    
    // @ts-ignore: allow non-standard config fields like 'resolution'
    const config: any = {
      type: Phaser.AUTO,
      parent: gameContainer.value,
      width: gameContainer.value.offsetWidth,
      height: gameContainer.value.offsetHeight,
      scene: [WorkspaceScene],
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false
        }
      },
      backgroundColor: deskColor,
      render: {
        pixelArt: false,
      },
      audio: {
        noAudio: true, // Disable audio to prevent AudioContext errors
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
