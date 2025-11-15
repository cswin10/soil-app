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
  const [isDragging, setIsDragging] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [uploadSuccess, setUploadSuccess] = useState(null)

  // Initialize batches and limits
  useEffect(() => {
    if (batches.length === 0) {
      initializeBatches(3)
    }
  }, [])

  // Parse CSV file
  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim())
    if (lines.length < 2) throw new Error('File must contain header row and at least one data row')

    const headers = lines[0].split(',').map(h => h.trim())
    const batchNameIndex = headers.findIndex(h => h.toLowerCase() === 'batch' || h.toLowerCase() === 'name')

    if (batchNameIndex === -1) {
      throw new Error('CSV must contain a "Batch" or "Name" column')
    }

    const newBatches = []
    const newLimits = {}
    const parameterNames = headers.filter((_, idx) => idx !== batchNameIndex)

    // Initialize limits for discovered parameters
    parameterNames.forEach(paramName => {
      const defaultParam = DEFAULT_PARAMETERS.find(p => p.name === paramName)
      if (defaultParam) {
        newLimits[paramName] = { lower: defaultParam.lower, upper: defaultParam.upper }
      } else {
        // For unknown parameters, set wide limits
        newLimits[paramName] = { lower: 0, upper: 9999 }
      }
    })

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      const batchName = values[batchNameIndex]
      const batch = { name: batchName }

      headers.forEach((header, idx) => {
        if (idx !== batchNameIndex) {
          const value = parseFloat(values[idx])
          batch[header] = isNaN(value) ? 0 : value
        }
      })

      newBatches.push(batch)
    }

    return { batches: newBatches, limits: newLimits }
  }

  // Handle file upload
  const handleFileUpload = async (file) => {
    setUploadError(null)
    setUploadSuccess(null)

    if (!file) return

    // Check file type
    const fileType = file.name.split('.').pop().toLowerCase()
    if (fileType !== 'csv') {
      setUploadError('Please upload a CSV file')
      return
    }

    try {
      const text = await file.text()
      const { batches: newBatches, limits: newLimits } = parseCSV(text)

      setBatches(newBatches)
      setLimits(newLimits)
      setNumBatches(newBatches.length)
      setUploadSuccess(`Successfully loaded ${newBatches.length} batches with ${Object.keys(newLimits).length} parameters`)

      // Clear success message after 5 seconds
      setTimeout(() => setUploadSuccess(null), 5000)
    } catch (err) {
      setUploadError(err.message || 'Failed to parse file')
    }
  }

  // Drag and drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }

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
      {/* File Upload Section */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200 overflow-hidden w-full max-w-full">
        <div className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 mb-2">Import Batch Data</h2>
          <p className="text-xs sm:text-sm text-slate-600 mb-4">
            Upload a CSV file with your soil batch data (recommended)
          </p>

          {/* Drag and Drop Zone */}
          <div
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative border-3 border-dashed rounded-2xl p-6 sm:p-8 transition-all duration-200 ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/50'
            }`}
          >
            <div className="text-center">
              <div className="mb-4">
                <svg
                  className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-slate-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-sm text-slate-600">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer bg-white rounded-lg px-4 py-2 font-semibold text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 border-2 border-blue-200 hover:border-blue-300 transition-all"
                >
                  <span>Choose a file</span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    accept=".csv"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(file)
                    }}
                  />
                </label>
                <p className="text-slate-600">or drag and drop</p>
              </div>
              <p className="text-xs text-slate-500 mt-2">CSV files only</p>
            </div>
          </div>

          {/* Upload Success Message */}
          {uploadSuccess && (
            <div className="mt-4 bg-green-50 border-2 border-green-300 rounded-xl p-4">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-sm font-medium text-green-800">{uploadSuccess}</p>
              </div>
            </div>
          )}

          {/* Upload Error Message */}
          {uploadError && (
            <div className="mt-4 bg-red-50 border-2 border-red-300 rounded-xl p-4">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm font-medium text-red-800">{uploadError}</p>
              </div>
            </div>
          )}

          {/* CSV Format Help */}
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2">
              <p className="text-sm text-blue-900 font-semibold">CSV Format Example:</p>
              <a
                href="/sample-soil-data.csv"
                download
                className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Sample
              </a>
            </div>
            <pre className="text-xs text-blue-800 bg-white p-3 rounded border border-blue-200 overflow-x-auto">
{`Batch,pH,Arsenic,Lead,Cadmium
Batch 1,7.2,11,29,1.2
Batch 2,9.0,22,77,2.8
Batch 3,7.1,16,36,1.5`}
            </pre>
            <p className="text-xs text-blue-700 mt-2">
              First column must be named "Batch" or "Name". Other columns will be matched to parameters.
            </p>
          </div>
        </div>
      </div>

      {/* Configuration Header - Manual Entry */}
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
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 truncate">Manual Entry (Optional)</h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  Enter data manually or adjust uploaded values • {batches.length} batches • {Object.keys(limits).length} parameters
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
