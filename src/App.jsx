import { useState } from 'react'
import InputSection from './components/InputSection'
import ResultsDisplay from './components/ResultsDisplay'
import ExportManager from './components/ExportManager'
import { optimizeMix } from './utils/optimizer'

function App() {
  const [batches, setBatches] = useState([])
  const [limits, setLimits] = useState({})
  const [tolerance, setTolerance] = useState(0.75)
  const [autoRelax, setAutoRelax] = useState(false)
  const [materialConstraints, setMaterialConstraints] = useState({}) // { batchIndex: { min: 0, max: 1 } }
  const [showConstraints, setShowConstraints] = useState(false)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleOptimize = async () => {
    setLoading(true)
    setError(null)
    setResults(null)

    // Use setTimeout to allow UI to update (show loading state)
    setTimeout(() => {
      try {
        let currentTolerance = tolerance
        let data = optimizeMix(batches, limits, currentTolerance, materialConstraints)

        // Auto-relax feature: if enabled and solution is not within tolerance, gradually relax
        if (autoRelax && !data.within_tolerance && data.success) {
          const maxIterations = 20
          const step = 0.05 // Relax by 5% each iteration

          for (let i = 0; i < maxIterations; i++) {
            currentTolerance = Math.max(0, currentTolerance - step)
            data = optimizeMix(batches, limits, currentTolerance, materialConstraints)

            if (data.within_tolerance) {
              setTolerance(currentTolerance)
              break
            }

            // Stop if we've relaxed too much
            if (currentTolerance <= 0.01) break
          }
        }

        setResults(data)
      } catch (err) {
        setError(err.message || 'Optimization failed')
      } finally {
        setLoading(false)
      }
    }, 100)
  }

  const updateMaterialConstraint = (batchIndex, field, value) => {
    const numValue = parseFloat(value)
    if (isNaN(numValue)) return

    setMaterialConstraints(prev => ({
      ...prev,
      [batchIndex]: {
        ...prev[batchIndex],
        [field]: Math.max(0, Math.min(100, numValue)) / 100 // Convert to 0-1 range
      }
    }))
  }

  const clearMaterialConstraint = (batchIndex) => {
    setMaterialConstraints(prev => {
      const updated = { ...prev }
      delete updated[batchIndex]
      return updated
    })
  }

  const canOptimize = batches.length >= 2 && Object.keys(limits).length > 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 overflow-x-hidden">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
                Soil Mixing Optimizer
              </h1>
              <p className="mt-1 sm:mt-2 text-sm sm:text-base lg:text-lg text-blue-200">
                Precision blending for environmental compliance
              </p>
            </div>
            {batches.length > 0 && (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 sm:px-6 py-3 sm:py-4 border border-white/20">
                <div className="text-xs sm:text-sm text-blue-200">Active Batches</div>
                <div className="text-2xl sm:text-3xl font-bold text-white">{batches.length}</div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Input Section */}
        <InputSection
          batches={batches}
          setBatches={setBatches}
          limits={limits}
          setLimits={setLimits}
        />

        {/* Export Manager */}
        {batches.length > 0 && Object.keys(limits).length > 0 && (
          <ExportManager
            batches={batches}
            limits={limits}
            tolerance={tolerance}
            results={results}
            materialConstraints={materialConstraints}
          />
        )}

        {/* Material Constraints */}
        {batches.length >= 2 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 mb-8 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Material Constraints (Optional)
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  Set minimum and maximum percentage bounds for each material batch
                </p>
              </div>
              <button
                onClick={() => setShowConstraints(!showConstraints)}
                className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
              >
                {showConstraints ? 'Hide' : 'Show'} Constraints
              </button>
            </div>

            {showConstraints && (
              <div className="space-y-3">
                {batches.map((batch, index) => {
                  const constraint = materialConstraints[index] || {}
                  const hasConstraint = constraint.min !== undefined || constraint.max !== undefined

                  return (
                    <div key={index} className="bg-gradient-to-r from-slate-50 to-gray-50 border-2 border-slate-200 rounded-xl p-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="flex-1">
                          <div className="font-semibold text-slate-900 text-lg">{batch.name}</div>
                          <div className="text-xs text-slate-600 mt-1">
                            Current: {results ? `${(results.ratios[index] * 100).toFixed(2)}%` : 'Not optimized yet'}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-slate-700">Min %:</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              placeholder="0"
                              value={constraint.min !== undefined ? (constraint.min * 100).toFixed(1) : ''}
                              onChange={(e) => updateMaterialConstraint(index, 'min', e.target.value)}
                              className="w-20 px-2 py-1 border-2 border-slate-300 rounded-lg text-center focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-slate-700">Max %:</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              placeholder="100"
                              value={constraint.max !== undefined ? (constraint.max * 100).toFixed(1) : ''}
                              onChange={(e) => updateMaterialConstraint(index, 'max', e.target.value)}
                              className="w-20 px-2 py-1 border-2 border-slate-300 rounded-lg text-center focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                            />
                          </div>

                          {hasConstraint && (
                            <button
                              onClick={() => clearMaterialConstraint(index)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>

                      {hasConstraint && (
                        <div className="mt-2 text-xs text-slate-600 bg-blue-50 border border-blue-200 rounded px-3 py-2">
                          Constrained to: {constraint.min !== undefined ? `${(constraint.min * 100).toFixed(1)}%` : '0%'} - {constraint.max !== undefined ? `${(constraint.max * 100).toFixed(1)}%` : '100%'}
                        </div>
                      )}
                    </div>
                  )
                })}

                {Object.keys(materialConstraints).length > 0 && (
                  <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-yellow-900">Constraints Active</p>
                        <p className="text-xs text-yellow-800 mt-1">
                          {Object.keys(materialConstraints).length} material{Object.keys(materialConstraints).length > 1 ? 's have' : ' has'} constraints. These will be enforced during optimization.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tolerance Slider */}
        {batches.length >= 2 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 mb-8 border border-slate-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="flex-1">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Optimization Tolerance
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  How close to the ideal midpoint should values be?
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl shadow-lg">
                <div className="text-2xl sm:text-3xl font-bold">{(tolerance * 100).toFixed(0)}%</div>
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
                  className="flex-1 h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, rgb(59 130 246) 0%, rgb(59 130 246) ${tolerance * 100}%, rgb(226 232 240) ${tolerance * 100}%, rgb(226 232 240) 100%)`
                  }}
                />
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={(tolerance * 100).toFixed(1)}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value)
                      if (!isNaN(val) && val >= 0 && val <= 100) {
                        setTolerance(val / 100)
                      }
                    }}
                    className="w-20 px-3 py-2 border-2 border-blue-300 rounded-lg text-center font-bold text-blue-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="text-blue-900 font-semibold">%</span>
                </div>
              </div>
              <div className="flex justify-between text-sm text-slate-600">
                <span className="font-medium">🎯 Tight Control</span>
                <span className="font-medium">🌊 Relaxed</span>
              </div>

              {/* Auto-Relax Toggle */}
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="auto-relax"
                    checked={autoRelax}
                    onChange={(e) => setAutoRelax(e.target.checked)}
                    className="mt-1 w-5 h-5 text-purple-600 border-purple-300 rounded focus:ring-purple-500"
                  />
                  <div className="flex-1">
                    <label htmlFor="auto-relax" className="flex items-center gap-2 cursor-pointer">
                      <span className="font-semibold text-purple-900">Auto-Relax Tolerance</span>
                      <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                      </svg>
                    </label>
                    <p className="text-xs text-purple-700 mt-1">
                      Automatically find the minimum tolerance needed for a valid solution. If no feasible blend exists at the current tolerance, the optimizer will gradually relax it until one is found.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  At {(tolerance * 100).toFixed(0)}% tolerance, blended values can be up to{' '}
                  <strong>{((1 - tolerance) * 50).toFixed(0)}%</strong> away from the center of the allowed range.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Optimize Button */}
        {canOptimize && (
          <div className="mb-8">
            <button
              onClick={handleOptimize}
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-bold py-6 px-8 rounded-2xl shadow-2xl transition-all duration-200 text-xl transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Calculating Optimal Mix...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <span className="mr-3">⚗️</span>
                  Find Optimal Mix
                  <span className="ml-3">→</span>
                </span>
              )}
            </button>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-6 mb-8 shadow-lg">
            <div className="flex items-center">
              <span className="text-3xl mr-4">⚠️</span>
              <div>
                <h3 className="text-lg font-bold text-red-900 mb-1">Optimization Error</h3>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {results && (
          <ResultsDisplay
            results={results}
            batches={batches}
            limits={limits}
            tolerance={tolerance}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 border-t border-slate-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-sm text-blue-200">
            Soil Mixing Optimizer v2.0 | Powered by scipy.optimize SLSQP algorithm
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
