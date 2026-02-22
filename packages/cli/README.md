Language: English | Português
English
ArchLens
Architecture health analyzer for JavaScript and TypeScript projects.
ArchLens detects structural problems that most code quality tools ignore:
Dependency cycles
Coupling hotspots
Fan-in / Fan-out imbalance
Structural instability
Architecture Health Score (0–100)
Code quality tools analyze lines.
ArchLens analyzes structure.
🚀 Quick Start
Run directly with npx:
npx archlens analyze .
Or install globally:
npm install -g archlens
archlens analyze .
📊 Example Output
✅ ArchLens analysis complete
Project: my-app
Files analyzed: 124
Edges: 312

Architecture Health Score: 78/100 (B)
Status: Warning

Top Fan-in (critical modules):
  - 8 in | 1 out | src/domain/core.ts

Top Fan-out (unstable modules):
  - 1 in | 12 out | src/app/controller.ts

Danger (coupling hotspots):
  - 6 in | 7 out | src/services/userService.ts

Cycles detected: 1
  - cycle-1: A.ts -> B.ts -> C.ts -> A.ts
🧮 Architecture Health Score
ArchLens starts at 100 and applies penalties for:
Circular dependencies
High coupling density
Excessive fan-out modules
Score	Status
80–100	Healthy
60–79	Warning
0–59	Critical
🧩 Under the Hood
ArchLens performs static structural analysis:
Collects project files (TS/JS).
Extracts imports using AST parsing (Babel).
Builds a directed dependency graph.
Detects cycles using Tarjan’s Algorithm (SCC).
Computes structural metrics:
fanIn
fanOut
instability = fanOut / (fanIn + fanOut)
dangerScore = fanIn × fanOut
Generates an Architecture Health Score.
Cycle detection time complexity: O(V + E).
Português
ArchLens
Analisador de saúde arquitetural para projetos JavaScript e TypeScript.
O ArchLens detecta problemas estruturais que ferramentas tradicionais de qualidade de código não enxergam:
Ciclos de dependência
Pontos de alto acoplamento
Desequilíbrio de fan-in / fan-out
Instabilidade estrutural
Score de saúde arquitetural (0–100)
Ferramentas de qualidade analisam linhas.
O ArchLens analisa a estrutura.
🚀 Início Rápido
Execute diretamente com npx:
npx archlens analyze .
Ou instale globalmente:
npm install -g archlens
archlens analyze .
📊 Exemplo de Saída
✅ Análise concluída
Projeto: meu-app
Arquivos analisados: 124
Dependências: 312

Score de Saúde Arquitetural: 78/100 (B)
Status: Atenção

Top Fan-in (módulos críticos):
  - 8 in | 1 out | src/domain/core.ts

Top Fan-out (módulos instáveis):
  - 1 in | 12 out | src/app/controller.ts

Pontos de alto acoplamento:
  - 6 in | 7 out | src/services/userService.ts

Ciclos detectados: 1
  - cycle-1: A.ts -> B.ts -> C.ts -> A.ts
🧮 Score de Saúde Arquitetural
O ArchLens inicia em 100 e aplica penalidades para:
Dependências circulares
Alto acoplamento
Módulos com fan-out excessivo
Score	Status
80–100	Saudável
60–79	Atenção
0–59	Crítico
🧩 Como Funciona
O ArchLens realiza análise estrutural estática:
Varre os arquivos do projeto (TS/JS).
Extrai imports via parsing de AST (Babel).
Constrói um grafo direcionado de dependências.
Detecta ciclos usando o algoritmo de Tarjan (SCC).
Calcula métricas estruturais:
fanIn
fanOut
instabilidade = fanOut / (fanIn + fanOut)
dangerScore = fanIn × fanOut
Gera um Score de Saúde Arquitetural.