# Scoring Methods Update - Implementation Summary

## Overview
This update adds three different scoring methods for calculating sample scores and assigning color-coded tags (green/yellow/red) to samples based on their deviation from the baseline.

## Changes Made

### 1. Dashboard UI Updates (`frontend/src/pages/Dashboard.tsx`)

#### Added Scoring Method Selection
- Three clickable button options in a button group:
  1. **RMSE Deviation Weighted by Interval** (Root Mean Square Error)
  2. **Pearson Correlation per Interval** (Statistical correlation)
  3. **Area Difference / Integral Difference** (Default - Trapezoidal integration)

#### UI Features
- Button group with visual feedback (highlighted button shows active method)
- Automatically triggers score recalculation when method changes
- Repositioned UI to show scoring method selector above sample info
- All three methods integrate with the existing weight system

### 2. Scoring Calculation Logic (`frontend/src/components/GraphPreview.tsx`)

#### Three Scoring Methods Implemented:

##### Method 1: RMSE Deviation Weighted by Interval
```
RMSE = sqrt(Σ(weight_i × (baseline_i - sample_i)²) / Σ(weight_i))
Score = 100 × e^(-normalizedRMSE)
```
- Calculates weighted root mean square error
- More sensitive to large deviations
- Good for detecting significant outliers

##### Method 2: Pearson Correlation per Interval
```
Correlation = Cov(baseline, sample) / (σ_baseline × σ_sample)
Score = (correlation + 1) × 50
```
- Measures statistical correlation between baseline and sample
- Score ranges: correlation 1 → score 100, correlation 0 → score 50, correlation -1 → score 0
- Good for detecting pattern similarities

##### Method 3: Area Difference / Integral Difference (Default)
```
Area = Σ(weight_i × |Δx_i| × avg(|δy_i|, |δy_(i+1)|))
Score = 100 × e^(-0.3 × normalizedArea)
```
- Uses trapezoidal rule for area under the difference curve
- Considers total magnitude of deviation across the spectrum
- Good for overall deviation assessment

#### Weight Integration
All three methods properly integrate with the existing abnormality weight system:
- Each wavelength's deviation is multiplied by its configured weight
- Higher weights amplify deviations in critical spectral regions (evaporation, oxidation, etc.)

### 3. Grease Map Updates (`frontend/src/components/GraphPreview.tsx`)

The Grease Map (DeviationHeatBar) now updates according to the selected scoring method:
- **RMSE**: Shows squared error (highlighting large deviations)
- **Pearson**: Shows absolute differences (overall deviation magnitude)
- **Area**: Shows deviation from average (relative comparison)

### 4. Score-to-Color Mapping

Consistent across all methods:
- **Green**: Score ≥ 90 (Good match to baseline)
- **Yellow**: 70 ≤ Score < 90 (Moderate deviation)
- **Red**: Score < 70 (Significant deviation)

## Technical Details

### Score Normalization
Each method uses appropriate normalization to convert raw metrics to 0-100 scores:
- RMSE: Exponential decay based on normalized error
- Pearson: Linear transformation from [-1, 1] to [0, 100]
- Area: Exponential decay based on normalized area difference

### Performance
- All calculations are memoized using React's `useMemo`
- Recalculation only occurs when:
  - Baseline or samples change
  - Abnormality weights change
  - Scoring method changes

### Backwards Compatibility
- Default method is "Area Difference" (maintains similar behavior to previous version)
- All existing features (weight configuration, favorites, filtering) work unchanged
- Score display and color coding remain consistent

## Usage Instructions

1. **Select Scoring Method**: Click one of the three buttons at the top of the dashboard
2. **Configure Weights**: Use "Configure Abnormality Weights" button to set wavelength-specific weights
3. **View Results**: 
   - Scores update automatically in the sidebar for all samples
   - Selected sample score shown with color-coded badge
   - Grease Map updates to reflect the chosen method

## Testing Recommendations

1. Test with different sample datasets
2. Compare scoring results across all three methods
3. Verify weight system applies correctly to each method
4. Check that color coding (green/yellow/red) makes sense for each method
5. Confirm Grease Map visualization updates appropriately

## Mathematical Accuracy Notes

- **RMSE**: Sensitive to outliers; penalizes large deviations heavily
- **Pearson**: Measures pattern similarity; less sensitive to scaling differences
- **Area**: Balances overall deviation magnitude; good general-purpose metric

Each method has strengths for different analysis needs. The default "Area Difference" method provides a balanced approach suitable for most grease oxidation analyses.
