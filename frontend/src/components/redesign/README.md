# FTIR Dashboard Redesign - Component Structure

## File Structure
```
frontend/src/components/redesign/
├── RedesignedDashboard.tsx          # Main dashboard layout
├── TopBar.tsx                       # Top navigation with status pills
├── StatusPills.tsx                  # Good/Warning/Critical status buttons
├── SampleSidebar.tsx                # Auto-grouped sample list
├── ScoreCard.tsx                    # Prominent score display (NEW)
├── FTIRGraph.tsx                    # Enhanced spectral graph
├── DeviationHeatmap.tsx             # Simplified heatmap
├── ExportModal.tsx                  # Smart preset export dialog
├── WeightConfigModal.tsx            # Zone-based weight configuration
└── index.ts                         # Component exports
```

## Key Component Features

### TopBar
- Fixed 60px height with status pills
- Clickable status counts that filter sidebar
- Export button and user menu

### StatusPills  
- Live counts: 🟢 Good, 🟡 Warning, 🔴 Critical
- Critical pill has pulse animation
- Filters sidebar when clicked

### ScoreCard (NEW)
- 240px height, placed above graphs
- Progress bar with animated fill
- Status determined by score thresholds
- Inline scoring method selector

### SampleSidebar
- Auto-groups samples by status
- Critical samples always expanded (red background)
- Warning/Good collapsed by default
- 3 sort options (not 6)

### FTIRGraph
- Enhanced with inline toolbar
- Grid/Zoom/Export controls above canvas
- 700px height for better visibility

### DeviationHeatmap
- Simplified to 250px height (was 600px+)
- Shows only Max/Avg stats in header
- Removed: legend, instructions, statistics cards

### ExportModal
- Smart presets: All, Critical Only, Warning Only, Good Only
- Custom selection opens separate modal
- Fixed 420px height (no scrolling)

### WeightConfigModal
- Zone-based interface with 4 fixed ranges
- 3 presets: Default, High Sensitivity, Custom
- Progress bars for each zone weight
- Live total weight validation

## Integration Notes

### State Management
The RedesignedDashboard component manages all state and passes down props. In a real implementation, consider:
- Redux/Zustand for complex state
- React Query for server state
- Context for theme/user preferences

### Chart.js Integration
FTIRGraph uses react-chartjs-2 but has TypeScript type issues. Fix by:
- Updating to latest Chart.js version
- Using proper TypeScript configuration
- Adding chartjs-adapter-date-fns if needed

### Styling System
All components use Tailwind classes following the design tokens:
- Colors: green-500 (good), yellow-500 (warning), red-500 (critical)
- Spacing: 4px, 8px, 12px, 16px, 24px, 32px scale
- Typography: 12px (caption), 14px (body), 18px+ (headings)

### Accessibility
- ARIA labels on status pills and progress bars
- Keyboard navigation support
- Sufficient color contrast ratios
- Screen reader friendly structure

## Implementation Priority

### Phase 1: Core Layout
1. TopBar with StatusPills
2. ScoreCard component  
3. Auto-grouped SampleSidebar

### Phase 2: Enhanced Components
4. FTIRGraph with toolbar
5. Simplified DeviationHeatmap
6. ExportModal with presets

### Phase 3: Configuration
7. WeightConfigModal with zones
8. Integration testing
9. Responsive refinements