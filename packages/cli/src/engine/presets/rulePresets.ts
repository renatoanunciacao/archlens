import type { ArchRule } from "../rules/evaluateRules.js";

export const availableRulePresets = [
  "next-app-router-feature-based",
  "vite-feature-spa",
  "backend-modular-monolith",
  "backend-clean-architecture",
] as const;

export type RulePresetName = (typeof availableRulePresets)[number];

export function getRulePreset(profile: string): { rules: ArchRule[] } | null {
  switch (profile) {
    case "next-app-router-feature-based":
      return {
        rules: [
          {
            name: "features-cannot-import-app",
            from: ["src/features/**"],
            cannotImport: ["src/app/**"],
          },
          {
            name: "shared-cannot-import-features",
            from: ["src/shared/**"],
            cannotImport: ["src/features/**"],
          },
          {
            name: "client-cannot-import-server",
            from: ["src/components/**"],
            cannotImport: ["src/server/**"],
          },
        ],
      };

    case "vite-feature-spa":
      return {
        rules: [
          {
            name: "pages-can-use-features",
            from: ["src/features/**"],
            cannotImport: ["src/pages/**"],
          },
          {
            name: "shared-is-base-layer",
            from: ["src/shared/**"],
            cannotImport: ["src/features/**", "src/pages/**"],
          },
        ],
      };

    case "backend-modular-monolith":
      return {
        rules: [
          {
            name: "domain-no-infra",
            from: ["src/domain/**"],
            cannotImport: ["src/infra/**"],
          },
          {
            name: "controllers-no-repositories",
            from: ["src/controllers/**"],
            cannotImport: ["src/repositories/**"],
          },
        ],
      };

    case "backend-clean-architecture":
      return {
        rules: [
          {
            name: "domain-no-infra",
            from: ["src/domain/**"],
            cannotImport: ["src/infra/**"],
          },
          {
            name: "application-no-infra",
            from: ["src/application/**"],
            cannotImport: ["src/infra/**"],
          },
        ],
      };

    default:
      return null;
  }
}
