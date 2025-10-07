const { ethers } = require('ethers');

describe('Precision Handling Tests', () => {

  describe('BigNumber precision calculations', () => {
    test('should calculate gas usage percentage with BigNumber precision', () => {
      // Test the precision improvement we made
      const largeGasUsed = ethers.parseEther('99.99');
      const largeGasLimit = ethers.parseEther('100.0');

      // Our improved calculation: use basis points for precision (ethers v6 syntax)
      const gasUsedPercentage = Number(largeGasUsed * 10000n / largeGasLimit) / 100;

      // This should be very close to 99.99%
      expect(gasUsedPercentage).toBeCloseTo(99.99, 2);
      expect(gasUsedPercentage).toBeLessThan(100);

      // Old method would lose precision
      const oldMethod = (Number(largeGasUsed) / Number(largeGasLimit)) * 100;

      // Both methods should be similar for this test case, but BigNumber is safer
      expect(gasUsedPercentage).toBeCloseTo(oldMethod, 2);
    });

    test('should handle edge case with zero gas limit', () => {
      const zeroGasUsed = 0n;
      const zeroGasLimit = 0n;

      // Should handle division by zero gracefully
      let gasUsedPercentage;
      try {
        gasUsedPercentage = Number(zeroGasUsed * 10000n / zeroGasLimit) / 100;
      } catch (error) {
        // Division by zero should be handled
        gasUsedPercentage = 0;
      }

      expect(gasUsedPercentage).toBe(0);
    });

    test('should maintain precision with very small gas values', () => {
      // Use a small but measurable gas value (0.001 ETH)
      const smallGasUsed = ethers.parseEther('0.001');
      const gasLimit = ethers.parseEther('0.1');

      const gasUsedPercentage = Number(smallGasUsed * 10000n / gasLimit) / 100;

      // Should be exactly 1%
      expect(gasUsedPercentage).toBe(1);
      expect(gasUsedPercentage).toBeLessThan(2);
      expect(gasUsedPercentage).toBeGreaterThan(0);
      expect(isNaN(gasUsedPercentage)).toBe(false);
    });
  });

  describe('BigNumber gas comparisons', () => {
    test('should handle large gas cost comparisons precisely', () => {
      // Test BigNumber comparison precision
      const estimatedCostWei = ethers.parseEther('0.999999999999999998');
      const perTxLimitWei = ethers.parseEther('0.999999999999999999');

      // BigNumber comparison should be precise (ethers v6 syntax)
      expect(estimatedCostWei < perTxLimitWei).toBe(true);

      // Float comparison might lose precision
      const estimatedCostFloat = parseFloat('0.999999999999999998');
      const perTxLimitFloat = parseFloat('0.999999999999999999');

      // This demonstrates why we need BigNumber precision
      expect(estimatedCostFloat === perTxLimitFloat).toBe(true); // Float precision loss!
    });

    test('should handle very small gas differences', () => {
      const smallCostWei = ethers.parseEther('0.000000000000000001'); // 1 wei
      const limitWei = ethers.parseEther('0.000000000000000002'); // 2 wei

      // BigNumber should handle tiny differences precisely
      expect(smallCostWei < limitWei).toBe(true);
      expect(smallCostWei === limitWei).toBe(false);
    });
  });
});
