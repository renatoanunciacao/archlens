import { FEATURE_CATALOG, type FeatureCandidate } from "./catalog.js";
import { type BootRecipe } from "./types.js";
import {
  generateRecipeWithAI,
  generateTemplateRecipe,
  analyzeProjectStructure,
} from "./ai-engine.js";
import fs from "node:fs/promises";
import path from "node:path";
import readline from "node:readline";

export type LlmRecipeGenerationResult = {
  recipe: BootRecipe;
  feature: FeatureCandidate;
  analysis?: string;
};

export async function generateRecipeFromCatalog(
  featureKey: string,
): Promise<LlmRecipeGenerationResult> {
  const feature = FEATURE_CATALOG.find(f => f.key === featureKey);

  if (!feature) {
    throw new Error(
      `Feature "${featureKey}" não encontrada. Use --list para ver as disponíveis.`,
    );
  }

  console.log(`\n📋 Gerando receita para: ${feature.title}`);
  console.log(`   Meta: ${feature.goal} | Impacto: ${feature.impact} | Esforço: ${feature.effort}`);

  try {
    let recipe: BootRecipe;

    // Tenta usar a IA com padrão conhecido
    try {
      recipe = await generateRecipeWithAI(feature);
    } catch (error) {
      // Se não tem padrão, gera um template genérico
      console.log("⚠️  Usando template genérico para essa feature");
      recipe = await generateTemplateRecipe(feature);
    }

    console.log("✅ Receita gerada com sucesso!");

    // Analisa o projeto para contexto adicional
    const analysis = await analyzeProjectStructure(process.cwd());

    return {
      recipe,
      feature,
      analysis: `Projeto detectado com TypeScript: ${analysis.hasTypeScript}`,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Erro ao gerar receita: ${error.message}`);
    }
    throw error;
  }
}

export async function listAvailableFeatures(): Promise<void> {
  console.log("\n🎯 CATÁLOGO DE FEATURES DISPONÍVEIS:\n");
  FEATURE_CATALOG.forEach((feature, index) => {
    const icon = feature.impact === "high" ? "⭐" : feature.impact === "medium" ? "◆" : "●";
    console.log(`${icon} ${index + 1}. ${feature.key}`);
    console.log(`   Título: ${feature.title}`);
    console.log(`   Meta: ${feature.goal} | Impacto: ${feature.impact} | Esforço: ${feature.effort}`);
    console.log(`   Resumo: ${feature.summary}`);
    console.log();
  });
}

export async function saveRecipeToFile(
  recipe: BootRecipe,
  cwd: string,
  suggestionId?: string,
): Promise<string> {
  const recipeDir = path.join(cwd, ".archlens", "recipes");
  await fs.mkdir(recipeDir, { recursive: true });

  // Usa o suggestionId se fornecido (para apply encontrar), senão usa recipe.id
  const fileId = suggestionId || recipe.id;
  const filePath = path.join(recipeDir, `${fileId}.json`);
  await fs.writeFile(filePath, JSON.stringify(recipe, null, 2), "utf8");

  return filePath;
}

export async function interactiveFeatureSelection(): Promise<FeatureCandidate> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve, reject) => {
    console.log("\n🔢 Selecione uma feature pelo número:\n");

    FEATURE_CATALOG.forEach((feature, index) => {
      console.log(`${index + 1}. ${feature.title}`);
      console.log(`   ${feature.summary}`);
      console.log();
    });

    rl.question("Digite o número (1-" + FEATURE_CATALOG.length + "): ", (answer) => {
      rl.close();
      const index = parseInt(answer, 10) - 1;

      if (index < 0 || index >= FEATURE_CATALOG.length) {
        reject(new Error("Seleção inválida"));
      }

      resolve(FEATURE_CATALOG[index]);
    });
  });
}
