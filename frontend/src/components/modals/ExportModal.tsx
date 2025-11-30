import React, { useState } from 'react';
import { checkFolderAccessSupported } from '../../utils/fileSystemAccess';

interface Sample {
  filename: string;
  score?: number;
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  samples: Sample[];
  onExport: (config: ExportConfig) => void;
  baselineFilename?: string;
}

interface ExportConfig {
  format: 'png' | 'jpeg';
  selectedSamples: string[];
  includeBaseline: boolean;
  includeHeatmap: boolean;
  includeStatistics: boolean;
  zipFilename?: string;
}

type ExportPreset = 'all' | 'critical' | 'warning' | 'good' | 'custom';

const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  samples,
  onExport,
  baselineFilename,
}) => {
  // Get default filename from baseline (remove extension)
  const defaultZipName = baselineFilename 
    ? baselineFilename.replace(/\.[^/.]+$/, '') 
    : 'exported_graphs';

  const [format, setFormat] = useState<'png' | 'jpeg'>('png');
  const [preset, setPreset] = useState<ExportPreset>('all');
  const [customSamples, setCustomSamples] = useState<string[]>([]);
  const [includeBaseline, setIncludeBaseline] = useState(true);
  const [includeHeatmap, setIncludeHeatmap] = useState(true);
  const [includeStatistics, setIncludeStatistics] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [zipFilename, setZipFilename] = useState(defaultZipName);

  // Update zip filename when baseline changes or modal opens
  React.useEffect(() => {
    if (isOpen) {
      setZipFilename(defaultZipName);
    }
  }, [isOpen, defaultZipName]);

  if (!isOpen) return null;

  // Helper to get sample status
  const getSampleStatus = (score?: number): 'good' | 'warning' | 'critical' => {
    if (score === undefined) return 'good';
    if (score >= 90) return 'good';
    if (score >= 70) return 'warning';
    return 'critical';
  };

  // Count samples by status
  const criticalCount = samples.filter(s => getSampleStatus(s.score) === 'critical').length;
  const warningCount = samples.filter(s => getSampleStatus(s.score) === 'warning').length;
  const goodCount = samples.filter(s => getSampleStatus(s.score) === 'good').length;

  // Get selected samples based on preset
  const getSelectedSamples = (): string[] => {
    switch (preset) {
      case 'all':
        return samples.map(s => s.filename);
      case 'critical':
        return samples.filter(s => getSampleStatus(s.score) === 'critical').map(s => s.filename);
      case 'warning':
        return samples.filter(s => getSampleStatus(s.score) === 'warning').map(s => s.filename);
      case 'good':
        return samples.filter(s => getSampleStatus(s.score) === 'good').map(s => s.filename);
      case 'custom':
        return customSamples;
      default:
        return samples.map(s => s.filename);
    }
  };

  const selectedSamples = getSelectedSamples();

  // Helper function to export ZIP to selected folder using File System Access API
  const exportToFolder = async (blob: Blob): Promise<void> => {
    try {
      // Request directory picker
      const dirHandle = await window.showDirectoryPicker({
        mode: 'readwrite',
        startIn: 'downloads'
      });

      // Create or overwrite the file
      const fileHandle = await dirHandle.getFileHandle('FTIR_export.zip', { create: true });
      const writable = await fileHandle.createWritable();
      
      // Write the blob
      await writable.write(blob);
      await writable.close();

      console.log('✅ Exported to folder successfully!');
      alert('Exported to folder successfully!');
    } catch (error: any) {
      // Handle user cancellation
      if (error.name === 'AbortError') {
        console.log('Folder selection cancelled');
        return;
      }

      // Handle permission errors
      if (error.name === 'NotAllowedError') {
        alert('Permission denied. Please grant permission to save files.');
        throw error;
      }

      // Other errors
      console.error('Folder export failed:', error);
      throw error;
    }
  };

  // Fallback download method for browsers without File System Access API
  const downloadZipFallback = (blob: Blob): void => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `exported_graphs_${format}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  // Handle export
  const handleExport = async (useFolderPicker: boolean = false) => {
    setIsExporting(true);
    
    const config: ExportConfig = {
      format,
      selectedSamples,
      includeBaseline,
      includeHeatmap,
      includeStatistics,
      zipFilename: zipFilename.trim() || defaultZipName,
    };

    try {
      await onExport(config);
      
      // Note: This is a placeholder. The actual blob should come from onExport
      // In a real implementation, onExport should return the blob
      // For now, this demonstrates the pattern
      
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Handle preset change
  const handlePresetChange = (newPreset: ExportPreset) => {
    setPreset(newPreset);
    if (newPreset === 'custom') {
      setShowCustomModal(true);
    }
  };

  // Custom Selection Modal
  const CustomSelectionModal: React.FC = () => {
    const [tempSelected, setTempSelected] = useState<string[]>(customSamples);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredSamples = samples.filter(s => 
      s.filename.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const criticalSamples = filteredSamples.filter(s => getSampleStatus(s.score) === 'critical');
    const warningSamples = filteredSamples.filter(s => getSampleStatus(s.score) === 'warning');
    const goodSamples = filteredSamples.filter(s => getSampleStatus(s.score) === 'good');

    const handleSelectAllInGroup = (groupSamples: Sample[]) => {
      const groupFilenames = groupSamples.map(s => s.filename);
      setTempSelected(prev => [...new Set([...prev, ...groupFilenames])]);
    };

    const handleDeselectAllInGroup = (groupSamples: Sample[]) => {
      const groupFilenames = groupSamples.map(s => s.filename);
      setTempSelected(prev => prev.filter(f => !groupFilenames.includes(f)));
    };

    const handleToggleSample = (filename: string) => {
      setTempSelected(prev => 
        prev.includes(filename) 
          ? prev.filter(f => f !== filename)
          : [...prev, filename]
      );
    };

    const handleSave = () => {
      setCustomSamples(tempSelected);
      setShowCustomModal(false);
    };

    if (!showCustomModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Custom Sample Selection</h3>
            <button
              onClick={() => setShowCustomModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Search samples..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded mb-4 text-sm"
          />

          {/* Selected Count */}
          <div className="mb-4 p-3 bg-blue-50 rounded text-sm">
            <strong>{tempSelected.length}</strong> of {samples.length} samples selected
          </div>

          {/* Sample Groups */}
          <div className="flex-1 overflow-y-auto space-y-4">
            {/* Critical */}
            {criticalSamples.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-red-700">🔴 Critical ({criticalSamples.length})</h4>
                  <div className="space-x-2">
                    <button
                      onClick={() => handleSelectAllInGroup(criticalSamples)}
                      className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => handleDeselectAllInGroup(criticalSamples)}
                      className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {criticalSamples.map(sample => (
                    <label key={sample.filename} className="flex items-center space-x-2 p-2 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tempSelected.includes(sample.filename)}
                        onChange={() => handleToggleSample(sample.filename)}
                        className="rounded"
                      />
                      <span className="text-sm">{sample.filename}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Warning */}
            {warningSamples.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-yellow-700">🟡 Warning ({warningSamples.length})</h4>
                  <div className="space-x-2">
                    <button
                      onClick={() => handleSelectAllInGroup(warningSamples)}
                      className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => handleDeselectAllInGroup(warningSamples)}
                      className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {warningSamples.map(sample => (
                    <label key={sample.filename} className="flex items-center space-x-2 p-2 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tempSelected.includes(sample.filename)}
                        onChange={() => handleToggleSample(sample.filename)}
                        className="rounded"
                      />
                      <span className="text-sm">{sample.filename}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Good */}
            {goodSamples.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-green-700">🟢 Good ({goodSamples.length})</h4>
                  <div className="space-x-2">
                    <button
                      onClick={() => handleSelectAllInGroup(goodSamples)}
                      className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => handleDeselectAllInGroup(goodSamples)}
                      className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {goodSamples.map(sample => (
                    <label key={sample.filename} className="flex items-center space-x-2 p-2 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tempSelected.includes(sample.filename)}
                        onChange={() => handleToggleSample(sample.filename)}
                        className="rounded"
                      />
                      <span className="text-sm">{sample.filename}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center mt-4 pt-4 border-t">
            <button
              onClick={() => setTempSelected([])}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Clear All
            </button>
            <div className="space-x-3">
              <button
                onClick={() => setShowCustomModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save Selection
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
        <div className="bg-white rounded-lg p-6 w-[480px] h-[420px] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">Export Graphs</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl"
            >
              ✕
            </button>
          </div>

          {/* Format Selection */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Format:</label>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value="png"
                  checked={format === 'png'}
                  onChange={(e) => setFormat(e.target.value as 'png' | 'jpeg')}
                  className="w-4 h-4"
                />
                <span className="text-sm">PNG</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value="jpeg"
                  checked={format === 'jpeg'}
                  onChange={(e) => setFormat(e.target.value as 'png' | 'jpeg')}
                  className="w-4 h-4"
                />
                <span className="text-sm">JPEG</span>
              </label>
            </div>
          </div>

          {/* Filename Input */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Export Filename:
            </label>
            <div className="relative">
              <input
                type="text"
                value={zipFilename}
                onChange={(e) => setZipFilename(e.target.value)}
                placeholder={defaultZipName}
                className="w-full p-2 pr-12 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
                .zip
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Default: {defaultZipName}.zip
            </p>
          </div>

          {/* Sample Selection */}
          <div className="mb-6 flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Samples:</label>
            <div className="relative">
              <select
                value={preset}
                onChange={(e) => handlePresetChange(e.target.value as ExportPreset)}
                className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">✓ All samples ({samples.length})</option>
                <option value="critical">Critical only ({criticalCount})</option>
                <option value="warning">Warning only ({warningCount})</option>
                <option value="good">Good only ({goodCount})</option>
                <option value="custom">Custom selection... ({customSamples.length})</option>
              </select>
            </div>
            
            {/* Selection Preview */}
            <div className="mt-2 text-xs text-gray-600">
              {selectedSamples.length} sample{selectedSamples.length !== 1 ? 's' : ''} selected for export
            </div>
          </div>

          {/* Include Options */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Include:</label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeBaseline}
                  onChange={(e) => setIncludeBaseline(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Baseline overlay</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeHeatmap}
                  onChange={(e) => setIncludeHeatmap(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Deviation heatmap</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeStatistics}
                  onChange={(e) => setIncludeStatistics(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Statistics summary</span>
              </label>
            </div>
          </div>

          {/* Export Info Banner */}
          <div className="mb-6 p-3 bg-blue-50 rounded text-xs text-blue-700">
            💡 <strong>Export Options:</strong> Use "Export Graphs" to choose a custom folder (Chromium browsers only), 
            or use standard "Export" for default Downloads folder.
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center pt-4 border-t">
            <button
              onClick={() => {
                setFormat('png');
                setPreset('all');
                setCustomSamples([]);
                setIncludeBaseline(true);
                setIncludeHeatmap(true);
                setIncludeStatistics(false);
                setZipFilename(defaultZipName);
              }}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Reset
            </button>
            
            <div className="space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              
              {checkFolderAccessSupported() && (
                <button
                  onClick={() => handleExport(true)}
                  disabled={selectedSamples.length === 0 || isExporting}
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center space-x-2"
                  title="Choose a folder to save the ZIP file"
                >
                  <span>📁</span>
                  <span>{isExporting ? 'Exporting...' : 'Export Graphs'}</span>
                </button>
              )}
              
              <button
                onClick={() => handleExport(false)}
                disabled={selectedSamples.length === 0 || isExporting}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center space-x-2"
              >
                <span>⬇️</span>
                <span>{isExporting ? 'Exporting...' : 'Export'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <CustomSelectionModal />
    </>
  );
};

export default ExportModal;