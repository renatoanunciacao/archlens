import type { Report } from "../src/engine/types.js";

export function toText(report: Report): string {
  const lines: string[] = [];

  lines.push("✅ Analysis complete");
  lines.push(`Project: ${report.meta.projectName}`);
  lines.push(`Files analyzed: ${report.meta.fileCount}`);
  lines.push(`Dependencies: ${report.graph.edges.length}`);
  lines.push("");

  lines.push(
    `Architecture Health Score: ${report.score.value}/100 (${report.score.grade})`
  );
  lines.push(`Status: ${report.score.status}`);
  lines.push("");

  lines.push("Top Fan-in (critical modules):");
  for (const item of report.metrics.topFanIn) {
    lines.push(`  - ${item.fanIn} in | ${item.fanOut} out | ${item.file}`);
  }

  lines.push("");
  lines.push("Top Fan-out (unstable modules):");
  for (const item of report.metrics.topFanOut) {
    lines.push(`  - ${item.fanIn} in | ${item.fanOut} out | ${item.file}`);
  }

  lines.push("");
  lines.push("Coupling hotspots:");
  for (const item of report.metrics.danger) {
    lines.push(`  - ${item.fanIn} in | ${item.fanOut} out | ${item.file}`);
  }

  lines.push("");
  lines.push(`Cycles detected: ${report.cycles.length}`);

  for (const cycle of report.cycles) {
    lines.push(`  - ${cycle.id}: ${cycle.nodes.join(" -> ")}`);
  }

  return lines.join("\n");
}