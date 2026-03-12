export type BootGoal =
  | "next-feature"
  | "release-ready"
  | "improve-score"
  | "reduce-coupling";

export type FeatureStatus =
  | "pending"
  | "approved"
  | "in_progress"
  | "failed"
  | "rejected"
  | "completed";

export type BootRecommendation = {
  title: string;
  summary: string;
  rationale: string[];
  impact: "low" | "medium" | "high";
  effort: "low" | "medium" | "high";
  filesToChange: string[];
  implementationSteps: string[];
  acceptanceCriteria: string[];
};

export type BootSuggestion = {
  id: string;
  goal: BootGoal;
  title: string;
  summary: string;
  status: FeatureStatus;
  createdAt: string;
  specPath: string;
  planPath: string;
  recipePath: string;
};

export type BootHistoryEvent = {
  id: string;
  goal: BootGoal;
  title: string;
  summary: string;
  decision: Exclude<FeatureStatus, "pending">;
  createdAt: string;
  resolvedAt: string;
  specPath: string;
  planPath: string;
  recipePath: string;
};

export type RecipeOperation =
  | {
      kind: "replace";
      file: string;
      find: string;
      replace: string;
    }
  | {
      kind: "insertAfter";
      file: string;
      find: string;
      content: string;
    }
  | {
      kind: "append";
      file: string;
      content: string;
    }
  | {
      kind: "createFile";
      file: string;
      content: string;
    };

export type BootRecipe = {
  id: string;
  title: string;
  allowedFiles: string[];
  operations: RecipeOperation[];
  validate: string[];
};
