import { useState } from 'react'
import InputSection from './components/InputSection'
import ResultsDisplay from './components/ResultsDisplay'
import ParameterTable from './components/ParameterTable'

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

    try {
      const response = await fetch('/.netlify/functions/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          batches,
          limits,
          tolerance
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Optimization failed')
      }

      setResults(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const canOptimize = batches.length >= 2 && Object.keys(limits).length > 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Soil Mixing Optimizer
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Find optimal blending ratios while staying within legal limits
              </p>
            </div>
            <div className="text-sm text-gray-500">
              <div className="font-semibold">Batches: {batches.length}</div>
              <div>Parameters: {Object.keys(limits).length}</div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">How it works:</h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Upload CSV data or manually enter soil batch parameters</li>
            <li>Review and adjust parameter limits (set to 9999 to ignore)</li>
            <li>Set your tolerance level (how close to stay to midpoint)</li>
            <li>Click "Find Optimal Mix" to calculate the best ratios</li>
          </ol>
        </div>

        {/* Input Section */}
        <InputSection
          batches={batches}
          setBatches={setBatches}
          limits={limits}
          setLimits={setLimits}
        />

        {/* Parameter Limits Table */}
        {Object.keys(limits).length > 0 && (
          <ParameterTable
            limits={limits}
            setLimits={setLimits}
          />
        )}

        {/* Tolerance Slider */}
        {Object.keys(limits).length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Tolerance Settings
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Tolerance: {(tolerance * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={tolerance}
                  onChange={(e) => setTolerance(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Tight (0%)</span>
                  <span>Relaxed (100%)</span>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Higher tolerance = blended values can be further from the midpoint.
                At {(tolerance * 100).toFixed(0)}%, values can be up to{' '}
                {((1 - tolerance) * 50).toFixed(0)}% away from the center of the range.
              </p>
            </div>
          </div>
        )}

        {/* Optimize Button */}
        {canOptimize && (
          <div className="mb-6">
            <button
              onClick={handleOptimize}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-lg shadow-md transition-colors duration-200 text-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Optimizing...
                </span>
              ) : (
                'Find Optimal Mix'
              )}
            </button>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-red-900 mb-1">Error</h3>
            <p className="text-sm text-red-800">{error}</p>
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
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            Soil Mixing Optimizer v1.0 | Uses scipy.optimize with SLSQP algorithm
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
