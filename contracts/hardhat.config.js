require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// Helper function to validate and get private key
function getPrivateKey() {
  const privateKey = process.env.PRIVATE_KEY;

  // If no private key is provided, return empty array (will use default hardhat accounts)
  if (!privateKey) {
    return [];
  }

  // Remove 0x prefix if present
  const cleanKey = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;

  // Check if it's a valid 64-character hex string (32 bytes)
  if (cleanKey.length === 64 && /^[0-9a-fA-F]+$/.test(cleanKey)) {
    return [`0x${cleanKey}`];
  }

  // If invalid, return empty array and log warning
  console.warn("⚠️ Invalid PRIVATE_KEY in .env file. Using default Hardhat accounts for testing.");
  return [];
}

// Get the validated private key
const accounts = getPrivateKey();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
      // Disable forking for testing to avoid state corruption
      // forking: {
      //   url: process.env.ARBITRUM_RPC_URL || "https://arb1.arbitrum.io/rpc",
      //   blockNumber: 150000000, // Optional: pin to specific block
      // },
    },
    arbitrumGoerli: {
      url: process.env.ARBITRUM_GOERLI_RPC_URL || "https://goerli-rollup.arbitrum.io/rpc",
      accounts: accounts,
      chainId: 421613,
    },
    arbitrumOne: {
      url: process.env.ARBITRUM_RPC_URL || "https://arb1.arbitrum.io/rpc",
      accounts: accounts,
      chainId: 42161,
    },
    base: {
      url: process.env.BASE_RPC_URL || "https://mainnet.base.org",
      accounts: accounts,
      chainId: 8453,
    },
    baseGoerli: {
      url: process.env.BASE_GOERLI_RPC_URL || "https://goerli.base.org",
      accounts: accounts,
      chainId: 84531,
    },
    // Additional networks for comprehensive deployment
    ethereum: {
      url: process.env.ETHEREUM_RPC_URL || "https://eth-mainnet.g.alchemy.com/v2/demo",
      accounts: accounts,
      chainId: 1,
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://eth-sepolia.g.alchemy.com/v2/demo",
      accounts: accounts,
      chainId: 11155111,
    },
    goerli: {
      url: process.env.GOERLI_RPC_URL || "https://eth-goerli.g.alchemy.com/v2/demo",
      accounts: accounts,
      chainId: 5,
    },
    polygon: {
      url: process.env.POLYGON_RPC_URL || "https://polygon-mainnet.g.alchemy.com/v2/demo",
      accounts: accounts,
      chainId: 137,
    },
    mumbai: {
      url: process.env.MUMBAI_RPC_URL || "https://polygon-mumbai.g.alchemy.com/v2/demo",
      accounts: accounts,
      chainId: 80001,
    },
  },
  etherscan: {
    apiKey: {
      // Ethereum networks
      mainnet: process.env.ETHERSCAN_API_KEY || "",
      sepolia: process.env.ETHERSCAN_API_KEY || "",
      goerli: process.env.ETHERSCAN_API_KEY || "",
      // Arbitrum networks
      arbitrumOne: process.env.ARBISCAN_API_KEY || "",
      arbitrumGoerli: process.env.ARBISCAN_API_KEY || "",
      // Base networks
      base: process.env.BASESCAN_API_KEY || "",
      baseGoerli: process.env.BASESCAN_API_KEY || "",
      // Polygon networks
      polygon: process.env.POLYGONSCAN_API_KEY || "",
      polygonMumbai: process.env.POLYGONSCAN_API_KEY || "",
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
};
