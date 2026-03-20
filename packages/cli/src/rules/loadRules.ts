import fs from "node:fs";
import path from "node:path";

export type ArchRule = {
  name: string;
  from: string[];
  cannotImport: string[];
};

export type RulesConfig = {
  rules: ArchRule[];
};

export function loadRulesConfig(projectRoot: string): RulesConfig {
  const rulesPath = path.join(projectRoot, ".archlens", "rules.json");

  if (!fs.existsSync(rulesPath)) {
    return { rules: [] };
  }

  const raw = fs.readFileSync(rulesPath, "utf-8");
  const parsed = JSON.parse(raw);

  if (!parsed || !Array.isArray(parsed.rules)) {
    throw new Error("Invalid rules config: 'rules' must be an array.");
  }

  for (const rule of parsed.rules) {
    if (!rule.name || !Array.isArray(rule.from) || !Array.isArray(rule.cannotImport)) {
      throw new Error(
        `Invalid rule definition: each rule must contain 'name', 'from[]', and 'cannotImport[]'.`,
      );
    }
  }

  return parsed;
}