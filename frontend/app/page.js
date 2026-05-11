"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// ─── Use cases ────────────────────────────────────────────────────────────────

const USE_CASES = [
  {
    id: "product",
    emoji: "🛍️",
    label: "Product Launch",
    who: "Shopify & Etsy sellers",
    goal: "Research the premium sneaker resale market, write 3 product descriptions with A/B conversion variants, generate image briefs for square/portrait/landscape formats, and structure a Shopify listing with dynamic pricing strategy",
    budget: 2.5,
  },
  {
    id: "saas",
    emoji: "🚀",
    label: "SaaS Go-To-Market",
    who: "Indie founders",
    goal: "Research the productivity SaaS market for remote teams at $49/mo price point, write landing page copy with 3 headline variants, generate visual brand direction for the homepage hero, and create a complete Product Hunt launch checklist",
    budget: 2.5,
  },
  {
    id: "creator",
    emoji: "🎵",
    label: "Creator Campaign",
    who: "Creators & artists",
    goal: "Research Gen Z skincare trends on TikTok Shop, write campaign copy for a limited-edition matcha skincare drop with 3 hook variants, generate mood board direction for the visual identity, and structure the TikTok Shop listing with hashtag strategy",
    budget: 2.5,
  },
  {
    id: "defi",
    emoji: "🏦",
    label: "DeFi Announcement",
    who: "Web3 teams",
    goal: "Research the current DeFi yield market and competitor APY offerings, write announcement copy for a new 12% APY stablecoin vault with 3 positioning variants, generate visual direction for the protocol dashboard, and create a community launch plan with Discord and Twitter strategy",
    budget: 2.5,
  },
];

// ─── Agent metadata — human-readable descriptions ─────────────────────────────

const AGENT_META = {
  "kiteflow-data-alpha-v1": {
    accent: "#4C9BE8", label: "DATA",
    humanDesc: "Researching your market across 3 sources with sentiment scoring",
  },
  "kiteflow-data-beta-v1": {
    accent: "#4C9BE8", label: "DATA",
    humanDesc: "Basic single-source web search",
  },
  "kiteflow-copy-prime-v1": {
    accent: "#34D399", label: "COPY",
    humanDesc: "Writing 3 copy variants and scoring each for readability and conversion",
  },
  "kiteflow-image-fx-v1": {
    accent: "#F59E0B", label: "IMAGE",
    humanDesc: "Generating visual briefs for 3 formats (square, portrait, landscape) in one batch",
  },
  "kiteflow-action-x-v1": {
    accent: "#F87171", label: "ACTION",
    humanDesc: "Checking inventory, setting dynamic pricing, creating draft and live listing",
  },
  "kiteflow-action-slow-v1": {
    accent: "#F87171", label: "ACTION",
    humanDesc: "Attempting generic commerce setup — no inventory validation",
  },
};
const am = (id) => AGENT_META[id] || { accent: "#6B7280", label: "AGENT", humanDesc: "Processing task" };

function r2(n) { return Math.round(n * 100) / 100; }

// ─── Global CSS ───────────────────────────────────────────────────────────────

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:     #08090D;
    --bg2:    #0C0E14;
    --bg3:    #111520;
    --bg4:    #161B28;
    --border: #1C2132;
    --border2:#252D40;
    --text:   #ECEFF4;
    --text2:  #8892A4;
    --text3:  #424D60;
    --green:  #22D3A5;
    --blue:   #4C9BE8;
    --amber:  #F0A030;
    --red:    #F06060;
    --purple: #9B8FEF;
    --font-head: 'Space Grotesk', system-ui, sans-serif;
    --font-ui:   system-ui, -apple-system, sans-serif;
    --font-mono: 'Space Mono', monospace;
  }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-ui);
    -webkit-font-smoothing: antialiased;
  }

  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }

  @keyframes pulse-dot {
    0%,100% { opacity:1; transform:scale(1); }
    50%      { opacity:0.4; transform:scale(0.85); }
  }
  @keyframes slide-up {
    from { opacity:0; transform:translateY(8px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes flash-cost {
    0%   { color:#F06060; }
    100% { color:#22D3A5; }
  }
  @keyframes progress-fill {
    from { width: 0%; }
  }
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }

  .slide-up { animation: slide-up 0.3s cubic-bezier(0.16,1,0.3,1) both; }

  .btn-run {
    width:100%; padding:12px;
    background: linear-gradient(135deg,#1A5FAD 0%,#0E8C6A 100%);
    border:none; border-radius:9px;
    font-family:var(--font-head); font-weight:600; font-size:14px;
    letter-spacing:-0.01em; color:#fff; cursor:pointer;
    transition:opacity 0.15s, transform 0.1s;
  }
  .btn-run:hover:not(:disabled) { opacity:0.88; transform:translateY(-1px); }
  .btn-run:disabled { background:var(--bg3); color:var(--text3); cursor:not-allowed; }

  .btn-ghost {
    padding:12px 16px; background:transparent;
    border:1px solid var(--border); border-radius:9px;
    font-family:var(--font-ui); font-size:13px;
    color:var(--text3); cursor:pointer;
    transition:border-color 0.15s, color 0.15s;
  }
  .btn-ghost:hover:not(:disabled) { border-color:var(--border2); color:var(--text2); }

  .surface { background:var(--bg2); border:1px solid var(--border); border-radius:12px; }

  .mono-label {
    font-family:var(--font-mono);
    font-size:9px; font-weight:400;
    letter-spacing:0.14em; text-transform:uppercase;
    color:var(--text3);
  }

  .ui-label {
    font-family:var(--font-ui); font-size:11px;
    font-weight:500; color:var(--text3); margin-bottom:8px;
  }

  textarea:focus, input:focus { outline:none; border-color:#4C9BE833 !important; }
`;

function GlobalStyles() {
  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = GLOBAL_CSS;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);
  return null;
}

// ─── Atoms ────────────────────────────────────────────────────────────────────

function Badge({ children, color = "#4C9BE8" }) {
  return (
    <span style={{
      fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 400,
      letterSpacing: "0.1em", padding: "2px 6px", borderRadius: 4,
      border: `1px solid ${color}33`, color, background: `${color}0F`,
      whiteSpace: "nowrap",
    }}>
      {children}
    </span>
  );
}

function PulseDot({ color = "#22D3A5", size = 6 }) {
  return (
    <span style={{
      display: "inline-block", width: size, height: size,
      borderRadius: "50%", background: color, flexShrink: 0,
      animation: "pulse-dot 1.6s ease-in-out infinite",
    }} />
  );
}

function ScoreRing({ score }) {
  const color = score >= 80 ? "#22D3A5" : score >= 60 ? "#4C9BE8" : "#F06060";
  const r = 13, circ = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: 34, height: 34, flexShrink: 0 }}>
      <svg width="34" height="34" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="17" cy="17" r={r} fill="none" stroke="#1C2132" strokeWidth="2" />
        <circle cx="17" cy="17" r={r} fill="none" stroke={color} strokeWidth="2"
          strokeDasharray={`${(score / 100) * circ} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s cubic-bezier(0.16,1,0.3,1)" }} />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex",
        alignItems: "center", justifyContent: "center",
        fontFamily: "var(--font-mono)", fontSize: 8, fontWeight: 700, color,
      }}>
        {score}
      </div>
    </div>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ current, total, running }) {
  if (!total) return null;
  const pct = Math.round((current / total) * 100);
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 6,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {running && <PulseDot color="#4C9BE8" size={5} />}
          <span style={{
            fontFamily: "var(--font-ui)", fontSize: 13,
            fontWeight: 500, color: "var(--text)",
          }}>
            {running ? `Running step ${current} of ${total}` : `${total} steps complete`}
          </span>
        </div>
        <span style={{
          fontFamily: "var(--font-mono)", fontSize: 10,
          color: "var(--text3)", letterSpacing: "0.08em",
        }}>
          {pct}%
        </span>
      </div>
      <div style={{
        height: 4, background: "var(--bg3)",
        borderRadius: 2, overflow: "hidden",
      }}>
        <div style={{
          height: "100%", borderRadius: 2,
          width: `${pct}%`,
          background: running
            ? "linear-gradient(90deg, #4C9BE8, #22D3A5)"
            : "#22D3A5",
          transition: "width 0.5s ease",
          animation: running ? "shimmer 2s linear infinite" : "none",
          backgroundSize: "200% auto",
        }} />
      </div>
      {/* Step dots */}
      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        {Array.from({ length: total }).map((_, i) => {
          const done = i < current;
          const active = i === current - 1 && running;
          return (
            <div key={i} style={{
              flex: 1, height: 2, borderRadius: 1,
              background: done ? "#22D3A5" : active ? "#4C9BE8" : "var(--bg4)",
              transition: "background 0.3s ease",
            }} />
          );
        })}
      </div>
    </div>
  );
}

// ─── Explainer strip ──────────────────────────────────────────────────────────

function ExplainerStrip({ visible }) {
  if (!visible) return null;
  return (
    <div className="slide-up" style={{
      background: "linear-gradient(135deg, #081420 0%, #080E14 100%)",
      border: "1px solid #4C9BE822",
      borderLeft: "3px solid #4C9BE8",
      borderRadius: 10, padding: "12px 16px",
      marginBottom: 16,
    }}>
      <div style={{
        fontFamily: "var(--font-head)", fontWeight: 600,
        fontSize: 13, color: "var(--blue)",
        letterSpacing: "-0.02em", marginBottom: 5,
      }}>
        How KiteFlow works
      </div>
      <div style={{
        fontFamily: "var(--font-ui)", fontSize: 13,
        color: "var(--text2)", lineHeight: 1.65,
      }}>
        KiteFlow is autonomously hiring AI agents, paying each one via{" "}
        <span style={{ color: "var(--text)", fontWeight: 500 }}>x402 on Kite chain</span>,
        and building your deliverable step by step.
        Every payment settles on-chain in USDC — verifiable, traceable, and trustless.
        Watch your wallet balance decrease as each agent completes its task.
      </div>
    </div>
  );
}

// ─── Step card ────────────────────────────────────────────────────────────────

function StepCard({ step, chosenBecause, idx }) {
  const meta = am(step.agentId);
  const isDone    = step.status === "done";
  const isRunning = step.status === "running";
  const isPaying  = step.status === "paying";
  const isFailed  = step.status === "failed";

  const leftColor = isDone ? "#22D3A5"
    : isPaying  ? "#F0A030"
    : isRunning ? meta.accent
    : isFailed  ? "#F06060"
    : "transparent";

  const bg = isDone    ? "#081510"
    : isPaying  ? "#0F0C00"
    : isRunning ? "#080F18"
    : "var(--bg2)";

  return (
    <div className="slide-up" style={{
      background: bg,
      border: "1px solid var(--border)",
      borderLeft: `2px solid ${leftColor}`,
      borderRadius: 10, padding: "12px 14px", marginBottom: 8,
      transition: "all 0.25s ease",
    }}>
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <div style={{
          width: 20, height: 20, borderRadius: 5,
          background: isDone ? meta.accent : "var(--bg3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700,
          color: isDone ? "#000" : "var(--text3)",
          flexShrink: 0, transition: "all 0.25s",
        }}>
          {isDone ? "✓" : idx + 1}
        </div>

        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
          <span style={{
            fontFamily: "var(--font-head)", fontWeight: 600,
            fontSize: 13, color: "var(--text)",
            letterSpacing: "-0.02em", whiteSpace: "nowrap",
          }}>
            {step.agentName}
          </span>
          <Badge color={meta.accent}>{meta.label}</Badge>
          {step.fired && <Badge color="#F06060">FIRED</Badge>}
          {step.replacedById && <Badge color="#9B8FEF">REPLACED</Badge>}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {step.agentScore !== undefined && <ScoreRing score={step.agentScore} />}
          {isDone && (
            <span style={{
              fontFamily: "var(--font-mono)", fontSize: 12,
              fontWeight: 700, color: "#F06060",
            }}>
              −${step.paidUsdc?.toFixed(2)}
            </span>
          )}
          {isPaying && (
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <PulseDot color="#F0A030" size={5} />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#F0A030", letterSpacing: "0.08em" }}>
                X402
              </span>
            </div>
          )}
          {isRunning && (
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <PulseDot color={meta.accent} size={5} />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: meta.accent, letterSpacing: "0.08em" }}>
                EXEC
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Human-readable description */}
      <div style={{
        fontFamily: "var(--font-ui)", fontSize: 13,
        color: isRunning || isPaying ? "var(--text2)" : "var(--text3)",
        lineHeight: 1.5, marginBottom: 5,
        textDecoration: step.fired ? "line-through" : "none",
      }}>
        {meta.humanDesc}
      </div>

      {/* Tools */}
      {step.tools && (
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 5 }}>
          {step.tools.map((t) => (
            <span key={t} style={{
              fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--text3)",
              letterSpacing: "0.08em", padding: "1px 5px", borderRadius: 3,
              background: "var(--bg3)", border: "1px solid var(--border)",
            }}>
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Reputation reason */}
      {chosenBecause && (
        <div style={{
          fontFamily: "var(--font-mono)", fontSize: 9,
          color: "var(--green)", letterSpacing: "0.04em", marginBottom: 4,
        }}>
          ✓ {chosenBecause}
        </div>
      )}

      {/* Done: chain proof */}
      {isDone && step.txHash && (
        <div style={{
          marginTop: 8, paddingTop: 8,
          borderTop: "1px solid var(--border)",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text3)" }}>
            {step.outputHash?.slice(0, 22)}…
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text3)" }}>
            {step.latencyMs}ms
          </span>
          <a href={step.blockExplorerUrl} target="_blank" rel="noreferrer" style={{
            marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 9,
            color: "var(--blue)", textDecoration: "none", letterSpacing: "0.04em",
          }}>
            KITE_SCAN ↗
          </a>
        </div>
      )}
    </div>
  );
}

// ─── WOW banner ───────────────────────────────────────────────────────────────

function WowBanner({ type, title, context, detail }) {
  const conf = {
    budget:   { border: "#F06060", bg: "#0F0808", titleColor: "#F06060" },
    savings:  { border: "#22D3A5", bg: "#08100E", titleColor: "#22D3A5" },
    fired:    { border: "#F0A030", bg: "#0F0C00", titleColor: "#F0A030" },
    replaced: { border: "#9B8FEF", bg: "#0A0814", titleColor: "#9B8FEF" },
  }[type] || { border: "#22D3A5", bg: "#08100E", titleColor: "#22D3A5" };

  return (
    <div className="slide-up" style={{
      border: `1px solid ${conf.border}22`,
      borderLeft: `3px solid ${conf.border}`,
      background: conf.bg, borderRadius: 10,
      padding: "12px 16px", marginBottom: 10,
    }}>
      {/* Bold headline */}
      <div style={{
        fontFamily: "var(--font-head)", fontWeight: 700,
        fontSize: 14, color: conf.titleColor,
        letterSpacing: "-0.02em", marginBottom: 4,
      }}>
        {title}
      </div>
      {/* Plain English context */}
      <div style={{
        fontFamily: "var(--font-ui)", fontSize: 13,
        color: "var(--text2)", lineHeight: 1.6, marginBottom: detail ? 5 : 0,
      }}>
        {context}
      </div>
      {/* Technical detail */}
      {detail && (
        <div style={{
          fontFamily: "var(--font-mono)", fontSize: 9,
          color: "var(--text3)", letterSpacing: "0.06em", lineHeight: 1.5,
        }}>
          {detail}
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [activeUseCase, setActiveUseCase] = useState(null);
  const [goal, setGoal]                   = useState("");
  const [budget, setBudget]               = useState(2.5);
  const [running, setRunning]             = useState(false);

  const [balanceBefore, setBalanceBefore] = useState(null);
  const [balanceNow, setBalanceNow]       = useState(null);
  const [liveCost, setLiveCost]           = useState(0);
  const [tickerFlash, setTickerFlash]     = useState(false);
  const [transactions, setTransactions]   = useState([]);

  const [workflowId, setWorkflowId]       = useState(null);
  const [costOpt, setCostOpt]             = useState(null);
  const [agentSels, setAgentSels]         = useState([]);
  const [steps, setSteps]                 = useState([]);
  const [wowEvents, setWowEvents]         = useState([]);
  const [finalOutput, setFinalOutput]     = useState(null);
  const [summary, setSummary]             = useState(null);
  const [status, setStatus]               = useState("idle");
  const [statusMsg, setStatusMsg]         = useState("");
  const [budgetRefused, setBudgetRefused] = useState(null);
  const [stepCount, setStepCount]         = useState(0);
  const [stepsComplete, setStepsComplete] = useState(0);

  const abortRef  = useRef(null);
  const bottomRef = useRef(null);
  const txRef     = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [steps, wowEvents, finalOutput]);

  const addWow = useCallback((e) => {
    setWowEvents((p) => [...p, { ...e, _id: Date.now() }]);
  }, []);

  const addTx = useCallback((agent, amount, txHash, explorer) => {
    setTransactions((p) => [
      ...p,
      { time: new Date().toLocaleTimeString(), agent, amount, txHash, explorer, _id: Date.now() },
    ]);
    setBalanceNow((p) => p !== null ? r2(p - amount) : null);
    setLiveCost((p) => r2(p + amount));
    setTickerFlash(true);
    setTimeout(() => setTickerFlash(false), 700);
    setTimeout(() => { txRef.current?.scrollTo({ top: 9999, behavior: "smooth" }); }, 50);
  }, []);

  function reset() {
    setActiveUseCase(null); setGoal(""); setBudget(2.5); setRunning(false);
    setBalanceBefore(null); setBalanceNow(null); setLiveCost(0); setTickerFlash(false);
    setTransactions([]); setWorkflowId(null); setCostOpt(null); setAgentSels([]);
    setSteps([]); setWowEvents([]); setFinalOutput(null); setSummary(null);
    setStatus("idle"); setStatusMsg(""); setBudgetRefused(null);
    setStepCount(0); setStepsComplete(0);
  }

  async function runWorkflow() {
    if (!goal.trim() || running) return;
    setRunning(true);
    setTransactions([]); setLiveCost(0); setSteps([]); setWowEvents([]);
    setFinalOutput(null); setSummary(null); setCostOpt(null);
    setAgentSels([]); setBudgetRefused(null);
    setStepCount(0); setStepsComplete(0);
    setStatus("starting"); setStatusMsg("Initializing…");
    const SEED = 12.4;
    setBalanceBefore(SEED); setBalanceNow(SEED);
    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/run-workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal, budgetUsdc: budget }),
        signal: abortRef.current.signal,
      });

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          let ev;
          try { ev = JSON.parse(line.slice(6)); } catch { continue; }

          switch (ev.type) {
            case "workflow_started":
              setWorkflowId(ev.workflowId);
              setStatus("started"); setStatusMsg("WORKFLOW_STARTED"); break;

            case "fetching_reputation":
              setStatus("reputation"); setStatusMsg("FETCHING_REPUTATION"); break;

            case "reputation_loaded":
              setStatus("reputation_loaded"); setStatusMsg("REPUTATION_LOADED"); break;

            case "planning":
              setStatus("planning"); setStatusMsg("ORCHESTRATOR_PLANNING"); break;

            case "budget_refused":
              setBudgetRefused(ev);
              addWow({ type: "budget", ...ev });
              setStatus("refused"); setStatusMsg("BUDGET_GATE_TRIGGERED");
              setRunning(false); break;

            case "cost_optimized":
              setCostOpt(ev);
              addWow({ type: "savings", ...ev });
              setStatus("optimized"); setStatusMsg("COST_OPTIMIZED"); break;

            case "agents_selected":
              setAgentSels(ev.selections || []);
              setStatus("agents_ready"); setStatusMsg("AGENTS_SELECTED"); break;

            case "step_started":
              setStepCount(ev.stepCount);
              setStatus("executing");
              setStatusMsg(`STEP_${ev.stepIndex + 1}_OF_${ev.stepCount}`);
              setSteps((p) => {
                if (p.find((s) => s.stepIndex === ev.stepIndex)) return p;
                return [...p, {
                  stepIndex: ev.stepIndex, agentId: ev.agentId,
                  agentName: ev.agentName, agentIcon: ev.agentIcon,
                  agentScore: ev.agentScore, tools: ev.tools,
                  taskDescription: ev.taskDescription,
                  status: "running", fired: false,
                }];
              }); break;

            case "payment_negotiating":
              setStatus("paying"); setStatusMsg("X402_NEGOTIATING");
              setSteps((p) => p.map((s) =>
                s.stepIndex === ev.stepIndex ? { ...s, status: "paying" } : s
              )); break;

            case "payment_settled":
              break;

            case "agent_fired":
              addWow({ type: "fired", ...ev });
              setSteps((p) => p.map((s) =>
                s.stepIndex === ev.stepIndex ? { ...s, fired: true } : s
              )); break;

            case "agent_replaced":
              addWow({ type: "replaced", ...ev }); break;

            case "step_completed":
              setStepsComplete((p) => p + 1);
              if (ev.txHash) addTx(ev.agentName, ev.paidUsdc, ev.txHash, ev.blockExplorerUrl);
              setSteps((p) => p.map((s) =>
                s.stepIndex === ev.stepIndex ? {
                  ...s, status: ev.success ? "done" : "failed",
                  latencyMs: ev.latencyMs, paidUsdc: ev.paidUsdc,
                  outputHash: ev.outputHash, txHash: ev.txHash,
                  blockExplorerUrl: ev.blockExplorerUrl,
                  fired: ev.fired || s.fired, replacedById: ev.replacedById,
                } : s
              )); break;

            case "synthesizing":
              setStatus("synthesizing"); setStatusMsg("SYNTHESIZING_OUTPUT"); break;

            case "workflow_completed":
              setFinalOutput(ev.finalOutput); setSummary(ev);
              setStatus("complete"); setStatusMsg("WORKFLOW_COMPLETE"); break;

            case "done":
              setRunning(false); break;

            case "error":
              setStatus("error"); setStatusMsg(`ERR: ${ev.message}`);
              setRunning(false); break;
          }
        }
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        setStatus("error"); setStatusMsg(`ERR: ${err.message}`);
      }
      setRunning(false);
    }
  }

  const hasStarted = steps.length > 0 || costOpt !== null || budgetRefused !== null;
  const balDisplay = balanceNow !== null ? balanceNow : balanceBefore;

  const statusColor = {
    idle: "#424D60", starting: "#6B7A8D",
    reputation: "#4C9BE8", reputation_loaded: "#22D3A5",
    planning: "#9B8FEF", refused: "#F06060",
    optimized: "#22D3A5", agents_ready: "#22D3A5",
    executing: "#4C9BE8", paying: "#F0A030",
    synthesizing: "#9B8FEF", complete: "#22D3A5", error: "#F06060",
  }[status] || "#424D60";

  return (
    <>
      <GlobalStyles />
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>

        {/* ── HEADER ──────────────────────────────────────────────────── */}
        <header style={{
          position: "sticky", top: 0, zIndex: 100, height: 52,
          background: "rgba(8,9,13,0.92)", backdropFilter: "blur(16px)",
          borderBottom: "1px solid var(--border)",
          padding: "0 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7,
              background: "linear-gradient(135deg,#1A5FAD 0%,#0E8C6A 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-head)", fontWeight: 700,
              fontSize: 13, color: "#fff",
            }}>K</div>
            <div>
              <div style={{
                fontFamily: "var(--font-head)", fontWeight: 700,
                fontSize: 15, color: "var(--text)", letterSpacing: "-0.04em",
              }}>
                KiteFlow
              </div>
              <div style={{
                fontFamily: "var(--font-mono)", fontSize: 8,
                color: "var(--text3)", letterSpacing: "0.14em", marginTop: 1,
              }}>
                STRIPE FOR AI AGENTS
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {workflowId && (
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text3)" }}>
                {workflowId.slice(0, 18)}…
              </span>
            )}
            <div style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "4px 10px", borderRadius: 6,
              background: "var(--bg2)", border: "1px solid var(--border)",
            }}>
              <PulseDot color={statusColor} size={5} />
              <span style={{
                fontFamily: "var(--font-mono)", fontSize: 9,
                color: "var(--text2)", letterSpacing: "0.1em",
              }}>
                {statusMsg || "IDLE"}
              </span>
            </div>
            <div style={{
              padding: "4px 10px", borderRadius: 6,
              background: "var(--bg2)", border: "1px solid var(--border)",
              fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text3)",
            }}>
              KITE · 2368
            </div>
          </div>
        </header>

        {/* ── HERO ──────────────────────────────────────────────────────── */}
        {!hasStarted && (
          <div style={{ maxWidth: 660, margin: "64px auto 0", padding: "0 24px", textAlign: "center" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "5px 14px", borderRadius: 100,
              background: "var(--bg2)", border: "1px solid var(--border)",
              marginBottom: 28,
            }}>
              <PulseDot color="#22D3A5" size={5} />
              <span style={{
                fontFamily: "var(--font-mono)", fontSize: 9,
                color: "var(--text3)", letterSpacing: "0.14em",
              }}>
                KITE CHAIN · x402 · USDC · ON-CHAIN ATTESTATION
              </span>
            </div>

            <h1 style={{
              fontFamily: "var(--font-head)", fontWeight: 700,
              fontSize: "clamp(36px, 6vw, 58px)",
              letterSpacing: "-0.05em", lineHeight: 0.95,
              color: "var(--text)", marginBottom: 24,
            }}>
              The operating system<br />
              for{" "}
              <span style={{
                background: "linear-gradient(90deg, #4C9BE8 0%, #22D3A5 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>
                autonomous labor
              </span>
            </h1>

            <p style={{
              fontFamily: "var(--font-ui)", fontSize: 16, fontWeight: 400,
              color: "var(--text2)", lineHeight: 1.65, marginBottom: 8,
            }}>
              AI agents execute your goal. Each step is paid via x402 on Kite chain.
              Every result is attested on-chain. Under $3 per workflow.
            </p>

            <p style={{
              fontFamily: "var(--font-mono)", fontSize: 11,
              color: "var(--text3)", letterSpacing: "0.04em",
              lineHeight: 1.7, marginBottom: 44,
            }}>
              Financially accountable · Programmable · Verifiable · AI-native
            </p>

            {/* How it works — 3 steps */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
              gap: 10, marginBottom: 40, textAlign: "left",
            }}>
              {[
                { n: "01", title: "You set a goal", body: "Describe what you want to launch in plain English. KiteFlow plans which agents to hire." },
                { n: "02", title: "Agents get paid", body: "Each agent executes one task and receives USDC via x402. Every payment is settled on Kite chain." },
                { n: "03", title: "You get proof", body: "Every output is hashed and attested on-chain. You own a verifiable receipt of exactly what happened." },
              ].map((s) => (
                <div key={s.n} style={{
                  background: "var(--bg2)", border: "1px solid var(--border)",
                  borderRadius: 10, padding: "14px 14px",
                }}>
                  <div style={{
                    fontFamily: "var(--font-mono)", fontSize: 9,
                    color: "var(--text3)", letterSpacing: "0.14em", marginBottom: 6,
                  }}>
                    {s.n}
                  </div>
                  <div style={{
                    fontFamily: "var(--font-head)", fontWeight: 600,
                    fontSize: 13, letterSpacing: "-0.02em",
                    color: "var(--text)", marginBottom: 5,
                  }}>
                    {s.title}
                  </div>
                  <div style={{
                    fontFamily: "var(--font-ui)", fontSize: 12,
                    color: "var(--text3)", lineHeight: 1.55,
                  }}>
                    {s.body}
                  </div>
                </div>
              ))}
            </div>

            {/* Audience chips */}
            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 52 }}>
              {[
                { e: "🛍️", l: "Shopify sellers" },
                { e: "🚀", l: "Indie founders" },
                { e: "🎵", l: "Creators" },
                { e: "🏦", l: "Web3 teams" },
              ].map((w) => (
                <div key={w.l} style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: "7px 14px", borderRadius: 8,
                  background: "var(--bg2)", border: "1px solid var(--border)",
                }}>
                  <span style={{ fontSize: 14 }}>{w.e}</span>
                  <span style={{ fontFamily: "var(--font-ui)", fontSize: 13, color: "var(--text2)" }}>
                    {w.l}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── MAIN GRID ─────────────────────────────────────────────────── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: hasStarted ? "340px 1fr" : "1fr",
          flex: 1,
          maxWidth: hasStarted ? "none" : 660,
          margin: hasStarted ? 0 : "0 auto",
          width: "100%",
        }}>

          {/* ── LEFT ──────────────────────────────────────────────────── */}
          <div style={{
            borderRight: hasStarted ? "1px solid var(--border)" : "none",
            padding: hasStarted ? 18 : "0 24px 48px",
            display: "flex", flexDirection: "column", gap: 14,
            overflowY: "auto",
            maxHeight: hasStarted ? "calc(100vh - 52px)" : "none",
            position: hasStarted ? "sticky" : "static", top: 52,
          }}>

            {/* Use case selector */}
            <div>
              <div className="ui-label">What are you launching?</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {USE_CASES.map((uc) => {
                  const active = activeUseCase === uc.id;
                  return (
                    <button key={uc.id} disabled={running}
                      onClick={() => { setActiveUseCase(uc.id); setGoal(uc.goal); setBudget(uc.budget); }}
                      style={{
                        padding: "10px 12px", borderRadius: 9, cursor: "pointer",
                        border: active ? "1px solid #4C9BE840" : "1px solid var(--border)",
                        background: active ? "#081420" : "var(--bg2)",
                        textAlign: "left", transition: "all 0.15s",
                      }}>
                      <div style={{ fontSize: 18, marginBottom: 4 }}>{uc.emoji}</div>
                      <div style={{
                        fontFamily: "var(--font-head)", fontWeight: 600, fontSize: 12,
                        letterSpacing: "-0.02em",
                        color: active ? "var(--blue)" : "var(--text2)", marginBottom: 2,
                      }}>
                        {uc.label}
                      </div>
                      <div className="mono-label">{uc.who}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Goal input */}
            <div>
              <div className="ui-label">Or describe your goal</div>
              <textarea value={goal} rows={4} disabled={running}
                onChange={(e) => { setGoal(e.target.value); setActiveUseCase(null); }}
                placeholder="What do you want to launch or build?"
                style={{
                  width: "100%", boxSizing: "border-box",
                  background: "var(--bg2)", border: "1px solid var(--border)",
                  borderRadius: 9, padding: "10px 12px",
                  fontFamily: "var(--font-ui)", fontSize: 13,
                  color: "var(--text)", lineHeight: 1.55, resize: "vertical",
                  transition: "border-color 0.15s",
                }}
              />
            </div>

            {/* Budget */}
            <div>
              <div className="ui-label">Budget (USDC)</div>
              <div style={{ position: "relative" }}>
                <span style={{
                  position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)",
                  fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text3)",
                }}>$</span>
                <input type="number" step="0.5" min="0.5" max="20"
                  value={budget} disabled={running}
                  onChange={(e) => setBudget(parseFloat(e.target.value))}
                  style={{
                    width: "100%", boxSizing: "border-box",
                    background: "var(--bg2)", border: "1px solid var(--border)",
                    borderRadius: 9, padding: "9px 12px 9px 22px",
                    fontFamily: "var(--font-mono)", fontSize: 13,
                    color: "var(--text)", transition: "border-color 0.15s",
                  }} />
              </div>
              <div className="mono-label" style={{ marginTop: 5 }}>
                SET BELOW $1.50 → TRIGGERS BUDGET GATE
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-run" onClick={runWorkflow} disabled={running || !goal.trim()}>
                {running ? "Executing…" : "⚡  Run Workflow"}
              </button>
              <button className="btn-ghost" onClick={reset} disabled={running}>Reset</button>
            </div>

            {/* ── COST METER ───────────────────────────────────────── */}
            {hasStarted && (
              <div className="surface" style={{ padding: 16 }}>
                <div className="mono-label" style={{ marginBottom: 12 }}>LIVE COST METER</div>

                <div style={{ textAlign: "center", marginBottom: 14 }}>
                  <div style={{
                    fontFamily: "var(--font-mono)", fontWeight: 700,
                    fontSize: 44, letterSpacing: "-3px", lineHeight: 1,
                    color: "#22D3A5",
                    animation: tickerFlash ? "flash-cost 0.7s ease forwards" : "none",
                  }}>
                    ${liveCost.toFixed(2)}
                  </div>
                  <div className="mono-label" style={{ marginTop: 6 }}>USDC SPENT</div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 14 }}>
                  {[
                    { lbl: "WALLET_BEFORE", val: balanceBefore !== null ? `$${balanceBefore.toFixed(2)}` : "—", color: "var(--text)" },
                    { lbl: "WALLET_NOW",    val: balDisplay    !== null ? `$${balDisplay.toFixed(2)}`    : "—", color: "var(--green)" },
                  ].map((b) => (
                    <div key={b.lbl} style={{ background: "var(--bg3)", borderRadius: 7, padding: "8px 10px" }}>
                      <div style={{
                        fontFamily: "var(--font-mono)", fontSize: 14,
                        fontWeight: 700, color: b.color, letterSpacing: "-0.5px",
                      }}>
                        {b.val}
                      </div>
                      <div className="mono-label" style={{ marginTop: 3 }}>{b.lbl}</div>
                    </div>
                  ))}
                </div>

                <div className="mono-label" style={{ marginBottom: 6 }}>TX_LOG</div>
                <div ref={txRef} style={{ maxHeight: 110, overflowY: "auto" }}>
                  {transactions.length === 0 ? (
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text3)" }}>
                      AWAITING_FIRST_PAYMENT…
                    </div>
                  ) : transactions.map((tx) => (
                    <div key={tx._id} style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "4px 0", borderBottom: "1px solid var(--border)",
                    }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--text3)", flexShrink: 0 }}>
                        {tx.time}
                      </span>
                      <span style={{
                        fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--text3)",
                        flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {tx.agent}
                      </span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700, color: "#F06060", flexShrink: 0 }}>
                        −${tx.amount.toFixed(2)}
                      </span>
                      <a href={tx.explorer} target="_blank" rel="noreferrer" style={{
                        fontFamily: "var(--font-mono)", fontSize: 8,
                        color: "var(--blue)", textDecoration: "none", flexShrink: 0,
                      }}>
                        {tx.txHash ? tx.txHash.slice(0, 8) : "view"}↗
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Agent selections */}
            {agentSels.length > 0 && (
              <div className="surface" style={{ padding: 16 }}>
                <div className="mono-label" style={{ marginBottom: 4 }}>AGENT_SELECTION</div>
                <div style={{
                  fontFamily: "var(--font-ui)", fontSize: 12,
                  color: "var(--text3)", marginBottom: 12, lineHeight: 1.5,
                }}>
                  Chosen by on-chain reputation score — highest score wins
                </div>
                {agentSels.map((sel) => {
                  const meta = am(sel.agentId);
                  return (
                    <div key={sel.agentId} style={{
                      paddingBottom: 12, marginBottom: 12,
                      borderBottom: "1px solid var(--border)",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                        <ScoreRing score={sel.score} />
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontFamily: "var(--font-head)", fontWeight: 600,
                            fontSize: 13, letterSpacing: "-0.02em", color: "var(--text)",
                          }}>
                            {sel.agentName}
                          </div>
                          <div style={{
                            fontFamily: "var(--font-ui)", fontSize: 11,
                            color: "var(--text3)", marginTop: 1,
                          }}>
                            {meta.humanDesc}
                          </div>
                        </div>
                        <span style={{
                          fontFamily: "var(--font-mono)", fontSize: 13,
                          fontWeight: 700, color: meta.accent,
                        }}>
                          ${sel.priceUsdc?.toFixed(2)}
                        </span>
                      </div>
                      {sel.chosenBecause && (
                        <div style={{
                          fontFamily: "var(--font-mono)", fontSize: 9,
                          color: "var(--green)", marginBottom: 2, letterSpacing: "0.04em",
                        }}>
                          ✓ {sel.chosenBecause}
                        </div>
                      )}
                      {sel.chosenOverName && (
                        <div style={{
                          fontFamily: "var(--font-mono)", fontSize: 9,
                          color: "#F06060", letterSpacing: "0.04em",
                        }}>
                          ✗ REJECTED {sel.chosenOverName?.toUpperCase()} [SCORE: {sel.chosenOverScore}]
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── RIGHT ─────────────────────────────────────────────────── */}
          {hasStarted && (
            <div style={{
              padding: 24, overflowY: "auto",
              maxHeight: "calc(100vh - 52px)",
            }}>

              {/* Explainer strip — visible while running */}
              <ExplainerStrip visible={running} />

              {/* Progress bar */}
              {stepCount > 0 && (
                <ProgressBar
                  current={stepsComplete}
                  total={stepCount}
                  running={running}
                />
              )}

              {/* Budget refused */}
              {budgetRefused && (
                <WowBanner
                  type="budget"
                  title="Budget gate triggered — $0.00 USDC charged"
                  context="Smart protection: KiteFlow detected the minimum viable cost exceeds your budget and refused to start. Your wallet was never touched."
                  detail={`MIN_COST: $${budgetRefused.minCost} · BUDGET: $${budgetRefused.budgetUsdc} · ${budgetRefused.suggestion}`}
                />
              )}

              {/* Cost optimizer */}
              {costOpt && (
                <div className="surface slide-up" style={{ padding: 20, marginBottom: 14 }}>
                  <div className="mono-label" style={{ marginBottom: 6 }}>COST_OPTIMIZER</div>
                  <div style={{
                    fontFamily: "var(--font-ui)", fontSize: 13,
                    color: "var(--text2)", lineHeight: 1.6, marginBottom: 14,
                  }}>
                    Before spending anything, KiteFlow compared every available agent by reputation score and chose the best combination.
                    {costOpt.savings > 0 && (
                      <span style={{ color: "var(--green)", fontWeight: 500 }}>
                        {" "}You saved ${costOpt.savings?.toFixed(2)} vs the naive approach.
                      </span>
                    )}
                  </div>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 24px 1fr 24px 1fr",
                    alignItems: "center", gap: 0, marginBottom: 12,
                  }}>
                    {[
                      { val: `$${costOpt.naiveCost?.toFixed(2)}`, lbl: "NAIVE_PLAN", color: "#F06060", strike: true },
                      { arrow: "→" },
                      { val: `$${costOpt.optimizedCost?.toFixed(2)}`, lbl: "OPTIMIZED", color: "#22D3A5" },
                      { arrow: "→" },
                      { val: `${costOpt.savingsPct}%`, lbl: "SAVED", color: "#F0A030" },
                    ].map((item, i) =>
                      item.arrow ? (
                        <div key={i} style={{ textAlign: "center", color: "var(--text3)", fontFamily: "var(--font-mono)", fontSize: 14 }}>
                          {item.arrow}
                        </div>
                      ) : (
                        <div key={i} style={{ background: "var(--bg3)", borderRadius: 9, padding: "12px 10px", textAlign: "center" }}>
                          <div style={{
                            fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 22,
                            color: item.color, letterSpacing: "-1px",
                            textDecoration: item.strike ? "line-through" : "none",
                          }}>
                            {item.val}
                          </div>
                          <div className="mono-label" style={{ marginTop: 4 }}>{item.lbl}</div>
                        </div>
                      )
                    )}
                  </div>
                  <div style={{
                    fontFamily: "var(--font-ui)", fontSize: 12,
                    color: "var(--text3)", lineHeight: 1.6,
                  }}>
                    {costOpt.notes}
                  </div>
                </div>
              )}

              {/* WOW events */}
              {wowEvents.filter((e) => e.type !== "savings").map((e) => (
                <div key={e._id}>
                  {e.type === "fired" && (
                    <WowBanner
                      type="fired"
                      title="Autonomous quality control — agent fired mid-workflow"
                      context={`KiteFlow detected that ${e.agentName} had a reputation score below the quality threshold and removed it automatically. A better agent was promoted instantly at no extra charge to you.`}
                      detail={e.reason}
                    />
                  )}
                  {e.type === "replaced" && (
                    <WowBanner
                      type="replaced"
                      title={`${e.replacementName} promoted — score ${e.replacementScore}/100`}
                      context="The replacement agent took over seamlessly. Your workflow continued without interruption and you were not charged for the failed agent's slot."
                      detail={e.message}
                    />
                  )}
                </div>
              ))}

              {/* Pipeline */}
              {steps.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div className="mono-label" style={{ marginBottom: 10 }}>WORKFLOW_PIPELINE</div>
                  {steps.map((step, idx) => {
                    const sel = agentSels.find((s) => s.agentId === step.agentId);
                    return (
                      <StepCard key={step.stepIndex} step={step}
                        chosenBecause={sel?.chosenBecause} idx={idx} />
                    );
                  })}
                </div>
              )}

              {/* Final deliverable */}
              {finalOutput && (
                <div className="surface slide-up" style={{ padding: 22, marginBottom: 16 }}>
                  <div className="mono-label" style={{ color: "var(--purple)", marginBottom: 6 }}>
                    FINAL_DELIVERABLE
                  </div>
                  <div style={{
                    fontFamily: "var(--font-ui)", fontSize: 13,
                    color: "var(--text2)", lineHeight: 1.75,
                    whiteSpace: "pre-wrap", fontWeight: 400,
                    marginBottom: 12,
                  }}>
                    {finalOutput}
                  </div>
                  <div style={{
                    fontFamily: "var(--font-ui)", fontSize: 12,
                    color: "var(--text3)", lineHeight: 1.6,
                    padding: "10px 12px", background: "var(--bg3)",
                    borderRadius: 8, border: "1px solid var(--border)",
                  }}>
                    This deliverable was assembled from {steps.filter(s => s.status === "done").length} agent outputs.
                    Every input and output is hashed and attested on Kite chain — you can verify what each agent received and returned at any time.
                  </div>
                </div>
              )}

              {/* Audit trail */}
              {summary && (
                <div className="slide-up">
                  <div className="mono-label" style={{ marginBottom: 6 }}>ON_CHAIN_AUDIT_TRAIL</div>
                  <div style={{
                    fontFamily: "var(--font-ui)", fontSize: 12,
                    color: "var(--text3)", lineHeight: 1.6, marginBottom: 12,
                  }}>
                    Every agent task is permanently recorded on Kite chain. The input hash proves what the agent was asked. The output hash proves what it returned. The payment amount is immutable.
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6, marginBottom: 12 }}>
                    {[
                      { lbl: "TOTAL_SPENT",  val: `$${summary.totalSpentUsdc?.toFixed(2)}`, color: "var(--green)" },
                      { lbl: "STEPS_DONE",   val: `${summary.successfulSteps}/${summary.totalSteps}`, color: "var(--purple)" },
                      { lbl: "CHAIN_PROOFS", val: `${summary.successfulSteps}`, color: "var(--blue)" },
                      { lbl: "COST_SAVED",   val: costOpt ? `$${costOpt.savings?.toFixed(2)}` : "—", color: "var(--amber)" },
                    ].map((m) => (
                      <div key={m.lbl} className="surface" style={{ padding: "12px 10px", textAlign: "center" }}>
                        <div style={{
                          fontFamily: "var(--font-mono)", fontWeight: 700,
                          fontSize: 18, color: m.color, letterSpacing: "-0.5px",
                        }}>
                          {m.val}
                        </div>
                        <div className="mono-label" style={{ marginTop: 4 }}>{m.lbl}</div>
                      </div>
                    ))}
                  </div>

                  {summary.steps?.map((step, i) => {
                    const meta = am(step.agentId);
                    return (
                      <div key={i} className="surface" style={{
                        padding: "10px 14px", marginBottom: 5,
                        display: "flex", alignItems: "center", gap: 12,
                      }}>
                        <div style={{
                          width: 26, height: 26, borderRadius: 6,
                          background: `${meta.accent}12`,
                          border: `1px solid ${meta.accent}30`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontFamily: "var(--font-mono)", fontSize: 9,
                          fontWeight: 700, color: meta.accent, flexShrink: 0,
                        }}>
                          {step.agentIcon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontFamily: "var(--font-head)", fontWeight: 600,
                            fontSize: 12, letterSpacing: "-0.02em", color: "var(--text)",
                          }}>
                            {step.agentName}
                          </div>
                          <div style={{
                            fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--text3)",
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          }}>
                            {step.outputHash?.slice(0, 28)}…
                          </div>
                        </div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: "var(--green)" }}>
                          ${step.paidUsdc?.toFixed(2)}
                        </div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text3)" }}>
                          {step.latencyMs}ms
                        </div>
                        <a href={step.blockExplorerUrl} target="_blank" rel="noreferrer" style={{
                          fontFamily: "var(--font-mono)", fontSize: 9,
                          color: "var(--blue)", textDecoration: "none", flexShrink: 0,
                        }}>
                          SCAN↗
                        </a>
                      </div>
                    );
                  })}

                  <div className="surface" style={{ padding: "14px 16px", marginTop: 8 }}>
                    <div className="mono-label" style={{ marginBottom: 6 }}>WORKFLOW_ID</div>
                    <div style={{
                      fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text3)",
                      marginBottom: 10, wordBreak: "break-all", lineHeight: 1.5,
                    }}>
                      {summary.workflowId}
                    </div>
                    <a href={summary.blockExplorerUrl} target="_blank" rel="noreferrer" style={{
                      fontFamily: "var(--font-mono)", fontSize: 10,
                      color: "var(--blue)", textDecoration: "none", letterSpacing: "0.06em",
                    }}>
                      VIEW_WORKFLOW_ATTESTATION ON KITE_SCAN ↗
                    </a>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}