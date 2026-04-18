import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import { AbilitySelectScene } from './scenes/AbilitySelectScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#ffffff',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [GameScene, AbilitySelectScene],
  input: {
    activePointers: 1
  }
};

new Phaser.Game(config);
