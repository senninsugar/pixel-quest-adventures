import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  MAP_COLS,
  MAP_ROWS,
  TILE_SIZE,
  createInitialRooms,
  isSolidTile,
} from "./maps";
import type { SfxKind } from "./sound";
import type { Direction, EnemyState, GamePhase, GameState, InputState, RoomId } from "./types";

const PLAYER_SPEED = 78;
const PLAYER_HITBOX = { ox: 3, oy: 6, w: 10, h: 9 };

export type SoundCallback = (sfx: SfxKind) => void;

export function createInitialState(phase: GamePhase = "title"): GameState {
  return {
    phase,
    roomId: "village",
    rooms: createInitialRooms(),
    player: {
      x: 7 * TILE_SIZE,
      y: 6 * TILE_SIZE,
      dir: "down",
      hp: 6,
      maxHp: 6,
      coins: 0,
      shards: 0,
      walkTimer: 0,
      attackTimer: 0,
      attackCooldown: 0,
      invulnTimer: 0,
      knockVx: 0,
      knockVy: 0,
    },
    particles: [],
    dialogue: null,
    banner: phase === "playing" ? { text: "始まりの村・ミドリ", timer: 2.2 } : null,
    shrineUnlocked: false,
    bossDefeated: false,
    time: 0,
    nextEntityId: 1,
  };
}

function rectsOverlap(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function spawnBurst(state: GameState, x: number, y: number, color: string, count = 8) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (i % 2) * 0.25;
    const speed = 28 + (i % 3) * 18;
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.35,
      maxLife: 0.35,
      color,
      size: i % 2 === 0 ? 3 : 2,
    });
  }
}

function isBlockedAt(state: GameState, x: number, y: number, w: number, h: number): boolean {
  const room = state.rooms[state.roomId];
  const left = Math.floor(x / TILE_SIZE);
  const right = Math.floor((x + w - 0.01) / TILE_SIZE);
  const top = Math.floor(y / TILE_SIZE);
  const bottom = Math.floor((y + h - 0.01) / TILE_SIZE);

  for (let ty = top; ty <= bottom; ty++) {
    for (let tx = left; tx <= right; tx++) {
      if (tx < 0 || tx >= MAP_COLS || ty < 0 || ty >= MAP_ROWS) continue;
      const tile = room.tiles[ty]?.[tx];
      if (tile && isSolidTile(tile)) return true;
    }
  }

  for (const chest of room.chests) {
    if (rectsOverlap(x, y, w, h, chest.tx * TILE_SIZE + 2, chest.ty * TILE_SIZE + 4, 12, 10)) {
      return true;
    }
  }
  for (const npc of room.npcs) {
    if (rectsOverlap(x, y, w, h, npc.tx * TILE_SIZE + 3, npc.ty * TILE_SIZE + 4, 10, 10)) {
      return true;
    }
  }
  return false;
}

export function unlockShrineIfReady(state: GameState, playSfx?: SoundCallback) {
  if (state.shrineUnlocked || state.player.shards < 2) return;
  state.shrineUnlocked = true;
  const shrine = state.rooms.shrine;
  for (let ty = 0; ty < shrine.tiles.length; ty++) {
    const row = shrine.tiles[ty];
    if (!row) continue;
    for (let tx = 0; tx < row.length; tx++) {
      if (row[tx] === "gate") {
        row[tx] = "floor";
      }
    }
  }
  state.banner = { text: "翠光の神殿の封印が解かれた！", timer: 3.0 };
  playSfx?.("unlock");
}

export function getSwordHitbox(state: GameState): { x: number; y: number; w: number; h: number } {
  const p = state.player;
  if (p.dir === "down") return { x: p.x + 1, y: p.y + 14, w: 14, h: 14 };
  if (p.dir === "up") return { x: p.x + 1, y: p.y - 12, w: 14, h: 14 };
  if (p.dir === "left") return { x: p.x - 12, y: p.y + 1, w: 14, h: 14 };
  return { x: p.x + 14, y: p.y + 1, w: 14, h: 14 };
}

export function startAttack(state: GameState, playSfx?: SoundCallback) {
  if (state.phase !== "playing") return;
  if (state.dialogue) {
    advanceDialogue(state, playSfx);
    return;
  }
  if (state.player.attackCooldown > 0) return;

  state.player.attackTimer = 0.18;
  state.player.attackCooldown = 0.28;
  playSfx?.("slash");

  const box = getSwordHitbox(state);
  const room = state.rooms[state.roomId];

  // Cut bushes inside sword hitbox
  const minTx = Math.max(0, Math.floor(box.x / TILE_SIZE));
  const maxTx = Math.min(MAP_COLS - 1, Math.floor((box.x + box.w) / TILE_SIZE));
  const minTy = Math.max(0, Math.floor(box.y / TILE_SIZE));
  const maxTy = Math.min(MAP_ROWS - 1, Math.floor((box.y + box.h) / TILE_SIZE));

  for (let ty = minTy; ty <= maxTy; ty++) {
    const row = room.tiles[ty];
    if (!row) continue;
    for (let tx = minTx; tx <= maxTx; tx++) {
      if (row[tx] === "bush") {
        row[tx] = "grass";
        spawnBurst(state, tx * TILE_SIZE + 8, ty * TILE_SIZE + 8, "#55a85e", 6);
        const roll = (tx * 13 + ty * 7 + state.nextEntityId) % 5;
        if (roll === 0) {
          room.drops.push({
            id: `drop-${state.nextEntityId++}`,
            kind: "heart",
            x: tx * TILE_SIZE + 2,
            y: ty * TILE_SIZE + 2,
            bobPhase: 0,
          });
        } else if (roll === 1 || roll === 2) {
          room.drops.push({
            id: `drop-${state.nextEntityId++}`,
            kind: "coin",
            x: tx * TILE_SIZE + 2,
            y: ty * TILE_SIZE + 2,
            bobPhase: 0,
          });
        }
      }
    }
  }

  // Hit enemies
  for (const enemy of room.enemies) {
    if (!enemy.alive || enemy.hitTimer > 0) continue;
    if (rectsOverlap(box.x, box.y, box.w, box.h, enemy.x, enemy.y, enemy.size, enemy.size)) {
      damageEnemy(state, enemy, 1, playSfx);
    }
  }
}

export function damageEnemy(
  state: GameState,
  enemy: EnemyState,
  amount: number,
  playSfx?: SoundCallback,
) {
  enemy.hp = Math.max(0, enemy.hp - amount);
  enemy.hitTimer = 0.25;
  const dx = enemy.x + enemy.size / 2 - (state.player.x + 8);
  const dy = enemy.y + enemy.size / 2 - (state.player.y + 8);
  const dist = Math.hypot(dx, dy) || 1;
  const knock = enemy.kind === "gorda" ? 55 : 115;
  enemy.knockVx = (dx / dist) * knock;
  enemy.knockVy = (dy / dist) * knock;
  playSfx?.("hit");
  spawnBurst(state, enemy.x + enemy.size / 2, enemy.y + enemy.size / 2, "#7ef5e2", 6);

  if (enemy.hp <= 0) {
    enemy.alive = false;
    const room = state.rooms[state.roomId];
    spawnBurst(state, enemy.x + enemy.size / 2, enemy.y + enemy.size / 2, "#ffe066", 12);
    if (enemy.kind === "gorda") {
      state.bossDefeated = true;
      room.drops.push({
        id: `drop-${state.nextEntityId++}`,
        kind: "shard",
        x: enemy.x + 6,
        y: enemy.y + 6,
        bobPhase: 0,
      });
      state.banner = { text: "古の番人ゴルダを倒した！星のかけらを取ろう！", timer: 3.5 };
      playSfx?.("unlock");
    } else {
      const dropKind = state.player.hp < state.player.maxHp ? "heart" : "coin";
      room.drops.push({
        id: `drop-${state.nextEntityId++}`,
        kind: dropKind,
        x: enemy.x + 1,
        y: enemy.y + 1,
        bobPhase: 0,
      });
    }
  }
}

export function advanceDialogue(state: GameState, playSfx?: SoundCallback) {
  if (!state.dialogue) return;
  if (state.dialogue.index + 1 < state.dialogue.lines.length) {
    state.dialogue.index += 1;
    playSfx?.("talk");
  } else {
    state.dialogue = null;
  }
}

export function interact(state: GameState, playSfx?: SoundCallback) {
  if (state.phase !== "playing") return;
  if (state.dialogue) {
    advanceDialogue(state, playSfx);
    return;
  }

  const box = getSwordHitbox(state);
  const room = state.rooms[state.roomId];

  // Check chests
  for (const chest of room.chests) {
    if (chest.opened) continue;
    if (rectsOverlap(box.x, box.y, box.w, box.h, chest.tx * TILE_SIZE, chest.ty * TILE_SIZE, 16, 16)) {
      chest.opened = true;
      playSfx?.("chest");
      spawnBurst(state, chest.tx * TILE_SIZE + 8, chest.ty * TILE_SIZE + 6, "#ffe066", 12);
      if (chest.reward === "shard") {
        state.player.shards += 1;
        unlockShrineIfReady(state, playSfx);
      } else if (chest.reward === "heart_container") {
        state.player.maxHp += 2;
        state.player.hp = state.player.maxHp;
      } else {
        state.player.coins += 20;
      }
      state.dialogue = { speaker: "宝箱", lines: [chest.message], index: 0 };
      return;
    }
  }

  // Check NPCs & signs
  for (const npc of room.npcs) {
    if (rectsOverlap(box.x, box.y, box.w, box.h, npc.tx * TILE_SIZE, npc.ty * TILE_SIZE, 16, 16)) {
      state.dialogue = { speaker: npc.name, lines: npc.lines, index: 0 };
      playSfx?.("talk");
      return;
    }
  }
}

export function damagePlayer(state: GameState, amount: number, fromX: number, fromY: number, playSfx?: SoundCallback) {
  const p = state.player;
  if (p.invulnTimer > 0 || state.phase !== "playing") return;
  p.hp = Math.max(0, p.hp - amount);
  p.invulnTimer = 0.9;
  const dx = p.x + 8 - fromX;
  const dy = p.y + 8 - fromY;
  const dist = Math.hypot(dx, dy) || 1;
  p.knockVx = (dx / dist) * 120;
  p.knockVy = (dy / dist) * 120;
  spawnBurst(state, p.x + 8, p.y + 8, "#e64553", 8);
  if (p.hp <= 0) {
    state.phase = "gameover";
    playSfx?.("gameover");
  } else {
    playSfx?.("hurt");
  }
}

function transitionRoom(state: GameState, dir: Direction) {
  const current = state.rooms[state.roomId];
  const nextId: RoomId | undefined = current.exits[dir];
  if (!nextId) return;
  state.roomId = nextId;
  state.particles = [];
  if (dir === "right") state.player.x = 4;
  if (dir === "left") state.player.x = CANVAS_WIDTH - 20;
  if (dir === "down") state.player.y = 4;
  if (dir === "up") state.player.y = CANVAS_HEIGHT - 20;
  state.banner = { text: state.rooms[nextId].name, timer: 2.0 };
}

export function stepGame(state: GameState, input: InputState, dt: number, playSfx?: SoundCallback) {
  const clampedDt = Math.min(dt, 0.05);
  state.time += clampedDt;
  if (state.banner) {
    state.banner.timer -= clampedDt;
    if (state.banner.timer <= 0) state.banner = null;
  }
  if (state.phase !== "playing" || state.dialogue) return;

  const p = state.player;
  p.attackTimer = Math.max(0, p.attackTimer - clampedDt);
  p.attackCooldown = Math.max(0, p.attackCooldown - clampedDt);
  p.invulnTimer = Math.max(0, p.invulnTimer - clampedDt);

  // Player movement
  let vx = 0;
  let vy = 0;
  if (p.attackTimer <= 0.06) {
    if (input.left) vx -= 1;
    if (input.right) vx += 1;
    if (input.up) vy -= 1;
    if (input.down) vy += 1;
  }
  if (vx !== 0 || vy !== 0) {
    const len = Math.hypot(vx, vy);
    vx = (vx / len) * PLAYER_SPEED;
    vy = (vy / len) * PLAYER_SPEED;
    if (Math.abs(vx) >= Math.abs(vy)) {
      p.dir = vx < 0 ? "left" : "right";
    } else {
      p.dir = vy < 0 ? "up" : "down";
    }
    p.walkTimer += clampedDt;
  }

  const totalVx = vx + p.knockVx;
  const totalVy = vy + p.knockVy;
  p.knockVx *= Math.pow(0.001, clampedDt);
  p.knockVy *= Math.pow(0.001, clampedDt);

  const nextX = p.x + totalVx * clampedDt;
  if (!isBlockedAt(state, nextX + PLAYER_HITBOX.ox, p.y + PLAYER_HITBOX.oy, PLAYER_HITBOX.w, PLAYER_HITBOX.h)) {
    p.x = nextX;
  }
  const nextY = p.y + totalVy * clampedDt;
  if (!isBlockedAt(state, p.x + PLAYER_HITBOX.ox, nextY + PLAYER_HITBOX.oy, PLAYER_HITBOX.w, PLAYER_HITBOX.h)) {
    p.y = nextY;
  }

  // Room exits
  const room = state.rooms[state.roomId];
  if (p.x < -2 && room.exits.left) transitionRoom(state, "left");
  else if (p.x > CANVAS_WIDTH - 14 && room.exits.right) transitionRoom(state, "right");
  else if (p.y < -2 && room.exits.up) transitionRoom(state, "up");
  else if (p.y > CANVAS_HEIGHT - 14 && room.exits.down) transitionRoom(state, "down");
  else {
    p.x = Math.max(0, Math.min(CANVAS_WIDTH - 16, p.x));
    p.y = Math.max(0, Math.min(CANVAS_HEIGHT - 16, p.y));
  }

  // Healing spring check (touching adjacent or standing on spring)
  const centerTx = Math.floor((p.x + 8) / TILE_SIZE);
  const centerTy = Math.floor((p.y + 10) / TILE_SIZE);
  const currentRoom = state.rooms[state.roomId];
  if (currentRoom.tiles[centerTy]?.[centerTx] === "spring" && p.hp < p.maxHp) {
    p.hp = p.maxHp;
    spawnBurst(state, p.x + 8, p.y + 8, "#58d4e8", 10);
    state.banner = { text: "癒やしの泉で体力が全回復した！", timer: 2.0 };
    playSfx?.("pickup");
  }

  // Update enemies
  for (const enemy of currentRoom.enemies) {
    if (!enemy.alive) continue;
    enemy.hitTimer = Math.max(0, enemy.hitTimer - clampedDt);

    let evx = enemy.knockVx;
    let evy = enemy.knockVy;
    enemy.knockVx *= Math.pow(0.002, clampedDt);
    enemy.knockVy *= Math.pow(0.002, clampedDt);

    if (enemy.kind === "gorda") {
      if (state.shrineUnlocked) {
        enemy.dashTimer -= clampedDt;
        const dx = p.x + 8 - (enemy.x + enemy.size / 2);
        const dy = p.y + 8 - (enemy.y + enemy.size / 2);
        const dist = Math.hypot(dx, dy) || 1;
        const speed = enemy.dashTimer < 0.55 ? 64 : 26;
        if (enemy.dashTimer <= 0) enemy.dashTimer = 2.4;
        evx += (dx / dist) * speed;
        evy += (dy / dist) * speed;
      }
    } else {
      enemy.moveTimer -= clampedDt;
      if (enemy.moveTimer <= 0) {
        const dirs: Direction[] = ["up", "down", "left", "right"];
        const idx = Math.floor((state.time * 13 + enemy.x + enemy.y) % 4);
        enemy.dir = dirs[idx] ?? "down";
        enemy.moveTimer = 0.8 + (idx % 3) * 0.35;
      }
      const speed = enemy.kind === "kagebito" ? 36 : enemy.kind === "togemushi" ? 32 : 24;
      if (enemy.dir === "left") evx -= speed;
      if (enemy.dir === "right") evx += speed;
      if (enemy.dir === "up") evy -= speed;
      if (enemy.dir === "down") evy += speed;
    }

    const nx = enemy.x + evx * clampedDt;
    if (!isBlockedAt(state, nx, enemy.y, enemy.size, enemy.size)) {
      enemy.x = Math.max(16, Math.min(CANVAS_WIDTH - 16 - enemy.size, nx));
    }
    const ny = enemy.y + evy * clampedDt;
    if (!isBlockedAt(state, enemy.x, ny, enemy.size, enemy.size)) {
      enemy.y = Math.max(16, Math.min(CANVAS_HEIGHT - 16 - enemy.size, ny));
    }

    // Player contact damage
    if (
      rectsOverlap(
        p.x + PLAYER_HITBOX.ox,
        p.y + PLAYER_HITBOX.oy,
        PLAYER_HITBOX.w,
        PLAYER_HITBOX.h,
        enemy.x + 2,
        enemy.y + 2,
        enemy.size - 4,
        enemy.size - 4,
      )
    ) {
      damagePlayer(state, enemy.kind === "gorda" ? 2 : 1, enemy.x + enemy.size / 2, enemy.y + enemy.size / 2, playSfx);
    }
  }

  // Pickup drops
  currentRoom.drops = currentRoom.drops.filter((drop) => {
    if (rectsOverlap(p.x + 2, p.y + 2, 12, 12, drop.x, drop.y, 12, 12)) {
      if (drop.kind === "heart") {
        p.hp = Math.min(p.maxHp, p.hp + 2);
        playSfx?.("pickup");
      } else if (drop.kind === "coin") {
        p.coins += 5;
        playSfx?.("pickup");
      } else {
        p.shards += 1;
        spawnBurst(state, p.x + 8, p.y + 8, "#52e5b2", 16);
        if (p.shards >= 3) {
          state.phase = "victory";
          playSfx?.("victory");
        } else {
          unlockShrineIfReady(state, playSfx);
          playSfx?.("chest");
        }
      }
      return false;
    }
    return true;
  });

  // Update particles
  state.particles = state.particles.filter((pt) => {
    pt.x += pt.vx * clampedDt;
    pt.y += pt.vy * clampedDt;
    pt.life -= clampedDt;
    return pt.life > 0;
  });
}