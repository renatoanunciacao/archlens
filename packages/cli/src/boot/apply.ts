import type { BootRecipe, BootSuggestion, RecipeOperation } from "./types.js";
import {
  appendHistoryEvent,
  backupFiles,
  deleteSuggestionBackup,
  readRecipe,
  restoreBackup,
  updateSuggestionStatus,
} from "./storage.js";

import { exec as execCb } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const exec = promisify(execCb);

async function applyReplace(cwd: string, operation: Extract<RecipeOperation, { kind: "replace" }>) {
  const filePath = path.join(cwd, operation.file);
  const content = await fs.readFile(filePath, "utf8");

  if (!content.includes(operation.find)) {
    throw new Error(
      `Replace target not found in ${operation.file}: ${operation.find}`,
    );
  }

  const next = content.replace(operation.find, operation.replace);
  await fs.writeFile(filePath, next, "utf8");
}

async function applyInsertAfter(
  cwd: string,
  operation: Extract<RecipeOperation, { kind: "insertAfter" }>,
) {
  const filePath = path.join(cwd, operation.file);
  const content = await fs.readFile(filePath, "utf8");

  if (!content.includes(operation.find)) {
    throw new Error(
      `Insert target not found in ${operation.file}: ${operation.find}`,
    );
  }

  const next = content.replace(
    operation.find,
    `${operation.find}\n${operation.content}`,
  );

  await fs.writeFile(filePath, next, "utf8");
}

async function applyAppend(cwd: string, operation: Extract<RecipeOperation, { kind: "append" }>) {
  const filePath = path.join(cwd, operation.file);
  const current = await fs.readFile(filePath, "utf8");
  const next = `${current}\n${operation.content}`;
  await fs.writeFile(filePath, next, "utf8");
}

async function applyCreateFile(
  cwd: string,
  operation: Extract<RecipeOperation, { kind: "createFile" }>,
) {
  const filePath = path.join(cwd, operation.file);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, operation.content, "utf8");
}

async function applyOperation(cwd: string, operation: RecipeOperation) {
  if (operation.kind === "replace") {
    await applyReplace(cwd, operation);
    return;
  }

  if (operation.kind === "insertAfter") {
    await applyInsertAfter(cwd, operation);
    return;
  }

  if (operation.kind === "append") {
    await applyAppend(cwd, operation);
    return;
  }

  if (operation.kind === "createFile") {
    await applyCreateFile(cwd, operation);
    return;
  }

  throw new Error(`Unsupported operation kind`);
}

async function runValidation(cwd: string, commands: string[]) {
  for (const command of commands) {
    await exec(command, { cwd });
  }
}

function ensureAllowedFiles(recipe: BootRecipe) {
  for (const operation of recipe.operations) {
    if ("file" in operation && !recipe.allowedFiles.includes(operation.file)) {
      throw new Error(
        `Operation references file not allowed by recipe: ${operation.file}`,
      );
    }
  }
}

export async function applySuggestion(cwd: string, suggestion: BootSuggestion) {
  const recipe = await readRecipe(cwd, suggestion.id);

  ensureAllowedFiles(recipe);

  await updateSuggestionStatus(cwd, suggestion.id, "in_progress");

  try {
    console.log(`\n📦 Creating backup for ${suggestion.id}...\n`);
    await backupFiles(cwd, suggestion.id, recipe.allowedFiles);

    console.log(`🔧 Applying recipe ${suggestion.id}...\n`);
    for (const operation of recipe.operations) {
      console.log(`- ${operation.kind} ${operation.file}`);
      await applyOperation(cwd, operation);
    }

    console.log(`\n🧪 Running validation...\n`);
    await runValidation(cwd, recipe.validate);

    await updateSuggestionStatus(cwd, suggestion.id, "completed");
    await appendHistoryEvent(cwd, { ...suggestion, status: "completed" }, "completed");
    await deleteSuggestionBackup(cwd, suggestion.id);

    console.log(`✅ ${suggestion.id} completed successfully`);
    console.log(`🧹 Backup removed\n`);
  } catch (error) {
    console.log(`\n❌ Apply failed. Starting rollback...\n`);

    try {
      await restoreBackup(cwd, suggestion.id, recipe.allowedFiles);
      await deleteSuggestionBackup(cwd, suggestion.id);
      console.log(`↩ Rollback completed\n`);
    } catch (rollbackError) {
      console.error(`Rollback failed:`, rollbackError);
      console.error(`Backup preserved for manual recovery\n`);
    }

    await updateSuggestionStatus(cwd, suggestion.id, "failed");
    await appendHistoryEvent(cwd, { ...suggestion, status: "failed" }, "failed");

    throw error;
  }
}