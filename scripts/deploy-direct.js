/**
 * KiteFlow — Direct Deploy Script (no hardhat)
 * Run: node scripts/deploy-direct.js
 */

require("dotenv").config({ path: ".env.local" });
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// ── Contract bytecode and ABI (compiled from WorkflowAttestation.sol) ─────────
// We read from the hardhat artifacts if available, otherwise use pre-compiled

async function main() {
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  const rpcUrl = process.env.KITE_RPC_URL || "https://rpc-testnet.gokite.ai/";

  if (!privateKey) {
    console.error("ERROR: DEPLOYER_PRIVATE_KEY not found in .env.local");
    process.exit(1);
  }

  console.log("\n==============================================");
  console.log("  KiteFlow — Direct Deployment (no hardhat)");
  console.log("==============================================");
  console.log("RPC:", rpcUrl);

  // Connect
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log("Deployer:", wallet.address);

  const balance = await provider.getBalance(wallet.address);
  console.log("Balance:", ethers.formatEther(balance), "KITE");

  if (balance === 0n) {
    console.error("ERROR: Wallet has no KITE. Get test KITE from https://faucet.gokite.ai");
    process.exit(1);
  }

  // Load artifact
  const artifactPath = path.join(
    __dirname,
    "../artifacts/contracts/WorkflowAttestation.sol/WorkflowAttestation.json"
  );

  if (!fs.existsSync(artifactPath)) {
    console.error("ERROR: Artifact not found. Run: npx hardhat compile --config hardhat.config.cjs");
    process.exit(1);
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  console.log("\nDeploying WorkflowAttestation...");

  // Deploy
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  const contract = await factory.deploy({ gasLimit: 3_000_000 });

  console.log("Tx sent:", contract.deploymentTransaction()?.hash);
  console.log("Waiting for confirmation...");

  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log("\n✅ Deployed:", contractAddress);

  // Register agents
  console.log("\nRegistering agents...");

  const agents = [
    { id: "kiteflow-data-alpha-v1", name: "DataAlpha", endpoint: "https://kiteflow.vercel.app/api/agents/data", category: "data", pricingModel: "flat", price: ethers.parseUnits("0.5", 18) },
    { id: "kiteflow-copy-prime-v1", name: "CopyPrime", endpoint: "https://kiteflow.vercel.app/api/agents/copy", category: "copy", pricingModel: "per_word", price: ethers.parseUnits("0.35", 18) },
    { id: "kiteflow-image-fx-v1",   name: "ImageFX",   endpoint: "https://kiteflow.vercel.app/api/agents/image", category: "image", pricingModel: "per_image_batch", price: ethers.parseUnits("0.8", 18) },
    { id: "kiteflow-action-x-v1",   name: "ActionX",   endpoint: "https://kiteflow.vercel.app/api/agents/action", category: "action", pricingModel: "success_fee", price: ethers.parseUnits("0.4", 18) },
  ];

  for (const agent of agents) {
    try {
      const tx = await contract.registerAgent(
        agent.id, agent.name, agent.endpoint,
        agent.category, agent.pricingModel, agent.price,
        { gasLimit: 300_000 }
      );
      await tx.wait();
      console.log(" ✓ Registered:", agent.name);
    } catch (err) {
      console.log(" ✗ Failed to register", agent.name, ":", err.message);
    }
  }

  // Save deployment info
  const outDir = path.join(__dirname, "../frontend/lib");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const deploymentData = {
    network: "kite_testnet",
    contractAddress,
    deployer: wallet.address,
    deployedAt: new Date().toISOString(),
    blockExplorer: `https://testnet.kitescan.ai/address/${contractAddress}`,
  };

  fs.writeFileSync(
    path.join(outDir, "deployment.json"),
    JSON.stringify(deploymentData, null, 2)
  );

  // Save ABI
  fs.writeFileSync(
    path.join(outDir, "WorkflowAttestation.abi.json"),
    JSON.stringify(artifact.abi, null, 2)
  );

  console.log("\n==============================================");
  console.log("  Deployment complete!");
  console.log("==============================================");
  console.log("Contract :", contractAddress);
  console.log("Explorer : https://testnet.kitescan.ai/address/" + contractAddress);
  console.log("\nAdd to frontend/.env.local:");
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}`);
  console.log("==============================================\n");
}

main().catch((err) => {
  console.error("Deploy failed:", err.message);
  process.exit(1);
});