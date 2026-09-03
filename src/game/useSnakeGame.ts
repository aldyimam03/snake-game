import { useCallback, useEffect, useRef, useState } from "react";
import {
  COLS,
  ROWS,
  DIRS,
  DIFFS,
  BOARD_COLORS as C,
  initialSnake,
  isOpposite,
  randFreeCell,
  sameDir,
  segColor,
  type DiffKey,
  type Vec,
} from "./engine";
import { sfx } from "./sound";

export type Phase = "menu" | "countdown" | "playing" | "paused" | "over";

interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number; color: string; size: number;
}
interface Floater {
  x: number; y: number; text: string; life: number; maxLife: number; color: string;
}

interface GameState {
  snake: Vec[]; prev: Vec[]; dir: Vec; queue: Vec[];
  food: Vec; bonus: { pos: Vec; expiresAt: number } | null;
  bonusPausedAt: number;
  foodsEaten: number; score: number; maxLen: number;
  stepMs: number; baseStepMs: number;
  phase: Phase; countdownUntil: number; countdownValue: number;
  acc: number; lastTime: number; playMs: number;
  particles: Particle[]; floaters: Floater[];
  shake: number; flash: number;
  difficulty: DiffKey; deadAt: number; newBest: boolean; newBestLive: boolean;
}

export interface UiState {
  phase: Phase;
  score: number;
  best: number;
  bests: Record<DiffKey, number>;
  length: number;
  speedLevel: number;
  difficulty: DiffKey;
  muted: boolean;
  countdown: number;
  newBest: boolean;
  newBestLive: boolean;
  timeSec: number;
  foods: number;
}

const BEST_KEY = "serpentine.best.v1";
const DIFF_KEY = "serpentine.diff.v1";
const AI_STEP = 135;
const BONUS_TTL = 6500;
const COUNT_STEP = 380;

function loadBests(): Record<DiffKey, number> {
  const base: Record<DiffKey, number> = { chill: 0, classic: 0, insane: 0 };
  try {
    const raw = localStorage.getItem(BEST_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<Record<DiffKey, number>>;
      return {
        chill: Number(p.chill) || 0,
        classic: Number(p.classic) || 0,
        insane: Number(p.insane) || 0,
      };
    }
  } catch { /* ignore */ }
  return base;
}

function loadDiff(): DiffKey {
  try {
    const d = localStorage.getItem(DIFF_KEY);
    if (d === "chill" || d === "classic" || d === "insane") return d;
  } catch { /* ignore */ }
  return "classic";
}

function speedLevel(s: GameState): number {
  return Math.min(10, DIFFS[s.difficulty].tier + Math.floor(s.foodsEaten / 4));
}

export function useSnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const bestsRef = useRef<Record<DiffKey, number>>(loadBests());

  const stRef = useRef<GameState>({
    snake: initialSnake(),
    prev: initialSnake(),
    dir: DIRS.right,
    queue: [],
    food: { x: 15, y: 10 },
    bonus: null,
    bonusPausedAt: 0,
    foodsEaten: 0,
    score: 0,
    maxLen: 5,
    stepMs: DIFFS[loadDiff()].step,
    baseStepMs: DIFFS[loadDiff()].step,
    phase: "menu",
    countdownUntil: 0,
    countdownValue: 3,
    acc: 0,
    lastTime: 0,
    playMs: 0,
    particles: [],
    floaters: [],
    shake: 0,
    flash: 0,
    difficulty: loadDiff(),
    deadAt: 0,
    newBest: false,
    newBestLive: false,
  });

  const [ui, setUi] = useState<UiState>(() => {
    const s = stRef.current;
    return {
      phase: "menu",
      score: 0,
      best: bestsRef.current[s.difficulty],
      bests: { ...bestsRef.current },
      length: 5,
      speedLevel: DIFFS[s.difficulty].tier,
      difficulty: s.difficulty,
      muted: sfx.muted,
      countdown: 3,
      newBest: false,
      newBestLive: false,
      timeSec: 0,
      foods: 0,
    };
  });

  const patch = useCallback((p: Partial<UiState>) => {
    setUi((u) => ({ ...u, ...p }));
  }, []);

  const sync = useCallback(() => {
    const s = stRef.current;
    patch({
      phase: s.phase,
      score: s.score,
      best: bestsRef.current[s.difficulty],
      bests: { ...bestsRef.current },
      length: s.snake.length,
      speedLevel: speedLevel(s),
      difficulty: s.difficulty,
      countdown: s.countdownValue,
      newBest: s.newBest,
      newBestLive: s.newBestLive,
      timeSec: Math.floor(s.playMs / 1000),
      foods: s.foodsEaten,
    });
  }, [patch]);

  /* ------------------------------------------------------------------ */
  /* game flow                                                           */
  /* ------------------------------------------------------------------ */

  const resetBoard = useCallback((s: GameState) => {
    s.snake = initialSnake();
    s.prev = s.snake.map((v) => ({ ...v }));
    s.dir = DIRS.right;
    s.queue = [];
    s.food = randFreeCell(s.snake) ?? { x: 15, y: 10 };
    s.bonus = null;
    s.bonusPausedAt = 0;
    s.foodsEaten = 0;
    s.score = 0;
    s.maxLen = s.snake.length;
    s.acc = 0;
    s.playMs = 0;
    s.particles = [];
    s.floaters = [];
    s.shake = 0;
    s.flash = 0;
    s.newBest = false;
    s.newBestLive = false;
    s.baseStepMs = DIFFS[s.difficulty].step;
    s.stepMs = s.baseStepMs;
  }, []);

  const burst = useCallback(
    (s: GameState, x: number, y: number, colors: string[], n: number, power = 6) => {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 1.5 + Math.random() * power;
        s.particles.push({
          x, y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - 1.2,
          life: 1,
          maxLife: 450 + Math.random() * 400,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 0.07 + Math.random() * 0.09,
        });
      }
      if (s.particles.length > 220) s.particles.splice(0, s.particles.length - 220);
    },
    [],
  );

  const die = useCallback(
    (s: GameState, now: number) => {
      s.phase = "over";
      s.deadAt = now;
      s.shake = 15;
      s.flash = 1;
      sfx.die();
      const head = s.snake[0];
      burst(s, head.x + 0.5, head.y + 0.5, ["#ff5c4d", "#ffd166", "#8fe84f"], 26, 8);
      const prevBest = bestsRef.current[s.difficulty];
      if (s.score > prevBest) {
        bestsRef.current = { ...bestsRef.current, [s.difficulty]: s.score };
        s.newBest = true;
        try {
          localStorage.setItem(BEST_KEY, JSON.stringify(bestsRef.current));
        } catch { /* ignore */ }
      }
      sync();
    },
    [burst, sync],
  );

  const advance = useCallback(
    (s: GameState, now: number, live: boolean): boolean => {
      s.prev = s.snake.map((v) => ({ ...v }));
      const d = s.queue.shift() ?? s.dir;
      s.dir = d;
      const head = s.snake[0];
      const nh = { x: head.x + d.x, y: head.y + d.y };

      if (nh.x < 0 || nh.y < 0 || nh.x >= COLS || nh.y >= ROWS) {
        if (live) die(s, now);
        return false;
      }
      const eatsFood = nh.x === s.food.x && nh.y === s.food.y;
      const eatsBonus = !!s.bonus && nh.x === s.bonus.pos.x && nh.y === s.bonus.pos.y;
      const grows = eatsFood || eatsBonus;
      const body = grows ? s.snake : s.snake.slice(0, -1);
      if (body.some((c) => c.x === nh.x && c.y === nh.y)) {
        if (live) die(s, now);
        return false;
      }

      s.snake.unshift(nh);
      if (!grows) s.snake.pop();
      if (s.snake.length > s.maxLen) s.maxLen = s.snake.length;

      if (eatsFood) {
        const mult = DIFFS[s.difficulty].mult;
        const pts = 10 * mult;
        s.score += pts;
        s.foodsEaten += 1;
        s.stepMs = s.baseStepMs * Math.max(0.6, 1 - s.foodsEaten * 0.016);
        if (live) {
          sfx.eat();
          burst(s, nh.x + 0.5, nh.y + 0.5, ["#ff5c4d", "#ffd9a8", "#c8f542"], 13);
          s.floaters.push({
            x: nh.x + 0.5, y: nh.y + 0.2, text: `+${pts}`,
            life: 1, maxLife: 850, color: "#ffd166",
          });
          if (!s.newBestLive && s.score > bestsRef.current[s.difficulty] && bestsRef.current[s.difficulty] > 0) {
            s.newBestLive = true;
            sfx.best();
          }
          sync();
        }
        const cell = randFreeCell(s.snake);
        if (cell) s.food = cell;
        if (live && s.foodsEaten % 5 === 0 && !s.bonus) {
          const bc = randFreeCell([...s.snake, s.food]);
          if (bc) s.bonus = { pos: bc, expiresAt: now + BONUS_TTL };
        }
      } else if (eatsBonus && s.bonus) {
        const mult = DIFFS[s.difficulty].mult;
        const pts = 50 * mult;
        s.score += pts;
        s.bonus = null;
        if (live) {
          sfx.bonus();
          burst(s, nh.x + 0.5, nh.y + 0.5, ["#ffd166", "#fff3c4", "#c8f542"], 22, 8);
          s.floaters.push({
            x: nh.x + 0.5, y: nh.y + 0.2, text: `+${pts}`,
            life: 1, maxLife: 1000, color: "#ffd166",
          });
          if (!s.newBestLive && s.score > bestsRef.current[s.difficulty] && bestsRef.current[s.difficulty] > 0) {
            s.newBestLive = true;
            sfx.best();
          }
          sync();
        }
      }

      if (s.bonus && now > s.bonus.expiresAt) {
        if (live) burst(s, s.bonus.pos.x + 0.5, s.bonus.pos.y + 0.5, ["#9db8a8"], 6, 2);
        s.bonus = null;
      }
      return true;
    },
    [burst, die, sync],
  );

  const aiSteer = useCallback((s: GameState) => {
    const options = [DIRS.up, DIRS.down, DIRS.left, DIRS.right].filter(
      (d) => !isOpposite(d, s.dir),
    );
    const body = new Set(s.snake.slice(0, -1).map((c) => c.x + c.y * COLS));
    const valid = options.filter((d) => {
      const nx = s.snake[0].x + d.x;
      const ny = s.snake[0].y + d.y;
      return nx >= 0 && ny >= 0 && nx < COLS && ny < ROWS && !body.has(nx + ny * COLS);
    });
    if (valid.length === 0) return;
    let best = valid[0];
    let bestDist = Infinity;
    for (const d of valid) {
      const nx = s.snake[0].x + d.x;
      const ny = s.snake[0].y + d.y;
      let dist = Math.abs(nx - s.food.x) + Math.abs(ny - s.food.y);
      if (sameDir(d, s.dir)) dist -= 0.4; // prefer going straight
      if (dist < bestDist) {
        bestDist = dist;
        best = d;
      }
    }
    if (!sameDir(best, s.dir)) s.queue = [best];
  }, []);

  const start = useCallback(
    (diff?: DiffKey) => {
      const s = stRef.current;
      if (diff) {
        s.difficulty = diff;
        try { localStorage.setItem(DIFF_KEY, diff); } catch { /* ignore */ }
      }
      resetBoard(s);
      s.phase = "countdown";
      s.countdownUntil = performance.now() + COUNT_STEP * 3;
      s.countdownValue = 3;
      sfx.ensure();
      sfx.count(false);
      sync();
    },
    [resetBoard, sync],
  );

  const toMenu = useCallback(() => {
    const s = stRef.current;
    resetBoard(s);
    s.phase = "menu";
    sfx.ui();
    sync();
  }, [resetBoard, sync]);

  const pause = useCallback(() => {
    const s = stRef.current;
    if (s.phase !== "playing") return;
    s.phase = "paused";
    if (s.bonus) s.bonusPausedAt = performance.now();
    sfx.ui();
    sync();
  }, [sync]);

  const resume = useCallback(() => {
    const s = stRef.current;
    if (s.phase !== "paused") return;
    if (s.bonus && s.bonusPausedAt > 0) {
      s.bonus.expiresAt += performance.now() - s.bonusPausedAt;
      s.bonusPausedAt = 0;
    }
    s.phase = "playing";
    sfx.ensure();
    sfx.ui();
    sync();
  }, [sync]);

  const togglePause = useCallback(() => {
    const s = stRef.current;
    if (s.phase === "playing") pause();
    else if (s.phase === "paused") resume();
  }, [pause, resume]);

  const pushDir = useCallback((d: Vec): boolean => {
    const s = stRef.current;
    if (s.phase !== "playing") return false;
    const ref = s.queue.length ? s.queue[s.queue.length - 1] : s.dir;
    if (isOpposite(d, ref) || sameDir(d, ref)) return false;
    if (s.queue.length >= 3) return false;
    s.queue.push(d);
    sfx.turn();
    return true;
  }, []);

  const setDifficulty = useCallback(
    (d: DiffKey) => {
      const s = stRef.current;
      if (s.phase === "playing" || s.phase === "countdown") return;
      s.difficulty = d;
      try { localStorage.setItem(DIFF_KEY, d); } catch { /* ignore */ }
      sfx.ensure();
      sfx.ui();
      sync();
    },
    [sync],
  );

  const toggleMute = useCallback(() => {
    sfx.ensure();
    sfx.setMuted(!sfx.muted);
    if (!sfx.muted) sfx.ui();
    patch({ muted: sfx.muted });
  }, [patch]);

  /* ------------------------------------------------------------------ */
  /* rendering                                                           */
  /* ------------------------------------------------------------------ */

  const render = useCallback((s: GameState, now: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = canvas.width / dpr;
    const H = canvas.height / dpr;
    if (W <= 0) return;
    const cell = W / COLS;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    if (s.shake > 0.3) {
      ctx.translate((Math.random() - 0.5) * s.shake * 0.55, (Math.random() - 0.5) * s.shake * 0.55);
    }

    // board base + checker
    ctx.fillStyle = C.base;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = C.checker;
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if ((x + y) & 1) ctx.fillRect(x * cell, y * cell, cell, cell);
      }
    }

    // slow traveling light band
    const bx = (((now / 7500) % 1.7) - 0.35) * W;
    const band = ctx.createLinearGradient(bx, 0, bx + W * 0.32, 0);
    band.addColorStop(0, "rgba(200,245,66,0)");
    band.addColorStop(0.5, C.scene);
    band.addColorStop(1, "rgba(200,245,66,0)");
    ctx.fillStyle = band;
    ctx.fillRect(0, 0, W, H);

    // danger border
    const bw = Math.max(1.5, cell * 0.08);
    ctx.strokeStyle = C.edge;
    ctx.lineWidth = bw;
    ctx.strokeRect(bw / 2, bw / 2, W - bw, H - bw);

    // interpolation coefficient
    const stepRef = s.phase === "menu" ? AI_STEP : s.stepMs;
    let t = 1;
    if (s.phase === "playing" || s.phase === "paused" || s.phase === "menu") {
      t = Math.max(0, Math.min(1, s.acc / stepRef));
    }

    /* food */
    {
      const pulse = 1 + Math.sin(now / 170) * 0.09;
      const fx = (s.food.x + 0.5) * cell;
      const fy = (s.food.y + 0.5) * cell;
      const r = cell * 0.31 * pulse;
      ctx.save();
      ctx.shadowColor = C.foodGlow;
      ctx.shadowBlur = cell * 0.85;
      const g = ctx.createRadialGradient(fx - r * 0.35, fy - r * 0.4, r * 0.15, fx, fy, r);
      g.addColorStop(0, "#ff9d76");
      g.addColorStop(0.55, C.food);
      g.addColorStop(1, "#c2302a");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(fx, fy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      // leaf
      ctx.save();
      ctx.translate(fx + r * 0.25, fy - r * 0.95);
      ctx.rotate(-0.7);
      ctx.fillStyle = C.leaf;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.42, r * 0.18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      // shine
      ctx.fillStyle = C.foodHi;
      ctx.beginPath();
      ctx.arc(fx - r * 0.32, fy - r * 0.36, r * 0.16, 0, Math.PI * 2);
      ctx.fill();
    }

    /* bonus fruit */
    if (s.bonus) {
      const remain = Math.max(0, s.bonus.expiresAt - now) / BONUS_TTL;
      const bxp = (s.bonus.pos.x + 0.5) * cell;
      const byp = (s.bonus.pos.y + 0.5) * cell;
      const blink = remain < 0.28 && Math.floor(now / 130) % 2 === 0 ? 0.45 : 1;
      const r = cell * 0.3 * (1 + Math.sin(now / 120) * 0.07);
      ctx.save();
      ctx.globalAlpha = blink;
      ctx.shadowColor = C.bonusGlow;
      ctx.shadowBlur = cell * 1.1;
      const g = ctx.createRadialGradient(bxp - r * 0.3, byp - r * 0.35, r * 0.1, bxp, byp, r);
      g.addColorStop(0, "#fff3c4");
      g.addColorStop(0.6, C.bonus);
      g.addColorStop(1, "#c78a1e");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(bxp, byp, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      // timer ring
      ctx.save();
      ctx.globalAlpha = blink;
      ctx.strokeStyle = C.bonus;
      ctx.lineWidth = Math.max(2, cell * 0.09);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(bxp, byp, cell * 0.44, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * remain);
      ctx.stroke();
      ctx.restore();
    }

    /* snake */
    {
      const fade = s.phase === "over" ? Math.min(1, (now - s.deadAt) / 420) : 0;
      const len = s.snake.length;
      const pts: { x: number; y: number }[] = s.snake.map((c, i) => {
        const p = s.prev[Math.min(i, s.prev.length - 1)] ?? c;
        return {
          x: (p.x + (c.x - p.x) * t + 0.5) * cell,
          y: (p.y + (c.y - p.y) * t + 0.5) * cell,
        };
      });

      // dark underlay for definition
      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = C.outline;
      ctx.lineWidth = cell * 0.82;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < len; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
      ctx.restore();

      // gradient body segments (tail -> head)
      ctx.lineCap = "round";
      for (let i = len - 1; i >= 1; i--) {
        const frac = len === 1 ? 1 : 1 - i / (len - 1);
        ctx.strokeStyle = segColor(frac, fade);
        ctx.lineWidth = cell * (0.5 + 0.18 * frac);
        ctx.beginPath();
        ctx.moveTo(pts[i].x, pts[i].y);
        ctx.lineTo(pts[i - 1].x, pts[i - 1].y);
        ctx.stroke();
      }

      // head
      const hp = pts[0];
      const d = s.dir;
      const hr = cell * 0.46;
      ctx.save();
      if (fade < 1) {
        ctx.shadowColor = "rgba(200,245,66,0.55)";
        ctx.shadowBlur = cell * 0.7;
      }
      const hg = ctx.createRadialGradient(
        hp.x - d.x * hr * 0.3 - d.y * hr * 0.3,
        hp.y - d.y * hr * 0.3 + d.x * hr * 0.3,
        hr * 0.2,
        hp.x, hp.y, hr,
      );
      hg.addColorStop(0, fade > 0.6 ? "#ff9d76" : "#ecff8a");
      hg.addColorStop(1, segColor(1, fade));
      ctx.fillStyle = hg;
      ctx.beginPath();
      ctx.arc(hp.x, hp.y, hr, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // tongue flick
      if (s.phase !== "over" && now % 2600 < 300) {
        const tx = hp.x + d.x * hr * 0.9;
        const ty = hp.y + d.y * hr * 0.9;
        const ex = hp.x + d.x * (hr * 0.9 + cell * 0.34);
        const ey = hp.y + d.y * (hr * 0.9 + cell * 0.34);
        const px = -d.y, py = d.x;
        ctx.strokeStyle = C.tongue;
        ctx.lineWidth = Math.max(1.5, cell * 0.07);
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(ex, ey);
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex + (d.x * 0.5 + px * 0.6) * cell * 0.14, ey + (d.y * 0.5 + py * 0.6) * cell * 0.14);
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex + (d.x * 0.5 - px * 0.6) * cell * 0.14, ey + (d.y * 0.5 - py * 0.6) * cell * 0.14);
        ctx.stroke();
      }

      // eyes
      if (fade < 0.85) {
        const px = -d.y, py = d.x;
        for (const sgn of [1, -1]) {
          const exC = hp.x + d.x * hr * 0.22 + px * sgn * hr * 0.42;
          const eyC = hp.y + d.y * hr * 0.22 + py * sgn * hr * 0.42;
          ctx.fillStyle = C.eyeWhite;
          ctx.beginPath();
          ctx.arc(exC, eyC, cell * 0.125, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = C.pupil;
          ctx.beginPath();
          ctx.arc(exC + d.x * cell * 0.045, eyC + d.y * cell * 0.045, cell * 0.062, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // X eyes when dead
        const px = -d.y, py = d.x;
        ctx.strokeStyle = "#5c130c";
        ctx.lineWidth = Math.max(1.5, cell * 0.06);
        ctx.lineCap = "round";
        for (const sgn of [1, -1]) {
          const exC = hp.x + d.x * hr * 0.22 + px * sgn * hr * 0.42;
          const eyC = hp.y + d.y * hr * 0.22 + py * sgn * hr * 0.42;
          const k = cell * 0.09;
          ctx.beginPath();
          ctx.moveTo(exC - k, eyC - k); ctx.lineTo(exC + k, eyC + k);
          ctx.moveTo(exC + k, eyC - k); ctx.lineTo(exC - k, eyC + k);
          ctx.stroke();
        }
      }
    }

    /* particles */
    for (const p of s.particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x * cell, p.y * cell, Math.max(0.5, p.size * cell * p.life), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    /* floating score text */
    if (s.floaters.length) {
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `${Math.max(10, Math.round(cell * 0.5))}px "Press Start 2P", monospace`;
      for (const f of s.floaters) {
        ctx.globalAlpha = Math.max(0, f.life);
        ctx.fillStyle = "rgba(4,12,8,0.8)";
        ctx.fillText(f.text, f.x * cell + 1.5, f.y * cell + 1.5);
        ctx.fillStyle = f.color;
        ctx.fillText(f.text, f.x * cell, f.y * cell);
      }
      ctx.globalAlpha = 1;
    }

    ctx.restore();

    // hit-flash
    if (s.flash > 0.01) {
      ctx.fillStyle = `rgba(255, 92, 77, ${0.28 * s.flash})`;
      ctx.fillRect(0, 0, W, H);
    }
  }, []);

  /* ------------------------------------------------------------------ */
  /* main loop + listeners                                               */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    const canvas = canvasRef.current;
    const board = boardRef.current;
    if (!canvas || !board) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = board.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(board);

    const s = stRef.current;
    s.lastTime = performance.now();
    let raf = 0;

    const frame = (now: number) => {
      const dt = Math.min(now - s.lastTime, 100);
      s.lastTime = now;

      if (s.phase === "playing") {
        s.playMs += dt;
        s.acc += dt;
        let guard = 0;
        while (s.acc >= s.stepMs && guard < 4 && s.phase === "playing") {
          advance(s, now, true);
          s.acc -= s.stepMs;
          guard++;
        }
      } else if (s.phase === "menu") {
        s.acc += dt;
        let guard = 0;
        while (s.acc >= AI_STEP && guard < 4) {
          aiSteer(s);
          if (!advance(s, now, false)) resetBoard(s);
          s.acc -= AI_STEP;
          guard++;
        }
      } else if (s.phase === "countdown") {
        const remain = s.countdownUntil - now;
        const val = Math.max(1, Math.ceil(remain / COUNT_STEP));
        if (val !== s.countdownValue) {
          s.countdownValue = val;
          sfx.count(false);
          patch({ countdown: val });
        }
        if (remain <= 0) {
          s.phase = "playing";
          s.acc = 0;
          sfx.count(true);
          s.floaters.push({
            x: s.snake[0].x + 1.4, y: s.snake[0].y + 0.5,
            text: "GO!", life: 1, maxLife: 700, color: "#c8f542",
          });
          sync();
        }
      }

      // fx decay
      const dts = dt / 1000;
      s.shake = Math.max(0, s.shake - dt * 0.028);
      s.flash = Math.max(0, s.flash - dt * 0.0022);
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.life -= dt / p.maxLife;
        if (p.life <= 0) { s.particles.splice(i, 1); continue; }
        p.vy += 7 * dts;
        p.x += p.vx * dts;
        p.y += p.vy * dts;
      }
      for (let i = s.floaters.length - 1; i >= 0; i--) {
        const f = s.floaters[i];
        f.life -= dt / f.maxLife;
        f.y -= 1.4 * dts;
        if (f.life <= 0) s.floaters.splice(i, 1);
      }

      render(s, now);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    /* keyboard */
    const onKey = (e: KeyboardEvent) => {
      const k = e.key;
      const handled = [
        "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " ", "Enter",
      ].includes(k);
      if (handled) e.preventDefault();

      switch (k) {
        case "ArrowUp": case "w": case "W": pushDir(DIRS.up); break;
        case "ArrowDown": case "s": case "S": pushDir(DIRS.down); break;
        case "ArrowLeft": case "a": case "A": pushDir(DIRS.left); break;
        case "ArrowRight": case "d": case "D": pushDir(DIRS.right); break;
        case " ":
        case "p": case "P": {
          const ph = stRef.current.phase;
          if (ph === "playing" || ph === "paused") togglePause();
          else if (ph === "menu" || ph === "over") start();
          break;
        }
        case "Enter": {
          const ph = stRef.current.phase;
          if (ph === "menu" || ph === "over") start();
          else if (ph === "paused") resume();
          break;
        }
        case "r": case "R": {
          const ph = stRef.current.phase;
          if (ph !== "menu") start();
          break;
        }
        case "Escape": {
          const ph = stRef.current.phase;
          if (ph !== "menu") toMenu();
          break;
        }
        case "m": case "M": toggleMute(); break;
        case "1": if (stRef.current.phase === "menu" || stRef.current.phase === "over") setDifficulty("chill"); break;
        case "2": if (stRef.current.phase === "menu" || stRef.current.phase === "over") setDifficulty("classic"); break;
        case "3": if (stRef.current.phase === "menu" || stRef.current.phase === "over") setDifficulty("insane"); break;
        default: break;
      }
    };
    window.addEventListener("keydown", onKey);

    /* auto-pause when the tab hides */
    const onVis = () => {
      if (document.hidden) pause();
    };
    document.addEventListener("visibilitychange", onVis);
    const onBlur = () => pause();
    window.addEventListener("blur", onBlur);

    /* swipe + tap on the board */
    let tx = 0, ty = 0, tt = 0;
    let onButton = false;
    const onTouchStart = (e: TouchEvent) => {
      const t0 = e.touches[0];
      tx = t0.clientX; ty = t0.clientY; tt = performance.now();
      const el = e.target as HTMLElement | null;
      onButton = !!el?.closest?.("button");
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (onButton) return;
      const t0 = e.changedTouches[0];
      const dx = t0.clientX - tx;
      const dy = t0.clientY - ty;
      const dtms = performance.now() - tt;
      const ph = stRef.current.phase;
      if (Math.abs(dx) < 22 && Math.abs(dy) < 22) {
        // tap
        if (dtms < 350) {
          if (ph === "menu") start();
          else if (ph === "over" && performance.now() - stRef.current.deadAt > 700) start();
          else if (ph === "paused") resume();
        }
        return;
      }
      if (Math.abs(dx) > Math.abs(dy)) pushDir(dx > 0 ? DIRS.right : DIRS.left);
      else pushDir(dy > 0 ? DIRS.down : DIRS.up);
    };
    board.addEventListener("touchstart", onTouchStart, { passive: true });
    board.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("blur", onBlur);
      board.removeEventListener("touchstart", onTouchStart);
      board.removeEventListener("touchend", onTouchEnd);
    };
  }, [advance, aiSteer, pause, pushDir, render, resetBoard, resume, setDifficulty, start, sync, toMenu, toggleMute, patch]);

  return {
    canvasRef,
    boardRef,
    ui,
    actions: {
      start,
      pause,
      resume,
      togglePause,
      toMenu,
      setDifficulty,
      pushDir,
      toggleMute,
    },
  };
}
