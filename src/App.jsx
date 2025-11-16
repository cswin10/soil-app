import { useState, useEffect } from 'react'
import MaterialsStep from './components/MaterialsStep'
import OptimizeStep from './components/OptimizeStep'
import ResultsStep from './components/ResultsStep'
import { optimizeMix } from './utils/optimizer'
import { ALL_PARAMETERS } from './utils/parameters'

function App() {
  const [currentStep, setCurrentStep] = useState(1) // 1=Materials, 2=Optimize, 3=Results
  const [batches, setBatches] = useState([])
  const [limits, setLimits] = useState({})
  const [tolerance, setTolerance] = useState(0.75)
  const [batchTonnages, setBatchTonnages] = useState({})
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)

  // Initialize limits when batches change
  useEffect(() => {
    if (batches.length > 0) {
      // Get all parameter names from batches
      const paramNames = Object.keys(batches[0] || {}).filter(key => key !== 'name')

      // Create limits for all parameters
      const newLimits = {}
      paramNames.forEach(paramName => {
        const param = ALL_PARAMETERS.find(p => p.name === paramName)
        if (param) {
          newLimits[paramName] = { lower: param.lower, upper: param.upper }
        }
      })

      setLimits(newLimits)
    }
  }, [batches])

  // Navigation functions
  const goToOptimize = () => {
    if (batches.length >= 2) {
      setCurrentStep(2)
    }
  }

  const goToResults = () => {
    setCurrentStep(3)
  }

  const goToMaterials = () => {
    setCurrentStep(1)
  }

  const goToOptimizeFromResults = () => {
    setCurrentStep(2)
  }

  const startOver = () => {
    setCurrentStep(1)
    setResults(null)
  }

  // Optimization handler
  const handleOptimize = () => {
    setLoading(true)

    setTimeout(() => {
      try {
        const data = optimizeMix(batches, limits, tolerance, {})
        setResults(data)
        setLoading(false)
        goToResults()
      } catch (err) {
        console.error('Optimization failed:', err)
        setLoading(false)
        alert('Optimization failed: ' + (err.message || 'Unknown error'))
      }
    }, 100)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Soil Mixing Optimiser</h1>
              <p className="mt-1 text-blue-200">Precision blending for environmental compliance</p>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${
                currentStep === 1 ? 'bg-blue-500 text-white' : currentStep > 1 ? 'bg-green-500 text-white' : 'bg-slate-600 text-slate-300'
              }`}>
                {currentStep > 1 ? '✓' : '1'}
              </div>
              <div className={`h-1 w-12 ${currentStep > 1 ? 'bg-green-500' : 'bg-slate-600'}`}></div>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${
                currentStep === 2 ? 'bg-blue-500 text-white' : currentStep > 2 ? 'bg-green-500 text-white' : 'bg-slate-600 text-slate-300'
              }`}>
                {currentStep > 2 ? '✓' : '2'}
              </div>
              <div className={`h-1 w-12 ${currentStep > 2 ? 'bg-green-500' : 'bg-slate-600'}`}></div>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${
                currentStep === 3 ? 'bg-blue-500 text-white' : 'bg-slate-600 text-slate-300'
              }`}>
                3
              </div>
            </div>
          </div>

          {/* Step Labels */}
          <div className="flex items-center justify-end gap-2 mt-3">
            <div className={`text-xs ${currentStep >= 1 ? 'text-blue-200 font-semibold' : 'text-slate-400'}`}>
              Materials
            </div>
            <div className="w-12"></div>
            <div className={`text-xs ${currentStep >= 2 ? 'text-blue-200 font-semibold' : 'text-slate-400'}`}>
              Optimize
            </div>
            <div className="w-12"></div>
            <div className={`text-xs ${currentStep >= 3 ? 'text-blue-200 font-semibold' : 'text-slate-400'}`}>
              Results
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-12 px-4">
        {currentStep === 1 && (
          <MaterialsStep
            batches={batches}
            setBatches={setBatches}
            batchTonnages={batchTonnages}
            setBatchTonnages={setBatchTonnages}
            onContinue={goToOptimize}
          />
        )}

        {currentStep === 2 && (
          <OptimizeStep
            batches={batches}
            tolerance={tolerance}
            setTolerance={setTolerance}
            limits={limits}
            setLimits={setLimits}
            onOptimize={handleOptimize}
            onBack={goToMaterials}
          />
        )}

        {currentStep === 3 && results && (
          <ResultsStep
            results={results}
            batches={batches}
            limits={limits}
            tolerance={tolerance}
            batchTonnages={batchTonnages}
            onBack={goToOptimizeFromResults}
            onStartOver={startOver}
          />
        )}

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 shadow-2xl">
              <div className="flex flex-col items-center gap-4">
                <svg className="animate-spin h-12 w-12 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-lg font-semibold text-slate-900">Calculating optimal blend...</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 border-t border-slate-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-blue-200">
            Soil Mixing Optimiser v2.0 | Advanced gradient descent optimisation
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
