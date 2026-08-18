/**
 * Coupling-related architecture problem heuristics
 */

import type { ProblemDetectionContext, ProblemHeuristic } from "../types.js";

/**
 * God module: Module with too many dependencies (high fan-in)
 */
export const godModuleHeuristic: ProblemHeuristic = {
  id: "god-module",
  name: "God Module",
  category: "coupling",
  detect(context: ProblemDetectionContext) {
    const threshold = 10;
    const godModules = context.metrics.fanIn.filter((m) => m.count > threshold);

    return godModules.map((god) => ({
      id: `god-module-${god.file}`,
      title: "God Module Detected",
      severity: "high" as const,
      category: "coupling" as const,
      description: `Module ${god.file} has ${god.count} incoming dependencies, indicating it's doing too much.`,
      whyItMatters:
        "God modules become bottlenecks and are difficult to test, modify, and maintain. Changes trigger cascading failures.",
      evidence: [`${god.count} modules depend on ${god.file}`],
      affectedFiles: [god.file],
      suggestedFixes: [
        "Split into focused sub-modules by responsibility",
        "Extract shared logic to a new utility module",
        "Use facade pattern to reduce import surface",
      ],
    }));
  },
};

/**
 * Dependency cycle: Circular dependencies between modules
 */
export const cycleHeuristic: ProblemHeuristic = {
  id: "cycle",
  name: "Dependency Cycle",
  category: "coupling",
  detect(context: ProblemDetectionContext) {
    return context.metrics.cycles.map((cycle, idx) => ({
      id: `cycle-${idx}`,
      title: "Circular Dependency",
      severity: cycle.length > 3 ? ("high" as const) : ("medium" as const),
      category: "coupling" as const,
      description: `Circular dependency found: ${cycle.join(" → ")} → ${cycle[0]}`,
      whyItMatters:
        "Cycles make code harder to understand, test, and refactor. They violate layering principles.",
      evidence: [
        `Circular path with ${cycle.length} modules`,
        `Path: ${cycle.join(" → ")} → ${cycle[0]}`,
      ],
      affectedFiles: cycle,
      suggestedFixes: [
        "Introduce a new abstraction layer to break the cycle",
        "Move shared logic to a separate utility module",
        "Reverse one of the dependencies",
      ],
    }));
  },
};

/**
 * UI-Services coupling: UI components directly importing business logic
 */
export const uiServicesCouplingHeuristic: ProblemHeuristic = {
  id: "ui-services-coupling",
  name: "UI-Services Coupling",
  category: "coupling",
  detect(context: ProblemDetectionContext) {
    const problems = [];

    for (const node of context.graph.nodes) {
      if (!node.file.includes("components")) continue;

      for (const imp of node.imports) {
        if (imp.includes("services") || imp.includes("api")) {
          problems.push({
            id: `ui-services-${node.file}`,
            title: "UI-Services Coupling",
            severity: "medium" as const,
            category: "coupling" as const,
            description: `Component ${node.file} directly imports from services/API: ${imp}`,
            whyItMatters:
              "UI components tightly coupled to business logic are hard to reuse and test independently.",
            evidence: [`Direct import: ${node.file} → ${imp}`],
            affectedFiles: [node.file, imp],
            suggestedFixes: [
              "Wrap service calls in React hooks",
              "Use Context API for dependency injection",
              "Create a data layer abstraction between UI and services",
            ],
          });
          break;
        }
      }
    }

    return problems;
  },
};

/**
 * High coupling density: Too many dependencies per module on average
 */
export const highDensityCouplingHeuristic: ProblemHeuristic = {
  id: "high-density-coupling",
  name: "High Coupling Density",
  category: "coupling",
  detect(context: ProblemDetectionContext) {
    const avgDensity =
      context.metrics.fanOut.reduce((sum, m) => sum + m.count, 0) /
      Math.max(1, context.metrics.fanOut.length);
    const threshold = 6;

    if (avgDensity > threshold) {
      const affectedFiles = context.metrics.fanOut
        .filter((m) => m.count > threshold * 0.8)
        .map((m) => m.file);

      return [
        {
          id: "high-density-coupling",
          title: "High Coupling Density",
          severity: "high" as const,
          category: "coupling" as const,
          description: `Codebase has high coupling: average ${avgDensity.toFixed(1)} dependencies per module (threshold: ${threshold})`,
          whyItMatters:
            "High coupling makes the system brittle. Changes ripple throughout the codebase.",
          evidence: [
            `${context.metrics.fanOut.length} modules analyzed`,
            `Average ${avgDensity.toFixed(1)} dependencies per module`,
            `${affectedFiles.length} modules above threshold`,
          ],
          affectedFiles,
          suggestedFixes: [
            "Reorganize by layers - separate concerns (UI, logic, data)",
            "Use facade pattern to hide internal dependencies",
            "Introduce service locator or dependency injection",
          ],
        },
      ];
    }

    return [];
  },
};

export const couplingHeuristics = [
  godModuleHeuristic,
  cycleHeuristic,
  uiServicesCouplingHeuristic,
  highDensityCouplingHeuristic,
];
