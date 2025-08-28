const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("🚀 Starting Abunfi deployment...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Contract addresses (Arbitrum mainnet)
  const USDC_ADDRESS = process.env.USDC_ADDRESS || "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";
  const AAVE_POOL_ADDRESS = process.env.AAVE_POOL_ADDRESS || "0x794a61358D6845594F94dc1DB02A252b5b4814aD";
  const AAVE_DATA_PROVIDER = process.env.AAVE_POOL_DATA_PROVIDER || "0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654";

  console.log("Using USDC address:", USDC_ADDRESS);
  console.log("Using Aave Pool address:", AAVE_POOL_ADDRESS);
  console.log("Using Aave Data Provider:", AAVE_DATA_PROVIDER);

  // Deploy AbunfiVault
  console.log("\n📦 Deploying AbunfiVault...");
  const AbunfiVault = await ethers.getContractFactory("AbunfiVault");
  const vault = await AbunfiVault.deploy(USDC_ADDRESS);
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log("✅ AbunfiVault deployed to:", vaultAddress);

  // Deploy AaveStrategy
  console.log("\n📦 Deploying AaveStrategy...");
  const AaveStrategy = await ethers.getContractFactory("AaveStrategy");
  const aaveStrategy = await AaveStrategy.deploy(
    USDC_ADDRESS,
    AAVE_POOL_ADDRESS,
    AAVE_DATA_PROVIDER,
    vaultAddress
  );
  await aaveStrategy.waitForDeployment();
  const aaveStrategyAddress = await aaveStrategy.getAddress();
  console.log("✅ AaveStrategy deployed to:", aaveStrategyAddress);

  // Add strategy to vault
  console.log("\n🔗 Adding AaveStrategy to vault...");
  const addStrategyTx = await vault.addStrategy(aaveStrategyAddress);
  await addStrategyTx.wait();
  console.log("✅ AaveStrategy added to vault");

  // Note: Using Web3Auth for social login and wallet management
  // No need for custom Account Abstraction implementation

  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  
  // Check vault configuration
  const vaultAsset = await vault.asset();
  console.log("Vault asset (USDC):", vaultAsset);
  console.log("Vault minimum deposit:", await vault.MINIMUM_DEPOSIT());
  
  // Check strategy configuration
  const strategyAsset = await aaveStrategy.asset();
  const strategyVault = await aaveStrategy.vault();
  console.log("Strategy asset:", strategyAsset);
  console.log("Strategy vault:", strategyVault);
  console.log("Strategy name:", await aaveStrategy.name());

  // Summary
  console.log("\n🎉 Deployment Summary:");
  console.log("=".repeat(50));
  console.log("AbunfiVault:", vaultAddress);
  console.log("AaveStrategy:", aaveStrategyAddress);
  console.log("Note: Using Web3Auth for wallet management");
  console.log("=".repeat(50));

  // Save deployment info
  const deploymentInfo = {
    network: await ethers.provider.getNetwork(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      AbunfiVault: vaultAddress,
      AaveStrategy: aaveStrategyAddress
    },
    config: {
      USDC_ADDRESS,
      AAVE_POOL_ADDRESS,
      AAVE_DATA_PROVIDER
    }
  };

  console.log("\n💾 Deployment info saved to deployments.json");
  const fs = require("fs");
  fs.writeFileSync("deployments.json", JSON.stringify(deploymentInfo, null, 2));

  console.log("\n✨ Deployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
