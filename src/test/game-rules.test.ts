import { describe, expect, it } from "vitest";
import {
  createInitialState,
  damageEnemy,
  damagePlayer,
  startAttack,
  stepGame,
  unlockShrineIfReady,
} from "@/game/engine";
import { TILE_SIZE } from "@/game/maps";

describe("翠星の旅人 リオ game rules", () => {
  it("cuts a bush tile into grass when Rio swings the sword", () => {
    const state = createInitialState("playing");
    // In village, tile (3, 6) is a bush ("b")
    expect(state.rooms.village.tiles[6]?.[3]).toBe("bush");
    state.player.x = 2 * TILE_SIZE;
    state.player.y = 6 * TILE_SIZE;
    state.player.dir = "right";

    startAttack(state);
    expect(state.rooms.village.tiles[6]?.[3]).toBe("grass");
  });

  it("unlocks the Emerald Shrine gates once 2 Star Shards are collected", () => {
    const state = createInitialState("playing");
    expect(state.shrineUnlocked).toBe(false);
    expect(state.rooms.shrine.tiles[7]?.[6]).toBe("gate");

    state.player.shards = 2;
    unlockShrineIfReady(state);

    expect(state.shrineUnlocked).toBe(true);
    expect(state.rooms.shrine.tiles[7]?.[6]).toBe("floor");
    expect(state.rooms.shrine.tiles[7]?.[7]).toBe("floor");
    expect(state.rooms.shrine.tiles[7]?.[8]).toBe("floor");
  });

  it("walks along the east village road smoothly into the Whispering Forest and back", () => {
    const state = createInitialState("playing");
    state.player.x = 7 * TILE_SIZE;
    state.player.y = 4.5 * TILE_SIZE;

    for (let i = 0; i < 120; i++) {
      stepGame(state, { up: false, down: false, left: false, right: true }, 0.03);
      if (state.roomId === "forest") break;
    }
    expect(state.roomId).toBe("forest");

    for (let i = 0; i < 60; i++) {
      stepGame(state, { up: false, down: false, left: true, right: false }, 0.03);
      if (state.roomId === "village") break;
    }
    expect(state.roomId).toBe("village");
  });

  it("transitions to gameover when player HP drops to 0", () => {
    const state = createInitialState("playing");
    damagePlayer(state, 6, 0, 0);
    expect(state.player.hp).toBe(0);
    expect(state.phase).toBe("gameover");
  });

  it("defeating Boss Gorda drops the 3rd Star Shard and picking it up triggers victory", () => {
    const state = createInitialState("playing");
    state.roomId = "shrine";
    state.player.shards = 2;
    unlockShrineIfReady(state);

    const boss = state.rooms.shrine.enemies[0];
    expect(boss?.kind).toBe("gorda");
    if (!boss) return;

    damageEnemy(state, boss, boss.hp);
    expect(boss.alive).toBe(false);
    expect(state.bossDefeated).toBe(true);

    const shardDrop = state.rooms.shrine.drops.find((d) => d.kind === "shard");
    expect(shardDrop).toBeDefined();
    if (!shardDrop) return;

    state.player.x = shardDrop.x;
    state.player.y = shardDrop.y;
    stepGame(state, { up: false, down: false, left: false, right: false }, 0.016);

    expect(state.player.shards).toBe(3);
    expect(state.phase).toBe("victory");
  });
});