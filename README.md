# ArchLens

> Architecture health analyzer for JavaScript and TypeScript projects.

ArchLens detects structural problems that traditional code quality tools often miss.

- Dependency cycles
- Coupling hotspots
- Fan-in / Fan-out imbalance
- Structural instability
- Architecture Health Score (0–100)

> Code quality tools analyze lines.  
> **ArchLens analyzes structure.**

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

---

# 📊 Example Output

```
✅ ArchLens analysis complete
Project: my-app
Files analyzed: 124
Edges: 312

Architecture Health Score: 78/100 (B)
Status: Architecture Warning

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

# 🧰 CLI Options

## Commands

### `analyze` - Generate architecture report

Generate a text report:

```bash
archlens analyze .
```

Generate JSON output:

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

Generate all graphs combined:

```bash
archlens mermaid all .
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

### `html` - Export architecture report as HTML

Generate an interactive HTML report:

```bash
archlens html .
```

Save to custom file:

```bash
archlens html . --output custom-report.html
```

Perfect for:
- Sharing with stakeholders
- Documentation
- Architecture reviews
- Team presentations

## Output format

Save JSON report to default directory:

```bash
archlens analyze . --format json
```

Output will be saved to:

```
./archlens-report/report.json
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
archlens analyze . --fail-on "score<80,cycles>0,danger>2"
```
If a rule is triggered, ArchLens exits with code 1, which allows usage in CI/CD pipelines.

---

# 🧮 Architecture Health Score

ArchLens starts at **100** and applies penalties for:

- Circular dependencies
- High coupling density
- Excessive fan-out modules

| Score | Status |
|------|------|
| 80–100 | Healthy |
| 60–79 | Architecture Warning |
| 0–59 | Critical |

---

# 🧩 How It Works

ArchLens performs static structural analysis:

1. Collects project files (TS/JS)
2. Extracts imports via AST parsing
3. Builds a directed dependency graph
4. Detects cycles using **Tarjan’s Algorithm (SCC)**
5. Computes structural metrics:

- `fanIn`
- `fanOut`
- `instability = fanOut / (fanIn + fanOut)`
- `dangerScore = fanIn × fanOut`

6. Generates an **Architecture Health Score**

Cycle detection complexity:

```
O(V + E)
```

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