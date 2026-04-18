import Phaser from 'phaser';

/** 追尾時に敵情報として受け取る最小構造 */
export interface BulletTargetable {
  id: number;
  sprite: { x: number; y: number };
}

/** プレイヤーの弾 */
export class Bullet {
  sprite: Phaser.GameObjects.Rectangle;
  vx: number;
  vy: number;
  remainingPierce: number;
  remainingBounce: number;
  homing: boolean;
  hitEnemies: Set<number> = new Set();

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    vx: number,
    vy: number,
    pierce: number,
    bounce: number,
    size: number,
    homing: boolean
  ) {
    // 進行方向に長い矩形。水平寄りなら横長、垂直寄りなら縦長
    const speedMag = Math.hypot(vx, vy);
    const isHorizontal = Math.abs(vx) > Math.abs(vy);
    const longSide = 14 * size;
    const shortSide = 4 * size;
    const w = isHorizontal ? longSide : shortSide;
    const h = isHorizontal ? shortSide : longSide;
    this.sprite = scene.add.rectangle(x, y, w, h, 0x000000);

    this.vx = vx;
    this.vy = vy;
    this.remainingPierce = pierce;
    this.remainingBounce = bounce;
    this.homing = homing;
    void speedMag;
  }

  update(dt: number, screenWidth: number, enemies: BulletTargetable[]) {
    // 追尾
    if (this.homing && enemies.length > 0) {
      const target = this.findClosestEnemy(enemies);
      if (target) {
        const dx = target.sprite.x - this.sprite.x;
        const dy = target.sprite.y - this.sprite.y;
        const dist = Math.max(1, Math.hypot(dx, dy));
        const speed = Math.hypot(this.vx, this.vy);
        const tvx = (dx / dist) * speed;
        const tvy = (dy / dist) * speed;
        // ゆるやかに追尾（ライン間補完）
        this.vx = this.vx * 0.88 + tvx * 0.12;
        this.vy = this.vy * 0.88 + tvy * 0.12;
      }
    }

    this.sprite.x += this.vx * dt;
    this.sprite.y += this.vy * dt;

    // 壁で跳ね返り
    if (this.remainingBounce > 0) {
      if (this.sprite.x < 8 && this.vx < 0) {
        this.vx = -this.vx;
        this.remainingBounce -= 1;
      } else if (this.sprite.x > screenWidth - 8 && this.vx > 0) {
        this.vx = -this.vx;
        this.remainingBounce -= 1;
      }
    }
  }

  private findClosestEnemy(enemies: BulletTargetable[]): BulletTargetable | null {
    let minDist = Infinity;
    let closest: BulletTargetable | null = null;
    for (const e of enemies) {
      if (this.hitEnemies.has(e.id)) continue;
      const dx = e.sprite.x - this.sprite.x;
      const dy = e.sprite.y - this.sprite.y;
      const dist = dx * dx + dy * dy; // 平方比較で十分
      if (dist < minDist) {
        minDist = dist;
        closest = e;
      }
    }
    return closest;
  }

  isOffScreen(w: number, h: number) {
    return (
      this.sprite.y < -40 ||
      this.sprite.y > h + 40 ||
      this.sprite.x < -40 ||
      this.sprite.x > w + 40
    );
  }

  destroy() {
    this.sprite.destroy();
  }

  getBounds() {
    return this.sprite.getBounds();
  }
}
