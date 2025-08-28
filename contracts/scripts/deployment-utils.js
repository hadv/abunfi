const fs = require("fs");
const path = require("path");
const { ethers } = require("hardhat");

/**
 * Deployment utilities for Abunfi protocol
 */
class DeploymentUtils {
  static async waitForConfirmations(tx, confirmations = 2) {
    console.log(`⏳ Waiting for ${confirmations} confirmations...`);
    const receipt = await tx.wait(confirmations);
    console.log(`✅ Transaction confirmed with ${receipt.confirmations} confirmations`);
    return receipt;
  }

  static async estimateGas(contractFactory, ...args) {
    try {
      const deployTx = await contractFactory.getDeployTransaction(...args);
      const gasEstimate = await ethers.provider.estimateGas(deployTx);
      return gasEstimate;
    } catch (error) {
      console.warn("⚠️ Gas estimation failed:", error.message);
      return ethers.parseUnits("8000000", "wei"); // Default fallback
    }
  }

  static async deployWithRetry(contractFactory, args = [], retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        console.log(`📦 Deploying ${contractFactory.contractName}... (attempt ${i + 1}/${retries})`);
        
        const gasEstimate = await this.estimateGas(contractFactory, ...args);
        const gasLimit = gasEstimate * 120n / 100n; // Add 20% buffer
        
        const contract = await contractFactory.deploy(...args, { gasLimit });
        await contract.waitForDeployment();
        
        console.log(`✅ ${contractFactory.contractName} deployed successfully`);
        return contract;
      } catch (error) {
        console.error(`❌ Deployment attempt ${i + 1} failed:`, error.message);
        
        if (i === retries - 1) {
          throw error;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }

  static async verifyBalance(signer, minBalance = "0.1") {
    const balance = await signer.provider.getBalance(signer.address);
    const minBalanceWei = ethers.parseEther(minBalance);
    
    if (balance < minBalanceWei) {
      throw new Error(
        `Insufficient balance: ${ethers.formatEther(balance)} ETH < ${minBalance} ETH`
      );
    }
    
    console.log(`✅ Balance check passed: ${ethers.formatEther(balance)} ETH`);
  }

  static async checkNetworkConnection(provider) {
    try {
      const network = await provider.getNetwork();
      const blockNumber = await provider.getBlockNumber();
      
      console.log(`🌐 Connected to ${network.name} (Chain ID: ${network.chainId})`);
      console.log(`📊 Current block: ${blockNumber}`);
      
      return { network, blockNumber };
    } catch (error) {
      throw new Error(`Network connection failed: ${error.message}`);
    }
  }

  static saveDeploymentArtifacts(network, contracts, config = {}) {
    const artifacts = {
      network,
      timestamp: new Date().toISOString(),
      contracts,
      config,
      abis: {}
    };

    // Extract ABIs
    Object.entries(contracts).forEach(([name, address]) => {
      try {
        const artifactPath = path.join(
          __dirname,
          "..",
          "artifacts",
          "contracts",
          `${name}.sol`,
          `${name}.json`
        );
        
        if (fs.existsSync(artifactPath)) {
          const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
          artifacts.abis[name] = artifact.abi;
        }
      } catch (error) {
        console.warn(`⚠️ Could not load ABI for ${name}`);
      }
    });

    // Save to deployments directory
    const deploymentsDir = path.join(__dirname, "..", "deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const filename = `${network}-artifacts.json`;
    const filepath = path.join(deploymentsDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(artifacts, null, 2));
    console.log(`💾 Deployment artifacts saved to: ${filepath}`);

    return artifacts;
  }

  static loadDeploymentArtifacts(network) {
    const deploymentsDir = path.join(__dirname, "..", "deployments");
    const filepath = path.join(deploymentsDir, `${network}-artifacts.json`);
    
    if (!fs.existsSync(filepath)) {
      throw new Error(`No deployment artifacts found for network: ${network}`);
    }
    
    return JSON.parse(fs.readFileSync(filepath, "utf8"));
  }

  static async validateDeployment(contracts, network) {
    console.log("\n🔍 Validating deployment...");
    
    const validationResults = {};
    
    for (const [name, address] of Object.entries(contracts)) {
      try {
        // Check if contract exists
        const code = await ethers.provider.getCode(address);
        if (code === "0x") {
          throw new Error("No contract code found");
        }
        
        // Try to call a view function
        const contract = await ethers.getContractAt(name, address);
        
        // Contract-specific validations
        if (name === "AbunfiVault") {
          await contract.asset();
          await contract.MINIMUM_DEPOSIT();
        } else if (name.includes("Strategy")) {
          await contract.name();
          await contract.asset();
        }
        
        validationResults[name] = { status: "✅", address };
        console.log(`✅ ${name} validation passed`);
        
      } catch (error) {
        validationResults[name] = { status: "❌", address, error: error.message };
        console.error(`❌ ${name} validation failed:`, error.message);
      }
    }
    
    return validationResults;
  }

  static generateDeploymentReport(deploymentInfo, validationResults) {
    const report = {
      summary: {
        network: deploymentInfo.network,
        timestamp: deploymentInfo.timestamp,
        deployer: deploymentInfo.deployer,
        totalContracts: Object.keys(deploymentInfo.contracts).length,
        successfulValidations: Object.values(validationResults).filter(r => r.status === "✅").length
      },
      contracts: {},
      validation: validationResults,
      gasUsed: deploymentInfo.gasUsed || "N/A",
      estimatedCost: deploymentInfo.estimatedCost || "N/A"
    };

    // Add contract details
    Object.entries(deploymentInfo.contracts).forEach(([name, address]) => {
      report.contracts[name] = {
        address,
        verified: validationResults[name]?.status === "✅",
        blockExplorer: this.getBlockExplorerUrl(deploymentInfo.network, address)
      };
    });

    return report;
  }

  static getBlockExplorerUrl(network, address) {
    const explorers = {
      ethereum: "https://etherscan.io",
      arbitrum: "https://arbiscan.io",
      polygon: "https://polygonscan.com",
      sepolia: "https://sepolia.etherscan.io",
      goerli: "https://goerli.etherscan.io",
      mumbai: "https://mumbai.polygonscan.com"
    };

    const baseUrl = explorers[network];
    return baseUrl ? `${baseUrl}/address/${address}` : null;
  }

  static async setupTestEnvironment(contracts, network) {
    console.log("\n🧪 Setting up test environment...");
    
    if (network.includes("mainnet") || network === "arbitrum" || network === "polygon") {
      console.log("⚠️ Skipping test setup for mainnet");
      return;
    }

    try {
      const [deployer] = await ethers.getSigners();
      
      // If we have mock contracts, mint test tokens
      if (contracts.mockUSDC) {
        const mockUSDC = await ethers.getContractAt("MockERC20", contracts.mockUSDC);
        await mockUSDC.mint(deployer.address, ethers.parseUnits("100000", 6));
        console.log("✅ Minted 100,000 test USDC");
      }
      
      // Setup mock yields if available
      if (contracts.mockAavePool) {
        const mockAavePool = await ethers.getContractAt("MockAavePool", contracts.mockAavePool);
        await mockAavePool.setSupplyRate(ethers.parseUnits("0.05", 27)); // 5% APY
        console.log("✅ Configured mock Aave with 5% APY");
      }
      
      console.log("✅ Test environment setup completed");
      
    } catch (error) {
      console.error("❌ Test environment setup failed:", error.message);
    }
  }

  static printDeploymentSummary(report) {
    console.log("\n" + "=".repeat(80));
    console.log("🎉 DEPLOYMENT SUMMARY");
    console.log("=".repeat(80));
    console.log(`Network: ${report.summary.network}`);
    console.log(`Deployer: ${report.summary.deployer}`);
    console.log(`Timestamp: ${report.summary.timestamp}`);
    console.log(`Total Contracts: ${report.summary.totalContracts}`);
    console.log(`Successful Validations: ${report.summary.successfulValidations}/${report.summary.totalContracts}`);
    
    if (report.gasUsed !== "N/A") {
      console.log(`Gas Used: ${report.gasUsed}`);
    }
    
    if (report.estimatedCost !== "N/A") {
      console.log(`Estimated Cost: ${report.estimatedCost} ETH`);
    }
    
    console.log("\n📋 Deployed Contracts:");
    Object.entries(report.contracts).forEach(([name, info]) => {
      const status = info.verified ? "✅" : "❌";
      console.log(`${status} ${name}: ${info.address}`);
      if (info.blockExplorer) {
        console.log(`   🔗 ${info.blockExplorer}`);
      }
    });
    
    console.log("=".repeat(80));
  }

  static async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static formatGas(gasAmount) {
    return gasAmount.toLocaleString();
  }

  static formatEther(weiAmount) {
    return ethers.formatEther(weiAmount);
  }
}

module.exports = { DeploymentUtils };
