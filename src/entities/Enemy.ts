import Phaser from 'phaser';
import { EnemyDef } from '../types';
import { EnemyBullet } from './EnemyBullet';

/**
 * 敵。形と挙動は def で決まる。
 * update() で自機位置を受け取り、必要に応じて敵弾を enemyBullets に push する。
 */
export class Enemy {
  sprite: Phaser.GameObjects.Shape;
  def: EnemyDef;
  hp: number;
  private t = 0;
  private spawnX: number;
  private shootTimer = 0;

  // 一意ID（貫通弾で「同じ敵に2回当たる」を防ぐために使う）
  private static _nextId = 0;
  readonly id: number;

  constructor(scene: Phaser.Scene, x: number, y: number, def: EnemyDef) {
    this.id = Enemy._nextId++;
    this.def = def;
    this.hp = def.hp;
    this.spawnX = x;
    this.sprite = Enemy.createShape(scene, x, y, def);
  }

  private static createShape(
    scene: Phaser.Scene,
    x: number,
    y: number,
    def: EnemyDef
  ): Phaser.GameObjects.Shape {
    const s = def.size;
    const color = 0x000000;
    switch (def.shape) {
      case 'rect':
        return scene.add.rectangle(x, y, s, s, color);
      case 'triangle':
        // 下向き頂点（Chaser: 追尾して降下するのでそれっぽい形）
        return scene.add.triangle(x, y, -s / 2, -s / 2, s / 2, -s / 2, 0, s / 2, color);
      case 'triangleDown':
        // 上向き頂点（Spike: 踏めない形のアイコン）
        return scene.add.triangle(x, y, 0, -s / 2, -s / 2, s / 2, s / 2, s / 2, color);
      case 'diamond':
        return scene.add.polygon(
          x,
          y,
          [0, -s / 2, s / 2, 0, 0, s / 2, -s / 2, 0],
          color
        );
      case 'circle':
        return scene.add.circle(x, y, s / 2, color);
    }
  }

  update(
    dt: number,
    playerX: number,
    playerY: number,
    enemyBullets: EnemyBullet[],
    scene: Phaser.Scene
  ): void {
    this.t += dt;
    switch (this.def.behavior) {
      case 'walker':
      case 'spike':
        this.sprite.y += this.def.speed * dt;
        break;
      case 'zigzag':
        this.sprite.y += this.def.speed * dt;
        this.sprite.x = this.spawnX + Math.sin(this.t * 3) * 50;
        break;
      case 'shooter': {
        this.sprite.y += this.def.speed * dt;
        this.shootTimer += dt;
        if (this.shootTimer > 1.4) {
          this.shootTimer = 0;
          const dx = playerX - this.sprite.x;
          const dy = playerY - this.sprite.y;
          const dist = Math.max(1, Math.hypot(dx, dy));
          const speed = 240;
          enemyBullets.push(
            new EnemyBullet(
              scene,
              this.sprite.x,
              this.sprite.y,
              (dx / dist) * speed,
              (dy / dist) * speed
            )
          );
        }
        break;
      }
      case 'chaser': {
        this.sprite.y += this.def.speed * dt;
        const chaseSpeed = 120;
        if (this.sprite.x < playerX - 5) this.sprite.x += chaseSpeed * dt;
        else if (this.sprite.x > playerX + 5) this.sprite.x -= chaseSpeed * dt;
        break;
      }
    }
  }

  isOffScreen(h: number) {
    return this.sprite.y > h + 40;
  }

  destroy() {
    this.sprite.destroy();
  }

  getBounds() {
    return this.sprite.getBounds();
  }

  /** @returns true なら死亡 */
  takeDamage(): boolean {
    this.hp -= 1;
    return this.hp <= 0;
  }
}
