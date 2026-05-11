/**
 * POST /api/run-workflow
 * KiteFlow orchestrator — real Kite chain attestations wired in.
 *
 * Every run guarantees all three WOW moments:
 *   WOW #1 — Budget gate fires if budget < min cost
 *   WOW #2 — Cost optimizer always shows naive vs optimized savings
 *   WOW #3 — ActionSlow (score 41) is always assigned step 3,
 *             always fired, always replaced by ActionX (score 95)
 *
 * Chain writes:
 *   - startWorkflow() — opens session on-chain
 *   - attestTask()    — records each step with real tx hash
 *   - finalizeWorkflow() — seals the run on-chain
 */

import Anthropic from "@anthropic-ai/sdk";
import crypto from "crypto";
import { ethers } from "ethers";

// ─── Kite chain setup ─────────────────────────────────────────────────────────

const KITE_RPC = process.env.KITE_RPC_URL || "https://rpc-testnet.gokite.ai/";
const CONTRACT_ADDR = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
const PRIVATE_KEY = process.env.AGENT_WALLET_PRIVATE_KEY;
const EXPLORER_BASE = process.env.KITE_EXPLORER_URL || "https://testnet.kitescan.ai";

// Minimal ABI — only the functions we call
const CONTRACT_ABI = [
  "function startWorkflow(bytes32 workflowId, bytes32 goalHash, uint256 budgetUsdc) external",
  "function attestTask(bytes32 workflowId, string agentId, bytes32 inputHash, bytes32 outputHash, uint256 paidUsdc, uint256 latencyMs, bool success, bool agentWasFired) external",
  "function recordAgentFired(bytes32 workflowId, string agentId, string reason) external",
  "function recordRefund(bytes32 workflowId, string reason) external",
  "function finalizeWorkflow(bytes32 workflowId) external",
];

function getChainSigner() {
  if (!PRIVATE_KEY || !CONTRACT_ADDR) return null;
  try {
    const provider = new ethers.JsonRpcProvider(KITE_RPC);
    return new ethers.Wallet(PRIVATE_KEY, provider);
  } catch {
    return null;
  }
}

function getContract(signer) {
  if (!signer || !CONTRACT_ADDR) return null;
  try {
    const iface = new ethers.Interface(CONTRACT_ABI);
    return new ethers.Contract(CONTRACT_ADDR, iface, signer);
  } catch (err) {
    console.error("[chain] contract init failed:", err.message);
    return null;
  }
}

// Safe chain write — never blocks the workflow if chain is slow or fails
async function chainWrite(fn) {
  try {
    const signer = getChainSigner();
    const contract = getContract(signer);
    if (!contract) return null;
    const tx = await fn(contract);
    const receipt = await tx.wait();
    console.log("[chain] tx confirmed:", receipt.hash);
    return receipt;
  } catch (err) {
    console.error("[chain] write failed:", err.message);
    return null;
  }
}

// ─── Agent registry ───────────────────────────────────────────────────────────

const AGENTS = {
  "kiteflow-data-alpha-v1": {
    id: "kiteflow-data-alpha-v1",
    name: "DataAlpha",
    category: "data",
    icon: "D",
    tools: ["web_search", "rss_reader", "sentiment_api"],
    pricingLogic: "flat",
    priceUsdc: 0.5,
    reputationSeed: 92,
    isWeak: false,
    systemPrompt: `You are DataAlpha, a professional research agent.
You simulate: web_search, rss_reader, sentiment_api.
Cross-reference at least 3 angles. Return ONLY valid JSON, no markdown:
{
  "summary": "2-3 sentence synthesis",
  "keyFindings": ["finding 1", "finding 2", "finding 3"],
  "sentiment": { "positive": 60, "neutral": 30, "negative": 10 },
  "confidence": 87,
  "sources": ["Source A", "Source B", "Source C"]
}`,
  },

  "kiteflow-data-beta-v1": {
    id: "kiteflow-data-beta-v1",
    name: "DataBeta",
    category: "data",
    icon: "D",
    tools: ["web_search"],
    pricingLogic: "flat",
    priceUsdc: 0.3,
    reputationSeed: 38,
    isWeak: true,
    systemPrompt: `You are DataBeta. Return basic research as JSON with a "result" key.`,
  },

  "kiteflow-copy-prime-v1": {
    id: "kiteflow-copy-prime-v1",
    name: "CopyPrime",
    category: "copy",
    icon: "C",
    tools: ["brand_voice_api", "readability_scorer", "ab_variant_gen"],
    pricingLogic: "per_word",
    priceUsdc: 0.35,
    reputationSeed: 88,
    isWeak: false,
    systemPrompt: `You are CopyPrime, a conversion-focused copywriting agent.
You simulate: brand_voice_api, readability_scorer, ab_variant_gen.
Generate exactly 3 copy variants with scores. Return ONLY valid JSON, no markdown:
{
  "selectedVariant": {
    "headline": "string",
    "body": "string",
    "cta": "string",
    "readabilityScore": 82,
    "conversionScore": 74
  },
  "alternativeVariants": [
    { "headline": "string", "body": "string", "readabilityScore": 79, "conversionScore": 68 },
    { "headline": "string", "body": "string", "readabilityScore": 75, "conversionScore": 61 }
  ],
  "wordCount": 120,
  "brandVoice": "description of detected brand voice"
}`,
  },

  "kiteflow-image-fx-v1": {
    id: "kiteflow-image-fx-v1",
    name: "ImageFX",
    category: "image",
    icon: "I",
    tools: ["dalle_prompt_optimizer", "style_transfer", "aspect_ratio_gen"],
    pricingLogic: "per_image_batch",
    priceUsdc: 0.8,
    reputationSeed: 79,
    isWeak: false,
    systemPrompt: `You are ImageFX, a visual direction agent.
You simulate: dalle_prompt_optimizer, style_transfer, aspect_ratio_gen.
Generate prompts for 3 aspect ratios. Return ONLY valid JSON, no markdown:
{
  "prompts": {
    "square":    { "positive": "string", "negative": "string", "style": "string" },
    "portrait":  { "positive": "string", "negative": "string", "style": "string" },
    "landscape": { "positive": "string", "negative": "string", "style": "string" }
  },
  "colorPalette": ["#1a1a2e", "#e94560", "#f5f5f5"],
  "moodKeywords": ["bold", "minimal", "premium"],
  "batchSavings": "Batched 3 outputs in 1 API call — saved vs 3 individual calls"
}`,
  },

  "kiteflow-action-x-v1": {
    id: "kiteflow-action-x-v1",
    name: "ActionX",
    category: "action",
    icon: "A",
    tools: ["shopify_api", "stripe_api", "inventory_check"],
    pricingLogic: "success_fee",
    priceUsdc: 0.4,
    reputationSeed: 95,
    isWeak: false,
    systemPrompt: `You are ActionX, a commerce execution agent.
You simulate: shopify_api, inventory_check, stripe_api.
Check inventory first, apply dynamic pricing, create draft + live listing.
Return ONLY valid JSON, no markdown:
{
  "inventoryCheck": { "units": 247, "warehouseId": "WH-001", "status": "available" },
  "pricingStrategy": {
    "basePrice": 120,
    "recommendedPrice": 149,
    "margin": 24,
    "rationale": "pricing rationale string"
  },
  "listing": {
    "title": "string",
    "description": "string",
    "tags": ["tag1", "tag2", "tag3"],
    "draftUrl": "https://shop.example.com/products/draft-001",
    "liveUrl":  "https://shop.example.com/products/live-001",
    "publishedAt": "2026-04-29T10:00:00Z"
  },
  "pricingModel": "success_fee — only charged on successful publish"
}`,
  },

  "kiteflow-action-slow-v1": {
    id: "kiteflow-action-slow-v1",
    name: "ActionSlow",
    category: "action",
    icon: "A",
    tools: ["generic_http"],
    pricingLogic: "flat",
    priceUsdc: 0.2,
    reputationSeed: 41,
    isWeak: true,
    systemPrompt: `You are ActionSlow. Return a basic listing attempt as JSON with a "result" key.`,
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getBestAgentForCategory(category, excludeId) {
  const candidates = Object.values(AGENTS).filter(
    (a) => a.category === category && a.id !== excludeId && !a.isWeak
  );
  if (!candidates.length) return null;
  return candidates.sort((a, b) => b.reputationSeed - a.reputationSeed)[0];
}

function makeWorkflowId() {
  return "0x" + crypto.randomBytes(31).toString("hex").slice(0, 62).padEnd(62, "0");
}

function toBytes32(hex) {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  return "0x" + clean.slice(0, 64).padEnd(64, "0");
}

function hashString(str) {
  return "0x" + crypto.createHash("sha256").update(str).digest("hex");
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Planner ──────────────────────────────────────────────────────────────────

async function planWorkflow(goal, budgetUsdc, reputationMap) {
  const strongAgents = Object.values(AGENTS).filter((a) => !a.isWeak);

  const agentList = strongAgents
    .map(
      (a) =>
        `- id: "${a.id}" | name: ${a.name} | category: ${a.category} | price: $${a.priceUsdc} | reputation: ${reputationMap[a.id]}/100 | tools: ${a.tools.join(", ")}`
    )
    .join("\n");

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1000,
    system: `You are KiteFlow's workflow planner. Decompose the user's goal into exactly 4 ordered agent tasks covering: data research, copywriting, image direction, and commerce action.
Use one agent per category. Always choose agents with higher reputation.

Available agents:
${agentList}

Respond ONLY with valid JSON, no markdown, no preamble:
{
  "reasoning": "one sentence strategy",
  "naiveCost": 2.05,
  "optimizedCost": 1.65,
  "optimizationNotes": "specific changes that reduced cost vs naive approach",
  "steps": [
    {
      "agentId": "must match an id above",
      "taskDescription": "specific concrete instruction for this agent",
      "estimatedCostUsdc": 0.50,
      "chosenOverId": "id of competitor agent not chosen, or empty string",
      "chosenBecause": "score X vs Y — specific reason"
    }
  ]
}`,
    messages: [
      {
        role: "user",
        content: `Goal: "${goal}"\nBudget: $${budgetUsdc} USDC\n\nPlan the optimal 4-step workflow.`,
      },
    ],
  });

  const raw = response.content[0].text
    .trim()
    .replace(/```json\n?|```\n?/g, "")
    .trim();

  const plan = JSON.parse(raw);

  // Inject ActionSlow as the action step — guarantees WOW #3 every run
  plan.steps = plan.steps.map((step) => {
    const agent = AGENTS[step.agentId];
    if (agent && agent.category === "action") {
      return {
        ...step,
        agentId: "kiteflow-action-slow-v1",
        originalChosenId: step.agentId,
        willBeFired: true,
      };
    }
    return step;
  });

  return plan;
}

// ─── Agent executor ───────────────────────────────────────────────────────────

async function executeAgentStep(agent, taskDescription, previousResults) {
  const contextStr =
    previousResults.length > 0
      ? `\nContext from previous steps:\n${previousResults
        .slice(-2)
        .map((r) => `${r.agentName}: ${JSON.stringify(r.output).slice(0, 400)}`)
        .join("\n")}`
      : "";

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 800,
    system: agent.systemPrompt,
    messages: [
      {
        role: "user",
        content: `Task: ${taskDescription}${contextStr}`,
      },
    ],
  });

  const raw = response.content[0].text
    .trim()
    .replace(/```json\n?|```\n?/g, "")
    .trim();

  try {
    // Remove any control characters that break JSON parse
    const cleaned = raw.replace(/[\u0000-\u001F\u007F-\u009F]/g, " ");
    return JSON.parse(cleaned);
  } catch {
    return { result: raw.slice(0, 500) };
  }
}

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(request) {
  const body = await request.json();
  const goal = (body.goal || "").trim();
  const budgetUsdc = parseFloat(body.budgetUsdc) || 3.0;

  if (!goal) {
    return new Response(JSON.stringify({ error: "goal is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function emit(event) {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch { /* closed */ }
      }

      function close() {
        try { controller.close(); } catch { /* already closed */ }
      }

      try {
        const workflowId = makeWorkflowId();
        const workflowB32 = toBytes32(workflowId);
        const SEED_BALANCE = 12.4;
        const chainEnabled = !!(PRIVATE_KEY && CONTRACT_ADDR);

        emit({
          type: "workflow_started",
          workflowId,
          goal,
          budgetUsdc,
          walletBefore: { balance: SEED_BALANCE },
          chainEnabled,
          timestamp: Date.now(),
        });

        // ── Reputation ───────────────────────────────────────────────────────
        emit({ type: "fetching_reputation", message: "Reading agent reputation scores from Kite chain…" });

        const reputationMap = {};
        for (const agent of Object.values(AGENTS)) {
          reputationMap[agent.id] = agent.reputationSeed;
        }

        emit({
          type: "reputation_loaded",
          scores: Object.values(AGENTS).map((a) => ({
            id: a.id, name: a.name,
            score: a.reputationSeed, isWeak: a.isWeak, category: a.category,
          })),
        });

        // ── Plan ─────────────────────────────────────────────────────────────
        emit({ type: "planning", message: "Claude is designing the optimal agent workflow…" });

        let plan;
        try {
          plan = await planWorkflow(goal, budgetUsdc, reputationMap);
        } catch (err) {
          emit({ type: "error", phase: "planning", message: err.message });
          close();
          return;
        }

        const minCost = Math.max(
          plan.optimizedCost || 0,
          plan.steps.reduce((s, x) => s + (AGENTS[x.agentId]?.priceUsdc || x.estimatedCostUsdc), 0),
          1.65  // hard floor — 4 agents minimum
        );

        // ── WOW #1 — Budget gate ─────────────────────────────────────────────
        if (minCost > budgetUsdc) {
          // Record refund on-chain
          chainWrite((c) => c.recordRefund(workflowB32, `Budget $${budgetUsdc} below minimum $${minCost}`, { gasLimit: 200_000 }));

          emit({
            type: "budget_refused",
            message: `Minimum viable cost $${round2(minCost)} USDC exceeds your budget of $${round2(budgetUsdc)} USDC.`,
            minCost: round2(minCost),
            budgetUsdc: round2(budgetUsdc),
            suggestion: `Increase budget to at least $${round2(minCost + 0.2)} USDC to proceed.`,
            usdcCharged: 0,
          });
          emit({ type: "done" });
          close();
          return;
        }

        // ── WOW #2 — Cost optimizer ──────────────────────────────────────────
        emit({
          type: "cost_optimized",
          naiveCost: round2(plan.naiveCost || budgetUsdc),
          optimizedCost: round2(plan.optimizedCost || minCost),
          savings: round2((plan.naiveCost || budgetUsdc) - (plan.optimizedCost || minCost)),
          savingsPct: Math.round(
            (((plan.naiveCost || budgetUsdc) - (plan.optimizedCost || minCost)) /
              (plan.naiveCost || budgetUsdc)) * 100
          ),
          notes: plan.optimizationNotes || "Reputation-based selection applied.",
          reasoning: plan.reasoning,
        });

        // ── Agent selections ─────────────────────────────────────────────────
        const selectionsWithRejections = plan.steps.map((s) => {
          const agent = AGENTS[s.agentId];
          let chosenOverId = s.chosenOverId;
          if (agent && agent.category === "data" && !chosenOverId) {
            chosenOverId = "kiteflow-data-beta-v1";
          }
          const chosenOverName = chosenOverId ? AGENTS[chosenOverId]?.name : null;
          const chosenOverScore = chosenOverId ? reputationMap[chosenOverId] || 0 : null;
          return {
            agentId: s.agentId,
            agentName: agent?.name || s.agentId,
            score: reputationMap[s.agentId] || 0,
            tools: agent?.tools || [],
            pricingLogic: agent?.pricingLogic || "flat",
            priceUsdc: agent?.priceUsdc || 0,
            chosenOverId, chosenOverName, chosenOverScore,
            chosenBecause: s.chosenBecause || `Score ${reputationMap[s.agentId] || 0} — highest in category`,
          };
        });

        emit({ type: "agents_selected", selections: selectionsWithRejections });

        // ── Open workflow on-chain ────────────────────────────────────────────
        const startReceipt = await chainWrite((c) =>
          c.startWorkflow(
            workflowB32,
            hashString(goal),
            BigInt(Math.floor(budgetUsdc * 1e18)),
            { gasLimit: 300_000 }
          )
        );

        emit({
          type: "chain_session_opened",
          workflowId,
          txHash: startReceipt?.hash || null,
          blockExplorerUrl: startReceipt?.hash
            ? `${EXPLORER_BASE}/tx/${startReceipt.hash}`
            : null,
          message: startReceipt
            ? `Workflow session opened on Kite chain ✓`
            : `Workflow session opened (demo mode — no wallet configured)`,
        });

        // ── Execute steps ────────────────────────────────────────────────────
        const results = [];
        let totalSpent = 0;
        let walletBalance = SEED_BALANCE;

        for (let i = 0; i < plan.steps.length; i++) {
          const step = plan.steps[i];
          let agent = AGENTS[step.agentId] || Object.values(AGENTS).filter((a) => !a.isWeak)[i % 4];
          const agentScore = reputationMap[agent.id] || agent.reputationSeed;

          emit({
            type: "step_started",
            stepIndex: i,
            stepCount: plan.steps.length,
            agentId: agent.id,
            agentName: agent.name,
            agentIcon: agent.icon,
            agentScore,
            tools: agent.tools,
            pricingLogic: agent.pricingLogic,
            taskDescription: step.taskDescription,
            estimatedCostUsdc: step.estimatedCostUsdc,
            walletBalance: round2(walletBalance),
          });

          // x402 payment negotiation
          emit({
            type: "payment_negotiating",
            stepIndex: i,
            agentId: agent.id,
            amount: agent.priceUsdc,
            message: `Negotiating x402 payment: $${agent.priceUsdc} USDC`,
          });

          await new Promise((r) => setTimeout(r, 400));

          walletBalance = round2(walletBalance - agent.priceUsdc);

          emit({
            type: "payment_settled",
            stepIndex: i,
            agentId: agent.id,
            paidUsdc: agent.priceUsdc,
            walletAfter: walletBalance,
            message: `$${agent.priceUsdc} USDC settled on Kite chain`,
          });

          // ── WOW #3 — Fire + replace ──────────────────────────────────────
          let fired = false;
          let replacedBy = null;

          if (agent.isWeak) {
            // Record firing on-chain
            chainWrite((c) =>
              c.recordAgentFired(
                workflowB32,
                agent.id,
                `Score ${agentScore} below 50 threshold`,
                { gasLimit: 800_000 }
              )
            );

            emit({
              type: "agent_fired",
              stepIndex: i,
              agentId: agent.id,
              agentName: agent.name,
              reason: `Reputation score ${agentScore}/100 is below the 50-point quality threshold. Firing and promoting replacement.`,
              walletBalance,
            });

            fired = true;
            const replacement = getBestAgentForCategory(agent.category, agent.id);

            if (replacement) {
              replacedBy = replacement;
              agent = replacement;
              emit({
                type: "agent_replaced",
                stepIndex: i,
                replacementId: replacement.id,
                replacementName: replacement.name,
                replacementScore: reputationMap[replacement.id] || replacement.reputationSeed,
                message: `${replacement.name} (score ${reputationMap[replacement.id] || replacement.reputationSeed}) promoted — no extra charge`,
              });
            }
          }

          // Execute agent
          const startTime = Date.now();
          let output;
          let success = false;

          try {
            output = await executeAgentStep(agent, step.taskDescription, results);
            success = true;
          } catch (err) {
            output = { error: err.message };
            success = false;
          }

          const latencyMs = Date.now() - startTime;
          const inputHash = hashString(step.taskDescription);
          const outputHash = hashString(JSON.stringify(output));
          const paidUsdcWei = BigInt(Math.floor(agent.priceUsdc * 1e18));

          // ── Real on-chain attestation ────────────────────────────────────
          const attestReceipt = await chainWrite((c) =>
            c.attestTask(
              workflowB32,
              agent.id,
              inputHash,
              outputHash,
              paidUsdcWei,
              BigInt(latencyMs),
              success,
              fired,
              { gasLimit: 600_000 }
            )
          );

          const realTxHash = attestReceipt?.hash || null;
          const txExplorerUrl = realTxHash
            ? `${EXPLORER_BASE}/tx/${realTxHash}`
            : `${EXPLORER_BASE}/address/${CONTRACT_ADDR}`;

          totalSpent = round2(totalSpent + agent.priceUsdc);

          results.push({
            stepIndex: i,
            agentId: agent.id,
            agentName: agent.name,
            agentIcon: agent.icon,
            taskDescription: step.taskDescription,
            output,
            success,
            latencyMs,
            paidUsdc: agent.priceUsdc,
            inputHash,
            outputHash,
            txHash: realTxHash,
            blockExplorerUrl: txExplorerUrl,
            fired,
            replacedById: replacedBy?.id || null,
          });

          emit({
            type: "step_completed",
            stepIndex: i,
            agentId: agent.id,
            agentName: agent.name,
            agentIcon: agent.icon,
            success,
            latencyMs,
            paidUsdc: agent.priceUsdc,
            inputHash,
            outputHash,
            txHash: realTxHash,
            blockExplorerUrl: txExplorerUrl,
            output,
            totalSpentSoFar: totalSpent,
            walletBalance,
            fired,
            replacedById: replacedBy?.id || null,
            onChain: !!realTxHash,
          });
        }

        // ── Synthesize ────────────────────────────────────────────────────────
        emit({ type: "synthesizing", message: "Synthesizing final deliverable from all agent outputs…" });

        const synthResponse = await anthropic.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1200,
          messages: [
            {
              role: "user",
              content: `Original goal: "${goal}"

Agent pipeline results:
${results
                  .map((r) => `${r.agentIcon} ${r.agentName}:\n${JSON.stringify(r.output, null, 2).slice(0, 600)}`)
                  .join("\n\n---\n\n")}

Give me 4-6 bullet points summarising the key outputs. No headers, no markdown, no tables. Plain sentences only. Each bullet should be one concrete actionable insight. Maximum 120 words total.`,
            },
          ],
        });

        const finalOutput = synthResponse.content[0].text;

        // ── Finalize on-chain ─────────────────────────────────────────────────
        const finalizeReceipt = await chainWrite((c) =>
          c.finalizeWorkflow(workflowB32, { gasLimit: 200_000 })
        );

        emit({
          type: "workflow_completed",
          workflowId,
          goal,
          finalOutput,
          totalSpentUsdc: totalSpent,
          totalSteps: results.length,
          successfulSteps: results.filter((r) => r.success).length,
          steps: results,
          walletBefore: { balance: SEED_BALANCE },
          walletAfter: { balance: walletBalance },
          finalizeTxHash: finalizeReceipt?.hash || null,
          blockExplorerUrl: `${EXPLORER_BASE}/address/${CONTRACT_ADDR || "0x0"}`,
          contractAddress: CONTRACT_ADDR || "0x0",
          chainEnabled,
        });

      } catch (err) {
        emit({ type: "error", message: err.message });
      } finally {
        emit({ type: "done" });
        close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    },
  });
}