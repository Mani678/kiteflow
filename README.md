# ⚡ KiteFlow — Stripe for AI Agents

> Every agent call is a verifiable payment. Every workflow is a provable receipt. On Kite chain.

**[Live Demo](https://kiteflow.vercel.app)** · **[Contract on Kite Scan](https://testnet.kitescan.ai/address/YOUR_ADDRESS)**

---

## What it does

KiteFlow is an on-chain workflow orchestration protocol. A user types a goal in natural language. KiteFlow:

1. **Reads on-chain reputation scores** for every available agent
2. **Plans an optimal agent DAG** using Claude — choosing agents by score, not alphabetically
3. **Triggers a budget gate** if the minimum viable cost exceeds the user's budget — zero USDC charged
4. **Shows cost optimization** — naive plan vs optimized plan, with savings % and reasoning
5. **Executes each step** with x402 USDC payment negotiation on Kite chain
6. **Fires and replaces bad agents** mid-workflow if a score drops below threshold
7. **Attests every step** on-chain — input hash, output hash, cost, latency — permanently
8. **Delivers a synthesized final result** with a full verifiable audit trail

---

## The three WOW moments judges will see

### WOW #1 — Budget Gate
Set your budget below the minimum viable cost and hit Run. The agent **refuses to start**, emits a clear explanation, records a refund on-chain, and charges **zero USDC**. This is how real payment systems behave.

### WOW #2 — Cost Optimizer
Before executing, the orchestrator reveals:
- **Naive plan cost** (using cheapest agents)
- **Optimized plan cost** (using reputation-scored agents, batched where possible)
- **Savings %** with specific reasoning per decision

Example output: *"DataBeta excluded (score 61 vs DataAlpha 92). ImageFX batched 3 outputs in 1 call. Saved $2.95 (59%)."*

### WOW #3 — Mid-task Fire + Replace
If an agent's reputation score drops below 50 during execution, KiteFlow fires it, promotes the next-best agent in the same category, records the firing on-chain, and continues — **no extra charge to the user**.

---

## What makes each agent genuinely different

| Agent | Tools simulated | Pricing model | Unique behavior |
|-------|----------------|---------------|-----------------|
| **DataAlpha** | web_search, rss_reader, sentiment_api | Flat $0.50 | 3-source cross-reference, confidence score, sentiment breakdown |
| **CopyPrime** | brand_voice_api, readability_scorer, ab_variant_gen | Per-word $0.35 | Generates 3 A/B variants, scores each, returns best + alternatives |
| **ImageFX** | dalle_prompt_optimizer, style_transfer, aspect_ratio_gen | Per-image batch $0.80 | 3 aspect ratios (1:1, 4:5, 16:9) + negative prompts in one batched call |
| **ActionX** | shopify_api, stripe_api, inventory_check | Success-fee $0.40 | Verifies inventory before listing, dynamic pricing, draft + live version |

---

## Kite chain integration

| Feature | Implementation |
|---------|---------------|
| **x402 Protocol** | Every agent step returns 402 Payment Required. Orchestrator negotiates, settles, retries with X-PAYMENT header |
| **Agent Passport** | Each agent node has a registered Kite identity and on-chain stats |
| **USDC Settlement** | All inter-agent payments in USDC — shown live in the wallet balance panel |
| **WorkflowAttestation.sol** | Custom contract records: workflowId · agentId · inputHash · outputHash · paidUsdc · latencyMs · success · agentWasFired |
| **On-chain Reputation** | `getAgentReputationScore()` returns 0–100 score — 70% success rate + 20% latency + 10% fire penalty. Orchestrator reads this BEFORE selecting agents |
| **Budget gate on-chain** | Refused workflows call `recordRefund()` — permanent on-chain proof that zero funds moved |
| **Agent firing on-chain** | `recordAgentFired()` updates the agent's `fireCount` — affects future reputation scores |

---

## Architecture

```
User types goal
      │
      ▼
┌─────────────────────────────────────────────┐
│  Reputation fetch (reads Kite chain)        │  ← on-chain scores
│  Claude plans DAG (picks by score, not name)│  ← WOW: reputation routing
│  Budget gate (refuses if too expensive)     │  ← WOW #1
│  Cost optimizer (shows naive vs optimized)  │  ← WOW #2
└──────────────────┬──────────────────────────┘
                   │
     ┌─────────────┼─────────────┬──────────────┐
     ▼             ▼             ▼              ▼
DataAlpha      CopyPrime      ImageFX        ActionX
web_search     brand_voice    dalle_prompt   shopify_api
rss_reader     readability    style_transfer stripe_api
sentiment_api  ab_variant     aspect_ratio   inventory_check
flat $0.50     per_word $0.35 batch $0.80    success_fee $0.40
     │             │             │              │
     └─────────────┴──── x402 ──┴──────────────┘
                         USDC payment per step
                              │
                              ▼
                   ┌──────────────────────┐
                   │  WorkflowAttestation │  ← Kite chain
                   │  .sol                │
                   │  inputHash           │
                   │  outputHash          │
                   │  paidUsdc            │
                   │  latencyMs           │
                   │  agentWasFired       │
                   └──────────────────────┘
                              │
                   ┌──────────▼──────────┐
                   │  Agent reputation   │  ← feeds back to
                   │  registry (on-chain)│     next workflow's
                   └─────────────────────┘     agent selection
```

---

## Quick start

### Prerequisites
- Node.js 18+
- MetaMask with Kite testnet: [chainlist.org/chain/2368](https://chainlist.org/chain/2368)
- Test KITE from faucet: [faucet.gokite.ai](https://faucet.gokite.ai)
- Anthropic API key: [console.anthropic.com](https://console.anthropic.com)

### 1. Clone and install
```bash
git clone https://github.com/YOUR_USERNAME/kiteflow
cd kiteflow
npm run setup
```

### 2. Configure environment
```bash
cp .env.example .env.local
# Fill in: ANTHROPIC_API_KEY
# Optional: AGENT_WALLET_PRIVATE_KEY (for real chain writes)
# Leave X402_DEMO_MODE=true for testnet demos
```

### 3. Deploy contract (optional — skip for demo mode)
```bash
npm run deploy:testnet
# Copy the printed address into .env.local as NEXT_PUBLIC_CONTRACT_ADDRESS
```

### 4. Run
```bash
npm run dev
# Open http://localhost:3000
```

---

## Project structure

```
kiteflow/
├── contracts/
│   └── WorkflowAttestation.sol   ← on-chain attestation + reputation
├── scripts/
│   └── deploy.js                 ← deploys + pre-registers agents
├── hardhat.config.cjs            ← Kite testnet + mainnet networks
├── frontend/
│   ├── app/
│   │   ├── page.js               ← full dashboard UI
│   │   ├── layout.js             ← root layout
│   │   └── api/
│   │       └── run-workflow/
│   │           └── route.js      ← SSE orchestrator (the brain)
│   ├── lib/
│   │   ├── agents.js             ← agent definitions + system prompts
│   │   └── kitechain.js          ← Kite chain read/write library
│   ├── next.config.mjs
│   └── package.json
├── .env.example
├── vercel.json
└── README.md
```

---

## Judging criteria — how we score

| Criterion | What we built |
|-----------|--------------|
| **Agent Autonomy** | Zero human input after the initial goal. Budget gate, cost optimizer, agent firing, and replacement all happen automatically |
| **Developer Experience** | `npm run setup` → `npm run deploy:testnet` → `npm run dev`. Three commands from clone to live demo |
| **Real-World Applicability** | Commerce, content, DeFi, research — any multi-step goal. The orchestrator adapts the agent DAG to the goal |
| **Novel / Creativity** | On-chain reputation that actually routes decisions. Agent firing recorded on-chain. Budget gate with on-chain refund proof. Cost optimizer with visible savings |

---

## Track: Agentic Commerce

Built on Kite AI · Powered by Claude claude-sonnet-4-20250514 · Deployed on Vercel · x402 payment protocol · On-chain attestation

*KiteFlow Hackathon Submission — Kite AI Global Hackathon 2026*
