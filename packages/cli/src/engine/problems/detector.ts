/**
 * Problem Detection Engine
 * 
 * Orchestrates problem detection by running all applicable heuristics
 * and aggregating results with deduplication and sorting
 */

import type { ArchitectureProblem, ProblemDetectionContext } from "./types.js";

import { getHeuristicsForProfile } from "./heuristics/index.js";

/**
 * Main problem detector
 * Runs all heuristics and returns comprehensive list of problems
 */
export async function detectProblems(
  context: ProblemDetectionContext
): Promise<ArchitectureProblem[]> {
  const allProblems: ArchitectureProblem[] = [];

  // Get applicable heuristics for this profile
  const heuristics = getHeuristicsForProfile(context.profile.id);

  // Run each heuristic
  for (const heuristic of heuristics) {
    try {
      const problems = heuristic.detect(context);
      allProblems.push(...problems);
    } catch (error) {
      console.warn(`Heuristic ${heuristic.id} failed:`, error);
    }
  }

  // Deduplicate (same problem ID)
  const uniqueProblems = new Map<string, ArchitectureProblem>();
  for (const problem of allProblems) {
    uniqueProblems.set(problem.id, problem);
  }

  // Sort by severity (high → medium → low)
  const severityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };

  const sorted = Array.from(uniqueProblems.values()).sort((a, b) => {
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;
    // Then by category
    return a.category.localeCompare(b.category);
  });

  return sorted;
}

/**
 * Convenience function to build problem detection context
 */
export function buildProblemDetectionContext(
  graph: ProblemDetectionContext["graph"],
  metrics: ProblemDetectionContext["metrics"],
  structure: ProblemDetectionContext["structure"],
  profile: ProblemDetectionContext["profile"],
  fingerprint: ProblemDetectionContext["fingerprint"],
  projectRoot: string
): ProblemDetectionContext {
  return {
    graph,
    metrics,
    structure,
    profile,
    fingerprint,
    projectRoot,
  };
}
