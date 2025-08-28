const { run } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Contract verification utility for Abunfi deployment
 */
class ContractVerifier {
  constructor(network) {
    this.network = network;
    this.deploymentInfo = this.loadDeploymentInfo();
  }

  loadDeploymentInfo() {
    const deploymentsDir = path.join(__dirname, "..", "deployments");
    const latestFile = path.join(deploymentsDir, `${this.network}-latest.json`);
    
    if (!fs.existsSync(latestFile)) {
      throw new Error(`No deployment found for network: ${this.network}`);
    }
    
    return JSON.parse(fs.readFileSync(latestFile, "utf8"));
  }

  async verifyAll() {
    console.log(`🔍 Starting contract verification for ${this.network}...`);
    
    try {
      await this.verifyVault();
      await this.verifyStrategyManager();
      await this.verifyStrategies();
      
      console.log("✅ All contracts verified successfully!");
    } catch (error) {
      console.error("❌ Verification failed:", error.message);
      throw error;
    }
  }

  async verifyVault() {
    console.log("\n📋 Verifying AbunfiVault...");
    
    await this.verifyContract(
      this.deploymentInfo.contracts.vault,
      "contracts/AbunfiVault.sol:AbunfiVault",
      [this.deploymentInfo.config.USDC]
    );
  }

  async verifyStrategyManager() {
    console.log("\n📋 Verifying StrategyManager...");
    
    await this.verifyContract(
      this.deploymentInfo.contracts.strategyManager,
      "contracts/StrategyManager.sol:StrategyManager",
      []
    );
  }

  async verifyStrategies() {
    const { contracts, config } = this.deploymentInfo;
    
    if (contracts.aaveStrategy) {
      console.log("\n📋 Verifying AaveStrategy...");
      await this.verifyContract(
        contracts.aaveStrategy,
        "contracts/strategies/AaveStrategy.sol:AaveStrategy",
        [
          config.USDC,
          config.aave.pool,
          config.aave.dataProvider,
          contracts.vault
        ]
      );
    }

    if (contracts.compoundStrategy) {
      console.log("\n📋 Verifying CompoundStrategy...");
      await this.verifyContract(
        contracts.compoundStrategy,
        "contracts/strategies/CompoundStrategy.sol:CompoundStrategy",
        [
          config.USDC,
          config.compound.comet,
          config.compound.rewards,
          contracts.vault
        ]
      );
    }

    if (contracts.liquidStakingStrategy) {
      console.log("\n📋 Verifying LiquidStakingStrategy...");
      await this.verifyContract(
        contracts.liquidStakingStrategy,
        "contracts/strategies/LiquidStakingStrategy.sol:LiquidStakingStrategy",
        []
      );
    }

    if (contracts.liquidityProvidingStrategy) {
      console.log("\n📋 Verifying LiquidityProvidingStrategy...");
      await this.verifyContract(
        contracts.liquidityProvidingStrategy,
        "contracts/strategies/LiquidityProvidingStrategy.sol:LiquidityProvidingStrategy",
        []
      );
    }
  }

  async verifyContract(address, contract, constructorArguments) {
    try {
      await run("verify:verify", {
        address,
        contract,
        constructorArguments
      });
      console.log(`✅ ${contract} verified at ${address}`);
    } catch (error) {
      if (error.message.includes("Already Verified")) {
        console.log(`✅ ${contract} already verified at ${address}`);
      } else {
        console.error(`❌ Failed to verify ${contract}:`, error.message);
        throw error;
      }
    }
  }
}

async function main() {
  const network = process.env.HARDHAT_NETWORK || "localhost";
  
  if (network === "localhost" || network === "hardhat") {
    console.log("⚠️ Skipping verification for local network");
    return;
  }
  
  const verifier = new ContractVerifier(network);
  await verifier.verifyAll();
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Verification failed:", error);
      process.exit(1);
    });
}

module.exports = { ContractVerifier };
