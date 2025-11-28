// Analysis service for FTIR spectral data processing
import { Series, diff } from '../lib/series';

export interface RangeWeight {
  min: number;
  max: number;
  weight: number;
  label: string;
  key: string;
}

export interface ParsedCSV {
  filename: string;
  x: number[];
  y: number[];
  rawContent: string;
}

export interface AnalysisResult {
  scores: { [filename: string]: number };
  deviationData: {
    x: number[];
    deviation: number[];
    maxDeviation: number;
    avgDeviation: number;
  } | null;
}

export type ScoringMethod = 'area' | 'rmse' | 'hybrid' | 'pearson';

export class FTIRAnalysisService {
  
  /**
   * Get weight for a given wavelength based on abnormality weights configuration
   */
  private static getWeightForWavelength(wavelength: number, abnormalityWeights: RangeWeight[]): number {
    if (!abnormalityWeights || abnormalityWeights.length === 0) {
      return 1.0; // Default weight when no weights are configured
    }

    for (const range of abnormalityWeights) {
      if (wavelength >= range.min && wavelength <= range.max) {
        return range.weight / 100; // Convert percentage to decimal
      }
    }
    return 1.0; // Default weight if wavelength doesn't fall in any range
  }

  /**
   * Calculate deviation data for selected sample vs baseline
   */
  public static calculateDeviationData(
    baseline: ParsedCSV,
    samples: ParsedCSV[],
    selectedSampleName?: string,
    abnormalityWeights: RangeWeight[] = [],
    scoringMethod: ScoringMethod = 'hybrid'
  ): { x: number[]; deviation: number[]; maxDeviation: number; avgDeviation: number } | null {
    
    if (!baseline || samples.length === 0) return null;

    // Convert baseline to Series format
    const baselineSeries: Series = {
      name: baseline.filename,
      points: baseline.x.map((x, i) => ({ x, y: baseline.y[i] }))
    };

    // Calculate individual differences for each sample vs baseline
    const sampleDifferences = samples.map(s => {
      const sampleSeries: Series = {
        name: s.filename,
        points: s.x.map((x, i) => ({ x, y: s.y[i] }))
      };
      return diff(baselineSeries, sampleSeries);
    });

    if (sampleDifferences.length === 0) return null;

    const firstDiff = sampleDifferences[0];
    const x = firstDiff.x;

    // Calculate average difference across all samples at each x-point
    const avgDelta: number[] = [];
    for (let i = 0; i < x.length; i++) {
      const xValue = x[i];
      let sum = 0;
      let count = 0;

      for (const sampleDiff of sampleDifferences) {
        const idx = sampleDiff.x.indexOf(xValue);
        if (idx !== -1) {
          sum += sampleDiff.delta[idx];
          count++;
        }
      }

      avgDelta.push(count > 0 ? sum / count : 0);
    }

    // Find the selected sample or use first one
    const selectedSampleIndex = selectedSampleName 
      ? samples.findIndex(s => s.filename === selectedSampleName)
      : 0;
    const selectedSampleDiff = sampleDifferences[selectedSampleIndex >= 0 ? selectedSampleIndex : 0];

    // Calculate deviation based on scoring method
    const deviation: number[] = [];
    for (let i = 0; i < x.length; i++) {
      const xValue = x[i];
      const idx = selectedSampleDiff.x.indexOf(xValue);
      if (idx !== -1) {
        let baseDeviation = 0;
        
        if (scoringMethod === 'rmse') {
          baseDeviation = selectedSampleDiff.delta[idx] * selectedSampleDiff.delta[idx];
        } else if (scoringMethod === 'hybrid') {
          baseDeviation = Math.abs(selectedSampleDiff.delta[idx]);
        } else if (scoringMethod === 'pearson') {
          baseDeviation = Math.abs(selectedSampleDiff.delta[idx]);
        } else if (scoringMethod === 'area') {
          baseDeviation = Math.abs(selectedSampleDiff.delta[idx] - avgDelta[i]);
        }
        
        // Apply abnormality weight for this wavelength
        const weight = this.getWeightForWavelength(xValue, abnormalityWeights);
        const weightedDeviation = baseDeviation * weight;
        
        deviation.push(weightedDeviation);
      } else {
        deviation.push(0);
      }
    }

    // Calculate statistics
    const maxDeviation = deviation.length > 0 ? Math.max(...deviation) : 0;
    const avgDeviation = deviation.length > 0 ? 
      deviation.reduce((sum, val) => sum + val, 0) / deviation.length : 0;

    return {
      x,
      deviation,
      maxDeviation,
      avgDeviation
    };
  }

  /**
   * Calculate anomaly scores for all samples (0-100, higher is better)
   */
  public static calculateSampleScores(
    baseline: ParsedCSV,
    samples: ParsedCSV[],
    abnormalityWeights: RangeWeight[] = [],
    scoringMethod: ScoringMethod = 'hybrid'
  ): { [filename: string]: number } {
    
    if (!baseline || samples.length === 0) return {};

    const scores: { [filename: string]: number } = {};

    // Convert baseline to Series format
    const baselineSeries: Series = {
      name: baseline.filename,
      points: baseline.x.map((x, i) => ({ x, y: baseline.y[i] }))
    };

    // Calculate score for each sample based on the selected scoring method
    samples.forEach(sample => {
      const sampleSeries: Series = {
        name: sample.filename,
        points: sample.x.map((x, i) => ({ x, y: sample.y[i] }))
      };

      const sampleDiff = diff(baselineSeries, sampleSeries);
      const { x: diffX, delta } = sampleDiff;

      let score = 0;

      if (scoringMethod === 'rmse') {
        // Method 1: RMSE Deviation Weighted by Interval
        let sumWeightedSquaredError = 0;
        let sumWeights = 0;

        for (let i = 0; i < diffX.length; i++) {
          const wavelength = diffX[i];
          const deviation = delta[i];
          const weight = this.getWeightForWavelength(wavelength, abnormalityWeights);
          
          sumWeightedSquaredError += weight * (deviation * deviation);
          sumWeights += weight;
        }

        const weightedRMSE = sumWeights > 0 ? Math.sqrt(sumWeightedSquaredError / sumWeights) : 0;
        
        // Convert RMSE to score (0-100, lower RMSE = higher score)
        if (weightedRMSE <= 0.10) {
          score = 90 + (10 * (1 - weightedRMSE / 0.10));
        } else if (weightedRMSE <= 0.25) {
          score = 70 + (20 * (1 - (weightedRMSE - 0.10) / 0.15));
        } else if (weightedRMSE <= 0.5) {
          score = 40 + (30 * (1 - (weightedRMSE - 0.25) / 0.25));
        } else {
          score = Math.max(0, 40 * Math.exp(-(weightedRMSE - 0.5) / 0.3));
        }

      } else if (scoringMethod === 'hybrid') {
        // Method 2: Hybrid Score (Weighted RMSE + Pearson Penalty)
        
        // Step 1: Calculate Weighted RMSE
        let sumWeightedSquaredError = 0;
        let sumWeights = 0;

        for (let i = 0; i < diffX.length; i++) {
          const wavelength = diffX[i];
          const deviation = delta[i];
          const weight = this.getWeightForWavelength(wavelength, abnormalityWeights);
          
          sumWeightedSquaredError += weight * (deviation * deviation);
          sumWeights += weight;
        }

        const weightedRMSE = sumWeights > 0 ? Math.sqrt(sumWeightedSquaredError / sumWeights) : 0;
        
        // Step 2: Calculate Pearson correlation
        let sumWeightedX = 0;
        let sumWeightedY = 0;
        let sumWeightedXY = 0;
        let sumWeightedX2 = 0;
        let sumWeightedY2 = 0;

        for (let i = 0; i < diffX.length; i++) {
          const wavelength = diffX[i];
          const weight = this.getWeightForWavelength(wavelength, abnormalityWeights);
          
          const baselineIdx = baseline.x.indexOf(wavelength);
          const sampleIdx = sample.x.indexOf(wavelength);
          
          if (baselineIdx !== -1 && sampleIdx !== -1) {
            const baselineY = baseline.y[baselineIdx];
            const sampleY = sample.y[sampleIdx];
            
            sumWeightedX += weight * baselineY;
            sumWeightedY += weight * sampleY;
            sumWeightedXY += weight * baselineY * sampleY;
            sumWeightedX2 += weight * baselineY * baselineY;
            sumWeightedY2 += weight * sampleY * sampleY;
          }
        }

        let correlation = 0;
        if (sumWeights > 0) {
          const meanX = sumWeightedX / sumWeights;
          const meanY = sumWeightedY / sumWeights;
          const meanXY = sumWeightedXY / sumWeights;
          const meanX2 = sumWeightedX2 / sumWeights;
          const meanY2 = sumWeightedY2 / sumWeights;
          
          const covariance = meanXY - (meanX * meanY);
          const stdX = Math.sqrt(Math.abs(meanX2 - (meanX * meanX)));
          const stdY = Math.sqrt(Math.abs(meanY2 - (meanY * meanY)));
          
          if (stdX > 0 && stdY > 0) {
            correlation = covariance / (stdX * stdY);
            correlation = Math.max(-1, Math.min(1, correlation));
          }
        }

        // Step 3: Calculate base score from RMSE (85% weight)
        let baseScore = 0;
        if (weightedRMSE <= 0.10) {
          baseScore = 90 + (10 * (1 - weightedRMSE / 0.10));
        } else if (weightedRMSE <= 0.25) {
          baseScore = 70 + (20 * (1 - (weightedRMSE - 0.10) / 0.15));
        } else if (weightedRMSE <= 0.5) {
          baseScore = 40 + (30 * (1 - (weightedRMSE - 0.25) / 0.25));
        } else {
          baseScore = Math.max(0, 40 * Math.exp(-(weightedRMSE - 0.5) / 0.3));
        }

        // Step 4: Calculate Pearson penalty (15% weight)
        let pearsonPenalty = 0;
        if (correlation < 0.90) {
          pearsonPenalty = 15 * (0.90 - correlation) / 0.90;
        } else if (correlation < 0.95) {
          pearsonPenalty = 7.5 * (0.95 - correlation) / 0.05;
        }

        // Step 5: Combined score
        score = Math.max(0, Math.min(100, baseScore - pearsonPenalty));

      } else if (scoringMethod === 'pearson') {
        // Method 3: Pure Pearson Correlation
        let sumWeightedX = 0;
        let sumWeightedY = 0;
        let sumWeightedXY = 0;
        let sumWeightedX2 = 0;
        let sumWeightedY2 = 0;
        let sumWeights = 0;

        for (let i = 0; i < diffX.length; i++) {
          const wavelength = diffX[i];
          const weight = this.getWeightForWavelength(wavelength, abnormalityWeights);
          
          const baselineIdx = baseline.x.indexOf(wavelength);
          const sampleIdx = sample.x.indexOf(wavelength);
          
          if (baselineIdx !== -1 && sampleIdx !== -1) {
            const baselineY = baseline.y[baselineIdx];
            const sampleY = sample.y[sampleIdx];
            
            sumWeightedX += weight * baselineY;
            sumWeightedY += weight * sampleY;
            sumWeightedXY += weight * baselineY * sampleY;
            sumWeightedX2 += weight * baselineY * baselineY;
            sumWeightedY2 += weight * sampleY * sampleY;
            sumWeights += weight;
          }
        }

        let correlation = 0;
        if (sumWeights > 0) {
          const meanX = sumWeightedX / sumWeights;
          const meanY = sumWeightedY / sumWeights;
          const meanXY = sumWeightedXY / sumWeights;
          const meanX2 = sumWeightedX2 / sumWeights;
          const meanY2 = sumWeightedY2 / sumWeights;
          
          const covariance = meanXY - (meanX * meanY);
          const stdX = Math.sqrt(Math.abs(meanX2 - (meanX * meanX)));
          const stdY = Math.sqrt(Math.abs(meanY2 - (meanY * meanY)));
          
          if (stdX > 0 && stdY > 0) {
            correlation = covariance / (stdX * stdY);
            correlation = Math.max(-1, Math.min(1, correlation));
          }
        }

        // Map correlation to score (0-100 scale)
        score = Math.max(0, Math.min(100, correlation * 100));

      } else if (scoringMethod === 'area') {
        // Method 4: Area Difference / Integral Difference
        let totalWeightedAreaDiff = 0;

        for (let i = 0; i < diffX.length - 1; i++) {
          const wavelength1 = diffX[i];
          const wavelength2 = diffX[i + 1];
          const weight = (this.getWeightForWavelength(wavelength1, abnormalityWeights) + 
                         this.getWeightForWavelength(wavelength2, abnormalityWeights)) / 2;
          
          // Trapezoidal rule for area under the difference curve
          const dx = Math.abs(wavelength2 - wavelength1);
          const avgAbsDelta = (Math.abs(delta[i]) + Math.abs(delta[i + 1])) / 2;
          const areaDiff = dx * avgAbsDelta;
          
          totalWeightedAreaDiff += weight * areaDiff;
        }

        // Convert to score (0-100, lower area diff = higher score)
        const areaDiff = totalWeightedAreaDiff;
        if (areaDiff <= 50) {
          score = 90 + (10 * (1 - areaDiff / 50));
        } else if (areaDiff <= 200) {
          score = 70 + (20 * (1 - (areaDiff - 50) / 150));
        } else if (areaDiff <= 500) {
          score = 40 + (30 * (1 - (areaDiff - 200) / 300));
        } else {
          score = Math.max(0, 40 * Math.exp(-(areaDiff - 500) / 300));
        }
      }

      scores[sample.filename] = Math.round(score);
    });

    return scores;
  }

  /**
   * Perform complete analysis for baseline and samples
   */
  public static performAnalysis(
    baseline: ParsedCSV,
    samples: ParsedCSV[],
    selectedSampleName?: string,
    abnormalityWeights: RangeWeight[] = [],
    scoringMethod: ScoringMethod = 'hybrid'
  ): AnalysisResult {
    
    const scores = this.calculateSampleScores(baseline, samples, abnormalityWeights, scoringMethod);
    const deviationData = this.calculateDeviationData(baseline, samples, selectedSampleName, abnormalityWeights, scoringMethod);
    
    return {
      scores,
      deviationData
    };
  }
}