/**
 * Layering Heuristics
 * 
 * Detects problems related to layer boundaries and structure:
 * - Missing expected layers
 * - Business logic outside intended layers
 * - Cross-layer imports
 */

import type { ArchitectureProblem, ProblemDetectionContext, ProblemHeuristic } from "../types.js";

/**
 * Heuristic: Missing feature layer in frontend projects
 * Especially critical for Next.js App Router
 */
export const missingFeatureLayerHeuristic: ProblemHeuristic = {
  id: "missing-features-layer",
  name: "Missing feature layer structure",
  category: "layering",

  detect(context: ProblemDetectionContext): ArchitectureProblem[] {
    const problems: ArchitectureProblem[] = [];

    // Only applies to frontend/fullstack projects
    if (context.fingerprint.projectKind === "backend") {
      return problems;
    }

    // Check if features layer is expected but not found
    const expectedLayers = context.profile.expectedLayers;
    const detectedLayers = context.structure.layers;

    if (expectedLayers.includes("features") && !detectedLayers.includes("features")) {
      // Find files with high fan-in in app/pages layer (sign of godComponent)
      const appPageFiles = context.metrics.fanIn.filter((item) =>
        item.file.match(/(app|pages|src)\/(app|pages)\//)
      );

      const problem: ArchitectureProblem = {
        id: "missing-features-layer",
        title: "Missing feature layer",
        severity: "high",
        category: "layering",
        description:
          "No dedicated feature folder detected. Business logic is likely scattered across route components, making them difficult to test and reuse.",
        whyItMatters:
          "Route components become god components. Hard to share logic between routes. Testing becomes harder. Scaling becomes painful.",
        evidence: [
          `Expected 'features' layer not detected in structure`,
          `Found ${appPageFiles.length} files with high coupling in app/pages layer`,
          ...appPageFiles.slice(0, 3).map((item) => `${item.file} has ${item.count} incoming dependencies`),
        ],
        affectedFiles: appPageFiles.slice(0, 5).map((item) => item.file),
        suggestedFixes: [
          "Create src/features directory structure",
          "Extract business logic from page components into features",
          "Move reusable hooks to features/shared/hooks",
          "Consider using feature-based file organization",
        ],
      };

      problems.push(problem);
    }

    return problems;
  },
};

/**
 * Heuristic: Missing shared layer
 * For frontend projects with many utility functions scattered
 */
export const missingSharedLayerHeuristic: ProblemHeuristic = {
  id: "missing-shared-layer",
  name: "Missing shared utilities layer",
  category: "layering",

  detect(context: ProblemDetectionContext): ArchitectureProblem[] {
    const problems: ArchitectureProblem[] = [];

    if (context.fingerprint.projectKind === "backend") {
      return problems;
    }

    // Check for scattered utility files (common indicator of missing shared layer)
    const utilityFiles = context.graph.nodes.filter((node) =>
      node.file.match(/(utils|helpers|constants|types)\.(ts|tsx|js|jsx)$/)
    );

    // If we have utilities but no shared layer, it's scattered
    const hasSharedLayer = context.structure.layers.includes("shared");

    if (utilityFiles.length > 5 && !hasSharedLayer) {
      const highFanInUtils = context.metrics.fanIn.filter((item) =>
        item.file.match(/(utils|helpers)/) && item.count > 3
      );

      if (highFanInUtils.length > 0) {
        const problem: ArchitectureProblem = {
          id: "missing-shared-layer",
          title: "Shared utilities scattered across project",
          severity: "medium",
          category: "layering",
          description:
            "Utility functions, hooks, and helpers are scattered in different locations instead of being centralized in a shared layer.",
          whyItMatters:
            "Developers don't know where to find utilities. Duplication creeps in. Hard to keep utilities DRY.",
          evidence: [
            `Found ${utilityFiles.length} utility files scattered across the project`,
            `${highFanInUtils.length} utility files are heavily imported`,
            `No 'shared' layer detected in expected layers`,
          ],
          affectedFiles: utilityFiles.slice(0, 5).map((node) => node.file),
          suggestedFixes: [
            "Create src/shared directory with subdirectories: hooks, utils, types, constants",
            "Consolidate utility files into shared/utils",
            "Move reusable hooks to shared/hooks",
            "Export common types from shared/types",
          ],
        };

        problems.push(problem);
      }
    }

    return problems;
  },
};

/**
 * Heuristic: Domain importing infrastructure in backend
 * Anti-pattern in layered backend architecture
 */
export const domainImportingInfraHeuristic: ProblemHeuristic = {
  id: "domain-importing-infra",
  name: "Domain layer importing infrastructure",
  category: "layering",

  detect(context: ProblemDetectionContext): ArchitectureProblem[] {
    const problems: ArchitectureProblem[] = [];

    // Only applies to backend
    if (context.fingerprint.projectKind === "frontend") {
      return problems;
    }

    const domainFiles = context.graph.nodes.filter((node) =>
      node.file.match(/domain\//)
    );

    const violatingEdges = context.graph.edges.filter((edge) =>
      domainFiles.some((df) => df.file === edge.from) &&
      edge.to.match(/infra\/|database\/|external\//)
    );

    if (violatingEdges.length > 0) {
      const problem: ArchitectureProblem = {
        id: "domain-importing-infra",
        title: "Domain layer importing infrastructure",
        severity: "high",
        category: "layering",
        description:
          "Domain layer (business logic) is importing from infrastructure layer (database, external services). This violates dependency inversion principle.",
        whyItMatters:
          "Business logic becomes tightly coupled to infrastructure. Hard to test. Logic tied to specific database implementation.",
        evidence: [
          `Found ${violatingEdges.length} imports from domain to infrastructure`,
          ...violatingEdges.slice(0, 3).map((edge) => `${edge.from} → ${edge.to}`),
        ],
        affectedFiles: [...new Set(violatingEdges.map((e) => e.from))].slice(0, 5),
        suggestedFixes: [
          "Define domain interfaces/abstractions instead of using infrastructure directly",
          "Move infrastructure access to application layer",
          "Use dependency injection to provide infrastructure to domain",
          "Domain should depend on abstractions, not concrete implementations",
        ],
      };

      problems.push(problem);
    }

    return problems;
  },
};

export const layeringHeuristics: ProblemHeuristic[] = [
  missingFeatureLayerHeuristic,
  missingSharedLayerHeuristic,
  domainImportingInfraHeuristic,
];
