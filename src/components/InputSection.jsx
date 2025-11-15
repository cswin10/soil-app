import { useState, useEffect } from 'react'

// Common soil contaminant parameters with typical regulatory limits
const DEFAULT_PARAMETERS = [
  { name: 'pH', lower: 5.5, upper: 8.5, unit: '' },
  { name: 'Arsenic', lower: 0, upper: 37, unit: 'mg/kg' },
  { name: 'Lead', lower: 0, upper: 200, unit: 'mg/kg' },
  { name: 'Cadmium', lower: 0, upper: 5, unit: 'mg/kg' },
  { name: 'Chromium', lower: 0, upper: 100, unit: 'mg/kg' },
  { name: 'Copper', lower: 0, upper: 150, unit: 'mg/kg' },
  { name: 'Mercury', lower: 0, upper: 2, unit: 'mg/kg' },
  { name: 'Nickel', lower: 0, upper: 50, unit: 'mg/kg' },
  { name: 'Zinc', lower: 0, upper: 200, unit: 'mg/kg' },
  { name: 'Selenium', lower: 0, upper: 10, unit: 'mg/kg' },
]

function InputSection({ batches, setBatches, limits, setLimits }) {
  const [numBatches, setNumBatches] = useState(3)
  const [batchData, setBatchData] = useState({})
  const [isExpanded, setIsExpanded] = useState(true)

  // Initialize batches and limits
  useEffect(() => {
    if (batches.length === 0) {
      initializeBatches(3)
    }
  }, [])

  const initializeBatches = (count) => {
    const newBatches = []
    const newBatchData = {}
    const newLimits = {}

    // Initialize limits from default parameters
    DEFAULT_PARAMETERS.forEach(param => {
      newLimits[param.name] = { lower: param.lower, upper: param.upper }
    })

    // Create batches with zero values
    for (let i = 0; i < count; i++) {
      const batchName = `Batch ${i + 1}`
      const batchValues = {}
      DEFAULT_PARAMETERS.forEach(param => {
        batchValues[param.name] = 0
      })
      newBatches.push({ name: batchName, ...batchValues })
      newBatchData[batchName] = batchValues
    }

    setBatches(newBatches)
    setBatchData(newBatchData)
    setLimits(newLimits)
    setNumBatches(count)
  }

  const handleBatchCountChange = (count) => {
    const newCount = parseInt(count)
    if (newCount < 2 || newCount > 10) return
    initializeBatches(newCount)
  }

  const handleValueChange = (batchIndex, paramName, value) => {
    const newBatches = [...batches]
    newBatches[batchIndex][paramName] = parseFloat(value) || 0
    setBatches(newBatches)
  }

  const handleLimitChange = (paramName, field, value) => {
    const newLimits = { ...limits }
    newLimits[paramName][field] = parseFloat(value) || 0
    setLimits(newLimits)
  }

  const loadExampleData = () => {
    const exampleBatches = [
      {
        name: 'Batch 1',
        pH: 7.2,
        Arsenic: 11,
        Lead: 29,
        Cadmium: 1.2,
        Chromium: 45,
        Copper: 78,
        Mercury: 0.3,
        Nickel: 34,
        Zinc: 123,
        Selenium: 3.2
      },
      {
        name: 'Batch 2',
        pH: 9.0,
        Arsenic: 22,
        Lead: 77,
        Cadmium: 2.8,
        Chromium: 55,
        Copper: 92,
        Mercury: 0.8,
        Nickel: 41,
        Zinc: 125,
        Selenium: 5.1
      },
      {
        name: 'Batch 3',
        pH: 7.1,
        Arsenic: 16,
        Lead: 36,
        Cadmium: 1.5,
        Chromium: 38,
        Copper: 65,
        Mercury: 0.4,
        Nickel: 29,
        Zinc: 121,
        Selenium: 4.0
      }
    ]

    setBatches(exampleBatches)
    setNumBatches(3)
    setIsExpanded(true)
  }

  return (
    <div className="space-y-4 md:space-y-6 w-full max-w-full overflow-hidden">
      {/* Configuration Header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200 overflow-hidden w-full max-w-full">
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-slate-600 hover:text-slate-900 transition-colors flex-shrink-0"
              >
                <svg
                  className={`w-5 h-5 sm:w-6 sm:h-6 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 truncate">Configure Soil Batches</h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  {batches.length} batches • {Object.keys(limits).length} parameters
                </p>
              </div>
            </div>
            <button
              onClick={loadExampleData}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-4 sm:px-6 py-2 sm:py-3 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 text-sm whitespace-nowrap flex-shrink-0 w-full sm:w-auto"
            >
              ✨ Load Example
            </button>
          </div>

          {/* Number of Batches Selector */}
          {isExpanded && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
              <label className="text-sm font-medium text-slate-700 flex-shrink-0">Number of Batches:</label>
              <select
                value={numBatches}
                onChange={(e) => handleBatchCountChange(e.target.value)}
                className="bg-white border-2 border-slate-300 rounded-lg px-3 sm:px-4 py-2 font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto"
              >
                {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                  <option key={n} value={n}>{n} Batches</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* MOBILE VIEW - Parameter Cards */}
        {isExpanded && batches.length > 0 && (
          <div className="block xl:hidden border-t border-slate-200">
            <div className="p-4 space-y-3">
              {DEFAULT_PARAMETERS.map((param, paramIdx) => (
                <div key={param.name} className="border-2 border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-gradient-to-r from-slate-100 to-blue-100 px-4 py-3 border-b border-slate-200">
                    <div className="font-bold text-slate-900 text-sm">
                      {param.name}
                      {param.unit && <span className="ml-2 text-xs text-slate-600">({param.unit})</span>}
                    </div>
                  </div>

                  <div className="p-3 space-y-3 bg-white">
                    {/* Limits */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-medium text-slate-600 block mb-1">Lower Limit</label>
                        <input
                          type="number"
                          step="0.1"
                          value={limits[param.name]?.lower ?? param.lower}
                          onChange={(e) => handleLimitChange(param.name, 'lower', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border-2 border-slate-300 rounded-lg text-center font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-600 block mb-1">Upper Limit</label>
                        <input
                          type="number"
                          step="0.1"
                          value={limits[param.name]?.upper ?? param.upper}
                          onChange={(e) => handleLimitChange(param.name, 'upper', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border-2 border-slate-300 rounded-lg text-center font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Batch Values */}
                    <div>
                      <label className="text-xs font-medium text-slate-600 block mb-2">Batch Values</label>
                      <div className="grid grid-cols-2 gap-2">
                        {batches.map((batch, batchIdx) => (
                          <div key={batchIdx}>
                            <div className="text-xs text-slate-500 mb-1">{batch.name}</div>
                            <input
                              type="number"
                              step="0.1"
                              value={batch[param.name] ?? 0}
                              onChange={(e) => handleValueChange(batchIdx, param.name, e.target.value)}
                              className="w-full px-2 py-1.5 text-sm border-2 border-blue-200 rounded-lg text-center font-semibold text-blue-900 bg-blue-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DESKTOP VIEW - Table */}
        {isExpanded && batches.length > 0 && (
          <div className="hidden xl:block overflow-hidden border-t border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gradient-to-r from-slate-700 to-blue-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                      Parameter
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">
                      Lower Limit
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">
                      Upper Limit
                    </th>
                    {batches.map((batch, idx) => (
                      <th key={idx} className="px-4 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">
                        {batch.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {DEFAULT_PARAMETERS.map((param, paramIdx) => (
                    <tr key={param.name} className={paramIdx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-bold text-slate-900">{param.name}</div>
                          {param.unit && (
                            <div className="ml-2 text-xs text-slate-500">({param.unit})</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          step="0.1"
                          value={limits[param.name]?.lower ?? param.lower}
                          onChange={(e) => handleLimitChange(param.name, 'lower', e.target.value)}
                          className="w-24 px-3 py-2 border-2 border-slate-300 rounded-lg text-center font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          step="0.1"
                          value={limits[param.name]?.upper ?? param.upper}
                          onChange={(e) => handleLimitChange(param.name, 'upper', e.target.value)}
                          className="w-24 px-3 py-2 border-2 border-slate-300 rounded-lg text-center font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </td>
                      {batches.map((batch, batchIdx) => (
                        <td key={batchIdx} className="px-4 py-3">
                          <input
                            type="number"
                            step="0.1"
                            value={batch[param.name] ?? 0}
                            onChange={(e) => handleValueChange(batchIdx, param.name, e.target.value)}
                            className="w-24 px-3 py-2 border-2 border-blue-200 rounded-lg text-center font-semibold text-blue-900 bg-blue-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Helper Text */}
        {isExpanded && (
          <div className="bg-gradient-to-r from-blue-50 to-slate-50 border-t border-slate-200 px-4 sm:px-6 py-3 sm:py-4">
            <p className="text-xs text-slate-600">
              <strong>Tip:</strong> Set upper limit to 9999 to ignore a parameter during optimization.
              All values are automatically saved as you type.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default InputSection
