"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { startGame, levelForXp, type GameHandle } from "@/foothills/engine";
import type { Line, Segment, Color } from "@/foothills/engine";
import { describeRoom } from "@/foothills/engine";

// Map semantic color tokens → concrete CSS colors (classic MUD palette)
const COLOR_MAP: Record<Color, string> = {
  default:    "#d4d4d4",
  dim:        "#8a8a8a",
  italic:     "#d4d4d4",
  muted:      "#8a8a8a",
  "room-name":"#f3d77a",
  "room-desc":"#d4d4d4",
  exits:      "#7dd3fc",
  item:       "#ffffff",
  mob:        "#f87171",
  npc:        "#86efac",
  player:     "#67e8f9",
  system:     "#d8b4fe",
  whisper:    "#c084fc",
  warning:    "#facc15",
  damage:     "#f87171",
  heal:       "#4ade80",
};

function segStyle(s: Segment): React.CSSProperties {
  return {
    color: COLOR_MAP[s.color ?? "default"],
    fontWeight: s.bold ? 700 : undefined,
    fontStyle: s.italic ? "italic" : undefined,
    opacity: s.dim ? 0.7 : undefined,
  };
}

function RenderLine({ line }: { line: Line | string }) {
  if (typeof line === "string") {
    return <span style={{ color: COLOR_MAP.default }}>{line}</span>;
  }
  return (
    <>
      {line.map((s, i) => (
        <span key={i} style={segStyle(s)}>
          {s.text}
        </span>
      ))}
    </>
  );
}

/** Render a prefix of the line, up to `revealed` characters. */
function RenderPartial({ line, revealed }: { line: Line | string; revealed: number }) {
  if (typeof line === "string") {
    return <span style={{ color: COLOR_MAP.default }}>{line.slice(0, revealed)}</span>;
  }
  const out: React.ReactNode[] = [];
  let remaining = revealed;
  for (let i = 0; i < line.length; i++) {
    if (remaining <= 0) break;
    const s = line[i];
    const take = Math.min(remaining, s.text.length);
    out.push(
      <span key={i} style={segStyle(s)}>
        {s.text.slice(0, take)}
      </span>,
    );
    remaining -= take;
  }
  return <>{out}</>;
}

function lineLength(line: Line | string): number {
  if (typeof line === "string") return line.length;
  return line.reduce((n, s) => n + s.text.length, 0);
}

interface LogEntry {
  id: number;
  kind: "game" | "prompt";
  line: Line | string;
}

interface TypingState {
  line: Line | string;
  revealed: number;
  total: number;
}

const BANNER_TEXT = [
  "",
  "  _____          _   _     _ _ _",
  " |  ___|__   ___| |_| |__ (_) | |___",
  " | |_ / _ \\ / _ \\ __| '_ \\| | | / __|",
  " |  _| (_) | (_) | |_| | | | | \\__ \\",
  " |_|  \\___/ \\___/ \\__|_| |_|_|_|___/",
  "",
  " A classic in the spirit of MUD1, Essex, 1978.",
  "",
];

function buildInitialLog(): LogEntry[] {
  // Banner only — welcome/first-room come through the typewriter so you
  // get the nostalgic "modem streaming the response" feel.
  const entries: LogEntry[] = [];
  let id = 0;
  for (const t of BANNER_TEXT) {
    entries.push({ id: id++, kind: "game", line: [{ text: t, color: "system" }] });
  }
  return entries;
}

export default function Terminal({ name = "Wanderer" }: { name?: string }) {
  const [log, setLog] = useState<LogEntry[]>(() => buildInitialLog());
  const [typing, setTyping] = useState<TypingState | null>(null);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number | null>(null);

  const nextId = useRef(log.length);
  const gameRef = useRef<GameHandle | null>(null);
  const firstRoomRenderedRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Typewriter state held in refs so the pump loop can read/write freely.
  const queueRef = useRef<(Line | string)[]>([]);
  const typingRef = useRef<TypingState | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);

  // ---------- Typewriter ----------

  const pushInstant = (entry: Omit<LogEntry, "id">) => {
    setLog((prev) => [...prev, { ...entry, id: nextId.current++ }]);
  };

  const enqueue = (line: Line | string) => {
    queueRef.current.push(line);
    schedulePump();
  };

  const schedulePump = () => {
    if (rafRef.current != null) return;
    lastTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(pump);
  };

  // The pump is defined as a function (not a callback) because it only reads
  // refs and state setters — both of which are stable. This keeps it simple
  // and avoids stale-closure pitfalls.
  const pump = (now: number) => {
    rafRef.current = null;
    // Clamp dt so a backgrounded tab (or slow dev-mode render frame) doesn't
    // either dump the entire queue in one tick *or* throttle us below the
    // target chars/sec. 250ms leaves plenty of headroom for React renders.
    const dt = Math.max(0, Math.min(250, now - lastTimeRef.current));
    lastTimeRef.current = now;

    const queueLen = queueRef.current.length;
    // Pacing:
    //   calm  : ~250 chars/sec  (4ms per char — the 2400-baud nostalgic feel)
    //   busy  : ~800 chars/sec  (when ≥ 4 lines queued, e.g. combat burst)
    //   flood : instant         (≥ 10 lines — don't block the user)
    const msPerChar = queueLen >= 10 ? 0 : queueLen >= 4 ? 1.25 : 4;
    let budget = msPerChar === 0 ? Number.POSITIVE_INFINITY : Math.max(1, Math.floor(dt / msPerChar));

    const committed: LogEntry[] = [];
    let current = typingRef.current;

    while (budget > 0) {
      if (!current) {
        const next = queueRef.current.shift();
        if (next === undefined) break;
        const total = lineLength(next);
        if (total === 0) {
          committed.push({ id: nextId.current++, kind: "game", line: next });
          continue;
        }
        current = { line: next, revealed: 0, total };
      }
      const reveal = Math.min(budget, current.total - current.revealed);
      current = { ...current, revealed: current.revealed + reveal };
      budget -= reveal;
      if (current.revealed >= current.total) {
        committed.push({ id: nextId.current++, kind: "game", line: current.line });
        current = null;
      }
    }

    typingRef.current = current;
    if (committed.length) setLog((l) => [...l, ...committed]);
    setTyping(current);

    if (current || queueRef.current.length > 0) {
      rafRef.current = requestAnimationFrame(pump);
    }
  };

  // ---------- Game init ----------

  useEffect(() => {
    if (gameRef.current) return;

    const emit = (line: Line | string) => enqueue(line);

    const handle = startGame(name, emit);
    gameRef.current = handle;

    if (!firstRoomRenderedRef.current) {
      // Stream the welcome + first room through the typewriter
      enqueue([{ text: `Welcome, ${name}. Type 'help' for commands.`, color: "system", italic: true }]);
      enqueue("");
      describeRoom(handle.world, handle.player).forEach((l) => enqueue(l));
      firstRoomRenderedRef.current = true;
    }

    handle.bus.on("ui.clear", () => {
      queueRef.current = [];
      typingRef.current = null;
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      setTyping(null);
      setLog([]);
    });

    // If React 19 Strict Mode cancelled an in-flight pump on the first
    // cleanup, work may still be in the queue. Make sure the pump is running.
    if (queueRef.current.length > 0 || typingRef.current) {
      schedulePump();
    }

    // Autofocus on pointer-only devices (desktop).  On touch primary,
    // we don't want the keyboard to slam up the moment the modal opens —
    // user should get a chance to read the banner + first room first.
    const isTouchPrimary =
      typeof window !== "undefined" &&
      window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    if (!isTouchPrimary) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }

    return () => {
      handle.stop();
      gameRef.current = null;
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll when content grows or typing progresses
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [log, typing]);

  const prompt = useMemo(() => {
    const p = gameRef.current?.player;
    if (!p) return "[hp 20/20 | lvl 1 | Foothills]>";
    const loc = gameRef.current!.world.rooms[p.room]?.name ?? p.room;
    return `[hp ${p.hp}/${p.maxHp} | lvl ${levelForXp(p.playerXp)} | ${loc}]>`;
  }, [log, typing]);

  // ---------- Input ----------

  const submit = async () => {
    const cmd = input;
    setInput("");
    setHistoryIdx(null);
    if (!cmd.trim()) return;
    setHistory((h) => (h[h.length - 1] === cmd ? h : [...h, cmd]).slice(-100));
    // The player's echoed command appears instantly — they typed it, the
    // modem doesn't need to "send" it to the screen.
    pushInstant({
      kind: "prompt",
      line: [
        { text: prompt, color: "player" },
        { text: " " + cmd, color: "default" },
      ],
    });
    if (cmd.trim().toLowerCase() === "clear") {
      queueRef.current = [];
      typingRef.current = null;
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      setTyping(null);
      setLog([]);
      return;
    }
    await gameRef.current?.dispatch(cmd);
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      submit();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!history.length) return;
      const idx = historyIdx === null ? history.length - 1 : Math.max(0, historyIdx - 1);
      setHistoryIdx(idx);
      setInput(history[idx]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIdx === null) return;
      const idx = historyIdx + 1;
      if (idx >= history.length) {
        setHistoryIdx(null);
        setInput("");
      } else {
        setHistoryIdx(idx);
        setInput(history[idx]);
      }
    }
  };

  // ---------- Render ----------

  const canSend = input.trim().length > 0;

  return (
    <div
      className="flex flex-col h-full w-full font-mono text-[13px] sm:text-[13px] leading-[1.5] overflow-x-hidden"
      style={{ background: "#0b0b0d", color: COLOR_MAP.default }}
    >
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden px-3 sm:px-4 py-3"
        style={{ scrollbarWidth: "thin", scrollbarColor: "#333 transparent" }}
        onClick={() => inputRef.current?.focus()}
      >
        {log.map((entry) => (
          <div key={entry.id} className="whitespace-pre-wrap break-words">
            <RenderLine line={entry.line} />
          </div>
        ))}
        {typing && (
          <div className="whitespace-pre-wrap break-words">
            <RenderPartial line={typing.line} revealed={typing.revealed} />
            <span
              aria-hidden
              className="inline-block align-baseline"
              style={{
                width: "0.55em",
                height: "1em",
                background: COLOR_MAP.default,
                marginLeft: "1px",
                animation: "foothillsCursor 1s steps(2, end) infinite",
                verticalAlign: "-0.1em",
              }}
            />
          </div>
        )}
      </div>
      {/* Input bar.  On mobile we force a 16px font size on the input
          because anything smaller triggers iOS's "zoom on focus" — which
          throws the viewport into a weird scaled state and pushes the
          prompt off-screen.  The prompt label shrinks into its own line
          above the input on narrow widths so we have room for the send
          button without clipping. */}
      <div
        className="shrink-0 border-t border-[#222]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="sm:hidden px-3 pt-2 pb-1 text-[12px] truncate" style={{ color: COLOR_MAP.player }}>
          {prompt}
        </div>
        <div className="flex items-center gap-2 px-3 sm:px-4 py-2 min-w-0">
          <span
            className="hidden sm:inline truncate"
            style={{ color: COLOR_MAP.player, whiteSpace: "pre" }}
          >
            {prompt}
          </span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            inputMode="text"
            enterKeyHint="send"
            placeholder="type a command…"
            // 16px on mobile is the iOS zoom-prevention threshold; desktop
            // keeps the compact 13px terminal look.
            className="flex-1 min-w-0 bg-transparent outline-none border-none font-mono text-[16px] sm:text-[13px] placeholder:text-[#555]"
            style={{ color: COLOR_MAP.default }}
          />
          <button
            onClick={submit}
            aria-label="Send command"
            disabled={!canSend}
            className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors"
            style={{
              background: canSend ? "rgba(125,211,252,0.22)" : "rgba(255,255,255,0.04)",
              color: canSend ? "#7dd3fc" : "#4a4a4e",
              border: `1px solid ${canSend ? "rgba(125,211,252,0.55)" : "rgba(255,255,255,0.06)"}`,
              cursor: canSend ? "pointer" : "default",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path
                d="M8 13V3M8 3L3.5 7.5M8 3L12.5 7.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
      <style jsx>{`
        @keyframes foothillsCursor {
          0%, 50% { opacity: 1; }
          50.01%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
