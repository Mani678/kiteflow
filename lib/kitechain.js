/**
 * KiteFlow — Kite Chain Library
 * Reads from and writes to the deployed WorkflowAttestation contract.
 * All write functions are fire-and-forget safe — errors are logged but never
 * thrown, so chain latency never blocks the user-facing workflow stream.
 */

import { ethers } from "ethers";

const RPC_URL = process.env.KITE_RPC_URL || "https://rpc-testnet.gokite.ai/";
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

const ABI = [
  "function startWorkflow(bytes32 workflowId, bytes32 goalHash, uint256 budgetUsdc) external",
  "function attestTask(bytes32 workflowId, string agentId, bytes32 inputHash, bytes32 outputHash, uint256 paidUsdc, uint256 latencyMs, bool success, bool agentWasFired) external",
  "function recordAgentFired(bytes32 workflowId, string agentId, string reason) external",
  "function recordRefund(bytes32 workflowId, string reason) external",
  "function finalizeWorkflow(bytes32 workflowId) external",
  "function getAgentReputationScore(string agentId) external view returns (uint256)",
  "function getWorkflowTasks(bytes32 workflowId) external view returns (tuple(bytes32,uint8,string,bytes32,bytes32,uint256,uint256,uint256,bool,bool)[])",
  "function getWorkflowCount() external view returns (uint256)",
  "function getAgentCount() external view returns (uint256)",
  "function getProtocolStats() external view returns (uint256, uint256, uint256, uint256)",
  "function agentStats(string) external view returns (string,string,string,string,string,uint256,uint256,uint256,uint256,uint256,uint256,bool)",
];

function getProvider() {
  return new ethers.JsonRpcProvider(RPC_URL);
}

function getSigner() {
  const pk = process.env.AGENT_WALLET_PRIVATE_KEY;
  if (!pk) return null;
  return new ethers.Wallet(pk, getProvider());
}

function getContract(signerOrProvider) {
  if (!CONTRACT_ADDRESS) return null;
  return new ethers.Contract(CONTRACT_ADDRESS, ABI, signerOrProvider);
}

async function safeWrite(fn) {
  try {
    const signer = getSigner();
    if (!signer) {
      console.warn("[kitechain] No signer — skipping chain write");
      return null;
    }
    const contract = getContract(signer);
    if (!contract) {
      console.warn("[kitechain] No contract address — skipping chain write");
      return null;
    }
    const tx = await fn(contract);
    const receipt = await tx.wait();
    return receipt;
  } catch (err) {
    console.error("[kitechain] write failed:", err.message);
    return null;
  }
}

async function safeRead(fn, fallback = null) {
  try {
    const contract = getContract(getProvider());
    if (!contract) return fallback;
    return await fn(contract);
  } catch (err) {
    console.error("[kitechain] read failed:", err.message);
    return fallback;
  }
}

// ── Writes ─────────────────────────────────────────────────────────────────

export async function chainStartWorkflow({ workflowId, goalHash, budgetUsdc }) {
  return safeWrite((c) =>
    c.startWorkflow(workflowId, goalHash, budgetUsdc, { gasLimit: 300_000 })
  );
}

export async function chainAttestTask({
  workflowId,
  agentId,
  inputHash,
  outputHash,
  paidUsdc,
  latencyMs,
  success,
  agentWasFired = false,
}) {
  return safeWrite((c) =>
    c.attestTask(
      workflowId,
      agentId,
      inputHash,
      outputHash,
      paidUsdc,
      BigInt(latencyMs),
      success,
      agentWasFired,
      { gasLimit: 400_000 }
    )
  );
}

export async function chainRecordFired({ workflowId, agentId, reason }) {
  return safeWrite((c) =>
    c.recordAgentFired(workflowId, agentId, reason, { gasLimit: 200_000 })
  );
}

export async function chainRecordRefund({ workflowId, reason }) {
  return safeWrite((c) =>
    c.recordRefund(workflowId, reason, { gasLimit: 200_000 })
  );
}

export async function chainFinalize({ workflowId }) {
  return safeWrite((c) =>
    c.finalizeWorkflow(workflowId, { gasLimit: 200_000 })
  );
}

// ── Reads ──────────────────────────────────────────────────────────────────

export async function getReputationScore(agentId) {
  const score = await safeRead((c) => c.getAgentReputationScore(agentId), null);
  return score !== null ? Number(score) : null;
}

export async function getProtocolStats() {
  const result = await safeRead((c) => c.getProtocolStats(), null);
  if (!result) return { workflows: 0, tasks: 0, usdc: "0", agents: 0 };
  return {
    workflows: Number(result[0]),
    tasks: Number(result[1]),
    usdc: ethers.formatUnits(result[2], 18),
    agents: Number(result[3]),
  };
}

export async function getWorkflowTasks(workflowId) {
  const tasks = await safeRead(
    (c) => c.getWorkflowTasks(workflowId),
    []
  );
  return tasks.map((t) => ({
    workflowId: t[0],
    stepIndex: Number(t[1]),
    agentId: t[2],
    inputHash: t[3],
    outputHash: t[4],
    paidUsdc: ethers.formatUnits(t[5], 18),
    latencyMs: Number(t[6]),
    timestamp: Number(t[7]),
    success: t[8],
    agentWasFired: t[9],
  }));
}

export async function getWalletBalance() {
  try {
    const signer = getSigner();
    if (!signer) return null;
    const provider = getProvider();
    const balWei = await provider.getBalance(signer.address);
    return {
      address: signer.address,
      kite: parseFloat(ethers.formatEther(balWei)).toFixed(4),
    };
  } catch {
    return null;
  }
}
