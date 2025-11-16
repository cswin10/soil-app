import { useState } from 'react'
import { generateCompliancePDF } from '../utils/pdfExport'

/**
 * PAGE 3: Results
 * Clean results view with optimal ratios, tonnage breakdown, and residual analysis
 */
function ResultsStep({ results, batches, limits, tolerance, batchTonnages, onBack, onStartOver }) {
  const [hoveredParam, setHoveredParam] = useState(null)
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 })

  const getTargetValue = (param) => {
    const lower = limits[param].lower
    const upper = limits[param].upper
    return lower === 0 ? 0 : (upper + lower) / 2
  }

  const handleParamMouseEnter = (param, event) => {
    const rect = event.currentTarget.getBoundingClientRect()
    setHoverPosition({ x: rect.left, y: rect.top })
    setHoveredParam(param)
  }

  const handleParamMouseLeave = () => {
    setHoveredParam(null)
  }

  const getParamStatus = (param, blendedValue, residual) => {
    const lower = limits[param].lower
    const upper = limits[param].upper

    if (blendedValue < lower || blendedValue > upper) {
      return 'exceeds'
    }

    const target = getTargetValue(param)
    const range = upper - lower
    const toleranceRange = range * (1 - tolerance) / 2

    if (Math.abs(blendedValue - target) <= toleranceRange) {
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

  const getInspectionData = (param) => {
    if (!hoveredParam || hoveredParam !== param) return null

    const blended = results.blended_values[param]
    const lower = limits[param].lower
    const upper = limits[param].upper
    const target = getTargetValue(param)
    const residual = results.residuals[param]
    const status = getParamStatus(param, blended, residual)

    const contributions = batches.map((batch, index) => ({
      name: batch.name,
      value: batch[param] ?? 0,
      ratio: results.ratios[index],
      contribution: (results.ratios[index] * (batch[param] ?? 0))
    }))

    const marginFromLower = blended - lower
    const marginFromUpper = upper - blended
    const distanceFromTarget = blended - target

    return {
      blended,
      lower,
      upper,
      target,
      residual,
      status,
      contributions,
      marginFromLower,
      marginFromUpper,
      distanceFromTarget
    }
  }

  const InspectionTooltip = ({ param }) => {
    const data = getInspectionData(param)
    if (!data) return null

    return (
      <div className="fixed z-50 pointer-events-none" style={{ left: hoverPosition.x + 20, top: hoverPosition.y - 100 }}>
        <div className="bg-slate-900 text-white rounded-xl shadow-2xl p-4 w-80 border-2 border-blue-400 pointer-events-auto">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-700">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h4 className="font-bold text-lg">{param} - Inspection</h4>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-blue-900/50 rounded-lg p-2">
              <div className="text-xs text-blue-300">Blended</div>
              <div className="text-xl font-bold">{data.blended.toFixed(3)}</div>
            </div>
            <div className="bg-purple-900/50 rounded-lg p-2">
              <div className="text-xs text-purple-300">Target</div>
              <div className="text-xl font-bold">{data.target.toFixed(3)}</div>
            </div>
          </div>

          <div className="mb-3 bg-slate-800 rounded-lg p-2">
            <div className="text-xs text-slate-400 mb-1">Compliance Margins</div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-300">From Lower:</span>
                <span className={`font-bold ${data.marginFromLower >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {data.marginFromLower >= 0 ? '+' : ''}{data.marginFromLower.toFixed(3)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">From Upper:</span>
                <span className={`font-bold ${data.marginFromUpper >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {data.marginFromUpper >= 0 ? '+' : ''}{data.marginFromUpper.toFixed(3)}
                </span>
              </div>
            </div>
          </div>

          <div className="mb-2">
            <div className="text-xs text-slate-400 mb-2 font-semibold">Batch Contributions</div>
            <div className="space-y-1.5">
              {data.contributions.map((contrib, idx) => (
                <div key={idx} className="bg-slate-800 rounded p-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-blue-300">{contrib.name}</span>
                    <span className="text-slate-300">{(contrib.ratio * 100).toFixed(1)}%</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1 font-mono">
                    {contrib.value.toFixed(2)} × {contrib.ratio.toFixed(4)} = {contrib.contribution.toFixed(3)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Calculate failing parameters
  const failingParams = Object.keys(limits).filter(param => {
    if (limits[param].upper === 9999) return false
    const blended = results.blended_values[param]
    const lower = limits[param].lower
    const upper = limits[param].upper
    return blended < lower || blended > upper
  })

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {hoveredParam && <InspectionTooltip param={hoveredParam} />}

      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Optimization Results</h2>
        <p className="text-slate-600">Your optimal blending ratios and compliance analysis</p>
      </div>

      {/* Status Banner */}
      <div className={`rounded-2xl p-6 shadow-lg ${
        results.success && results.within_tolerance
          ? 'bg-green-50 border-2 border-green-500'
          : results.success
          ? 'bg-yellow-50 border-2 border-yellow-500'
          : 'bg-red-50 border-2 border-red-500'
      }`}>
        <div className="text-center">
          <h3 className={`text-2xl font-bold mb-2 ${
            results.success && results.within_tolerance
              ? 'text-green-900'
              : results.success
              ? 'text-yellow-900'
              : 'text-red-900'
          }`}>
            {results.success && results.within_tolerance
              ? '✓ Optimal Mix Found!'
              : results.success
              ? '⚠ Mix Found (Outside Tolerance)'
              : '✗ No Valid Mix Found'}
          </h3>
          <p className={`${
            results.success && results.within_tolerance
              ? 'text-green-700'
              : results.success
              ? 'text-yellow-700'
              : 'text-red-700'
          }`}>
            {results.success && results.within_tolerance
              ? `All parameters are within ${(tolerance * 100).toFixed(0)}% tolerance.`
              : results.success
              ? `Parameters are within legal limits but not within ${(tolerance * 100).toFixed(0)}% tolerance.`
              : 'No valid mixing ratio exists that keeps all parameters within legal limits.'}
          </p>
        </div>
      </div>

      {/* Failing Parameters Alert */}
      {failingParams.length > 0 && (
        <div className="bg-red-50 border-4 border-red-600 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-red-900 mb-2">
            {failingParams.length} Parameter{failingParams.length > 1 ? 's' : ''} Exceed Legal Limits
          </h3>
          <p className="text-red-800 mb-4">
            The following parameters violate regulatory screening limits:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {failingParams.map(param => {
              const blended = results.blended_values[param]
              const lower = limits[param].lower
              const upper = limits[param].upper
              const violation = blended < lower ? `${(lower - blended).toFixed(2)} below` : `${(blended - upper).toFixed(2)} above`

              return (
                <div key={param} className="bg-white border-2 border-red-400 rounded-lg p-4">
                  <div className="font-bold text-red-900 text-lg">{param}</div>
                  <div className="mt-2 text-sm">
                    <div className="text-red-700">Blended: {blended.toFixed(2)}</div>
                    <div className="text-red-700">Limit: {lower} - {upper}</div>
                    <div className="text-red-900 font-bold mt-1">{violation} limit</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* OPTIMAL MIXING RATIOS - BIG VISUAL */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-xl p-8 border-2 border-blue-300">
        <h3 className="text-2xl font-bold text-slate-900 mb-6 text-center">Optimal Mixing Ratios</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {batches.map((batch, index) => {
            const ratio = results.ratios[index]
            const hasTonnage = batchTonnages[index] !== undefined
            const tonnageUsed = hasTonnage ? (ratio * batchTonnages[index]).toFixed(2) : null
            const tonnageRemaining = hasTonnage ? (batchTonnages[index] - tonnageUsed).toFixed(2) : null

            return (
              <div key={index} className="bg-white rounded-xl p-6 shadow-lg border-2 border-blue-200">
                <div className="text-sm font-medium text-slate-600 mb-2">{batch.name}</div>
                <div className="text-5xl font-bold text-blue-600 mb-4">
                  {(ratio * 100).toFixed(1)}%
                </div>

                {hasTonnage && (
                  <div className="space-y-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="text-xs text-blue-900">
                      <span className="font-semibold">Available:</span> {batchTonnages[index].toFixed(1)} tonnes
                    </div>
                    <div className="text-sm text-blue-900 font-bold">
                      <span className="font-semibold">Use:</span> {tonnageUsed} tonnes
                    </div>
                    <div className="text-xs text-green-700">
                      <span className="font-semibold">Leftover:</span> {tonnageRemaining} tonnes
                    </div>
                  </div>
                )}

                <div className="mt-4 bg-slate-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 transition-all duration-500"
                    style={{ width: `${ratio * 100}%` }}
                  ></div>
                </div>
              </div>
            )
          })}
        </div>

        {Object.keys(batchTonnages).length > 0 && (() => {
          const totalUsed = batches.reduce((sum, batch, index) => {
            if (batchTonnages[index] !== undefined) {
              return sum + (results.ratios[index] * batchTonnages[index])
            }
            return sum
          }, 0)

          const totalAvailable = Object.values(batchTonnages).reduce((a, b) => a + b, 0)
          const totalLeftover = totalAvailable - totalUsed

          return (
            <div className="mt-6 bg-white border-2 border-green-300 rounded-xl p-4">
              <h4 className="font-bold text-green-900 mb-3">Total Material Summary</h4>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="text-xs text-slate-600">Total Available</div>
                  <div className="text-2xl font-bold text-slate-900">{totalAvailable.toFixed(1)}</div>
                  <div className="text-xs text-slate-600">tonnes</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-xs text-blue-600">Total to Use</div>
                  <div className="text-2xl font-bold text-blue-900">{totalUsed.toFixed(1)}</div>
                  <div className="text-xs text-blue-600">tonnes</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-xs text-green-600">Total Leftover</div>
                  <div className="text-2xl font-bold text-green-900">{totalLeftover.toFixed(1)}</div>
                  <div className="text-xs text-green-600">tonnes</div>
                </div>
              </div>
            </div>
          )
        })()}
      </div>

      {/* RESIDUAL ANALYSIS TABLE */}
      <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-200">
        <div className="mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-3">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-blue-800">Hover over any row to see detailed calculations</span>
          </div>
        </div>

        <h3 className="text-xl font-bold text-slate-900 mb-4">Parameter Compliance Analysis</h3>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">Parameter</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-slate-700 uppercase">Blended</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-slate-700 uppercase">Limits</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-slate-700 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {Object.keys(limits).map(param => {
                if (limits[param].upper === 9999) return null

                const blended = results.blended_values[param]
                const lower = limits[param].lower
                const upper = limits[param].upper
                const residual = results.residuals[param]
                const status = getParamStatus(param, blended, residual)

                return (
                  <tr
                    key={param}
                    className="hover:bg-blue-50 transition-colors cursor-help"
                    onMouseEnter={(e) => handleParamMouseEnter(param, e)}
                    onMouseLeave={handleParamMouseLeave}
                  >
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">{param}</td>
                    <td className="px-4 py-3 text-sm text-center font-bold text-slate-900">{blended.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-center text-slate-700">{lower} - {upper}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${getStatusColor(status)}`}>
                        {getStatusText(status)}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex items-center justify-between pt-4">
        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="text-slate-600 hover:text-slate-900 font-semibold px-6 py-3 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Optimize
          </button>
          <button
            onClick={onStartOver}
            className="text-slate-600 hover:text-slate-900 font-semibold px-6 py-3 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Start Over
          </button>
        </div>

        <button
          onClick={() => generateCompliancePDF(batches, limits, results, tolerance, batchTonnages)}
          className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold px-8 py-4 rounded-xl shadow-lg transition-all text-lg flex items-center gap-2"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
          </svg>
          Export PDF Report
        </button>
      </div>
    </div>
  )
}

export default ResultsStep
