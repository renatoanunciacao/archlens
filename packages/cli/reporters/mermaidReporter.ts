import type { Report } from "../src/engine/types.js";

export type MermaidGraphType = "cycles" | "danger" | "score";

const safeId = (value: string) =>
  value.replace(/[^a-zA-Z0-9_]/g, "_").replace(/^(\d)/, "_$1");

const short = (value: string, max = 40) => {
  if (value.length <= max) return value;
  return `...${value.slice(-(max - 3))}`;
};

const header = (title: string) =>
  [
    "---",
    "config:",
    "  layout: dagre",
    "---",
    "flowchart LR",
    `%% ${title}`,
    "",
  ].join("\n");

const getScoreValue = (report: Report): number => {
  const raw = report.score as unknown as Record<string, unknown>;

  if (typeof report.score === "number") return report.score;

  if (typeof raw.value === "number") return raw.value;
  if (typeof raw.score === "number") return raw.score;
  if (typeof raw.healthScore === "number") return raw.healthScore;
  if (typeof raw.total === "number") return raw.total;

  return 0;
};

function toScoreMermaid(report: Report): string {
  const score = getScoreValue(report);

  const status =
    score >= 90
      ? "Excellent"
      : score >= 75
        ? "Good"
        : score >= 60
          ? "Warning"
          : "Critical";

  return [
    header("score"),
    `score["Architecture Health Score\\n${score}/100\\n${status}"]`,
  ].join("\n");
}

function toCyclesMermaid(report: Report): string {
  const cycles = report.cycles ?? [];

  if (!cycles.length) {
    return [header("cycles"), 'empty["No cycles found"]'].join("\n");
  }

  const lines: string[] = [header("cycles")];

  cycles.forEach((cycle, cycleIndex) => {
    const nodes = Array.isArray(cycle)
      ? cycle
      : ((cycle as unknown as { path?: string[]; nodes?: string[] }).path ??
        (cycle as unknown as { path?: string[]; nodes?: string[] }).nodes ??
        []);

    if (!nodes.length) return;

    lines.push(`subgraph cycle_${cycleIndex}["Cycle ${cycleIndex + 1}"]`);

    nodes.forEach((node, nodeIndex) => {
      const id = safeId(`cycle_${cycleIndex}_${nodeIndex}_${node}`);
      lines.push(`  ${id}["${short(node)}"]`);
    });

    lines.push("end");

    for (let i = 0; i < nodes.length; i++) {
      const current = safeId(`cycle_${cycleIndex}_${i}_${nodes[i]}`);
      const next = safeId(
        `cycle_${cycleIndex}_${(i + 1) % nodes.length}_${nodes[(i + 1) % nodes.length]}`,
      );
      lines.push(`${current} --> ${next}`);
    }

    lines.push("");
  });

  return lines.join("\n");
}

function toDangerMermaid(report: Report): string {
  const dangerList = report.metrics?.danger ?? [];

  if (!dangerList.length) {
    return [header("danger"), 'empty["No danger hotspots found"]'].join("\n");
  }

  const lines: string[] = [header("danger"), 'root["Top danger hotspots"]'];

  dangerList.slice(0, 10).forEach((item, index) => {
    const metric = item as unknown as Record<string, unknown>;

    const file =
      typeof metric.file === "string"
        ? metric.file
        : typeof metric.id === "string"
          ? metric.id
          : typeof metric.path === "string"
            ? metric.path
            : `node_${index}`;

    const fanIn =
      typeof metric.fanIn === "number"
        ? metric.fanIn
        : typeof metric["fanInCount"] === "number"
          ? (metric["fanInCount"] as number)
          : 0;

    const fanOut =
      typeof metric.fanOut === "number"
        ? metric.fanOut
        : typeof metric["fanOutCount"] === "number"
          ? (metric["fanOutCount"] as number)
          : 0;

    const danger =
      typeof metric.danger === "number" ? metric.danger : fanIn * fanOut;

    const id = safeId(`danger_${index}_${file}`);
    const label = `${short(file)}\\nfanIn:${fanIn} fanOut:${fanOut}\\ndanger:${danger}`;

    lines.push(`${id}["${label}"]`);
    lines.push(`root --> ${id}`);
  });

  return lines.join("\n");
}

export function toMermaid(
  report: Report,
  graphType: MermaidGraphType = "cycles",
): string {
  if (graphType === "score") return toScoreMermaid(report);
  if (graphType === "danger") return toDangerMermaid(report);
  return toCyclesMermaid(report);
}