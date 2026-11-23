import { CANVAS_HEIGHT, CANVAS_WIDTH, MAP_COLS, MAP_ROWS, TILE_SIZE } from "./maps";
import { drawChest, drawDrop, drawEnemy, drawNpc, drawRio, drawTile } from "./sprites";
import type { GameState } from "./types";

export function renderGame(ctx: CanvasRenderingContext2D, state: GameState) {
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const room = state.rooms[state.roomId];

  // 1. Tiles
  for (let ty = 0; ty < MAP_ROWS; ty++) {
    const row = room.tiles[ty];
    if (!row) continue;
    for (let tx = 0; tx < MAP_COLS; tx++) {
      const tile = row[tx] ?? "grass";
      drawTile(ctx, tile, tx * TILE_SIZE, ty * TILE_SIZE, state.time, tx, ty);
    }
  }

  // 2. Chests
  for (const chest of room.chests) {
    drawChest(ctx, chest.tx * TILE_SIZE, chest.ty * TILE_SIZE, chest.opened);
  }

  // 3. NPCs & Signs
  for (const npc of room.npcs) {
    drawNpc(ctx, npc, state.time);
  }

  // 4. Drops
  for (const drop of room.drops) {
    drawDrop(ctx, drop.kind, drop.x, drop.y, state.time);
  }

  // 5. Enemies
  for (const enemy of room.enemies) {
    if (!enemy.alive) continue;
    drawEnemy(ctx, enemy.kind, enemy.x, enemy.y, state.time, enemy.hitTimer);
    if (enemy.kind === "gorda") {
      // Boss HP bar at top of arena
      const barW = 96;
      const barX = (CANVAS_WIDTH - barW) / 2;
      ctx.fillStyle = "rgba(18, 22, 36, 0.85)";
      ctx.fillRect(barX - 2, 4, barW + 4, 8);
      ctx.fillStyle = "#3a4259";
      ctx.fillRect(barX, 6, barW, 4);
      const ratio = Math.max(0, enemy.hp / enemy.maxHp);
      ctx.fillStyle = "#3de0a5";
      ctx.fillRect(barX, 6, Math.round(barW * ratio), 4);
    }
  }

  // 6. Player (Rio)
  drawRio(
    ctx,
    state.player.x,
    state.player.y,
    state.player.dir,
    state.player.walkTimer,
    state.player.attackTimer,
    state.player.invulnTimer,
  );

  // 7. Particles
  for (const pt of state.particles) {
    ctx.fillStyle = pt.color;
    ctx.fillRect(Math.round(pt.x), Math.round(pt.y), pt.size, pt.size);
  }
}