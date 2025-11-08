import os
from typing import List, Tuple, Optional
import pandas as pd
import matplotlib.pyplot as plt

SAVE_DIR = os.path.join(os.path.dirname(__file__), '..', 'static', 'generated_graphs')
os.makedirs(SAVE_DIR, exist_ok=True)

# Contract:
# Inputs: baseline_file (UploadFile-like), sample_files list
# Output: list of saved image relative paths (for frontend access via /static)
# Errors: raises Exception on invalid CSV structure

def read_csv(file_obj) -> Tuple[pd.Series, pd.Series]:
    df = pd.read_csv(file_obj, header=1)
    x = df.iloc[:, 0]
    y = df.iloc[:, 1]
    return x, y


def generate_and_save(baseline_upload, sample_uploads: List, dpi: int = 300, save_subdir: Optional[str] = None, format: str = "png") -> List[str]:
    x_base, y_base = read_csv(baseline_upload.file)
    saved: List[str] = []
    # Determine output directory
    target_dir = SAVE_DIR
    if save_subdir:
        # sanitize basic path traversal
        safe = save_subdir.replace('..', '').replace('/', '_').strip()
        if safe:
            target_dir = os.path.join(SAVE_DIR, safe)
            os.makedirs(target_dir, exist_ok=True)

    for sample in sample_uploads:
        x_s, y_s = read_csv(sample.file)
        
        # Create a beautiful, professional figure
        plt.style.use('default')
        fig, ax = plt.subplots(figsize=(12, 8), facecolor='white')
        
        # Define custom x-axis ticks with equal visual spacing
        custom_xticks = [4000, 3500, 3000, 2500, 2000, 1750, 1500, 1250, 1000, 750, 550]
        
        # Create mapping from actual wavenumber to equally-spaced position
        # This will make the visual spacing equal even though values are uneven
        x_to_pos = {}
        for i, tick in enumerate(custom_xticks):
            x_to_pos[tick] = i
        
        # Interpolate data points to the new equal-spacing scale
        def map_x_to_position(x_values):
            positions = []
            for x in x_values:
                # Find which segment this x falls into and interpolate position
                if x >= 4000:
                    positions.append(0)
                elif x <= 550:
                    positions.append(len(custom_xticks) - 1)
                else:
                    # Find the two ticks this x falls between
                    for i in range(len(custom_xticks) - 1):
                        if custom_xticks[i] >= x >= custom_xticks[i + 1]:
                            # Linear interpolation
                            x1, x2 = custom_xticks[i], custom_xticks[i + 1]
                            pos1, pos2 = i, i + 1
                            t = (x - x1) / (x2 - x1)
                            positions.append(pos1 + t * (pos2 - pos1))
                            break
            return positions
        
        # Map data to equal-spaced positions
        x_base_pos = map_x_to_position(x_base)
        x_s_pos = map_x_to_position(x_s)
        
        # Remove .csv extension from filenames for labels
        baseline_name = os.path.splitext(baseline_upload.filename)[0]
        sample_name = os.path.splitext(sample.filename)[0]
        
        # Plot with transformed x positions
        ax.plot(x_base_pos, y_base, 
                color="#006400",  # Dark green
                linewidth=0.8,  # Thinner lines
                label=f'Baseline: {baseline_name}',
                alpha=1.0)
        ax.plot(x_s_pos, y_s, 
                color="#0000FF",  # Dark blue
                linewidth=0.8,  # Thinner lines
                label=f'Sample: {sample_name}',
                alpha=1.0)
        
        # Calculate maximum absorbance from both datasets for y-axis limit
        max_absorbance = max(y_base.max(), y_s.max())
        
        # Y-axis setup: minimum, then 0.5 intervals, then maximum
        y_min = 0.2
        y_interval = 0.5
        
        # Start with minimum value
        y_ticks = [round(y_min, 1)]
        
        # Add regular 0.5 intervals starting from 0.5
        current_tick = 0.5
        while current_tick < max_absorbance:
            y_ticks.append(round(current_tick, 1))
            current_tick += y_interval
        
        # Add the maximum as the final tick, rounded to 1 decimal place
        y_ticks.append(round(max_absorbance, 1))
        y_max = max_absorbance
        
        # Set axis with equal-spaced positions
        # Start at 0 so 4000 (position 0) aligns with y-axis
        ax.set_xlim(0, len(custom_xticks) - 1)
        ax.set_ylim(y_min, y_max)
        ax.set_xlabel('Wavenumber (cm⁻¹)', fontsize=14, fontweight='bold', color='#333')
        ax.set_ylabel('Absorbance', fontsize=14, fontweight='bold', color='#333')
        
        # Set y-axis ticks with 1 decimal place formatting
        ax.set_yticks(y_ticks)
        ax.set_yticklabels([f'{tick:.1f}' for tick in y_ticks])
        
        # Set tick positions and labels for x-axis
        tick_positions = list(range(len(custom_xticks)))
        ax.set_xticks(tick_positions)
        ax.set_xticklabels(custom_xticks)
        
        # Remove grid lines
        ax.grid(False)
        
        # Style the legend - position below x-axis
        legend = ax.legend(loc='upper center', 
                          bbox_to_anchor=(0.5, -0.15),  # Position below the plot
                          ncol=2,  # Two columns for horizontal layout
                          frameon=True, 
                          fancybox=True, 
                          shadow=True,
                          fontsize=12,
                          edgecolor='#333',
                          facecolor='white',
                          framealpha=0.95)
        legend.get_frame().set_linewidth(0.8)
        
        # Style the axes
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        ax.spines['left'].set_linewidth(0.8)
        ax.spines['bottom'].set_linewidth(0.8)
        ax.spines['left'].set_color('#333')
        ax.spines['bottom'].set_color('#333')
        
        # Improve tick styling
        ax.tick_params(axis='both', which='major', labelsize=11, colors='#666', width=0.8)
        ax.tick_params(axis='both', which='minor', width=0.5)
        
        # Add a title - remove .csv extension from filename
        sample_name = os.path.splitext(sample.filename)[0]
        plt.title(f'Spectroscopy Analysis: {sample_name}', 
                 fontsize=16, fontweight='bold', color='#333', pad=20)
        
        # Tight layout with padding
        plt.tight_layout(pad=2.0)
        
        # Use sample name for output file
        file_ext = format.lower() if format.lower() in ['png', 'jpeg', 'jpg'] else 'png'
        out_name = f"{os.path.splitext(sample.filename)[0]}.{file_ext}"
        out_path = os.path.join(target_dir, out_name)
        
        # Save with high quality settings
        plt.savefig(out_path, 
                   dpi=dpi, 
                   format=file_ext, 
                   bbox_inches='tight',
                   facecolor='white',
                   edgecolor='none',
                   pad_inches=0.2)
        plt.close(fig)
        # Relative path for static serving
        if target_dir == SAVE_DIR:
            rel_path = f"/static/generated_graphs/{out_name}"
        else:
            sub = os.path.basename(target_dir)
            rel_path = f"/static/generated_graphs/{sub}/{out_name}"
        saved.append(rel_path)
    return saved
