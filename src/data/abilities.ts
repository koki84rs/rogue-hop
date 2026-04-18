import { AbilityDef } from '../types';

/**
 * 能力（パッシブ）の定義。
 * - stackable=false: 1回取ったら選択肢から除外される
 * - stackable=true : 何度でも取得可能（効果が累積）
 */
export const ABILITIES: AbilityDef[] = [
  // 軌道変化系（1回のみ、取ると弾の挙動が完全に変わる）
  {
    id: 'shotgun',
    name: 'SHOTGUN',
    description: 'Fire 3 bullets in a spread',
    stackable: false,
    apply: (s) => {
      s.shotgun = true;
    }
  },
  {
    id: 'back_shot',
    name: 'BACK SHOT',
    description: 'Also fire downward',
    stackable: false,
    apply: (s) => {
      s.backShot = true;
    }
  },
  {
    id: 'side_shot',
    name: 'SIDE SHOT',
    description: 'Also fire left & right',
    stackable: false,
    apply: (s) => {
      s.sideShot = true;
    }
  },
  {
    id: 'homing',
    name: 'HOMING',
    description: 'Bullets home in on enemies',
    stackable: false,
    apply: (s) => {
      s.homing = true;
    }
  },
  {
    id: 'twin_shot',
    name: 'TWIN SHOT',
    description: 'Fire 2 bullets side by side',
    stackable: false,
    apply: (s) => {
      s.twin = true;
    }
  },

  // 状態限定系（停止中/移動中のみ発動、差別化ポイント）
  {
    id: 'ground_pound',
    name: 'GROUND POUND',
    description: 'STILL: shockwave hits nearby enemies',
    stackable: false,
    apply: (s) => {
      s.groundPound = true;
    }
  },
  {
    id: 'trail_blaze',
    name: 'TRAIL BLAZE',
    description: 'MOVING: leave a damaging trail',
    stackable: false,
    apply: (s) => {
      s.trail = true;
    }
  },

  // 数値強化系（スタック可能、累積する）
  {
    id: 'bounce',
    name: 'BOUNCE',
    description: 'Bullets bounce off walls +3',
    stackable: true,
    apply: (s) => {
      s.bounce += 3;
    }
  },
  {
    id: 'big_shot',
    name: 'BIG SHOT',
    description: 'Bullets are 2x larger',
    stackable: true,
    apply: (s) => {
      s.bulletSize *= 2;
    }
  },
  {
    id: 'piercing',
    name: 'PIERCING',
    description: 'Bullets pierce +1 enemy',
    stackable: true,
    apply: (s) => {
      s.pierce += 1;
    }
  },
  {
    id: 'rapid_fire',
    name: 'RAPID FIRE',
    description: 'Shot interval -30%',
    stackable: true,
    apply: (s) => {
      s.shotInterval *= 0.7;
    }
  },
  {
    id: 'fast_feet',
    name: 'FAST FEET',
    description: 'Move speed +30%',
    stackable: true,
    apply: (s) => {
      s.moveSpeed *= 1.3;
      s.keyboardSpeed *= 1.3;
    }
  },
  {
    id: 'extra_hp',
    name: 'EXTRA HP',
    description: 'Max HP +1 (and heal 1)',
    stackable: true,
    apply: (s) => {
      s.maxHp += 1;
    }
  },
  {
    id: 'quick_draw',
    name: 'QUICK DRAW',
    description: 'Shoot sooner after stopping',
    stackable: true,
    apply: (s) => {
      s.moveStopDelay = Math.max(30, s.moveStopDelay - 50);
    }
  },
  {
    id: 'heavy_shot',
    name: 'HEAVY SHOT',
    description: 'Bullet speed +30%',
    stackable: true,
    apply: (s) => {
      s.bulletSpeed *= 1.3;
    }
  }
];

/**
 * 既に取得済みの能力（stackable=false）を選択肢から除外する判定。
 */
export function isAbilityAvailable(
  ab: AbilityDef,
  stats: import('../types').PlayerStats
): boolean {
  if (ab.stackable) return true;
  switch (ab.id) {
    case 'shotgun':
      return !stats.shotgun;
    case 'twin_shot':
      return !stats.twin;
    case 'back_shot':
      return !stats.backShot;
    case 'side_shot':
      return !stats.sideShot;
    case 'homing':
      return !stats.homing;
    case 'ground_pound':
      return !stats.groundPound;
    case 'trail_blaze':
      return !stats.trail;
    default:
      return true;
  }
}
