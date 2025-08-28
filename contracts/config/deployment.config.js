/**
 * Deployment configuration for Abunfi protocol
 * Contains network-specific settings, contract addresses, and deployment parameters
 */

const DEPLOYMENT_CONFIG = {
  // Mainnet configurations
  mainnet: {
    ethereum: {
      name: "Ethereum Mainnet",
      chainId: 1,
      rpcUrl: process.env.ETHEREUM_RPC_URL || "https://eth-mainnet.alchemyapi.io/v2/YOUR-API-KEY",
      blockExplorer: "https://etherscan.io",
      tokens: {
        USDC: "0xA0b86a33E6441b8dB2B2B0d4C1C1C1C1C1C1C1C1",
        WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
        USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7"
      },
      protocols: {
        aave: {
          pool: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",
          dataProvider: "0x7B4EB56E7CD4b454BA8ff71E4518426369a138a3",
          aUSDC: "0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c"
        },
        compound: {
          comet: "0xc3d688B66703497DAA19211EEdff47f25384cdc3",
          rewards: "0x1B0e765F6224C21223AeA2af16c1C46E38885a40"
        },
        lido: {
          stETH: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",
          wstETH: "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0"
        },
        rocketPool: {
          rETH: "0xae78736Cd615f374D3085123A210448E74Fc6393",
          rocketStorage: "0x1d8f8f00cfa6758d7bE78336684788Fb0ee0Fa46"
        },
        curve: {
          factory: "0xB9fC157394Af804a3578134A6585C0dc9cc990d4",
          registry: "0x90E00ACe148ca3b23Ac1bC8C240C2a7Dd9c2d7f5",
          threePool: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7"
        },
        uniswap: {
          factory: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
          positionManager: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
          router: "0xE592427A0AEce92De3Edee1F18E0157C05861564"
        }
      },
      gasSettings: {
        gasPrice: "auto",
        gasLimit: 8000000,
        maxFeePerGas: "auto",
        maxPriorityFeePerGas: "auto"
      }
    },
    arbitrum: {
      name: "Arbitrum One",
      chainId: 42161,
      rpcUrl: process.env.ARBITRUM_RPC_URL || "https://arb-mainnet.g.alchemy.com/v2/YOUR-API-KEY",
      blockExplorer: "https://arbiscan.io",
      tokens: {
        USDC: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
        WETH: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
        DAI: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
        USDT: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9"
      },
      protocols: {
        aave: {
          pool: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
          dataProvider: "0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654"
        },
        compound: {
          comet: "0xA5EDBDD9646f8dFF606d7448e414884C7d905dCA",
          rewards: "0x88730d254A2f7e6AC8388c3198aFd694bA9f7fae"
        },
        curve: {
          factory: "0xb9fC157394Af804a3578134A6585C0dc9cc990d4",
          registry: "0x445FE580eF8d70FF569aB36e80c647af338db351"
        },
        uniswap: {
          factory: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
          positionManager: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88"
        }
      },
      gasSettings: {
        gasPrice: "auto",
        gasLimit: 10000000
      }
    },
    polygon: {
      name: "Polygon",
      chainId: 137,
      rpcUrl: process.env.POLYGON_RPC_URL || "https://polygon-mainnet.g.alchemy.com/v2/YOUR-API-KEY",
      blockExplorer: "https://polygonscan.com",
      tokens: {
        USDC: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
        WETH: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
        DAI: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
        USDT: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"
      },
      protocols: {
        aave: {
          pool: "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
          dataProvider: "0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654"
        }
      },
      gasSettings: {
        gasPrice: "auto",
        gasLimit: 8000000
      }
    }
  },

  // Testnet configurations
  testnet: {
    sepolia: {
      name: "Sepolia Testnet",
      chainId: 11155111,
      rpcUrl: process.env.SEPOLIA_RPC_URL || "https://eth-sepolia.g.alchemy.com/v2/YOUR-API-KEY",
      blockExplorer: "https://sepolia.etherscan.io",
      faucets: {
        ETH: "https://sepoliafaucet.com/",
        USDC: "https://faucet.circle.com/"
      },
      gasSettings: {
        gasPrice: "auto",
        gasLimit: 8000000
      }
    },
    goerli: {
      name: "Goerli Testnet",
      chainId: 5,
      rpcUrl: process.env.GOERLI_RPC_URL || "https://eth-goerli.g.alchemy.com/v2/YOUR-API-KEY",
      blockExplorer: "https://goerli.etherscan.io",
      tokens: {
        USDC: "0x07865c6E87B9F70255377e024ace6630C1Eaa37F",
        WETH: "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6"
      },
      protocols: {
        aave: {
          pool: "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951",
          dataProvider: "0x9BE876c6DC42215B00d7efe892E2691C3bc35d10"
        }
      },
      gasSettings: {
        gasPrice: "auto",
        gasLimit: 8000000
      }
    },
    mumbai: {
      name: "Polygon Mumbai",
      chainId: 80001,
      rpcUrl: process.env.MUMBAI_RPC_URL || "https://polygon-mumbai.g.alchemy.com/v2/YOUR-API-KEY",
      blockExplorer: "https://mumbai.polygonscan.com",
      gasSettings: {
        gasPrice: "auto",
        gasLimit: 8000000
      }
    },
    arbitrumGoerli: {
      name: "Arbitrum Goerli",
      chainId: 421613,
      rpcUrl: process.env.ARBITRUM_GOERLI_RPC_URL || "https://goerli-rollup.arbitrum.io/rpc",
      blockExplorer: "https://goerli.arbiscan.io",
      gasSettings: {
        gasPrice: "auto",
        gasLimit: 10000000
      }
    }
  },

  // Local development
  local: {
    hardhat: {
      name: "Hardhat Network",
      chainId: 31337,
      rpcUrl: "http://127.0.0.1:8545",
      gasSettings: {
        gasPrice: 20000000000, // 20 gwei
        gasLimit: 12000000
      }
    },
    localhost: {
      name: "Localhost",
      chainId: 1337,
      rpcUrl: "http://127.0.0.1:8545",
      gasSettings: {
        gasPrice: 20000000000,
        gasLimit: 12000000
      }
    }
  }
};

// Strategy configuration
const STRATEGY_CONFIG = {
  aave: {
    name: "Aave USDC Lending Strategy",
    riskScore: 20,
    weight: 3000, // 30%
    maxAllocation: 4000, // 40%
    minAllocation: 1000, // 10%
    enabled: true
  },
  compound: {
    name: "Compound V3 USDC Lending Strategy",
    riskScore: 25,
    weight: 2500, // 25%
    maxAllocation: 3500, // 35%
    minAllocation: 800, // 8%
    enabled: true
  },
  liquidStaking: {
    name: "Liquid Staking Strategy",
    riskScore: 30,
    weight: 2000, // 20%
    maxAllocation: 3000, // 30%
    minAllocation: 500, // 5%
    enabled: true,
    networks: ["ethereum"] // Only available on Ethereum
  },
  liquidityProviding: {
    name: "Liquidity Providing Strategy",
    riskScore: 40,
    weight: 2500, // 25%
    maxAllocation: 3000, // 30%
    minAllocation: 500, // 5%
    enabled: true
  }
};

// Deployment parameters
const DEPLOYMENT_PARAMS = {
  vault: {
    minimumDeposit: "4000000", // 4 USDC (6 decimals)
    reserveRatio: 1000, // 10%
    maxStrategies: 10
  },
  strategyManager: {
    riskTolerance: 50, // Medium risk
    performanceWindow: 30 * 24 * 3600, // 30 days
    rebalanceThreshold: 500 // 5%
  },
  timelock: {
    delay: 2 * 24 * 3600 // 2 days
  }
};

// Contract verification settings
const VERIFICATION_CONFIG = {
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
    networks: {
      ethereum: "etherscan",
      arbitrum: "arbiscan",
      polygon: "polygonscan",
      sepolia: "etherscan",
      goerli: "etherscan",
      mumbai: "polygonscan",
      arbitrumGoerli: "arbiscan"
    }
  },
  sourcify: {
    enabled: true,
    endpoint: "https://sourcify.dev/server"
  }
};

// Security settings
const SECURITY_CONFIG = {
  multisig: {
    ethereum: process.env.ETHEREUM_MULTISIG,
    arbitrum: process.env.ARBITRUM_MULTISIG,
    polygon: process.env.POLYGON_MULTISIG
  },
  timelock: {
    enabled: true,
    delay: 2 * 24 * 3600 // 2 days
  },
  pauseGuardian: process.env.PAUSE_GUARDIAN,
  emergencyAdmin: process.env.EMERGENCY_ADMIN
};

function getNetworkConfig(network) {
  // Check mainnet first
  if (DEPLOYMENT_CONFIG.mainnet[network]) {
    return { ...DEPLOYMENT_CONFIG.mainnet[network], type: "mainnet" };
  }
  
  // Check testnet
  if (DEPLOYMENT_CONFIG.testnet[network]) {
    return { ...DEPLOYMENT_CONFIG.testnet[network], type: "testnet" };
  }
  
  // Check local
  if (DEPLOYMENT_CONFIG.local[network]) {
    return { ...DEPLOYMENT_CONFIG.local[network], type: "local" };
  }
  
  throw new Error(`Unsupported network: ${network}`);
}

function getStrategyConfig(strategy, network) {
  const config = STRATEGY_CONFIG[strategy];
  if (!config) {
    throw new Error(`Unknown strategy: ${strategy}`);
  }
  
  // Check if strategy is enabled for this network
  if (config.networks && !config.networks.includes(network)) {
    return null;
  }
  
  return config;
}

function getDeploymentParams() {
  return DEPLOYMENT_PARAMS;
}

function getVerificationConfig() {
  return VERIFICATION_CONFIG;
}

function getSecurityConfig() {
  return SECURITY_CONFIG;
}

module.exports = {
  DEPLOYMENT_CONFIG,
  STRATEGY_CONFIG,
  DEPLOYMENT_PARAMS,
  VERIFICATION_CONFIG,
  SECURITY_CONFIG,
  getNetworkConfig,
  getStrategyConfig,
  getDeploymentParams,
  getVerificationConfig,
  getSecurityConfig
};
