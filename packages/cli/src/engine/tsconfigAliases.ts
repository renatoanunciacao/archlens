import fs from "node:fs/promises";
import path from "node:path";

export type AliasRule = {
  // Ex: "@/ *" (sem espaço) => prefix="@/"
  prefix: string;
  // Ex: "src/*" => targetPrefix="src/"
  targetPrefix: string;
};

type TsConfig = {
  compilerOptions?: {
    baseUrl?: string;
    paths?: Record<string, string[]>;
  };
};

async function readJsonIfExists(filePath: string): Promise<any | null> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function normalizeStarPattern(p: string) {
  // "@/*" => {prefix:"@/", hasStar:true}
  // "src/*" => {targetPrefix:"src/", hasStar:true}
  const hasStar = p.includes("*");
  const prefix = p.replaceAll("*", "");
  return { prefix, hasStar };
}

export async function loadAliasRules(cwd: string): Promise<AliasRule[]> {
  const tsconfigPath = path.join(cwd, "tsconfig.json");
  const jsconfigPath = path.join(cwd, "jsconfig.json");

  const tsconfig = (await readJsonIfExists(tsconfigPath)) ?? (await readJsonIfExists(jsconfigPath));
  if (!tsconfig) return [];

  const cfg = tsconfig as TsConfig;
  const pathsMap = cfg.compilerOptions?.paths ?? {};
  // baseUrl pode existir (e você já adicionou), mas pro nosso caso de @/* não é obrigatório.
  // Mesmo assim, mantemos para futuro.
  const baseUrl = cfg.compilerOptions?.baseUrl ?? ".";

  const rules: AliasRule[] = [];

  for (const [fromPattern, toPatterns] of Object.entries(pathsMap)) {
    if (!Array.isArray(toPatterns) || toPatterns.length === 0) continue;

    // Pegamos o primeiro target (MVP). Depois suportamos múltiplos.
    const toPattern = toPatterns[0];

    const from = normalizeStarPattern(fromPattern);
    const to = normalizeStarPattern(toPattern);

    // MVP: suportar só padrões com "*" do tipo "@/*": ["src/*"]
    // Se não tiver *, ainda dá pra suportar como prefixo direto, mas vamos aceitar os dois.
    const fromPrefix = from.prefix;
    const targetPrefix = to.prefix;

    // baseUrl: resolve "src/" relativo ao baseUrl (normalmente ".")
    // Ex: baseUrl="." e targetPrefix="src/" => "src/"
    // Ex: baseUrl="src" e targetPrefix="" => "src/"
    const resolvedTargetPrefix = path.posix
      .normalize(path.posix.join(baseUrl.replaceAll("\\", "/"), targetPrefix.replaceAll("\\", "/")))
      .replaceAll("\\", "/");

    rules.push({
      prefix: fromPrefix,
      targetPrefix: resolvedTargetPrefix.endsWith("/") ? resolvedTargetPrefix : `${resolvedTargetPrefix}/`
    });
  }

  // Ordena por prefixo mais longo primeiro (evita conflito entre "@/" e "@shared/")
  rules.sort((a, b) => b.prefix.length - a.prefix.length);

  return rules;
}

export function resolveAliasImport(spec: string, rules: AliasRule[]): string | null {
  for (const r of rules) {
    if (spec.startsWith(r.prefix)) {
      const rest = spec.slice(r.prefix.length); // o que vem depois do prefixo
      // Ex: "@/app/types/product" => "src/app/types/product"
      const candidateBase = (r.targetPrefix + rest).replaceAll("\\", "/");
      // removendo "//" acidentais
      return candidateBase.replaceAll("//", "/");
    }
  }
  return null;
}