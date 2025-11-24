# Scoring Methods Fix - Summary

## Issues Fixed

### 1. **Area Difference Method** - All samples getting 100 score
**Problem**: 
- Dividing by `totalWeight` instead of the spectral range
- This made the normalized area extremely small (near 0)
- Exponential function returned values very close to 100

**Solution**:
- Changed normalization to divide by `totalRange` (total x-axis span)
- This gives "average area difference per unit wavelength"
- Implemented proper thresholds:
  - 0-5: Excellent (90-100)
  - 5-15: Good (70-90)
  - 15-40: Fair (40-70)
  - >40: Poor (0-40)

### 2. **RMSE Method** - Only getting critical scores
**Problem**:
- Normalization threshold (0.3) was too loose
- Exponential decay was too aggressive
- Real-world RMSE values are typically much smaller (0.01-0.2)

**Solution**:
- Adjusted thresholds based on typical spectroscopy data:
  - 0-0.05: Excellent (90-100)
  - 0.05-0.15: Good (70-90)
  - 0.15-0.3: Fair (40-70)
  - >0.3: Poor (0-40)
- Used piecewise linear scoring with smooth transitions

### 3. **Pearson Correlation Method** - Scores too high/weird
**Problem**:
- Simple linear mapping (correlation + 1) × 50 was not meaningful
- Didn't differentiate well between very similar samples
- Most real samples have correlation > 0.9, so they all scored 95+

**Solution**:
- Added `Math.abs()` to prevent negative values in sqrt (numerical stability)
- Clamped correlation to [-1, 1] to handle floating point errors
- Implemented realistic thresholds:
  - >0.98: Excellent (90-100)
  - 0.95-0.98: Good (70-90)
  - 0.90-0.95: Fair (40-70)
  - <0.90: Poor (0-40)

## Scoring Algorithm Details

### RMSE (Root Mean Square Error)
```
RMSE = sqrt(Σ(weight × (baseline - sample)²) / Σ(weight))

Score calculation:
- If RMSE ≤ 0.05:  score = 90 + 10 × (1 - RMSE/0.05)
- If RMSE ≤ 0.15:  score = 70 + 20 × (1 - (RMSE-0.05)/0.10)
- If RMSE ≤ 0.3:   score = 40 + 30 × (1 - (RMSE-0.15)/0.15)
- If RMSE > 0.3:   score = max(0, 40 × exp(-(RMSE-0.3)/0.2))
```

### Pearson Correlation
```
r = Cov(baseline, sample) / (σ_baseline × σ_sample)

Score calculation:
- If r ≥ 0.98:  score = 90 + 10 × (r-0.98)/0.02
- If r ≥ 0.95:  score = 70 + 20 × (r-0.95)/0.03
- If r ≥ 0.90:  score = 40 + 30 × (r-0.90)/0.05
- If r < 0.90:  score = max(0, 40 × r/0.90)
```

### Area Difference (Integral)
```
Area = Σ(weight × |Δx| × avg(|Δy_i|, |Δy_(i+1)|))
NormalizedArea = Area / TotalSpectralRange

Score calculation:
- If area ≤ 5:   score = 90 + 10 × (1 - area/5)
- If area ≤ 15:  score = 70 + 20 × (1 - (area-5)/10)
- If area ≤ 40:  score = 40 + 30 × (1 - (area-15)/25)
- If area > 40:  score = max(0, 40 × exp(-(area-40)/30))
```

## Tag Color Thresholds (Consistent across all methods)

- 🟢 **Green**: Score ≥ 90 (Excellent match to baseline)
- 🟡 **Yellow**: 70 ≤ Score < 90 (Good match with some deviations)
- 🔴 **Red**: Score < 70 (Significant deviations, requires attention)

## Testing the Fixes

To verify the fixes work correctly:

1. **Load samples with varying deviation levels**
   - Samples very similar to baseline should score 90-100
   - Samples with moderate differences should score 70-90
   - Samples with significant oxidation should score <70

2. **Compare methods**
   - RMSE: More sensitive to large deviations in any region
   - Pearson: Best for pattern matching (shape similarity)
   - Area: Balanced overall deviation assessment

3. **Test with weights**
   - Higher weights in critical regions (oxidation bands) should lower scores more
   - Samples with deviations in high-weight regions should score lower

4. **Verify color coding**
   - Green tags should appear for good matches
   - Yellow for moderate deviations
   - Red for critical samples needing attention

## Key Improvements

1. **Realistic thresholds** based on actual spectroscopy data ranges
2. **Smooth score transitions** using piecewise functions instead of exponential only
3. **Proper normalization** for each metric type
4. **Numerical stability** (abs(), clamping) to prevent edge cases
5. **Meaningful differentiation** between samples at all quality levels
