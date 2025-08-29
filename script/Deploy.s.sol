// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/AbunfiVault.sol";
import "../src/strategies/AaveStrategy.sol";

contract DeployScript is Script {
    // Default addresses for Arbitrum mainnet
    address constant USDC_ADDRESS = 0xaf88d065e77c8cC2239327C5EDb3A432268e5831;
    address constant AAVE_POOL_ADDRESS = 0x794a61358D6845594F94dc1DB02A252b5b4814aD;
    address constant AAVE_DATA_PROVIDER = 0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654;
    
    function run() external {
        console.log("Starting Abunfi deployment...");
        
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying contracts with account:", deployer);
        console.log("Account balance:", deployer.balance);
        
        // Get addresses from environment or use defaults
        address usdcAddress = vm.envOr("USDC_ADDRESS", USDC_ADDRESS);
        address aavePoolAddress = vm.envOr("AAVE_POOL_ADDRESS", AAVE_POOL_ADDRESS);
        address aaveDataProvider = vm.envOr("AAVE_DATA_PROVIDER", AAVE_DATA_PROVIDER);
        
        console.log("Using USDC address:", usdcAddress);
        console.log("Using Aave Pool address:", aavePoolAddress);
        console.log("Using Aave Data Provider:", aaveDataProvider);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy AbunfiVault
        console.log("Deploying AbunfiVault...");
        AbunfiVault vault = new AbunfiVault(usdcAddress);
        console.log("AbunfiVault deployed to:", address(vault));
        
        // Deploy AaveStrategy
        console.log("Deploying AaveStrategy...");
        AaveStrategy aaveStrategy = new AaveStrategy(
            usdcAddress,
            aavePoolAddress,
            aaveDataProvider,
            address(vault)
        );
        console.log("AaveStrategy deployed to:", address(aaveStrategy));
        
        // Add strategy to vault
        console.log("Adding AaveStrategy to vault...");
        vault.addStrategy(address(aaveStrategy));
        console.log("AaveStrategy added to vault");
        
        vm.stopBroadcast();
        
        // Verify deployment
        console.log("Verifying deployment...");
        console.log("Vault asset (USDC):", address(vault.asset()));
        console.log("Vault minimum deposit:", vault.MINIMUM_DEPOSIT());
        console.log("Strategy asset:", address(aaveStrategy.asset()));
        console.log("Strategy vault:", address(aaveStrategy.vault()));
        console.log("Strategy name:", aaveStrategy.name());
        
        // Summary
        console.log("Deployment Summary:");
        console.log("==================================================");
        console.log("AbunfiVault:", address(vault));
        console.log("AaveStrategy:", address(aaveStrategy));
        console.log("Note: Using Web3Auth for wallet management");
        console.log("==================================================");
        
        // Save deployment addresses to file
        string memory deploymentJson = string.concat(
            '{\n',
            '  "AbunfiVault": "', vm.toString(address(vault)), '",\n',
            '  "AaveStrategy": "', vm.toString(address(aaveStrategy)), '",\n',
            '  "USDC": "', vm.toString(usdcAddress), '",\n',
            '  "AavePool": "', vm.toString(aavePoolAddress), '",\n',
            '  "AaveDataProvider": "', vm.toString(aaveDataProvider), '"\n',
            '}'
        );
        
        vm.writeFile("deployments.json", deploymentJson);
        console.log("Deployment info saved to deployments.json");
        console.log("Deployment completed successfully!");
    }
}
