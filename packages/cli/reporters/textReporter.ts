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

  lines.push("");
  lines.push("Project Classification");

  const framework = report.architecture.fingerprint.framework;
  const projectKind = report.architecture.fingerprint.projectKind;
  const profile = report.architecture.recommendation.profile;

  if (framework === "unknown" && projectKind === "backend") {
    lines.push("Detected: No specific Next/Vite/Node framework detected.");
    lines.push("Evaluation: generic backend.");
    lines.push("Suggested preset: backend-modular-monolith.");
  } else {
    lines.push(`Framework: ${framework}`);
    if (report.architecture.fingerprint.router) {
      lines.push(`Router: ${report.architecture.fingerprint.router}`);
    }
    lines.push(`Project type: ${projectKind}`);
    lines.push(`Confidence: ${Math.round(report.architecture.fingerprint.confidence * 100)}%`);
    lines.push(`Suggested preset: ${profile}`);
  }

  lines.push("");
  lines.push("Recommended Architecture");
  lines.push(`Profile: ${report.architecture.recommendation.profile}`);
  lines.push(`Layers: ${report.architecture.recommendation.recommendedLayers.join(", ")}`);
  lines.push(`Description: ${report.architecture.recommendation.description}`);

  lines.push("");
  lines.push("Suggested rule preset");
  lines.push(`archlens init-rules --preset ${report.architecture.recommendation.profile}`);

  lines.push("");
  lines.push("Architecture Rules");
  lines.push(`Violations: ${report.rules.total}`);

  for (const violation of report.rules.violations) {
    lines.push(
      `- [${violation.ruleName}] ${violation.from} -> ${violation.to}`,
    );
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

  lines.push("<h2>Project Classification</h2>");
  lines.push(`<p>Framework: ${report.architecture.fingerprint.framework}</p>`);
  if (report.architecture.fingerprint.router) {
    lines.push(`<p>Router: ${report.architecture.fingerprint.router}</p>`);
  }
  lines.push(`<p>Project type: ${report.architecture.fingerprint.projectKind}</p>`);
  lines.push(
    `<p>Confidence: ${Math.round(report.architecture.fingerprint.confidence * 100)}%</p>`,
  );

  lines.push("<h2>Recommended Architecture</h2>");
  lines.push(`<p>Profile: ${report.architecture.recommendation.profile}</p>`);
  lines.push(
    `<p>Layers: ${report.architecture.recommendation.recommendedLayers.join(", ")}</p>`,
  );
  lines.push(
    `<p>Description: ${report.architecture.recommendation.description}</p>`,
  );
  lines.push("<p>Suggested rule preset: <code>archlens init-rules --preset " + report.architecture.recommendation.profile + "</code></p>");

  lines.push("<h2>Architecture Rules</h2>");
  lines.push(`<p>Violations: ${report.rules.total}</p>`);
  if (report.rules.violations.length) {
    lines.push("<ul>");
    for (const violation of report.rules.violations) {
      lines.push(
        `<li><strong>${violation.ruleName}</strong>: ${violation.from} → ${violation.to}</li>`,
      );
    }
    lines.push("</ul>");
  }

  lines.push("</body>");
  lines.push("</html>");
  return lines.join("\n");
}
