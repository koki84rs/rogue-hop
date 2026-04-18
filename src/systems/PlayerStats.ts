import { PlayerStats } from '../types';

/** 新規ランの初期スタッツ */
export const DEFAULT_STATS: PlayerStats = {
  shotInterval: 350,
  bulletSpeed: 650, // 絶対値。方向はfire時に決定
  moveSpeed: 1.8,
  keyboardSpeed: 420,
  maxHp: 3,
  pierce: 0,
  twin: false,
  moveStopDelay: 150,

  shotgun: false,
  backShot: false,
  sideShot: false,
  homing: false,
  bounce: 0,
  bulletSize: 1,

  groundPound: false,
  trail: false
};

export function cloneStats(s: PlayerStats): PlayerStats {
  return { ...s };
}
