import { useEffect, useRef } from 'react'

/**
 * Soil Texture Triangle Component
 * Displays a ternary plot showing Clay, Silt, and Sand percentages
 * with BS3882 acceptable zone highlighted
 */
function SoilTextureTriangle({ results, batches }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current || !results) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Triangle dimensions (equilateral triangle)
    const triangleHeight = height * 0.8
    const triangleWidth = triangleHeight * 1.1547  // sqrt(4/3) for equilateral
    const offsetX = (width - triangleWidth) / 2
    const offsetY = height * 0.1

    // Triangle vertices (top, bottom-left, bottom-right)
    const top = { x: offsetX + triangleWidth / 2, y: offsetY }
    const bottomLeft = { x: offsetX, y: offsetY + triangleHeight }
    const bottomRight = { x: offsetX + triangleWidth, y: offsetY + triangleHeight }

    // Helper function to convert ternary coordinates to Cartesian
    // clay, silt, sand are percentages (0-100)
    function ternaryToCartesian(clay, silt, sand) {
      // Normalise to 0-1
      const total = clay + silt + sand
      const c = clay / total
      const si = silt / total
      const sa = sand / total

      // Ternary to Cartesian conversion
      // Clay is at top, Sand at bottom-right, Silt at bottom-left
      const x = bottomLeft.x + (sa * (bottomRight.x - bottomLeft.x)) + (c * (top.x - bottomLeft.x) / 2)
      const y = bottomLeft.y - (c * triangleHeight) + (sa * 0)

      return { x, y }
    }

    // Draw triangle outline
    ctx.strokeStyle = '#1e293b'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(top.x, top.y)
    ctx.lineTo(bottomLeft.x, bottomLeft.y)
    ctx.lineTo(bottomRight.x, bottomRight.y)
    ctx.closePath()
    ctx.stroke()

    // Draw BS3882 acceptable zone (simplified - approximately Sandy Loam to Clay Loam region)
    // BS3882: Clay 8-35%, Sand 20-70%, Silt 10-50%
    // This creates a polygon within the triangle
    ctx.fillStyle = 'rgba(59, 130, 246, 0.15)'  // Light blue fill
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])

    ctx.beginPath()
    // Define BS3882 zone vertices (approximate)
    const zonePoints = [
      { clay: 8, silt: 50, sand: 42 },   // Low clay, high silt
      { clay: 8, silt: 22, sand: 70 },   // Low clay, high sand
      { clay: 35, silt: 10, sand: 55 },  // High clay, low silt, high sand
      { clay: 35, silt: 45, sand: 20 },  // High clay, high silt, low sand
    ]

    zonePoints.forEach((point, idx) => {
      const { x, y } = ternaryToCartesian(point.clay, point.silt, point.sand)
      if (idx === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    ctx.setLineDash([])  // Reset dash

    // Draw grid lines (optional, for reference)
    ctx.strokeStyle = '#cbd5e1'
    ctx.lineWidth = 1
    for (let i = 10; i <= 90; i += 10) {
      // Horizontal lines (constant clay)
      const p1 = ternaryToCartesian(i, 100 - i, 0)
      const p2 = ternaryToCartesian(i, 0, 100 - i)
      ctx.beginPath()
      ctx.moveTo(p1.x, p1.y)
      ctx.lineTo(p2.x, p2.y)
      ctx.stroke()
    }

    // Labels for vertices
    ctx.fillStyle = '#1e293b'
    ctx.font = 'bold 16px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Clay', top.x, top.y - 10)
    ctx.textAlign = 'left'
    ctx.fillText('Silt', bottomLeft.x - 45, bottomLeft.y + 5)
    ctx.textAlign = 'right'
    ctx.fillText('Sand', bottomRight.x + 45, bottomRight.y + 5)

    // Calculate blended texture
    const clayBlended = results.blended_values?.Clay || 0
    const siltBlended = results.blended_values?.Silt || 0
    const sandBlended = results.blended_values?.Sand || 0

    if (clayBlended + siltBlended + sandBlended > 0) {
      const point = ternaryToCartesian(clayBlended, siltBlended, sandBlended)

      // Check if point is within BS3882 zone (simplified check)
      const inZone = clayBlended >= 8 && clayBlended <= 35 &&
                     sandBlended >= 20 && sandBlended <= 70 &&
                     siltBlended >= 10 && siltBlended <= 50

      // Draw blended texture point
      ctx.fillStyle = inZone ? '#10b981' : '#ef4444'  // Green if compliant, red if not
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(point.x, point.y, 8, 0, 2 * Math.PI)
      ctx.fill()
      ctx.stroke()

      // Draw label for blended point
      ctx.fillStyle = '#1e293b'
      ctx.font = 'bold 12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Blended', point.x, point.y - 15)
      ctx.font = '11px sans-serif'
      ctx.fillText(
        `Clay: ${clayBlended.toFixed(1)}%`,
        point.x,
        point.y + 25
      )
      ctx.fillText(
        `Silt: ${siltBlended.toFixed(1)}%`,
        point.x,
        point.y + 38
      )
      ctx.fillText(
        `Sand: ${sandBlended.toFixed(1)}%`,
        point.x,
        point.y + 51
      )

      // Compliance indicator
      ctx.font = 'bold 13px sans-serif'
      ctx.fillStyle = inZone ? '#10b981' : '#ef4444'
      ctx.fillText(
        inZone ? '✓ Within BS3882 Zone' : '✗ Outside BS3882 Zone',
        point.x,
        point.y - 30
      )
    }

    // Legend
    ctx.fillStyle = '#1e293b'
    ctx.font = 'bold 14px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('BS3882 Acceptable Zone', offsetX + 10, offsetY + triangleHeight + 30)
    ctx.fillStyle = 'rgba(59, 130, 246, 0.4)'
    ctx.fillRect(offsetX + 10, offsetY + triangleHeight + 35, 20, 12)
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)'
    ctx.lineWidth = 2
    ctx.strokeRect(offsetX + 10, offsetY + triangleHeight + 35, 20, 12)

  }, [results, batches])

  // Check if we have texture parameters
  const hasTextureParams = results?.blended_values?.Clay !== undefined &&
                           results?.blended_values?.Silt !== undefined &&
                           results?.blended_values?.Sand !== undefined

  if (!hasTextureParams) {
    return null  // Don't render if texture parameters aren't available
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 md:p-6 w-full max-w-full overflow-hidden">
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        Soil Texture Triangle (BS3882 Compliance)
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        Ternary diagram showing particle size distribution. Blue zone indicates BS3882 acceptable range.
      </p>
      <div className="flex justify-center">
        <canvas
          ref={canvasRef}
          width={600}
          height={550}
          className="max-w-full h-auto"
        />
      </div>
      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900">
        <strong>BS3882 Requirements:</strong> Clay 8-35%, Sand 20-70%, Silt 10-50%
      </div>
    </div>
  )
}

export default SoilTextureTriangle
