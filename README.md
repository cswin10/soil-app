# Soil Mixing Optimizer

A web application that optimizes soil mixing ratios for treatment facilities. The app finds the ideal blend of multiple soil batches while ensuring all contaminant levels stay within legal limits.

## Problem Statement

Treatment facilities blend multiple soil batches together and need to ensure all contaminant parameters (heavy metals, pH, organic matter, etc.) stay within regulatory limits. Manual calculation in Excel takes hours and is error-prone. This app automates the optimization process using advanced mathematical algorithms.

## Features

- **Smart Optimization**: Uses scipy.optimize with SLSQP (Sequential Least Squares Programming) algorithm
- **Flexible Input**: Upload CSV, paste data, or manually enter batch parameters
- **Visual Results**: Color-coded parameter table showing compliance status
- **Export Functionality**: Download results as CSV or copy mixing instructions
- **Tolerance Control**: Adjustable tolerance slider to balance safety margins
- **Production Ready**: Fast, responsive, and designed for non-technical users

## How It Works

### Input Data Structure

The app expects data for multiple soil batches (typically 3-5, supports up to 10):

- Each batch has lab test results for ~50 parameters (heavy metals, pH, etc.)
- Each parameter has upper and lower screening limits
- Parameters with upper limit = 9999 are ignored during optimization

### Optimization Math

**Blended Value Calculation:**
```
Blended value = (ratio₁ × value₁) + (ratio₂ × value₂) + ...
```

**Constraints:**
- All ratios must sum to 1.0 (100%)
- All ratios ≥ 0
- For each parameter: `lower_limit ≤ blended_value ≤ upper_limit`

**Objective Function:**
```
Minimize: Σ |blended_value - midpoint| / (upper - lower)
```

This minimizes the normalized residual (distance from midpoint as % of range).

**Tolerance:**
- Default: 75% (values within 25% buffer from limits)
- Higher tolerance = more permissive (values can be further from midpoint)
- Lower tolerance = tighter control (values closer to midpoint)

## Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Backend**: Python with scipy.optimize
- **Deployment**: Netlify (with Netlify Functions for serverless Python)
- **CSV Parsing**: PapaParse

## Installation

### Prerequisites

- Node.js 18+ and npm
- Python 3.11+ (for local testing)
- Git

### Local Development

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd soil-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Install Python dependencies (optional, for local function testing):**
   ```bash
   pip install -r requirements.txt
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to `http://localhost:3000`

### Using Sample Data

The app includes sample data with 3 batches and 17 parameters. Click "Load Sample Data" in the Input Section to test the optimizer.

Sample parameters include:
- pH (5.5 - 8.5)
- Arsenic (0 - 37 mg/kg)
- Lead (0 - 200 mg/kg)
- Zinc (0 - 200 mg/kg)
- And 13 more heavy metals

## CSV Data Format

The app expects Excel-style CSV format:

```csv
Row,Column A,Column B,Batch 1,Batch 2,Batch 3
...
12,Mixing Proportions,,0.33,0.33,0.34
13,Parameter,Lower Limit,Upper Limit,Batch 1,Batch 2,Batch 3
14,pH,5.5,8.5,7.2,9.0,7.1
15,Arsenic,0,37,11,22,16
...
```

- **Row 12**: Initial mixing proportions (optional, not used by optimizer)
- **Row 13**: Headers (Parameter name, Lower Limit, Upper Limit, Batch names...)
- **Row 14+**: Parameter data (one row per parameter)

See `public/sample-data.csv` for a complete example.

## Deployment to Netlify

### Option 1: Deploy via Netlify CLI

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify:**
   ```bash
   netlify login
   ```

3. **Initialize and deploy:**
   ```bash
   netlify init
   netlify deploy --prod
   ```

### Option 2: Deploy via GitHub

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connect to Netlify:**
   - Go to [netlify.com](https://netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect your GitHub repository
   - Netlify will auto-detect settings from `netlify.toml`

3. **Deploy:**
   - Click "Deploy site"
   - Wait for build to complete
   - Your app will be live at `https://your-site-name.netlify.app`

### Environment Configuration

No environment variables needed! The app is fully self-contained.

The `netlify.toml` file configures:
- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory: `netlify/functions`
- Python runtime: 3.11

## Usage Guide

### Step 1: Input Your Data

**Option A - Upload CSV:**
1. Click "Upload/Paste CSV" tab
2. Click "Upload CSV File" and select your file
3. Data will be automatically parsed

**Option B - Paste CSV:**
1. Click "Upload/Paste CSV" tab
2. Copy your CSV data from Excel
3. Paste into the text area
4. Click "Process CSV"

**Option C - Manual Entry:**
1. Click "Manual Entry" tab
2. Click "+ Add Batch" to create soil batches
3. Click "+ Add Parameter" to add parameters
4. Enter values manually in the table

**Option D - Sample Data:**
1. Click "Load Sample Data" button
2. Pre-configured data will load instantly

### Step 2: Review Parameter Limits

- Check the "Parameter Limits" table
- Edit upper/lower limits as needed
- Set upper limit to 9999 to ignore a parameter
- Review midpoint and range calculations

### Step 3: Set Tolerance

- Use the slider to adjust tolerance (0-100%)
- Default: 75% (recommended for most cases)
- Higher = more relaxed (values can be further from ideal)
- Lower = tighter control (values closer to ideal)

### Step 4: Optimize

1. Click "Find Optimal Mix" button
2. Wait for optimization (typically <2 seconds)
3. Review results

### Step 5: Interpret Results

**Status Indicators:**
- 🟢 **Within Tolerance**: Value is within target range (ideal)
- 🟡 **Within Limits**: Legal but outside tolerance range (acceptable)
- 🔴 **EXCEEDS LIMITS**: Violates legal limits (non-compliant)

**Mixing Ratios:**
- Shows percentage of each batch to use
- Percentages always sum to 100%

**Parameter Analysis Table:**
- Original values for each batch
- Calculated blended value
- Legal limits
- Normalized residual (0 = perfect)
- Color-coded status

### Step 6: Export Results

**Copy Mixing Instructions:**
- Click "Copy Instructions" button
- Paste into your documentation

**Export to CSV:**
- Click "Export to CSV" button
- Downloads complete results with all calculations

## Troubleshooting

### "No Valid Mix Found"

This means no combination of ratios can keep all parameters within limits.

**Solutions:**
1. Review your input data for errors
2. Check if any limits are too restrictive
3. Consider removing problematic batches
4. Relax specific parameter limits

### "Mix Found (Outside Tolerance)"

The optimizer found a legal mix, but it's not within your tolerance setting.

**Solutions:**
1. Increase the tolerance slider value
2. The app will suggest a recommended tolerance value
3. Accept the mix if parameters are within legal limits

### CSV Upload Issues

**Problem:** CSV doesn't parse correctly

**Solutions:**
1. Ensure your CSV follows the format in `public/sample-data.csv`
2. Check that Row 13 has headers
3. Verify data starts at Row 14
4. Make sure limits are in columns B and C

### Optimization Takes Too Long

**Normal:** <2 seconds for typical datasets (3-10 batches, 50 parameters)

**If slower:**
1. Reduce number of parameters
2. Check for parameters with identical values across all batches
3. Ensure limits are reasonable (not impossibly tight)

## Understanding the Math

### Normalized Residual

For each parameter, the normalized residual measures how far the blended value is from the ideal midpoint:

```
Residual = |Blended Value - Midpoint| / Range
```

- **0.0** = Perfect (exactly at midpoint)
- **0.25** = 25% away from midpoint
- **0.5** = At the limit boundary

### Total Residual Score

Sum of all individual residuals. Lower is better.

### Tolerance Interpretation

At 75% tolerance:
- Values can be up to 12.5% away from center
- This creates a 25% buffer from the limits
- For pH range 5.5-8.5: ideal is 7.0, acceptable range is 6.3-7.7

## API Reference

### Netlify Function Endpoint

**URL:** `/.netlify/functions/optimize`

**Method:** `POST`

**Request Body:**
```json
{
  "batches": [
    {"name": "Batch 1", "pH": 7.2, "Arsenic": 11, ...},
    {"name": "Batch 2", "pH": 9.0, "Arsenic": 22, ...}
  ],
  "limits": {
    "pH": {"lower": 5.5, "upper": 8.5},
    "Arsenic": {"lower": 0, "upper": 37}
  },
  "tolerance": 0.75
}
```

**Response:**
```json
{
  "success": true,
  "ratios": [0.35, 0.45, 0.20],
  "blended_values": {"pH": 7.5, "Arsenic": 15.3},
  "residuals": {"pH": 0.12, "Arsenic": 0.23},
  "total_residual": 0.35,
  "within_tolerance": true,
  "within_limits": true,
  "suggested_tolerance": null
}
```

## File Structure

```
soil-app/
├── netlify/
│   └── functions/
│       └── optimize.py          # Python optimization function
├── public/
│   └── sample-data.csv          # Sample data for testing
├── src/
│   ├── components/
│   │   ├── InputSection.jsx     # CSV upload and manual entry
│   │   ├── ParameterTable.jsx   # Limits editor
│   │   └── ResultsDisplay.jsx   # Results with color coding
│   ├── App.jsx                  # Main app component
│   ├── main.jsx                 # React entry point
│   └── index.css                # Tailwind styles
├── index.html                   # HTML template
├── netlify.toml                 # Netlify configuration
├── package.json                 # Node dependencies
├── requirements.txt             # Python dependencies
├── tailwind.config.js           # Tailwind configuration
├── vite.config.js              # Vite configuration
└── README.md                    # This file
```

## Performance

- **Optimization Speed**: <2 seconds for typical datasets
- **Supported Batches**: Up to 10 batches
- **Supported Parameters**: Up to 100 parameters
- **Browser Compatibility**: Modern browsers (Chrome, Firefox, Safari, Edge)
- **Mobile Responsive**: Yes, full tablet and mobile support

## Security

- No data is stored on servers
- All processing happens client-side or in serverless functions
- No authentication required
- No sensitive data exposure
- CORS enabled for API calls

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this in your projects!

## Support

For issues or questions:
1. Check this README first
2. Review sample data format
3. Test with sample data
4. Check browser console for errors

## Changelog

### Version 1.0.0 (Initial Release)
- CSV upload and paste functionality
- Manual batch entry
- Parameter limits editor
- Tolerance slider
- scipy.optimize SLSQP algorithm
- Color-coded results display
- CSV export
- Copy mixing instructions
- Sample data included
- Netlify deployment ready
- Full mobile responsive design

## Acknowledgments

- Built with React and Tailwind CSS
- Optimization powered by scipy.optimize
- Deployed on Netlify
- CSV parsing by PapaParse
