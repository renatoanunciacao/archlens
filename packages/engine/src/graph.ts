import { candidatePaths, isRelative } from "./resolve.js";
import { loadAliasRules, resolveAliasImport } from "./tsconfigAliases.js";
import { parseImportsJS, parseImportsTS } from "./importParsers.js";

import type { Edge } from "./types.js";
import fs from "node:fs/promises";
import path from "node:path";

export async function buildGraph(params: {
  cwd: string;
  files: string[];
}): Promise<{ nodes: string[]; edges: Edge[] }> {
  const { cwd, files } = params;

  const fileSet = new Set(files);
  const edges: Edge[] = [];

  const aliasRules = await loadAliasRules(cwd);

  for (const file of files) {
    const abs = path.join(cwd, file);

    let text = "";
    try {
      text = await fs.readFile(abs, "utf8");
    } catch {
      continue;
    }

    const isTS = file.endsWith(".ts") || file.endsWith(".tsx");
    const specs = isTS ? parseImportsTS(text, file) : parseImportsJS(text);

    for (const spec of specs) {
      // 1) relativo: ./ ../
      if (isRelative(spec)) {
        const candidates = candidatePaths(file, spec);
        const target = candidates.find((c) => fileSet.has(c));
        if (target) edges.push({ from: file, to: target });
        continue;
      }

      // 2) alias: @/...
      const aliased = resolveAliasImport(spec, aliasRules);
      if (aliased) {
        // aqui "aliased" vira algo como "src/app/types/product"
        const candidates = [
          aliased,
          `${aliased}.ts`,
          `${aliased}.tsx`,
          `${aliased}.js`,
          `${aliased}.jsx`,
          `${aliased}/index.ts`,
          `${aliased}/index.tsx`,
          `${aliased}/index.js`,
          `${aliased}/index.jsx`
        ].map((p) => p.replaceAll("\\", "/"));

        const target = candidates.find((c) => fileSet.has(c));
        if (target) edges.push({ from: file, to: target });
      }
    }
  }

  const nodes = Array.from(new Set([...files, ...edges.flatMap((e) => [e.from, e.to])])).sort();
  return { nodes, edges };
}