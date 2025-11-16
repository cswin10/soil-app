import jsPDF from 'jspdf'
import 'jspdf-autotable'

/**
 * Generate professional PDF report matching Declaration of Compliance format
 * for UK soil treatment facilities (BS3882/C4UL/S4UL standards)
 */
export function generateCompliancePDF(batches, limits, results, tolerance, batchTonnages = {}) {
  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  let yPos = 20

  // ==================== TITLE PAGE ====================
  // Header with border
  doc.setDrawColor(30, 64, 175)
  doc.setLineWidth(1.5)
  doc.rect(10, 10, pageWidth - 20, 40)

  // Title
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(30, 64, 175)
  doc.text('DECLARATION OF COMPLIANCE', pageWidth / 2, 25, { align: 'center' })

  doc.setFontSize(16)
  doc.setTextColor(71, 85, 105)
  doc.text('Soil Blending Optimisation Report', pageWidth / 2, 35, { align: 'center' })

  doc.setFontSize(10)
  doc.setTextColor(100, 116, 139)
  doc.text('BS3882:2015 Specification for topsoil', pageWidth / 2, 42, { align: 'center' })

  yPos = 60

  // Report Details
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(0, 0, 0)

  const reportDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })

  doc.text(`Report Date: ${reportDate}`, 15, yPos)
  yPos += 7
  doc.text(`Number of Batches: ${batches.length}`, 15, yPos)
  yPos += 7
  doc.text(`Parameters Analysed: ${Object.keys(limits).filter(p => limits[p].upper !== 9999).length}`, 15, yPos)
  yPos += 7
  doc.text(`Optimisation Tolerance: ${(tolerance * 100).toFixed(0)}%`, 15, yPos)
  yPos += 15

  // ==================== STATEMENT OF CONFORMITY ====================
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(30, 64, 175)
  doc.text('STATEMENT OF CONFORMITY', 15, yPos)
  yPos += 10

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)

  const complianceStatus = results.success && results.within_limits
    ? '✓ COMPLIANT - All parameters within regulatory limits'
    : '✗ NON-COMPLIANT - See analysis below'

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  if (results.success && results.within_limits) {
    doc.setTextColor(16, 185, 129)  // Green
  } else {
    doc.setTextColor(239, 68, 68)   // Red
  }
  doc.text(complianceStatus, 15, yPos)
  yPos += 10

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)

  const complianceText = results.success && results.within_limits
    ? `This blended soil material has been assessed against the relevant UK standards (BS3882:2015, C4UL, S4UL) and meets all regulatory screening limits for the analysed parameters. The optimisation algorithm has determined mixing ratios that ensure compliance while minimising contaminant levels.`
    : `This blended soil material does not currently meet all regulatory screening limits. See detailed analysis and recommendations below. Additional treatment or source material may be required.`

  const splitText = doc.splitTextToSize(complianceText, pageWidth - 30)
  doc.text(splitText, 15, yPos)
  yPos += splitText.length * 5 + 10

  // ==================== MIXING RATIOS ====================
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(30, 64, 175)
  doc.text('OPTIMISED MIXING RATIOS', 15, yPos)
  yPos += 10

  const ratioTableData = batches.map((batch, index) => {
    const ratio = results.ratios[index]
    const hasTonnage = batchTonnages[index] !== undefined
    const tonnageUsed = hasTonnage ? (ratio * batchTonnages[index]).toFixed(2) : 'N/A'
    const tonnageAvailable = hasTonnage ? batchTonnages[index].toFixed(1) : 'N/A'

    return [
      batch.name,
      `${(ratio * 100).toFixed(2)}%`,
      tonnageAvailable,
      tonnageUsed,
    ]
  })

  doc.autoTable({
    startY: yPos,
    head: [['Batch', 'Ratio (%)', 'Available (tonnes)', 'To Use (tonnes)']],
    body: ratioTableData,
    theme: 'grid',
    headStyles: { fillColor: [30, 64, 175], textColor: 255, fontSize: 10, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { halign: 'center', fontStyle: 'bold' },
      2: { halign: 'center' },
      3: { halign: 'center', fontStyle: 'bold' },
    }
  })

  yPos = doc.lastAutoTable.finalY + 15

  // ==================== NEW PAGE: ANALYSIS RESULTS ====================
  doc.addPage()
  yPos = 20

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(30, 64, 175)
  doc.text('PARAMETER ANALYSIS & COMPLIANCE', 15, yPos)
  yPos += 10

  // Build parameter table data
  const paramTableData = []
  Object.keys(limits).forEach(param => {
    if (limits[param].upper === 9999) return

    const blended = results.blended_values[param] || 0
    const lower = limits[param].lower
    const upper = limits[param].upper
    const target = lower === 0 ? 0 : (lower + upper) / 2

    let status = 'Unknown'
    let statusColor = [100, 116, 139]

    if (blended < lower) {
      status = 'Below Limit'
      statusColor = [239, 68, 68]
    } else if (blended > upper) {
      status = 'EXCEEDS'
      statusColor = [239, 68, 68]
    } else {
      const range = upper - lower
      const toleranceRange = range * (1 - tolerance) / 2
      if (Math.abs(blended - target) <= toleranceRange) {
        status = 'Within Tolerance'
        statusColor = [16, 185, 129]
      } else {
        status = 'Within Limits'
        statusColor = [234, 179, 8]
      }
    }

    paramTableData.push({
      param,
      blended: blended.toFixed(2),
      limits: `${lower} - ${upper}`,
      target: target.toFixed(2),
      status,
      statusColor
    })
  })

  // Split into chunks of 25 for pagination
  const chunkSize = 25
  for (let i = 0; i < paramTableData.length; i += chunkSize) {
    if (i > 0) {
      doc.addPage()
      yPos = 20
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.setTextColor(30, 64, 175)
      doc.text('PARAMETER ANALYSIS (continued)', 15, yPos)
      yPos += 10
    }

    const chunk = paramTableData.slice(i, i + chunkSize)

    doc.autoTable({
      startY: yPos,
      head: [['Parameter', 'Blended Value', 'Limits', 'Target', 'Status']],
      body: chunk.map(row => [row.param, row.blended, row.limits, row.target, row.status]),
      theme: 'striped',
      headStyles: { fillColor: [30, 64, 175], textColor: 255, fontSize: 9, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 45 },
        1: { halign: 'center', cellWidth: 25 },
        2: { halign: 'center', cellWidth: 30 },
        3: { halign: 'center', cellWidth: 20 },
        4: { halign: 'center', fontStyle: 'bold', cellWidth: 35 },
      },
      didParseCell: function(data) {
        if (data.column.index === 4 && data.row.index >= 0) {
          const rowData = chunk[data.row.index]
          data.cell.styles.textColor = rowData.statusColor
        }
      }
    })

    yPos = doc.lastAutoTable.finalY + 10
  }

  // ==================== CONCLUSIONS & RECOMMENDATIONS ====================
  doc.addPage()
  yPos = 20

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(30, 64, 175)
  doc.text('CONCLUSIONS & RECOMMENDATIONS', 15, yPos)
  yPos += 10

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)

  const conclusions = []

  if (results.success && results.within_limits) {
    conclusions.push('✓ The optimised blend meets all regulatory screening limits.')
    conclusions.push('✓ Blending ratios have been calculated to minimise contaminant levels.')
    conclusions.push('✓ Material is suitable for its intended use subject to UKAS lab certification.')
  } else {
    conclusions.push('✗ The blend does not meet all regulatory screening limits.')
    conclusions.push('• Review failed parameters and consider alternative source materials.')
    conclusions.push('• Consult with environmental specialist before proceeding.')
  }

  if (results.missing_data_params && results.missing_data_params.length > 0) {
    conclusions.push(`⚠ WARNING: ${results.missing_data_params.length} parameters have missing data and were excluded.`)
    conclusions.push(`  Missing: ${results.missing_data_params.join(', ')}`)
    conclusions.push('  Obtain complete lab analysis before final approval.')
  }

  conclusions.push('')
  conclusions.push('All analytical testing must be performed by a UKAS-accredited laboratory.')
  conclusions.push('This report is for blending optimisation purposes only and does not constitute')
  conclusions.push('regulatory approval. Final compliance certification required from competent authority.')

  conclusions.forEach(line => {
    doc.text(line, 15, yPos)
    yPos += 6
  })

  // ==================== FOOTER ON ALL PAGES ====================
  const totalPages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(100, 116, 139)
    doc.text(
      `Soil Mixing Optimiser v2.0 | Page ${i} of ${totalPages} | Generated ${reportDate}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    )
  }

  // Save the PDF
  const filename = `Soil_Compliance_Report_${new Date().toISOString().slice(0, 10)}.pdf`
  doc.save(filename)
}
