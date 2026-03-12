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


export function explainScore(report: Report): string {
  const lines: string[] = [];
  lines.push("# Architecture Score Breakdown");
  lines.push("");
  lines.push(`Current Score: ${report.score}`);
  lines.push("");
  lines.push("## Factors");
  lines.push("- Coupling: affects score negatively");
  lines.push("- Cycles: critical issues reduce score");
  lines.push("- Dependencies: well-organized imports increase score");
  return lines.join("\n");
}



export function toHtml(report: Report): string {
  const lines: string[] = [];
  lines.push("<!DOCTYPE html>");
  lines.push("<html>");
  lines.push("<head>");
  lines.push("<title>ArchLens Report</title>");
  lines.push("</head>");
  lines.push("<body>");
  lines.push("<h1>Architecture Report</h1>");
  lines.push(`<p>Score: ${report.score}</p>`);
  lines.push(`<p>Cycles: ${report.cycles.length}</p>`);
  lines.push("</body>");
  lines.push("</html>");
  return lines.join("\n");
}
