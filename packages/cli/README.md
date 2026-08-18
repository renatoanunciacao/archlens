# ArchLens

> Architecture health analyzer for JavaScript and TypeScript projects.

ArchLens detects structural problems that traditional code quality tools often miss.

**Core Features:**
- Dependency cycles detection
- Coupling hotspots analysis  
- Fan-in / Fan-out imbalance detection
- Structural instability metrics
- **Architecture Health Score** (0–100)
- **Architecture Fit Score** — How well your project adheres to its recommended architecture profile
- **Problem Detection Engine** — Identifies 9+ types of architectural issues with evidence and suggested fixes
- Framework/technology fingerprinting (Next.js, Vite, Node, React, Vue, Svelte)
- Recommended architecture profiles based on project type (frontend/backend/fullstack)

> Code quality tools analyze lines.  
> **ArchLens analyzes structure.**

---

## ✨ What's New in v0.4+

### Architecture Fit Engine
Evaluates how well your project adheres to its recommended architecture profile. Computes a **Fit Score** (0-100) and provides actionable feedback:
- Layer presence validation
- Boundary adherence checking
- Coupling density analysis
- Cycle detection in architectural profiles

### Problem Detection Engine
Discovers 9+ architectural issues automatically:
- *Layering Problems* — Missing features layer, scattered utilities, infrastructure imports in domain
- *Coupling Problems* — God modules, circular dependencies, UI-service coupling, high density
- *Profile-Specific Issues* — Next.js Server/Client boundaries, dynamic import overhead

Each problem includes:
- Evidence (what signals triggered detection)
- Affected files (where the problem manifests)
- Suggested fixes (concrete next steps)

### Enhanced Reporters
- **Text Output** — Shows architecture health, fitness evaluation, problems found, and recommendations
- **JSON Output** — Complete structured data for dashboard integration
- **Detailed Evidence** — Why problems matter, affected files, and concrete suggestions

---

# 🚀 Quick Start

Run directly with **npx**:

```bash
npx archlens analyze .
```

Or install globally:

```bash
npm install -g archlens
archlens analyze .
```

# Supporting ArchLens

If ArchLens helped you analyze your project, consider giving the project a star on GitHub:
https://github.com/renatoanunciacao/archlens

# 📊 Example Output

```
✅ ArchLens analysis complete
Project: my-app
Files analyzed: 124
Dependencies: 312

Architecture Health Score: 78/100 (B)
Status: Architecture Warning

Architecture Fit Evaluation
Profile: next-app-router
Fit Status: PARTIAL (65/100)
Missing Layers: server
Unexpected Layers: utils

Fit Checks:
  ✅ Layer presence: All expected layers present
  ⚠️  Layer boundaries: Cross-layer imports 22% (threshold: 10%)
  ✅ No cycles: Zero dependency cycles detected

Top Fan-in (critical modules):
  - 8 in | 1 out | src/domain/core.ts

Top Fan-out (unstable modules):
  - 1 in | 12 out | src/app/controller.ts

Coupling hotspots:
  - 6 in | 7 out | src/services/userService.ts

Cycles detected: 1
  - cycle-1: A.ts -> B.ts -> C.ts -> A.ts

Architecture Problems (3 detected):
  ❌ Missing feature layer (HIGH)
     Business logic scattered across route components
     Suggestion: Create src/features directory structure
  
  ⚠️  High coupling density (MEDIUM)
     Average 5.2 dependencies per module (threshold: 3)
     Suggestion: Reorganize modules by architectural layers
```

---

# 🧰 CLI Options

## Commands

### `analyze` - Generate architecture report

Generate a text report (includes health score, fit evaluation, and problems detected):

```bash
archlens analyze .
```

Generate JSON output (complete data structure for programmatic access):

```bash
archlens analyze . --format json
```

Save output to file:

```bash
archlens analyze . --output report.txt
archlens analyze . --format json --output report.json
```

### `mermaid` - Visualize architecture as graphs

Generate dependency cycles diagram:

```bash
archlens mermaid cycles .
```

Generate fan-out/fan-in diagram:

```bash
archlens mermaid danger .
```

Generate health score visualization:

```bash
archlens mermaid score .
```

### `diff` - Compare architecture between two reports

Compare two JSON reports to detect regressions:

```bash
archlens analyze . --format json --output base.json
archlens analyze . --format json --output head.json
archlens diff base.json head.json
```

Output shows:
- Score delta (improvement or regression)
- Cycle count changes
- Danger hotspots changes
- Files analyzed count

ArchLens now suggests the most appropriate preset based on project framework/technology detection.

Perfect for CI/CD pipelines:

```bash
# In your CI workflow
archlens analyze . --format json --output base.json
# ... make changes ...
archlens analyze . --format json --output head.json
archlens diff base.json head.json
```

### `rules` - Enforce architecture layering rules

Create a file at `.archlens/rules.json` with a list of rules that forbid imports across boundaries.

Example rules file:

```json
{
  "rules": [
    {
      "name": "domain-no-infra",
      "from": ["src/domain/**"],
      "cannotImport": ["src/infra/**"]
    },
    {
      "name": "ui-no-db",
      "from": ["src/ui/**"],
      "cannotImport": ["src/database/**"]
    }
  ]
}
```

When violations are detected, they are shown in the report under **Architecture Rules**.

Run analysis and fail on rules violations:

```bash
archlens analyze . --fail-on rules
```

## Fail rules

ArchLens can fail the process when architecture rules are violated.

Fail when architecture score drops below a threshold:

```bash
archlens analyze . --fail-on "score<80"
```

Fail when dependency cycles are detected:

```bash
archlens analyze . --fail-on "cycles>0"
```

Fail when coupling hotspots exceed a threshold:

```bash
archlens analyze . --fail-on "danger>2"
```

Combine multiple rules:

```bash
archlens analyze . --fail-on "score<80,cycles>0,danger>2,rules"
```

If a rule is triggered, ArchLens exits with code 1, which allows usage in CI/CD pipelines.

---

# 📈 Understanding the Scores

ArchLens provides **two complementary scores** for comprehensive architecture evaluation:

## Architecture Health Score (Structural)

Measures the quality of your code structure independent of any specific pattern.

ArchLens starts at **100** and applies penalties for:
- Circular dependencies
- High coupling density
- Excessive fan-out modules

| Score | Status |
|------|------|
| 80–100 | Healthy |
| 60–79 | Architecture Warning |
| 0–59 | Critical |

## Architecture Fit Score (Profile Adherence)

Measures how well your project aligns with its **recommended architecture profile**.

Examples:
- **Next.js app-router**: Expected layers are `[app, pages, lib, components]`
- **Vite SPA**: Expected layers are `[src, components, hooks, services, utils]`
- **Backend monolith**: Expected layers are `[domain, application, infra]`

Fit evaluation checks:
- ✅ All expected layers present
- ✅ No unexpected layers diluting structure
- ✅ Clean layer boundaries (< 10% cross-layer imports)
- ✅ Zero circular dependencies
- ✅ Healthy coupling density (avg < 3 deps/module)
- ✅ No "god modules" with 10+ dependencies

| Score | Status |
|------|------|
| 75–100 | Good — Architecture is clean and aligned |
| 50–74 | Partial — Some improvements needed |
| 0–49 | Poor — Significant structural refactoring needed |

---

# 🧩 How It Works

ArchLens performs static structural analysis:

1. **File Collection** — Gathers all TypeScript/JavaScript files based on globs
2. **Graph Construction** — Extracts imports via AST parsing, builds dependency graph
3. **Cycle Detection** — Uses Tarjan's Algorithm (SCC) to find circular dependencies
4. **Framework Detection** — Identifies project type (Next.js, Vite, Node) and technology stack
5. **Structural Metrics** — Computes fanIn, fanOut, instability, and danger scores
6. **Profile Recommendation** — Suggests best-fit architecture pattern
7. **Fit Analysis** — Evaluates 6 checks across layer structure and coupling
8. **Problem Detection** — Identifies 9+ architectural issues with evidence and suggestions
9. **Rule Evaluation** — Checks custom rules from `.archlens/rules.json`
10. **Report Generation** — Produces comprehensive analysis in text/JSON format

---

# 📌 Why ArchLens?

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

# 📦 Use Cases

ArchLens can be used for:

- Architecture reviews
- Detecting dependency cycles
- Identifying coupling hotspots
- Monitoring architecture health over time
- CI/CD architecture checks

---

# 📜 License

MIT
