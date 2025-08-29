// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/AbunfiVault.sol";
import "../src/strategies/AaveStrategy.sol";
import "../src/mocks/MockERC20.sol";

contract ExportABIsScript is Script {
    function run() external {
        console.log("Exporting contract ABIs...");
        
        // Get contract artifacts
        string memory vaultABI = vm.readFile("out/AbunfiVault.sol/AbunfiVault.json");
        string memory aaveStrategyABI = vm.readFile("out/AaveStrategy.sol/AaveStrategy.json");
        string memory erc20ABI = vm.readFile("out/MockERC20.sol/MockERC20.json");
        
        // Create exports directory
        vm.createDir("exports", true);
        
        // Write ABI files
        vm.writeFile("exports/AbunfiVault.json", vaultABI);
        vm.writeFile("exports/AaveStrategy.json", aaveStrategyABI);
        vm.writeFile("exports/ERC20.json", erc20ABI);
        
        console.log("ABIs exported to exports/ directory");
    }
}
