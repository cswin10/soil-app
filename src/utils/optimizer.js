/**
 * Client-side soil mixing optimiser using gradient descent with constraint projection
 */

import { getPhDependentLimit } from './parameters.js'

export function optimizeMix(batches, limits, tolerance = 0.75, materialConstraints = {}) {
  console.log('🔍 OPTIMIZER CALLED')
  console.log('Batches:', batches)
  console.log('Limits:', limits)
  console.log('Tolerance:', tolerance)

  const n_batches = batches.length

  // Get all parameter names (excluding 'name' field)
  const paramNames = Object.keys(batches[0]).filter(key => key !== 'name')
  console.log('Parameter names:', paramNames)

  // Identify parameters with missing data (null values in any batch)
  const missingDataParams = paramNames.filter(param =>
    batches.some(batch => batch[param] === null || batch[param] === undefined)
  )

  // Filter out parameters with upper limit = 9999 (ignore) AND parameters with missing data
  const activeParams = paramNames.filter(p =>
    limits[p]?.upper !== 9999 && !missingDataParams.includes(p)
  )

  // Calculate targets and ranges
  // CRITICAL FIX: Zero-seeking optimisation for contaminants
  // When lower limit = 0 (contaminants), target should be 0, not midpoint
  const targets = {}
  const ranges = {}
  activeParams.forEach(param => {
    const lower = limits[param].lower
    const upper = limits[param].upper

    // Zero-seeking: if lower limit is 0, aim for 0 (minimise contamination)
    // Otherwise, aim for midpoint (balance between limits)
    if (lower === 0) {
      targets[param] = 0  // Minimise contaminants to zero
    } else {
      targets[param] = (upper + lower) / 2  // Target midpoint for non-contaminants (e.g., pH, nutrients)
    }

    ranges[param] = upper - lower || 1e-10 // Avoid division by zero
  })

  // Objective function: minimise sum of normalised residuals
  function objective(ratios) {
    let totalResidual = 0
    activeParams.forEach(param => {
      const blended = ratios.reduce((sum, ratio, i) => sum + ratio * batches[i][param], 0)
      const residual = Math.abs(blended - targets[param]) / ranges[param]
      totalResidual += residual
    })
    return totalResidual
  }

  // Check if ratios satisfy constraints
  function checkConstraints(ratios) {
    // Check sum to 1
    const sum = ratios.reduce((a, b) => a + b, 0)
    if (Math.abs(sum - 1.0) > 0.001) return false

    // Check all ratios >= 0 and <= 1
    if (ratios.some(r => r < 0 || r > 1)) return false

    // Check material constraints (min/max bounds per batch)
    for (let i = 0; i < n_batches; i++) {
      const constraint = materialConstraints[i]
      if (constraint) {
        if (constraint.min !== undefined && ratios[i] < constraint.min) return false
        if (constraint.max !== undefined && ratios[i] > constraint.max) return false
      }
    }

    // Check all parameters within limits
    for (const param of activeParams) {
      const blended = ratios.reduce((sum, ratio, i) => sum + ratio * batches[i][param], 0)
      if (blended < limits[param].lower || blended > limits[param].upper) {
        return false
      }
    }

    return true
  }

  // Simple gradient descent with projection
  function optimize() {
    // Start with equal proportions
    let ratios = new Array(n_batches).fill(1 / n_batches)
    const learningRate = 0.01
    const maxIterations = 5000
    let bestRatios = [...ratios]
    let bestObjective = objective(ratios)

    for (let iter = 0; iter < maxIterations; iter++) {
      // Calculate gradient numerically
      const gradient = new Array(n_batches).fill(0)
      const epsilon = 0.0001

      for (let i = 0; i < n_batches; i++) {
        const ratiosPlus = [...ratios]
        ratiosPlus[i] += epsilon
        const objPlus = objective(ratiosPlus)
        gradient[i] = (objPlus - objective(ratios)) / epsilon
      }

      // Update ratios
      const newRatios = ratios.map((r, i) => r - learningRate * gradient[i])

      // Project onto constraint (sum = 1, all >= 0, respect material constraints)
      const boundedRatios = newRatios.map((r, i) => {
        const constraint = materialConstraints[i]
        let bounded = Math.max(0, r)
        if (constraint) {
          if (constraint.min !== undefined) bounded = Math.max(constraint.min, bounded)
          if (constraint.max !== undefined) bounded = Math.min(constraint.max, bounded)
        }
        return bounded
      })
      const sum = boundedRatios.reduce((a, b) => a + b, 0)
      const projectedRatios = boundedRatios.map(r => r / (sum || 1))

      // Check if this is better
      const currentObj = objective(projectedRatios)
      if (currentObj < bestObjective && checkConstraints(projectedRatios)) {
        bestObjective = currentObj
        bestRatios = [...projectedRatios]
      }

      ratios = projectedRatios

      // Early stopping if objective is very small
      if (currentObj < 0.001) break
    }

    // If gradient descent didn't find a valid solution, try exhaustive search for small cases
    if (!checkConstraints(bestRatios) && n_batches <= 3) {
      const searchResult = exhaustiveSearch(n_batches)
      if (searchResult && checkConstraints(searchResult)) {
        bestRatios = searchResult
        bestObjective = objective(searchResult)
      }
    }

    return bestRatios
  }

  // Exhaustive search for small number of batches
  function exhaustiveSearch(n) {
    let best = null
    let bestObj = Infinity

    // Try combinations in steps of 0.05
    const step = 0.05
    function search(ratios, remaining, depth) {
      if (depth === n - 1) {
        ratios[depth] = remaining
        if (Math.abs(remaining - Math.round(remaining / step) * step) < 0.01) {
          if (checkConstraints(ratios)) {
            const obj = objective(ratios)
            if (obj < bestObj) {
              bestObj = obj
              best = [...ratios]
            }
          }
        }
        return
      }

      for (let r = 0; r <= remaining; r += step) {
        ratios[depth] = r
        search(ratios, remaining - r, depth + 1)
      }
    }

    search(new Array(n).fill(0), 1.0, 0)
    return best
  }

  // Run optimisation (Stage 1)
  let optimalRatios = optimize()
  console.log('Optimal ratios (Stage 1):', optimalRatios)

  // TWO-STAGE OPTIMISATION FOR pH-DEPENDENT LIMITS
  // Check if we need to adjust limits based on pH
  const phDependentParams = ['Zinc', 'Copper', 'Nickel']
  const hasPhParam = activeParams.includes('pH')
  const hasPhDependentParams = phDependentParams.some(p => activeParams.includes(p))

  if (hasPhParam && hasPhDependentParams) {
    // Stage 1: Calculate blended pH with initial ratios
    const blendedPh = optimalRatios.reduce((sum, ratio, i) => {
      const phValue = batches[i]['pH']
      return sum + (ratio * (phValue !== null && phValue !== undefined ? phValue : 7.0))
    }, 0)

    // Stage 2: Adjust limits for pH-dependent metals and re-optimise
    let limitsAdjusted = false
    const adjustedLimits = { ...limits }

    phDependentParams.forEach(param => {
      if (activeParams.includes(param)) {
        const newLimit = getPhDependentLimit(param, blendedPh)
        if (newLimit && (newLimit.upper !== limits[param].upper || newLimit.lower !== limits[param].lower)) {
          adjustedLimits[param] = newLimit
          limitsAdjusted = true
        }
      }
    })

    // If limits were adjusted, re-run optimisation
    if (limitsAdjusted) {
      // Re-run with adjusted limits
      const stage2Result = optimizeMix(batches, adjustedLimits, tolerance, materialConstraints)
      // Use stage 2 ratios if they're valid
      if (stage2Result.success || stage2Result.within_limits) {
        optimalRatios = stage2Result.ratios
      }
    }
  }

  // Calculate blended values and residuals
  const blendedValues = {}
  const residuals = {}
  let withinLimits = true
  let withinToleranceCount = 0

  paramNames.forEach(param => {
    const blended = optimalRatios.reduce((sum, ratio, i) => {
      const value = batches[i][param]
      console.log(`Batch ${i} (${batches[i].name}) ${param}: ${value}, ratio: ${ratio}, contribution: ${ratio * value}`)
      return sum + ratio * value
    }, 0)
    console.log(`${param} blended value: ${blended}`)
    blendedValues[param] = blended

    if (activeParams.includes(param)) {
      const lower = limits[param].lower
      const upper = limits[param].upper
      const target = targets[param]
      const paramRange = ranges[param]

      // Calculate normalized residual (distance from target)
      const residual = Math.abs(blended - target) / paramRange
      residuals[param] = residual

      // Check if within limits
      if (blended < lower || blended > upper) {
        withinLimits = false
      }

      // Check if within tolerance
      const toleranceRange = paramRange * (1 - tolerance) / 2
      if (Math.abs(blended - target) <= toleranceRange) {
        withinToleranceCount++
      }
    }
  })

  const totalResidual = Object.values(residuals).reduce((a, b) => a + b, 0)
  const withinTolerance = withinToleranceCount === activeParams.length

  // Suggest relaxed tolerance if needed
  let suggestedTolerance = null
  if (!withinTolerance && withinLimits) {
    const maxResidual = Math.max(...Object.values(residuals))
    suggestedTolerance = Math.max(0.0, Math.min(1.0, 1 - 2 * maxResidual))
    suggestedTolerance = Math.round(suggestedTolerance * 100) / 100
  }

  return {
    success: withinLimits,
    ratios: optimalRatios.map(r => Math.round(r * 10000) / 10000),
    blended_values: Object.fromEntries(
      Object.entries(blendedValues).map(([k, v]) => [k, Math.round(v * 10000) / 10000])
    ),
    residuals: Object.fromEntries(
      Object.entries(residuals).map(([k, v]) => [k, Math.round(v * 10000) / 10000])
    ),
    total_residual: Math.round(totalResidual * 10000) / 10000,
    within_tolerance: withinTolerance,
    within_limits: withinLimits,
    suggested_tolerance: suggestedTolerance,
    missing_data_params: missingDataParams,  // Parameters with missing data that were skipped
    message: withinLimits ? 'Optimisation successful' : 'No valid solution found within limits'
  }
}
