/**
 * Fit Checks Registry
 * 
 * Centralizes all fit evaluation checks
 */

import type { FitCheckFunction } from "../types.js";
import { couplingChecks } from "./coupling.js";
import { layeringChecks } from "./layering.js";

/**
 * Common checks run for all profiles
 */
export const commonChecks: FitCheckFunction[] = [
  ...layeringChecks,
  ...couplingChecks,
];

/**
 * Profile-specific checks
 */
export const profileChecks: Record<string, FitCheckFunction[]> = {
  "next-app-router-feature-based": [
    // Next.js specific checks (future)
  ],
  "vite-feature-spa": [
    // Vite specific checks (future)
  ],
  "backend-modular-monolith": [
    // Backend specific checks (future)
  ],
  "backend-clean-architecture": [
    // Backend clean arch checks (future)
  ],
};

/**
 * Get all applicable checks for a profile
 */
export function getChecksForProfile(profileId: string): FitCheckFunction[] {
  return [
    ...commonChecks,
    ...(profileChecks[profileId] || []),
  ];
}
