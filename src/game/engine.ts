export const COLS = 21;
export const ROWS = 21;

export interface Vec {
  x: number;
  y: number;
}

export const DIRS: Record<"up" | "down" | "left" | "right", Vec> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export type DiffKey = "chill" | "classic" | "insane";

export interface DiffDef {
  key: DiffKey;
  label: string;
  desc: string;
  /** ms per grid step at start of run */
  step: number;
  /** score multiplier */
  mult: number;
  /** starting speed tier for the HUD meter (1..10) */
  tier: number;
  /** accent color for pips / badges */
  color: string;
}

export const DIFF_ORDER: DiffKey[] = ["chill", "classic", "insane"];

export const DIFFS: Record<DiffKey, DiffDef> = {
  chill: {
    key: "chill",
    label: "Chill",
    desc: "A lazy glide through the garden",
    step: 168,
    mult: 1,
    tier: 2,
    color: "#7bd88f",
  },
  classic: {
    key: "classic",
    label: "Classic",
    desc: "The true serpent trial",
    step: 118,
    mult: 2,
    tier: 4,
    color: "#c8f542",
  },
  insane: {
    key: "insane",
    label: "Insane",
    desc: "Fangs at full throttle",
    step: 82,
    mult: 3,
    tier: 6,
    color: "#ff5c4d",
  },
};

export function isOpposite(a: Vec, b: Vec): boolean {
  return a.x === -b.x && a.y === -b.y;
}

export function sameDir(a: Vec, b: Vec): boolean {
  return a.x === b.x && a.y === b.y;
}

export function initialSnake(): Vec[] {
  const y = Math.floor(ROWS / 2);
  return [8, 7, 6, 5, 4].map((x) => ({ x, y }));
}

/** Pick a random unoccupied cell, or null when the board is full. */
export function randFreeCell(occupied: Vec[]): Vec | null {
  const taken = new Set(occupied.map((c) => c.x + c.y * COLS));
  const free: Vec[] = [];
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (!taken.has(x + y * COLS)) free.push({ x, y });
    }
  }
  if (free.length === 0) return null;
  return free[Math.floor(Math.random() * free.length)];
}

type RGB = [number, number, number];

function mix3(a: RGB, b: RGB, t: number): RGB {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

const C_HEAD: RGB = [222, 255, 82];
const C_MID: RGB = [99, 214, 110];
const C_TAIL: RGB = [22, 104, 74];
const C_DEAD: RGB = [255, 92, 77];

/**
 * Body color along the snake. `frac` is 0 at the tail, 1 at the head.
 * `fade` blends everything toward coral after death.
 */
export function segColor(frac: number, fade: number): string {
  let c: RGB = frac < 0.5 ? mix3(C_TAIL, C_MID, frac * 2) : mix3(C_MID, C_HEAD, (frac - 0.5) * 2);
  if (fade > 0) c = mix3(c, C_DEAD, fade * 0.85);
  return `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
}

export const BOARD_COLORS = {
  base: "#0b231a",
  checker: "#0d2a1f",
  edge: "rgba(255, 92, 77, 0.30)",
  scene: "rgba(200, 245, 66, 0.05)",
  food: "#ff5c4d",
  foodGlow: "rgba(255, 92, 77, 0.75)",
  foodHi: "#ffd9a8",
  leaf: "#7bd88f",
  bonus: "#ffd166",
  bonusGlow: "rgba(255, 209, 102, 0.8)",
  outline: "rgba(4, 12, 8, 0.85)",
  eyeWhite: "#f4fff0",
  pupil: "#0a1d12",
  tongue: "#ff5c4d",
};
