import { useState, useEffect } from 'react'

const PARAMETER_TYPES = [
  { value: 'contaminant', label: 'Contaminant', color: 'red', description: 'Heavy metals, toxins (minimize)' },
  { value: 'nutrient', label: 'Nutrient', color: 'green', description: 'N, P, K, organic matter (optimize)' },
  { value: 'physical', label: 'Physical', color: 'blue', description: 'pH, moisture, texture' },
  { value: 'other', label: 'Other', color: 'gray', description: 'Custom parameters' }
]

const BLENDING_METHODS = [
  { value: 'linear', label: 'Linear (weighted average)', description: 'Standard blending calculation' },
  { value: 'manual', label: 'Non-linear (manual check)', description: 'Requires lab verification (e.g., pH)' }
]

function ParameterConfigModal({ limits, setLimits, onClose }) {
  const [editingParam, setEditingParam] = useState(null)
  const [formData, setFormData] = useState({})

  const openEditor = (paramName) => {
    const param = limits[paramName]
    setFormData({
      name: paramName,
      lower: param.lower,
      upper: param.upper,
      unit: param.unit || '',
      type: param.type || 'other',
      blendingMethod: param.blendingMethod || 'linear',
      priority: param.priority || 1,
      description: param.description || ''
    })
    setEditingParam(paramName)
  }

  const saveParameter = () => {
    if (!editingParam) return

    setLimits(prev => ({
      ...prev,
      [editingParam]: {
        lower: parseFloat(formData.lower) || 0,
        upper: parseFloat(formData.upper) || 9999,
        unit: formData.unit || '',
        type: formData.type || 'other',
        blendingMethod: formData.blendingMethod || 'linear',
        priority: parseInt(formData.priority) || 1,
        description: formData.description || ''
      }
    }))

    setEditingParam(null)
    setFormData({})
  }

  const getTypeColor = (type) => {
    const typeObj = PARAMETER_TYPES.find(t => t.value === type)
    return typeObj?.color || 'gray'
  }

  const getTypeLabel = (type) => {
    const typeObj = PARAMETER_TYPES.find(t => t.value === type)
    return typeObj?.label || 'Other'
  }

  const parameters = Object.keys(limits).filter(p => limits[p].upper !== 9999)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Parameter Configuration</h2>
              <p className="text-indigo-100 text-sm mt-1">
                Define types, units, and blending methods for each parameter
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Editor Form */}
          {editingParam && (
            <div className="mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-indigo-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-indigo-900 mb-4">
                Editing: {editingParam}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Lower Limit */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lower Limit
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.lower}
                    onChange={(e) => setFormData(prev => ({ ...prev, lower: e.target.value }))}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                {/* Upper Limit */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Upper Limit
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.upper}
                    onChange={(e) => setFormData(prev => ({ ...prev, upper: e.target.value }))}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                {/* Unit */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., mg/kg, %, pH"
                    value={formData.unit}
                    onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parameter Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {PARAMETER_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label} - {type.description}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Blending Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Blending Method
                  </label>
                  <select
                    value={formData.blendingMethod}
                    onChange={(e) => setFormData(prev => ({ ...prev, blendingMethod: e.target.value }))}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {BLENDING_METHODS.map(method => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                  {formData.blendingMethod === 'manual' && (
                    <p className="text-xs text-orange-600 mt-1">
                      ⚠️ Requires lab verification after blending
                    </p>
                  )}
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority Weight (1-10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Higher = more important to optimize</p>
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Brief description of this parameter"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={saveParameter}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setEditingParam(null)
                    setFormData({})
                  }}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Parameter List */}
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-gray-900 mb-3">All Parameters</h3>
            {parameters.map(paramName => {
              const param = limits[paramName]
              const typeColor = getTypeColor(param.type)
              const typeLabel = getTypeLabel(param.type)

              return (
                <div
                  key={paramName}
                  className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-bold text-gray-900">{paramName}</h4>
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-${typeColor}-100 text-${typeColor}-800`}>
                          {typeLabel}
                        </span>
                        {param.blendingMethod === 'manual' && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                            Non-linear
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">Range:</span>
                          <span className="ml-1 font-semibold text-gray-900">
                            {param.lower} - {param.upper}
                          </span>
                        </div>
                        {param.unit && (
                          <div>
                            <span className="text-gray-500">Unit:</span>
                            <span className="ml-1 font-semibold text-gray-900">{param.unit}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-500">Priority:</span>
                          <span className="ml-1 font-semibold text-gray-900">{param.priority || 1}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Method:</span>
                          <span className="ml-1 font-semibold text-gray-900">
                            {param.blendingMethod === 'linear' ? 'Linear' : 'Manual'}
                          </span>
                        </div>
                      </div>

                      {param.description && (
                        <p className="text-xs text-gray-600 mt-2">{param.description}</p>
                      )}
                    </div>

                    <button
                      onClick={() => openEditor(paramName)}
                      className="ml-4 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {parameters.length} parameters configured
            </div>
            <button
              onClick={onClose}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ParameterConfigModal
