import { useState } from 'react'
import Papa from 'papaparse'

function InputSection({ batches, setBatches, limits, setLimits }) {
  const [csvText, setCsvText] = useState('')
  const [activeTab, setActiveTab] = useState('csv')

  const handleCSVUpload = (event) => {
    const file = event.target.files[0]
    if (!file) return

    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        processCSVData(results.data)
      },
      error: (error) => {
        alert('Error parsing CSV: ' + error.message)
      }
    })
  }

  const handleCSVPaste = () => {
    if (!csvText.trim()) {
      alert('Please paste CSV data first')
      return
    }

    Papa.parse(csvText, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        processCSVData(results.data)
      },
      error: (error) => {
        alert('Error parsing CSV: ' + error.message)
      }
    })
  }

  const processCSVData = (data) => {
    try {
      // Find row 12 (mixing proportions) - index 11
      // Row 13 (headers) - index 12
      // Rows 14+ (parameters) - index 13+

      if (data.length < 14) {
        alert('CSV data appears incomplete. Expected at least 14 rows.')
        return
      }

      // Get headers from row 13 (index 12)
      const headerRow = data[12]
      const batchNames = headerRow.slice(2).filter(name => name && name.trim())

      // Initialize batches
      const newBatches = batchNames.map(name => ({ name: name.trim() }))

      // Initialize limits
      const newLimits = {}

      // Process parameter rows (starting from row 14, index 13)
      for (let i = 13; i < data.length; i++) {
        const row = data[i]
        if (!row || row.length < 3) continue

        const paramName = row[0]
        if (!paramName || !paramName.trim()) continue

        const lower = parseFloat(row[1])
        const upper = parseFloat(row[2])

        if (isNaN(lower) || isNaN(upper)) continue

        // Store limits
        newLimits[paramName] = { lower, upper }

        // Store values for each batch
        for (let j = 0; j < batchNames.length; j++) {
          const value = parseFloat(row[3 + j])
          if (!isNaN(value)) {
            newBatches[j][paramName] = value
          }
        }
      }

      setBatches(newBatches)
      setLimits(newLimits)
      alert(`Successfully loaded ${newBatches.length} batches with ${Object.keys(newLimits).length} parameters`)
    } catch (error) {
      alert('Error processing CSV: ' + error.message)
    }
  }

  const loadSampleData = () => {
    const sampleBatches = [
      {
        name: 'Batch 1',
        pH: 7.2,
        Arsenic: 11,
        Lead: 29,
        Zinc: 123,
        Chromium: 45,
        Copper: 78,
        Nickel: 34
      },
      {
        name: 'Batch 2',
        pH: 9.0,
        Arsenic: 22,
        Lead: 77,
        Zinc: 125,
        Chromium: 55,
        Copper: 92,
        Nickel: 41
      },
      {
        name: 'Batch 3',
        pH: 7.1,
        Arsenic: 16,
        Lead: 36,
        Zinc: 121,
        Chromium: 38,
        Copper: 65,
        Nickel: 29
      }
    ]

    const sampleLimits = {
      pH: { lower: 5.5, upper: 8.5 },
      Arsenic: { lower: 0, upper: 37 },
      Lead: { lower: 0, upper: 200 },
      Zinc: { lower: 0, upper: 200 },
      Chromium: { lower: 0, upper: 100 },
      Copper: { lower: 0, upper: 150 },
      Nickel: { lower: 0, upper: 50 }
    }

    setBatches(sampleBatches)
    setLimits(sampleLimits)
  }

  const handleManualAdd = () => {
    const batchNumber = batches.length + 1
    const newBatch = { name: `Batch ${batchNumber}` }

    // Add all existing parameters with default value 0
    Object.keys(limits).forEach(param => {
      newBatch[param] = 0
    })

    setBatches([...batches, newBatch])
  }

  const handleBatchUpdate = (index, field, value) => {
    const newBatches = [...batches]
    if (field === 'name') {
      newBatches[index][field] = value
    } else {
      newBatches[index][field] = parseFloat(value) || 0
    }
    setBatches(newBatches)
  }

  const handleDeleteBatch = (index) => {
    setBatches(batches.filter((_, i) => i !== index))
  }

  const handleAddParameter = () => {
    const paramName = prompt('Enter parameter name:')
    if (!paramName || !paramName.trim()) return

    const lower = parseFloat(prompt('Enter lower limit:', '0'))
    const upper = parseFloat(prompt('Enter upper limit:', '100'))

    if (isNaN(lower) || isNaN(upper)) {
      alert('Invalid limits entered')
      return
    }

    // Add parameter to limits
    setLimits({ ...limits, [paramName]: { lower, upper } })

    // Add parameter to all batches with default value 0
    const newBatches = batches.map(batch => ({
      ...batch,
      [paramName]: 0
    }))
    setBatches(newBatches)
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Input Data</h2>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-4">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('csv')}
            className={`${
              activeTab === 'csv'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Upload/Paste CSV
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`${
              activeTab === 'manual'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Manual Entry
          </button>
        </nav>
      </div>

      {/* CSV Tab */}
      {activeTab === 'csv' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload CSV File
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-green-50 file:text-green-700
                hover:file:bg-green-100"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">OR</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paste CSV Data
            </label>
            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="Paste your CSV data here..."
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 font-mono text-sm"
            />
            <button
              onClick={handleCSVPaste}
              className="mt-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md"
            >
              Process CSV
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">OR</span>
            </div>
          </div>

          <button
            onClick={loadSampleData}
            className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-2 px-4 rounded-md border border-blue-200"
          >
            Load Sample Data
          </button>
        </div>
      )}

      {/* Manual Entry Tab */}
      {activeTab === 'manual' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              onClick={handleManualAdd}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md"
            >
              + Add Batch
            </button>
            <button
              onClick={handleAddParameter}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
            >
              + Add Parameter
            </button>
          </div>

          {batches.length === 0 ? (
            <p className="text-gray-500 text-sm">No batches added yet. Click "Add Batch" to start.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Batch Name
                    </th>
                    {Object.keys(limits).map(param => (
                      <th key={param} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        {param}
                      </th>
                    ))}
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {batches.map((batch, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={batch.name}
                          onChange={(e) => handleBatchUpdate(index, 'name', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </td>
                      {Object.keys(limits).map(param => (
                        <td key={param} className="px-4 py-2">
                          <input
                            type="number"
                            step="0.01"
                            value={batch[param] || 0}
                            onChange={(e) => handleBatchUpdate(index, param, e.target.value)}
                            className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </td>
                      ))}
                      <td className="px-4 py-2">
                        <button
                          onClick={() => handleDeleteBatch(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default InputSection
