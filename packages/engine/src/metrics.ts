import type { Edge, NodeMetrics } from "./types.js";

export function computeNodeMetrics(nodes: string[], edges: Edge[]) {
  const fanIn = new Map<string, number>();
  const fanOut = new Map<string, number>();

  for (const n of nodes) {
    fanIn.set(n, 0);
    fanOut.set(n, 0);
  }

  for (const e of edges) {
    fanOut.set(e.from, (fanOut.get(e.from) ?? 0) + 1);
    fanIn.set(e.to, (fanIn.get(e.to) ?? 0) + 1);
  }

  const perFile: NodeMetrics[] = nodes.map((file) => {
    const fi = fanIn.get(file) ?? 0;
    const fo = fanOut.get(file) ?? 0;
    const denom = fi + fo;
    const instability = denom === 0 ? null : Number((fo / denom).toFixed(3));
    const dangerScore = fi * fo;
    return { file, fanIn: fi, fanOut: fo, instability, dangerScore };
  });

  const topFanIn = [...perFile].sort((a, b) => b.fanIn - a.fanIn).slice(0, 10);
  const topFanOut = [...perFile].sort((a, b) => b.fanOut - a.fanOut).slice(0, 10);

  // “perigo” = central + acoplado: alto (fanIn+fanOut) e idealmente ambos > 0
  const danger = [...perFile]
    .filter((m) => m.fanIn > 0 && m.fanOut > 0)
    .sort((a, b) => (b.dangerScore ?? 0) - (a.dangerScore ?? 0))
    .slice(0, 10);

  return { perFile, topFanIn, topFanOut, danger };
}