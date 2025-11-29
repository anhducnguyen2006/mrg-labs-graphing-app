import React from 'react';

interface RangeWeight {
  min: number;
  max: number;
  weight: number;
  label: string;
  key: string;
}

interface DeviationHeatmapProps {
  x: number[];
  deviation: number[];
  selectedSampleName?: string;
  maxDeviation?: number;
  avgDeviation?: number;
  abnormalityWeights?: RangeWeight[];
  onConfigureWeights: () => void;
  className?: string;
}

const DeviationHeatmap: React.FC<DeviationHeatmapProps> = ({
  x,
  deviation,
  selectedSampleName,
  maxDeviation,
  avgDeviation,
  abnormalityWeights = [],
  onConfigureWeights,
  className = '',
}) => {
  const hasData = x.length > 0 && deviation.length > 0;

  // Calculate statistics if not provided
  const calculatedMaxDeviation = maxDeviation ?? (hasData ? Math.max(...deviation) : 0);
  const calculatedAvgDeviation = avgDeviation ?? (hasData ? 
    deviation.reduce((sum, val) => sum + val, 0) / deviation.length : 0);

  // Generate color for deviation value
  const getColor = (value: number): string => {
    if (calculatedMaxDeviation === 0) return '#10B981'; // Green if no deviation
    
    const normalized = value / calculatedMaxDeviation;
    
    if (normalized <= 0.33) {
      // Green to Yellow (0-33%)
      const ratio = normalized / 0.33;
      const red = Math.round(255 * ratio);
      const green = 255;
      return `rgb(${red}, ${green}, 0)`;
    } else if (normalized <= 0.66) {
      // Yellow to Orange (33-66%)
      const ratio = (normalized - 0.33) / 0.33;
      const red = 255;
      const green = Math.round(255 * (1 - ratio * 0.5));
      return `rgb(${red}, ${green}, 0)`;
    } else {
      // Orange to Red (66-100%)
      const ratio = (normalized - 0.66) / 0.34;
      const red = 255;
      const green = Math.round(127 * (1 - ratio));
      return `rgb(${red}, ${green}, 0)`;
    }
  };

  // Create gradient segments
  const createGradientSegments = () => {
    if (!hasData) return [];
    
    const segments = [];
    const segmentWidth = 100 / x.length;
    
    for (let i = 0; i < x.length; i++) {
      const color = getColor(deviation[i]);
      const left = i * segmentWidth;
      const deviationPercent = ((deviation[i] / calculatedMaxDeviation) * 100).toFixed(1);
      
      segments.push(
        <div
          key={i}
          className="absolute h-full transition-all duration-150 cursor-crosshair hover:scale-y-110 hover:z-10 hover:shadow-md hover:brightness-110"
          style={{
            left: `${left}%`,
            width: `${segmentWidth}%`,
            backgroundColor: color,
          }}
          title={`${Math.round(x[i])} cm⁻¹\nDeviation: ${deviation[i].toFixed(4)} (${deviationPercent}% of max)`}
        />
      );
    }
    
    return segments;
  };

  // Create wavelength markers
  const createWavelengthMarkers = () => {
    if (!hasData) return [];
    
    const markers: JSX.Element[] = [];
    const minX = Math.min(...x);
    const maxX = Math.max(...x);
    const range = maxX - minX;
    
    const customXTicks = [4000, 3500, 3000, 2500, 2000, 1500, 1000, 750, 550];
    
    customXTicks.forEach((wavelength) => {
      if (wavelength >= minX && wavelength <= maxX) {
        const position = ((maxX - wavelength) / range) * 100;
        
        markers.push(
          <div
            key={wavelength}
            className="absolute transform -translate-x-1/2"
            style={{ left: `${position}%` }}
          >
            <div className="absolute bottom-5 left-1/2 w-px h-20 bg-gray-400 opacity-30" />
            <span className="text-xs font-medium text-gray-700 whitespace-nowrap bg-white px-1 rounded-sm">
              {wavelength}
            </span>
          </div>
        );
      }
    });
    
    return markers;
  };

  // Create weight range backgrounds
  const createWeightRanges = () => {
    if (!abnormalityWeights || abnormalityWeights.length === 0 || !hasData) return null;

    const minX = Math.min(...x);
    const maxX = Math.max(...x);
    const range = maxX - minX;
    
    return abnormalityWeights.map((weightRange, index) => {
      const rangeStart = Math.max(weightRange.min, minX);
      const rangeEnd = Math.min(weightRange.max, maxX);
      
      if (rangeStart >= rangeEnd) return null;
      
      const startPercent = ((maxX - rangeEnd) / range) * 100;
      const endPercent = ((maxX - rangeStart) / range) * 100;
      const widthPercent = endPercent - startPercent;
      
      const weightIntensity = weightRange.weight / 100;
      const alpha = 0.2 + (weightIntensity * 0.3);
      
      const colors: Record<string, string> = {
        'range_evaporation': `rgba(255, 99, 71, ${alpha})`,
        'range_other': `rgba(255, 165, 0, ${alpha})`,
        'range_oxidation': `rgba(255, 20, 147, ${alpha})`
      };
      
      const color = colors[weightRange.key] || `rgba(128, 128, 128, ${alpha})`;
      
      return (
        <div
          key={index}
          className="absolute h-full border-l border-black border-opacity-20"
          style={{
            left: `${startPercent}%`,
            width: `${widthPercent}%`,
            backgroundColor: color,
          }}
          title={`${weightRange.label}: ${weightRange.weight}% weight`}
        />
      );
    }).filter(Boolean);
  };

  return (
    <div className={`h-[250px] bg-white border border-gray-200 rounded-xl shadow-sm p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-6">
          <h3 className="text-lg font-bold text-gray-800">DEVIATION HEATMAP</h3>
          
          {hasData && (
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <span className="font-medium text-gray-600">Max: </span>
                <span className={`font-bold ${calculatedMaxDeviation > 0.02 ? 'text-red-500' : calculatedMaxDeviation > 0.01 ? 'text-yellow-500' : 'text-green-500'}`}>
                  {calculatedMaxDeviation.toFixed(4)}
                </span>
              </div>
              
              <div className="text-sm">
                <span className="font-medium text-gray-600">Avg: </span>
                <span className="font-semibold text-gray-600">
                  {calculatedAvgDeviation.toFixed(4)}
                </span>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onConfigureWeights}
          className="px-3 py-1 text-sm font-medium text-purple-700 bg-white border border-purple-300 rounded-md hover:bg-purple-50 transition-colors"
        >
          Configure Weights
        </button>
      </div>

      {/* Heatmap Visualization */}
      {hasData ? (
        <div className="space-y-4">
          {/* Wavelength Labels */}
          <div className="relative h-6 mb-1">
            {createWavelengthMarkers()}
          </div>
          
          {/* Main Heatbar */}
          <div className="relative h-[120px] border-2 border-gray-400 rounded-lg overflow-visible bg-white shadow-md">
            {/* Weight ranges background */}
            {createWeightRanges()}
            {/* Deviation gradient overlay */}
            {createGradientSegments()}
          </div>
          
          {/* Axis Label */}
          <div className="text-center">
            <span className="text-sm font-semibold text-gray-700">
              Wavenumber (cm⁻¹)
            </span>
          </div>

          {/* Sample Badge */}
          {selectedSampleName && (
            <div className="flex justify-center">
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                {selectedSampleName.replace(/\.csv$/i, '')}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center h-[180px]">
          <div className="text-center">
            <div className="text-4xl mb-3">🌡️</div>
            <p className="text-lg font-medium text-gray-700 mb-2">Deviation Heatmap</p>
            <p className="text-sm text-gray-500">
              Upload baseline and sample data to see deviation analysis
            </p>
          </div>
        </div>
      )}

      {/* Help Text */}
      {hasData && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            💡 Hover for wavelength + deviation value
          </p>
        </div>
      )}
    </div>
  );
};

export default DeviationHeatmap;