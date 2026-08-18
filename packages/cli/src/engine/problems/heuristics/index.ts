/**
 * Heuristics Registry
 * 
 * Centralizes all problem detection heuristics
 * Organized by category and profile
 */

import type { ProblemHeuristic } from "../types.js";
import { couplingHeuristics } from "./coupling.js";
import { layeringHeuristics } from "./layering.js";

/**
 * Common heuristics run for all projects
 */
export const commonHeuristics: ProblemHeuristic[] = [
  ...layeringHeuristics,
  ...couplingHeuristics,
];

/**
 * Profile-specific heuristics
 */
export const profileHeuristics: Record<string, ProblemHeuristic[]> = {
  "next-app-router-feature-based": [
    // Next-specific heuristics (to be added in ENTREGA 2b)
  ],
  "vite-feature-spa": [
    // Vite-specific heuristics (to be added in ENTREGA 2b)
  ],
  "backend-modular-monolith": [
    // Backend-specific heuristics (to be added in ENTREGA 2b)
  ],
  "backend-clean-architecture": [
    // Backend clean arch heuristics (to be added in ENTREGA 2b)
  ],
};

/**
 * Get all applicable heuristics for a profile
 */
export function getHeuristicsForProfile(profileId: string): ProblemHeuristic[] {
  return [
    ...commonHeuristics,
    ...(profileHeuristics[profileId] || []),
  ];
}
