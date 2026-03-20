import { minimatch } from "minimatch";

export type DependencyEdge = {
  from: string;
  to: string;
};

export type ArchRule = {
  name: string;
  from: string[];
  cannotImport: string[];
};

export type RuleViolation = {
  ruleName: string;
  from: string;
  to: string;
};

function matchesAny(filePath: string, patterns: string[]): boolean {
  return patterns.some((pattern) =>
    minimatch(filePath, pattern, {
      dot: true,
      matchBase: false,
    }),
  );
}

export function evaluateRules(
  edges: DependencyEdge[],
  rules: ArchRule[],
): RuleViolation[] {
  const violations: RuleViolation[] = [];

  for (const edge of edges) {
    for (const rule of rules) {
      const fromMatches = matchesAny(edge.from, rule.from);
      const toMatches = matchesAny(edge.to, rule.cannotImport);

      if (fromMatches && toMatches) {
        violations.push({
          ruleName: rule.name,
          from: edge.from,
          to: edge.to,
        });
      }
    }
  }

  return violations;
}