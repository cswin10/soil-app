import React from 'react'

function ExportManager({ batches, limits, tolerance, results, materialConstraints }) {
  // Export everything as JSON
  const exportCompleteScenario = () => {
    const scenario = {
      exportDate: new Date().toISOString(),
      batches,
      limits,
      tolerance,
      materialConstraints,
      results,
      metadata: {
        totalBatches: batches.length,
        totalParameters: Object.keys(limits).length,
        hasResults: !!results,
        hasMaterialConstraints: Object.keys(materialConstraints || {}).length > 0
      }
    }

    const blob = new Blob([JSON.stringify(scenario, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `soil-mixing-scenario-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Export comprehensive CSV report
  const exportComprehensiveCSV = () => {
    const rows = []

    // Header
    rows.push(['Soil Mixing Optimizer - Complete Report'])
    rows.push(['Export Date', new Date().toLocaleString()])
    rows.push([])

    // Configuration
    rows.push(['CONFIGURATION'])
    rows.push(['Tolerance', `${(tolerance * 100).toFixed(1)}%`])
    rows.push(['Number of Batches', batches.length])
    rows.push(['Number of Parameters', Object.keys(limits).length])
    rows.push(['Material Constraints Active', Object.keys(materialConstraints || {}).length > 0 ? 'Yes' : 'No'])
    rows.push([])

    // Material Constraints (if any)
    if (materialConstraints && Object.keys(materialConstraints).length > 0) {
      rows.push(['MATERIAL CONSTRAINTS'])
      rows.push(['Batch', 'Minimum %', 'Maximum %'])
      batches.forEach((batch, index) => {
        const constraint = materialConstraints[index]
        if (constraint) {
          const min = constraint.min !== undefined ? (constraint.min * 100).toFixed(1) : 'None'
          const max = constraint.max !== undefined ? (constraint.max * 100).toFixed(1) : 'None'
          rows.push([batch.name, min, max])
        }
      })
      rows.push([])
    }

    // Batch Data
    rows.push(['BATCH DATA'])
    const params = Object.keys(limits)
    rows.push(['Batch', ...params])
    batches.forEach(batch => {
      rows.push([batch.name, ...params.map(p => batch[p] ?? 0)])
    })
    rows.push([])

    // Screening Limits
    rows.push(['SCREENING LIMITS'])
    rows.push(['Parameter', 'Lower Limit', 'Upper Limit', 'Target', 'Range'])
    params.forEach(param => {
      if (limits[param].upper === 9999) return
      const lower = limits[param].lower
      const upper = limits[param].upper
      // Zero-seeking: contaminants (lower=0) target 0, others target midpoint
      const target = lower === 0 ? 0 : (lower + upper) / 2
      const range = upper - lower
      rows.push([param, lower, upper, target.toFixed(2), range.toFixed(2)])
    })
    rows.push([])

    // Results (if available)
    if (results) {
      rows.push(['OPTIMIZATION RESULTS'])
      rows.push(['Success', results.success ? 'Yes' : 'No'])
      rows.push(['Within Tolerance', results.within_tolerance ? 'Yes' : 'No'])
      rows.push(['Total Residual', results.total_residual?.toFixed(6) || 'N/A'])

      // Calculate residual statistics
      const residualValues = Object.values(results.residuals || {}).map(r => Math.abs(r))
      if (residualValues.length > 0) {
        const meanResidual = residualValues.reduce((a, b) => a + b, 0) / residualValues.length
        const maxResidual = Math.max(...residualValues)
        const minResidual = Math.min(...residualValues)
        rows.push(['Mean Residual', meanResidual.toFixed(6)])
        rows.push(['Worst (Max) Residual', maxResidual.toFixed(6)])
        rows.push(['Best (Min) Residual', minResidual.toFixed(6)])
      }
      rows.push([])

      rows.push(['MIXING RATIOS'])
      rows.push(['Batch', 'Ratio (%)', 'Ratio (decimal)'])
      batches.forEach((batch, index) => {
        rows.push([batch.name, (results.ratios[index] * 100).toFixed(2), results.ratios[index].toFixed(4)])
      })
      rows.push([])

      rows.push(['BLENDED VALUES & COMPLIANCE'])
      rows.push(['Parameter', 'Blended', 'Lower Limit', 'Upper Limit', 'Target', 'Residual', 'Status'])
      params.forEach(param => {
        if (limits[param].upper === 9999) return
        const blended = results.blended_values[param]
        const lower = limits[param].lower
        const upper = limits[param].upper
        // Zero-seeking: contaminants (lower=0) target 0, others target midpoint
        const target = lower === 0 ? 0 : (lower + upper) / 2
        const residual = results.residuals[param]

        let status = 'Unknown'
        if (blended < lower) status = 'Below Lower Limit'
        else if (blended > upper) status = 'Above Upper Limit'
        else if (Math.abs(blended - target) <= ((upper - lower) * (1 - tolerance) / 2)) status = 'Within Tolerance'
        else status = 'Within Limits'

        rows.push([param, blended.toFixed(4), lower, upper, target.toFixed(2), residual.toFixed(6), status])
      })
      rows.push([])

      rows.push(['BATCH CONTRIBUTIONS TO BLENDED VALUES'])
      rows.push(['Parameter', ...batches.map(b => b.name), 'Blended Total'])
      params.forEach(param => {
        if (limits[param].upper === 9999) return
        const contributions = batches.map((batch, idx) =>
          (batch[param] * results.ratios[idx]).toFixed(4)
        )
        const blended = results.blended_values[param].toFixed(4)
        rows.push([param, ...contributions, blended])
      })
    }

    const csv = rows.map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `soil-mixing-report-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Export batch data only
  const exportBatchDataCSV = () => {
    const params = Object.keys(limits)
    const headers = ['Batch', ...params]
    const lowerRow = ['Lower Limit', ...params.map(p => limits[p].lower)]
    const upperRow = ['Upper Limit', ...params.map(p => limits[p].upper)]
    const batchRows = batches.map(batch => [
      batch.name,
      ...params.map(p => batch[p] ?? 0)
    ])

    const rows = [headers, lowerRow, upperRow, ...batchRows]
    const csv = rows.map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `batch-data-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200 p-4 sm:p-6 mb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900">Export Data</h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Download all your data in various formats
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Comprehensive CSV Report */}
        <button
          onClick={exportComprehensiveCSV}
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold px-4 py-3 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 text-sm flex flex-col items-center gap-2"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <div className="text-center">
            <div className="font-bold">Full Report CSV</div>
            <div className="text-xs opacity-90">All data + results</div>
          </div>
        </button>

        {/* Complete Scenario JSON */}
        <button
          onClick={exportCompleteScenario}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-4 py-3 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 text-sm flex flex-col items-center gap-2"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
          </svg>
          <div className="text-center">
            <div className="font-bold">Scenario JSON</div>
            <div className="text-xs opacity-90">Re-loadable format</div>
          </div>
        </button>

        {/* Batch Data CSV */}
        <button
          onClick={exportBatchDataCSV}
          className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold px-4 py-3 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 text-sm flex flex-col items-center gap-2"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
          </svg>
          <div className="text-center">
            <div className="font-bold">Batch Data CSV</div>
            <div className="text-xs opacity-90">Data + limits only</div>
          </div>
        </button>
      </div>

      <div className="mt-4 space-y-2">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-900">
            <strong>Tip:</strong> Use "Scenario JSON" to save your entire setup (batches, limits, tolerance, constraints) and reload it later. Use "Full Report CSV" for documentation and sharing.
          </p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-xs text-green-900">
            <strong>Excel Users:</strong> All CSV files can be opened directly in Microsoft Excel, Google Sheets, or any spreadsheet application. The "Full Report CSV" includes comprehensive data with residuals, compliance status, and batch contributions.
          </p>
        </div>
      </div>
    </div>
  )
}

export default ExportManager
