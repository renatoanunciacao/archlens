import {
  generateRecipeFromCatalog,
  interactiveFeatureSelection,
  listAvailableFeatures,
  saveRecipeToFile,
} from "./boot-llm-integration.js";

async function main() {
  const args = process.argv.slice(2);

  // Comando: listar features
  if (args.includes("--list") || args.includes("-l")) {
    await listAvailableFeatures();
    return;
  }

  // Comando: gerar receita para uma feature específica
  let featureKey = args[0];

  if (!featureKey) {
    const feature = await interactiveFeatureSelection();
    featureKey = feature.key;
  }

  try {
    const result = await generateRecipeFromCatalog(featureKey);

    console.log("\n📦 RECEITA GERADA:\n");
    console.log(JSON.stringify(result.recipe, null, 2));

    if (result.analysis) {
      console.log(`\n📊 Análise: ${result.analysis}`);
    }

    const cwd = process.cwd();
    const savedPath = await saveRecipeToFile(result.recipe, cwd);

    console.log(`\n✅ Receita salva em: ${savedPath}`);
    console.log("\n💡 Próximo passo: aplique a receita com 'npm run boot:apply'");
  } catch (error) {
    if (error instanceof Error) {
      console.error(`\n❌ Erro: ${error.message}`);
    } else {
      console.error("\n❌ Erro desconhecido");
    }
    process.exit(1);
  }
}

main().catch(console.error);