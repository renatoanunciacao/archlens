/**
 * Problems Module Index
 * Public API for problem detection
 */

export type {
  ArchitectureProblem,
  ProblemSeverity,
  ProblemCategory,
  ProblemDetectionContext,
  ProblemHeuristic,
  HeuristicsRegistry,
} from "./types.js";

export { detectProblems, buildProblemDetectionContext } from "./detector.js";
export { getHeuristicsForProfile } from "./heuristics/index.js";

// Heuristics (for testing/extension)
export { layeringHeuristics } from "./heuristics/layering.js";
export { couplingHeuristics } from "./heuristics/coupling.js";
export { nextAppRouterHeuristics } from "./profiles/nextAppRouterProblems.js";
