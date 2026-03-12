import type { BootHistoryEvent, BootSuggestion } from "./types.js";

export type DiscoveryMemory = {
  pendingKeys: Set<string>;
  approvedKeys: Set<string>;
  rejectedKeys: Set<string>;
  completedKeys: Set<string>;
  failedKeys: Set<string>;
};

function normalizeKey(value: string): string {
  return value.trim().toLowerCase();
}

export function buildDiscoveryMemory(params: {
  suggestions: BootSuggestion[];
  historyEvents: BootHistoryEvent[];
  featureKeyByTitle: Map<string, string>;
}): DiscoveryMemory {
  const pendingKeys = new Set<string>();
  const approvedKeys = new Set<string>();
  const rejectedKeys = new Set<string>();
  const completedKeys = new Set<string>();
  const failedKeys = new Set<string>();

  for (const suggestion of params.suggestions) {
    const key = params.featureKeyByTitle.get(normalizeKey(suggestion.title));
    if (!key) continue;

    if (suggestion.status === "pending") pendingKeys.add(key);
    if (suggestion.status === "approved") approvedKeys.add(key);
    if (suggestion.status === "rejected") rejectedKeys.add(key);
    if (suggestion.status === "completed") completedKeys.add(key);
    if (suggestion.status === "failed") failedKeys.add(key);
  }

  for (const event of params.historyEvents) {
    const key = params.featureKeyByTitle.get(normalizeKey(event.title));
    if (!key) continue;

    if (event.decision === "rejected") rejectedKeys.add(key);
    if (event.decision === "completed") completedKeys.add(key);
    if (event.decision === "failed") failedKeys.add(key);
  }

  return {
    pendingKeys,
    approvedKeys,
    rejectedKeys,
    completedKeys,
    failedKeys,
  };
}