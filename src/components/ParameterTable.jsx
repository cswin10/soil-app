function ParameterTable({ limits, setLimits }) {
  const handleLimitUpdate = (param, field, value) => {
    const newLimits = { ...limits }
    newLimits[param][field] = parseFloat(value) || 0
    setLimits(newLimits)
  }

  const handleDeleteParameter = (param) => {
    const newLimits = { ...limits }
    delete newLimits[param]
    setLimits(newLimits)
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Parameter Limits
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        Set upper limit to 9999 to ignore a parameter during optimization.
      </p>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Parameter
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Lower Limit
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Upper Limit
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Midpoint
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Range
              </th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Object.keys(limits).map(param => {
              const lower = limits[param].lower
              const upper = limits[param].upper
              const midpoint = upper === 9999 ? 'N/A' : ((upper + lower) / 2).toFixed(2)
              const range = upper === 9999 ? 'Ignored' : (upper - lower).toFixed(2)

              return (
                <tr key={param} className={upper === 9999 ? 'bg-gray-50' : ''}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {param}
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      step="0.01"
                      value={lower}
                      onChange={(e) => handleLimitUpdate(param, 'lower', e.target.value)}
                      className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      step="0.01"
                      value={upper}
                      onChange={(e) => handleLimitUpdate(param, 'upper', e.target.value)}
                      className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {midpoint}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {range}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDeleteParameter(param)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ParameterTable
