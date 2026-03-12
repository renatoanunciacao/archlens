/**
 * EXEMPLO PRÁTICO: IMPLEMENTAÇÃO COMPLETA DE UMA FEATURE
 *
 * Este arquivo demonstra como a IA gera recipes e codifica automaticamente
 * uma nova feature, ponta a ponta.
 *
 * ============================================================================
 * CENÁRIO: Implementar a feature "mermaid-all"
 * ============================================================================
 */

import type { BootRecipe, RecipeOperation } from "./types.js";

// ============================================================================
// PASSO 1: FEATURE DESCOBERTA (Feature Catalog)
// ============================================================================
const FEATURE_MERMAID_ALL = {
  key: "mermaid-all",
  title: "Mermaid all command",
  summary:
    "Add a combined Mermaid output mode to generate score, danger, and cycles in a single command.",
  goal: "next-feature" as const,
  impact: "high" as const,
  effort: "low" as const,
  filesToChange: ["src/main.ts", "reporters/mermaidReporter.ts"],
  implementationSteps: [
    'Extend the mermaid command to accept "all".',
    'Update MermaidGraphType to include "all".',
    "Concatenate score, danger, and cycles outputs.",
    "Validate with build.",
  ],
  acceptanceCriteria: [
    "archlens mermaid all . runs successfully",
    "Output contains score, danger, and cycles sections",
    "Existing Mermaid subcommands continue working",
  ],
};

// ============================================================================
// PASSO 2: IA GERA RECIPE COM PADRÕES PRÉ-DEFINIDOS (ai-engine.ts)
// ============================================================================

/**
 * A IA local (ai-engine.ts) tem PADRÕES pré-definidos para features.
 * Quando "mermaid-all" é solicitada, ela consulta seu banco de padrões:
 */
const GENERATED_RECIPE: BootRecipe = {
  id: "mermaid-all",
  title: "Mermaid all command",
  allowedFiles: ["src/main.ts", "reporters/mermaidReporter.ts"],

  // Estas operações são GERADAS automaticamente pela IA local
  operations: [
    // OPERAÇÃO 1: Adicionar "all" às opções permitidas
    {
      kind: "replace",
      file: "src/main.ts",
      find: 'const allowed = ["cycles", "danger", "score"];',
      replace: 'const allowed = ["cycles", "danger", "score", "all"];',
    },

    // OPERAÇÃO 2: Atualizar help text
    {
      kind: "replace",
      file: "src/main.ts",
      find: "Graph type (cycles|danger|score)",
      replace: "Graph type (cycles|danger|score|all)",
    },

    // OPERAÇÃO 3: Estender o tipo TypeScript
    {
      kind: "replace",
      file: "reporters/mermaidReporter.ts",
      find: 'export type MermaidGraphType = "cycles" | "danger" | "score";',
      replace:
        'export type MermaidGraphType = "cycles" | "danger" | "score" | "all";',
    },

    // OPERAÇÃO 4: Implementar lógica do novo tipo "all"
    {
      kind: "replace",
      file: "reporters/mermaidReporter.ts",
      find: `export function toMermaid(
  report: Report,
  graphType: MermaidGraphType = "cycles",
): string {
  if (graphType === "score") return toScoreMermaid(report);
  if (graphType === "danger") return toDangerMermaid(report);
  return toCyclesMermaid(report);
}`,
      replace: `export function toMermaid(
  report: Report,
  graphType: MermaidGraphType = "cycles",
): string {
  if (graphType === "score") return toScoreMermaid(report);
  if (graphType === "danger") return toDangerMermaid(report);
  if (graphType === "all") {
    return [
      toScoreMermaid(report),
      "",
      toDangerMermaid(report),
      "",
      toCyclesMermaid(report),
    ].join("\\n");
  }
  return toCyclesMermaid(report);
}`,
    },
  ],

  // Validações que garantem que o código está correto
  validate: ["npm run build"],
};

// ============================================================================
// PASSO 3: APPLY EXECUTA A RECIPE (apply.ts)
// ============================================================================

/**
 * Quando o usuário aprova, o apply.ts:
 *
 * 1. ✅ FAZ BACKUP dos arquivos:
 *    .archlens/backups/mermaid-all/
 *    ├── src/main.ts.bak
 *    └── reporters/mermaidReporter.ts.bak
 *
 * 2. ✅ EXECUTA CADA OPERAÇÃO:
 *    └─ Operação 1 (replace): "const allowed = ..." → "const allowed = ... "all"..."
 *    └─ Operação 2 (replace): "Graph type (cycles|danger|score)" → "...score|all)"
 *    └─ Operação 3 (replace): 'export type MermaidGraphType = "cycles" | ...'
 *    └─ Operação 4 (replace): Adiciona lógica if (graphType === "all") { ... }
 *
 * 3. ✅ VALIDA O RESULTADO:
 *    └─ Executa: npm run build
 *    └─ Se passar: continua
 *    └─ Se falhar: ROLLBACK automático!
 *
 * 4. ✅ LIMPA:
 *    └─ Remove backup (sucesso confirmado)
 *    └─ Marca sugestão como "completed"
 */

// ============================================================================
// VISUALIZAÇÃO DO RESULTADO FINAL
// ============================================================================

/**
 * ANTES (src/main.ts):
 * ───────────────────────────────────────────────────────────────
 * const allowed = ["cycles", "danger", "score"];
 * program.option("--graph <type>", "Graph type (cycles|danger|score)");
 *
 * DEPOIS (após IA aplicar recipe):
 * ───────────────────────────────────────────────────────────────
 * const allowed = ["cycles", "danger", "score", "all"];
 * program.option("--graph <type>", "Graph type (cycles|danger|score|all)");
 */

/**
 * ANTES (reporters/mermaidReporter.ts):
 * ───────────────────────────────────────────────────────────────
 * export type MermaidGraphType = "cycles" | "danger" | "score";
 *
 * export function toMermaid(
 *   report: Report,
 *   graphType: MermaidGraphType = "cycles",
 * ): string {
 *   if (graphType === "score") return toScoreMermaid(report);
 *   if (graphType === "danger") return toDangerMermaid(report);
 *   return toCyclesMermaid(report);
 * }
 *
 * DEPOIS (após IA aplicar recipe):
 * ───────────────────────────────────────────────────────────────
 * export type MermaidGraphType = "cycles" | "danger" | "score" | "all";
 *
 * export function toMermaid(
 *   report: Report,
 *   graphType: MermaidGraphType = "cycles",
 * ): string {
 *   if (graphType === "score") return toScoreMermaid(report);
 *   if (graphType === "danger") return toDangerMermaid(report);
 *   if (graphType === "all") {
 *     return [
 *       toScoreMermaid(report),
 *       "",
 *       toDangerMermaid(report),
 *       "",
 *       toCyclesMermaid(report),
 *     ].join("\n");
 *   }
 *   return toCyclesMermaid(report);
 * }
 */

// ============================================================================
// PASSO 4: VALIDAÇÃO (npm run build)
// ============================================================================

/**
 * O TypeScript compila com sucesso:
 *
 * ✅ src/main.ts compila
 * ✅ reporters/mermaidReporter.ts compila
 * ✅ Tipos estão corretos
 * ✅ Funcionalidade funciona
 */

// ============================================================================
// PASSO 5: CONCLUSÃO
// ============================================================================

/**
 * Resultado final:
 * ════════════════════════════════════════════════════════════════
 *
 * ✅ Feature "mermaid-all" está IMPLEMENTADA
 * ✅ Código está VALIDADO (npm run build passou)
 * ✅ Sugestão marcada como COMPLETED
 * ✅ Pronta para usar: archlens mermaid all .
 *
 * ════════════════════════════════════════════════════════════════
 */

// ============================================================================
// DOCUMENTAÇÃO DO FLUXO COMPLETO
// ============================================================================

export function printBootFlowExample() {
  console.log(`
╔════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║         🤖 IA ARCHLENS: GERAÇÃO + CODIFICAÇÃO AUTOMÁTICA          ║
║                                                                      ║
╚════════════════════════════════════════════════════════════════════╝

┌─ ENTRADA ─────────────────────────────────────────────────────────┐
│                                                                    │
│  Feature: "mermaid-all"                                           │
│  Descrição: Add combined Mermaid output (score + danger + cycles) │
│  Impact: HIGH | Effort: LOW                                       │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
                                ↓
        ┌──────────────────────────────────────────────┐
        │  🧠 IA LOCAL (ai-engine.ts)                 │
        │                                              │
        │  Consulta PADRÕES pré-definidos:            │
        │  • Arquivo: src/main.ts                     │
        │  • Arquivo: reporters/mermaidReporter.ts    │
        │                                              │
        │  Gera BootRecipe com 4 operações:           │
        │  1. Replace: adiciona "all" ao array        │
        │  2. Replace: atualiza help text             │
        │  3. Replace: estende tipo TypeScript        │
        │  4. Replace: implementa lógica if all       │
        │                                              │
        └──────────────────────────────────────────────┘
                                ↓
        ┌──────────────────────────────────────────────┐
        │  🔧 APPLY (apply.ts)                        │
        │                                              │
        │  1. ✅ BACKUP dos arquivos                  │
        │  2. ✅ EXECUTA operações (replace...)       │
        │  3. ✅ VALIDA (npm run build)               │
        │  4. ✅ LIMPA backup                         │
        │                                              │
        └──────────────────────────────────────────────┘
                                ↓
┌─ SAÍDA ───────────────────────────────────────────────────────────┐
│                                                                    │
│  ✅ Código atualizado com sucesso!                               │
│                                                                    │
│  src/main.ts:                                                     │
│    const allowed = ["cycles", "danger", "score", "all"];         │
│                                                                    │
│  reporters/mermaidReporter.ts:                                   │
│    export type MermaidGraphType = ... | "all";                  │
│    if (graphType === "all") { /* implementação */ }             │
│                                                                    │
│  Status: COMPLETED ✅                                             │
│  Usando agora: \`archlens mermaid all .\`                         │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
  `);
}

// ============================================================================
// COMPARAÇÃO: IA vs Manual
// ============================================================================

export function printComparison() {
  console.log(`
╔════════════════════════════════════════════════════════════════════╗
║                    ANTES vs DEPOIS                                 ║
╠════════════════════════════════════════════════════════════════════╣

❌ SEM IA (Manual):
   1. Dev lê a descrição da feature
   2. Dev analisa quais arquivos modificar
   3. Dev escreve código manualmente
   4. Dev executa testes
   5. Dev corrige erros
   6. Tempo total: 30-60 minutos
   - Risco de bugs
   - Processo repetitivo

✅ COM IA ARCHLENS:
   1. IA descobre feature automaticamente
   2. IA gera padrão (recipe) deterministicamente
   3. IA aplica mudanças com backup/rollback
   4. IA valida com npm run build
   5. IA marca como completo
   6. Tempo total: < 30 segundos
   - Zero risco (com rollback)
   - Completamente automático
   - Padrões reutilizáveis

╚════════════════════════════════════════════════════════════════════╝
  `);
}

export default {
  FEATURE_MERMAID_ALL,
  GENERATED_RECIPE,
  printBootFlowExample,
  printComparison,
};
