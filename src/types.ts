/**
 * 共通型定義
 */

/** プレイヤーのスタッツ。ラン内で能力取得により変化する */
export interface PlayerStats {
  shotInterval: number; // 射撃間隔 (ms)
  bulletSpeed: number; // 弾速 (px/s、絶対値。方向はfire時に決定)
  moveSpeed: number; // スワイプ倍率
  keyboardSpeed: number; // キーボード移動速度 (px/s)
  maxHp: number;
  pierce: number; // 弾の貫通体数（0=1体で消滅）
  twin: boolean; // 2発並列射撃
  moveStopDelay: number; // 停止判定時間 (ms)

  // 軌道変化系
  shotgun: boolean; // 3発扇状
  backShot: boolean; // 後方（下）にも発射
  sideShot: boolean; // 左右にも発射
  homing: boolean; // 追尾
  bounce: number; // 壁での跳ね返り残回数
  bulletSize: number; // 弾サイズ倍率

  // 状態限定系（停止中/移動中のみ発動）
  groundPound: boolean; // 停止中: 周囲に衝撃波
  trail: boolean; // 移動中: 軌跡にダメージフィールド
}

/** 敵の挙動タイプ */
export type EnemyBehavior =
  | 'walker'
  | 'spike'
  | 'zigzag'
  | 'shooter'
  | 'chaser';

/** 敵の形 */
export type EnemyShape =
  | 'rect'
  | 'triangle'
  | 'triangleDown'
  | 'diamond'
  | 'circle';

/** 敵定義 */
export interface EnemyDef {
  id: string;
  name: string;
  shape: EnemyShape;
  size: number;
  hp: number;
  speed: number;
  behavior: EnemyBehavior;
  score: number;
  minStage: number;
}

/** 能力定義 */
export interface AbilityDef {
  id: string;
  name: string;
  description: string;
  /** 複数回取得可能か（false なら1回取ったら選択肢から除外） */
  stackable: boolean;
  apply: (stats: PlayerStats) => void;
}
