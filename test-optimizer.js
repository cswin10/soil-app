// Quick test of the optimizer
import { optimizeMix } from './src/utils/optimizer.js'

// Test with simple data
const testBatches = [
  { name: 'Batch A', pH: 8.0, Arsenic: 20 },
  { name: 'Batch B', pH: 6.0, Arsenic: 10 }
]

const testLimits = {
  pH: { lower: 5.5, upper: 8.5 },
  Arsenic: { lower: 0, upper: 50 }
}

console.log('Testing optimizer with simple data...')
console.log('Batches:', testBatches)
console.log('Limits:', testLimits)

const result = optimizeMix(testBatches, testLimits, 0.75, {})

console.log('\n=== RESULTS ===')
console.log('Ratios:', result.ratios)
console.log('Blended values:', result.blended_values)
console.log('Residuals:', result.residuals)
console.log('Success:', result.success)
console.log('Within tolerance:', result.within_tolerance)

// Expected blended values:
// If ratios are 0.5, 0.5:
//   pH = 0.5 * 8.0 + 0.5 * 6.0 = 7.0
//   Arsenic = 0.5 * 20 + 0.5 * 10 = 15.0
console.log('\nExpected (if 50/50 mix):')
console.log('  pH: 7.0')
console.log('  Arsenic: 15.0')
