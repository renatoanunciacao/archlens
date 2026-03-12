import type { BootGoal, BootRecommendation, BootSuggestion } from "./types.js";
import {
  addSuggestion,
  nextSuggestionId,
  readHistory,
  readQueue,
  saveSuggestionArtifacts,
} from "./storage.js";

import type { Report } from "../engine/types.js";
import { discoverNextRecommendation } from "./discovery.js";
import { formatBootRecommendation } from "./formatter.js";

function getRecommendation(
  report: Report,
  goal: BootGoal,
  suggestions: BootSuggestion[],
  historyEvents: Awaited<ReturnType<typeof readHistory>>["events"],
): BootRecommendation {
  return discoverNextRecommendation({
    report,
    goal,
    suggestions,
    historyEvents,
  });
}

function toSpecMarkdown(rec: BootRecommendation) {
  return [
    `# ${rec.title}`,
    "",
    "## Summary",
    rec.summary,
    "",
    "## Why now",
    ...rec.rationale.map((item) => `- ${item}`),
    "",
    "## Files to change",
    ...rec.filesToChange.map((item) => `- ${item}`),
    "",
    "## Acceptance criteria",
    ...rec.acceptanceCriteria.map((item) => `- ${item}`),
    "",
  ].join("\n");
}

function toPlanMarkdown(rec: BootRecommendation) {
  return [
    `# Implementation Plan - ${rec.title}`,
    "",
    "## Steps",
    ...rec.implementationSteps.map((item, index) => `${index + 1}. ${item}`),
    "",
    "## Impact",
    rec.impact,
    "",
    "## Effort",
    rec.effort,
    "",
  ].join("\n");
}

export async function createBootSuggestion(
  cwd: string,
  report: Report,
  goal: BootGoal,
) {
  const queue = await readQueue(cwd);
  const history = await readHistory(cwd);

  const recommendation = getRecommendation(
    report,
    goal,
    queue.suggestions,
    history.events,
  );

  const id = nextSuggestionId(queue.suggestions);

  const draftSuggestion: BootSuggestion = {
    id,
    goal,
    title: recommendation.title,
    summary: recommendation.summary,
    status: "pending",
    createdAt: new Date().toISOString(),
    specPath: "",
    planPath: "",
    recipePath: "",
  };
  const specContent = toSpecMarkdown(recommendation);
  const planContent = toPlanMarkdown(recommendation);

  const artifacts = await saveSuggestionArtifacts(
    cwd,
    draftSuggestion,
    specContent,
    planContent,
  );

  const suggestion: BootSuggestion = {
    ...draftSuggestion,
    specPath: artifacts.specPath,
    planPath: artifacts.planPath,
    recipePath: artifacts.recipePath,
  };

  await addSuggestion(cwd, suggestion);

  return {
    suggestion,
    recommendationText: formatBootRecommendation(goal, recommendation),
  };
}