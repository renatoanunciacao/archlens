import type { BootRecipe, BootSuggestion, RecipeOperation } from "./types.js";

import type { BootLlmContext } from "./context.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildLlmContext } from "./context.js";
import fs from "node:fs/promises";
import path from "node:path";

type LlmGenerateRecipeResult = {
  recipe: BootRecipe;
  rawResponse: string;
};

function buildPrompt(context: BootLlmContext): string {
  return `
You are generating a safe execution recipe for a TypeScript CLI project.

Task:
Generate a JSON recipe to implement the approved feature.

Approved feature:
- ID: ${context.suggestion.id}
- Title: ${context.suggestion.title}
- Summary: ${context.suggestion.summary}
- Goal: ${context.suggestion.goal}

Constraints:
${context.constraints.map((item) => `- ${item}`).join("\n")}

Project tree:
${context.projectTree.map((item) => `- ${item}`).join("\n")}

Candidate files:
${context.candidateFiles
  .map(
    (file) => `
FILE: ${file.path}
REASON: ${file.reason}
CONTENT:
${file.content}
`,
  )
  .join("\n")}

Return JSON only with this schema:
{
  "id": string,
  "title": string,
  "allowedFiles": string[],
  "operations": [
    {
      "kind": "replace" | "insertAfter" | "append" | "createFile",
      "file": string,
      ...operation fields
    }
  ],
  "validate": string[]
}

Operation shapes:
- replace: { "kind": "replace", "file": string, "find": string, "replace": string }
- insertAfter: { "kind": "insertAfter", "file": string, "find": string, "content": string }
- append: { "kind": "append", "file": string, "content": string }
- createFile: { "kind": "createFile", "file": string, "content": string }

Rules:
- Prefer minimal edits.
- Use exact text from the provided file snippets for "find".
- Do not invent files outside the project tree unless createFile is truly necessary.
- Include "npm run build" in validate.
`.trim();
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function validateOperation(operation: unknown): operation is RecipeOperation {
  if (!operation || typeof operation !== "object") return false;

  const op = operation as Record<string, unknown>;

  if (!isString(op.kind) || !isString(op.file)) return false;

  if (op.kind === "replace") {
    return isString(op.find) && isString(op.replace);
  }

  if (op.kind === "insertAfter") {
    return isString(op.find) && isString(op.content);
  }

  if (op.kind === "append") {
    return isString(op.content);
  }

  if (op.kind === "createFile") {
    return isString(op.content);
  }

  return false;
}

export function validateRecipe(recipe: unknown): recipe is BootRecipe {
  if (!recipe || typeof recipe !== "object") return false;

  const obj = recipe as Record<string, unknown>;

  if (!isString(obj.id)) return false;
  if (!isString(obj.title)) return false;
  if (!Array.isArray(obj.allowedFiles) || !obj.allowedFiles.every(isString)) {
    return false;
  }
  if (!Array.isArray(obj.operations) || !obj.operations.every(validateOperation)) {
    return false;
  }
  if (!Array.isArray(obj.validate) || !obj.validate.every(isString)) {
    return false;
  }

  return true;
}

// Chamada real ao Gemini para gerar receitas
async function callLlm(prompt: string): Promise<string> {
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    throw new Error(
      "GOOGLE_API_KEY não configurada. Defina a variável de ambiente com sua chave de API do Gemini.",
    );
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // Limpar blocos de código markdown caso a IA coloque
    const jsonClean = response.replace(/```json\n?|```\n?/g, "").trim();

    return jsonClean;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Falha na chamada ao Gemini: ${error.message}`);
    }
    throw error;
  }
}

export async function generateRecipeWithLlm(
  cwd: string,
  suggestion: BootSuggestion,
): Promise<LlmGenerateRecipeResult> {
  const context = await buildLlmContext(cwd, suggestion);

  console.log("\nDEBUG CONTEXT:\n");
  console.log(JSON.stringify(context, null, 2));

  const prompt = buildPrompt(context);
  const rawResponse = await callLlm(prompt);

  let parsed: unknown;

  try {
    parsed = JSON.parse(rawResponse);
  } catch {
    throw new Error("LLM returned invalid JSON");
  }

  if (!validateRecipe(parsed)) {
    throw new Error("LLM returned JSON that does not match BootRecipe schema");
  }

  if (!parsed.validate.includes("npm run build")) {
    parsed.validate.push("npm run build");
  }

  return {
    recipe: parsed,
    rawResponse,
  };
}

export async function saveGeneratedRecipe(
  cwd: string,
  suggestionId: string,
  recipe: BootRecipe,
) {
  const recipeDir = path.join(cwd, ".archlens", "recipes");
  await fs.mkdir(recipeDir, { recursive: true });

  const recipePath = path.join(recipeDir, `${suggestionId}.json`);
  await fs.writeFile(recipePath, JSON.stringify(recipe, null, 2), "utf8");

  return recipePath;
}