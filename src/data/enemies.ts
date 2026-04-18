import { EnemyDef } from '../types';

/**
 * 敵の定義。追加するときはここに1項目増やすだけ。
 * shape で挙動のヒントを形で示す設計。
 */
export const ENEMIES: Record<string, EnemyDef> = {
  walker: {
    id: 'walker',
    name: 'Walker',
    shape: 'rect',
    size: 28,
    hp: 1,
    speed: 150,
    behavior: 'walker',
    score: 10,
    minStage: 1
  },
  zigzag: {
    id: 'zigzag',
    name: 'Zigzag',
    shape: 'diamond',
    size: 26,
    hp: 1,
    speed: 120,
    behavior: 'zigzag',
    score: 15,
    minStage: 2
  },
  spike: {
    id: 'spike',
    name: 'Spike',
    shape: 'triangleDown',
    size: 30,
    hp: 2,
    speed: 130,
    behavior: 'spike',
    score: 20,
    minStage: 3
  },
  shooter: {
    id: 'shooter',
    name: 'Shooter',
    shape: 'circle',
    size: 26,
    hp: 2,
    speed: 70,
    behavior: 'shooter',
    score: 25,
    minStage: 3
  },
  chaser: {
    id: 'chaser',
    name: 'Chaser',
    shape: 'triangle',
    size: 26,
    hp: 1,
    speed: 110,
    behavior: 'chaser',
    score: 20,
    minStage: 4
  }
};
