import { useState, useEffect } from 'react'
import { ALL_PARAMETERS, PARAMETER_CATEGORIES, getDefaultParameters } from '../utils/parameters'

/**
 * PAGE 1: Add Materials
 * COMPREHENSIVE parameter support - all 71 parameters
 */
function MaterialsStep({ batches, setBatches, batchTonnages, setBatchTonnages, onContinue }) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [uploadSuccess, setUploadSuccess] = useState(null)
  const [showParameterLibrary, setShowParameterLibrary] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState({})
  const [detectedParams, setDetectedParams] = useState(null)

  // Active parameters - start with 9 key parameters
  const DEFAULT_PARAMS = ['pH', 'Arsenic', 'Zinc', 'Lead', 'Cadmium', 'Copper', 'Nickel', 'Mercury', 'Chromium']
  const [activeParamNames, setActiveParamNames] = useState(DEFAULT_PARAMS)

  // Get full parameter objects
  const activeParameters = ALL_PARAMETERS.filter(p => activeParamNames.includes(p.name))

  const addMaterial = () => {
    const newMaterial = { name: `Material ${batches.length + 1}` }

    // Initialize with all active parameters
    activeParamNames.forEach(paramName => {
      newMaterial[paramName] = 0
    })

    setBatches([...batches, newMaterial])
  }

  const removeMaterial = (index) => {
    setBatches(batches.filter((_, i) => i !== index))
    const newTonnages = { ...batchTonnages }
    delete newTonnages[index]
    // Reindex tonnages
    const reindexed = {}
    Object.keys(newTonnages).forEach(key => {
      const keyNum = parseInt(key)
      if (keyNum > index) {
        reindexed[keyNum - 1] = newTonnages[key]
      } else {
        reindexed[key] = newTonnages[key]
      }
    })
    setBatchTonnages(reindexed)
  }

  const updateMaterial = (index, field, value) => {
    const updated = [...batches]
    updated[index][field] = field === 'name' ? value : (parseFloat(value) || 0)
    setBatches(updated)
  }

  const updateTonnage = (index, value) => {
    const tonnage = parseFloat(value)
    if (!isNaN(tonnage) && tonnage >= 0) {
      setBatchTonnages(prev => ({ ...prev, [index]: tonnage }))
    } else if (value === '') {
      const newTonnages = { ...batchTonnages }
      delete newTonnages[index]
      setBatchTonnages(newTonnages)
    }
  }

  // Toggle parameter in active list
  const toggleParameter = (paramName) => {
    if (activeParamNames.includes(paramName)) {
      // Remove parameter
      setActiveParamNames(activeParamNames.filter(p => p !== paramName))
      // Remove from all batches
      setBatches(batches.map(batch => {
        const { [paramName]: removed, ...rest } = batch
        return rest
      }))
    } else {
      // Add parameter
      setActiveParamNames([...activeParamNames, paramName])
      // Add to all batches
      setBatches(batches.map(batch => ({
        ...batch,
        [paramName]: 0
      })))
    }
  }

  // Toggle category expansion
  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }

  // CSV Upload - DEFENSIVE PARSING
  const parseCSV = (text) => {
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid CSV file - empty or corrupted')
    }

    // Split into lines and filter out completely empty lines
    const lines = text.split('\n').filter(line => {
      const trimmed = line?.trim() || ''
      return trimmed.length > 0
    })

    if (lines.length < 2) {
      throw new Error('CSV must contain header row and at least one data row')
    }

    // Parse headers with defensive checks
    const headers = lines[0].split(',').map(h => {
      const trimmed = (h !== undefined && h !== null) ? String(h).trim() : ''
      return trimmed
    }).filter(h => h.length > 0)

    if (headers.length === 0) {
      throw new Error('CSV format error: No valid headers found')
    }

    // Find batch name column
    const batchNameIndex = headers.findIndex(h => {
      const lower = h.toLowerCase()
      return lower === 'batch' || lower === 'name'
    })

    if (batchNameIndex === -1) {
      throw new Error('CSV must contain a "Batch" or "Name" column')
    }

    const newBatches = []
    const detectedParameters = []
    const parameterNames = headers.filter((_, idx) => idx !== batchNameIndex)

    // Match CSV headers to parameter database with defensive checks
    parameterNames.forEach(csvHeader => {
      if (!csvHeader || csvHeader.length === 0) return

      const matchedParam = ALL_PARAMETERS.find(p => {
        const paramName = p?.name || ''
        const headerName = csvHeader || ''
        return paramName.toLowerCase() === headerName.toLowerCase()
      })

      if (matchedParam && !detectedParameters.includes(matchedParam.name)) {
        detectedParameters.push(matchedParam.name)
      }
    })

    // Parse data rows with defensive checks
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      if (!line || line.trim().length === 0) continue

      const values = line.split(',').map(v => {
        return (v !== undefined && v !== null) ? String(v).trim() : ''
      })

      // Ensure we have enough values
      if (values.length === 0 || batchNameIndex >= values.length) continue

      const batchName = values[batchNameIndex] || `Material ${i}`

      const batch = { name: batchName }

      headers.forEach((header, idx) => {
        if (idx === batchNameIndex || !header) return

        // Try to match parameter
        const matchedParam = ALL_PARAMETERS.find(p => {
          const paramName = p?.name || ''
          const headerName = header || ''
          return paramName.toLowerCase() === headerName.toLowerCase()
        })

        if (matchedParam) {
          // Defensive value extraction
          const cellValue = (idx < values.length) ? values[idx] : ''
          const rawValue = String(cellValue || '').trim().toLowerCase()

          // Handle missing data
          if (rawValue === '' || rawValue === 'n/a' || rawValue === '-' || rawValue === 'na' || rawValue === 'null') {
            batch[matchedParam.name] = null
          } else {
            const numValue = parseFloat(cellValue)
            batch[matchedParam.name] = isNaN(numValue) ? null : numValue
          }
        }
      })

      // Only add batch if it has at least one parameter value
      if (Object.keys(batch).length > 1) {
        newBatches.push(batch)
      }
    }

    if (newBatches.length === 0) {
      throw new Error('No valid data rows found in CSV')
    }

    if (detectedParameters.length === 0) {
      throw new Error('No recognized parameters found. Please check column names match parameter database.')
    }

    return { batches: newBatches, detectedParameters }
  }

  const handleFileUpload = async (file) => {
    setUploadError(null)
    setUploadSuccess(null)
    setDetectedParams(null)

    if (!file) return

    const fileType = file.name.split('.').pop().toLowerCase()
    if (fileType !== 'csv') {
      setUploadError('Please upload a CSV file')
      return
    }

    try {
      const text = await file.text()
      const { batches: newBatches, detectedParameters } = parseCSV(text)

      setBatches(newBatches)
      setActiveParamNames(detectedParameters)
      setDetectedParams(detectedParameters)

      setUploadSuccess(`Successfully loaded ${newBatches.length} materials with ${detectedParameters.length} parameters`)
      setTimeout(() => setUploadSuccess(null), 5000)
    } catch (err) {
      setUploadError(err.message || 'Failed to parse file')
    }
  }

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

  // Count parameters by category
  const getCategoryCount = (category) => {
    return ALL_PARAMETERS.filter(p => p.category === category).length
  }

  const getActiveCategoryCount = (category) => {
    return ALL_PARAMETERS.filter(p => p.category === category && activeParamNames.includes(p.name)).length
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Add Materials</h2>
        <p className="text-slate-600">Upload laboratory analysis or enter data manually</p>
      </div>

      {/* HERO: CSV Upload - VERY PROMINENT */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-2xl p-8 border-4 border-blue-400">
        <div className="text-center mb-4">
          <h3 className="text-2xl font-bold text-white mb-2">📁 Upload Laboratory Analysis CSV</h3>
          <p className="text-blue-100 text-lg">Recommended method - Handles all 71 parameters automatically</p>
        </div>

        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-4 border-dashed rounded-xl p-12 transition-all bg-white/10 ${
            isDragging
              ? 'border-yellow-300 bg-yellow-50/20'
              : 'border-white/50 hover:border-white hover:bg-white/20'
          }`}
        >
          <div className="text-center">
            <svg
              className="mx-auto h-20 w-20 text-white mb-4"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div>
              <label className="cursor-pointer bg-white hover:bg-blue-50 text-blue-600 px-8 py-4 rounded-xl font-bold inline-block transition-all shadow-lg text-lg">
                <span>Choose CSV File</span>
                <input
                  type="file"
                  accept=".csv"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file)
                  }}
                />
              </label>
              <p className="text-white text-lg mt-4 font-semibold">or drag and drop your file here</p>
            </div>
          </div>
        </div>

        {uploadSuccess && (
          <div className="mt-6 bg-green-500 border-2 border-green-300 rounded-lg p-4 flex items-center gap-3">
            <svg className="h-6 w-6 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="font-bold text-white">{uploadSuccess}</p>
              {detectedParams && (
                <p className="text-sm text-green-100 mt-1">
                  ✓ {detectedParams.length} of 71 parameters detected
                </p>
              )}
            </div>
          </div>
        )}

        {uploadError && (
          <div className="mt-6 bg-red-500 border-2 border-red-300 rounded-lg p-4 flex items-center gap-3">
            <svg className="h-6 w-6 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="font-medium text-white">{uploadError}</p>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t-2 border-slate-300"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-slate-50 px-6 py-2 text-slate-600 font-semibold text-lg">OR enter manually</span>
        </div>
      </div>

      {/* Manual Entry */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Materials List</h3>
            <p className="text-sm text-slate-600 mt-1">
              Active parameters: <span className="font-bold text-blue-600">{activeParamNames.length} of 71</span>
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowParameterLibrary(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add More Parameters
            </button>
            <button
              onClick={addMaterial}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Material
            </button>
          </div>
        </div>

        {batches.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <svg className="mx-auto h-12 w-12 text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p>No materials added yet. Click "Add Material" or upload a CSV file.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {batches.map((batch, index) => (
              <div key={index} className="border-2 border-slate-200 rounded-xl p-4 hover:border-blue-300 transition-colors">
                <div className="flex items-start gap-4 mb-4">
                  {/* Material Name & Tonnage */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Material Name</label>
                      <input
                        type="text"
                        value={batch.name}
                        onChange={(e) => updateMaterial(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Available Tonnage (Optional)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          placeholder="Optional"
                          value={batchTonnages[index] || ''}
                          onChange={(e) => updateTonnage(index, e.target.value)}
                          className="flex-1 px-3 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <span className="text-slate-700 font-medium">tonnes</span>
                      </div>
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => removeMaterial(index)}
                    className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove material"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                {/* Parameters Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {activeParameters.map(param => (
                    <div key={param.name}>
                      <label className="block text-xs font-medium text-slate-600 mb-1" title={param.description}>
                        {param.name} {param.unit && <span className="text-slate-400">({param.unit})</span>}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={batch[param.name] ?? 0}
                        onChange={(e) => updateMaterial(index, param.name, e.target.value)}
                        placeholder="N/A"
                        className="w-full px-2 py-1.5 text-sm border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-2 text-xs text-slate-500">
                  💡 Tip: Leave blank, enter 'N/A', or '-' for missing parameters
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Parameter Library Modal */}
      {showParameterLibrary && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">Parameter Library</h3>
                  <p className="text-slate-600 mt-1">
                    Select from 71 parameters - <span className="font-bold text-blue-600">{activeParamNames.length} active</span>
                  </p>
                </div>
                <button
                  onClick={() => setShowParameterLibrary(false)}
                  className="text-slate-400 hover:text-slate-600 p-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {Object.values(PARAMETER_CATEGORIES).map(category => {
                const categoryParams = ALL_PARAMETERS.filter(p => p.category === category)
                const isExpanded = expandedCategories[category]
                const activeCount = getActiveCategoryCount(category)
                const totalCount = getCategoryCount(category)

                return (
                  <div key={category} className="mb-4 border border-slate-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleCategory(category)}
                      className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <svg className={`w-5 h-5 text-slate-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="font-bold text-slate-900">{category}</span>
                        <span className="text-sm text-slate-600">
                          ({activeCount}/{totalCount})
                        </span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        activeCount === totalCount ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {activeCount === totalCount ? 'All Active' : `${activeCount} Active`}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 bg-white">
                        {categoryParams.map(param => {
                          const isActive = activeParamNames.includes(param.name)
                          return (
                            <div
                              key={param.name}
                              className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                                isActive
                                  ? 'bg-green-50 border-green-400'
                                  : 'bg-white border-slate-200 hover:border-blue-300'
                              }`}
                              onClick={() => toggleParameter(param.name)}
                            >
                              <div className="flex items-start gap-3">
                                <input
                                  type="checkbox"
                                  checked={isActive}
                                  onChange={() => toggleParameter(param.name)}
                                  className="mt-1 w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                                />
                                <div className="flex-1">
                                  <div className="font-semibold text-slate-900 text-sm">
                                    {param.name}
                                    {param.unit && <span className="ml-2 text-xs text-slate-600">({param.unit})</span>}
                                    {param.phDependent && (
                                      <span className="ml-2 text-xs bg-yellow-200 text-yellow-900 px-2 py-0.5 rounded">pH dependent</span>
                                    )}
                                  </div>
                                  <div className="text-xs text-slate-600 mt-1">{param.description}</div>
                                  <div className="text-xs text-slate-500 mt-1">
                                    Limits: {param.lower} - {param.upper} {param.unit}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => setShowParameterLibrary(false)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-lg transition-colors"
              >
                Done - {activeParamNames.length} Parameters Active
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Continue Button */}
      <div className="flex justify-end">
        <button
          onClick={onContinue}
          disabled={batches.length < 2}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-bold px-8 py-4 rounded-xl shadow-lg transition-all text-lg flex items-center gap-2"
        >
          Continue to Optimize
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      </div>

      {batches.length < 2 && batches.length > 0 && (
        <p className="text-center text-sm text-orange-600 font-semibold">
          ⚠️ Add at least 2 materials to continue
        </p>
      )}

      {batches.length >= 2 && !activeParamNames.includes('pH') && (
        <p className="text-center text-sm text-orange-600 font-semibold">
          ⚠️ Warning: pH parameter is recommended for accurate optimization
        </p>
      )}
    </div>
  )
}

export default MaterialsStep
