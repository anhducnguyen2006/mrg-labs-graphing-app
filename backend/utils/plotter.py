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
        
        # Plot with darker colors, full opacity, and thinner lines
        ax.plot(x_base, y_base, 
                color="#006400",  # Dark green (rgb(0,100,0))
                linewidth=0.8,  # Thinner lines
                label=f'Baseline: {baseline_upload.filename}',
                alpha=1.0)
        ax.plot(x_s, y_s, 
                color="#0000FF",  # Dark blue (rgb(0,0,139))
                linewidth=0.8,  # Thinner lines
                label=f'Sample: {sample.filename}',
                alpha=1.0)
        
        # Set axis limits and labels (normal order: 4000 first, 550 last)
        ax.set_xlim(550, 4000)  # Reversed: 550 to 4000 (so 4000 appears first on left)
        ax.set_ylim(0.2, 6)   # Set y-axis limits (max at 6)
        ax.set_xlabel('Wavenumber (cm⁻¹)', fontsize=14, fontweight='bold', color='#333')
        ax.set_ylabel('Absorbance', fontsize=14, fontweight='bold', color='#333')
        # Don't invert x-axis - we want normal order with xlim reversed
        
        # Set custom x-axis tick intervals
        # From 4000 to 2000: decrease by 500
        # From 2000 to 750: decrease by 250
        # Final tick at 550
        custom_xticks = [4000, 3500, 3000, 2500, 2000, 1750, 1500, 1250, 1000, 750, 550]
        ax.set_xticks(custom_xticks)
        
        # Improve grid
        ax.grid(True, alpha=0.3, linewidth=0.5, color='#cccccc')
        ax.set_axisbelow(True)
        
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
        
        # Add a title
        plt.title(f'Spectroscopy Analysis: {sample.filename}', 
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
