import React from 'react'

function ComplianceHeatmap({ batches, limits }) {
  if (!batches || batches.length === 0 || !limits || Object.keys(limits).length === 0) {
    return null
  }

  // Get all parameters
  const parameters = Object.keys(limits)

  // Calculate compliance for each batch and parameter
  const getComplianceColor = (value, lower, upper) => {
    if (value < lower || value > upper) {
      return 'bg-red-500' // Fails limits
    }

    // Calculate position within range (0 = at lower, 1 = at upper)
    const range = upper - lower
    const position = (value - lower) / range

    // Calculate distance from midpoint (0 = at edge, 0.5 = at centre)
    const distanceFromMid = Math.abs(position - 0.5)

    if (distanceFromMid < 0.1) {
      return 'bg-green-500' // Excellent - near centre
    } else if (distanceFromMid < 0.25) {
      return 'bg-lime-400' // Good - reasonably centred
    } else if (distanceFromMid < 0.4) {
      return 'bg-yellow-400' // Fair - getting close to edges
    } else {
      return 'bg-orange-400' // Marginal - close to limits
    }
  }

  const getComplianceStatus = (value, lower, upper) => {
    if (value < lower) return `Below limit (${lower})`
    if (value > upper) return `Above limit (${upper})`

    const range = upper - lower
    const position = (value - lower) / range
    const distanceFromMid = Math.abs(position - 0.5)
    const percentile = ((position) * 100).toFixed(1)

    if (distanceFromMid < 0.1) return `Excellent (${percentile}% of range)`
    if (distanceFromMid < 0.25) return `Good (${percentile}% of range)`
    if (distanceFromMid < 0.4) return `Fair (${percentile}% of range)`
    return `Marginal (${percentile}% of range)`
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200 overflow-hidden w-full max-w-full mb-4 md:mb-6">
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900">Parameter Compliance Visualization</h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Visual heatmap showing how each parameter compares to screening limits
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="mb-6 bg-slate-50 rounded-xl p-4 border-2 border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Colour Legend</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-500 rounded border-2 border-slate-300"></div>
              <span>Excellent (centred)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-lime-400 rounded border-2 border-slate-300"></div>
              <span>Good</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-yellow-400 rounded border-2 border-slate-300"></div>
              <span>Fair</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-orange-400 rounded border-2 border-slate-300"></div>
              <span>Marginal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-red-500 rounded border-2 border-slate-300"></div>
              <span>Fails limits</span>
            </div>
          </div>
        </div>

        {/* Mobile View - Cards */}
        <div className="block md:hidden space-y-3">
          {batches.map((batch, batchIdx) => (
            <div key={batchIdx} className="border-2 border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-gradient-to-r from-slate-700 to-blue-700 text-white font-bold px-4 py-3 text-sm">
                {batch.name}
              </div>
              <div className="p-3 space-y-2">
                {parameters.map((param) => {
                  const value = batch[param] ?? 0
                  const { lower, upper } = limits[param] || { lower: 0, upper: 9999 }
                  const colorClass = getComplianceColor(value, lower, upper)
                  const status = getComplianceStatus(value, lower, upper)

                  return (
                    <div key={param} className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-medium text-slate-700 flex-shrink-0">{param}:</span>
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="font-semibold text-slate-900">{value}</span>
                        <div className={`flex-1 h-6 ${colorClass} rounded border-2 border-slate-300`}></div>
                      </div>
                      <span className="text-slate-600 text-xs truncate flex-shrink-0 max-w-[100px]" title={status}>
                        {status.split('(')[0]}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View - Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gradient-to-r from-slate-700 to-blue-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                  Parameter
                </th>
                <th className="px-4 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">
                  Range
                </th>
                {batches.map((batch, idx) => (
                  <th key={idx} className="px-4 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">
                    {batch.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {parameters.map((param, paramIdx) => {
                const { lower, upper } = limits[param] || { lower: 0, upper: 9999 }

                return (
                  <tr key={param} className={paramIdx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-slate-900">{param}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="text-xs text-slate-600">
                        {lower} - {upper}
                      </div>
                    </td>
                    {batches.map((batch, batchIdx) => {
                      const value = batch[param] ?? 0
                      const colorClass = getComplianceColor(value, lower, upper)
                      const status = getComplianceStatus(value, lower, upper)

                      return (
                        <td key={batchIdx} className="px-4 py-3">
                          <div className="flex flex-col items-center gap-1">
                            <div className={`w-full h-8 ${colorClass} rounded flex items-center justify-center border-2 border-slate-300`}>
                              <span className="text-sm font-bold text-white drop-shadow-lg">{value}</span>
                            </div>
                            <div className="text-xs text-slate-600" title={status}>
                              {status.split('(')[0]}
                            </div>
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default ComplianceHeatmap
