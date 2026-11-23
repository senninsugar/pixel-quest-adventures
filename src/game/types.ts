export type Direction = "down" | "up" | "left" | "right";

export type RoomId = "village" | "forest" | "ruins" | "shrine";

export type TileType =
  | "grass"
  | "flower"
  | "bush"
  | "tree"
  | "water"
  | "path"
  | "wall"
  | "floor"
  | "bridge"
  | "gate"
  | "spring";

export type EnemyKind = "doromu" | "togemushi" | "kagebito" | "gorda";

export type DropKind = "heart" | "coin" | "shard";

export type ChestReward = "shard" | "heart_container" | "coins";

export interface PlayerState {
  x: number;
  y: number;
  dir: Direction;
  hp: number;
  maxHp: number;
  coins: number;
  shards: number;
  walkTimer: number;
  attackTimer: number;
  attackCooldown: number;
  invulnTimer: number;
  knockVx: number;
  knockVy: number;
}

export interface EnemyState {
  id: string;
  kind: EnemyKind;
  x: number;
  y: number;
  size: number;
  hp: number;
  maxHp: number;
  dir: Direction;
  moveTimer: number;
  hitTimer: number;
  knockVx: number;
  knockVy: number;
  dashTimer: number;
  alive: boolean;
}

export interface ChestState {
  id: string;
  tx: number;
  ty: number;
  reward: ChestReward;
  opened: boolean;
  message: string;
}

export interface NpcState {
  id: string;
  name: string;
  role: "elder" | "smith" | "sign";
  tx: number;
  ty: number;
  lines: string[];
}

export interface DropItem {
  id: string;
  kind: DropKind;
  x: number;
  y: number;
  bobPhase: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface RoomRuntime {
  id: RoomId;
  name: string;
  tiles: TileType[][];
  enemies: EnemyState[];
  chests: ChestState[];
  npcs: NpcState[];
  drops: DropItem[];
  exits: Partial<Record<Direction, RoomId>>;
}

export type GamePhase = "title" | "playing" | "gameover" | "victory";

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

export interface GameState {
  phase: GamePhase;
  roomId: RoomId;
  rooms: Record<RoomId, RoomRuntime>;
  player: PlayerState;
  particles: Particle[];
  dialogue: { speaker: string; lines: string[]; index: number } | null;
  banner: { text: string; timer: number } | null;
  shrineUnlocked: boolean;
  bossDefeated: boolean;
  time: number;
  nextEntityId: number;
}