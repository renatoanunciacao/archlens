import type { Report } from "../src/engine/types.js";

export function toJson(report: Report): string {
  return JSON.stringify(report, null, 2);
}