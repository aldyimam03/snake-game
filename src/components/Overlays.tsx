import type { ReactNode } from "react";
import { DIFFS, DIFF_ORDER, type DiffKey } from "../game/engine";
import type { UiState } from "../game/useSnakeGame";

export interface GameActions {
  start: (d?: DiffKey) => void;
  pause: () => void;
  resume: () => void;
  togglePause: () => void;
  toMenu: () => void;
  setDifficulty: (d: DiffKey) => void;
  toggleMute: () => void;
}

/* ----------------------------- icons ----------------------------- */

const svgProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const IconPlay = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M7 4.5v15l13-7.5z" />
  </svg>
);

export const IconPause = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <rect x="6" y="4" width="4" height="16" rx="1.2" />
    <rect x="14" y="4" width="4" height="16" rx="1.2" />
  </svg>
);

export const IconRestart = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg {...svgProps} className={className}>
    <path d="M3 3v5h5" />
    <path d="M3.05 13a9 9 0 1 0 .5-5.5L3 8" />
  </svg>
);

export const IconHome = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg {...svgProps} className={className}>
    <path d="M3 11.5 12 4l9 7.5" />
    <path d="M5.5 10.5V20h13v-9.5" />
  </svg>
);

export const IconStar = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" />
  </svg>
);

export const IconSpeaker = ({ muted, className = "h-4 w-4" }: { muted: boolean; className?: string }) => (
  <svg {...svgProps} className={className}>
    <path d="M11 5 6.5 9H3v6h3.5L11 19z" fill="currentColor" stroke="none" />
    {muted ? (
      <>
        <path d="M16 9.5l5 5" />
        <path d="M21 9.5l-5 5" />
      </>
    ) : (
      <>
        <path d="M15.5 9.2a4 4 0 0 1 0 5.6" />
        <path d="M18.3 6.6a8 8 0 0 1 0 10.8" />
      </>
    )}
  </svg>
);

export const IconChevron = ({ dir, className = "h-7 w-7" }: { dir: "up" | "down" | "left" | "right"; className?: string }) => {
  const rot = { up: 0, right: 90, down: 180, left: 270 }[dir];
  return (
    <svg {...svgProps} strokeWidth={3} className={className} style={{ transform: `rotate(${rot}deg)` }}>
      <path d="m5 15 7-7 7 7" />
    </svg>
  );
};

export const IconTrophy = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg {...svgProps} className={className}>
    <path d="M8 21h8" />
    <path d="M12 17v4" />
    <path d="M7 4h10v5a5 5 0 0 1-10 0z" />
    <path d="M7 6H4a3 3 0 0 0 3 4.5" />
    <path d="M17 6h3a3 3 0 0 1-3 4.5" />
  </svg>
);

export const IconApple = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path
      d="M12 7.5c-1.2-1.4-3.2-1.8-4.9-.8-2.3 1.3-3 4.6-1.6 8 1.2 3 3.3 5.3 5.2 5.3.5 0 1-.2 1.3-.4.3.2.8.4 1.3.4 1.9 0 4-2.3 5.2-5.3 1.4-3.4.7-6.7-1.6-8-1.7-1-3.7-.6-4.9.8z"
      fill="#ff5c4d"
    />
    <path d="M12 7.5c0-2 1-3.5 3-4" stroke="#7bd88f" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    <ellipse cx="14.6" cy="4.6" rx="2" ry="1" fill="#7bd88f" transform="rotate(-24 14.6 4.6)" />
  </svg>
);

export const IconOrb = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <circle cx="12" cy="12" r="5.2" fill="#ffd166" />
    <circle cx="10.4" cy="10.4" r="1.4" fill="#fff3c4" />
    <circle cx="12" cy="12" r="8.2" fill="none" stroke="#ffd166" strokeWidth="1.6" strokeDasharray="4 3" strokeLinecap="round" />
  </svg>
);

export const IconSnakeMark = ({ className = "h-8 w-8" }: { className?: string }) => (
  <svg viewBox="0 0 40 40" className={className} fill="none">
    <path d="M8 28c0-8 9-7.5 12.5-5.5S32 24 32 14" stroke="#c8f542" strokeWidth="6" strokeLinecap="round" />
    <circle cx="32" cy="13" r="4.6" fill="#c8f542" />
    <circle cx="33.6" cy="11.8" r="1.25" fill="#07130c" />
    <path d="M36.2 14.2 40 16m-3.8-1.8 2.6 3" stroke="#ff5c4d" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

/* --------------------------- countdown --------------------------- */

export function CountdownOverlay({ value }: { value: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center rounded-lg bg-[rgba(4,13,9,0.35)]">
      <p className="font-pixel text-[10px] tracking-widest text-mint/80 mb-4">GET READY</p>
      <div key={value} className="animate-pop font-pixel text-6xl sm:text-7xl text-gold logo-shadow">
        {value}
      </div>
    </div>
  );
}

/* ------------------------------ menu ------------------------------ */

const PIPS: Record<DiffKey, number> = { chill: 2, classic: 3, insane: 5 };

function DiffCard({
  diffKey,
  selected,
  best,
  onPick,
  delay,
}: {
  diffKey: DiffKey;
  selected: boolean;
  best: number;
  onPick: () => void;
  delay: number;
}) {
  const d = DIFFS[diffKey];
  return (
    <button
      onClick={onPick}
      className="animate-card-in group flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all duration-150"
      style={{
        animationDelay: `${delay}ms`,
        borderColor: selected ? d.color : "var(--color-line)",
        background: selected ? "rgba(200,245,66,0.07)" : "rgba(10,29,21,0.72)",
        boxShadow: selected ? `0 0 22px -6px ${d.color}66, inset 0 0 0 1px ${d.color}44` : "none",
      }}
    >
      <span
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors"
        style={{ borderColor: selected ? d.color : "var(--color-linehi)" }}
      >
        {selected && <span className="h-1.5 w-1.5 rounded-full" style={{ background: d.color }} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="font-pixel text-[11px]" style={{ color: selected ? d.color : "var(--color-mint)" }}>
            {d.label.toUpperCase()}
          </span>
          <span className="rounded border border-line px-1 py-px text-[9px] font-bold tracking-wider text-mint/60">
            x{d.mult} PTS
          </span>
        </span>
        <span className="mt-1 block truncate text-[11px] text-mint/55">{d.desc}</span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-1">
        <span className="flex gap-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full transition-colors"
              style={{ background: i < PIPS[diffKey] ? d.color : "rgba(42,82,64,0.7)" }}
            />
          ))}
        </span>
        <span className="font-pixel text-[8px] text-mint/50">
          BEST {best > 0 ? best : "--"}
        </span>
      </span>
    </button>
  );
}

export function MenuOverlay({ ui, actions }: { ui: UiState; actions: GameActions }) {
  return (
    <div className="overlay animate-overlay-in fixed z-40 rounded-none lg:absolute lg:z-20 lg:rounded-lg">
      <div className="my-auto w-full max-w-sm text-center">
        <p className="font-pixel animate-card-in text-[9px] tracking-[0.3em] text-gold">
          INSERT COIN<span className="animate-blink text-lime">_</span>
        </p>
        <h1 className="font-pixel logo-shadow animate-card-in mt-3 text-[26px] leading-tight text-lime sm:text-4xl" style={{ animationDelay: "60ms" }}>
          SERPENTINE
        </h1>
        <p className="animate-card-in mt-2 text-[11px] font-semibold tracking-[0.42em] text-mint/60" style={{ animationDelay: "120ms" }}>
          NEON SNAKE ARCADE
        </p>

        <div className="mt-6 flex flex-col gap-2 text-left">
          {DIFF_ORDER.map((k, i) => (
            <DiffCard
              key={k}
              diffKey={k}
              delay={180 + i * 70}
              selected={ui.difficulty === k}
              best={ui.bests[k]}
              onPick={() => actions.setDifficulty(k)}
            />
          ))}
        </div>

        <button
          onClick={() => actions.start()}
          className="btn-arcade animate-card-in mt-5 w-full"
          style={{ animationDelay: "420ms" }}
        >
          <IconPlay className="h-3.5 w-3.5" />
          START RUN
        </button>

        <p className="animate-card-in mt-4 text-[11px] leading-relaxed text-mint/50" style={{ animationDelay: "500ms" }}>
          <span className="keycap">ENTER</span> start &nbsp;&middot;&nbsp; <span className="keycap">1</span>{" "}
          <span className="keycap">2</span> <span className="keycap">3</span> difficulty
          <br />
          steer with <span className="keycap">WASD</span> / arrows / swipe
        </p>
      </div>
    </div>
  );
}

/* ------------------------------ pause ------------------------------ */

export function PauseOverlay({ actions }: { actions: GameActions }) {
  return (
    <div className="overlay animate-overlay-in fixed z-40 rounded-none lg:absolute lg:z-20 lg:rounded-lg">
      <div className="animate-card-in my-auto w-full max-w-xs text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-linehi bg-panel text-gold">
          <IconPause className="h-5 w-5" />
        </div>
        <h2 className="font-pixel logo-shadow text-xl text-mint">PAUSED</h2>
        <p className="mt-2 text-[11px] tracking-[0.3em] text-mint/50">THE SERPENT WAITS</p>
        <div className="mt-6 flex flex-col gap-2.5">
          <button onClick={actions.resume} className="btn-arcade w-full">
            <IconPlay className="h-3.5 w-3.5" />
            RESUME
          </button>
          <button onClick={() => actions.start()} className="btn-arcade btn-arcade--ghost w-full">
            <IconRestart className="h-3.5 w-3.5" />
            RESTART
          </button>
          <button onClick={actions.toMenu} className="btn-arcade btn-arcade--ghost w-full">
            <IconHome className="h-3.5 w-3.5" />
            MAIN MENU
          </button>
        </div>
        <p className="mt-4 text-[11px] text-mint/45">
          <span className="keycap">SPACE</span> resume &nbsp;&middot;&nbsp; <span className="keycap">R</span> restart
        </p>
      </div>
    </div>
  );
}

/* ---------------------------- game over ---------------------------- */

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-line bg-[rgba(10,29,21,0.7)] px-3 py-2.5">
      <p className="text-[9px] font-bold tracking-[0.22em] text-mint/50">{label}</p>
      <p className="font-pixel mt-1.5 text-[13px] text-mint">{children}</p>
    </div>
  );
}

export function GameOverOverlay({ ui, actions }: { ui: UiState; actions: GameActions }) {
  return (
    <div className="overlay animate-overlay-in fixed z-40 rounded-none lg:absolute lg:z-20 lg:rounded-lg">
      <div className="animate-card-in my-auto w-full max-w-sm text-center">
        <h2 className="font-pixel gameover-shadow text-2xl text-coral sm:text-3xl">GAME OVER</h2>

        {ui.newBest ? (
          <div className="animate-badge mx-auto mt-4 inline-flex items-center gap-2 rounded-md border border-gold/60 bg-gold px-3 py-1.5 text-[#241503]">
            <IconStar className="h-3.5 w-3.5" />
            <span className="font-pixel text-[9px]">NEW BEST SCORE</span>
            <IconStar className="h-3.5 w-3.5" />
          </div>
        ) : (
          <p className="mt-3 text-[11px] tracking-[0.3em] text-mint/50">
            {DIFFS[ui.difficulty].label.toUpperCase()} RUN COMPLETE
          </p>
        )}

        <p className="font-pixel mt-5 text-[10px] text-mint/60">SCORE</p>
        <p className="font-pixel logo-shadow mt-1 text-4xl text-gold sm:text-5xl">{ui.score}</p>

        <div className="mt-5 grid grid-cols-3 gap-2 text-left">
          <Stat label="BEST">{ui.best}</Stat>
          <Stat label="LENGTH">{ui.length}</Stat>
          <Stat label="TIME">{ui.timeSec}s</Stat>
        </div>

        <div className="mt-5 flex flex-col gap-2.5">
          <button onClick={() => actions.start()} className="btn-arcade w-full">
            <IconRestart className="h-3.5 w-3.5" />
            PLAY AGAIN
          </button>
          <button onClick={actions.toMenu} className="btn-arcade btn-arcade--ghost w-full">
            <IconHome className="h-3.5 w-3.5" />
            CHANGE DIFFICULTY
          </button>
        </div>

        <p className="mt-4 text-[11px] text-mint/45">
          <span className="keycap">ENTER</span> retry &nbsp;&middot;&nbsp; <span className="keycap">ESC</span> menu
        </p>
      </div>
    </div>
  );
}
