import type { BootSuggestion } from "./types.js";
import fs from "node:fs/promises";
import path from "node:path";

export type CandidateFile = {
  path: string;
  reason: string;
  content: string;
};

export type BootLlmContext = {
  suggestion: {
    id: string;
    title: string;
    summary: string;
    goal: string;
  };
  projectRoot: string;
  projectTree: string[];
  candidateFiles: CandidateFile[];
  constraints: string[];
};

const DEFAULT_IGNORE = new Set([
  "node_modules",
  "dist",
  ".git",
  ".archlens",
  "coverage",
  "build",
]);

async function walkProject(
  dir: string,
  root: string,
  results: string[],
): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (DEFAULT_IGNORE.has(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(root, fullPath);

    if (entry.isDirectory()) {
      results.push(`${relPath}/`);
      await walkProject(fullPath, root, results);
    } else {
      results.push(relPath);
    }
  }
}

async function getProjectTree(cwd: string): Promise<string[]> {
  const results: string[] = [];
  await walkProject(cwd, cwd, results);
  return results.sort();
}

async function safeReadFile(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch {
    return "";
  }
}

function scoreCandidate(filePath: string, content: string, suggestion: BootSuggestion) {
  let score = 0;
  const reasons: string[] = [];

  const lowerPath = filePath.toLowerCase();
  const lowerContent = content.toLowerCase();
  const title = suggestion.title.toLowerCase();
  const summary = suggestion.summary.toLowerCase();

  if (lowerPath.includes("main")) {
    score += 3;
    reasons.push("Path suggests CLI entrypoint");
  }

  if (lowerPath.includes("reporter")) {
    score += 3;
    reasons.push("Path suggests reporter implementation");
  }

  if (lowerContent.includes('command("mermaid")') || lowerContent.includes(".command(\"mermaid\")")) {
    score += 8;
    reasons.push('Contains mermaid command definition');
  }

  if (lowerContent.includes("tomermaid(") || lowerContent.includes("mermaidgraphtype")) {
    score += 8;
    reasons.push("Contains Mermaid reporter symbols");
  }

  if (title.includes("mermaid") && lowerContent.includes("mermaid")) {
    score += 4;
    reasons.push("Matches feature title keywords");
  }

  for (const token of summary.split(/\W+/).filter(Boolean)) {
    if (token.length >= 4 && lowerContent.includes(token.toLowerCase())) {
      score += 1;
    }
  }

  return {
    score,
    reason: reasons.join("; ") || "General relevance",
  };
}

async function getFileCandidates(
  cwd: string,
  tree: string[],
  suggestion: BootSuggestion,
): Promise<CandidateFile[]> {
  const filePaths = tree.filter(
    (item) =>
      !item.endsWith("/") &&
      (item.endsWith(".ts") ||
        item.endsWith(".tsx") ||
        item.endsWith(".js") ||
        item.endsWith(".jsx") ||
        item.endsWith(".json") ||
        item.endsWith(".md")),
  );

  const scored: Array<CandidateFile & { score: number }> = [];

  for (const relPath of filePaths) {
    const absPath = path.join(cwd, relPath);
    const content = await safeReadFile(absPath);
    const { score, reason } = scoreCandidate(relPath, content, suggestion);

    if (score > 0) {
      scored.push({
        path: relPath,
        reason,
        content: content.slice(0, 8000),
        score,
      });
    }
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(({ score: _score, ...rest }) => rest);
}

export async function buildLlmContext(
  cwd: string,
  suggestion: BootSuggestion,
): Promise<BootLlmContext> {
  const projectTree = await getProjectTree(cwd);
  const candidateFiles = await getFileCandidates(cwd, projectTree, suggestion);

  return {
    suggestion: {
      id: suggestion.id,
      title: suggestion.title,
      summary: suggestion.summary,
      goal: suggestion.goal,
    },
    projectRoot: cwd,
    projectTree: projectTree.slice(0, 300),
    candidateFiles,
    constraints: [
      "Return valid JSON only.",
      "Use only files that are truly necessary.",
      "Prefer existing command and reporter files.",
      "Do not include markdown fences.",
      "Use only these operation kinds: replace, insertAfter, append, createFile.",
      "Validation must include npm run build.",
    ],
  };
}