import type { ArchRule } from "./evaluateRules.js";
import fs from "node:fs/promises";
import path from "node:path";

export type RulesConfig = {
  rules: ArchRule[];
};

export async function loadRulesConfig(
  projectRoot: string,
): Promise<RulesConfig> {
  const configPath = path.resolve(projectRoot, ".archlens/rules.json");

  try {
    const raw = await fs.readFile(configPath, "utf8");
    const parsed = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.rules)) {
      throw new Error("Invalid rules config: expected { rules: [...] }");
    }

    const rules: ArchRule[] = parsed.rules.map((rule: any, index: number) => {
      if (!rule || typeof rule !== "object") {
        throw new Error(`Invalid rule at index ${index}: expected object`);
      }

      const { name, from, cannotImport } = rule;
      if (typeof name !== "string" || !name.trim()) {
        throw new Error(`Invalid rule at index ${index}: missing or invalid name`);
      }

      if (!Array.isArray(from) || from.some((p) => typeof p !== "string")) {
        throw new Error(`Invalid rule "${name}": from must be string[]`);
      }

      if (
        !Array.isArray(cannotImport) ||
        cannotImport.some((p) => typeof p !== "string")
      ) {
        throw new Error(`Invalid rule "${name}": cannotImport must be string[]`);
      }

      return {
        name,
        from,
        cannotImport,
      };
    });

    return { rules };
  } catch (error: any) {
    if (error.code === "ENOENT") {
      return { rules: [] };
    }

    // If the JSON is invalid, we want to surface the error clearly.
    throw new Error(`Failed to load rules config: ${error.message}`);
  }
}
