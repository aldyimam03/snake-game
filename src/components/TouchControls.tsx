import { DIRS, type Vec } from "../game/engine";
import { IconChevron, IconPause, IconPlay } from "./Overlays";

interface Props {
  onDir: (d: Vec) => void;
  paused: boolean;
  canPause: boolean;
  onTogglePause: () => void;
}

function PadButton({
  dir,
  onDir,
  label,
  className = "",
}: {
  dir: "up" | "down" | "left" | "right";
  onDir: (d: Vec) => void;
  label: string;
  className?: string;
}) {
  return (
    <button
      aria-label={`Steer ${dir}`}
      className={`pad-btn ${className}`}
      onPointerDown={(e) => {
        e.preventDefault();
        onDir(DIRS[dir]);
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <IconChevron dir={dir} className="h-7 w-7" />
      <span className="sr-only">{label}</span>
    </button>
  );
}

export function TouchControls({ onDir, paused, canPause, onTogglePause }: Props) {
  return (
    <div className="flex items-center justify-center gap-5">
      <div className="grid w-44 grid-cols-3 gap-2">
        <span />
        <PadButton dir="up" onDir={onDir} label="Up" />
        <span />
        <PadButton dir="left" onDir={onDir} label="Left" />
        <PadButton dir="down" onDir={onDir} label="Down" />
        <PadButton dir="right" onDir={onDir} label="Right" />
      </div>
      <button
        aria-label={paused ? "Resume game" : "Pause game"}
        className="pad-btn h-16 w-16 rounded-full text-gold"
        onPointerDown={(e) => {
          e.preventDefault();
          if (canPause) onTogglePause();
        }}
      >
        {paused ? <IconPlay className="h-6 w-6" /> : <IconPause className="h-6 w-6" />}
      </button>
    </div>
  );
}
