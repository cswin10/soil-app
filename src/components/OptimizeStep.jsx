import { useState } from 'react'
import { ALL_PARAMETERS, PARAMETER_CATEGORIES } from '../utils/parameters'

/**
 * PAGE 2: Optimize
 * Tolerance slider and calculate button with advanced options hidden
 */
function OptimizeStep({ batches, tolerance, setTolerance, onOptimize, onBack, limits, setLimits }) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(PARAMETER_CATEGORIES.HEAVY_METALS)
  const [activeParameters, setActiveParameters] = useState(() => {
    // Get parameters that exist in batches
    const batchParams = Object.keys(batches[0] || {}).filter(key => key !== 'name')
    return ALL_PARAMETERS.filter(p => batchParams.includes(p.name))
  })

  // Add parameter
  const addParameter = (param) => {
    if (activeParameters.some(p => p.name === param.name)) return

    const newActiveParams = [...activeParameters, param]
    setActiveParameters(newActiveParams)

    // Add to limits
    setLimits(prev => ({
      ...prev,
      [param.name]: { lower: param.lower, upper: param.upper }
    }))
  }

  // Remove parameter
  const removeParameter = (paramName) => {
    const newActiveParams = activeParameters.filter(p => p.name !== paramName)
    setActiveParameters(newActiveParams)

    // Remove from limits
    const newLimits = { ...limits }
    delete newLimits[paramName]
    setLimits(newLimits)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Optimize Blend</h2>
        <p className="text-slate-600">Set your tolerance and calculate the optimal mixing ratios</p>
      </div>

      {/* Materials Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-3">Materials to Blend</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {batches.map((batch, idx) => (
            <div key={idx} className="bg-white rounded-lg p-3 border border-blue-200">
              <div className="font-semibold text-slate-900">{batch.name}</div>
              <div className="text-xs text-slate-600 mt-1">
                pH: {batch.pH?.toFixed(1) || 'N/A'} | As: {batch.Arsenic?.toFixed(1) || 'N/A'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tolerance Slider */}
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Optimization Tolerance</h3>
            <p className="text-sm text-slate-600 mt-1">How close to ideal should values be?</p>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl shadow-lg">
            <div className="text-3xl font-bold">{(tolerance * 100).toFixed(0)}%</div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={tolerance}
              onChange={(e) => setTolerance(parseFloat(e.target.value))}
              className="flex-1 h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, rgb(59 130 246) 0%, rgb(59 130 246) ${tolerance * 100}%, rgb(226 232 240) ${tolerance * 100}%, rgb(226 232 240) 100%)`
              }}
            />
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={(tolerance * 100).toFixed(0)}
                onChange={(e) => {
                  const val = parseFloat(e.target.value)
                  if (!isNaN(val) && val >= 0 && val <= 100) {
                    setTolerance(val / 100)
                  }
                }}
                className="w-20 px-3 py-2 border-2 border-blue-300 rounded-lg text-center font-bold text-blue-900 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-blue-900 font-semibold">%</span>
            </div>
          </div>

          <div className="flex justify-between text-sm text-slate-600">
            <span className="font-medium">🎯 Tight Control</span>
            <span className="font-medium">🌊 Relaxed</span>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-900">
              At {(tolerance * 100).toFixed(0)}% tolerance, blended values can be up to{' '}
              <strong>{((1 - tolerance) * 50).toFixed(0)}%</strong> away from the ideal center.
            </p>
          </div>
        </div>
      </div>

      {/* Advanced Options (Collapsible) */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between p-6 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <div className="text-left">
              <h3 className="text-lg font-semibold text-slate-900">Advanced Options</h3>
              <p className="text-sm text-slate-600">Add more parameters, adjust limits</p>
            </div>
          </div>
          <svg
            className={`w-6 h-6 text-slate-400 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showAdvanced && (
          <div className="border-t border-slate-200 p-6 space-y-4">
            {/* Active Parameters Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Active Parameters ({activeParameters.length})</h4>
              <div className="flex flex-wrap gap-2">
                {activeParameters.map(param => (
                  <div key={param.name} className="inline-flex items-center gap-2 bg-white border-2 border-blue-300 rounded-lg px-3 py-1 text-sm">
                    <span className="font-medium text-blue-900">{param.name}</span>
                    <button
                      onClick={() => removeParameter(param.name)}
                      className="text-red-600 hover:text-red-800"
                      title="Remove parameter"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2">
              {Object.values(PARAMETER_CATEGORIES).map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                    selectedCategory === category
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {category.split(' ')[0]}
                </button>
              ))}
            </div>

            {/* Parameters in Selected Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
              {ALL_PARAMETERS
                .filter(p => p.category === selectedCategory)
                .map(param => {
                  const isActive = activeParameters.some(p => p.name === param.name)
                  return (
                    <div
                      key={param.name}
                      className={`border-2 rounded-lg p-3 transition-all ${
                        isActive
                          ? 'bg-green-50 border-green-400'
                          : 'bg-white border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="font-semibold text-slate-900 text-sm">
                            {param.name}
                            {param.unit && <span className="ml-2 text-xs text-slate-600">({param.unit})</span>}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            Limits: {param.lower} - {param.upper}
                          </div>
                        </div>
                        <button
                          onClick={() => isActive ? removeParameter(param.name) : addParameter(param)}
                          className={`px-3 py-1 rounded-lg font-semibold text-xs transition-colors ${
                            isActive
                              ? 'bg-red-600 hover:bg-red-700 text-white'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          {isActive ? 'Remove' : 'Add'}
                        </button>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4">
        <button
          onClick={onBack}
          className="text-slate-600 hover:text-slate-900 font-semibold px-6 py-3 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Materials
        </button>

        <button
          onClick={onOptimize}
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold px-8 py-4 rounded-xl shadow-lg transition-all text-lg flex items-center gap-2"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          Calculate Optimal Blend
        </button>
      </div>
    </div>
  )
}

export default OptimizeStep
