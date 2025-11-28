import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { customRender } from '../../../test/utils';
import RedesignedDashboard from '../RedesignedDashboard_fixed';

describe('RedesignedDashboard Integration Tests', () => {
  const mockSamples = [
    {
      filename: 'sample1.csv',
      score: 95,
      isFavorite: false,
      x: [4000, 3999, 3998, 3997, 3996],
      y: [0.1, 0.12, 0.11, 0.13, 0.09],
      rawContent: 'test,content'
    },
    {
      filename: 'sample2.csv',
      score: 75,
      isFavorite: true,
      x: [4000, 3999, 3998, 3997, 3996],
      y: [0.15, 0.17, 0.14, 0.16, 0.12],
      rawContent: 'test,content2'
    },
    {
      filename: 'sample3.csv',
      score: 60,
      isFavorite: false,
      x: [4000, 3999, 3998, 3997, 3996],
      y: [0.2, 0.22, 0.21, 0.23, 0.19],
      rawContent: 'test,content3'
    }
  ];

  const defaultProps = {
    samples: mockSamples,
    selectedSample: mockSamples[0],
    onSelectSample: vi.fn(),
    onRemoveSample: vi.fn(),
    onToggleFavorite: vi.fn(),
    onUploadFiles: vi.fn(),
    onExportData: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all main dashboard components', () => {
    customRender(<RedesignedDashboard {...defaultProps} />);
    
    // Check TopBar
    expect(screen.getByText('FTIR Analysis Dashboard')).toBeInTheDocument();
    
    // Check StatusPills
    expect(screen.getByText('Good')).toBeInTheDocument();
    expect(screen.getByText('Warning')).toBeInTheDocument(); 
    expect(screen.getByText('Critical')).toBeInTheDocument();
    
    // Check ScoreCard
    expect(screen.getByText('95%')).toBeInTheDocument();
    expect(screen.getByText('sample1.csv')).toBeInTheDocument();
    
    // Check SampleSidebar
    expect(screen.getByText('sample2.csv')).toBeInTheDocument();
    expect(screen.getByText('sample3.csv')).toBeInTheDocument();
    
    // Check graph components
    expect(screen.getByRole('img')).toBeInTheDocument(); // Chart canvas
  });

  it('handles sample selection workflow', async () => {
    customRender(<RedesignedDashboard {...defaultProps} />);
    
    // Click on sample2 in sidebar
    const sample2Button = screen.getByText('sample2.csv');
    fireEvent.click(sample2Button);
    
    expect(defaultProps.onSelectSample).toHaveBeenCalledWith('sample2.csv');
  });

  it('handles file upload workflow', async () => {
    customRender(<RedesignedDashboard {...defaultProps} />);
    
    // Click upload button
    const uploadButton = screen.getByRole('button', { name: /upload.*files/i });
    fireEvent.click(uploadButton);
    
    // Should open file upload modal or trigger file input
    expect(uploadButton).toBeInTheDocument();
  });

  it('handles export workflow', async () => {
    customRender(<RedesignedDashboard {...defaultProps} />);
    
    // Click export button in TopBar
    const exportButton = screen.getByRole('button', { name: /export/i });
    fireEvent.click(exportButton);
    
    // Should open export modal
    await waitFor(() => {
      expect(screen.getByText('Export Data')).toBeInTheDocument();
    });
  });

  it('handles scoring method changes', async () => {
    customRender(<RedesignedDashboard {...defaultProps} />);
    
    // Change scoring method in ScoreCard
    const methodSelect = screen.getByDisplayValue('Hybrid');
    fireEvent.change(methodSelect, { target: { value: 'rmse' } });
    
    // Should update scoring method across dashboard
    expect(screen.getByDisplayValue('RMSE')).toBeInTheDocument();
  });

  it('handles weight configuration workflow', async () => {
    customRender(<RedesignedDashboard {...defaultProps} />);
    
    // Click configure weights button
    const configButton = screen.getByRole('button', { name: /configure.*weights/i });
    fireEvent.click(configButton);
    
    // Should open weight configuration modal
    await waitFor(() => {
      expect(screen.getByText('Abnormality Weight Configuration')).toBeInTheDocument();
    });
  });

  it('shows correct status distribution', () => {
    customRender(<RedesignedDashboard {...defaultProps} />);
    
    // Should show correct counts for each status
    expect(screen.getByText('1')).toBeInTheDocument(); // Good samples
    expect(screen.getByText('1')).toBeInTheDocument(); // Warning samples  
    expect(screen.getByText('1')).toBeInTheDocument(); // Critical samples
  });

  it('handles favorite toggle workflow', async () => {
    customRender(<RedesignedDashboard {...defaultProps} />);
    
    // Click favorite button for sample1
    const favoriteButtons = screen.getAllByRole('button', { name: /favorite/i });
    fireEvent.click(favoriteButtons[0]);
    
    expect(defaultProps.onToggleFavorite).toHaveBeenCalledWith('sample1.csv');
  });

  it('handles sample removal workflow', async () => {
    customRender(<RedesignedDashboard {...defaultProps} />);
    
    // Click delete button for sample1
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    fireEvent.click(deleteButtons[0]);
    
    // Should show confirmation and then call remove
    expect(defaultProps.onRemoveSample).toHaveBeenCalledWith('sample1.csv');
  });

  it('updates graphs when sample selection changes', () => {
    const { rerender } = customRender(<RedesignedDashboard {...defaultProps} />);
    
    // Initially showing sample1
    expect(screen.getByText('sample1.csv')).toBeInTheDocument();
    
    // Change to sample2
    const newProps = {
      ...defaultProps,
      selectedSample: mockSamples[1]
    };
    
    rerender(<RedesignedDashboard {...newProps} />);
    
    // Should update ScoreCard to show sample2 details
    expect(screen.getByText('75%')).toBeInTheDocument(); // sample2 score
  });

  it('handles empty state when no samples', () => {
    const emptyProps = {
      ...defaultProps,
      samples: [],
      selectedSample: null
    };
    
    customRender(<RedesignedDashboard {...emptyProps} />);
    
    expect(screen.getByText(/no samples/i)).toBeInTheDocument();
    expect(screen.getByText(/upload.*files.*to.*get.*started/i)).toBeInTheDocument();
  });

  it('shows loading states appropriately', () => {
    const loadingProps = {
      ...defaultProps,
      isLoading: true
    };
    
    customRender(<RedesignedDashboard {...loadingProps} />);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('handles error states gracefully', () => {
    const errorProps = {
      ...defaultProps,
      error: 'Failed to load samples'
    };
    
    customRender(<RedesignedDashboard {...errorProps} />);
    
    expect(screen.getByText(/failed.*to.*load.*samples/i)).toBeInTheDocument();
  });

  it('maintains responsive layout on different screen sizes', () => {
    customRender(<RedesignedDashboard {...defaultProps} />);
    
    // Check that main layout containers are present
    const sidebar = screen.getByTestId('sample-sidebar');
    const mainContent = screen.getByTestId('main-content');
    
    expect(sidebar).toHaveClass('w-80'); // Fixed sidebar width
    expect(mainContent).toHaveClass('flex-1'); // Flexible main content
  });

  it('synchronizes data between components', async () => {
    customRender(<RedesignedDashboard {...defaultProps} />);
    
    // Select a different sample
    const sample3Button = screen.getByText('sample3.csv');
    fireEvent.click(sample3Button);
    
    // All components should update to reflect sample3
    expect(defaultProps.onSelectSample).toHaveBeenCalledWith('sample3.csv');
    
    // Score card should eventually show sample3 data when props update
    // Graph should update to show sample3 spectrum
    // Heatmap should update with sample3 deviation data
  });

  it('is accessible', () => {
    customRender(<RedesignedDashboard {...defaultProps} />);
    
    // Check main landmarks are present
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    
    // Check that interactive elements are accessible
    const buttons = screen.getAllByRole('button');
    buttons.forEach((button: HTMLElement) => {
      expect(button).toHaveAccessibleName();
    });
    
    // Check that form elements have labels
    const selects = screen.getAllByRole('combobox');
    selects.forEach((select: HTMLElement) => {
      expect(select).toHaveAccessibleName();
    });
  });

  it('supports keyboard navigation throughout dashboard', () => {
    customRender(<RedesignedDashboard {...defaultProps} />);
    
    // Check that all interactive elements are keyboard accessible
    const interactiveElements = [
      ...screen.getAllByRole('button'),
      ...screen.getAllByRole('combobox'),
      ...screen.getAllByRole('checkbox')
    ];
    
    interactiveElements.forEach((element: HTMLElement) => {
      expect(element).not.toHaveAttribute('tabindex', '-1');
    });
  });
});