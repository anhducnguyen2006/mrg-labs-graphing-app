import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { customRender } from '../../../test/utils';
import WeightConfigModal from '../../../components/modals/WeightConfigModal';

describe('WeightConfigModal Component', () => {
  const mockInitialWeights = [
    {
      min: 3200,
      max: 3600,
      weight: 1.5,
      label: 'O-H Stretch',
      key: 'oh-stretch'
    },
    {
      min: 1600,
      max: 1800,
      weight: 2.0,
      label: 'C=O Stretch',
      key: 'co-stretch'
    }
  ];

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSave: vi.fn(),
    initialWeights: mockInitialWeights,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders weight configuration modal when open', () => {
    customRender(<WeightConfigModal {...defaultProps} />);
    
    expect(screen.getByText('Abnormality Weight Configuration')).toBeInTheDocument();
    expect(screen.getByText('Configure Detection Weights')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    const closedProps = { ...defaultProps, isOpen: false };
    customRender(<WeightConfigModal {...closedProps} />);
    
    expect(screen.queryByText('Abnormality Weight Configuration')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    customRender(<WeightConfigModal {...defaultProps} />);
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('displays initial weights correctly', () => {
    customRender(<WeightConfigModal {...defaultProps} />);
    
    expect(screen.getByText('O-H Stretch')).toBeInTheDocument();
    expect(screen.getByText('C=O Stretch')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1.5')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2.0')).toBeInTheDocument();
  });

  it('allows editing weight values', () => {
    customRender(<WeightConfigModal {...defaultProps} />);
    
    const weightInput = screen.getByDisplayValue('1.5');
    fireEvent.change(weightInput, { target: { value: '2.5' } });
    
    expect(screen.getByDisplayValue('2.5')).toBeInTheDocument();
  });

  it('shows predefined FTIR zones', () => {
    customRender(<WeightConfigModal {...defaultProps} />);
    
    // Should show common FTIR functional group regions
    expect(screen.getByText(/O-H.*stretch/i)).toBeInTheDocument();
    expect(screen.getByText(/C-H.*stretch/i)).toBeInTheDocument();
    expect(screen.getByText(/C=O.*stretch/i)).toBeInTheDocument();
    expect(screen.getByText(/fingerprint.*region/i)).toBeInTheDocument();
  });

  it('allows adding new weight ranges', () => {
    customRender(<WeightConfigModal {...defaultProps} />);
    
    const addButton = screen.getByRole('button', { name: /add.*range/i });
    fireEvent.click(addButton);
    
    // Should add a new editable range
    const rangeInputs = screen.getAllByPlaceholderText(/min.*wavenumber/i);
    expect(rangeInputs.length).toBeGreaterThan(0);
  });

  it('allows removing weight ranges', () => {
    customRender(<WeightConfigModal {...defaultProps} />);
    
    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    const initialCount = removeButtons.length;
    
    fireEvent.click(removeButtons[0]);
    
    const updatedRemoveButtons = screen.getAllByRole('button', { name: /remove/i });
    expect(updatedRemoveButtons.length).toBe(initialCount - 1);
  });

  it('provides preset configurations', () => {
    customRender(<WeightConfigModal {...defaultProps} />);
    
    expect(screen.getByRole('button', { name: /default/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /high.*sensitivity/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /custom/i })).toBeInTheDocument();
  });

  it('applies default preset when clicked', async () => {
    customRender(<WeightConfigModal {...defaultProps} />);
    
    const defaultButton = screen.getByRole('button', { name: /default/i });
    fireEvent.click(defaultButton);
    
    await waitFor(() => {
      // Default preset should set standard weight values
      expect(screen.getByDisplayValue('1.0')).toBeInTheDocument();
    });
  });

  it('applies high sensitivity preset when clicked', async () => {
    customRender(<WeightConfigModal {...defaultProps} />);
    
    const highSensitivityButton = screen.getByRole('button', { name: /high.*sensitivity/i });
    fireEvent.click(highSensitivityButton);
    
    await waitFor(() => {
      // High sensitivity preset should set higher weight values
      const weightInputs = screen.getAllByRole('spinbutton');
      const hasHighValues = weightInputs.some((input: HTMLInputElement) => 
        parseFloat(input.value) >= 2.0
      );
      expect(hasHighValues).toBe(true);
    });
  });

  it('validates weight range inputs', () => {
    customRender(<WeightConfigModal {...defaultProps} />);
    
    const minInput = screen.getByDisplayValue('3200');
    const maxInput = screen.getByDisplayValue('3600');
    
    // Test invalid range (min > max)
    fireEvent.change(minInput, { target: { value: '4000' } });
    fireEvent.change(maxInput, { target: { value: '3000' } });
    
    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);
    
    expect(screen.getByText(/invalid range/i)).toBeInTheDocument();
  });

  it('validates weight values are positive', () => {
    customRender(<WeightConfigModal {...defaultProps} />);
    
    const weightInput = screen.getByDisplayValue('1.5');
    fireEvent.change(weightInput, { target: { value: '-1' } });
    
    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);
    
    expect(screen.getByText(/weight.*must.*positive/i)).toBeInTheDocument();
  });

  it('calls onSave with updated weights when save is clicked', async () => {
    customRender(<WeightConfigModal {...defaultProps} />);
    
    const weightInput = screen.getByDisplayValue('1.5');
    fireEvent.change(weightInput, { target: { value: '2.5' } });
    
    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(defaultProps.onSave).toHaveBeenCalledWith([
        {
          min: 3200,
          max: 3600,
          weight: 2.5,
          label: 'O-H Stretch',
          key: 'oh-stretch'
        },
        {
          min: 1600,
          max: 1800,
          weight: 2.0,
          label: 'C=O Stretch',
          key: 'co-stretch'
        }
      ]);
    });
  });

  it('shows weight impact preview', () => {
    customRender(<WeightConfigModal {...defaultProps} />);
    
    // Should show visual indication of how weights affect scoring
    expect(screen.getByText(/weight.*impact/i)).toBeInTheDocument();
    expect(screen.getByText(/higher.*weights.*increase.*sensitivity/i)).toBeInTheDocument();
  });

  it('handles missing initial weights', () => {
    const propsWithoutWeights = {
      ...defaultProps,
      initialWeights: undefined
    };
    
    customRender(<WeightConfigModal {...propsWithoutWeights} />);
    
    expect(screen.getByText('Abnormality Weight Configuration')).toBeInTheDocument();
    // Should show default zones without initial values
  });

  it('shows wavenumber range labels', () => {
    customRender(<WeightConfigModal {...defaultProps} />);
    
    expect(screen.getByText('3200-3600 cm⁻¹')).toBeInTheDocument();
    expect(screen.getByText('1600-1800 cm⁻¹')).toBeInTheDocument();
  });

  it('provides zone descriptions and emojis', () => {
    customRender(<WeightConfigModal {...defaultProps} />);
    
    // Should show functional group descriptions
    expect(screen.getByText(/alcohol.*hydroxyl/i)).toBeInTheDocument();
    expect(screen.getByText(/carbonyl.*groups/i)).toBeInTheDocument();
  });

  it('resets to original values when cancel is clicked', () => {
    customRender(<WeightConfigModal {...defaultProps} />);
    
    const weightInput = screen.getByDisplayValue('1.5');
    fireEvent.change(weightInput, { target: { value: '3.0' } });
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);
    
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    // Values should reset if modal is reopened
  });

  it('is accessible', () => {
    customRender(<WeightConfigModal {...defaultProps} />);
    
    // Check modal has proper ARIA attributes
    const modal = screen.getByRole('dialog');
    expect(modal).toHaveAttribute('aria-labelledby');
    
    // Check form inputs have proper labels
    const weightInputs = screen.getAllByRole('spinbutton');
    weightInputs.forEach((input: HTMLElement) => {
      expect(input).toHaveAttribute('aria-label');
    });
    
    // Check buttons are properly labeled
    const buttons = screen.getAllByRole('button');
    buttons.forEach((button: HTMLElement) => {
      expect(button).toHaveAccessibleName();
    });
  });

  it('supports keyboard navigation', () => {
    customRender(<WeightConfigModal {...defaultProps} />);
    
    // Check that form elements are focusable and in logical tab order
    const inputs = screen.getAllByRole('spinbutton');
    const buttons = screen.getAllByRole('button');
    
    [...inputs, ...buttons].forEach((element: HTMLElement) => {
      expect(element).not.toHaveAttribute('tabindex', '-1');
    });
  });
});