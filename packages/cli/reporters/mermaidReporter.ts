import type { Report } from "../src/engine/types.js";

export function toMermaid(report: Report): string {
  const lines: string[] = [];

  lines.push("```mermaid");
  lines.push("graph LR");

  for (const edge of report.graph.edges) {
    lines.push(`  "${edge.from}" --> "${edge.to}"`);
  }

  lines.push("```");

  return lines.join("\n");
}