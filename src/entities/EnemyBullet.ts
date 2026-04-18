import Phaser from 'phaser';

/** 敵が撃つ弾（赤い小円） */
export class EnemyBullet {
  sprite: Phaser.GameObjects.Arc;
  vx: number;
  vy: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    vx: number,
    vy: number
  ) {
    this.sprite = scene.add.circle(x, y, 5, 0xe63946);
    this.vx = vx;
    this.vy = vy;
  }

  update(dt: number) {
    this.sprite.x += this.vx * dt;
    this.sprite.y += this.vy * dt;
  }

  isOffScreen(w: number, h: number) {
    return (
      this.sprite.x < -20 ||
      this.sprite.x > w + 20 ||
      this.sprite.y > h + 20 ||
      this.sprite.y < -20
    );
  }

  destroy() {
    this.sprite.destroy();
  }

  getBounds() {
    return this.sprite.getBounds();
  }
}
