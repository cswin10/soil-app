import { useState, useEffect } from 'react'
import ComplianceHeatmap from './ComplianceHeatmap'
import ParameterConfigModal from './ParameterConfigModal'

// Common soil parameters with typical regulatory limits and metadata
const DEFAULT_PARAMETERS = [
  {
    name: 'pH',
    lower: 5.5,
    upper: 8.5,
    unit: 'pH',
    type: 'physical',
    blendingMethod: 'manual',
    priority: 1,
    description: 'Soil acidity/alkalinity (non-linear blending)'
  },
  {
    name: 'Arsenic',
    lower: 0,
    upper: 37,
    unit: 'mg/kg',
    type: 'contaminant',
    blendingMethod: 'linear',
    priority: 1,
    description: 'Heavy metal contaminant'
  },
  {
    name: 'Lead',
    lower: 0,
    upper: 200,
    unit: 'mg/kg',
    type: 'contaminant',
    blendingMethod: 'linear',
    priority: 1,
    description: 'Heavy metal contaminant'
  },
  {
    name: 'Cadmium',
    lower: 0,
    upper: 5,
    unit: 'mg/kg',
    type: 'contaminant',
    blendingMethod: 'linear',
    priority: 1,
    description: 'Heavy metal contaminant'
  },
  {
    name: 'Chromium',
    lower: 0,
    upper: 100,
    unit: 'mg/kg',
    type: 'contaminant',
    blendingMethod: 'linear',
    priority: 1,
    description: 'Heavy metal contaminant'
  },
  {
    name: 'Copper',
    lower: 0,
    upper: 150,
    unit: 'mg/kg',
    type: 'contaminant',
    blendingMethod: 'linear',
    priority: 1,
    description: 'Heavy metal contaminant'
  },
  {
    name: 'Mercury',
    lower: 0,
    upper: 2,
    unit: 'mg/kg',
    type: 'contaminant',
    blendingMethod: 'linear',
    priority: 1,
    description: 'Heavy metal contaminant'
  },
  {
    name: 'Nickel',
    lower: 0,
    upper: 50,
    unit: 'mg/kg',
    type: 'contaminant',
    blendingMethod: 'linear',
    priority: 1,
    description: 'Heavy metal contaminant'
  },
  {
    name: 'Zinc',
    lower: 0,
    upper: 200,
    unit: 'mg/kg',
    type: 'contaminant',
    blendingMethod: 'linear',
    priority: 1,
    description: 'Heavy metal contaminant'
  },
  {
    name: 'Selenium',
    lower: 0,
    upper: 10,
    unit: 'mg/kg',
    type: 'contaminant',
    blendingMethod: 'linear',
    priority: 1,
    description: 'Heavy metal contaminant'
  },
]

function InputSection({ batches, setBatches, limits, setLimits }) {
  const [numBatches, setNumBatches] = useState(3)
  const [batchData, setBatchData] = useState({})
  const [isExpanded, setIsExpanded] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [uploadSuccess, setUploadSuccess] = useState(null)
  const [limitsProfiles, setLimitsProfiles] = useState([])
  const [showProfileManager, setShowProfileManager] = useState(false)
  const [showParamConfig, setShowParamConfig] = useState(false)
  const [newProfileName, setNewProfileName] = useState('')

  // Initialize batches and limits
  useEffect(() => {
    if (batches.length === 0) {
      initializeBatches(3)
    }
  }, [])

  // Load saved profiles from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('soilLimitsProfiles')
      if (saved) {
        setLimitsProfiles(JSON.parse(saved))
      }
    } catch (err) {
      console.error('Failed to load profiles:', err)
    }
  }, [])

  // Save profile
  const saveProfile = () => {
    if (!newProfileName.trim()) {
      alert('Please enter a profile name')
      return
    }

    const profile = {
      name: newProfileName.trim(),
      limits: { ...limits },
      createdAt: new Date().toISOString()
    }

    const updated = [...limitsProfiles.filter(p => p.name !== profile.name), profile]
    setLimitsProfiles(updated)
    localStorage.setItem('soilLimitsProfiles', JSON.stringify(updated))
    setNewProfileName('')
    alert(`Profile "${profile.name}" saved successfully!`)
  }

  // Load profile
  const loadProfile = (profileName) => {
    const profile = limitsProfiles.find(p => p.name === profileName)
    if (profile) {
      setLimits(profile.limits)
      alert(`Profile "${profileName}" loaded successfully!`)
    }
  }

  // Delete profile
  const deleteProfile = (profileName) => {
    if (confirm(`Delete profile "${profileName}"?`)) {
      const updated = limitsProfiles.filter(p => p.name !== profileName)
      setLimitsProfiles(updated)
      localStorage.setItem('soilLimitsProfiles', JSON.stringify(updated))
    }
  }

  // Export profile as CSV
  const exportProfileAsCSV = (profileName) => {
    const profile = limitsProfiles.find(p => p.name === profileName)
    if (!profile) return

    const params = Object.keys(profile.limits)
    const headers = ['Batch', ...params]
    const lowerRow = ['Lower Limit', ...params.map(p => profile.limits[p].lower)]
    const upperRow = ['Upper Limit', ...params.map(p => profile.limits[p].upper)]

    const csv = [headers, lowerRow, upperRow].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${profileName.replace(/[^a-z0-9]/gi, '_')}_limits.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

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

    // Initialize limits with defaults (including metadata)
    parameterNames.forEach(paramName => {
      const defaultParam = DEFAULT_PARAMETERS.find(p => p.name === paramName)
      if (defaultParam) {
        newLimits[paramName] = {
          lower: defaultParam.lower,
          upper: defaultParam.upper,
          unit: defaultParam.unit || '',
          type: defaultParam.type || 'other',
          blendingMethod: defaultParam.blendingMethod || 'linear',
          priority: defaultParam.priority || 1,
          description: defaultParam.description || ''
        }
      } else {
        // For unknown parameters, set wide limits with default metadata
        newLimits[paramName] = {
          lower: 0,
          upper: 9999,
          unit: '',
          type: 'other',
          blendingMethod: 'linear',
          priority: 1,
          description: 'Custom parameter'
        }
      }
    })

    let dataStartIndex = 1
    let hasCustomLimits = false

    // Check for optional "Lower Limit" row
    if (lines.length > 1) {
      const firstDataRow = lines[1].split(',').map(v => v.trim())
      const firstRowName = firstDataRow[batchNameIndex]?.toLowerCase()

      if (firstRowName === 'lower limit' || firstRowName === 'lower') {
        hasCustomLimits = true
        // Parse lower limits
        headers.forEach((header, idx) => {
          if (idx !== batchNameIndex) {
            const value = parseFloat(firstDataRow[idx])
            if (!isNaN(value)) {
              if (!newLimits[header]) newLimits[header] = { lower: 0, upper: 9999 }
              newLimits[header].lower = value
            }
          }
        })
        dataStartIndex = 2
      }
    }

    // Check for optional "Upper Limit" row
    if (hasCustomLimits && lines.length > 2) {
      const secondDataRow = lines[2].split(',').map(v => v.trim())
      const secondRowName = secondDataRow[batchNameIndex]?.toLowerCase()

      if (secondRowName === 'upper limit' || secondRowName === 'upper') {
        // Parse upper limits
        headers.forEach((header, idx) => {
          if (idx !== batchNameIndex) {
            const value = parseFloat(secondDataRow[idx])
            if (!isNaN(value)) {
              if (!newLimits[header]) newLimits[header] = { lower: 0, upper: 9999 }
              newLimits[header].upper = value
            }
          }
        })
        dataStartIndex = 3
      }
    }

    // Parse data rows
    for (let i = dataStartIndex; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      const batchName = values[batchNameIndex]

      // Skip if batch name looks like a limit row
      const nameLower = batchName?.toLowerCase()
      if (nameLower === 'lower limit' || nameLower === 'upper limit' ||
          nameLower === 'lower' || nameLower === 'upper') {
        continue
      }

      const batch = { name: batchName }

      headers.forEach((header, idx) => {
        if (idx !== batchNameIndex) {
          const value = parseFloat(values[idx])
          batch[header] = isNaN(value) ? 0 : value
        }
      })

      newBatches.push(batch)
    }

    if (newBatches.length === 0) {
      throw new Error('No batch data found. Make sure you have data rows after any limit rows.')
    }

    return { batches: newBatches, limits: newLimits, hasCustomLimits }
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
      const { batches: newBatches, limits: newLimits, hasCustomLimits } = parseCSV(text)

      setBatches(newBatches)
      setLimits(newLimits)
      setNumBatches(newBatches.length)

      const limitsMsg = hasCustomLimits ? ' with custom limits' : ''
      setUploadSuccess(`Successfully loaded ${newBatches.length} batches with ${Object.keys(newLimits).length} parameters${limitsMsg}`)

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

    // Initialize limits from default parameters with full metadata
    DEFAULT_PARAMETERS.forEach(param => {
      newLimits[param.name] = {
        lower: param.lower,
        upper: param.upper,
        unit: param.unit || '',
        type: param.type || 'other',
        blendingMethod: param.blendingMethod || 'linear',
        priority: param.priority || 1,
        description: param.description || ''
      }
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
Lower Limit,5.5,0,0,0
Upper Limit,8.5,37,200,5
Batch 1,7.2,11,29,1.2
Batch 2,9.0,22,77,2.8
Batch 3,7.1,16,36,1.5`}
            </pre>
            <p className="text-xs text-blue-700 mt-2">
              First column must be "Batch" or "Name". Optional "Lower Limit" and "Upper Limit" rows set custom screening limits. If omitted, default regulatory limits are used.
            </p>
          </div>
        </div>
      </div>

      {/* Limits Profile Manager */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200 overflow-hidden w-full max-w-full">
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900">Screening Limits & Parameters</h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Save/load different limit sets (e.g., S4UL, C4UL, BS3882) and configure parameter types
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowParamConfig(true)}
                className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-semibold px-4 sm:px-6 py-2 sm:py-3 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 text-sm whitespace-nowrap"
              >
                ⚙️ Configure Parameters
              </button>
              <button
                onClick={() => setShowProfileManager(!showProfileManager)}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold px-4 sm:px-6 py-2 sm:py-3 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 text-sm whitespace-nowrap"
              >
                {showProfileManager ? 'Hide' : 'Manage Profiles'}
              </button>
            </div>
          </div>

          {showProfileManager && (
            <div className="space-y-4">
              {/* Save New Profile */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-xl p-4">
                <h3 className="font-semibold text-emerald-900 mb-3">Save Current Limits as Profile</h3>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Profile name (e.g., S4UL, C4UL, Custom)"
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    className="flex-1 px-4 py-2 border-2 border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    onKeyPress={(e) => e.key === 'Enter' && saveProfile()}
                  />
                  <button
                    onClick={saveProfile}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors whitespace-nowrap"
                  >
                    Save Profile
                  </button>
                </div>
              </div>

              {/* Saved Profiles List */}
              {limitsProfiles.length > 0 ? (
                <div className="space-y-2">
                  <h3 className="font-semibold text-slate-900">Saved Profiles ({limitsProfiles.length})</h3>
                  {limitsProfiles.map(profile => (
                    <div key={profile.name} className="bg-slate-50 border-2 border-slate-200 rounded-lg p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-900">{profile.name}</h4>
                          <p className="text-xs text-slate-600 mt-1">
                            {Object.keys(profile.limits).length} parameters • Created {new Date(profile.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => loadProfile(profile.name)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
                          >
                            Load
                          </button>
                          <button
                            onClick={() => exportProfileAsCSV(profile.name)}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
                          >
                            Export CSV
                          </button>
                          <button
                            onClick={() => deleteProfile(profile.name)}
                            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-50 border-2 border-slate-200 rounded-lg p-6 text-center">
                  <p className="text-slate-600">No saved profiles yet. Adjust the screening limits in the manual entry section below, then save them as a profile.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Compliance Heatmap */}
      {batches.length > 0 && Object.keys(limits).length > 0 && (
        <ComplianceHeatmap batches={batches} limits={limits} />
      )}

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

      {/* Parameter Configuration Modal */}
      {showParamConfig && (
        <ParameterConfigModal
          limits={limits}
          setLimits={setLimits}
          onClose={() => setShowParamConfig(false)}
        />
      )}
    </div>
  )
}

export default InputSection
