function ResultsDisplay({ results, batches, limits, tolerance }) {
  const exportToCSV = () => {
    const rows = []

    // Header
    rows.push(['Soil Mixing Optimization Results'])
    rows.push([])

    // Mixing Ratios
    rows.push(['Mixing Ratios'])
    batches.forEach((batch, index) => {
      rows.push([batch.name, `${(results.ratios[index] * 100).toFixed(2)}%`])
    })
    rows.push([])

    // Blended Values
    rows.push(['Parameter', 'Blended Value', 'Lower Limit', 'Upper Limit', 'Midpoint', 'Normalized Residual', 'Status'])
    Object.keys(limits).forEach(param => {
      if (limits[param].upper === 9999) return

      const blended = results.blended_values[param]
      const lower = limits[param].lower
      const upper = limits[param].upper
      const midpoint = (upper + lower) / 2
      const residual = results.residuals[param]
      const status = getParamStatus(param, blended, residual)

      rows.push([
        param,
        blended.toFixed(4),
        lower,
        upper,
        midpoint.toFixed(2),
        residual.toFixed(4),
        status
      ])
    })

    rows.push([])
    rows.push(['Total Normalized Residual', results.total_residual])
    rows.push(['Within Tolerance', results.within_tolerance ? 'Yes' : 'No'])

    const csv = rows.map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `soil-mixing-results-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const copyMixingInstructions = () => {
    const instructions = batches
      .map((batch, index) =>
        `${batch.name}: ${(results.ratios[index] * 100).toFixed(2)}%`
      )
      .join('\n')

    navigator.clipboard.writeText(instructions).then(() => {
      alert('Mixing instructions copied to clipboard!')
    })
  }

  const getParamStatus = (param, blendedValue, residual) => {
    const lower = limits[param].lower
    const upper = limits[param].upper

    // Check if within hard limits
    if (blendedValue < lower || blendedValue > upper) {
      return 'exceeds'
    }

    // Check if within tolerance
    const midpoint = (upper + lower) / 2
    const range = upper - lower
    const toleranceRange = range * (1 - tolerance) / 2

    if (Math.abs(blendedValue - midpoint) <= toleranceRange) {
      return 'within-tolerance'
    }

    return 'within-limits'
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'within-tolerance':
        return 'bg-green-100 text-green-800'
      case 'within-limits':
        return 'bg-yellow-100 text-yellow-800'
      case 'exceeds':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'within-tolerance':
        return 'Within Tolerance'
      case 'within-limits':
        return 'Within Limits'
      case 'exceeds':
        return 'EXCEEDS LIMITS'
      default:
        return 'Unknown'
    }
  }

  return (
    <div className="space-y-4 md:space-y-6 w-full max-w-full overflow-hidden">
      {/* Status Banner */}
      <div className={`rounded-lg p-6 ${
        results.success && results.within_tolerance
          ? 'bg-green-50 border-2 border-green-500'
          : results.success
          ? 'bg-yellow-50 border-2 border-yellow-500'
          : 'bg-red-50 border-2 border-red-500'
      }`}>
        <h2 className="text-2xl font-bold mb-2 ${
          results.success && results.within_tolerance
            ? 'text-green-900'
            : results.success
            ? 'text-yellow-900'
            : 'text-red-900'
        }">
          {results.success && results.within_tolerance
            ? 'Optimal Mix Found!'
            : results.success
            ? 'Mix Found (Outside Tolerance)'
            : 'No Valid Mix Found'}
        </h2>
        <p className={`text-sm ${
          results.success && results.within_tolerance
            ? 'text-green-700'
            : results.success
            ? 'text-yellow-700'
            : 'text-red-700'
        }`}>
          {results.success && results.within_tolerance
            ? `All parameters are within ${(tolerance * 100).toFixed(0)}% tolerance of their midpoint.`
            : results.success && results.suggested_tolerance
            ? `Parameters are within legal limits but not within ${(tolerance * 100).toFixed(0)}% tolerance. Try relaxing tolerance to ${(results.suggested_tolerance * 100).toFixed(0)}% or higher.`
            : results.success
            ? `Parameters are within legal limits but not within ${(tolerance * 100).toFixed(0)}% tolerance.`
            : 'No valid mixing ratio exists that keeps all parameters within legal limits.'}
        </p>
      </div>

      {/* Mixing Ratios */}
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6 w-full max-w-full overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900">
            Optimal Mixing Ratios
          </h3>
          <button
            onClick={copyMixingInstructions}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-md"
          >
            Copy Instructions
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {batches.map((batch, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="text-sm font-medium text-gray-600">{batch.name}</div>
              <div className="text-3xl font-bold text-gray-900 mt-1">
                {(results.ratios[index] * 100).toFixed(2)}%
              </div>
              <div className="mt-2 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 rounded-full h-2"
                  style={{ width: `${results.ratios[index] * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Parameter Results Table */}
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6 w-full max-w-full overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
            Parameter Analysis
          </h3>
          <button
            onClick={exportToCSV}
            className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-4 rounded-md w-full sm:w-auto flex-shrink-0"
          >
            Export to CSV
          </button>
        </div>

        {/* Mobile Card View */}
        <div className="block xl:hidden space-y-3">
          {Object.keys(limits).map(param => {
            if (limits[param].upper === 9999) return null

            const blended = results.blended_values[param]
            const lower = limits[param].lower
            const upper = limits[param].upper
            const residual = results.residuals[param]
            const status = getParamStatus(param, blended, residual)

            return (
              <div key={param} className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <h4 className="text-lg font-semibold text-gray-900">{param}</h4>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(status)}`}>
                    {getStatusText(status)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider">Blended</div>
                    <div className="text-base font-semibold text-gray-900 mt-1">{blended.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider">Limits</div>
                    <div className="text-base text-gray-700 mt-1">{lower} - {upper}</div>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Batch Values</div>
                  <div className="grid grid-cols-2 gap-2">
                    {batches.map((batch, index) => (
                      <div key={index} className="bg-gray-50 rounded p-2">
                        <div className="text-xs text-gray-600">{batch.name}</div>
                        <div className="text-sm font-medium text-gray-900">{batch[param]?.toFixed(2) || 'N/A'}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-200">
                  <div className="text-xs text-gray-500">Normalized Residual: <span className="font-medium text-gray-700">{residual.toFixed(4)}</span></div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Desktop Table View */}
        <div className="hidden xl:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Parameter
                </th>
                {batches.map((batch, index) => (
                  <th key={index} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {batch.name}
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Blended
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Limits
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Residual
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.keys(limits).map(param => {
                if (limits[param].upper === 9999) return null

                const blended = results.blended_values[param]
                const lower = limits[param].lower
                const upper = limits[param].upper
                const residual = results.residuals[param]
                const status = getParamStatus(param, blended, residual)

                return (
                  <tr key={param}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {param}
                    </td>
                    {batches.map((batch, index) => (
                      <td key={index} className="px-4 py-3 text-sm text-gray-700">
                        {batch[param]?.toFixed(2) || 'N/A'}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                      {blended.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {lower} - {upper}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {residual.toFixed(4)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(status)}`}>
                        {getStatusText(status)}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 p-4 bg-gray-50 rounded-md">
          <div className="text-sm text-gray-700">
            <span className="font-semibold">Total Normalized Residual:</span>{' '}
            {results.total_residual.toFixed(4)}
            <span className="block sm:inline sm:ml-4 text-gray-500 mt-1 sm:mt-0">
              (Lower is better - represents overall distance from ideal midpoints)
            </span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6 w-full max-w-full overflow-hidden">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Legend</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center">
            <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 mr-2">
              Within Tolerance
            </span>
            <span className="text-sm text-gray-600">
              Value is within {((1 - tolerance) * 50).toFixed(0)}% of midpoint
            </span>
          </div>
          <div className="flex items-center">
            <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 mr-2">
              Within Limits
            </span>
            <span className="text-sm text-gray-600">
              Legal but outside tolerance range
            </span>
          </div>
          <div className="flex items-center">
            <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 mr-2">
              EXCEEDS LIMITS
            </span>
            <span className="text-sm text-gray-600">
              Value violates legal limits
            </span>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 md:p-6 w-full max-w-full overflow-hidden">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">How the Optimization Works</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p>
            <strong>Blended Value Calculation:</strong> For each parameter, the blended value is calculated as:
            <code className="block mt-1 p-2 bg-white rounded font-mono text-xs">
              Blended = (Ratio₁ × Value₁) + (Ratio₂ × Value₂) + ...
            </code>
          </p>
          <p>
            <strong>Constraints:</strong> All mixing ratios must sum to 100%, and all blended values must stay within their legal limits.
          </p>
          <p>
            <strong>Optimization Goal:</strong> Minimize the total normalized residual (sum of distances from midpoint, normalized by range) while keeping all parameters within tolerance.
          </p>
          <p>
            <strong>Algorithm:</strong> Uses scipy.optimize with SLSQP (Sequential Least Squares Programming) method.
          </p>
        </div>
      </div>
    </div>
  )
}

export default ResultsDisplay
