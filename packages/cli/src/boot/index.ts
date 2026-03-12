import type { BootGoal } from "./types.js";
import type { Report } from "../engine/types.js";
import { createBootSuggestion } from "./suggestions.js";

export async function runBoot(cwd: string, report: Report, goal: BootGoal) {
  return createBootSuggestion(cwd, report, goal);
}