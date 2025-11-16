#!/usr/bin/env python3
"""
Test the Python optimizer directly
"""
import sys
sys.path.insert(0, 'netlify/functions')

from optimize import optimize_mix

# Test with simple data
test_batches = [
    {'name': 'Batch A', 'pH': 8.0, 'Arsenic': 20},
    {'name': 'Batch B', 'pH': 6.0, 'Arsenic': 10}
]

test_limits = {
    'pH': {'lower': 5.5, 'upper': 8.5},
    'Arsenic': {'lower': 0, 'upper': 50}
}

print('Testing Python optimizer with simple data...')
print('Batches:', test_batches)
print('Limits:', test_limits)
print()

result = optimize_mix(test_batches, test_limits, 0.75)

print('=== RESULTS ===')
print(f'Success: {result["success"]}')
print(f'Ratios: {result["ratios"]}')
print(f'Blended values: {result["blended_values"]}')
print(f'Residuals: {result["residuals"]}')
print(f'Within tolerance: {result["within_tolerance"]}')
print(f'Within limits: {result["within_limits"]}')
print(f'Message: {result["message"]}')
print()
print('Expected behavior:')
print('- Arsenic should target 0 (zero-seeking for contaminants)')
print('- pH should target 7.0 (midpoint of 5.5-8.5)')
print('- Ratios should favor Batch B (lower Arsenic)')
print('- Should NOT be equal split (33.3%/33.3%)')
