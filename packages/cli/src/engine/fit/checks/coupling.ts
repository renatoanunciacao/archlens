/**
 * Coupling Fit Checks
 * 
 * Validates that coupling is at acceptable levels for the profile
 */

import type { FitCheckFunction, FitEvaluationContext } from "../types.js";

/**
 * Check: No circular dependencies
 */
export const noCyclesCheck: FitCheckFunction = (context) => {
  const cycleCount = context.metrics.cycles.length;

  if (cycleCount === 0) {
    return {
      name: "No circular dependencies",
      status: "ok",
      description: "Clean dependency graph with no cycles",
    };
  }

  if (cycleCount <= 2) {
    return {
      name: "No circular dependencies",
      status: "warning",
      description: `${cycleCount} cycle(s) detected. Should be resolved.`,
    };
  }

  return {
    name: "No circular dependencies",
    status: "fail",
    description: `${cycleCount} cycles detected. Indicates poor architecture.`,
  };
};

/**
 * Check: Reasonable coupling density
 */
export const couplingDensityCheck: FitCheckFunction = (context) => {
  const { nodes, edges } = context.graph;
  
  if (nodes.length === 0) {
    return {
      name: "Coupling density",
      status: "ok",
      description: "No files to analyze",
    };
  }

  // Ideal: each file imports 2-5 other files on average
  const avgImportsPerFile = edges.length / nodes.length;

  if (avgImportsPerFile < 3) {
    return {
      name: "Coupling density",
      status: "ok",
      description: `Good coupling density: ${avgImportsPerFile.toFixed(1)} imports per file on average`,
    };
  }

  if (avgImportsPerFile < 6) {
    return {
      name: "Coupling density",
      status: "warning",
      description: `Moderate coupling: ${avgImportsPerFile.toFixed(1)} imports per file. Could be reduced.`,
    };
  }

  return {
    name: "Coupling density",
    status: "fail",
    description: `High coupling density: ${avgImportsPerFile.toFixed(1)} imports per file. Architecture needs refactoring.`,
  };
};

/**
 * Check: No god modules (high fan-in AND fan-out)
 */
export const noGodModulesCheck: FitCheckFunction = (context) => {
  const godModules = context.metrics.hotspots.filter(
    (h) => h.dangerScore > 30
  );

  if (godModules.length === 0) {
    return {
      name: "No god modules",
      status: "ok",
      description: "No modules with excessive coupling detected",
    };
  }

  if (godModules.length <= 2) {
    return {
      name: "No god modules",
      status: "warning",
      description: `${godModules.length} module(s) with high coupling detected. Consider refactoring.`,
    };
  }

  return {
    name: "No god modules",
    status: "fail",
    description: `${godModules.length} god modules detected. Architecture is compromised.`,
  };
};

export const couplingChecks: FitCheckFunction[] = [
  noCyclesCheck,
  couplingDensityCheck,
  noGodModulesCheck,
];
