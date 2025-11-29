import React, { useState } from 'react';

interface RangeWeight {
  min: number;
  max: number;
  weight: number;
  label: string;
  key: string;
}

interface Zone {
  name: string;
  range: [number, number];
  defaultWeight: number;
  key: string;
  emoji: string;
  description: string;
}

interface WeightConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (weights: RangeWeight[]) => void;
  initialWeights?: RangeWeight[];
}

type Preset = 'default' | 'high-sensitivity' | 'custom';

const WeightConfigModal: React.FC<WeightConfigModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialWeights = [],
}) => {
  // Define zones with fixed ranges
  const zones: Zone[] = [
    {
      name: 'Baseline Region',
      range: [4000, 2750],
      defaultWeight: 10,
      key: 'range_starting',
      emoji: '🟢',
      description: 'Normal grease signature, low importance'
    },
    {
      name: 'Evaporation Zone',
      range: [2750, 2000],
      defaultWeight: 20,
      key: 'range_evaporation',
      emoji: '🟡',
      description: 'Detects loss of volatile components'
    },
    {
      name: 'Intermediate Zone',
      range: [2000, 1750],
      defaultWeight: 10,
      key: 'range_other',
      emoji: '🟠',
      description: 'Mixed signals, low priority'
    },
    {
      name: 'Oxidation Zone',
      range: [1750, 550],
      defaultWeight: 60,
      key: 'range_oxidation',
      emoji: '🔴',
      description: 'Critical for detecting grease degradation'
    }
  ];

  // State
  const [preset, setPreset] = useState<Preset>('default');
  const [weights, setWeights] = useState<number[]>(zones.map(z => z.defaultWeight));
  const [weightInputs, setWeightInputs] = useState<string[]>(zones.map(z => z.defaultWeight.toString()));

  if (!isOpen) return null;

  // Calculate total weight
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  const isValid = totalWeight === 100 && weightInputs.every(input => {
    const num = parseInt(input, 10);
    return !isNaN(num) && num >= 1 && num <= 97;
  });

  // Preset configurations
  const presetConfigs = {
    default: [10, 20, 10, 60],
    'high-sensitivity': [5, 15, 5, 75],
    custom: weights
  };

  // Handle preset change
  const handlePresetChange = (newPreset: Preset) => {
    setPreset(newPreset);
    if (newPreset !== 'custom') {
      const newWeights = presetConfigs[newPreset];
      setWeights(newWeights);
      setWeightInputs(newWeights.map(w => w.toString()));
    }
  };

  // Handle weight input change
  const handleWeightInputChange = (index: number, value: string) => {
    // Allow only digits and empty string
    if (!/^\d*$/.test(value)) return;

    setWeightInputs(prev => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });

    // Update numeric weights if valid
    if (value !== '') {
      const numValue = parseInt(value, 10);
      if (!isNaN(numValue) && numValue >= 1 && numValue <= 97) {
        setWeights(prev => {
          const updated = [...prev];
          updated[index] = numValue;
          return updated;
        });
      }
    }

    // Mark as custom if user is typing
    if (preset !== 'custom') {
      setPreset('custom');
    }
  };

  // Handle weight input blur (commit value)
  const handleWeightInputBlur = (index: number) => {
    const current = weightInputs[index];
    const numValue = parseInt(current, 10);
    const clamped = isNaN(numValue) ? 1 : Math.max(1, Math.min(97, numValue));
    
    setWeights(prev => {
      const updated = [...prev];
      updated[index] = clamped;
      return updated;
    });
    
    setWeightInputs(prev => {
      const updated = [...prev];
      updated[index] = clamped.toString();
      return updated;
    });
  };

  // Handle save
  const handleSave = () => {
    if (!isValid) return;

    const rangeWeights: RangeWeight[] = zones.map((zone, index) => ({
      min: zone.range[1], // Note: ranges are [max, min] for IR convention
      max: zone.range[0],
      weight: weights[index],
      label: `${zone.name} (${zone.range[0]}-${zone.range[1]} cm⁻¹)`,
      key: zone.key
    }));

    onSave(rangeWeights);
    onClose();
  };

  // Handle reset
  const handleReset = () => {
    handlePresetChange('default');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-[640px] max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Configure Interval Weights</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Preset Selector */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">Presets:</label>
          <div className="flex space-x-2">
            <button
              onClick={() => handlePresetChange('default')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                preset === 'default'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Default
            </button>
            <button
              onClick={() => handlePresetChange('high-sensitivity')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                preset === 'high-sensitivity'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              High Oxidation Sensitivity
            </button>
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                preset === 'custom'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Custom
            </button>
          </div>
        </div>

        {/* Zone Cards */}
        <div className="space-y-4 mb-6">
          {zones.map((zone, index) => {
            const weight = weights[index];
            const inputValue = weightInputs[index];
            const isInputValid = inputValue !== '' && !isNaN(parseInt(inputValue, 10)) && 
              parseInt(inputValue, 10) >= 1 && parseInt(inputValue, 10) <= 97;

            return (
              <div
                key={zone.key}
                className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-2xl">{zone.emoji}</span>
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {zone.name} ({zone.range[0]}-{zone.range[1]} cm⁻¹)
                        </h3>
                        <p className="text-xs text-gray-600">💡 {zone.description}</p>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-5">
                        <div
                          className={`h-5 rounded-full transition-all duration-300 ${
                            zone.emoji === '🟢' ? 'bg-green-500' :
                            zone.emoji === '🟡' ? 'bg-yellow-500' :
                            zone.emoji === '🟠' ? 'bg-orange-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(100, weight)}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{weight}%</div>
                    </div>
                  </div>

                  <div className="ml-6">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Weight</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => handleWeightInputChange(index, e.target.value)}
                        onBlur={() => handleWeightInputBlur(index)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleWeightInputBlur(index);
                          }
                        }}
                        className={`w-20 px-3 py-2 text-center border rounded-md focus:ring-2 focus:ring-blue-500 ${
                          !isInputValid ? 'border-red-400' : 'border-gray-300'
                        }`}
                        min="1"
                        max="97"
                      />
                      <div className="flex flex-col">
                        <button
                          onClick={() => {
                            const newValue = Math.min(97, weight + 1);
                            setWeights(prev => {
                              const updated = [...prev];
                              updated[index] = newValue;
                              return updated;
                            });
                            setWeightInputs(prev => {
                              const updated = [...prev];
                              updated[index] = newValue.toString();
                              return updated;
                            });
                            setPreset('custom');
                          }}
                          className="w-6 h-4 bg-gray-200 hover:bg-gray-300 rounded-t text-xs flex items-center justify-center"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => {
                            const newValue = Math.max(1, weight - 1);
                            setWeights(prev => {
                              const updated = [...prev];
                              updated[index] = newValue;
                              return updated;
                            });
                            setWeightInputs(prev => {
                              const updated = [...prev];
                              updated[index] = newValue.toString();
                              return updated;
                            });
                            setPreset('custom');
                          }}
                          className="w-6 h-4 bg-gray-200 hover:bg-gray-300 rounded-b text-xs flex items-center justify-center"
                        >
                          ▼
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Total Weight Display */}
        <div className={`p-4 rounded-lg border-2 mb-6 ${
          isValid ? 'border-gray-200 bg-white' : 'border-red-400 bg-red-50'
        }`}>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600">Total Weight:</span>
            <div className="text-right">
              <span className={`text-lg font-bold ${isValid ? 'text-gray-800' : 'text-red-600'}`}>
                {totalWeight} / 100
              </span>
              {!isValid && <span className="ml-2">⚠️</span>}
              {isValid && <span className="ml-2 text-green-600">✓</span>}
            </div>
          </div>
          {!isValid && (
            <p className="text-xs text-red-600 mt-1">
              Total must equal 100% and all weights must be between 1-97%
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t">
          <button
            onClick={handleReset}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Reset to Default
          </button>
          
          <div className="space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!isValid}
              className="px-6 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeightConfigModal;