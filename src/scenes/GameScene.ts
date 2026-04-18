import Phaser from 'phaser';
import { Bullet } from '../entities/Bullet';
import { EnemyBullet } from '../entities/EnemyBullet';
import { Enemy } from '../entities/Enemy';
import { ENEMIES } from '../data/enemies';
import { PlayerStats } from '../types';
import { DEFAULT_STATS, cloneStats } from '../systems/PlayerStats';
import { sound } from '../systems/SoundManager';

const STAGE_DURATION = 30; // 秒
const GRACE_PERIOD = 1.5; // ステージ開始グレース期間
const HP_BONUS_PER = 50;
const STAGE_BONUS_PER = 30;
const MISS_PENALTY = 5;
const GROUND_POUND_INTERVAL = 0.8; // 秒
const GROUND_POUND_RADIUS = 95; // px
const TRAIL_SPAWN_INTERVAL = 0.08; // 秒
const TRAIL_LIFE = 0.8; // 秒
const TRAIL_RADIUS = 14; // px

type SpawnPattern =
  | 'single'
  | 'pair'
  | 'cluster'
  | 'row'
  | 'sides'
  | 'stream';

interface TrailParticle {
  sprite: Phaser.GameObjects.Arc;
  life: number;
  hitEnemies: Set<number>;
}

interface GameSceneData {
  stats?: PlayerStats;
  hp?: number;
  score?: number;
  stageIndex?: number;
}

export class GameScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Triangle;
  private playerBaseY = 0;
  private gameWidth = 0;
  private gameHeight = 0;

  // 入力
  private isPointerDown = false;
  private lastPointerX = 0;
  private lastMoveTime = 0;
  private keys?: {
    LEFT: Phaser.Input.Keyboard.Key;
    RIGHT: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };

  // スタッツ
  private stats: PlayerStats = cloneStats(DEFAULT_STATS);
  private hp = 3;

  // 弾
  private bullets: Bullet[] = [];
  private enemyBullets: EnemyBullet[] = [];
  private lastShotTime = 0;

  // 敵
  private enemies: Enemy[] = [];
  private lastSpawnTime = 0;
  private spawnInterval = 1000;

  // ステージ
  private stageIndex = 1;
  private stageTimer = 0;
  private score = 0;
  private missedCount = 0;
  private isGameOver = false;
  private isStageCleared = false;

  // 状態限定能力用
  private groundPoundTimer = 0;
  private trailTimer = 0;
  private trailParticles: TrailParticle[] = [];

  // UI
  private hpIcons: Phaser.GameObjects.Arc[] = [];
  private scoreText!: Phaser.GameObjects.Text;
  private missedText!: Phaser.GameObjects.Text;
  private stageText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;

  constructor() {
    super('GameScene');
  }

  init(data: GameSceneData) {
    if (data && data.stats) {
      this.stats = data.stats;
      this.hp = Math.min(data.hp ?? this.stats.maxHp, this.stats.maxHp);
      this.score = data.score ?? 0;
      this.stageIndex = data.stageIndex ?? 1;
    } else {
      this.stats = cloneStats(DEFAULT_STATS);
      this.hp = this.stats.maxHp;
      this.score = 0;
      this.stageIndex = 1;
    }
  }

  create() {
    const { width, height } = this.scale;
    this.gameWidth = width;
    this.gameHeight = height;
    this.playerBaseY = height * 0.82;

    // リセット
    this.bullets = [];
    this.enemyBullets = [];
    this.enemies = [];
    this.trailParticles = [];
    this.lastShotTime = 0;
    this.lastSpawnTime = 0;
    this.stageTimer = -GRACE_PERIOD;
    this.isGameOver = false;
    this.isStageCleared = false;
    this.missedCount = 0;
    this.groundPoundTimer = 0;
    this.trailTimer = 0;

    // 下部ライン
    this.add.rectangle(width / 2, this.playerBaseY + 30, width, 1, 0xcccccc);

    // 自機
    this.player = this.add.triangle(
      width / 2,
      this.playerBaseY,
      0, -16,
      -14, 14,
      14, 14,
      0x000000
    );

    // UI: ステージ名
    this.stageText = this.add
      .text(width / 2, 22, `STAGE ${this.stageIndex}`, {
        fontFamily: 'Menlo, monospace',
        fontSize: '18px',
        color: '#000',
        fontStyle: 'bold'
      })
      .setOrigin(0.5, 0);

    // UI: タイマー
    this.timerText = this.add
      .text(width / 2, 48, `${STAGE_DURATION}`, {
        fontFamily: 'Menlo, monospace',
        fontSize: '14px',
        color: '#666'
      })
      .setOrigin(0.5, 0);

    this.drawHpIcons();

    this.scoreText = this.add
      .text(width - 18, 22, `SCORE ${this.score}`, {
        fontFamily: 'Menlo, monospace',
        fontSize: '13px',
        color: '#000'
      })
      .setOrigin(1, 0);

    this.missedText = this.add
      .text(width - 18, 42, '', {
        fontFamily: 'Menlo, monospace',
        fontSize: '11px',
        color: '#999'
      })
      .setOrigin(1, 0);

    // READY演出
    this.showGraceIntro();

    // 入力: タッチ
    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerup', this.onPointerUp, this);
    this.input.on('pointerupoutside', this.onPointerUp, this);

    // 入力: キーボード
    if (this.input.keyboard) {
      this.keys = this.input.keyboard.addKeys({
        LEFT: Phaser.Input.Keyboard.KeyCodes.LEFT,
        RIGHT: Phaser.Input.Keyboard.KeyCodes.RIGHT,
        A: Phaser.Input.Keyboard.KeyCodes.A,
        D: Phaser.Input.Keyboard.KeyCodes.D
      }) as {
        LEFT: Phaser.Input.Keyboard.Key;
        RIGHT: Phaser.Input.Keyboard.Key;
        A: Phaser.Input.Keyboard.Key;
        D: Phaser.Input.Keyboard.Key;
      };
    }

    this.spawnInterval = this.nextSpawnInterval();
  }

  private showGraceIntro() {
    const readyText = this.add
      .text(this.gameWidth / 2, this.gameHeight / 2, 'READY', {
        fontFamily: 'Menlo, monospace',
        fontSize: '32px',
        color: '#000',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);
    this.tweens.add({
      targets: readyText,
      alpha: 0,
      scale: 1.3,
      duration: GRACE_PERIOD * 1000,
      onComplete: () => readyText.destroy()
    });
  }

  private drawHpIcons() {
    this.hpIcons.forEach((h) => h.destroy());
    this.hpIcons = [];
    for (let i = 0; i < this.stats.maxHp; i++) {
      const filled = i < this.hp;
      this.hpIcons.push(
        this.add.circle(24 + i * 20, 30, 7, filled ? 0xe63946 : 0xcccccc)
      );
    }
  }

  private onPointerDown(pointer: Phaser.Input.Pointer) {
    sound.unlock();
    this.isPointerDown = true;
    this.lastPointerX = pointer.x;
  }

  private onPointerMove(pointer: Phaser.Input.Pointer) {
    if (!this.isPointerDown) return;
    const dx = pointer.x - this.lastPointerX;
    this.lastPointerX = pointer.x;
    if (Math.abs(dx) > 0.3) {
      this.player.x = Phaser.Math.Clamp(
        this.player.x + dx * this.stats.moveSpeed,
        20,
        this.gameWidth - 20
      );
      this.lastMoveTime = this.time.now;
    }
  }

  private onPointerUp() {
    this.isPointerDown = false;
  }

  update(time: number, delta: number) {
    if (this.isGameOver || this.isStageCleared) return;

    const dt = delta / 1000;

    // キーボード移動
    let keyMoved = false;
    if (this.keys) {
      if (this.keys.LEFT.isDown || this.keys.A.isDown) {
        this.player.x = Math.max(20, this.player.x - this.stats.keyboardSpeed * dt);
        keyMoved = true;
      }
      if (this.keys.RIGHT.isDown || this.keys.D.isDown) {
        this.player.x = Math.min(
          this.gameWidth - 20,
          this.player.x + this.stats.keyboardSpeed * dt
        );
        keyMoved = true;
      }
    }
    if (keyMoved) this.lastMoveTime = time;

    // 移動中判定
    const touchMoving =
      this.isPointerDown && time - this.lastMoveTime < this.stats.moveStopDelay;
    const isMoving = touchMoving || keyMoved;

    // 射撃タイミング
    if (isMoving) {
      this.lastShotTime = time;
    } else if (time - this.lastShotTime >= this.stats.shotInterval) {
      this.fire();
      this.lastShotTime = time;
    }

    // GROUND POUND（停止中のみ）
    if (!isMoving && this.stats.groundPound) {
      this.groundPoundTimer += dt;
      if (this.groundPoundTimer >= GROUND_POUND_INTERVAL) {
        this.groundPoundTimer = 0;
        this.emitShockwave();
      }
    } else {
      this.groundPoundTimer = 0;
    }

    // TRAIL BLAZE（移動中のみ）
    if (isMoving && this.stats.trail) {
      this.trailTimer += dt;
      if (this.trailTimer >= TRAIL_SPAWN_INTERVAL) {
        this.trailTimer = 0;
        this.spawnTrailParticle();
      }
    }

    // ステージタイマー
    this.stageTimer += dt;
    const inGrace = this.stageTimer < 0;

    // 敵スポーン
    if (!inGrace && time - this.lastSpawnTime >= this.spawnInterval) {
      this.spawnWave();
      this.lastSpawnTime = time;
      this.spawnInterval = this.nextSpawnInterval();
    }

    // 弾更新
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.update(dt, this.gameWidth, this.enemies);
      if (b.isOffScreen(this.gameWidth, this.gameHeight)) {
        b.destroy();
        this.bullets.splice(i, 1);
      }
    }

    // 敵弾更新
    for (let k = this.enemyBullets.length - 1; k >= 0; k--) {
      const eb = this.enemyBullets[k];
      eb.update(dt);
      if (eb.isOffScreen(this.gameWidth, this.gameHeight)) {
        eb.destroy();
        this.enemyBullets.splice(k, 1);
      }
    }

    // 敵更新 & 画面外流出処理
    for (let j = this.enemies.length - 1; j >= 0; j--) {
      const e = this.enemies[j];
      e.update(dt, this.player.x, this.player.y, this.enemyBullets, this);
      if (e.isOffScreen(this.gameHeight)) {
        e.destroy();
        this.enemies.splice(j, 1);
        // 流出ペナルティ
        this.onEnemyMissed();
      }
    }

    // TRAIL 更新
    this.updateTrailParticles(dt);

    // 衝突: 弾 × 敵
    this.handleBulletVsEnemy();

    // 衝突: 自機 × 敵 / 敵弾
    if (!inGrace) {
      const playerBounds = new Phaser.Geom.Rectangle(
        this.player.x - 13,
        this.player.y - 13,
        26,
        26
      );
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const e = this.enemies[j];
        if (
          Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, e.getBounds())
        ) {
          e.destroy();
          this.enemies.splice(j, 1);
          this.damagePlayer();
        }
      }
      for (let k = this.enemyBullets.length - 1; k >= 0; k--) {
        const eb = this.enemyBullets[k];
        if (
          Phaser.Geom.Intersects.RectangleToRectangle(
            playerBounds,
            eb.getBounds()
          )
        ) {
          eb.destroy();
          this.enemyBullets.splice(k, 1);
          this.damagePlayer();
        }
      }
    }

    // タイマー表示
    const effectiveTimer = Math.max(0, this.stageTimer);
    const remaining = Math.max(0, STAGE_DURATION - effectiveTimer);
    this.timerText.setText(`${Math.ceil(remaining)}`);
    if (this.stageTimer >= STAGE_DURATION) {
      this.triggerStageClear();
    }
  }

  private onEnemyMissed() {
    this.missedCount += 1;
    this.score = Math.max(0, this.score - MISS_PENALTY);
    this.scoreText.setText(`SCORE ${this.score}`);
    this.missedText.setText(`MISSED ${this.missedCount}`);
    // 控えめに画面下部に点滅
    const w = this.gameWidth;
    const mark = this.add
      .text(w - 18, 62, `-${MISS_PENALTY}`, {
        fontFamily: 'Menlo, monospace',
        fontSize: '11px',
        color: '#e63946'
      })
      .setOrigin(1, 0);
    this.tweens.add({
      targets: mark,
      alpha: 0,
      y: 74,
      duration: 700,
      onComplete: () => mark.destroy()
    });
  }

  private nextSpawnInterval(): number {
    const reduction = (this.stageIndex - 1) * 50;
    const min = Math.max(350, 700 - reduction);
    const max = Math.max(min + 200, 1300 - reduction);
    return Phaser.Math.Between(min, max);
  }

  private spawnWave() {
    const pattern = this.pickPattern();
    const w = this.gameWidth;

    switch (pattern) {
      case 'single': {
        const id = this.pickEnemyId();
        this.spawnEnemy(Phaser.Math.Between(30, w - 30), id);
        break;
      }
      case 'pair': {
        const x = Phaser.Math.Between(50, w / 2 - 30);
        const id = this.pickEnemyId();
        this.spawnEnemy(x, id);
        this.spawnEnemy(w - x, id);
        break;
      }
      case 'cluster': {
        const cx = Phaser.Math.Between(80, w - 80);
        const id = this.pickEnemyId();
        const count = 3 + Math.floor(Math.random() * 2);
        for (let i = 0; i < count; i++) {
          const x = Phaser.Math.Clamp(
            cx + Phaser.Math.Between(-40, 40),
            20,
            w - 20
          );
          this.spawnEnemy(x, id, Phaser.Math.Between(-60, -30));
        }
        break;
      }
      case 'row': {
        const count = 5;
        for (let i = 0; i < count; i++) {
          const x = ((i + 1) * w) / (count + 1);
          this.spawnEnemy(x, 'walker');
        }
        break;
      }
      case 'sides': {
        const id = this.pickEnemyId();
        this.spawnEnemy(30, id);
        this.spawnEnemy(w - 30, id);
        break;
      }
      case 'stream': {
        const x = Phaser.Math.Between(30, w - 30);
        const id = this.pickEnemyId();
        for (let i = 0; i < 3; i++) {
          this.spawnEnemy(x, id, -30 - i * 60);
        }
        break;
      }
    }
  }

  private pickPattern(): SpawnPattern {
    const stage = this.stageIndex;
    const options: [SpawnPattern, number][] = [
      ['single', 10],
      ['pair', 6]
    ];
    if (stage >= 2) {
      options.push(['cluster', 3]);
      options.push(['stream', 3]);
    }
    if (stage >= 3) {
      options.push(['row', 2]);
      options.push(['sides', 3]);
    }
    const total = options.reduce((s, [, w]) => s + w, 0);
    let r = Math.random() * total;
    for (const [v, w] of options) {
      r -= w;
      if (r <= 0) return v;
    }
    return 'single';
  }

  private pickEnemyId(): string {
    const pool = Object.keys(ENEMIES).filter(
      (k) => ENEMIES[k].minStage <= this.stageIndex
    );
    return pool[Math.floor(Math.random() * pool.length)];
  }

  private spawnEnemy(x: number, id: string, y: number = -30) {
    const def = ENEMIES[id];
    if (!def) return;
    this.enemies.push(new Enemy(this, x, y, def));
  }

  private fire() {
    const speed = this.stats.bulletSpeed;
    const px = this.player.x;
    const pyTop = this.player.y - 20;
    const pyBot = this.player.y + 20;

    if (this.stats.shotgun) {
      this.spawnBullet(px, pyTop, 0, -speed);
      this.spawnBullet(px, pyTop, -speed * 0.3, -speed * 0.95);
      this.spawnBullet(px, pyTop, speed * 0.3, -speed * 0.95);
    } else if (this.stats.twin) {
      this.spawnBullet(px - 10, pyTop, 0, -speed);
      this.spawnBullet(px + 10, pyTop, 0, -speed);
    } else {
      this.spawnBullet(px, pyTop, 0, -speed);
    }

    if (this.stats.backShot) {
      this.spawnBullet(px, pyBot, 0, speed);
    }

    if (this.stats.sideShot) {
      this.spawnBullet(px - 16, this.player.y, -speed, 0);
      this.spawnBullet(px + 16, this.player.y, speed, 0);
    }

    sound.playShot();
  }

  private spawnBullet(x: number, y: number, vx: number, vy: number) {
    this.bullets.push(
      new Bullet(
        this,
        x,
        y,
        vx,
        vy,
        this.stats.pierce,
        this.stats.bounce,
        this.stats.bulletSize,
        this.stats.homing
      )
    );
  }

  private handleBulletVsEnemy() {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      const bBounds = b.getBounds();
      let bulletGone = false;
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const e = this.enemies[j];
        if (b.hitEnemies.has(e.id)) continue;
        if (
          Phaser.Geom.Intersects.RectangleToRectangle(bBounds, e.getBounds())
        ) {
          b.hitEnemies.add(e.id);
          if (e.takeDamage()) {
            this.killEnemy(e, j);
          }
          if (b.remainingPierce > 0) {
            b.remainingPierce -= 1;
          } else {
            b.destroy();
            this.bullets.splice(i, 1);
            bulletGone = true;
            break;
          }
        }
      }
      if (bulletGone) continue;
    }
  }

  /** 敵を確実に殺す共通処理（弾・衝撃波・トレイル共通） */
  private killEnemy(e: Enemy, index: number) {
    const eb = e.getBounds();
    this.emitHitEffect(eb.centerX, eb.centerY);
    this.emitScoreFloat(eb.centerX, eb.centerY, e.def.score);
    this.score += e.def.score;
    this.scoreText.setText(`SCORE ${this.score}`);
    e.destroy();
    this.enemies.splice(index, 1);
    sound.playHit();
  }

  /** GROUND POUND: 停止中に周囲に衝撃波 */
  private emitShockwave() {
    const cx = this.player.x;
    const cy = this.player.y;
    const ring = this.add
      .circle(cx, cy, 10, 0x000000, 0)
      .setStrokeStyle(3, 0xe63946, 0.7);
    this.tweens.add({
      targets: ring,
      radius: GROUND_POUND_RADIUS,
      alpha: 0,
      duration: 320,
      ease: 'Cubic.easeOut',
      onComplete: () => ring.destroy()
    });
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      const dx = e.sprite.x - cx;
      const dy = e.sprite.y - cy;
      if (dx * dx + dy * dy < GROUND_POUND_RADIUS * GROUND_POUND_RADIUS) {
        if (e.takeDamage()) this.killEnemy(e, i);
      }
    }
  }

  /** TRAIL BLAZE: 自機の軌跡に残像を残す */
  private spawnTrailParticle() {
    const p = this.add.circle(
      this.player.x,
      this.player.y - 8,
      TRAIL_RADIUS,
      0xe63946,
      0.38
    );
    this.trailParticles.push({
      sprite: p,
      life: TRAIL_LIFE,
      hitEnemies: new Set()
    });
  }

  private updateTrailParticles(dt: number) {
    for (let i = this.trailParticles.length - 1; i >= 0; i--) {
      const tp = this.trailParticles[i];
      tp.life -= dt;
      tp.sprite.setAlpha(Math.max(0, (tp.life / TRAIL_LIFE) * 0.38));
      if (tp.life <= 0) {
        tp.sprite.destroy();
        this.trailParticles.splice(i, 1);
        continue;
      }
      const bounds = tp.sprite.getBounds();
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const e = this.enemies[j];
        if (tp.hitEnemies.has(e.id)) continue;
        if (
          Phaser.Geom.Intersects.RectangleToRectangle(bounds, e.getBounds())
        ) {
          tp.hitEnemies.add(e.id);
          if (e.takeDamage()) this.killEnemy(e, j);
        }
      }
    }
  }

  /** 撃破時のパーティクル */
  private emitHitEffect(x: number, y: number) {
    const count = 6;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const dist = 30 + Math.random() * 25;
      const p = this.add.circle(x, y, 3, 0x000000);
      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0.2,
        duration: 320,
        ease: 'Cubic.easeOut',
        onComplete: () => p.destroy()
      });
    }
  }

  /** 撃破時のスコア浮遊表示 */
  private emitScoreFloat(x: number, y: number, value: number) {
    const t = this.add
      .text(x, y, `+${value}`, {
        fontFamily: 'Menlo, monospace',
        fontSize: '13px',
        color: '#000',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);
    this.tweens.add({
      targets: t,
      y: y - 28,
      alpha: 0,
      duration: 600,
      ease: 'Cubic.easeOut',
      onComplete: () => t.destroy()
    });
  }

  private damagePlayer() {
    this.hp -= 1;
    this.drawHpIcons();
    this.cameras.main.flash(120, 255, 0, 0, true);
    sound.playDamage();
    if (this.hp <= 0) this.triggerGameOver();
  }

  private triggerStageClear() {
    this.isStageCleared = true;
    const hpBonus = this.hp * HP_BONUS_PER;
    const stageBonus = this.stageIndex * STAGE_BONUS_PER;
    this.score += hpBonus + stageBonus;
    sound.playClear();
    this.scene.launch('AbilitySelectScene', {
      stats: this.stats,
      hp: this.hp,
      score: this.score,
      stageIndex: this.stageIndex + 1,
      hpBonus,
      stageBonus,
      missedCount: this.missedCount
    });
    this.scene.pause();
  }

  private triggerGameOver() {
    this.isGameOver = true;
    sound.playGameOver();
    this.add
      .rectangle(
        this.gameWidth / 2,
        this.gameHeight / 2,
        this.gameWidth * 0.85,
        240,
        0xffffff,
        0.95
      )
      .setStrokeStyle(2, 0x000000);
    this.add
      .text(
        this.gameWidth / 2,
        this.gameHeight / 2,
        `GAME OVER\nSTAGE ${this.stageIndex}\nSCORE ${this.score}\nMISSED ${this.missedCount}\n\nTAP TO RESTART`,
        {
          fontFamily: 'Menlo, monospace',
          fontSize: '18px',
          color: '#000',
          fontStyle: 'bold',
          align: 'center'
        }
      )
      .setOrigin(0.5);

    this.time.delayedCall(500, () => {
      this.input.once('pointerdown', () => {
        this.scene.restart({});
      });
    });
  }
}
