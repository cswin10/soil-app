import { useState } from 'react'
import SoilTextureTriangle from './SoilTextureTriangle'
import { generateCompliancePDF } from '../utils/pdfExport'

/**
 * PAGE 3: Results
 * Complete compliance analysis with professional B2B presentation
 */
function ResultsStep({ results, batches, limits, tolerance, batchTonnages, onBack, onStartOver }) {
  const [showAllParams, setShowAllParams] = useState(false)
  const [hoveredParam, setHoveredParam] = useState(null)
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 })

  // Calculate target value (zero-seeking for contaminants)
  const getTargetValue = (param) => {
    const lower = limits[param].lower
    const upper = limits[param].upper
    return lower === 0 ? 0 : (upper + lower) / 2
  }

  // Get parameter status
  const getParamStatus = (param, blended, residual) => {
    const lower = limits[param].lower
    const upper = limits[param].upper

    if (blended < lower || blended > upper) {
      return 'exceeds'
    }

    const target = getTargetValue(param)
    const range = upper - lower
    const toleranceRange = range * (1 - tolerance) / 2

    if (Math.abs(blended - target) <= toleranceRange) {
      return 'within-tolerance'
    }

    return 'within-limits'
  }

  // Count parameters by status
  const paramStats = Object.keys(limits).reduce((stats, param) => {
    if (limits[param].upper === 9999) return stats

    const blended = results.blended_values[param]
    const residual = results.residuals[param] || 0
    const status = getParamStatus(param, blended, residual)

    if (status === 'within-tolerance') stats.withinTolerance++
    else if (status === 'within-limits') stats.withinLimits++
    else stats.exceedsLimits++

    stats.total++
    return stats
  }, { withinTolerance: 0, withinLimits: 0, exceedsLimits: 0, total: 0 })

  // Find highest residual
  const highestResidual = Object.entries(results.residuals || {})
    .filter(([param]) => limits[param]?.upper !== 9999)
    .sort(([, a], [, b]) => b - a)[0]

  // Calculate tonnage if available
  const hasTonnage = Object.keys(batchTonnages).length > 0
  const totalAvailable = hasTonnage ? Object.values(batchTonnages).reduce((a, b) => a + b, 0) : 0
  const totalUsed = hasTonnage ? batches.reduce((sum, batch, index) => {
    return sum + (results.ratios[index] * (batchTonnages[index] || 0))
  }, 0) : 0

  // Hover handlers for inspect mode
  const handleParamMouseEnter = (param, event) => {
    const rect = event.currentTarget.getBoundingClientRect()
    setHoverPosition({ x: rect.right + 10, y: rect.top })
    setHoveredParam(param)
  }

  const handleParamMouseLeave = () => {
    setHoveredParam(null)
  }

  // Get inspection data
  const getInspectionData = (param) => {
    if (!hoveredParam || hoveredParam !== param) return null

    const blended = results.blended_values[param]
    const lower = limits[param].lower
    const upper = limits[param].upper
    const target = getTargetValue(param)

    const contributions = batches.map((batch, index) => ({
      name: batch.name,
      value: batch[param] ?? 0,
      ratio: results.ratios[index],
      contribution: (results.ratios[index] * (batch[param] ?? 0))
    }))

    return {
      blended,
      lower,
      upper,
      target,
      contributions,
      marginFromLower: blended - lower,
      marginFromUpper: upper - blended,
      distanceFromTarget: blended - target
    }
  }

  const InspectionTooltip = ({ param }) => {
    const data = getInspectionData(param)
    if (!data) return null

    return (
      <div className="fixed z-50" style={{ left: Math.min(hoverPosition.x, window.innerWidth - 350), top: hoverPosition.y }}>
        <div className="bg-slate-900 text-white rounded-lg shadow-2xl p-3 w-80 border-2 border-blue-400">
          <div className="font-bold text-sm mb-2 pb-2 border-b border-slate-700">{param} - Calculation</div>

          <div className="space-y-1.5">
            {data.contributions.map((contrib, idx) => (
              <div key={idx} className="bg-slate-800 rounded p-2 text-xs font-mono">
                <div className="text-blue-300">{contrib.name}</div>
                <div className="text-slate-400">
                  {contrib.value.toFixed(2)} × {(contrib.ratio * 100).toFixed(1)}% = {contrib.contribution.toFixed(3)}
                </div>
              </div>
            ))}
            <div className="bg-green-900/30 rounded p-2 text-xs border-t border-slate-700 pt-2">
              <div className="text-green-300">Σ = {data.blended.toFixed(3)}</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Filter parameters
  const displayParams = Object.keys(limits).filter(param => {
    if (limits[param].upper === 9999) return false
    if (showAllParams) return true

    const blended = results.blended_values[param]
    const residual = results.residuals[param] || 0
    const status = getParamStatus(param, blended, residual)

    return status !== 'within-tolerance'
  })

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {hoveredParam && <InspectionTooltip param={hoveredParam} />}

      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Optimisation Results</h2>
        <p className="text-slate-600">Blend analysis and compliance summary</p>
      </div>

      {/* SECTION 1: COMPLIANCE SUMMARY */}
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
        <h3 className="text-2xl font-bold text-slate-900 mb-6">Compliance Summary</h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* Within Tolerance */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-green-800">Within Tolerance</span>
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-4xl font-bold text-green-900">{paramStats.withinTolerance}</div>
            <div className="text-xs text-green-700 mt-1">of {paramStats.total} parameters</div>
          </div>

          {/* Outside Tolerance */}
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-yellow-800">Outside Tolerance</span>
              <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-4xl font-bold text-yellow-900">{paramStats.withinLimits}</div>
            <div className="text-xs text-yellow-700 mt-1">still within limits</div>
          </div>

          {/* Exceeds Limits */}
          <div className="bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-300 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-red-800">Exceeds Limits</span>
              <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-4xl font-bold text-red-900">{paramStats.exceedsLimits}</div>
            <div className="text-xs text-red-700 mt-1">regulatory failure</div>
          </div>

          {/* Mean Residual */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-800">Mean Residual</span>
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <div className="text-4xl font-bold text-blue-900">{((results.total_residual || 0) / paramStats.total).toFixed(2)}</div>
            <div className="text-xs text-blue-700 mt-1">
              Highest: {highestResidual ? `${highestResidual[0]} (${highestResidual[1].toFixed(2)})` : 'N/A'}
            </div>
          </div>
        </div>

        {/* Missing Data Warning */}
        {results.missing_data_params && results.missing_data_params.length > 0 && (
          <div className="bg-orange-50 border-2 border-orange-400 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <h4 className="font-bold text-orange-900 mb-1">⚠️ Warning: Missing Data</h4>
                <p className="text-sm text-orange-800 mb-2">
                  The following parameters have missing data and were excluded from optimisation:
                </p>
                <div className="flex flex-wrap gap-2">
                  {results.missing_data_params.map(param => (
                    <span key={param} className="inline-block bg-white border border-orange-300 rounded px-2 py-1 text-xs font-medium text-orange-900">
                      {param}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-orange-700 mt-2 italic">
                  Optimisation may not be comprehensive. We recommend validation testing.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: OPTIMAL BLEND RATIOS */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-xl p-8 border-2 border-blue-300">
        <h3 className="text-2xl font-bold text-slate-900 mb-6 text-center">Optimal Mixing Ratios</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {batches.map((batch, index) => {
            const ratio = results.ratios[index]
            const tonnage = batchTonnages[index]
            const tonnageUsed = tonnage ? (ratio * tonnage) : null
            const tonnageRemaining = tonnage ? (tonnage - tonnageUsed) : null

            return (
              <div key={index} className="bg-white rounded-xl p-6 shadow-lg border-2 border-blue-200">
                <div className="text-sm font-medium text-slate-600 mb-2">{batch.name}</div>
                <div className="text-5xl font-bold text-blue-600 mb-4">
                  {(ratio * 100).toFixed(1)}%
                </div>

                {tonnage && (
                  <div className="space-y-2 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                    <div className="flex justify-between text-slate-700">
                      <span>Available:</span>
                      <span className="font-semibold">{tonnage.toFixed(1)} tonnes</span>
                    </div>
                    <div className="flex justify-between text-blue-900">
                      <span className="font-bold">Use:</span>
                      <span className="font-bold">{tonnageUsed.toFixed(2)} tonnes</span>
                    </div>
                    <div className="flex justify-between text-green-700">
                      <span>Remaining:</span>
                      <span className="font-semibold">{tonnageRemaining.toFixed(2)} tonnes</span>
                    </div>
                  </div>
                )}

                <div className="mt-4 bg-slate-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3"
                    style={{ width: `${ratio * 100}%` }}
                  ></div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Total Summary */}
        {hasTonnage && (
          <div className="mt-6 bg-white border-2 border-green-400 rounded-xl p-4">
            <h4 className="font-bold text-green-900 mb-3">Total Material Summary</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xs text-slate-600">Total Available</div>
                <div className="text-2xl font-bold text-slate-900">{totalAvailable.toFixed(1)}</div>
                <div className="text-xs text-slate-600">tonnes</div>
              </div>
              <div>
                <div className="text-xs text-blue-600">Total Blend Output</div>
                <div className="text-2xl font-bold text-blue-900">{totalUsed.toFixed(1)}</div>
                <div className="text-xs text-blue-600">tonnes</div>
              </div>
              <div>
                <div className="text-xs text-green-600">Total Remaining</div>
                <div className="text-2xl font-bold text-green-900">{(totalAvailable - totalUsed).toFixed(1)}</div>
                <div className="text-xs text-green-600">tonnes</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: SOIL TEXTURE TRIANGLE */}
      <SoilTextureTriangle results={results} batches={batches} />

      {/* SECTION 4: DETAILED PARAMETER ANALYSIS */}
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-slate-900">Detailed Parameter Analysis</h3>
          <button
            onClick={() => setShowAllParams(!showAllParams)}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors text-sm"
          >
            {showAllParams ? 'Show Marginal/Failing Only' : 'Show All Parameters'}
          </button>
        </div>

        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-900">
            <strong>Hover</strong> over any parameter to see detailed calculation breakdown
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase">Parameter</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-slate-700 uppercase">Blended</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-slate-700 uppercase">Limit Range</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-slate-700 uppercase">Target</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-slate-700 uppercase">Residual</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-slate-700 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {displayParams.map(param => {
                const blended = results.blended_values[param]
                const lower = limits[param].lower
                const upper = limits[param].upper
                const target = getTargetValue(param)
                const residual = results.residuals[param] || 0
                const status = getParamStatus(param, blended, residual)

                const rowClass = status === 'exceeds' ? 'bg-red-50' : status === 'within-limits' ? 'bg-yellow-50' : ''

                return (
                  <tr
                    key={param}
                    className={`hover:bg-blue-50 transition-colors cursor-help ${rowClass}`}
                    onMouseEnter={(e) => handleParamMouseEnter(param, e)}
                    onMouseLeave={handleParamMouseLeave}
                  >
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">{param}</td>
                    <td className="px-4 py-3 text-sm text-center font-bold">{blended.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-center text-slate-700">{lower} - {upper}</td>
                    <td className="px-4 py-3 text-sm text-center text-slate-700">{target.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-center font-mono">{(residual * 100).toFixed(1)}%</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${
                        status === 'within-tolerance' ? 'bg-green-100 text-green-800' :
                        status === 'within-limits' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {status === 'within-tolerance' ? '✓ Within' :
                         status === 'within-limits' ? '⚠ Marginal' :
                         '✗ Exceeds'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {!showAllParams && displayParams.length === 0 && (
          <div className="text-center py-12 text-green-700">
            <svg className="mx-auto h-12 w-12 text-green-500 mb-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="font-semibold">All parameters within tolerance! 🎉</p>
            <p className="text-sm mt-1">Click "Show All Parameters" to view complete analysis</p>
          </div>
        )}
      </div>

      {/* SECTION 5: DISCLAIMER */}
      <div className="bg-yellow-50 border-2 border-yellow-400 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <svg className="w-8 h-8 text-yellow-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <h4 className="text-lg font-bold text-yellow-900 mb-2">⚠️ IMPORTANT NOTICE</h4>
            <p className="text-sm text-yellow-900 mb-3">
              This optimisation is based solely on laboratory analysis data provided. Results are indicative only.
            </p>
            <p className="text-sm text-yellow-900 font-semibold mb-3">
              We strongly recommend validation testing by a UKAS or MCERTS accredited laboratory before using blended material for any purpose.
            </p>
            <p className="text-xs text-yellow-800 italic">
              BlendIQ accepts no liability for material suitability or compliance.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 6: EXPORT & ACTIONS */}
      <div className="flex items-center justify-between pt-4">
        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="text-slate-600 hover:text-slate-900 font-semibold px-6 py-3 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            ← Adjust & Re-optimise
          </button>
          <button
            onClick={onStartOver}
            className="text-slate-600 hover:text-slate-900 font-semibold px-6 py-3 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Start New Blend
          </button>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              // TODO: Export CSV
              alert('CSV export coming soon')
            }}
            className="bg-slate-600 hover:bg-slate-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg transition-all flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Download CSV
          </button>
          <button
            onClick={() => generateCompliancePDF(batches, limits, results, tolerance, batchTonnages)}
            className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold px-8 py-3 rounded-xl shadow-lg transition-all flex items-center gap-2"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
            </svg>
            Download PDF Report
          </button>
        </div>
      </div>
    </div>
  )
}

export default ResultsStep
