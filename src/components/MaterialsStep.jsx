import { useState } from 'react'

/**
 * PAGE 1: Add Materials
 * Simple material input focusing on key parameters only
 */
function MaterialsStep({ batches, setBatches, batchTonnages, setBatchTonnages, onContinue }) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [uploadSuccess, setUploadSuccess] = useState(null)

  // Key parameters only - simplified from 70+
  const KEY_PARAMS = ['pH', 'Arsenic', 'Zinc', 'Lead', 'Cadmium', 'Copper', 'Nickel', 'Mercury', 'Chromium']

  const addMaterial = () => {
    const newMaterial = {
      name: `Material ${batches.length + 1}`,
      pH: 7.0,
      Arsenic: 0,
      Zinc: 0,
      Lead: 0,
      Cadmium: 0,
      Copper: 0,
      Nickel: 0,
      Mercury: 0,
      Chromium: 0
    }
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

  // CSV Upload
  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim())
    if (lines.length < 2) throw new Error('File must contain header row and at least one data row')

    const headers = lines[0].split(',').map(h => h.trim())
    const batchNameIndex = headers.findIndex(h => h.toLowerCase() === 'batch' || h.toLowerCase() === 'name')

    if (batchNameIndex === -1) {
      throw new Error('CSV must contain a "Batch" or "Name" column')
    }

    const newBatches = []
    const parameterNames = headers.filter((_, idx) => idx !== batchNameIndex)

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      const batchName = values[batchNameIndex]

      const batch = { name: batchName }
      headers.forEach((header, idx) => {
        if (idx !== batchNameIndex) {
          const rawValue = values[idx].trim().toLowerCase()
          if (rawValue === '' || rawValue === 'n/a' || rawValue === '-' || rawValue === 'na') {
            batch[header] = null
          } else {
            const value = parseFloat(values[idx])
            batch[header] = isNaN(value) ? 0 : value
          }
        }
      })

      newBatches.push(batch)
    }

    return newBatches
  }

  const handleFileUpload = async (file) => {
    setUploadError(null)
    setUploadSuccess(null)

    if (!file) return

    const fileType = file.name.split('.').pop().toLowerCase()
    if (fileType !== 'csv') {
      setUploadError('Please upload a CSV file')
      return
    }

    try {
      const text = await file.text()
      const newBatches = parseCSV(text)
      setBatches(newBatches)
      setUploadSuccess(`Successfully loaded ${newBatches.length} materials`)
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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Add Materials</h2>
        <p className="text-slate-600">Add your soil batches manually or upload a CSV file</p>
      </div>

      {/* CSV Upload */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Upload</h3>

        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-3 border-dashed rounded-xl p-8 transition-all ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-slate-300 bg-slate-50 hover:border-blue-400'
          }`}
        >
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-slate-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="mt-4">
              <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold inline-block transition-colors">
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
              <p className="text-sm text-slate-600 mt-2">or drag and drop</p>
            </div>
          </div>
        </div>

        {uploadSuccess && (
          <div className="mt-4 bg-green-50 border-2 border-green-300 rounded-lg p-3 flex items-center gap-2">
            <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-sm font-medium text-green-800">{uploadSuccess}</p>
          </div>
        )}

        {uploadError && (
          <div className="mt-4 bg-red-50 border-2 border-red-300 rounded-lg p-3 flex items-center gap-2">
            <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-sm font-medium text-red-800">{uploadError}</p>
          </div>
        )}
      </div>

      {/* Manual Entry */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Materials List</h3>
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
                <div className="flex items-start gap-4">
                  {/* Material Name & Tonnage */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
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
                      <label className="block text-xs font-medium text-slate-700 mb-1">Available Tonnage</label>
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
                    className="text-red-600 hover:text-red-800 p-2"
                    title="Remove material"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                {/* Key Parameters */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {KEY_PARAMS.map(param => (
                    <div key={param}>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        {param} {param !== 'pH' && <span className="text-slate-400">(mg/kg)</span>}
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={batch[param] ?? 0}
                        onChange={(e) => updateMaterial(index, param, e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
        <p className="text-center text-sm text-orange-600">Add at least 2 materials to continue</p>
      )}
    </div>
  )
}

export default MaterialsStep
