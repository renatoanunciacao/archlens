import type { Report } from "../engine/types.js";
import type { BootGoal, BootRecommendation, BootSuggestion, BootHistoryEvent } from "./types.js";
import { FEATURE_CATALOG, type FeatureCandidate } from "./catalog.js";
import { buildDiscoveryMemory } from "./learning.js";

function candidateToRecommendation(candidate: FeatureCandidate): BootRecommendation {
  return {
    title: candidate.title,
    summary: candidate.summary,
    rationale: candidate.rationale,
    impact: candidate.impact,
    effort: candidate.effort,
    filesToChange: candidate.filesToChange,
    implementationSteps: candidate.implementationSteps,
    acceptanceCriteria: candidate.acceptanceCriteria,
  };
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase();
}

function buildFeatureKeyByTitle() {
  const map = new Map<string, string>();

  for (const item of FEATURE_CATALOG) {
    map.set(normalizeKey(item.title), item.key);
  }

  return map;
}

function isGoalCompatible(candidate: FeatureCandidate, goal: BootGoal) {
  if (goal === "next-feature") return true;
  return candidate.goal === goal;
}

function hasPrerequisites(candidate: FeatureCandidate, completedKeys: Set<string>) {
  if (!candidate.prerequisites?.length) return true;
  return candidate.prerequisites.every((key) => completedKeys.has(key));
}

function scoreCandidate(report: Report, candidate: FeatureCandidate) {
  let score = 0;

  if (candidate.impact === "high") score += 30;
  if (candidate.impact === "medium") score += 20;
  if (candidate.impact === "low") score += 10;

  if (candidate.effort === "low") score += 15;
  if (candidate.effort === "medium") score += 8;
  if (candidate.effort === "high") score += 2;

  if (candidate.tags.includes("mermaid")) score += 5;
  if (candidate.tags.includes("explainability")) score += 4;
  if (candidate.tags.includes("release")) score += 3;

  const scoreValue =
    typeof report.score === "object" && report.score && "value" in report.score
      ? Number(report.score.value ?? 0)
      : 0;

  if (scoreValue >= 90 && candidate.key === "explain-score") {
    score += 10;
  }

  if ((report.cycles?.length ?? 0) > 0 && candidate.key === "architecture-diff") {
    score -= 5;
  }

  return score;
}

export function discoverNextRecommendation(params: {
  report: Report;
  goal: BootGoal;
  suggestions: BootSuggestion[];
  historyEvents: BootHistoryEvent[];
}): BootRecommendation {
  const featureKeyByTitle = buildFeatureKeyByTitle();

  const memory = buildDiscoveryMemory({
    suggestions: params.suggestions,
    historyEvents: params.historyEvents,
    featureKeyByTitle,
  });

  const candidates = FEATURE_CATALOG.filter((candidate) => {
    if (!isGoalCompatible(candidate, params.goal)) return false;
    if (memory.pendingKeys.has(candidate.key)) return false;
    if (memory.approvedKeys.has(candidate.key)) return false;
    if (memory.completedKeys.has(candidate.key)) return false;
    if (!hasPrerequisites(candidate, memory.completedKeys)) return false;
    return true;
  });

  if (!candidates.length) {
    return {
      title: "No new feature recommended",
      summary: "No eligible next feature was found based on the current queue and history.",
      rationale: [
        "All known candidates are already pending, approved, completed, or blocked by prerequisites.",
      ],
      impact: "low",
      effort: "low",
      filesToChange: [],
      implementationSteps: ["Review the feature catalog or add new candidates."],
      acceptanceCriteria: ["A new candidate feature is defined."],
    };
  }

  const ranked = [...candidates].sort(
    (a, b) => scoreCandidate(params.report, b) - scoreCandidate(params.report, a),
  );

  return candidateToRecommendation(ranked[0]);
}