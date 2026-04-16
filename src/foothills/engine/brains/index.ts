// Side-effect imports so all brains register themselves.
import "./scripted";
import "./wanderer";
import "./hostile";
import "./openclaw";

export { buildBrain } from "./base";
export type { Brain, BrainSpec } from "./base";
