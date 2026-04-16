// Core type definitions.  "Color tokens" are semantic so the terminal UI
// can map them to CSS classes / colors however it likes.
export type Color =
  | "default"
  | "dim"
  | "italic"
  | "muted"
  | "room-name"
  | "room-desc"
  | "exits"
  | "item"
  | "mob"
  | "npc"
  | "player"
  | "system"
  | "whisper"
  | "warning"
  | "damage"
  | "heal";

export interface Segment {
  text: string;
  color?: Color;
  bold?: boolean;
  italic?: boolean;
  dim?: boolean;
}

/** A single line of output: a sequence of colored segments. */
export type Line = Segment[];

export type Emit = (line: Line | string) => void;

export const DIR_ALIASES: Record<string, string> = {
  n: "north", s: "south", e: "east", w: "west",
  u: "up", d: "down",
  ne: "northeast", nw: "northwest", se: "southeast", sw: "southwest",
  north: "north", south: "south", east: "east", west: "west",
  up: "up", down: "down",
  northeast: "northeast", northwest: "northwest",
  southeast: "southeast", southwest: "southwest",
};

export const DIR_SHORT: Record<string, string> = {
  north: "n", south: "s", east: "e", west: "w",
  up: "u", down: "d",
  northeast: "ne", northwest: "nw",
  southeast: "se", southwest: "sw",
};

export function normalizeDir(s: string): string | null {
  return DIR_ALIASES[s.toLowerCase()] ?? null;
}

/** Build a Line from a single string — helper for the many simple cases. */
export function line(text: string, color: Color = "default", opts: { bold?: boolean; italic?: boolean; dim?: boolean } = {}): Line {
  return [{ text, color, ...opts }];
}

/** Concat multiple segments into a line. */
export function L(...segs: (Segment | string)[]): Line {
  return segs.map((s) =>
    typeof s === "string" ? { text: s, color: "default" as Color } : s,
  );
}

/** Short helpers matching the Python `ansi.py` vocabulary. */
export const seg = {
  name: (text: string): Segment => ({ text, color: "room-name", bold: true }),
  desc: (text: string): Segment => ({ text, color: "room-desc" }),
  exits: (text: string): Segment => ({ text, color: "exits" }),
  item: (text: string): Segment => ({ text, color: "item", bold: true }),
  mob: (text: string): Segment => ({ text, color: "mob" }),
  npc: (text: string): Segment => ({ text, color: "npc" }),
  player: (text: string): Segment => ({ text, color: "player" }),
  system: (text: string): Segment => ({ text, color: "system", italic: true }),
  whisper: (text: string): Segment => ({ text, color: "whisper", italic: true }),
  warning: (text: string): Segment => ({ text, color: "warning", bold: true }),
  damage: (text: string): Segment => ({ text, color: "damage", bold: true }),
  heal: (text: string): Segment => ({ text, color: "heal", bold: true }),
  muted: (text: string): Segment => ({ text, color: "muted", dim: true }),
  plain: (text: string, bold = false): Segment => ({ text, color: "default", bold }),
};
