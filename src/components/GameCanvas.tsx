import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Volume2, VolumeX } from "lucide-react";
import {
  advanceDialogue,
  createInitialState,
  interact,
  startAttack,
  stepGame,
} from "@/game/engine";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "@/game/maps";
import { renderGame } from "@/game/renderer";
import { sfx } from "@/game/sound";
import type { GamePhase, GameState, InputState } from "@/game/types";

interface HudSnapshot {
  phase: GamePhase;
  roomName: string;
  hp: number;
  maxHp: number;
  coins: number;
  shards: number;
  dialogue: { speaker: string; text: string; hasMore: boolean } | null;
  banner: string | null;
}

function readHud(state: GameState): HudSnapshot {
  return {
    phase: state.phase,
    roomName: state.rooms[state.roomId].name,
    hp: state.player.hp,
    maxHp: state.player.maxHp,
    coins: state.player.coins,
    shards: state.player.shards,
    dialogue: state.dialogue
      ? {
          speaker: state.dialogue.speaker,
          text: state.dialogue.lines[state.dialogue.index] ?? "",
          hasMore: state.dialogue.index + 1 < state.dialogue.lines.length,
        }
      : null,
    banner: state.banner ? state.banner.text : null,
  };
}

function HeartIcon({ fill }: { fill: "full" | "half" | "empty" }) {
  return (
    <svg viewBox="0 0 12 11" className="h-4 w-4 shrink-0" aria-hidden="true">
      <path
        d="M2 0h3v1h2V0h3v1h1v1h1v3h-1v2h-1v1H9v1H8v1H7v1H5v-1H4V9H3V8H2V7H1V5H0V2h1V1h1V0z"
        className={fill === "empty" ? "fill-muted" : "fill-ruby"}
      />
      {fill === "half" && (
        <rect x="6" y="0" width="6" height="11" className="fill-muted" />
      )}
    </svg>
  );
}

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<GameState>(createInitialState("title"));
  const inputRef = useRef<InputState>({ up: false, down: false, left: false, right: false });
  const [hud, setHud] = useState<HudSnapshot>(() => readHud(stateRef.current));
  const [muted, setMuted] = useState(false);
  const [activeDir, setActiveDir] = useState<keyof InputState | null>(null);

  const playSfx = useCallback((kind: Parameters<typeof sfx.play>[0]) => {
    sfx.play(kind);
  }, []);

  const syncHud = useCallback(() => {
    const next = readHud(stateRef.current);
    setHud((prev) => {
      if (
        prev.phase === next.phase &&
        prev.roomName === next.roomName &&
        prev.hp === next.hp &&
        prev.maxHp === next.maxHp &&
        prev.coins === next.coins &&
        prev.shards === next.shards &&
        prev.banner === next.banner &&
        prev.dialogue?.speaker === next.dialogue?.speaker &&
        prev.dialogue?.text === next.dialogue?.text
      ) {
        return prev;
      }
      return next;
    });
  }, []);

  const handleStart = useCallback(() => {
    stateRef.current = createInitialState("playing");
    inputRef.current = { up: false, down: false, left: false, right: false };
    playSfx("pickup");
    syncHud();
  }, [playSfx, syncHud]);

  const handleAttack = useCallback(() => {
    startAttack(stateRef.current, playSfx);
    syncHud();
  }, [playSfx, syncHud]);

  const handleInteract = useCallback(() => {
    interact(stateRef.current, playSfx);
    syncHud();
  }, [playSfx, syncHud]);

  const handleAdvanceDialogue = useCallback(() => {
    advanceDialogue(stateRef.current, playSfx);
    syncHud();
  }, [playSfx, syncHud]);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      sfx.muted = next;
      return next;
    });
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) {
        e.preventDefault();
      }
      if (key === "arrowup" || key === "w") inputRef.current.up = true;
      if (key === "arrowdown" || key === "s") inputRef.current.down = true;
      if (key === "arrowleft" || key === "a") inputRef.current.left = true;
      if (key === "arrowright" || key === "d") inputRef.current.right = true;
      if (key === " " || key === "z" || key === "j") {
        if (stateRef.current.phase === "title") handleStart();
        else handleAttack();
      }
      if (key === "e" || key === "x" || key === "enter" || key === "k") {
        if (stateRef.current.phase === "title") handleStart();
        else handleInteract();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === "arrowup" || key === "w") inputRef.current.up = false;
      if (key === "arrowdown" || key === "s") inputRef.current.down = false;
      if (key === "arrowleft" || key === "a") inputRef.current.left = false;
      if (key === "arrowright" || key === "d") inputRef.current.right = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [handleAttack, handleInteract, handleStart]);

  useEffect(() => {
    let rafId = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      stepGame(stateRef.current, inputRef.current, dt, playSfx);
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) renderGame(ctx, stateRef.current);
      syncHud();
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [playSfx, syncHud]);

  const bindDir = (dir: keyof InputState) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      inputRef.current[dir] = true;
      setActiveDir(dir);
    },
    onPointerUp: () => {
      inputRef.current[dir] = false;
      setActiveDir((cur) => (cur === dir ? null : cur));
    },
    onPointerLeave: () => {
      inputRef.current[dir] = false;
      setActiveDir((cur) => (cur === dir ? null : cur));
    },
    onPointerCancel: () => {
      inputRef.current[dir] = false;
      setActiveDir((cur) => (cur === dir ? null : cur));
    },
  });

  const totalHearts = Math.ceil(hud.maxHp / 2);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col items-center justify-between gap-3 px-3 py-3 sm:justify-center sm:gap-4 sm:py-5">
      {/* Compact Retro HUD */}
      <header className="flex w-full max-w-[720px] flex-wrap items-center justify-between gap-2 rounded-sm border-2 border-border bg-card px-3 py-2 text-xs sm:text-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1" aria-label={`体力 ${hud.hp}/${hud.maxHp}`}>
            {Array.from({ length: totalHearts }).map((_, i) => {
              const hpForSlot = hud.hp - i * 2;
              const fill = hpForSlot >= 2 ? "full" : hpForSlot === 1 ? "half" : "empty";
              return <HeartIcon key={i} fill={fill} />;
            })}
          </div>
          <span className="font-mono text-emerald" aria-label={`星のかけら ${hud.shards}/3`}>
            ★ {hud.shards}/3
          </span>
          <span className="font-mono text-gold" aria-label={`星貨 ${hud.coins}`}>
            ● {hud.coins}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{hud.roomName}</span>
          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? "効果音をオン" : "効果音をミュート"}
            className="inline-flex h-7 w-7 items-center justify-center rounded-sm border border-border bg-secondary text-foreground hover:bg-muted"
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* Pixel Art Game Viewport */}
      <div className="relative w-full max-w-[720px] aspect-[15/11] overflow-hidden rounded-sm pixel-frame bg-card">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="pixel-canvas block h-full w-full"
        />

        {/* Area / Event Banner */}
        {hud.phase === "playing" && hud.banner && !hud.dialogue && (
          <div className="pointer-events-none absolute inset-x-4 top-3 flex justify-center">
            <div className="pixel-panel px-3 py-1.5 text-center text-xs text-foreground sm:text-sm">
              {hud.banner}
            </div>
          </div>
        )}

        {/* Dialogue Overlay */}
        {hud.phase === "playing" && hud.dialogue && (
          <button
            type="button"
            onClick={handleAdvanceDialogue}
            className="pixel-panel absolute inset-x-3 bottom-3 block cursor-pointer p-3 text-left sm:inset-x-4 sm:bottom-4 sm:p-4"
          >
            <div className="mb-1 text-xs text-gold sm:text-sm">{hud.dialogue.speaker}</div>
            <p className="text-xs leading-relaxed text-foreground sm:text-sm">
              {hud.dialogue.text}
            </p>
            <div className="mt-1.5 text-right text-[11px] text-primary">
              {hud.dialogue.hasMore ? "▼ つぎへ" : "▼ とじる"}
            </div>
          </button>
        )}

        {/* Title Screen Overlay */}
        {hud.phase === "title" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/72 p-4 text-center">
            <p className="mb-1 text-xs tracking-widest text-gold sm:text-sm">
              2Dドット絵アクション冒険
            </p>
            <h1 className="text-3xl font-bold tracking-wider text-foreground sm:text-5xl">
              翠星の旅人 リオ
            </h1>
            <p className="mt-2 max-w-sm text-xs leading-relaxed text-muted-foreground sm:text-sm">
              エルディア諸島をめぐり、3つの「星のかけら」を集めて翠光の神殿に挑め。
            </p>
            <button
              type="button"
              onClick={handleStart}
              className="pixel-btn mt-5 cursor-pointer rounded-sm bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground transition-transform hover:brightness-110 sm:text-base"
            >
              ぼうけんをはじめる
            </button>
          </div>
        )}

        {/* Game Over Overlay */}
        {hud.phase === "gameover" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/82 p-4 text-center">
            <h2 className="text-2xl font-bold text-ruby sm:text-4xl">力尽きてしまった...</h2>
            <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
              ミドリ村から再び冒険へ出発しよう。
            </p>
            <button
              type="button"
              onClick={handleStart}
              className="pixel-btn mt-5 cursor-pointer rounded-sm bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground"
            >
              もういちど挑む
            </button>
          </div>
        )}

        {/* Victory Overlay */}
        {hud.phase === "victory" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/82 p-4 text-center">
            <p className="text-xs tracking-widest text-gold sm:text-sm">ADVENTURE CLEAR</p>
            <h2 className="mt-1 text-2xl font-bold text-emerald sm:text-4xl">
              翠光の神殿に光が戻った！
            </h2>
            <p className="mt-2 max-w-sm text-xs leading-relaxed text-foreground sm:text-sm">
              リオは3つの星のかけらを取り戻し、エルディア諸島に平和が訪れた。
            </p>
            <p className="mt-2 font-mono text-xs text-gold sm:text-sm">
              集めた星貨: ● {hud.coins}
            </p>
            <button
              type="button"
              onClick={handleStart}
              className="pixel-btn mt-5 cursor-pointer rounded-sm bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground"
            >
              はじめから遊ぶ
            </button>
          </div>
        )}
      </div>

      {/* Touch Controls (Mobile / Tablet) */}
      <section
        aria-label="操作パッド"
        className="flex w-full max-w-[720px] items-center justify-between px-2 pb-2 md:hidden"
      >
        <div className="grid grid-cols-3 gap-1.5">
          <div />
          <button
            type="button"
            aria-label="上へ移動"
            data-active={activeDir === "up"}
            className="dpad-btn flex h-12 w-12 items-center justify-center rounded-sm bg-secondary text-foreground"
            {...bindDir("up")}
          >
            <ChevronUp className="h-6 w-6" />
          </button>
          <div />
          <button
            type="button"
            aria-label="左へ移動"
            data-active={activeDir === "left"}
            className="dpad-btn flex h-12 w-12 items-center justify-center rounded-sm bg-secondary text-foreground"
            {...bindDir("left")}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-muted/40" />
          <button
            type="button"
            aria-label="右へ移動"
            data-active={activeDir === "right"}
            className="dpad-btn flex h-12 w-12 items-center justify-center rounded-sm bg-secondary text-foreground"
            {...bindDir("right")}
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <div />
          <button
            type="button"
            aria-label="下へ移動"
            data-active={activeDir === "down"}
            className="dpad-btn flex h-12 w-12 items-center justify-center rounded-sm bg-secondary text-foreground"
            {...bindDir("down")}
          >
            <ChevronDown className="h-6 w-6" />
          </button>
          <div />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              handleInteract();
            }}
            className="dpad-btn flex h-16 w-16 flex-col items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground"
          >
            調べる
          </button>
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              handleAttack();
            }}
            className="dpad-btn flex h-20 w-20 flex-col items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground"
          >
            剣
          </button>
        </div>
      </section>

      {/* Desktop Key Guide */}
      <p className="hidden text-xs text-muted-foreground md:block">
        移動: WASD / 矢印キー　｜　剣で斬る: Space / Z　｜　話す・宝箱を開ける: E / X / Enter
      </p>
    </main>
  );
}