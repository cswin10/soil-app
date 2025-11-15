# Testing Guide - Soil Mixing Optimizer

This document describes how to test the Soil Mixing Optimizer app.

## Quick Test with Sample Data

The fastest way to verify the app works:

1. **Start the app:**
   ```bash
   npm run dev
   ```

2. **Open browser:** Go to `http://localhost:3000`

3. **Load sample data:** Click "Load Sample Data" button

4. **Run optimization:** Click "Find Optimal Mix"

5. **Expected result:**
   - Optimization completes in <2 seconds
   - Shows 3 mixing ratios (should sum to 100%)
   - All parameters show green or yellow status
   - No red (exceeds limits) parameters

## Test Cases

### Test Case 1: Basic Optimization (Sample Data)

**Steps:**
1. Click "Load Sample Data"
2. Set tolerance to 75%
3. Click "Find Optimal Mix"

**Expected Results:**
- Success: "Optimal Mix Found!" or "Mix Found (Outside Tolerance)"
- Ratios sum to 100%
- pH blended value between 5.5 and 8.5
- All parameters within limits

**Pass Criteria:**
- No errors
- All parameters green or yellow
- Total residual < 2.0

### Test Case 2: CSV Upload

**Steps:**
1. Go to "Upload/Paste CSV" tab
2. Click "Upload CSV File"
3. Select `public/sample-data.csv`
4. Verify data loads

**Expected Results:**
- Alert: "Successfully loaded 3 batches with 17 parameters"
- Parameter Limits table shows 17 rows
- All values match CSV

**Pass Criteria:**
- Data loads without errors
- All 17 parameters present
- Batch names correct (Batch 1, 2, 3)

### Test Case 3: CSV Paste

**Sample CSV to paste:**
```csv
Row,Column A,Column B,Batch A,Batch B
12,Mixing Proportions,,0.5,0.5
13,Parameter,Lower Limit,Upper Limit,Batch A,Batch B
14,pH,6.0,8.0,7.5,6.5
15,Lead,0,100,20,80
```

**Steps:**
1. Go to "Upload/Paste CSV" tab
2. Paste CSV above into text area
3. Click "Process CSV"

**Expected Results:**
- 2 batches loaded
- 2 parameters (pH, Lead)
- Optimization runs successfully

**Pass Criteria:**
- No parsing errors
- Correct limits applied
- Can optimize

### Test Case 4: Manual Entry

**Steps:**
1. Go to "Manual Entry" tab
2. Click "+ Add Parameter"
3. Enter: Name="Copper", Lower=0, Upper=100
4. Click "+ Add Batch"
5. Enter values for Batch 1
6. Add second batch
7. Run optimization

**Expected Results:**
- Parameter added to limits table
- Batches show in manual entry table
- Can edit values
- Optimization works

**Pass Criteria:**
- No errors adding parameters/batches
- Values persist
- Optimization succeeds

### Test Case 5: Tolerance Adjustment

**Steps:**
1. Load sample data
2. Set tolerance to 50%
3. Run optimization
4. Note results
5. Set tolerance to 90%
6. Run optimization again
7. Compare results

**Expected Results:**
- Lower tolerance: More parameters yellow/red
- Higher tolerance: More parameters green
- Different suggested tolerance values

**Pass Criteria:**
- Tolerance affects results
- UI updates correctly
- No errors

### Test Case 6: Parameter Limits Editing

**Steps:**
1. Load sample data
2. Edit pH upper limit from 8.5 to 7.5
3. Run optimization
4. Verify pH blended value ≤ 7.5

**Expected Results:**
- New limit respected
- Blended value within new range
- May show "outside tolerance" if tight

**Pass Criteria:**
- Edited limits used in optimization
- Results reflect new constraints

### Test Case 7: Ignore Parameter (Set to 9999)

**Steps:**
1. Load sample data
2. Set Arsenic upper limit to 9999
3. Run optimization
4. Check results

**Expected Results:**
- Arsenic not shown in results table
- Other parameters still optimized
- Message: "Ignored" in parameter limits table

**Pass Criteria:**
- Parameter correctly ignored
- No errors
- Other parameters unaffected

### Test Case 8: Export to CSV

**Steps:**
1. Load sample data
2. Run optimization
3. Click "Export to CSV"
4. Open downloaded CSV file

**Expected Results:**
- CSV file downloads
- Contains mixing ratios
- Contains blended values
- Contains all parameters

**Pass Criteria:**
- Valid CSV format
- All data present
- Can open in Excel

### Test Case 9: Copy Mixing Instructions

**Steps:**
1. Load sample data
2. Run optimization
3. Click "Copy Instructions"
4. Paste into a text editor

**Expected Results:**
- Alert: "Mixing instructions copied to clipboard!"
- Pasted text shows:
  ```
  Batch 1: 35.00%
  Batch 2: 45.00%
  Batch 3: 20.00%
  ```

**Pass Criteria:**
- Copy works
- Format correct
- Percentages sum to 100%

### Test Case 10: Impossible Constraints

**Steps:**
1. Manual entry mode
2. Add parameter "Test" with limits 50-60
3. Add Batch 1: Test=10
4. Add Batch 2: Test=100
5. Run optimization

**Expected Results:**
- Optimization attempts to blend
- May show "No Valid Mix Found" if impossible
- Or finds best possible mix

**Pass Criteria:**
- No crashes
- Clear error message if no solution
- Suggested tolerance if applicable

### Test Case 11: Single Batch

**Steps:**
1. Manual entry
2. Add one batch only
3. Try to optimize

**Expected Results:**
- Cannot optimize (need at least 2 batches)
- "Find Optimal Mix" button disabled or shows error

**Pass Criteria:**
- Graceful handling
- Clear message to user

### Test Case 12: Delete Batch/Parameter

**Steps:**
1. Load sample data
2. Delete Batch 2
3. Run optimization
4. Delete pH parameter
5. Run optimization again

**Expected Results:**
- Data updates correctly
- Optimization works with remaining data
- No stale references

**Pass Criteria:**
- Deletion works
- No errors
- Optimization adapts

## Edge Cases

### Edge Case 1: Identical Batches

**Setup:**
- 2 batches with identical values

**Expected:**
- Optimization succeeds
- May give any ratio combination (e.g., 50/50, 100/0, etc.)
- All valid since batches are identical

### Edge Case 2: Zero Range Parameter

**Setup:**
- Parameter with lower=50, upper=50 (zero range)

**Expected:**
- Should handle gracefully
- May cause optimization issues
- Should not crash

### Edge Case 3: Negative Values

**Setup:**
- Parameter values below zero

**Expected:**
- Should work if limits allow negatives
- Negative blended values OK if within limits

### Edge Case 4: Very Large Numbers

**Setup:**
- Parameter with values in millions

**Expected:**
- Should normalize correctly
- May take longer to optimize
- No overflow errors

### Edge Case 5: Many Batches

**Setup:**
- 10 batches with 50 parameters

**Expected:**
- Optimization still completes <5 seconds
- Results display correctly
- No performance issues

## Performance Tests

### Performance Test 1: Small Dataset

- **Config:** 2 batches, 5 parameters
- **Expected Time:** <1 second
- **Pass:** Optimization completes quickly

### Performance Test 2: Medium Dataset

- **Config:** 5 batches, 25 parameters
- **Expected Time:** <2 seconds
- **Pass:** No noticeable delay

### Performance Test 3: Large Dataset

- **Config:** 10 batches, 50 parameters
- **Expected Time:** <5 seconds
- **Pass:** Still responsive

## Mobile Testing

Test on mobile devices or browser dev tools mobile mode:

### Mobile Test 1: Responsive Layout

**Check:**
- [ ] Header displays correctly
- [ ] Tables scroll horizontally
- [ ] Buttons are touchable (not too small)
- [ ] Input fields usable
- [ ] Results readable

### Mobile Test 2: Upload on Mobile

**Steps:**
1. Open on mobile browser
2. Try CSV upload
3. Try manual entry

**Expected:**
- File picker works
- Keyboard appears for inputs
- No layout breaking

## Browser Compatibility

Test on:

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

All features should work on modern browsers.

## Automated Testing Setup (Future)

For future test automation, consider:

```bash
npm install --save-dev vitest @testing-library/react
```

Create `src/__tests__/App.test.jsx`:
```javascript
import { render, screen } from '@testing-library/react'
import App from '../App'

test('renders app title', () => {
  render(<App />)
  expect(screen.getByText(/Soil Mixing Optimizer/i)).toBeInTheDocument()
})
```

## Deployment Testing

After deploying to Netlify:

### Netlify Test 1: Production Build

1. Visit your Netlify URL
2. Run all basic test cases
3. Verify optimization function works

### Netlify Test 2: Function Logs

1. In Netlify Dashboard → Functions
2. Click "optimize" function
3. Run optimization in app
4. Check logs for errors

### Netlify Test 3: Performance

1. Use Chrome DevTools
2. Network tab → Throttle to "Slow 3G"
3. Test optimization speed
4. Should still complete reasonably fast

## Regression Testing Checklist

Before each release, verify:

- [ ] Sample data loads
- [ ] CSV upload works
- [ ] CSV paste works
- [ ] Manual entry works
- [ ] Optimization succeeds
- [ ] Results display correctly
- [ ] Export to CSV works
- [ ] Copy instructions works
- [ ] Parameter editing works
- [ ] Tolerance slider works
- [ ] Mobile responsive
- [ ] No console errors
- [ ] All links work

## Bug Reporting

If you find a bug:

1. Note exact steps to reproduce
2. Record expected vs actual behavior
3. Check browser console for errors
4. Note browser and OS version
5. Capture screenshot if relevant
6. Submit issue with details

## Test Data Files

Additional test CSV files to create:

**test-2-batches.csv** - Minimal valid data
**test-tight-constraints.csv** - Nearly impossible to optimize
**test-50-parameters.csv** - Large dataset
**test-invalid.csv** - Malformed CSV

## Success Criteria

The app passes testing if:

1. All test cases pass
2. No console errors
3. Optimization completes in <5 seconds
4. Results are mathematically correct
5. Mobile responsive
6. Works on all major browsers
7. Netlify functions work
8. Export features work

## Known Limitations

Document any known issues:

- Max 10 batches (by design)
- Max 100 parameters (performance)
- Requires modern browser
- CSV format must match specification
- Optimization may fail for impossible constraints

## Testing Complete!

Once all tests pass, the app is ready for production use.
