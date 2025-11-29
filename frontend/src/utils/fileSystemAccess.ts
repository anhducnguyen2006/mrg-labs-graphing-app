/**
 * Utility functions for File System Access API
 * Provides folder picker and file writing capabilities for modern browsers
 */

/**
 * Check if File System Access API is supported in the current browser
 * @returns true if showDirectoryPicker is available, false otherwise
 */
export const checkFolderAccessSupported = (): boolean => {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
};

/**
 * Export a Blob to a user-selected folder using File System Access API
 * @param blob - The Blob to export (e.g., ZIP file)
 * @param filename - The name of the file to create (default: 'FTIR_export.zip')
 * @returns Promise that resolves when the file is written
 * @throws Error if the API is not supported, user cancels, or permissions are denied
 */
export const exportBlobToFolder = async (
  blob: Blob,
  filename: string = 'FTIR_export.zip'
): Promise<void> => {
  if (!checkFolderAccessSupported()) {
    throw new Error('File System Access API is not supported in this browser');
  }

  try {
    // Request directory picker
    const dirHandle = await window.showDirectoryPicker({
      mode: 'readwrite',
      startIn: 'downloads'
    });

    // Create or overwrite the file
    const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
    const writable = await fileHandle.createWritable();
    
    // Write the blob
    await writable.write(blob);
    await writable.close();
  } catch (error: any) {
    // Re-throw with more context
    if (error.name === 'AbortError') {
      const abortError = new Error('User cancelled folder selection');
      abortError.name = 'AbortError';
      throw abortError;
    }

    if (error.name === 'NotAllowedError') {
      const permissionError = new Error('Permission denied to write to folder');
      permissionError.name = 'NotAllowedError';
      throw permissionError;
    }

    throw error;
  }
};

/**
 * Fallback download method for browsers without File System Access API
 * Uses traditional browser download mechanism
 * @param blob - The Blob to download
 * @param filename - The name of the file to download
 */
export const downloadBlobFallback = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  setTimeout(() => {
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }, 100);
};

/**
 * Export a Blob with automatic fallback to standard download
 * Tries File System Access API first, falls back to standard download if unavailable
 * @param blob - The Blob to export
 * @param filename - The name of the file
 * @param useFolderPicker - Whether to use folder picker (if supported)
 * @returns Promise that resolves when export is complete
 */
export const exportBlob = async (
  blob: Blob,
  filename: string,
  useFolderPicker: boolean = false
): Promise<{ method: 'folder' | 'download'; success: boolean }> => {
  if (useFolderPicker && checkFolderAccessSupported()) {
    try {
      await exportBlobToFolder(blob, filename);
      return { method: 'folder', success: true };
    } catch (error: any) {
      // If user cancelled, just return
      if (error.name === 'AbortError') {
        return { method: 'folder', success: false };
      }
      // For other errors, fall back to standard download
      console.warn('Folder export failed, falling back to standard download:', error);
    }
  }
  
  // Fallback to standard download
  downloadBlobFallback(blob, filename);
  return { method: 'download', success: true };
};

/**
 * Get browser compatibility information
 * @returns Object with browser name and File System Access API support status
 */
export const getBrowserCompatibility = (): {
  browser: string;
  supported: boolean;
  recommendedBrowsers: string[];
} => {
  const supported = checkFolderAccessSupported();
  const recommendedBrowsers = [
    'Chrome 86+',
    'Edge 86+',
    'Opera 72+',
    'Brave (Chromium-based)'
  ];

  // Detect browser
  const userAgent = navigator.userAgent.toLowerCase();
  let browser = 'Unknown';
  
  if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
    browser = 'Chrome';
  } else if (userAgent.includes('edg')) {
    browser = 'Edge';
  } else if (userAgent.includes('opr') || userAgent.includes('opera')) {
    browser = 'Opera';
  } else if (userAgent.includes('brave')) {
    browser = 'Brave';
  } else if (userAgent.includes('firefox')) {
    browser = 'Firefox';
  } else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
    browser = 'Safari';
  }

  return {
    browser,
    supported,
    recommendedBrowsers
  };
};
