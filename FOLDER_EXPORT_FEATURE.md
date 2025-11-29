# File System Access API Integration

## Overview

The FTIR Graphing App now supports the **File System Access API**, allowing users to choose a custom folder for exporting ZIP files instead of relying on the browser's default Downloads folder.

## Features

### 1. Custom Folder Selection
- Users can click "Export Graphs" to choose their preferred export location
- Files are saved as `FTIR_export.zip` in the selected folder
- If the file already exists, it will be overwritten (after user confirmation by browser)

### 2. Automatic Fallback
- If the browser doesn't support the API, the "Export Graphs" button is disabled
- Standard "Export" button always available for traditional Downloads folder export
- If folder selection fails or is cancelled, system falls back to standard download

### 3. User Experience
- Success toast notification: "Exported to folder successfully!"
- Error toast for permission denials or unsupported browsers
- Info toast when user cancels folder selection
- Visual tooltips explain button functionality

## Browser Compatibility

### ✅ Supported Browsers

| Browser | Minimum Version | Status |
|---------|----------------|--------|
| Chrome | 86+ | ✅ Full Support |
| Edge | 86+ | ✅ Full Support |
| Opera | 72+ | ✅ Full Support |
| Brave | Chromium-based | ✅ Full Support |

### ❌ Not Supported Browsers

| Browser | Status | Fallback |
|---------|--------|----------|
| Firefox | ❌ Not supported | Standard download |
| Safari | ❌ Not supported | Standard download |
| Internet Explorer | ❌ Not supported | Standard download |

## Implementation Details

### TypeScript Declarations

Custom TypeScript declarations added in `src/types/fileSystemAccess.d.ts`:
- `FileSystemHandle` - Base interface for file/directory handles
- `FileSystemFileHandle` - File-specific handle with write capabilities
- `FileSystemDirectoryHandle` - Directory handle for folder operations
- `FileSystemWritableFileStream` - Writable stream for file writing
- `window.showDirectoryPicker()` - Main API method for folder selection

### Utility Functions

Located in `src/utils/fileSystemAccess.ts`:

#### `checkFolderAccessSupported()`
```typescript
export const checkFolderAccessSupported = (): boolean
```
Checks if the File System Access API is available in the current browser.

#### `exportBlobToFolder(blob, filename)`
```typescript
export const exportBlobToFolder = async (
  blob: Blob,
  filename: string = 'FTIR_export.zip'
): Promise<void>
```
Exports a Blob to a user-selected folder using the File System Access API.

**Throws:**
- `Error('File System Access API is not supported')` - If API unavailable
- `AbortError` - If user cancels folder selection
- `NotAllowedError` - If permission is denied

#### `downloadBlobFallback(blob, filename)`
```typescript
export const downloadBlobFallback = (blob: Blob, filename: string): void
```
Traditional browser download fallback for unsupported browsers.

#### `exportBlob(blob, filename, useFolderPicker)`
```typescript
export const exportBlob = async (
  blob: Blob,
  filename: string,
  useFolderPicker: boolean = false
): Promise<{ method: 'folder' | 'download'; success: boolean }>
```
Smart export function with automatic fallback. Tries folder picker first if requested, falls back to standard download if unavailable or fails.

#### `getBrowserCompatibility()`
```typescript
export const getBrowserCompatibility = (): {
  browser: string;
  supported: boolean;
  recommendedBrowsers: string[];
}
```
Returns browser detection and compatibility information.

## Component Integration

### ExportDialog Component

Located in `src/components/ExportDialog.tsx`:

**New Features:**
- Two export buttons: "Export Graphs" (folder picker) and "Export" (standard download)
- "Export Graphs" button disabled in unsupported browsers
- Tooltips explain functionality and browser requirements
- Green color scheme for folder picker, blue for standard export
- Icons: folder icon for folder picker, download icon for standard

**User Flow:**
1. User selects samples and format
2. Clicks "Export Graphs" (if available) or "Export"
3. For folder picker:
   - Browser prompts for folder selection
   - User grants write permission
   - File written to selected folder
   - Success toast appears
4. For standard export:
   - ZIP downloads to default Downloads folder
   - Success toast appears

### ExportModal Component (Redesign)

Located in `src/components/redesign/ExportModal.tsx`:

Similar implementation with Tailwind CSS styling:
- Folder picker button shows folder emoji 📁
- Standard export button shows download emoji ⬇️
- Info banner explains both export options
- Conditional rendering based on browser support

## Security Considerations

### Browser Security Model
- **User Intent Required:** API only works with user gesture (button click)
- **Explicit Permission:** Browser always prompts for folder access permission
- **No Silent Writes:** Cannot write to arbitrary locations without user approval
- **Per-Session Permissions:** Permissions must be granted each time (no permanent access)

### Implementation Security
- No sensitive data stored or transmitted
- Blob content generated server-side from validated CSV inputs
- Only user-selected folders can be accessed
- File overwrites require implicit user consent via folder selection

### Docker/Localhost Compatibility
✅ Works correctly in containerized environments:
- No special configuration needed
- Browser permissions work same as production
- localhost:5173 and localhost:8080 fully supported

## Error Handling

### AbortError (User Cancellation)
```typescript
if (error.name === 'AbortError') {
  // User cancelled - show info toast, don't treat as error
  toast({ title: 'Export Cancelled', status: 'info' });
}
```

### NotAllowedError (Permission Denied)
```typescript
if (error.name === 'NotAllowedError') {
  // Permission denied - show error toast, suggest granting permission
  toast({ title: 'Permission Denied', status: 'error' });
}
```

### Other Errors
```typescript
catch (error) {
  // Log error and fall back to standard download
  console.error('Folder export failed:', error);
  downloadBlobFallback(blob, filename);
  toast({ title: 'Falling back to standard download', status: 'warning' });
}
```

## Testing

### Unit Tests
Located in `src/utils/__tests__/fileSystemAccess.test.ts`:

**Test Coverage:**
- ✅ Browser support detection
- ✅ Folder picker workflow
- ✅ Standard download fallback
- ✅ Error handling (AbortError, NotAllowedError)
- ✅ Browser detection
- ✅ Smart export with automatic fallback

### Manual Testing Checklist

#### Chrome/Edge (Supported)
- [ ] "Export Graphs" button is enabled
- [ ] Clicking shows folder picker dialog
- [ ] Granting permission writes file successfully
- [ ] Success toast appears
- [ ] File exists in selected folder
- [ ] Denying permission shows error toast
- [ ] Cancelling shows info toast
- [ ] Standard "Export" button still works

#### Firefox/Safari (Not Supported)
- [ ] "Export Graphs" button is disabled
- [ ] Tooltip explains browser limitation
- [ ] Standard "Export" button works
- [ ] Downloads to default folder
- [ ] Success toast appears

#### Docker Environment
- [ ] Folder picker works on localhost:5173
- [ ] Permissions dialog appears correctly
- [ ] File writes successfully
- [ ] No CORS or security issues

## Future Enhancements

### Potential Improvements
1. **Remember Last Folder** - Use `FileSystemHandle` persistence
2. **Batch Operations** - Multiple file exports to same folder
3. **Progress Indicators** - Show write progress for large files
4. **Folder Validation** - Check available space before writing
5. **Automatic Organization** - Create timestamped subfolders
6. **User Preferences** - Save default export method preference

### API Evolution
The File System Access API is actively evolving. Monitor:
- Firefox implementation progress
- Safari adoption timeline
- New API features (file system access tokens, etc.)
- Permission model changes

## Resources

### Official Documentation
- [MDN: File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API)
- [Web.dev: File System Access API](https://web.dev/file-system-access/)
- [Chromium Implementation Status](https://chromestatus.com/feature/6284708426022912)

### Browser Support
- [Can I Use: File System Access API](https://caniuse.com/native-filesystem-api)

### Security
- [File System Access API Security Considerations](https://wicg.github.io/file-system-access/#security-considerations)

## Troubleshooting

### "Export Graphs" button is grayed out
- Check browser compatibility (Chrome 86+, Edge 86+, Opera 72+)
- Ensure JavaScript is enabled
- Try reloading the page

### Folder picker doesn't appear
- Check browser permissions settings
- Ensure site has storage permissions
- Try clearing browser cache and cookies

### Permission denied error
- Grant folder access permission when prompted
- Check if folder is read-only
- Try selecting a different folder

### File not appearing in selected folder
- Check folder permissions
- Verify sufficient disk space
- Look for overwritten existing file
- Check Downloads folder as fallback

## Changelog

### Version 1.0.0 (Initial Release)
- ✅ File System Access API integration
- ✅ TypeScript declarations
- ✅ Utility functions with error handling
- ✅ Component integration (ExportDialog, ExportModal)
- ✅ Automatic fallback mechanism
- ✅ Comprehensive documentation
- ✅ Unit tests
- ✅ README updates

---

**Note:** This feature enhances user experience without breaking existing functionality. All users can still use standard download regardless of browser support.
