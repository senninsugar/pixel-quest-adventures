import type { Direction, DropKind, EnemyKind, NpcState, TileType } from "./types";

// Crisp pixel-art drawing primitives directly on a 240x176 canvas context.
function px(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

export function drawTile(
  ctx: CanvasRenderingContext2D,
  tile: TileType,
  x: number,
  y: number,
  time: number,
  tx: number,
  ty: number,
) {
  const hash = (tx * 31 + ty * 17) % 5;
  switch (tile) {
    case "grass":
      px(ctx, x, y, 16, 16, "#4f9a58");
      px(ctx, x + 2 + hash * 2, y + 3, 2, 1, "#62b368");
      px(ctx, x + 10 - hash, y + 11, 2, 2, "#3f8148");
      break;
    case "flower":
      px(ctx, x, y, 16, 16, "#4f9a58");
      px(ctx, x + 3, y + 5, 2, 2, "#f7e06b");
      px(ctx, x + 4, y + 4, 1, 1, "#fff8d6");
      px(ctx, x + 10, y + 10, 2, 2, "#f27ea8");
      px(ctx, x + 11, y + 9, 1, 1, "#ffd8e8");
      break;
    case "path":
      px(ctx, x, y, 16, 16, "#c9a875");
      px(ctx, x + 2 + hash, y + 3, 2, 2, "#b5915e");
      px(ctx, x + 10, y + 10, 3, 2, "#d8bc8b");
      break;
    case "bush":
      px(ctx, x, y, 16, 16, "#4f9a58");
      px(ctx, x + 2, y + 3, 12, 11, "#255d38");
      px(ctx, x + 3, y + 2, 10, 9, "#357c47");
      px(ctx, x + 4, y + 4, 3, 3, "#55a85e");
      px(ctx, x + 9, y + 5, 3, 2, "#55a85e");
      break;
    case "tree":
      px(ctx, x, y, 16, 16, "#3a7844");
      px(ctx, x + 6, y + 11, 4, 5, "#6b482e");
      px(ctx, x + 1, y + 2, 14, 10, "#1c4a32");
      px(ctx, x + 2, y + 1, 12, 8, "#296643");
      px(ctx, x + 4, y + 2, 4, 3, "#438f57");
      px(ctx, x + 9, y + 4, 3, 2, "#438f57");
      break;
    case "water": {
      const wave = Math.floor(time * 2.5 + tx + ty) % 2;
      px(ctx, x, y, 16, 16, "#2c73a8");
      px(ctx, x + 2 + wave * 2, y + 4, 5, 1, "#66b2e0");
      px(ctx, x + 7 - wave * 2, y + 11, 6, 1, "#66b2e0");
      break;
    }
    case "spring": {
      const pulse = Math.floor(time * 4) % 2;
      px(ctx, x, y, 16, 16, "#2b8fc4");
      px(ctx, x + 2, y + 2, 12, 12, "#58d4e8");
      px(ctx, x + 5, y + 5, 6, 6, pulse === 0 ? "#c4fbff" : "#8ef0fa");
      px(ctx, x + 7, y + 3 + pulse, 2, 2, "#ffffff");
      break;
    }
    case "bridge":
      px(ctx, x, y, 16, 16, "#2c73a8");
      px(ctx, x + 1, y, 14, 16, "#8c5c38");
      for (let i = 1; i < 16; i += 4) {
        px(ctx, x + 1, y + i, 14, 1, "#684125");
      }
      px(ctx, x + 1, y, 2, 16, "#a8744a");
      px(ctx, x + 13, y, 2, 16, "#a8744a");
      break;
    case "wall":
      px(ctx, x, y, 16, 16, "#3b4259");
      px(ctx, x + 1, y + 1, 14, 6, "#555f7d");
      px(ctx, x + 1, y + 9, 6, 6, "#4d5673");
      px(ctx, x + 9, y + 9, 6, 6, "#555f7d");
      px(ctx, x + 1, y + 1, 14, 1, "#7480a3");
      break;
    case "floor":
      px(ctx, x, y, 16, 16, "#7b8299");
      px(ctx, x + 1, y + 1, 14, 14, "#8a92aa");
      px(ctx, x + 1, y + 14, 14, 1, "#697086");
      px(ctx, x + 14, y + 1, 1, 14, "#697086");
      break;
    case "gate": {
      const glow = Math.floor(time * 3) % 2;
      px(ctx, x, y, 16, 16, "#30364a");
      px(ctx, x + 2, y + 1, 12, 14, "#4b5570");
      px(ctx, x + 5, y + 4, 6, 8, glow === 0 ? "#48d9a4" : "#8ff5cc");
      px(ctx, x + 7, y + 6, 2, 4, "#1e3a38");
      break;
    }
  }
}

export function drawChest(ctx: CanvasRenderingContext2D, x: number, y: number, opened: boolean) {
  px(ctx, x + 2, y + 4, 12, 10, "#4a2c16");
  px(ctx, x + 3, y + 5, 10, 8, opened ? "#6b4326" : "#a86932");
  px(ctx, x + 2, y + 8, 12, 2, "#e8b948");
  if (opened) {
    px(ctx, x + 4, y + 5, 8, 3, "#26170d");
  } else {
    px(ctx, x + 7, y + 7, 2, 3, "#fff0a6");
  }
}

export function drawNpc(ctx: CanvasRenderingContext2D, npc: NpcState, time: number) {
  const x = npc.tx * 16;
  const y = npc.ty * 16;
  if (npc.role === "sign") {
    px(ctx, x + 7, y + 10, 2, 5, "#6b4423");
    px(ctx, x + 2, y + 3, 12, 8, "#a87442");
    px(ctx, x + 3, y + 4, 10, 6, "#c7925b");
    px(ctx, x + 4, y + 6, 8, 1, "#5c391c");
    px(ctx, x + 4, y + 8, 6, 1, "#5c391c");
    return;
  }
  const bob = Math.floor(time * 2) % 2;
  // Shadow
  px(ctx, x + 4, y + 14, 8, 2, "rgba(0,0,0,0.3)");
  if (npc.role === "elder") {
    px(ctx, x + 4, y + 7 + bob, 8, 7, "#dfd7c3");
    px(ctx, x + 5, y + 2 + bob, 6, 5, "#f4c9a2");
    px(ctx, x + 5, y + 6 + bob, 6, 3, "#f5f7fa"); // beard
    px(ctx, x + 4, y + 1 + bob, 8, 2, "#d8e0eb"); // hair
    px(ctx, x + 6, y + 4 + bob, 1, 1, "#1e2230");
    px(ctx, x + 9, y + 4 + bob, 1, 1, "#1e2230");
    px(ctx, x + 12, y + 4 + bob, 2, 10, "#7c5230"); // staff
  } else {
    px(ctx, x + 4, y + 7 + bob, 8, 7, "#4b536b");
    px(ctx, x + 5, y + 8 + bob, 6, 5, "#874a35"); // apron
    px(ctx, x + 5, y + 2 + bob, 6, 5, "#ebb98f");
    px(ctx, x + 4, y + 1 + bob, 8, 2, "#cf6f3e"); // headband
    px(ctx, x + 6, y + 4 + bob, 1, 1, "#1e2230");
    px(ctx, x + 9, y + 4 + bob, 1, 1, "#1e2230");
  }
}

export function drawDrop(ctx: CanvasRenderingContext2D, kind: DropKind, x: number, y: number, time: number) {
  const bob = Math.round(Math.sin(time * 5) * 1.5);
  const dy = y + bob;
  if (kind === "heart") {
    px(ctx, x + 3, dy + 4, 3, 3, "#e64553");
    px(ctx, x + 7, dy + 4, 3, 3, "#e64553");
    px(ctx, x + 4, dy + 6, 5, 3, "#e64553");
    px(ctx, x + 5, dy + 9, 3, 2, "#e64553");
    px(ctx, x + 4, dy + 5, 1, 1, "#ffadb6");
  } else if (kind === "coin") {
    px(ctx, x + 4, dy + 3, 5, 7, "#f2c14e");
    px(ctx, x + 5, dy + 4, 3, 5, "#ffe680");
    px(ctx, x + 6, dy + 5, 1, 3, "#d4952a");
  } else {
    // Star shard
    px(ctx, x + 5, dy + 1, 3, 11, "#52e5b2");
    px(ctx, x + 2, dy + 4, 9, 5, "#52e5b2");
    px(ctx, x + 5, dy + 4, 3, 5, "#d8fff1");
  }
}

// Original Hero: Rio (silver spiky hair, crimson scarf, deep teal traveler coat)
export function drawRio(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dir: Direction,
  walkTimer: number,
  attackTimer: number,
  invulnTimer: number,
) {
  if (invulnTimer > 0 && Math.floor(invulnTimer * 18) % 2 === 0) {
    return;
  }
  const step = Math.floor(walkTimer * 8) % 2;
  // Shadow
  px(ctx, x + 3, y + 13, 10, 3, "rgba(0,0,0,0.32)");

  // Boots
  px(ctx, x + 4, y + 12 + (step === 0 ? 0 : 1), 3, 3, "#242738");
  px(ctx, x + 9, y + 12 + (step === 1 ? 0 : 1), 3, 3, "#242738");

  // Teal traveler cloak & golden belt
  px(ctx, x + 3, y + 7, 10, 6, "#247b8c");
  px(ctx, x + 4, y + 8, 8, 4, "#3198ab");
  px(ctx, x + 3, y + 10, 10, 1, "#f2c14e");

  // Crimson scarf
  px(ctx, x + 3, y + 6, 10, 2, "#e04856");
  if (dir === "left") px(ctx, x + 11, y + 7, 3, 2, "#c43543");
  if (dir === "right") px(ctx, x + 2, y + 7, 3, 2, "#c43543");
  if (dir === "up") px(ctx, x + 6, y + 7, 4, 3, "#c43543");

  // Head & silver spiky hair
  px(ctx, x + 4, y + 2, 8, 5, "#f5cba7");
  px(ctx, x + 3, y + 0, 10, 3, "#dfe8f5");
  px(ctx, x + 2, y + 1, 2, 3, "#c1d0e6");
  px(ctx, x + 12, y + 1, 2, 3, "#c1d0e6");
  px(ctx, x + 5, y - 1, 3, 2, "#f0f5fc");
  px(ctx, x + 9, y - 1, 2, 2, "#f0f5fc");

  // Eyes based on facing direction
  if (dir === "down") {
    px(ctx, x + 5, y + 4, 1, 2, "#1c2233");
    px(ctx, x + 10, y + 4, 1, 2, "#1c2233");
  } else if (dir === "left") {
    px(ctx, x + 5, y + 4, 1, 2, "#1c2233");
  } else if (dir === "right") {
    px(ctx, x + 10, y + 4, 1, 2, "#1c2233");
  } else {
    // Back of silver hair
    px(ctx, x + 4, y + 2, 8, 4, "#c8d6eb");
  }

  // Star-Blade slash visual
  if (attackTimer > 0) {
    const bladeColor = "#7ef5e2";
    const coreColor = "#fff9cc";
    if (dir === "down") {
      px(ctx, x + 3, y + 15, 10, 10, "rgba(126,245,226,0.35)");
      px(ctx, x + 6, y + 14, 4, 12, bladeColor);
      px(ctx, x + 7, y + 15, 2, 10, coreColor);
    } else if (dir === "up") {
      px(ctx, x + 3, y - 10, 10, 10, "rgba(126,245,226,0.35)");
      px(ctx, x + 6, y - 11, 4, 12, bladeColor);
      px(ctx, x + 7, y - 10, 2, 10, coreColor);
    } else if (dir === "left") {
      px(ctx, x - 10, y + 3, 10, 10, "rgba(126,245,226,0.35)");
      px(ctx, x - 11, y + 6, 12, 4, bladeColor);
      px(ctx, x - 10, y + 7, 10, 2, coreColor);
    } else {
      px(ctx, x + 15, y + 3, 10, 10, "rgba(126,245,226,0.35)");
      px(ctx, x + 14, y + 6, 12, 4, bladeColor);
      px(ctx, x + 15, y + 7, 10, 2, coreColor);
    }
  }
}

export function drawEnemy(
  ctx: CanvasRenderingContext2D,
  kind: EnemyKind,
  x: number,
  y: number,
  time: number,
  hitTimer: number,
) {
  const flash = hitTimer > 0 && Math.floor(hitTimer * 25) % 2 === 0;
  const bounce = Math.floor(time * 5) % 2;

  if (kind === "doromu") {
    px(ctx, x + 2, y + 12, 10, 2, "rgba(0,0,0,0.28)");
    px(ctx, x + 2, y + 5 + bounce, 10, 8 - bounce, flash ? "#ffffff" : "#d98829");
    px(ctx, x + 3, y + 4 + bounce, 8, 6 - bounce, flash ? "#ffffff" : "#f5b642");
    px(ctx, x + 4, y + 7 + bounce, 2, 2, "#241910");
    px(ctx, x + 8, y + 7 + bounce, 2, 2, "#241910");
    px(ctx, x + 4, y + 5 + bounce, 2, 1, "#fff1b8");
  } else if (kind === "togemushi") {
    px(ctx, x + 2, y + 12, 10, 2, "rgba(0,0,0,0.3)");
    px(ctx, x + 1, y + 4 + bounce, 12, 8, flash ? "#ffffff" : "#613c8a");
    px(ctx, x + 3, y + 2 + bounce, 8, 8, flash ? "#ffffff" : "#8757bd");
    px(ctx, x + 2, y + 3 + bounce, 2, 2, "#e2d4f5"); // spike
    px(ctx, x + 10, y + 3 + bounce, 2, 2, "#e2d4f5"); // spike
    px(ctx, x + 4, y + 8 + bounce, 2, 2, "#ffd166");
    px(ctx, x + 8, y + 8 + bounce, 2, 2, "#ffd166");
  } else if (kind === "kagebito") {
    const floatY = Math.round(Math.sin(time * 6) * 2);
    px(ctx, x + 3, y + 13, 8, 2, "rgba(0,0,0,0.22)");
    px(ctx, x + 3, y + 2 + floatY, 8, 10, flash ? "#ffffff" : "#2c2f59");
    px(ctx, x + 2, y + 4 + floatY, 10, 7, flash ? "#ffffff" : "#3f4680");
    px(ctx, x + 4, y + 5 + floatY, 2, 2, "#ffe066");
    px(ctx, x + 8, y + 5 + floatY, 2, 2, "#ffe066");
  } else {
    // Boss: Ancient Guardian Gorda (26x26)
    const breathe = Math.floor(time * 3) % 2;
    px(ctx, x + 2, y + 23, 22, 4, "rgba(0,0,0,0.38)");
    // Stone body
    px(ctx, x + 3, y + 4 + breathe, 20, 19, flash ? "#ffffff" : "#3a4054");
    px(ctx, x + 5, y + 2 + breathe, 16, 18, flash ? "#ffffff" : "#555f7a");
    // Mossy shoulders
    px(ctx, x + 1, y + 6 + breathe, 5, 9, flash ? "#ffffff" : "#3d7a57");
    px(ctx, x + 20, y + 6 + breathe, 5, 9, flash ? "#ffffff" : "#3d7a57");
    // Glowing eyes
    px(ctx, x + 8, y + 6 + breathe, 3, 3, "#ff5e6c");
    px(ctx, x + 15, y + 6 + breathe, 3, 3, "#ff5e6c");
    // Emerald Star Core in chest
    px(ctx, x + 10, y + 12 + breathe, 6, 6, "#3de0a5");
    px(ctx, x + 12, y + 14 + breathe, 2, 2, "#e8fff7");
  }
}