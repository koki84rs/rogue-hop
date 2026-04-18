import Phaser from 'phaser';
import { ABILITIES, isAbilityAvailable } from '../data/abilities';
import { PlayerStats, AbilityDef } from '../types';
import { sound } from '../systems/SoundManager';

interface AbilitySelectData {
  stats: PlayerStats;
  hp: number;
  score: number;
  stageIndex: number; // 次のステージ番号
  hpBonus?: number;
  stageBonus?: number;
  missedCount?: number;
}

export class AbilitySelectScene extends Phaser.Scene {
  private sceneData!: AbilitySelectData;

  constructor() {
    super('AbilitySelectScene');
  }

  init(data: AbilitySelectData) {
    this.sceneData = data;
  }

  create() {
    const { width, height } = this.scale;

    // 半透明オーバーレイ
    this.add.rectangle(width / 2, height / 2, width, height, 0xffffff, 0.93);

    // タイトル
    this.add
      .text(width / 2, height * 0.08, 'STAGE CLEAR', {
        fontFamily: 'Menlo, monospace',
        fontSize: '22px',
        color: '#000',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    // ボーナス表示
    if (this.sceneData.hpBonus || this.sceneData.stageBonus) {
      const parts: string[] = [];
      if (this.sceneData.hpBonus) parts.push(`HP x${this.sceneData.hp} = +${this.sceneData.hpBonus}`);
      if (this.sceneData.stageBonus) parts.push(`STAGE BONUS +${this.sceneData.stageBonus}`);
      this.add
        .text(width / 2, height * 0.13, parts.join('  ·  '), {
          fontFamily: 'Menlo, monospace',
          fontSize: '11px',
          color: '#e63946'
        })
        .setOrigin(0.5);
    }

    // MISSED表示
    if (this.sceneData.missedCount && this.sceneData.missedCount > 0) {
      this.add
        .text(width / 2, height * 0.155, `MISSED ${this.sceneData.missedCount}  (-${this.sceneData.missedCount * 5} PENALTY)`, {
          fontFamily: 'Menlo, monospace',
          fontSize: '10px',
          color: '#999'
        })
        .setOrigin(0.5);
    }

    this.add
      .text(width / 2, height * 0.18, 'CHOOSE ONE ABILITY', {
        fontFamily: 'Menlo, monospace',
        fontSize: '14px',
        color: '#666'
      })
      .setOrigin(0.5);

    // 重複回避: 既に取得済みの stackable=false は除外
    const pool = ABILITIES.filter((ab) => isAbilityAvailable(ab, this.sceneData.stats));
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const picks: AbilityDef[] = shuffled.slice(0, 3);
    // プール不足時（ほぼ起きないが一応）: 重複OKで埋める
    while (picks.length < 3 && pool.length > 0) {
      picks.push(pool[Math.floor(Math.random() * pool.length)]);
    }

    // カード描画
    const cardH = 96;
    const gap = 14;
    const totalH = picks.length * cardH + (picks.length - 1) * gap;
    const startY = height * 0.24;
    const cardW = Math.min(width * 0.84, 360);

    picks.forEach((ab, i) => {
      const cy = startY + i * (cardH + gap);
      const card = this.add
        .rectangle(width / 2, cy + cardH / 2, cardW, cardH, 0xffffff, 1)
        .setStrokeStyle(2, 0x000000)
        .setInteractive({ useHandCursor: true });

      this.add
        .text(width / 2, cy + 26, ab.name, {
          fontFamily: 'Menlo, monospace',
          fontSize: '18px',
          color: '#000',
          fontStyle: 'bold'
        })
        .setOrigin(0.5);

      this.add
        .text(width / 2, cy + 60, ab.description, {
          fontFamily: 'Menlo, monospace',
          fontSize: '12px',
          color: '#444',
          align: 'center',
          wordWrap: { width: cardW - 24 }
        })
        .setOrigin(0.5);

      card.on('pointerover', () => card.setFillStyle(0xfff0f0));
      card.on('pointerout', () => card.setFillStyle(0xffffff));
      card.on('pointerdown', () => this.selectAbility(ab));
    });

    // スコアと次ステージ表示（下部）
    this.add
      .text(
        width / 2,
        startY + totalH + 28,
        `SCORE ${this.sceneData.score}   ·   NEXT: STAGE ${this.sceneData.stageIndex}`,
        {
          fontFamily: 'Menlo, monospace',
          fontSize: '12px',
          color: '#666'
        }
      )
      .setOrigin(0.5, 0);
  }

  private selectAbility(ab: AbilityDef) {
    sound.playPickup();
    const newStats = { ...this.sceneData.stats };
    ab.apply(newStats);
    // extra_hp は取得時に回復もする
    const newHp = Math.min(
      this.sceneData.hp + (ab.id === 'extra_hp' ? 1 : 0),
      newStats.maxHp
    );

    this.scene.stop('GameScene');
    this.scene.stop();
    this.scene.start('GameScene', {
      stats: newStats,
      hp: newHp,
      score: this.sceneData.score,
      stageIndex: this.sceneData.stageIndex
    });
  }
}
