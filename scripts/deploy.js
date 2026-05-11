require("@nomicfoundation/hardhat-ethers");

const fs = require("fs");
const path = require("path");

function loadEnv() {
  const envPath = path.join(__dirname, ".env.local");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (key && rest.length) {
      process.env[key.trim()] = rest.join("=").trim();
    }
  }
}

loadEnv();

const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;

if (!PRIVATE_KEY) {
  console.warn("Warning: DEPLOYER_PRIVATE_KEY not found in .env.local");
}

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    kite_testnet: {
      url: process.env.KITE_RPC_URL || "https://rpc-testnet.gokite.ai/",
      chainId: 2368,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
    kite_mainnet: {
      url: "https://rpc.gokite.ai/",
      chainId: 2366,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
};