import { useState } from 'react'
import SoilTextureTriangle from './SoilTextureTriangle'
import { generateCompliancePDF } from '../utils/pdfExport'

function ResultsDisplay({ results, batches, limits, tolerance, batchTonnages = {} }) {
  const [hoveredParam, setHoveredParam] = useState(null)
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 })
  // Helper function: Calculate target value for a parameter
  // Zero-seeking: contaminants (lower=0) target 0, others target midpoint
  const getTargetValue = (param) => {
    const lower = limits[param].lower
    const upper = limits[param].upper
    return lower === 0 ? 0 : (upper + lower) / 2
  }

  // Handle mouse enter on parameter row for inspect mode
  const handleParamMouseEnter = (param, event) => {
    const rect = event.currentTarget.getBoundingClientRect()
    setHoverPosition({ x: rect.left, y: rect.top })
    setHoveredParam(param)
  }

  const handleParamMouseLeave = () => {
    setHoveredParam(null)
  }

  // Get inspection data for a parameter
  const getInspectionData = (param) => {
    if (!hoveredParam || hoveredParam !== param) return null

    const blended = results.blended_values[param]
    const lower = limits[param].lower
    const upper = limits[param].upper
    const target = getTargetValue(param)
    const residual = results.residuals[param]
    const status = getParamStatus(param, blended, residual)

    // Calculate batch contributions
    const contributions = batches.map((batch, index) => ({
      name: batch.name,
      value: batch[param] ?? 0,
      ratio: results.ratios[index],
      contribution: (results.ratios[index] * (batch[param] ?? 0))
    }))

    // Calculate compliance margins
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

  const exportToCSV = () => {
    const rows = []

    // Header
    rows.push(['Soil Mixing Optimisation Results'])
    rows.push([])

    // Mixing Ratios
    rows.push(['Mixing Ratios'])
    batches.forEach((batch, index) => {
      rows.push([batch.name, `${(results.ratios[index] * 100).toFixed(2)}%`])
    })
    rows.push([])

    // Blended Values
    rows.push(['Parameter', 'Blended Value', 'Lower Limit', 'Upper Limit', 'Target', 'Normalized Residual', 'Status'])
    Object.keys(limits).forEach(param => {
      if (limits[param].upper === 9999) return

      const blended = results.blended_values[param]
      const lower = limits[param].lower
      const upper = limits[param].upper
      const target = getTargetValue(param)
      const residual = results.residuals[param]
      const status = getParamStatus(param, blended, residual)

      rows.push([
        param,
        blended.toFixed(4),
        lower,
        upper,
        target.toFixed(2),
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

    // Check if within tolerance (using target value, not midpoint)
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

  // Get failing parameters
  const failingParams = Object.keys(limits).filter(param => {
    if (limits[param].upper === 9999) return false
    const blended = results.blended_values[param]
    const lower = limits[param].lower
    const upper = limits[param].upper
    return blended < lower || blended > upper
  })

  // Get parameters within limits but outside tolerance
  const marginalParams = Object.keys(limits).filter(param => {
    if (limits[param].upper === 9999) return false
    const blended = results.blended_values[param]
    const residual = results.residuals[param]
    const status = getParamStatus(param, blended, residual)
    return status === 'within-limits'
  })

  // Render inspection tooltip
  const InspectionTooltip = ({ param }) => {
    const data = getInspectionData(param)
    if (!data) return null

    return (
      <div className="fixed z-50 pointer-events-none" style={{ left: hoverPosition.x + 20, top: hoverPosition.y - 100 }}>
        <div className="bg-slate-900 text-white rounded-xl shadow-2xl p-4 w-80 border-2 border-blue-400 pointer-events-auto">
          {/* Header */}
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-700">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h4 className="font-bold text-lg">{param} - Detailed Inspection</h4>
          </div>

          {/* Blended Value & Target */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-blue-900/50 rounded-lg p-2">
              <div className="text-xs text-blue-300">Blended Value</div>
              <div className="text-xl font-bold">{data.blended.toFixed(3)}</div>
            </div>
            <div className="bg-purple-900/50 rounded-lg p-2">
              <div className="text-xs text-purple-300">Target</div>
              <div className="text-xl font-bold">{data.target.toFixed(3)}</div>
            </div>
          </div>

          {/* Compliance Margins */}
          <div className="mb-3 bg-slate-800 rounded-lg p-2">
            <div className="text-xs text-slate-400 mb-1">Compliance Margins</div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-300">From Lower ({data.lower}):</span>
                <span className={`font-bold ${data.marginFromLower >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {data.marginFromLower >= 0 ? '+' : ''}{data.marginFromLower.toFixed(3)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">From Upper ({data.upper}):</span>
                <span className={`font-bold ${data.marginFromUpper >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {data.marginFromUpper >= 0 ? '+' : ''}{data.marginFromUpper.toFixed(3)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">From Target:</span>
                <span className={`font-bold ${Math.abs(data.distanceFromTarget) < 0.1 ? 'text-green-400' : 'text-yellow-400'}`}>
                  {data.distanceFromTarget >= 0 ? '+' : ''}{data.distanceFromTarget.toFixed(3)}
                </span>
              </div>
            </div>
          </div>

          {/* Batch Contributions */}
          <div className="mb-2">
            <div className="text-xs text-slate-400 mb-2 font-semibold">Batch Contributions (Calculation)</div>
            <div className="space-y-1.5">
              {data.contributions.map((contrib, idx) => (
                <div key={idx} className="bg-slate-800 rounded p-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-blue-300">{contrib.name}</span>
                    <span className={`px-2 py-0.5 rounded ${getStatusColor(data.status)}`}>
                      {(contrib.ratio * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1 font-mono">
                    {contrib.value.toFixed(2)} × {contrib.ratio.toFixed(4)} = {contrib.contribution.toFixed(3)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sum Verification */}
          <div className="bg-green-900/30 rounded-lg p-2 border border-green-700/50">
            <div className="text-xs text-green-300 font-mono">
              Σ Contributions = {data.contributions.reduce((sum, c) => sum + c.contribution, 0).toFixed(3)}
            </div>
            <div className="text-xs text-green-400 mt-1">
              ✓ Blended = {data.blended.toFixed(3)}
            </div>
          </div>

          {/* Status Badge */}
          <div className="mt-3 pt-2 border-t border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Status:</span>
              <span className={`px-3 py-1 text-xs font-bold rounded-full ${getStatusColor(data.status)}`}>
                {getStatusText(data.status)}
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6 w-full max-w-full overflow-hidden">
      {/* Inspection Tooltip Overlay */}
      {hoveredParam && <InspectionTooltip param={hoveredParam} />}
      {/* Missing Data Warning */}
      {results.missing_data_params && results.missing_data_params.length > 0 && (
        <div className="bg-orange-50 border-4 border-orange-500 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <svg className="w-12 h-12 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-orange-900 mb-2">
                ⚠️ Missing Data Detected
              </h3>
              <p className="text-orange-800 mb-3">
                The following parameters have missing data (N/A, -, or blank values) and were excluded from optimisation.
                Results may not be fully representative of compliance.
              </p>
              <div className="bg-white border-2 border-orange-300 rounded-lg p-4">
                <div className="font-bold text-orange-900 mb-2">
                  Excluded Parameters ({results.missing_data_params.length}):
                </div>
                <div className="flex flex-wrap gap-2">
                  {results.missing_data_params.map(param => (
                    <span key={param} className="inline-block bg-orange-100 border border-orange-400 text-orange-900 px-3 py-1 rounded-lg font-semibold text-sm">
                      {param}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-3 text-sm text-orange-700">
                <strong>Recommendation:</strong> Obtain lab results for missing parameters before finalising blend for regulatory compliance.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Failing Parameters Alert */}
      {failingParams.length > 0 && (
        <div className="bg-red-50 border-4 border-red-600 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <svg className="w-12 h-12 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-red-900 mb-2">
                {failingParams.length} Parameter{failingParams.length > 1 ? 's' : ''} Exceed{failingParams.length === 1 ? 's' : ''} Legal Limits
              </h3>
              <p className="text-red-800 mb-4">
                The following parameters violate regulatory screening limits. This mix cannot be used for disposal.
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
                        <div className="text-red-700">
                          <span className="font-semibold">Blended:</span> {blended.toFixed(2)}
                        </div>
                        <div className="text-red-700">
                          <span className="font-semibold">Limit:</span> {lower} - {upper}
                        </div>
                        <div className="text-red-900 font-bold mt-1">
                          {violation} limit
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Marginal Parameters Warning */}
      {marginalParams.length > 0 && failingParams.length === 0 && (
        <div className="bg-yellow-50 border-3 border-yellow-500 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <svg className="w-8 h-8 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-yellow-900 mb-2">
                {marginalParams.length} Parameter{marginalParams.length > 1 ? 's' : ''} Outside Tolerance
              </h3>
              <p className="text-yellow-800">
                Within legal limits but far from ideal midpoint. Consider adjusting tolerance or batch selection.
              </p>
              <div className="mt-2 text-sm text-yellow-700">
                {marginalParams.join(', ')}
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* Optimisation Transparency & Quality Metrics */}
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl shadow-xl p-4 md:p-6 border-2 border-slate-300">
        <h3 className="text-xl font-bold text-slate-900 mb-4">Optimisation Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Solution Quality */}
          <div className="bg-white rounded-xl p-4 shadow-sm border-2 border-slate-200">
            <div className="text-xs font-medium text-slate-600 uppercase tracking-wider mb-1">Solution Quality</div>
            <div className={`text-2xl font-bold ${
              results.success && results.within_tolerance ? 'text-green-600' :
              results.success ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {results.success && results.within_tolerance ? 'Optimal' :
               results.success ? 'Feasible' : 'Infeasible'}
            </div>
          </div>

          {/* Total Residual */}
          <div className="bg-white rounded-xl p-4 shadow-sm border-2 border-slate-200">
            <div className="text-xs font-medium text-slate-600 uppercase tracking-wider mb-1">Total Residual</div>
            <div className="text-2xl font-bold text-blue-900">
              {results.total_residual?.toFixed(4) || 'N/A'}
            </div>
            <div className="text-xs text-slate-500 mt-1">Lower is better</div>
          </div>

          {/* Parameters Analyzed */}
          <div className="bg-white rounded-xl p-4 shadow-sm border-2 border-slate-200">
            <div className="text-xs font-medium text-slate-600 uppercase tracking-wider mb-1">Parameters</div>
            <div className="text-2xl font-bold text-slate-900">
              {Object.keys(limits).filter(p => limits[p].upper !== 9999).length}
            </div>
            <div className="text-xs text-slate-500 mt-1">Analyzed</div>
          </div>

          {/* Compliance Rate */}
          <div className="bg-white rounded-xl p-4 shadow-sm border-2 border-slate-200">
            <div className="text-xs font-medium text-slate-600 uppercase tracking-wider mb-1">Compliance</div>
            <div className="text-2xl font-bold text-slate-900">
              {(() => {
                const totalParams = Object.keys(limits).filter(p => limits[p].upper !== 9999).length
                const passingParams = totalParams - failingParams.length
                return `${passingParams}/${totalParams}`
              })()}
            </div>
            <div className="text-xs text-slate-500 mt-1">Within limits</div>
          </div>
        </div>

        {/* Live Feedback Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Parameters Within Tolerance */}
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <h4 className="font-semibold text-green-900 text-sm">Within Tolerance</h4>
            </div>
            <div className="text-2xl font-bold text-green-900">
              {Object.keys(limits).filter(param => {
                if (limits[param].upper === 9999) return false
                const status = getParamStatus(param, results.blended_values[param], results.residuals[param])
                return status === 'within-tolerance'
              }).length}
            </div>
            <div className="text-xs text-green-700 mt-1">Parameters centered</div>
          </div>

          {/* Parameters Within Limits (Marginal) */}
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <h4 className="font-semibold text-yellow-900 text-sm">Marginal</h4>
            </div>
            <div className="text-2xl font-bold text-yellow-900">{marginalParams.length}</div>
            <div className="text-xs text-yellow-700 mt-1">Outside tolerance</div>
          </div>

          {/* Failing Parameters */}
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <h4 className="font-semibold text-red-900 text-sm">Failing</h4>
            </div>
            <div className="text-2xl font-bold text-red-900">{failingParams.length}</div>
            <div className="text-xs text-red-700 mt-1">Exceed limits</div>
          </div>
        </div>

        {/* Worst Offending Parameter */}
        {results.success && (() => {
          const params = Object.keys(limits).filter(p => limits[p].upper !== 9999)
          let worstParam = null
          let worstResidual = 0

          params.forEach(param => {
            const residual = Math.abs(results.residuals[param])
            if (residual > worstResidual) {
              worstResidual = residual
              worstParam = param
            }
          })

          if (worstParam) {
            return (
              <div className="mt-4 bg-white border-2 border-orange-300 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <h4 className="font-semibold text-orange-900 text-sm">Worst Offending Parameter</h4>
                    <p className="text-sm text-orange-800 mt-1">
                      <strong>{worstParam}</strong> has the highest residual ({worstResidual.toFixed(4)}),
                      making it the most difficult parameter to optimize in this blend.
                    </p>
                  </div>
                </div>
              </div>
            )
          }
          return null
        })()}
      </div>

      {/* Residual Visualization - Bar Chart */}
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6 w-full max-w-full overflow-hidden">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Residual Analysis - Distance from Ideal
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Visual representation of how far each parameter is from its ideal midpoint. Lower bars are better.
        </p>

        <div className="space-y-3">
          {Object.keys(limits)
            .filter(param => limits[param].upper !== 9999)
            .sort((a, b) => Math.abs(results.residuals[b]) - Math.abs(results.residuals[a])) // Sort by worst first
            .map(param => {
              const residual = results.residuals[param]
              const blended = results.blended_values[param]
              const status = getParamStatus(param, blended, residual)

              // Determine color based on status
              let barColor = 'bg-green-500'
              let bgColor = 'bg-green-50'
              let textColor = 'text-green-900'

              if (status === 'exceeds') {
                barColor = 'bg-red-500'
                bgColor = 'bg-red-50'
                textColor = 'text-red-900'
              } else if (status === 'within-limits') {
                barColor = 'bg-yellow-500'
                bgColor = 'bg-yellow-50'
                textColor = 'text-yellow-900'
              }

              // Calculate percentage for visual representation (normalize to 0-100%)
              const maxResidual = Math.max(...Object.values(results.residuals).map(r => Math.abs(r)))
              const barWidth = maxResidual > 0 ? (Math.abs(residual) / maxResidual) * 100 : 0

              return (
                <div key={param} className={`${bgColor} rounded-lg p-3 transition-all hover:shadow-md`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${textColor}`}>{param}</span>
                      <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(status)}`}>
                        {getStatusText(status)}
                      </span>
                    </div>
                    <span className={`text-sm font-mono font-bold ${textColor}`}>
                      {residual.toFixed(4)}
                    </span>
                  </div>
                  <div className="relative bg-white rounded-full h-6 overflow-hidden border-2 border-gray-200">
                    <div
                      className={`${barColor} h-full transition-all duration-500 ease-out flex items-center justify-end pr-2`}
                      style={{ width: `${barWidth}%` }}
                    >
                      {barWidth > 15 && (
                        <span className="text-xs font-semibold text-white">
                          {(residual * 100).toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-gray-600">
                    Blended: {blended.toFixed(2)} | Target: {getTargetValue(param).toFixed(2)}
                  </div>
                </div>
              )
            })}
        </div>

        {/* Summary Statistics */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-gray-200">
          <div className="text-center">
            <div className="text-xs text-gray-500 uppercase tracking-wider">Mean Residual</div>
            <div className="text-xl font-bold text-gray-900 mt-1">
              {(Object.values(results.residuals).reduce((a, b) => a + Math.abs(b), 0) / Object.values(results.residuals).length).toFixed(4)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 uppercase tracking-wider">Worst Residual</div>
            <div className="text-xl font-bold text-red-600 mt-1">
              {Math.max(...Object.values(results.residuals).map(r => Math.abs(r))).toFixed(4)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 uppercase tracking-wider">Best Residual</div>
            <div className="text-xl font-bold text-green-600 mt-1">
              {Math.min(...Object.values(results.residuals).map(r => Math.abs(r))).toFixed(4)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 uppercase tracking-wider">Total Residual</div>
            <div className="text-xl font-bold text-blue-900 mt-1">
              {results.total_residual.toFixed(4)}
            </div>
          </div>
        </div>
      </div>

      {/* Mixing Ratios */}
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6 w-full max-w-full overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900">
            Optimal Mixing Ratios
            {Object.keys(batchTonnages).length > 0 && (
              <span className="ml-2 text-sm font-normal text-blue-600">(with tonnage calculations)</span>
            )}
          </h3>
          <button
            onClick={copyMixingInstructions}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-md"
          >
            Copy Instructions
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {batches.map((batch, index) => {
            const ratio = results.ratios[index]
            const hasTonnage = batchTonnages[index] !== undefined
            const tonnageUsed = hasTonnage ? (ratio * batchTonnages[index]).toFixed(2) : null
            const tonnageRemaining = hasTonnage ? (batchTonnages[index] - tonnageUsed).toFixed(2) : null

            return (
              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="text-sm font-medium text-gray-600">{batch.name}</div>
                <div className="text-3xl font-bold text-gray-900 mt-1">
                  {(ratio * 100).toFixed(2)}%
                </div>

                {hasTonnage && (
                  <div className="mt-3 space-y-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
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

                <div className="mt-2 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 rounded-full h-2"
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
            <div className="mt-4 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-xl p-4">
              <h4 className="font-bold text-green-900 mb-2">Total Material Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <div className="text-xs text-gray-600">Total Available</div>
                  <div className="text-xl font-bold text-gray-900 mt-1">{totalAvailable.toFixed(1)} tonnes</div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <div className="text-xs text-gray-600">Total to Use</div>
                  <div className="text-xl font-bold text-blue-900 mt-1">{totalUsed.toFixed(1)} tonnes</div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <div className="text-xs text-gray-600">Total Leftover</div>
                  <div className="text-xl font-bold text-green-900 mt-1">{totalLeftover.toFixed(1)} tonnes</div>
                </div>
              </div>
            </div>
          )
        })()}
      </div>

      {/* Soil Texture Triangle */}
      <SoilTextureTriangle results={results} batches={batches} />

      {/* Parameter Results Table */}
      <div className="bg-white rounded-lg shadow-md p-4 md:p-6 w-full max-w-full overflow-hidden">
        {/* Inspect Mode Info Banner */}
        <div className="mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-3">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <span className="text-sm font-semibold text-blue-900">Inspect Mode Active: </span>
              <span className="text-sm text-blue-800">Hover over any parameter row to see detailed calculation breakdown, batch contributions, and compliance margins.</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
            Parameter Analysis
          </h3>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button
              onClick={() => generateCompliancePDF(batches, limits, results, tolerance, batchTonnages)}
              className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-4 rounded-md flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
              </svg>
              Export PDF Report
            </button>
            <button
              onClick={exportToCSV}
              className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-4 rounded-md"
            >
              Export to CSV
            </button>
          </div>
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
              <div
                key={param}
                className="border border-gray-200 rounded-lg p-4 space-y-3 hover:border-blue-400 hover:shadow-lg transition-all cursor-help"
                onMouseEnter={(e) => handleParamMouseEnter(param, e)}
                onMouseLeave={handleParamMouseLeave}
              >
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
                  <tr
                    key={param}
                    className="hover:bg-blue-50 transition-colors cursor-help"
                    onMouseEnter={(e) => handleParamMouseEnter(param, e)}
                    onMouseLeave={handleParamMouseLeave}
                  >
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
