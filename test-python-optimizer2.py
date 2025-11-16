#!/usr/bin/env python3
"""
Test the Python optimizer with data that should NOT give equal split
"""
import sys
sys.path.insert(0, 'netlify/functions')

from optimize import optimize_mix

# Test with data where Batch B is clearly better for contaminants
test_batches = [
    {'name': 'Batch A', 'pH': 7.0, 'Arsenic': 40, 'Zinc': 200},
    {'name': 'Batch B', 'pH': 7.0, 'Arsenic': 5, 'Zinc': 50}
]

test_limits = {
    'pH': {'lower': 5.5, 'upper': 8.5},
    'Arsenic': {'lower': 0, 'upper': 50},
    'Zinc': {'lower': 0, 'upper': 300}
}

print('Testing Python optimizer - should favor Batch B (lower contaminants)...')
print('Batches:', test_batches)
print('Limits:', test_limits)
print()

result = optimize_mix(test_batches, test_limits, 0.75)

print('=== RESULTS ===')
print(f'Success: {result["success"]}')
print(f'Ratios: {result["ratios"]}')
print(f'Blended values: {result["blended_values"]}')
print(f'Total residual: {result["total_residual"]}')
print()
print('Expected behavior:')
print('- Should favor Batch B (it has lower Arsenic and Zinc)')
print('- Ratios should be something like [0.2, 0.8] or similar')
print('- Should NOT be equal split [0.5, 0.5]')
print()
if result["ratios"][1] > result["ratios"][0]:
    print('✅ CORRECT: Optimizer favors Batch B (lower contaminants)')
else:
    print('❌ WRONG: Optimizer not minimizing contaminants')
