/**
 * Architecture Fit Engine
 * 
 * Evaluates how well a project adheres to its recommended architecture profile
 * Produces a comprehensive fit score and actionable feedback
 */

import type {
  ArchitectureFit,
  FitCheck,
  FitEvaluationContext,
  FitStatus,
} from "./types.js";

import { getChecksForProfile } from "./checks/index.js";

/**
 * Calculate fit score based on checks
 */
function calculateFitScore(checks: FitCheck[]): number {
  if (checks.length === 0) return 100;

  // Score: ok = 100, warning = 50, fail = 0
  const statusPoints = {
    ok: 100,
    warning: 50,
    fail: 0,
  };

  const totalPoints = checks.reduce(
    (sum, check) => sum + statusPoints[check.status],
    0
  );

  return Math.round((totalPoints / (checks.length * 100)) * 100);
}

/**
 * Determine fit status from checks
 */
function determineFitStatus(checks: FitCheck[]): FitStatus {
  const failCount = checks.filter((c) => c.status === "fail").length;
  const warningCount = checks.filter((c) => c.status === "warning").length;

  if (failCount > 0) {
    return "poor";
  }

  if (warningCount >= checks.length * 0.5) {
    return "partial";
  }

  return "good";
}

/**
 * Evaluate architecture fit against profile
 */
export async function evaluateFit(
  context: FitEvaluationContext
): Promise<ArchitectureFit> {
  // Get applicable checks
  const checks = getChecksForProfile(context.profile.id);

  // Run all checks
  const checkResults = checks.map((check) => {
    try {
      return check(context);
    } catch (error) {
      console.warn("Check failed:", error);
      return {
        name: "Unknown check",
        status: "warning" as const,
        description: "Check failed to execute",
      };
    }
  });

  // Calculate score and status
  const score = calculateFitScore(checkResults);
  const status = determineFitStatus(checkResults);

  // Detect missing and unexpected layers
  const missingLayers = context.profile.expectedLayers.filter(
    (layer) => !context.structure.layers.includes(layer)
  );

  const unexpectedLayers = context.structure.layers.filter(
    (layer) => !context.profile.expectedLayers.includes(layer)
  );

  return {
    profile: context.profile.id,
    status,
    score,
    detectedLayers: context.structure.layers,
    missingLayers,
    unexpectedLayers,
    checks: checkResults,
  };
}

/**
 * Helper to build fit evaluation context
 */
export function buildFitEvaluationContext(
  structure: FitEvaluationContext["structure"],
  graph: FitEvaluationContext["graph"],
  metrics: FitEvaluationContext["metrics"],
  profile: FitEvaluationContext["profile"],
  fingerprint: FitEvaluationContext["fingerprint"]
): FitEvaluationContext {
  return {
    structure,
    graph,
    metrics,
    profile,
    fingerprint,
  };
}
