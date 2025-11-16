/**
 * Netlify Function to optimize soil mixing ratios using JavaScript
 * Implements the same algorithm as the Python version but in Node.js
 */

export async function handler(event, context) {
  // Handle CORS preflight
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const batches = body.batches || [];
    const limits = body.limits || {};
    const tolerance = body.tolerance || 0.75;

    if (!batches || batches.length === 0 || !limits || Object.keys(limits).length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing batches or limits data' })
      };
    }

    // Run optimization
    const result = optimizeMix(batches, limits, tolerance);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message,
        stack: error.stack
      })
    };
  }
}

/**
 * Optimize soil mixing ratios using gradient descent with Sequential Least Squares Programming (SLSQP) approach
 */
function optimizeMix(batches, limits, tolerance = 0.75) {
  const nBatches = batches.length;

  // Get all parameter names (excluding 'name' field)
  const paramNames = Object.keys(batches[0]).filter(key => key !== 'name');

  // Identify parameters with missing data (null values in any batch)
  const missingDataParams = paramNames.filter(param =>
    batches.some(batch => batch[param] === null || batch[param] === undefined)
  );

  // Filter out parameters with upper limit = 9999 (ignore) AND parameters with missing data
  const activeParams = paramNames.filter(p =>
    limits[p]?.upper !== 9999 && !missingDataParams.includes(p)
  );

  // Calculate targets and ranges for active parameters
  const targets = {};
  const ranges = {};
  activeParams.forEach(param => {
    const lower = limits[param].lower;
    const upper = limits[param].upper;

    // Zero-seeking: if lower limit is 0, aim for 0 (minimize contaminants)
    // Otherwise, aim for midpoint (balance between limits)
    if (lower === 0) {
      targets[param] = 0;  // Minimize contaminants to zero
    } else {
      targets[param] = (upper + lower) / 2;  // Target midpoint for non-contaminants
    }

    ranges[param] = upper - lower || 1e-10;  // Avoid division by zero
  });

  // Objective function: minimize sum of normalized residuals from TARGET
  function objective(ratios) {
    let totalResidual = 0;
    activeParams.forEach(param => {
      const blended = ratios.reduce((sum, ratio, i) => sum + ratio * batches[i][param], 0);
      const residual = Math.abs(blended - targets[param]) / ranges[param];
      totalResidual += residual;
    });
    return totalResidual;
  }

  // Check if ratios satisfy all constraints
  function checkConstraints(ratios) {
    // Check sum to 1
    const sum = ratios.reduce((a, b) => a + b, 0);
    if (Math.abs(sum - 1.0) > 0.001) return false;

    // Check all ratios >= 0 and <= 1
    if (ratios.some(r => r < -1e-6 || r > 1 + 1e-6)) return false;

    // Check all parameters within limits
    for (const param of activeParams) {
      const blended = ratios.reduce((sum, ratio, i) => sum + ratio * batches[i][param], 0);
      const lower = limits[param].lower;
      const upper = limits[param].upper;
      if (blended < lower - 1e-6 || blended > upper + 1e-6) {
        return false;
      }
    }

    return true;
  }

  // SLSQP-style optimization using constrained gradient descent
  function optimize() {
    // Start with equal proportions
    let ratios = new Array(nBatches).fill(1 / nBatches);
    let learningRate = 0.1;
    const maxIterations = 10000;
    const minLearningRate = 1e-8;
    let bestRatios = [...ratios];
    let bestObjective = objective(ratios);
    let noImprovementCount = 0;

    for (let iter = 0; iter < maxIterations; iter++) {
      // Calculate gradient numerically
      const gradient = new Array(nBatches).fill(0);
      const epsilon = 1e-8;
      const currentObj = objective(ratios);

      for (let i = 0; i < nBatches; i++) {
        const ratiosPlus = [...ratios];
        ratiosPlus[i] += epsilon;
        // Normalize to maintain sum = 1
        const sum = ratiosPlus.reduce((a, b) => a + b, 0);
        const normalized = ratiosPlus.map(r => r / sum);
        const objPlus = objective(normalized);
        gradient[i] = (objPlus - currentObj) / epsilon;
      }

      // Update ratios using gradient
      let newRatios = ratios.map((r, i) => r - learningRate * gradient[i]);

      // Project onto constraints
      // 1. Ensure non-negative
      newRatios = newRatios.map(r => Math.max(0, r));

      // 2. Normalize to sum = 1
      let sum = newRatios.reduce((a, b) => a + b, 0);
      newRatios = newRatios.map(r => r / (sum || 1));

      // 3. Check if parameter limits are violated, if so, adjust
      let violatesConstraints = false;
      for (const param of activeParams) {
        const blended = newRatios.reduce((sum, ratio, i) => sum + ratio * batches[i][param], 0);
        const lower = limits[param].lower;
        const upper = limits[param].upper;

        if (blended < lower || blended > upper) {
          violatesConstraints = true;
          break;
        }
      }

      // If constraints violated, reduce learning rate and try again
      if (violatesConstraints) {
        learningRate *= 0.5;
        if (learningRate < minLearningRate) {
          break;  // Can't make progress
        }
        continue;
      }

      // Calculate new objective
      const newObj = objective(newRatios);

      // Update best if improved
      if (newObj < bestObjective - 1e-9) {
        bestObjective = newObj;
        bestRatios = [...newRatios];
        noImprovementCount = 0;
      } else {
        noImprovementCount++;
      }

      ratios = newRatios;

      // Early stopping conditions
      if (bestObjective < 1e-6) break;  // Optimal solution found
      if (noImprovementCount > 100) {
        learningRate *= 0.5;  // Reduce learning rate
        noImprovementCount = 0;
        if (learningRate < minLearningRate) break;
      }
    }

    return bestRatios;
  }

  // Run optimization
  const optimalRatios = optimize();

  // Calculate blended values and residuals with optimal ratios
  const blendedValues = {};
  const residuals = {};
  let withinLimits = true;
  let withinToleranceCount = 0;

  paramNames.forEach(param => {
    const blended = optimalRatios.reduce((sum, ratio, i) => {
      const value = batches[i][param];
      return sum + ratio * (value !== null && value !== undefined ? value : 0);
    }, 0);
    blendedValues[param] = blended;

    if (activeParams.includes(param)) {
      const lower = limits[param].lower;
      const upper = limits[param].upper;
      const target = targets[param];
      const paramRange = ranges[param];

      // Calculate normalized residual from TARGET
      const residual = Math.abs(blended - target) / paramRange;
      residuals[param] = residual;

      // Check if within limits
      if (blended < lower || blended > upper) {
        withinLimits = false;
      }

      // Check if within tolerance
      const toleranceRange = paramRange * (1 - tolerance) / 2;
      if (Math.abs(blended - target) <= toleranceRange) {
        withinToleranceCount++;
      }
    }
  });

  const totalResidual = Object.values(residuals).reduce((a, b) => a + b, 0);
  const withinTolerance = withinToleranceCount === activeParams.length;

  // If no solution within tolerance, suggest relaxed tolerance
  let suggestedTolerance = null;
  if (!withinTolerance && withinLimits) {
    const maxResidual = Math.max(...Object.values(residuals));
    suggestedTolerance = Math.max(0.0, Math.min(1.0, 1 - 2 * maxResidual));
    suggestedTolerance = Math.round(suggestedTolerance * 100) / 100;
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
    missing_data_params: missingDataParams,
    message: withinLimits ? 'Optimisation successful' : 'No valid solution found within limits'
  };
}
