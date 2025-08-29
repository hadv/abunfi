#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Verification script to ensure direct submodule ABI references work
 */

console.log('🔍 Verifying Direct Submodule ABI Integration...\n');

let hasErrors = false;

// Check if submodule exists and has ABIs
const submoduleDir = path.join(__dirname, '..', 'contracts-submodule');
const submoduleExports = path.join(submoduleDir, 'exports');

console.log('📁 Checking submodule structure...');
if (!fs.existsSync(submoduleDir)) {
  console.error('❌ contracts-submodule directory not found');
  console.log('   Run: git submodule update --init contracts-submodule');
  hasErrors = true;
} else {
  console.log('✅ contracts-submodule directory exists');
}

if (!fs.existsSync(submoduleExports)) {
  console.error('❌ contracts-submodule/exports directory not found');
  console.log('   Run: cd contracts-submodule && forge build && npm run export-abis');
  hasErrors = true;
} else {
  console.log('✅ contracts-submodule/exports directory exists');
}

// Check required ABI files in submodule
const requiredABIs = ['AbunfiVault.json', 'AaveStrategy.json', 'MockERC20.json', 'index.json'];
console.log('\n📋 Checking required ABI files in submodule...');

requiredABIs.forEach(file => {
  const filePath = path.join(submoduleExports, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} exists in submodule`);
    
    // Validate JSON structure
    try {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (file === 'index.json') {
        if (content.AbunfiVault && content.AbunfiVault.abi) {
          console.log(`   ✅ ${file} has valid structure`);
        } else {
          console.error(`   ❌ ${file} has invalid structure`);
          hasErrors = true;
        }
      } else {
        if (content.abi && Array.isArray(content.abi)) {
          console.log(`   ✅ ${file} has valid ABI structure`);
        } else {
          console.error(`   ❌ ${file} has invalid ABI structure`);
          hasErrors = true;
        }
      }
    } catch (error) {
      console.error(`   ❌ ${file} is not valid JSON:`, error.message);
      hasErrors = true;
    }
  } else {
    console.error(`❌ ${file} missing in submodule`);
    hasErrors = true;
  }
});

// Check that copied directories are removed
console.log('\n🧹 Checking cleanup...');

const removedPaths = [
  path.join(__dirname, '..', 'frontend', 'src', 'abis'),
  path.join(__dirname, '..', 'backend', 'src', 'abis'),
  path.join(__dirname, 'copy-abis.js')
];

removedPaths.forEach(removedPath => {
  if (!fs.existsSync(removedPath)) {
    console.log(`✅ Removed: ${path.relative(path.join(__dirname, '..'), removedPath)}`);
  } else {
    console.warn(`⚠️  Still exists: ${path.relative(path.join(__dirname, '..'), removedPath)}`);
  }
});

// Test direct import paths (simulate what the app would do)
console.log('\n🧪 Testing direct import paths...');

const frontendImportPaths = [
  '../../contracts-submodule/exports/AbunfiVault.json',
  '../../contracts-submodule/exports/AaveStrategy.json',
  '../../contracts-submodule/exports/MockERC20.json'
];

frontendImportPaths.forEach(importPath => {
  const fullPath = path.join(__dirname, '..', 'frontend', 'src', importPath);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ Frontend can import: ${importPath}`);
  } else {
    console.error(`❌ Frontend cannot import: ${importPath}`);
    hasErrors = true;
  }
});

const backendImportPath = path.join(__dirname, '..', 'contracts-submodule', 'exports', 'AbunfiVault.json');
if (fs.existsSync(backendImportPath)) {
  console.log('✅ Backend can import from submodule');
} else {
  console.error('❌ Backend cannot import from submodule');
  hasErrors = true;
}

// Check package.json updates
console.log('\n📦 Checking package.json updates...');

const packageJsonPath = path.join(__dirname, '..', 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  if (!packageJson.scripts || !packageJson.scripts['copy:abis']) {
    console.log('✅ copy:abis script removed from package.json');
  } else {
    console.warn('⚠️  copy:abis script still in package.json');
  }
  
  if (packageJson.scripts && packageJson.scripts['contracts:build']) {
    console.log('✅ contracts:build script exists in package.json');
  } else {
    console.error('❌ contracts:build script missing from package.json');
    hasErrors = true;
  }
} else {
  console.error('❌ package.json not found');
  hasErrors = true;
}

// Final summary
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ Direct submodule integration verification FAILED');
  console.log('\nPlease fix the errors above and run the verification again.');
  console.log('\nCommon fixes:');
  console.log('- git submodule update --init contracts-submodule');
  console.log('- cd contracts-submodule && forge build');
  console.log('- cd contracts-submodule && npm run export-abis');
  process.exit(1);
} else {
  console.log('✅ Direct submodule integration verification PASSED');
  console.log('\n🎉 Direct ABI referencing is working correctly!');
  console.log('\nBenefits of this approach:');
  console.log('✅ No copying required - always up to date');
  console.log('✅ Single source of truth');
  console.log('✅ Simpler build process');
  console.log('✅ Automatic updates when submodule changes');
  console.log('\nNext steps:');
  console.log('1. Build contracts: npm run contracts:build');
  console.log('2. Start development: npm run dev');
  console.log('3. Deploy contracts: npm run contracts:deploy');
}
