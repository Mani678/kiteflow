require("@nomicfoundation/hardhat-ethers");
require("dotenv").config({ path: ".env.local" });

const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    kite_testnet: {
      url: "https://rpc-testnet.gokite.ai/",
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