🌎 **Language:** [English](#english) | [Português](#português)

---

# English

# ArchLens

> Architecture health analyzer for JavaScript and TypeScript projects.

ArchLens detects structural problems that traditional code quality tools ignore.

- Dependency cycles
- Coupling hotspots
- Fan-in / Fan-out imbalance
- Structural instability
- Architecture Health Score (0–100)

> Code quality tools analyze lines.  
> **ArchLens analyzes structure.**

---

## 🚀 Quick Start

Run directly with npx:

```bash
npx archlens analyze .
```

Or install globally:

```bash
npm install -g archlens
archlens analyze .
```

---

## 📊 Example Output

```
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
```

---

## 🧮 Architecture Health Score

ArchLens starts at **100** and applies penalties for:

- Circular dependencies
- High coupling density
- Excessive fan-out modules

| Score | Status   |
|--------|----------|
| 80–100 | Healthy  |
| 60–79  | Warning  |
| 0–59   | Critical |

---

## 🧩 Under the Hood

ArchLens performs static structural analysis:

1. Collects project files (TS/JS)
2. Extracts imports via AST parsing (Babel)
3. Builds a directed dependency graph
4. Detects cycles using Tarjan’s Algorithm (SCC)
5. Computes structural metrics:
   - `fanIn`
   - `fanOut`
   - `instability = fanOut / (fanIn + fanOut)`
   - `dangerScore = fanIn × fanOut`
6. Generates an Architecture Health Score

**Cycle detection complexity:** `O(V + E)`

---

## 📌 Why ArchLens?

Most tools measure:

- Code style
- Lint rules
- Test coverage

ArchLens measures:

- Structural integrity
- Architectural risk
- Coupling dynamics
- Long-term maintainability

---

## 📜 License

MIT

---

# Português

# ArchLens

> Analisador de saúde arquitetural para projetos JavaScript e TypeScript.

O ArchLens detecta problemas estruturais que ferramentas tradicionais de qualidade de código não enxergam.

- Ciclos de dependência
- Pontos de alto acoplamento
- Desequilíbrio de fan-in / fan-out
- Instabilidade estrutural
- Score de saúde arquitetural (0–100)

> Ferramentas de qualidade analisam linhas.  
> **O ArchLens analisa a estrutura.**

---

## 🚀 Início Rápido

Execute diretamente com npx:

```bash
npx archlens analyze .
```

Ou instale globalmente:

```bash
npm install -g archlens
archlens analyze .
```

---

## 📊 Exemplo de Saída

```
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
```

---

## 🧮 Score de Saúde Arquitetural

O ArchLens inicia em **100** e aplica penalidades para:

- Dependências circulares
- Alto acoplamento
- Módulos com fan-out excessivo

| Score | Status   |
|--------|----------|
| 80–100 | Saudável |
| 60–79  | Atenção  |
| 0–59   | Crítico  |

---

## 🧩 Como Funciona

O ArchLens realiza análise estrutural estática:

1. Varre arquivos TS/JS
2. Extrai imports via parsing de AST (Babel)
3. Constrói um grafo direcionado de dependências
4. Detecta ciclos com o algoritmo de Tarjan (SCC)
5. Calcula métricas estruturais:
   - `fanIn`
   - `fanOut`
   - `instabilidade = fanOut / (fanIn + fanOut)`
   - `dangerScore = fanIn × fanOut`
6. Gera o Score de Saúde Arquitetural

**Complexidade para detecção de ciclos:** `O(V + E)`

---

## 📜 Licença

MIT