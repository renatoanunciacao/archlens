import type { BootHistoryEvent, BootRecipe, BootSuggestion, FeatureStatus } from "./types.js";

import fs from "node:fs/promises";
import path from "node:path";

type QueueFile = {
  suggestions: BootSuggestion[];
};

type HistoryFile = {
    events: BootHistoryEvent[];
}


const ARCHLENS_DIR = ".archlens";
const SPECS_DIR = "specs";
const PLANS_DIR = "plans";
const RECIPES_DIR = "recipes";
const QUEUE_FILE = "queue.json";
const HISTORY_FILE = "history.json";

export function getBootBaseDir(cwd: string) {
  return path.join(cwd, ARCHLENS_DIR);
}

export function getSpecsDir(cwd: string) {
  return path.join(getBootBaseDir(cwd), SPECS_DIR);
}

export function getPlansDir(cwd: string) {
  return path.join(getBootBaseDir(cwd), PLANS_DIR);
}

export function getRecipesDir(cwd: string) {
  return path.join(getBootBaseDir(cwd), RECIPES_DIR);
}

export function getQueuePath(cwd: string) {
  return path.join(getBootBaseDir(cwd), QUEUE_FILE);
}

export function getHistoryPath(cwd: string) {
  return path.join(getBootBaseDir(cwd), HISTORY_FILE);
}

export function getBackupsDir(cwd: string) {
  return path.join(getBootBaseDir(cwd), "backups");
}

export function getSuggestionBackupDir(cwd: string, id: string) {
  return path.join(getBackupsDir(cwd), id);
}

export async function ensureBootDirs(cwd: string) {
  await fs.mkdir(getSpecsDir(cwd), { recursive: true });
  await fs.mkdir(getPlansDir(cwd), { recursive: true });
  await fs.mkdir(getRecipesDir(cwd), { recursive: true });
  await fs.mkdir(getBackupsDir(cwd), { recursive: true });
}

export async function readQueue(cwd: string): Promise<QueueFile> {
  const queuePath = getQueuePath(cwd);

  try {
    const raw = await fs.readFile(queuePath, "utf8");
    return JSON.parse(raw) as QueueFile;
  } catch {
    return { suggestions: [] };
  }
}

export async function writeQueue(cwd: string, queue: QueueFile) {
  await ensureBootDirs(cwd);
  await fs.writeFile(getQueuePath(cwd), JSON.stringify(queue, null, 2), "utf8");
}


export async function readHistory(cwd: string): Promise<HistoryFile> {
  const historyPath = getHistoryPath(cwd);

  try {
    const raw = await fs.readFile(historyPath, "utf8");
    return JSON.parse(raw) as HistoryFile;
  } catch {
    return { events: [] };
  }
}

export async function writeHistory(cwd: string, history: HistoryFile) {
  await ensureBootDirs(cwd);
  await fs.writeFile(
    getHistoryPath(cwd),
    JSON.stringify(history, null, 2),
    "utf8",
  );
}

export async function readRecipe(cwd: string, id: string): Promise<BootRecipe> {
   const recipePath = path.join(getRecipesDir(cwd), `${id}.json`);
   console.log("DEBUG recipePath:", recipePath);
  const raw = await fs.readFile(recipePath, "utf8");
  return JSON.parse(raw) as BootRecipe;
}

export function nextSuggestionId(existing: BootSuggestion[]) {
  const next = existing.length + 1;
  return `ALX-${String(next).padStart(3, "0")}`;
}

export async function saveSuggestionArtifacts(
  cwd: string,
  suggestion: BootSuggestion,
  specContent: string,
  planContent: string,
  recipe?: BootRecipe
) {
  await ensureBootDirs(cwd);

  const specPath = path.join(getSpecsDir(cwd), `${suggestion.id}.md`);
  const planPath = path.join(getPlansDir(cwd), `${suggestion.id}.md`);
  const recipePath = path.join(getRecipesDir(cwd), `${suggestion.id}.json`);

  await fs.writeFile(specPath, specContent, "utf8");
  await fs.writeFile(planPath, planContent, "utf8");
  
  // Recipe será gerada depois no pipeline (stage GENERATE)
  if (recipe) {
    await fs.writeFile(recipePath, JSON.stringify(recipe, null, 2), "utf8");
  }

  return {
    specPath,
    planPath,
    recipePath,
  };
}

export async function addSuggestion(cwd: string, suggestion: BootSuggestion) {
  const queue = await readQueue(cwd);
  queue.suggestions.push(suggestion);
  await writeQueue(cwd, queue);
}

export async function updateSuggestionStatus(
  cwd: string,
  id: string,
  status: FeatureStatus,
) {
  const queue = await readQueue(cwd);
  const item = queue.suggestions.find((s) => s.id === id);

  if (!item) {
    throw new Error(`Suggestion "${id}" not found`);
  }

  item.status = status;
  await writeQueue(cwd, queue);

  return item;
}

export async function appendHistoryEvent(
  cwd: string,
  suggestion: BootSuggestion,
  decision: Exclude<FeatureStatus, "pending">,
) {
  const history = await readHistory(cwd);

  history.events.push({
    id: suggestion.id,
    goal: suggestion.goal,
    title: suggestion.title,
    summary: suggestion.summary,
    decision,
    createdAt: suggestion.createdAt,
    resolvedAt: new Date().toISOString(),
    specPath: suggestion.specPath,
    planPath: suggestion.planPath,
    recipePath: suggestion.recipePath,
  });

  await writeHistory(cwd, history);
}

export async function markSuggestionDecision(
  cwd: string,
  id: string,
  decision: Exclude<FeatureStatus, "pending">,
) {
  const suggestion = await updateSuggestionStatus(cwd, id, decision);
  await appendHistoryEvent(cwd, suggestion, decision);
  return suggestion;
}

export async function findSuggestion(cwd: string, id: string) {
  const queue = await readQueue(cwd);
  return queue.suggestions.find((s) => s.id === id) ?? null;
}

export async function backupFiles(
  cwd: string,
  id: string,
  files: string[],
) {
  const backupDir = getSuggestionBackupDir(cwd, id);
  await fs.mkdir(backupDir, { recursive: true });

  for (const file of files) {
    const abs = path.join(cwd, file);

    try {
      const content = await fs.readFile(abs);
      const safeName = file.replace(/[\/\\]/g, "__");

      await fs.writeFile(
        path.join(backupDir, `${safeName}.bak`),
        content,
      );
    } catch {
      // arquivo pode não existir ainda
    }
  }
}

export async function restoreBackup(
  cwd: string,
  id: string,
  files: string[],
) {
  const backupDir = getSuggestionBackupDir(cwd, id);

  for (const file of files) {
    const safeName = file.replace(/[\/\\]/g, "__");
    const backupFile = path.join(backupDir, `${safeName}.bak`);
    const target = path.join(cwd, file);

    try {
      const content = await fs.readFile(backupFile);
      await fs.writeFile(target, content);
    } catch {
      // backup não existe
    }
  }
}

export async function deleteSuggestionBackup(cwd: string, id: string) {
  const backupDir = getSuggestionBackupDir(cwd, id);
  await fs.rm(backupDir, { recursive: true, force: true });
}
