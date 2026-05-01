# The Integrity Protocol — x402 Agent Hub

**AI agents make confident decisions with zero accountability. This system forces them to prove it.**

The Integrity Protocol is a four-layer cognitive architecture that audits how AI agents reason before they act. Every decision is traced. Every assumption is tested. Every correction is logged. When the system finds a gap in its own reasoning, it can pay for verified data through x402 — but only if the architecture approves the spend.

The x402 Agent Hub is the operational interface for two autonomous agents acquiring data across two independent blockchains, governed by the same reasoning discipline.

**Live Demo (AWS Amplify):** [main.dsuo7ekm8i4d4.amplifyapp.com](https://main.dsuo7ekm8i4d4.amplifyapp.com)  
**Production Dashboard:** [integrity-protocol.github.io/Overwatch-Terminal](https://integrity-protocol.github.io/Overwatch-Terminal/)

---

## The Architecture

Four layers, derived from how a fire lieutenant actually processes a scene. Each layer receives only the output of the layer before it. Data compresses as it moves through the pipeline — approximately 100 observations enter, 1 assessment survives.

**Layer 1: SWEEP** — Widest-aperture perception. No analytical judgment. Like a 360 walk-around at a fire scene. Pulls from multiple data sources, produces 100+ observations, prunes to the top 15 by structural sort (source tier, severity, recency). Layer 1 does not read the Corrections Ledger — intake must remain unbiased by past errors.

**Layer 2: CONTEXTUALIZE** — The expert pause. Two phases: Knowledge Audit ("Do I understand this domain well enough to evaluate what I'm seeing?") and Contextual Scoring (score with verified understanding, not assumptions). Reads from the Corrections Ledger and Behavioral Calibration entries. Identifies knowledge gaps as acquisition candidates.

**Layer 3: INFER** — Strategic reasoning with three circuit breakers:
- **Null Hypothesis Mandate** — before generating any inference, test whether nothing strategic is happening. Finding nothing IS a valid output.
- **Assumption Count Limit** — every inference must declare its unproven assumptions. 0-1 = valid. 2 = flagged. 3+ = speculative, automatically discounted 75%.
- **Evidence-to-Inference Ratio** — every inference must rest on at least two independent, verifiable data points.

**Layer 4: RECONCILE** — Final judgment. Applies burden of proof: multiple data points get full weight, single data point gets 50%, no supporting data gets stripped, speculative inferences get 75% discount. The discount is applied in deterministic code before Layer 4 sees the inference — it reasons about inputs at adjusted weights without knowing the raw values. Approves, defers, or denies x402 acquisition requests.

---

## The x402 Economic Airlock

x402 is not a payment feature. It is a cognitive guardrail.

When the pipeline identifies a gap it cannot resolve with available data, it routes an acquisition request to Layer 4 for cost-benefit approval. Seven enforcement gates stand between the request and the payment: question specificity, per-cycle budget cap, per-week budget cap, cognitive bandwidth cap, impact scoring threshold, crisis circuit breaker, and outcome accountability. All seven are enforced in code.

If approved, the payment executes on-chain. If denied, the denial reasoning is logged. Both outcomes are traceable.

The system's value is not in what it buys — it's in what it refuses to buy. Budget constraint forces the system to rank and articulate its knowledge gaps, surfacing questions that unlimited spending would never produce.

**Blind Tagging:** The analytical layers never know which data was paid for. x402-acquired data enters looking identical to free data. The trace assembler tags it retroactively after judgment. The system cannot give paid data preferential treatment because it cannot distinguish paid from free during analysis.

---

## The Agents

### Research Agent — XRPL Mainnet
- **Wallet:** `rhwEHBYeXbSpK1n6HNUjqCdjzjjBAHD5dd`
- **Settlement:** RLUSD via BlockRun SDK
- **Vendor:** BlockRun LLM (anthropic/claude-haiku-4.5)

### Workflow Agent — Base Sepolia
- **Wallet:** `0x5104E0Cc9E1c5A70ac23C13Ded8D8c73baFae022`
- **Settlement:** USDC via x402-fetch
- **Vendor:** Workflow Agent server (self-hosted, x402-express)
- **Facilitator:** Coinbase x402 facilitator (x402.org)

Both agents are autonomous. When the pipeline drops approved acquisition requests, the Edge Signer executes payments with locally-held wallet seeds. Signing authority never leaves the machine. Cognitive reasoning runs in the cloud; cryptographic authority is isolated on the edge node.

---

## The Hub UI

The Agent Hub renders live pipeline data in a single-page tactical interface:

- **Agent Cards** — wallet addresses, balances, payment counts, total spent, recent transactions with on-chain explorer links (XRPL Explorer / BaseScan)
- **Triage Ledger** — every acquisition request with rank, deferral status, and full system reasoning. Rows are clickable.
- **Transaction Drilldown** — approved transactions show a 5-node pattern: SIGNAL → GAP → ACQUIRE → CORRECT → OUTCOME. What the system saw, what it needed, what it paid for, what changed in the reasoning, and what it concluded.
- **Denied Request Drilldown** — denied transactions show: SIGNAL → DENIED → STATUS. The cost-benefit reasoning for why the system refused to spend.
- **Cross-Links** — drilldowns link to the production dashboard's Signal Dossier, Cognitive Trace, and Flight Recorder pages via URL query params.

---

## The Glass Box

When the system acquires verified data, it shows the before and after. Prior reasoning is struck through. Corrected reasoning appears below with the verified data applied. This is the Glass Box — you see exactly what the system thought before it had the facts, and how the facts changed its mind.

The Glass Box is not a feature. It is the point. Most AI systems show you the answer. This one shows you the homework.

---

## Production Numbers

The pipeline has been running twice daily on live data since February 2026.

| Metric | Count |
|---|---|
| Pipeline Runs | 133+ |
| Learning Chains | 354+ |
| Corrections Entries | 128+ |
| Acquisitions Tracked | 200+ |
| Architecture Decisions | 24 |
| Layer Zero Rules | 17 |
| Compound Indices | 5 |
| Learning Loops | 4 |
| Patents Filed | 3 (provisional) |

---

## Layer Zero — 17 Immutable Rules

Layer Zero is the foundation nothing else can override. These are rules about how to evaluate evidence — not facts about the world, but facts about how to judge facts. True regardless of domain. No future event can alter them. When Layer Zero conflicts with any other knowledge source, Layer Zero wins.

Categories: Evidence Hierarchy (5 rules), Reasoning Constraints (3 rules), Cognitive Calibration (3 rules), Epistemological Hygiene (3 rules), Structural Integrity (3 rules).

Examples: "Multiple sources beat single sources." "Actions outweigh statements." "Absence of evidence is informationally neutral." "High confidence with low evidence is a structural error." "An inference with 3+ unproven assumptions is speculative, regardless of how plausible each assumption is individually."

All 17 rules are enforced at four levels: prompt discipline, output validation (code), schema enforcement (JSON), and an epistemological gate (separate AI reviewer checking each layer's output against all 17 rules).

---

## Domain Agnosticism

The architecture is the constant. The domain is the variable.

The four-layer pipeline, 17 Layer Zero rules, three circuit breakers, corrections ledger, behavioral calibration, drift detection, cognitive trace, flight recorder, x402 economic airlock, and all four learning loops transfer unchanged to any new domain. What changes: thesis definition, signal categories, data sources, compound index definitions, action vocabulary, acquisition channels, and processing cadence.

The same architecture deploys to autonomous AI in finance, M&A due diligence, defense intelligence, emergency medicine, or any domain where experts make decisions with incomplete information under time pressure. Overwatch Terminal is the proof of work. The Integrity Protocol is the product.

---

## Tech Stack

- **Pipeline:** Node.js, Claude Opus 4.6 (via Anthropic API), GitHub Actions (twice daily)
- **Hub UI:** Next.js 16 + Tailwind CSS + TypeScript, hosted on AWS Amplify
- **Research Agent:** Python, BlockRun SDK, XRPL mainnet
- **Workflow Agent:** Node.js, Express, x402-fetch, x402-express, Coinbase x402 Facilitator, Base Sepolia
- **Dashboard:** Static HTML/CSS/JS, hosted on GitHub Pages
- **Data:** JSON pipeline artifacts committed to repo on each run

---

## The Builder

**Tim Wrenn** — Founder & Architect, Integrity AI LLC

Fire Lieutenant. 18 years of service. Structural Collapse Instructor. Zero coding background. Built the entire system by directing AI tools with natural language. Every architectural decision validated across multiple AI systems independently. Three provisional patents filed pro se.

---

**Patent Pending — Integrity AI LLC**

**EasyA Consensus Miami | May 5–7, 2026**
