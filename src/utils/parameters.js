/**
 * Comprehensive soil parameter database for UK standards (BS3882, C4UL, S4UL)
 * All limits based on industry standards for soil treatment and remediation
 */

// Parameter categories for UI grouping
export const PARAMETER_CATEGORIES = {
  PHYSICAL: 'Physical & Chemical Properties',
  NUTRIENTS: 'Nutrients & Fertility',
  HEAVY_METALS: 'Heavy Metals',
  PAHS: 'PAHs (Polycyclic Aromatic Hydrocarbons)',
  TPH_ALIPHATIC: 'TPH - Aliphatic Fractions',
  TPH_AROMATIC: 'TPH - Aromatic Fractions',
  BTEX: 'BTEX & Volatiles',
  OTHER: 'Other Contaminants'
}

/**
 * Complete parameter database
 * Each parameter has:
 * - name: Display name
 * - category: Which category it belongs to
 * - lower: Lower limit (0 for contaminants)
 * - upper: Upper limit (BS3882/C4UL/S4UL standards)
 * - unit: Measurement unit
 * - phDependent: Whether limits change based on pH (for Zn, Cu, Ni)
 */
export const ALL_PARAMETERS = [
  // ==================== PHYSICAL & CHEMICAL PROPERTIES ====================
  {
    name: 'pH',
    category: PARAMETER_CATEGORIES.PHYSICAL,
    lower: 5.5,
    upper: 8.5,
    unit: '',
    description: 'Soil acidity/alkalinity (BS3882: 5.5-8.5)'
  },
  {
    name: 'SOM',
    category: PARAMETER_CATEGORIES.PHYSICAL,
    lower: 3,
    upper: 10,
    unit: '%',
    description: 'Soil Organic Matter content (BS3882: 3-10%)'
  },
  {
    name: 'Moisture',
    category: PARAMETER_CATEGORIES.PHYSICAL,
    lower: 10,
    upper: 30,
    unit: '%',
    description: 'Moisture content'
  },
  {
    name: 'Carbonate',
    category: PARAMETER_CATEGORIES.PHYSICAL,
    lower: 0,
    upper: 10,
    unit: '%',
    description: 'Carbonate content (CaCO3 equivalent)'
  },
  {
    name: 'Conductivity',
    category: PARAMETER_CATEGORIES.PHYSICAL,
    lower: 0,
    upper: 2000,
    unit: 'μS/cm',
    description: 'Electrical conductivity (salinity indicator, BS3882: <2000 μS/cm)'
  },
  {
    name: 'Sand',
    category: PARAMETER_CATEGORIES.PHYSICAL,
    lower: 20,
    upper: 70,
    unit: '%',
    description: 'Sand particle fraction (BS3882 texture requirements)'
  },
  {
    name: 'Silt',
    category: PARAMETER_CATEGORIES.PHYSICAL,
    lower: 10,
    upper: 50,
    unit: '%',
    description: 'Silt particle fraction (BS3882 texture requirements)'
  },
  {
    name: 'Clay',
    category: PARAMETER_CATEGORIES.PHYSICAL,
    lower: 8,
    upper: 35,
    unit: '%',
    description: 'Clay particle fraction (BS3882: 8-35%)'
  },
  {
    name: 'Stones',
    category: PARAMETER_CATEGORIES.PHYSICAL,
    lower: 0,
    upper: 10,
    unit: '%',
    description: 'Stone content >2mm (BS3882: max 10%)'
  },

  // ==================== NUTRIENTS & FERTILITY ====================
  {
    name: 'Nitrogen',
    category: PARAMETER_CATEGORIES.NUTRIENTS,
    lower: 0,
    upper: 5000,
    unit: 'mg/kg',
    description: 'Total Nitrogen (fertility indicator, ~0.1-0.5% = 1000-5000 mg/kg typical)'
  },
  {
    name: 'Phosphorus',
    category: PARAMETER_CATEGORIES.NUTRIENTS,
    lower: 0,
    upper: 200,
    unit: 'mg/kg',
    description: 'Available Phosphorus (P2O5 equivalent)'
  },
  {
    name: 'Potassium',
    category: PARAMETER_CATEGORIES.NUTRIENTS,
    lower: 0,
    upper: 500,
    unit: 'mg/kg',
    description: 'Available Potassium (K2O equivalent)'
  },
  {
    name: 'C:N Ratio',
    category: PARAMETER_CATEGORIES.NUTRIENTS,
    lower: 10,
    upper: 30,
    unit: '',
    description: 'Carbon to Nitrogen ratio (decomposition indicator)'
  },

  // ==================== HEAVY METALS ====================
  // pH-dependent metals (Zn, Cu, Ni) - limits shown are for pH 6.0-7.0
  {
    name: 'Zinc',
    category: PARAMETER_CATEGORIES.HEAVY_METALS,
    lower: 0,
    upper: 200, // pH dependent: <6.0=200, 6.0-7.0=200, >7.0=300
    unit: 'mg/kg',
    phDependent: true,
    description: 'BS3882: pH dependent (200-300 mg/kg)'
  },
  {
    name: 'Copper',
    category: PARAMETER_CATEGORIES.HEAVY_METALS,
    lower: 0,
    upper: 135, // pH dependent: <6.0=100, 6.0-7.0=135, >7.0=200
    unit: 'mg/kg',
    phDependent: true,
    description: 'BS3882: pH dependent (100-200 mg/kg)'
  },
  {
    name: 'Nickel',
    category: PARAMETER_CATEGORIES.HEAVY_METALS,
    lower: 0,
    upper: 75, // pH dependent: <6.0=60, 6.0-7.0=75, >7.0=110
    unit: 'mg/kg',
    phDependent: true,
    description: 'BS3882: pH dependent (60-110 mg/kg)'
  },

  // Non-pH dependent metals
  {
    name: 'Arsenic',
    category: PARAMETER_CATEGORIES.HEAVY_METALS,
    lower: 0,
    upper: 37,
    unit: 'mg/kg',
    description: 'BS3882/C4UL: 37 mg/kg (residential)'
  },
  {
    name: 'Cadmium',
    category: PARAMETER_CATEGORIES.HEAVY_METALS,
    lower: 0,
    upper: 5,
    unit: 'mg/kg',
    description: 'BS3882: 5 mg/kg maximum'
  },
  {
    name: 'Chromium',
    category: PARAMETER_CATEGORIES.HEAVY_METALS,
    lower: 0,
    upper: 100,
    unit: 'mg/kg',
    description: 'Total Chromium (BS3882: 100 mg/kg)'
  },
  {
    name: 'Chromium VI',
    category: PARAMETER_CATEGORIES.HEAVY_METALS,
    lower: 0,
    upper: 2,
    unit: 'mg/kg',
    description: 'Hexavalent Chromium (highly toxic, C4UL: 2 mg/kg)'
  },
  {
    name: 'Lead',
    category: PARAMETER_CATEGORIES.HEAVY_METALS,
    lower: 0,
    upper: 200,
    unit: 'mg/kg',
    description: 'BS3882: 200 mg/kg maximum'
  },
  {
    name: 'Mercury',
    category: PARAMETER_CATEGORIES.HEAVY_METALS,
    lower: 0,
    upper: 2,
    unit: 'mg/kg',
    description: 'BS3882: 2 mg/kg maximum'
  },
  {
    name: 'Selenium',
    category: PARAMETER_CATEGORIES.HEAVY_METALS,
    lower: 0,
    upper: 10,
    unit: 'mg/kg',
    description: 'C4UL: 10 mg/kg (residential)'
  },
  {
    name: 'Antimony',
    category: PARAMETER_CATEGORIES.HEAVY_METALS,
    lower: 0,
    upper: 15,
    unit: 'mg/kg',
    description: 'C4UL: 15 mg/kg (residential)'
  },
  {
    name: 'Boron',
    category: PARAMETER_CATEGORIES.HEAVY_METALS,
    lower: 0,
    upper: 40,
    unit: 'mg/kg',
    description: 'BS3882: 40 mg/kg (phytotoxic at high levels)'
  },
  {
    name: 'Molybdenum',
    category: PARAMETER_CATEGORIES.HEAVY_METALS,
    lower: 0,
    upper: 10,
    unit: 'mg/kg',
    description: 'C4UL: 10 mg/kg'
  },

  // ==================== PAHs (16 EPA Priority Pollutants) ====================
  {
    name: 'Naphthalene',
    category: PARAMETER_CATEGORIES.PAHS,
    lower: 0,
    upper: 5,
    unit: 'mg/kg',
    description: '2-ring PAH (C4UL: 5 mg/kg)'
  },
  {
    name: 'Acenaphthylene',
    category: PARAMETER_CATEGORIES.PAHS,
    lower: 0,
    upper: 100,
    unit: 'mg/kg',
    description: '3-ring PAH'
  },
  {
    name: 'Acenaphthene',
    category: PARAMETER_CATEGORIES.PAHS,
    lower: 0,
    upper: 100,
    unit: 'mg/kg',
    description: '3-ring PAH'
  },
  {
    name: 'Fluorene',
    category: PARAMETER_CATEGORIES.PAHS,
    lower: 0,
    upper: 100,
    unit: 'mg/kg',
    description: '3-ring PAH'
  },
  {
    name: 'Phenanthrene',
    category: PARAMETER_CATEGORIES.PAHS,
    lower: 0,
    upper: 50,
    unit: 'mg/kg',
    description: '3-ring PAH'
  },
  {
    name: 'Anthracene',
    category: PARAMETER_CATEGORIES.PAHS,
    lower: 0,
    upper: 100,
    unit: 'mg/kg',
    description: '3-ring PAH'
  },
  {
    name: 'Fluoranthene',
    category: PARAMETER_CATEGORIES.PAHS,
    lower: 0,
    upper: 40,
    unit: 'mg/kg',
    description: '4-ring PAH (C4UL: 40 mg/kg)'
  },
  {
    name: 'Pyrene',
    category: PARAMETER_CATEGORIES.PAHS,
    lower: 0,
    upper: 40,
    unit: 'mg/kg',
    description: '4-ring PAH'
  },
  {
    name: 'Benzo(a)anthracene',
    category: PARAMETER_CATEGORIES.PAHS,
    lower: 0,
    upper: 1,
    unit: 'mg/kg',
    description: '4-ring PAH (carcinogenic, C4UL: 1 mg/kg)'
  },
  {
    name: 'Chrysene',
    category: PARAMETER_CATEGORIES.PAHS,
    lower: 0,
    upper: 8,
    unit: 'mg/kg',
    description: '4-ring PAH'
  },
  {
    name: 'Benzo(b)fluoranthene',
    category: PARAMETER_CATEGORIES.PAHS,
    lower: 0,
    upper: 1,
    unit: 'mg/kg',
    description: '5-ring PAH (carcinogenic, C4UL: 1 mg/kg)'
  },
  {
    name: 'Benzo(k)fluoranthene',
    category: PARAMETER_CATEGORIES.PAHS,
    lower: 0,
    upper: 1,
    unit: 'mg/kg',
    description: '5-ring PAH (carcinogenic)'
  },
  {
    name: 'Benzo(a)pyrene',
    category: PARAMETER_CATEGORIES.PAHS,
    lower: 0,
    upper: 0.7,
    unit: 'mg/kg',
    description: '5-ring PAH (highly carcinogenic, C4UL: 0.7 mg/kg)'
  },
  {
    name: 'Indeno(1,2,3-cd)pyrene',
    category: PARAMETER_CATEGORIES.PAHS,
    lower: 0,
    upper: 1,
    unit: 'mg/kg',
    description: '6-ring PAH (carcinogenic)'
  },
  {
    name: 'Dibenzo(a,h)anthracene',
    category: PARAMETER_CATEGORIES.PAHS,
    lower: 0,
    upper: 0.7,
    unit: 'mg/kg',
    description: '5-ring PAH (highly carcinogenic)'
  },
  {
    name: 'Benzo(g,h,i)perylene',
    category: PARAMETER_CATEGORIES.PAHS,
    lower: 0,
    upper: 1,
    unit: 'mg/kg',
    description: '6-ring PAH'
  },

  // ==================== TPH - ALIPHATIC FRACTIONS ====================
  {
    name: 'TPH Aliphatic C5-C6',
    category: PARAMETER_CATEGORIES.TPH_ALIPHATIC,
    lower: 0,
    upper: 20,
    unit: 'mg/kg',
    description: 'Very light petroleum fractions'
  },
  {
    name: 'TPH Aliphatic C6-C8',
    category: PARAMETER_CATEGORIES.TPH_ALIPHATIC,
    lower: 0,
    upper: 50,
    unit: 'mg/kg',
    description: 'Light petroleum fractions'
  },
  {
    name: 'TPH Aliphatic C8-C10',
    category: PARAMETER_CATEGORIES.TPH_ALIPHATIC,
    lower: 0,
    upper: 100,
    unit: 'mg/kg',
    description: 'Light-medium petroleum fractions (C4UL: 100 mg/kg)'
  },
  {
    name: 'TPH Aliphatic C10-C12',
    category: PARAMETER_CATEGORIES.TPH_ALIPHATIC,
    lower: 0,
    upper: 150,
    unit: 'mg/kg',
    description: 'Medium petroleum fractions'
  },
  {
    name: 'TPH Aliphatic C12-C16',
    category: PARAMETER_CATEGORIES.TPH_ALIPHATIC,
    lower: 0,
    upper: 200,
    unit: 'mg/kg',
    description: 'Medium-heavy petroleum fractions'
  },
  {
    name: 'TPH Aliphatic C16-C35',
    category: PARAMETER_CATEGORIES.TPH_ALIPHATIC,
    lower: 0,
    upper: 500,
    unit: 'mg/kg',
    description: 'Heavy petroleum fractions (C4UL: 500 mg/kg)'
  },

  // ==================== TPH - AROMATIC FRACTIONS ====================
  {
    name: 'TPH Aromatic C5-C7',
    category: PARAMETER_CATEGORIES.TPH_AROMATIC,
    lower: 0,
    upper: 10,
    unit: 'mg/kg',
    description: 'Very light aromatic fractions'
  },
  {
    name: 'TPH Aromatic C7-C8',
    category: PARAMETER_CATEGORIES.TPH_AROMATIC,
    lower: 0,
    upper: 20,
    unit: 'mg/kg',
    description: 'Light aromatic fractions (includes toluene range)'
  },
  {
    name: 'TPH Aromatic C8-C10',
    category: PARAMETER_CATEGORIES.TPH_AROMATIC,
    lower: 0,
    upper: 50,
    unit: 'mg/kg',
    description: 'Light-medium aromatic fractions (C4UL: 50 mg/kg)'
  },
  {
    name: 'TPH Aromatic C10-C12',
    category: PARAMETER_CATEGORIES.TPH_AROMATIC,
    lower: 0,
    upper: 50,
    unit: 'mg/kg',
    description: 'Medium aromatic fractions'
  },
  {
    name: 'TPH Aromatic C12-C16',
    category: PARAMETER_CATEGORIES.TPH_AROMATIC,
    lower: 0,
    upper: 100,
    unit: 'mg/kg',
    description: 'Medium-heavy aromatic fractions'
  },
  {
    name: 'TPH Aromatic C16-C21',
    category: PARAMETER_CATEGORIES.TPH_AROMATIC,
    lower: 0,
    upper: 200,
    unit: 'mg/kg',
    description: 'Heavy aromatic fractions'
  },
  {
    name: 'TPH Aromatic C21-C35',
    category: PARAMETER_CATEGORIES.TPH_AROMATIC,
    lower: 0,
    upper: 500,
    unit: 'mg/kg',
    description: 'Very heavy aromatic fractions (C4UL: 500 mg/kg)'
  },

  // ==================== BTEX & VOLATILES ====================
  {
    name: 'Benzene',
    category: PARAMETER_CATEGORIES.BTEX,
    lower: 0,
    upper: 0.5,
    unit: 'mg/kg',
    description: 'Volatile aromatic (carcinogenic, C4UL: 0.5 mg/kg)'
  },
  {
    name: 'Toluene',
    category: PARAMETER_CATEGORIES.BTEX,
    lower: 0,
    upper: 25,
    unit: 'mg/kg',
    description: 'Volatile aromatic (C4UL: 25 mg/kg)'
  },
  {
    name: 'Ethylbenzene',
    category: PARAMETER_CATEGORIES.BTEX,
    lower: 0,
    upper: 20,
    unit: 'mg/kg',
    description: 'Volatile aromatic (C4UL: 20 mg/kg)'
  },
  {
    name: 'Xylene',
    category: PARAMETER_CATEGORIES.BTEX,
    lower: 0,
    upper: 25,
    unit: 'mg/kg',
    description: 'Total Xylenes (C4UL: 25 mg/kg)'
  },
  {
    name: 'MTBE',
    category: PARAMETER_CATEGORIES.BTEX,
    lower: 0,
    upper: 10,
    unit: 'mg/kg',
    description: 'Methyl tert-butyl ether (fuel additive, C4UL: 10 mg/kg)'
  },

  // ==================== OTHER CONTAMINANTS ====================
  {
    name: 'Asbestos',
    category: PARAMETER_CATEGORIES.OTHER,
    lower: 0,
    upper: 0.001,
    unit: '%',
    description: 'Asbestos fibres (zero tolerance, detection limit: 0.001%)'
  },
  {
    name: 'Phenol',
    category: PARAMETER_CATEGORIES.OTHER,
    lower: 0,
    upper: 50,
    unit: 'mg/kg',
    description: 'C4UL: 50 mg/kg (residential)'
  },
  {
    name: 'Cyanide',
    category: PARAMETER_CATEGORIES.OTHER,
    lower: 0,
    upper: 5,
    unit: 'mg/kg',
    description: 'Free Cyanide (C4UL: 5 mg/kg)'
  },
]

/**
 * Get pH-dependent limits for Zn, Cu, Ni
 * Based on BS3882 Table A.1
 */
export function getPhDependentLimit(parameterName, pH) {
  if (parameterName === 'Zinc') {
    if (pH < 6.0) return { lower: 0, upper: 200 }
    if (pH <= 7.0) return { lower: 0, upper: 200 }
    return { lower: 0, upper: 300 }
  }

  if (parameterName === 'Copper') {
    if (pH < 6.0) return { lower: 0, upper: 100 }
    if (pH <= 7.0) return { lower: 0, upper: 135 }
    return { lower: 0, upper: 200 }
  }

  if (parameterName === 'Nickel') {
    if (pH < 6.0) return { lower: 0, upper: 60 }
    if (pH <= 7.0) return { lower: 0, upper: 75 }
    return { lower: 0, upper: 110 }
  }

  return null
}

/**
 * Get parameters grouped by category
 */
export function getParametersByCategory() {
  const grouped = {}

  Object.values(PARAMETER_CATEGORIES).forEach(category => {
    grouped[category] = ALL_PARAMETERS.filter(p => p.category === category)
  })

  return grouped
}

/**
 * Convert parameters array to limits object for backward compatibility
 */
export function parametersToLimits(parameters = ALL_PARAMETERS) {
  const limits = {}
  parameters.forEach(param => {
    limits[param.name] = {
      lower: param.lower,
      upper: param.upper
    }
  })
  return limits
}

/**
 * Get default parameter subset (commonly tested parameters)
 * This provides a sensible starting set instead of all 70+ parameters
 */
export function getDefaultParameters() {
  const commonParams = [
    'pH', 'SOM', 'Sand', 'Silt', 'Clay', // Physical
    'Arsenic', 'Cadmium', 'Chromium', 'Copper', 'Lead', 'Mercury', 'Nickel', 'Zinc', // Metals
    'Benzo(a)pyrene', 'Naphthalene', // Key PAHs
    'TPH Aliphatic C8-C10', 'TPH Aromatic C8-C10', // Key TPH
    'Benzene', 'Toluene' // Key BTEX
  ]

  return ALL_PARAMETERS.filter(p => commonParams.includes(p.name))
}
