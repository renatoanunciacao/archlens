import type { Report } from "./types.js";
import { buildGraph } from "./graph.js";
import { collectFiles } from "./fileCollector.js";
import { computeNodeMetrics } from "./metrics.js";
import { computeScore } from "./score.js";
import { stronglyConnectedComponents } from "./tarjan.js";

export async function analyzeProject(params: {
  cwd: string;
  projectName: string;
  entryGlobs: string[];
  excludeGlobs: string[];
}): Promise<Report> {

  const { cwd, projectName, entryGlobs, excludeGlobs } = params;

  const files = await collectFiles({ cwd, entryGlobs, excludeGlobs });
  const graph = await buildGraph({ cwd, files });

  const sccs = stronglyConnectedComponents(graph.nodes, graph.edges);

  const cycles = sccs
    .filter(c => c.length > 1)
    .map((nodes, i) => ({
      id: `cycle-${i + 1}`,
      nodes: nodes.sort()
    }));

    const metrics = computeNodeMetrics(graph.nodes, graph.edges);

    const score = computeScore({ cycles, metrics });

  return {
    meta: {
      projectName,
      analyzedAt: new Date().toISOString(),
      fileCount: graph.nodes.length
    },
    graph,
    cycles,
    metrics,
    score
  };
}