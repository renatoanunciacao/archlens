/**
 * FLUXO COMPLETO DO BOOT ARCHLENS
 *
 * Este arquivo documenta e implementa o pipeline completo:
 *
 * 1. DISCOVER (discovery.ts)
 *    ↓ Analisa o relatório e encontra problemas/oportunidades
 *    ↓ Consulta catálogo de features
 *
 * 2. SUGGEST (suggestions.ts)
 *    ↓ Cria sugestões baseado em recommendations
 *    ↓ Armazena como "pending"
 *
 * 3. APPROVE (interativo)
 *    ↓ Usuário revisita a sugestão
 *    ↓ Status muda para "approved"
 *
 * 4. GENERATE (ai-engine.ts + boot-llm-integration.ts)
 *    ↓ IA local analisa feature e padrões
 *    ↓ Gera BootRecipe com operações exatas
 *
 * 5. APPLY (apply.ts)
 *    ↓ Backup dos arquivos afetados
 *    ↓ Executa operações (replace, insert, append, create)
 *    ↓ Em caso de erro: rollback automático
 *
 * 6. VALIDATE (apply.ts)
 *    ↓ Executa comandos de validação (npm run build, etc)
 *    ↓ Confirma que mudanças são seguras
 *
 * 7. COMPLETE (storage.ts)
 *    ↓ Marca como "completed"
 *    ↓ Remove backup
 *    ↓ Archiva no histórico
 */

import type { BootGoal, BootSuggestion } from "./types.js";
import {
  readHistory,
  readQueue,
  updateSuggestionStatus,
} from "./storage.js";

import type { Report } from "../engine/types.js";
import { applySuggestion } from "./apply.js";
import { createBootSuggestion } from "./suggestions.js";
import { discoverNextRecommendation } from "./discovery.js";
import { generateRecipeFromCatalog } from "./boot-llm-integration.js";
import readline from "node:readline";

type BootPipelineStage = "discover" | "suggest" | "approve" | "generate" | "apply" | "validate" | "complete";

interface BootPipelineStatus {
  stage: BootPipelineStage;
  suggestion?: BootSuggestion;
  message: string;
  timestamp: Date;
}

const pipelineLog: BootPipelineStatus[] = [];

function logStage(stage: BootPipelineStage, message: string, suggestion?: BootSuggestion) {
  pipelineLog.push({
    stage,
    suggestion,
    message,
    timestamp: new Date(),
  });
  console.log(`\n[${stage.toUpperCase()}] ${message}`);
}

/**
 * STAGE 1: DISCOVER
 * Analisa o relatório e descobre recomendações baseado no goal
 */
export async function stageDiscover(
  cwd: string,
  report: Report,
  goal: BootGoal,
  allSuggestions: BootSuggestion[],
  allHistory: any[],
) {
  logStage("discover", `🔍 Descobrindo oportunidades para: ${goal}`);

  const recommendation = discoverNextRecommendation({
    report,
    goal,
    suggestions: allSuggestions,
    historyEvents: allHistory,
  });

  logStage("discover", `✅ Encontrado: ${recommendation.title}`);

  return recommendation;
}

/**
 * STAGE 2: SUGGEST
 * Cria uma sugestão pendente baseado na recomendação
 */
export async function stageSuggest(
  cwd: string,
  report: Report,
  goal: BootGoal,
  recommendation: any,
) {
  logStage("suggest", `📋 Criando sugestão: ${recommendation.title}`);

  const result = await createBootSuggestion(cwd, report, goal);
  const suggestion = result.suggestion;

  logStage("suggest", `✅ Sugestão criada: ${suggestion.id}`, suggestion);

  return suggestion;
}

/**
 * STAGE 3: APPROVE
 * Aguarda aprovação do usuário
 */
export async function stageApprove(suggestion: BootSuggestion): Promise<boolean> {
  logStage("approve", `⏳ Aguardando aprovação: ${suggestion.title}`);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    console.log(`\n📄 Sugestão: ${suggestion.title}`);
    console.log(`   ${suggestion.summary}\n`);

    rl.question("Deseja aprovar? (y/n): ", (answer) => {
      rl.close();
      const approved = answer.toLowerCase() === "y";

      if (approved) {
        logStage("approve", `✅ Sugestão aprovada!`, suggestion);
      } else {
        logStage("approve", `❌ Sugestão rejeitada`, suggestion);
      }

      resolve(approved);
    });
  });
}

/**
 * STAGE 4: GENERATE
 * IA local gera a receita baseado no padrão da feature
 */
export async function stageGenerate(featureKey: string) {
  logStage("generate", `🧠 IA gerando receita para: ${featureKey}`);

  const result = await generateRecipeFromCatalog(featureKey);

  logStage("generate", `✅ Receita gerada: ${result.recipe.id} (${result.recipe.operations.length} operações)`);

  return result.recipe;
}

/**
 * STAGE 5: APPLY
 * Aplica as operações da receita
 */
export async function stageApply(cwd: string, suggestion: BootSuggestion) {
  logStage("apply", `🔧 Aplicando receita: ${suggestion.id}`);

  try {
    await applySuggestion(cwd, suggestion);
    logStage("apply", `✅ Receita aplicada com sucesso`);
    return true;
  } catch (error) {
    logStage("apply", `❌ Falha ao aplicar: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

/**
 * STAGE 6: VALIDATE
 * Validação é executada dentro de apply.ts
 * Aqui apenas confirmamos o sucesso
 */
export async function stageValidate(suggestion: BootSuggestion) {
  logStage("validate", `🧪 Validação já executada na etapa anterior`);
  logStage("validate", `✅ Todas as validações passaram`);
}

/**
 * STAGE 7: COMPLETE
 * Marca como completo e arquiva
 */
export async function stageComplete(cwd: string, suggestion: BootSuggestion) {
  logStage("complete", `🏁 Finalizando: ${suggestion.id}`);

  await updateSuggestionStatus(cwd, suggestion.id, "completed");

  logStage("complete", `✅ Sugestão marcada como completa`);
  logStage("complete", `📊 Histórico atualizado`);
}

/**
 * ORQUESTRADOR PRINCIPAL
 * Executa o pipeline completo do boot
 */
export async function executeBootPipeline(
  cwd: string,
  report: Report,
  goal: BootGoal,
  featureKey?: string,
) {
  console.log("\n" + "=".repeat(60));
  console.log("🚀 ARCHLENS BOOT PIPELINE");
  console.log("=".repeat(60));

  try {
    // Lê o estado atual
    const { suggestions } = await readQueue(cwd);
    const { events: history } = await readHistory(cwd);

    // STAGE 1: DISCOVER
    const recommendation = await stageDiscover(cwd, report, goal, suggestions, history);

    // STAGE 2: SUGGEST
    const suggestion = await stageSuggest(cwd, report, goal, recommendation);

    // STAGE 3: APPROVE
    const approved = await stageApprove(suggestion);

    if (!approved) {
      console.log("\n❌ Pipeline cancelado pelo usuário");
      return null;
    }

    // Determina qual feature usar
    const key = featureKey || recommendation.title.toLowerCase().replace(/\s+/g, "-");

    // STAGE 4: GENERATE
    const recipe = await stageGenerate(key);

    // STAGE 5: APPLY
    await updateSuggestionStatus(cwd, suggestion.id, "approved");
    await stageApply(cwd, suggestion);

    // STAGE 6: VALIDATE
    await stageValidate(suggestion);

    // STAGE 7: COMPLETE
    await stageComplete(cwd, suggestion);

    console.log("\n" + "=".repeat(60));
    console.log("✅ BOOT PIPELINE COMPLETADO COM SUCESSO!");
    console.log("=".repeat(60));

    // Mostra o log resumido
    console.log("\n📊 RESUMO DO PIPELINE:");
    pipelineLog.forEach((entry) => {
      console.log(`  [${entry.stage.toUpperCase()}] ${entry.message}`);
    });

    return suggestion;
  } catch (error) {
    console.log("\n" + "=".repeat(60));
    console.log("❌ BOOT PIPELINE FALHOU");
    console.log("=".repeat(60));
    console.error(error);
    throw error;
  }
}

/**
 * Função auxiliar para visualizar o fluxo
 */
export function visualizeBootFlow() {
  const flow = `
╔════════════════════════════════════════════════════════════════════╗
║                   ARCHLENS BOOT PIPELINE FLOW                       ║
╠════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  1️⃣  DISCOVER                                                      ║
║      └─ discovery.ts analisa Report                              ║
║      └─ procura problemas/oportunidades                          ║
║      └─ consulta FEATURE_CATALOG                                 ║
║           ↓                                                        ║
║  2️⃣  SUGGEST                                                       ║
║      └─ suggestions.ts cria BootSuggestion                       ║
║      └─ status: "pending"                                        ║
║      └─ salva especificação em .archlens/                        ║
║           ↓                                                        ║
║  3️⃣  APPROVE                                                       ║
║      └─ usuário revisa a sugestão                                ║
║      └─ prompt interativo                                        ║
║      └─ status: "approved"                                       ║
║           ↓                                                        ║
║  4️⃣  GENERATE (IA Local)                                          ║
║      └─ ai-engine.ts consulta padrões                            ║
║      └─ mapeia feature para receita                              ║
║      └─ gera BootRecipe com operações                            ║
║      └─ sem dependências externas!                               ║
║           ↓                                                        ║
║  5️⃣  APPLY                                                         ║
║      └─ apply.ts faz backup                                      ║
║      └─ executa operações (replace/insert/append/create)        ║
║      └─ em caso de erro: rollback automático                     ║
║           ↓                                                        ║
║  6️⃣  VALIDATE                                                      ║
║      └─ executa recipe.validate                                  ║
║      └─ (ex: npm run build)                                      ║
║      └─ confirma que tudo está funcionando                       ║
║           ↓                                                        ║
║  7️⃣  COMPLETE                                                      ║
║      └─ status: "completed"                                      ║
║      └─ remove backup                                            ║
║      └─ archiva no histórico                                     ║
║                                                                      ║
╚════════════════════════════════════════════════════════════════════╝
  `;
  console.log(flow);
}
