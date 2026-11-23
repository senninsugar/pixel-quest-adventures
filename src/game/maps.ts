import type { ChestState, EnemyState, NpcState, RoomId, RoomRuntime, TileType } from "./types";

export const TILE_SIZE = 16;
export const MAP_COLS = 15;
export const MAP_ROWS = 11;
export const CANVAS_WIDTH = MAP_COLS * TILE_SIZE; // 240
export const CANVAS_HEIGHT = MAP_ROWS * TILE_SIZE; // 176

const CHAR_TO_TILE: Record<string, TileType> = {
  ".": "grass",
  ",": "flower",
  "b": "bush",
  "T": "tree",
  "~": "water",
  "p": "path",
  "#": "wall",
  "f": "floor",
  "=": "bridge",
  "G": "gate",
  "S": "spring",
};

function parseGrid(rows: string[]): TileType[][] {
  return rows.map((row) =>
    row.split("").map((ch) => CHAR_TO_TILE[ch] ?? "grass"),
  );
}

export function isSolidTile(tile: TileType): boolean {
  return tile === "tree" || tile === "water" || tile === "wall" || tile === "gate" || tile === "bush";
}

interface RoomBlueprint {
  id: RoomId;
  name: string;
  grid: string[];
  exits: RoomRuntime["exits"];
  enemies: Omit<EnemyState, "moveTimer" | "hitTimer" | "knockVx" | "knockVy" | "dashTimer" | "alive">[];
  chests: Omit<ChestState, "opened">[];
  npcs: NpcState[];
}

const BLUEPRINTS: Record<RoomId, RoomBlueprint> = {
  village: {
    id: "village",
    name: "始まりの村・ミドリ",
    grid: [
      "TTTTTTpppTTTTTT",
      "T.,...ppp...b.T",
      "T.bb..ppp..~S~T",
      "T.....ppp..~~~T",
      "T.,...ppppppppp",
      "T.....ppppppppp",
      "T..b..ppp...,.T",
      "T.....ppp..bb.T",
      "T.,...ppp.....T",
      "T.bb.......,,.T",
      "TTTTTTTTTTTTTTT",
    ],
    exits: { up: "ruins", right: "forest" },
    enemies: [],
    chests: [],
    npcs: [
      {
        id: "elder-haru",
        name: "長老ハル",
        role: "elder",
        tx: 5,
        ty: 3,
        lines: [
          "リオよ、よくぞ起きてくれた。北東の『翠光の神殿』の封印が乱れておる。",
          "東の『ささやきの森』と北の『星見の遺跡』にある2つの星のかけらを集めよ。",
          "かけらが2つ揃えば神殿の扉が開く。右上の泉に触れると体力が回復するぞ。",
        ],
      },
      {
        id: "village-sign",
        name: "道しるべ",
        role: "sign",
        tx: 9,
        ty: 6,
        lines: [
          "↑ 北：星見の遺跡 / → 東：ささやきの森",
          "剣で茂みを刈ると、ハートや星貨が見つかることがあるぞ！",
        ],
      },
    ],
  },
  forest: {
    id: "forest",
    name: "ささやきの森",
    grid: [
      "TTTTTTpppTTTTTT",
      "T.bb..ppp..bb.T",
      "T.,...ppp...,.T",
      "T..TT.ppp.TT..T",
      "ppppppppp..b..T",
      "ppppppppppp...T",
      "T..b...p..bbb.T",
      "T.,..~=~...b..T",
      "T.bb.~~~..,...T",
      "T....~~~......T",
      "TTTTTTTTTTTTTTT",
    ],
    exits: { left: "village", up: "shrine" },
    enemies: [
      { id: "f-d1", kind: "doromu", x: 10 * 16, y: 2 * 16, size: 14, hp: 2, maxHp: 2, dir: "left" },
      { id: "f-d2", kind: "doromu", x: 5 * 16, y: 7 * 16, size: 14, hp: 2, maxHp: 2, dir: "right" },
      { id: "f-t1", kind: "togemushi", x: 11 * 16, y: 8 * 16, size: 14, hp: 3, maxHp: 3, dir: "up" },
    ],
    chests: [
      {
        id: "chest-forest-shard",
        tx: 12,
        ty: 8,
        reward: "shard",
        message: "『星のかけら（森）』を手に入れた！淡い翠色の光を放っている。",
      },
    ],
    npcs: [
      {
        id: "forest-sign",
        name: "森の石碑",
        role: "sign",
        tx: 4,
        ty: 6,
        lines: [
          "この先の茂みの奥に星のかけらが眠る。",
          "北の『翠光の神殿』へ進むには、星のかけらが2つ必要だ。",
        ],
      },
    ],
  },
  ruins: {
    id: "ruins",
    name: "星見の遺跡",
    grid: [
      "###############",
      "#ff..#fff#..ff#",
      "#f..b#fff#b..f#",
      "#f...fffff...f#",
      "#ff###fff###ff#",
      "#fffffffffffff#",
      "#ff###fff###ff#",
      "#f....fff....f#",
      "#f.bb.ppppppppp",
      "#ff...ppppppppp",
      "######ppp######",
    ],
    exits: { down: "village", right: "shrine" },
    enemies: [
      { id: "r-k1", kind: "kagebito", x: 3 * 16, y: 3 * 16, size: 14, hp: 3, maxHp: 3, dir: "right" },
      { id: "r-k2", kind: "kagebito", x: 11 * 16, y: 3 * 16, size: 14, hp: 3, maxHp: 3, dir: "left" },
      { id: "r-t1", kind: "togemushi", x: 7 * 16, y: 6 * 16, size: 14, hp: 3, maxHp: 3, dir: "down" },
    ],
    chests: [
      {
        id: "chest-ruins-shard",
        tx: 7,
        ty: 1,
        reward: "shard",
        message: "『星のかけら（遺跡）』を手に入れた！共鳴する音が響く。",
      },
      {
        id: "chest-ruins-heart",
        tx: 1,
        ty: 1,
        reward: "heart_container",
        message: "『命の器』を手に入れた！最大ハートが1つ増え、全回復した！",
      },
    ],
    npcs: [
      {
        id: "smith-ren",
        name: "旅の鍛冶師レン",
        role: "smith",
        tx: 12,
        ty: 7,
        lines: [
          "おおリオ！北の中央にある宝箱が星のかけらだ。北西には命の器もあるぜ。",
          "神殿の番人ゴルダは突進が強力だ。横にかわして反撃しな！",
        ],
      },
    ],
  },
  shrine: {
    id: "shrine",
    name: "翠光の神殿",
    grid: [
      "###############",
      "#fffffffffffff#",
      "#f#fffffffff#f#",
      "#fffffffffffff#",
      "#fffff...fffff#",
      "#fffffffffffff#",
      "#fffff...fffff#",
      "#f#fffGGGfff#f#",
      "pppppppppfffff#",
      "pppppppppfffff#",
      "######ppp######",
    ],
    exits: { down: "forest", left: "ruins" },
    enemies: [
      {
        id: "boss-gorda",
        kind: "gorda",
        x: 7 * 16 - 6,
        y: 3 * 16,
        size: 26,
        hp: 10,
        maxHp: 10,
        dir: "down",
      },
    ],
    chests: [],
    npcs: [
      {
        id: "shrine-sign",
        name: "神殿の碑文",
        role: "sign",
        tx: 10,
        ty: 9,
        lines: [
          "『2つの星のかけらを携えし者のみ、翠光の門を開く』",
          "門の奥に古の番人ゴルダが待つ。",
        ],
      },
    ],
  },
};

export function createInitialRooms(): Record<RoomId, RoomRuntime> {
  const entries = Object.values(BLUEPRINTS).map((bp) => {
    const room: RoomRuntime = {
      id: bp.id,
      name: bp.name,
      tiles: parseGrid(bp.grid),
      exits: { ...bp.exits },
      enemies: bp.enemies.map((e) => ({
        ...e,
        moveTimer: 0.6,
        hitTimer: 0,
        knockVx: 0,
        knockVy: 0,
        dashTimer: 2.0,
        alive: true,
      })),
      chests: bp.chests.map((c) => ({ ...c, opened: false })),
      npcs: bp.npcs.map((n) => ({ ...n, lines: [...n.lines] })),
      drops: [],
    };
    return [bp.id, room] as const;
  });
  return Object.fromEntries(entries) as Record<RoomId, RoomRuntime>;
}