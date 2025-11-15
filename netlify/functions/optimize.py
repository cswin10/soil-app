import json

# Try to import dependencies with error handling
try:
    import numpy as np
    from scipy.optimize import minimize
    DEPS_LOADED = True
    DEPS_ERROR = None
except Exception as e:
    DEPS_LOADED = False
    DEPS_ERROR = str(e)
    np = None
    minimize = None

def handler(event, context):
    """
    Netlify Function to optimize soil mixing ratios.
    """
    
    # Handle CORS preflight
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': ''
        }

    # Check if dependencies loaded
    if not DEPS_LOADED:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'error': f'Failed to load Python dependencies: {DEPS_ERROR}'
            })
        }

    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        batches = body.get('batches', [])
        limits = body.get('limits', {})
        tolerance = body.get('tolerance', 0.75)

        if not batches or not limits:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'Missing batches or limits data'})
            }

        # Run optimization
        result = optimize_mix(batches, limits, tolerance)

        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps(result)
        }

    except Exception as e:
        import traceback
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'error': str(e),
                'traceback': traceback.format_exc()
            })
        }


def optimize_mix(batches, limits, tolerance=0.75):
    """
    Optimize soil mixing ratios using scipy.optimize.
    """
    n_batches = len(batches)

    # Get all parameter names (excluding 'name' field)
    param_names = [key for key in batches[0].keys() if key != 'name']

    # Filter out parameters with upper limit = 9999 (ignore)
    active_params = [p for p in param_names if limits.get(p, {}).get('upper', 9999) != 9999]

    # Calculate midpoints and ranges for active parameters
    midpoints = {}
    ranges = {}
    for param in active_params:
        lower = limits[param]['lower']
        upper = limits[param]['upper']
        midpoints[param] = (upper + lower) / 2
        ranges[param] = upper - lower

        # Avoid division by zero
        if ranges[param] == 0:
            ranges[param] = 1e-10

    # Objective function: minimize sum of normalized residuals
    def objective(ratios):
        total_residual = 0
        for param in active_params:
            blended = sum(ratios[i] * batches[i][param] for i in range(n_batches))
            residual = abs(blended - midpoints[param]) / ranges[param]
            total_residual += residual
        return total_residual

    # Constraints
    constraints = [
        {'type': 'eq', 'fun': lambda r: sum(r) - 1.0}  # ratios sum to 1
    ]

    # Add hard limit constraints for each parameter
    for param in active_params:
        upper = limits[param]['upper']
        lower = limits[param]['lower']

        # Upper limit constraint
        constraints.append({
            'type': 'ineq',
            'fun': lambda r, p=param, u=upper: u - sum(r[i] * batches[i][p] for i in range(n_batches))
        })

        # Lower limit constraint
        constraints.append({
            'type': 'ineq',
            'fun': lambda r, p=param, l=lower: sum(r[i] * batches[i][p] for i in range(n_batches)) - l
        })

    # Bounds: each ratio between 0 and 1
    bounds = [(0, 1) for _ in range(n_batches)]

    # Initial guess: equal proportions
    x0 = np.array([1/n_batches] * n_batches)

    # Run optimization
    opt_result = minimize(
        objective,
        x0,
        method='SLSQP',
        bounds=bounds,
        constraints=constraints,
        options={'maxiter': 1000, 'ftol': 1e-9}
    )

    # Calculate blended values and residuals with optimal ratios
    optimal_ratios = opt_result.x
    blended_values = {}
    residuals = {}
    within_limits = True
    within_tolerance_count = 0

    for param in param_names:
        blended = sum(optimal_ratios[i] * batches[i][param] for i in range(n_batches))
        blended_values[param] = blended

        if param in active_params:
            lower = limits[param]['lower']
            upper = limits[param]['upper']
            midpoint = midpoints[param]
            param_range = ranges[param]

            # Calculate normalized residual
            residual = abs(blended - midpoint) / param_range
            residuals[param] = residual

            # Check if within limits
            if blended < lower or blended > upper:
                within_limits = False

            # Check if within tolerance
            tolerance_range = param_range * (1 - tolerance) / 2
            if abs(blended - midpoint) <= tolerance_range:
                within_tolerance_count += 1

    total_residual = sum(residuals.values())
    within_tolerance = within_tolerance_count == len(active_params)

    # If no solution within tolerance, suggest relaxed tolerance
    suggested_tolerance = None
    if not within_tolerance and opt_result.success:
        max_residual = max(residuals.values()) if residuals else 0
        suggested_tolerance = max(0.0, min(1.0, 1 - 2 * max_residual))
        suggested_tolerance = round(suggested_tolerance, 2)

    return {
        'success': opt_result.success and within_limits,
        'ratios': [round(r, 4) for r in optimal_ratios.tolist()],
        'blended_values': {k: round(v, 4) for k, v in blended_values.items()},
        'residuals': {k: round(v, 4) for k, v in residuals.items()},
        'total_residual': round(total_residual, 4),
        'within_tolerance': within_tolerance,
        'within_limits': within_limits,
        'suggested_tolerance': suggested_tolerance,
        'message': opt_result.message if hasattr(opt_result, 'message') else ''
    }
