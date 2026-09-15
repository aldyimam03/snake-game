import { useEffect, useState, type CSSProperties } from "react";
import { useSnakeGame } from "./game/useSnakeGame";
import { DIFFS } from "./game/engine";
import {
  CountdownOverlay,
  GameOverOverlay,
  IconApple,
  IconOrb,
  IconPause,
  IconPlay,
  IconRestart,
  IconSnakeMark,
  IconSpeaker,
  IconStar,
  IconTrophy,
  MenuOverlay,
  PauseOverlay,
  type GameActions,
} from "./components/Overlays";
import { TouchControls } from "./components/TouchControls";
import type { UiState } from "./game/useSnakeGame";

/* --------------------------- ambient layer --------------------------- */

const FIREFLIES = [
  { l: "7%", t: "24%", s: 5, c: "#c8f542", dur: 12, delay: 0, dx: 34, dy: -52, op: 0.45 },
  { l: "16%", t: "68%", s: 4, c: "#ffd166", dur: 14, delay: 2.2, dx: -26, dy: -60, op: 0.4 },
  { l: "28%", t: "14%", s: 3, c: "#7bd88f", dur: 10, delay: 1.1, dx: 22, dy: -34, op: 0.5 },
  { l: "44%", t: "82%", s: 5, c: "#c8f542", dur: 16, delay: 3.4, dx: 40, dy: -70, op: 0.35 },
  { l: "58%", t: "10%", s: 4, c: "#ffd166", dur: 11, delay: 0.7, dx: -30, dy: -40, op: 0.45 },
  { l: "71%", t: "60%", s: 3, c: "#c8f542", dur: 13, delay: 4.1, dx: 26, dy: -56, op: 0.4 },
  { l: "84%", t: "30%", s: 5, c: "#7bd88f", dur: 15, delay: 1.8, dx: -36, dy: -48, op: 0.38 },
  { l: "92%", t: "74%", s: 4, c: "#ffd166", dur: 12, delay: 2.9, dx: -24, dy: -64, op: 0.42 },
  { l: "36%", t: "44%", s: 3, c: "#c8f542", dur: 17, delay: 5.2, dx: 30, dy: -44, op: 0.3 },
  { l: "64%", t: "88%", s: 4, c: "#7bd88f", dur: 14, delay: 6.0, dx: -20, dy: -58, op: 0.36 },
];

function Ambient() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(191,232,210,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(191,232,210,0.035) 1px, transparent 1px)",
          backgroundSize: "46px 46px",
          maskImage: "radial-gradient(120% 90% at 50% 40%, black 40%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(120% 90% at 50% 40%, black 40%, transparent 100%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 42% at 50% -6%, rgba(200,245,66,0.10), transparent 70%), radial-gradient(50% 40% at 88% 108%, rgba(255,209,102,0.06), transparent 70%), radial-gradient(46% 36% at 6% 104%, rgba(123,216,143,0.07), transparent 70%)",
        }}
      />
      {FIREFLIES.map((f, i) => (
        <span
          key={i}
          className="firefly"
          style={
            {
              left: f.l,
              top: f.t,
              width: f.s,
              height: f.s,
              background: f.c,
              boxShadow: `0 0 ${f.s * 2.4}px ${f.c}`,
              "--dur": `${f.dur}s`,
              "--delay": `${f.delay}s`,
              "--dx": `${f.dx}px`,
              "--dy": `${f.dy}px`,
              "--op": f.op,
            } as CSSProperties
          }
        />
      ))}
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(140% 110% at 50% 45%, transparent 55%, rgba(2,8,5,0.75) 100%)" }}
      />
    </div>
  );
}

/* ------------------------------ panels ------------------------------ */

function SpeedMeter({ level }: { level: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 10 }, (_, i) => {
        const on = i < level;
        const color = i < 5 ? "#c8f542" : i < 8 ? "#ffd166" : "#ff5c4d";
        return (
          <span
            key={i}
            className="h-3 flex-1 rounded-[3px] transition-all duration-300"
            style={{
              background: on ? color : "rgba(30,64,48,0.55)",
              boxShadow: on ? `0 0 8px ${color}55` : "none",
              transform: on ? "scaleY(1)" : "scaleY(0.72)",
            }}
          />
        );
      })}
    </div>
  );
}

function StatPanel({ ui }: { ui: UiState }) {
  const diff = DIFFS[ui.difficulty];
  return (
    <div className="flex flex-col gap-3">
      <section className="panel p-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[10px] font-bold tracking-[0.28em] text-mint/55">SCORE</h2>
          <span className="rounded border border-line px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-mint/60">
            x{diff.mult}
          </span>
        </div>
        <p className="font-pixel mt-2 text-[26px] leading-none text-gold" style={{ textShadow: "0 0 18px rgba(255,209,102,0.35)" }}>
          {ui.score}
        </p>
        {ui.newBestLive ? (
          <p className="font-pixel animate-blink mt-2 text-[8px] text-lime">ABOVE BEST!</p>
        ) : (
          <p className="mt-2 text-[10px] tracking-widest text-mint/40">{ui.foods} APPLES EATEN</p>
        )}
      </section>

      <section className="panel p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[10px] font-bold tracking-[0.28em] text-mint/55">BEST</h2>
          <span
            className="rounded px-1.5 py-0.5 font-pixel text-[8px]"
            style={{ color: diff.color, border: `1px solid ${diff.color}55`, background: `${diff.color}14` }}
          >
            {diff.label.toUpperCase()}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-2.5">
          <IconTrophy className="h-5 w-5 text-gold" />
          <p className="font-pixel text-lg leading-none text-mint">{ui.best}</p>
          {ui.newBestLive && <IconStar className="h-4 w-4 animate-blink text-gold" />}
        </div>
      </section>

      <section className="panel p-4">
        <h2 className="text-[10px] font-bold tracking-[0.28em] text-mint/55">SERPENT</h2>
        <div className="mt-2.5 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-mint/70">Length</span>
          <span className="font-pixel text-[13px] text-lime">{ui.length}</span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-mint/70">Speed</span>
          <span className="font-pixel text-[10px] text-mint/60">{ui.speedLevel}/10</span>
        </div>
        <div className="mt-1.5">
          <SpeedMeter level={ui.speedLevel} />
        </div>
      </section>
    </div>
  );
}

function HelpPanel() {
  return (
    <div className="flex flex-col gap-3">
      <section className="panel p-4">
        <h2 className="text-[10px] font-bold tracking-[0.28em] text-mint/55">CONTROLS</h2>
        <ul className="mt-3 flex flex-col gap-2.5 text-[12px] text-mint/75">
          <li className="flex items-center justify-between gap-2">
            <span>Steer</span>
            <span className="flex gap-1">
              <span className="keycap">W</span><span className="keycap">A</span>
              <span className="keycap">S</span><span className="keycap">D</span>
            </span>
          </li>
          <li className="flex items-center justify-between gap-2">
            <span>Pause</span>
            <span className="flex gap-1"><span className="keycap">SPACE</span><span className="keycap">P</span></span>
          </li>
          <li className="flex items-center justify-between gap-2">
            <span>Restart</span>
            <span className="keycap">R</span>
          </li>
          <li className="flex items-center justify-between gap-2">
            <span>Sound</span>
            <span className="keycap">M</span>
          </li>
          <li className="flex items-center justify-between gap-2">
            <span>Menu</span>
            <span className="keycap">ESC</span>
          </li>
        </ul>
        <p className="mt-3 border-t border-line pt-2.5 text-[11px] leading-relaxed text-mint/45">
          On touch screens: swipe across the pit or use the pad.
        </p>
      </section>

      <section className="panel p-4">
        <h2 className="text-[10px] font-bold tracking-[0.28em] text-mint/55">PIT RULES</h2>
        <ul className="mt-3 flex flex-col gap-3 text-[12px] text-mint/75">
          <li className="flex items-center gap-3">
            <IconApple className="h-6 w-6 shrink-0" />
            <span>Apple — grows you one segment, scores points.</span>
          </li>
          <li className="flex items-center gap-3">
            <IconOrb className="h-6 w-6 shrink-0" />
            <span>Golden orb — every 5th apple, big bonus before the ring runs out.</span>
          </li>
          <li className="flex items-center gap-3">
            <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="none" stroke="#ff5c4d" strokeWidth="2" strokeLinecap="round">
              <rect x="4" y="4" width="16" height="16" rx="3" />
              <path d="M9 9l6 6M15 9l-6 6" />
            </svg>
            <span>Walls and your own tail end the run. Speed climbs as you eat.</span>
          </li>
        </ul>
      </section>

      <p className="px-1 text-center text-[10px] tracking-[0.22em] text-mint/35">
        AUTO-PAUSES WHEN THE TAB HIDES
      </p>
    </div>
  );
}

/* -------------------------------- app -------------------------------- */

export default function App() {
  const { canvasRef, boardRef, ui, actions } = useSnakeGame();
  const [coarse, setCoarse] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const on = () => setCoarse(mq.matches);
    on();
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);

  const allTimeBest = Math.max(ui.bests.chill, ui.bests.classic, ui.bests.insane);
  const acts: GameActions = {
    start: actions.start,
    pause: actions.pause,
    resume: actions.resume,
    togglePause: actions.togglePause,
    toMenu: actions.toMenu,
    setDifficulty: actions.setDifficulty,
    toggleMute: actions.toggleMute,
  };
  const inRun = ui.phase === "playing" || ui.phase === "paused" || ui.phase === "countdown";

  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-hidden font-body">
      <Ambient />

      {/* ------------------------------ header ------------------------------ */}
      <header className="relative z-10 border-b border-line/70 bg-[rgba(6,19,14,0.72)] backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-3 py-3 sm:px-5">
          <div className="flex items-center gap-3">
            <IconSnakeMark className="h-9 w-9 drop-shadow-[0_0_10px_rgba(200,245,66,0.35)]" />
            <div>
              <h1 className="font-pixel text-[15px] leading-none text-lime sm:text-lg" style={{ textShadow: "0 0 16px rgba(200,245,66,0.4)" }}>
                SERPENTINE
              </h1>
              <p className="mt-1 text-[9px] font-semibold tracking-[0.4em] text-mint/50">NEON SNAKE ARCADE</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="chip-btn" style={{ cursor: "default" }}>
              <IconTrophy className="h-4 w-4 text-gold" />
              <span className="hidden sm:inline text-mint/60">All-time</span>
              <span className="font-pixel text-[10px] text-gold">{allTimeBest}</span>
            </div>
            <button
              onClick={actions.toggleMute}
              className="chip-btn"
              aria-label={ui.muted ? "Unmute sound" : "Mute sound"}
              title={ui.muted ? "Unmute (M)" : "Mute (M)"}
            >
              <IconSpeaker muted={ui.muted} className="h-4 w-4" />
              <span className="hidden text-mint/60 sm:inline">{ui.muted ? "Off" : "On"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ------------------------------- main ------------------------------- */}
      <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-3 pb-8 pt-4 sm:px-5 lg:pt-6">
        <div className="lg:grid lg:grid-cols-[236px_minmax(0,1fr)_236px] lg:items-start lg:gap-5">
          <aside className="hidden lg:block">
            <StatPanel ui={ui} />
          </aside>

          <section className="flex flex-col items-center">
            {/* mobile HUD */}
            <div className="mb-3 flex w-[min(92vw,52vh,34rem)] items-stretch gap-2 lg:hidden">
              <div className="panel flex flex-1 items-center justify-between px-3.5 py-2">
                <div>
                  <p className="text-[8px] font-bold tracking-[0.24em] text-mint/50">SCORE</p>
                  <p className="font-pixel mt-0.5 text-[15px] leading-none text-gold">{ui.score}</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-bold tracking-[0.24em] text-mint/50">BEST</p>
                  <p className="font-pixel mt-0.5 text-[15px] leading-none text-mint">{ui.best}</p>
                </div>
              </div>
              <button
                onClick={actions.togglePause}
                disabled={!inRun || ui.phase === "countdown"}
                className="chip-btn px-3.5 disabled:opacity-40"
                aria-label="Pause or resume"
              >
                {ui.phase === "paused" ? <IconPlay className="h-4 w-4 text-lime" /> : <IconPause className="h-4 w-4 text-gold" />}
              </button>
              <button
                onClick={() => inRun && actions.start()}
                disabled={!inRun}
                className="chip-btn px-3.5 disabled:opacity-40"
                aria-label="Restart run"
              >
                <IconRestart className="h-4 w-4 text-coral" />
              </button>
            </div>

            {/* cabinet bezel + board */}
            <div className="bezel relative w-[min(92vw,52vh,34rem)] rounded-xl p-2 sm:p-2.5 lg:w-[min(54vw,76vh,40rem)]">
              <span className="screw left-1.5 top-1.5" />
              <span className="screw right-1.5 top-1.5" />
              <span className="screw bottom-1.5 left-1.5" />
              <span className="screw bottom-1.5 right-1.5" />
              <div
                ref={boardRef}
                className="relative aspect-square touch-none select-none overflow-hidden rounded-lg"
              >
                <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
                <div className="scanlines pointer-events-none absolute inset-0 z-10" />
                <div className="board-vignette pointer-events-none absolute inset-0 z-10" />

                {ui.phase === "menu" && <MenuOverlay ui={ui} actions={acts} />}
                {ui.phase === "countdown" && <CountdownOverlay value={ui.countdown} />}
                {ui.phase === "paused" && <PauseOverlay actions={acts} />}
                {ui.phase === "over" && <GameOverOverlay ui={ui} actions={acts} />}
              </div>
            </div>

            {/* under-board strip */}
            <div className="mt-3 flex w-[min(92vw,52vh,34rem)] items-center justify-between gap-3 lg:w-[min(54vw,76vh,40rem)]">
              <p className="animate-float-hint text-[11px] font-medium text-mint/50">
                {coarse ? "Swipe the pit to steer" : "Arrows / WASD to steer"}
              </p>
              <div className="flex items-center gap-2 text-[11px] text-mint/45">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: DIFFS[ui.difficulty].color, boxShadow: `0 0 8px ${DIFFS[ui.difficulty].color}` }}
                />
                <span className="font-pixel text-[8px]">{DIFFS[ui.difficulty].label.toUpperCase()}</span>
                <span className="text-mint/30">|</span>
                <span className="font-pixel text-[8px]">LEN {ui.length}</span>
              </div>
            </div>

            {/* touch d-pad */}
            {coarse && (
              <div className="mt-4">
                <TouchControls
                  onDir={actions.pushDir}
                  paused={ui.phase === "paused"}
                  canPause={inRun && ui.phase !== "countdown"}
                  onTogglePause={actions.togglePause}
                />
              </div>
            )}
          </section>

          <aside className="hidden lg:block">
            <HelpPanel />
          </aside>
        </div>
      </main>

      {/* ------------------------------ footer ------------------------------ */}
      <footer className="relative z-10 border-t border-line/60 py-3">
        <p className="text-center text-[10px] tracking-[0.26em] text-mint/35">
          EAT &middot; GROW &middot; DON&rsquo;T BITE YOURSELF &mdash; A CANVAS ARCADE TOY
        </p>
      </footer>
    </div>
  );
}
