const fs = require('fs');
const path = require('path');

// Function to fix ethers v6 compatibility issues
function fixEthersV6(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix ethers.utils.parseUnits -> ethers.parseUnits
  content = content.replace(/ethers\.utils\.parseUnits/g, 'ethers.parseUnits');
  content = content.replace(/ethers\.utils\.parseEther/g, 'ethers.parseEther');
  content = content.replace(/ethers\.utils\.formatUnits/g, 'ethers.formatUnits');
  content = content.replace(/ethers\.utils\.formatEther/g, 'ethers.formatEther');
  
  // Fix .deployed() -> .waitForDeployment()
  content = content.replace(/\.deployed\(\)/g, '.waitForDeployment()');
  
  // Fix contract.address -> await contract.getAddress()
  // This is more complex, so we'll do it carefully
  content = content.replace(/(\w+)\.address(?!\w)/g, 'await $1.getAddress()');
  
  // Fix signer.address -> signer.address (this should stay the same)
  content = content.replace(/await (owner|user\d+|deployer|vault)\.getAddress\(\)/g, '$1.address');
  
  // Fix BigNumber operations
  content = content.replace(/\.add\(/g, ' + ');
  content = content.replace(/\.sub\(/g, ' - ');
  content = content.replace(/\.mul\(/g, ' * ');
  content = content.replace(/\.div\(/g, ' / ');
  
  fs.writeFileSync(filePath, content);
  console.log(`Fixed ${filePath}`);
}

// Get all test files
const testDir = path.join(__dirname, 'test');
const testFiles = fs.readdirSync(testDir).filter(file => file.endsWith('.test.js'));

console.log('Fixing ethers v6 compatibility issues...');
testFiles.forEach(file => {
  const filePath = path.join(testDir, file);
  fixEthersV6(filePath);
});

console.log('Done!');
