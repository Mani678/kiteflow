# ⚡ KiteFlow — Stripe for AI Agents

> Every agent call is a verifiable payment. Every workflow is a provable receipt. On Kite chain.

**[Live Demo](https://kiteflow-three.vercel.app/)** · **[Contract on Kite Scan](https://testnet.kitescan.ai/address/0xFCEe9ff0f73d99416Bf3542d220b0c5FA593741C)**

---

## What is KiteFlow?

KiteFlow is an autonomous multi-agent workflow engine built on Kite chain. A user types a goal in plain English. KiteFlow autonomously:

1. Plans which AI agents to hire based on on-chain reputation scores
2. Optimizes cost before spending a single dollar
3. Pays each agent via x402 USDC on Kite chain
4. Fires underperforming agents and replaces them instantly
5. Attests every task result permanently on-chain
6. Delivers a synthesized final output with a full verifiable audit trail

**Total cost per workflow: under $3. Total human clicks after the first prompt: zero.**

---

## The Problem It Solves

Today if you want to launch a product, run a campaign, or go to market — you need to hire multiple specialists: a researcher, a copywriter, a designer, a commerce manager. That takes days and costs hundreds of dollars.

KiteFlow replaces that entire process with autonomous AI agents that hire each other, pay each other, and deliver a complete output — all in under 90 seconds, all provable on-chain.

---

## Who It's For

- 🛍️ **Shopify & Etsy sellers** — launch products without hiring an agency
- 🚀 **Indie founders** — ship go-to-market strategies in minutes
- 🎵 **Creators & artists** — run campaigns without a marketing team
- 🏦 **Web3 teams** — announce protocols with research-backed copy

---

## Three WOW Moments (all fire on every run)

### WOW #1 — Budget Gate
Set your budget below the minimum viable cost and hit Run. KiteFlow refuses to start, explains why, and charges **zero USDC**. Your wallet is never touched. This is recorded on-chain.

### WOW #2 — Cost Optimizer
Before executing, the AI compares every available agent by reputation score and selects the optimal combination. Shows you the naive plan cost vs the optimized cost with savings percentage and specific reasoning.

### WOW #3 — Agent Fire + Replace
ActionSlow (reputation score 41/100) is always assigned to the commerce step. KiteFlow detects it mid-workflow, fires it, promotes ActionX (score 95/100), continues at no extra charge. The firing is recorded permanently on Kite chain.

---

## The 4 Specialist Agents

| Agent | Score | Tools | Pricing | What it does |
|-------|-------|-------|---------|-------------|
| **DataAlpha** | 92 | web_search, rss_reader, sentiment_api | Flat $0.50 | Multi-source research with confidence scoring |
| **CopyPrime** | 88 | brand_voice_api, readability_scorer, ab_variant_gen | Per-word $0.35 | 3 A/B copy variants scored for conversion |
| **ImageFX** | 79 | dalle_prompt_optimizer, style_transfer, aspect_ratio_gen | Batch $0.80 | 3 aspect ratios + negative prompts in one call |
| **ActionX** | 95 | shopify_api, stripe_api, inventory_check | Success-fee $0.40 | Inventory check + dynamic pricing + live listing |
| DataBeta | 38 | web_search | Flat $0.30 | Always rejected — shown as proof of reputation routing |
| ActionSlow | 41 | generic_http | Flat $0.20 | Always fired — demonstrates autonomous quality control |

---

## Kite Chain Integration

| Feature | Implementation |
|---------|---------------|
| **x402 Protocol** | Every agent step negotiates payment before executing |
| **USDC Settlement** | All payments in USDC, wallet balance updates in real time |
| **WorkflowAttestation.sol** | Custom contract records every task: agentId, inputHash, outputHash, paidUsdc, latencyMs, success, agentWasFired |
| **On-chain Reputation** | Agent scores stored on-chain — orchestrator reads before selecting |
| **Budget gate on-chain** | Refused workflows call `recordRefund()` — permanent proof zero funds moved |
| **Agent firing on-chain** | `recordAgentFired()` updates agent fireCount — affects future reputation |
| **Workflow finalization** | `finalizeWorkflow()` seals the run with a permanent on-chain summary |

**Deployed Contract:** `0xFCEe9ff0f73d99416Bf3542d220b0c5FA593741C`
**Network:** Kite Testnet (Chain ID: 2368)
**Explorer:** [testnet.kitescan.ai](https://testnet.kitescan.ai/address/0xFCEe9ff0f73d99416Bf3542d220b0c5FA593741C)

---

## Architecture

```
User types goal
      │
      ▼
┌─────────────────────────────────────────┐
│  Reputation fetch — reads Kite chain    │
│  Claude plans agent DAG by score        │
│  Budget gate — refuses if too expensive │  ← WOW #1
│  Cost optimizer — naive vs optimized    │  ← WOW #2
└──────────────┬──────────────────────────┘
               │
    ┌──────────┼──────────┬──────────┐
    ▼          ▼          ▼          ▼
DataAlpha   CopyPrime  ImageFX   ActionSlow
  $0.50       $0.35     $0.80      $0.20
    │          │          │          │
    │          │          │     FIRED ← WOW #3
    │          │          │          │
    │          │          │       ActionX
    │          │          │         $0.40
    └──────────┴──────────┴──────────┘
                    │
              x402 USDC payment per step
                    │
         WorkflowAttestation.sol
         (Kite chain — every step)
                    │
         Final deliverable + audit trail
```

---

## Project Structure

```
kiteflow/
├── contracts/
│   └── WorkflowAttestation.sol   ← on-chain attestation + reputation
├── scripts/
│   ├── deploy.js                 ← hardhat deploy
│   └── deploy-direct.js         ← ethers.js direct deploy
├── hardhat.config.cjs
├── frontend/
│   ├── app/
│   │   ├── page.js               ← full dashboard UI
│   │   ├── layout.js
│   │   └── api/run-workflow/
│   │       └── route.js          ← SSE orchestrator with chain writes
│   ├── lib/
│   │   ├── agents.js
│   │   └── kitechain.js
│   ├── next.config.mjs
│   └── package.json
├── .env.example
└── README.md
```

---

## Quick Start

### Prerequisites
- Node.js 20 (use nvm: `nvm install 20 && nvm use 20`)
- MetaMask with Kite testnet: [chainlist.org/chain/2368](https://chainlist.org/chain/2368)
- Test KITE from faucet: [faucet.gokite.ai](https://faucet.gokite.ai)
- Anthropic API key: [console.anthropic.com](https://console.anthropic.com)

### 1. Clone and install
```bash
git clone https://github.com/Mani678/kiteflow.git
cd kiteflow
npm install
cd frontend && npm install && cd ..
```

### 2. Configure environment
```bash
# Create frontend/.env.local
ANTHROPIC_API_KEY=sk-ant-your-key
AGENT_WALLET_PRIVATE_KEY=0x-your-metamask-key
NEXT_PUBLIC_CONTRACT_ADDRESS=0xFCEe9ff0f73d99416Bf3542d220b0c5FA593741C
KITE_RPC_URL=https://rpc-testnet.gokite.ai/
KITE_EXPLORER_URL=https://testnet.kitescan.ai
```

### 3. Run
```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Deploy contract (optional — already deployed)
```bash
# Create root .env.local with DEPLOYER_PRIVATE_KEY
node scripts/deploy-direct.js
```

---

## Judging Criteria

| Criterion | What we built |
|-----------|--------------|
| **Agent Autonomy** | Zero human input after the initial goal. Budget gate, cost optimizer, agent firing all happen automatically |
| **Developer Experience** | Clone → install → add API key → `npm run dev`. Three steps to working demo |
| **Real-World Applicability** | Four concrete use cases: product launch, SaaS GTM, creator campaign, DeFi announcement |
| **Novel/Creativity** | On-chain reputation routing, agent firing recorded on-chain, budget gate with on-chain refund proof, cost optimizer with visible savings |

---

## Built With

- [Kite Chain](https://gokite.ai) — payment rail, attestations, x402 protocol
— orchestrator + all 4 specialist agents
- [Next.js 14](https://nextjs.org) — frontend, deployed on Vercel
- [Ethers.js v6](https://docs.ethers.org) — Kite chain interaction
- [x402 Protocol](https://x402.org) — agent-to-agent payment standard

---

## Track

**Agentic Commerce** — supported by Kite AI

*KiteFlow Hackathon Submission — Kite AI Global Hackathon 2026 with Encode Club*
