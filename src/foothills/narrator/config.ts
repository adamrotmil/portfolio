// Single-file configuration for the LLM fallback narrator.
//
// After you deploy workers/foothills-narrator, set this constant to your
// worker URL (ending in /narrate).  Leave as "" to disable — the game will
// use its classic static "I don't understand" messages.
//
// Special values:
//   "" (empty)    → narrator disabled (default)
//   "mock:"       → in-browser canned response, for local testing without
//                    a deployed worker.  See client.ts.
export const NARRATOR_URL = "https://foothills-narrator.adam-rotmil.workers.dev/narrate";

// Hard client-side timeout so a slow/down worker never leaves the terminal
// hanging — after this, we fall through to the static dead-end.
export const NARRATOR_TIMEOUT_MS = 4500;

// Recent lines of narrator output we include for continuity.
export const NARRATOR_RECENT_LIMIT = 6;
