import { useState } from 'react'
import InputSection from './components/InputSection'
import ResultsDisplay from './components/ResultsDisplay'
import { optimizeMix } from './utils/optimizer'

function App() {
  const [batches, setBatches] = useState([])
  const [limits, setLimits] = useState({})
  const [tolerance, setTolerance] = useState(0.75)
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
        const data = optimizeMix(batches, limits, tolerance)
        setResults(data)
      } catch (err) {
        setError(err.message || 'Optimization failed')
      } finally {
        setLoading(false)
      }
    }, 100)
  }

  const canOptimize = batches.length >= 2 && Object.keys(limits).length > 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
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
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={tolerance}
                onChange={(e) => setTolerance(parseFloat(e.target.value))}
                className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, rgb(59 130 246) 0%, rgb(59 130 246) ${tolerance * 100}%, rgb(226 232 240) ${tolerance * 100}%, rgb(226 232 240) 100%)`
                }}
              />
              <div className="flex justify-between text-sm text-slate-600">
                <span className="font-medium">🎯 Tight Control</span>
                <span className="font-medium">🌊 Relaxed</span>
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
