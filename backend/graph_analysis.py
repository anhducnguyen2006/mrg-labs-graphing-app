from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from typing import List, Optional
import os
import base64
import io
import tempfile
import json
import traceback
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False
    genai = None

try:
    import pandas as pd
    import matplotlib
    matplotlib.use('Agg')  # Use non-GUI backend
    import matplotlib.pyplot as plt
    MATPLOTLIB_AVAILABLE = True
except ImportError:
    MATPLOTLIB_AVAILABLE = False
    pd = None
    plt = None

try:
    import numpy as np
    NUMPY_AVAILABLE = True
except ImportError:
    NUMPY_AVAILABLE = False
    np = None

try:
    from utils.plotter import process_file
except ImportError:
    def process_file(upload_file):
        """Fallback process_file function"""
        import pandas as pd
        df = pd.read_csv(upload_file.file, header=1)
        return df

router = APIRouter(prefix="/analysis", tags=["Graph Analysis"])

# Configure Gemini AI
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    print("Warning: GEMINI_API_KEY environment variable not set")

def discrete_frechet_distance(curve1, curve2):
    """
    Calculate discrete Fréchet distance between two curves using iterative approach
    """
    n, m = len(curve1), len(curve2)
    ca = np.full((n, m), -1.0)
    
    # Iterative approach instead of recursive
    for i in range(n):
        for j in range(m):
            d = np.sqrt((curve1[i][0] - curve2[j][0])**2 + (curve1[i][1] - curve2[j][1])**2)
            
            if i == 0 and j == 0:
                ca[i, j] = d
            elif i > 0 and j == 0:
                ca[i, j] = max(ca[i-1, 0], d)
            elif i == 0 and j > 0:
                ca[i, j] = max(ca[0, j-1], d)
            else:  # i > 0 and j > 0
                ca[i, j] = max(min(ca[i-1, j], ca[i-1, j-1], ca[i, j-1]), d)
    
    return ca[n-1, m-1]

def calculate_similarity_metrics(baseline_df, sample_df):
    """
    Calculate similarity metrics including NSSE and NFD
    """
    try:
        print("=" * 50)
        print("STARTING SIMILARITY CALCULATION")
        print(f"Baseline shape: {baseline_df.shape}")
        print(f"Sample shape: {sample_df.shape}")
        
        # Check if numpy is available
        if not NUMPY_AVAILABLE or np is None:
            print("ERROR: NumPy not available!")
            return {
                "sse": None,
                "nsse": None,
                "nsse_similarity_level": None,
                "frechet_distance": None,
                "nfd": None,
                "nfd_similarity_level": None,
                "rmse": None,
                "error": "NumPy not available"
            }
        
        # Downsample if datasets are very large
        max_points = 5000
        baseline_work = baseline_df.copy()
        sample_work = sample_df.copy()
        
        if len(baseline_df) > max_points:
            step = len(baseline_df) // max_points
            baseline_work = baseline_df.iloc[::step].copy()
            print(f"Baseline downsampled from {len(baseline_df)} to {len(baseline_work)}")
        
        if len(sample_df) > max_points:
            step = len(sample_df) // max_points
            sample_work = sample_df.iloc[::step].copy()
            print(f"Sample downsampled from {len(sample_df)} to {len(sample_work)}")
        
        # Extract numpy arrays
        print("Extracting arrays...")
        baseline_x = baseline_work.iloc[:, 0].to_numpy(dtype=np.float64)
        baseline_y = baseline_work.iloc[:, 1].to_numpy(dtype=np.float64)
        sample_x = sample_work.iloc[:, 0].to_numpy(dtype=np.float64)
        sample_y = sample_work.iloc[:, 1].to_numpy(dtype=np.float64)
        
        print(f"Baseline X range: {baseline_x.min():.2f} to {baseline_x.max():.2f}")
        print(f"Baseline Y range: {baseline_y.min():.4f} to {baseline_y.max():.4f}")
        print(f"Sample X range: {sample_x.min():.2f} to {sample_x.max():.2f}")
        print(f"Sample Y range: {sample_y.min():.4f} to {sample_y.max():.4f}")
        
        # 1. Sum of Squared Errors (SSE)
        print("Calculating SSE...")
        sample_y_interp = np.interp(baseline_x, sample_x, sample_y)
        sse = float(np.sum((baseline_y - sample_y_interp) ** 2))
        print(f"SSE: {sse}")
        
        # 2. Normalized SSE (NSSE)
        print("Calculating NSSE...")
        baseline_variance = float(np.var(baseline_y))
        print(f"Baseline variance: {baseline_variance}")
        
        if baseline_variance > 1e-10:  # Use small threshold instead of 0
            nsse = sse / (len(baseline_y) * baseline_variance)
            print(f"NSSE: {nsse}")
        else:
            print("WARNING: Baseline variance is too small!")
            nsse = float('inf')
        
        # NSSE Similarity Level (0-100%)
        if not np.isinf(nsse) and nsse >= 0:
            nsse_similarity = float(100 * np.exp(-nsse))
            print(f"NSSE Similarity: {nsse_similarity:.2f}%")
        else:
            nsse_similarity = 0.0
            print("NSSE Similarity: 0% (infinite NSSE)")
        
        # 3. Fréchet Distance
        print("Calculating Fréchet Distance...")
        max_frechet_points = 500
        
        if len(baseline_work) > max_frechet_points:
            step = max(1, len(baseline_work) // max_frechet_points)
            baseline_curve = list(zip(baseline_x[::step], baseline_y[::step]))
        else:
            baseline_curve = list(zip(baseline_x, baseline_y))
        
        if len(sample_work) > max_frechet_points:
            step = max(1, len(sample_work) // max_frechet_points)
            sample_curve = list(zip(sample_x[::step], sample_y[::step]))
        else:
            sample_curve = list(zip(sample_x, sample_y))
        
        print(f"Frechet curve sizes: baseline={len(baseline_curve)}, sample={len(sample_curve)}")
        
        frechet_dist = float(discrete_frechet_distance(baseline_curve, sample_curve))
        print(f"Fréchet distance: {frechet_dist}")
        
        # 4. Normalized Fréchet Distance (NFD)
        print("Calculating NFD...")
        baseline_x_range = float(np.max(baseline_x) - np.min(baseline_x))
        baseline_y_range = float(np.max(baseline_y) - np.min(baseline_y))
        diagonal_length = np.sqrt(baseline_x_range**2 + baseline_y_range**2)
        
        print(f"Diagonal length: {diagonal_length}")
        
        if diagonal_length > 1e-10:  # Use small threshold instead of 0
            nfd = frechet_dist / diagonal_length
            print(f"NFD: {nfd}")
        else:
            print("WARNING: Diagonal length is too small!")
            nfd = float('inf')
        
        # NFD Similarity Level (0-100%)
        if not np.isinf(nfd) and nfd >= 0:
            nfd_similarity = float(100 * np.exp(-2 * nfd))
            print(f"NFD Similarity: {nfd_similarity:.2f}%")
        else:
            nfd_similarity = 0.0
            print("NFD Similarity: 0% (infinite NFD)")
        
        # Calculate RMSE
        rmse = float(np.sqrt(sse / len(baseline_y)))
        print(f"RMSE: {rmse}")
        
        result = {
            "sse": sse,
            "nsse": nsse if not np.isinf(nsse) else None,
            "nsse_similarity_level": nsse_similarity,
            "frechet_distance": frechet_dist,
            "nfd": nfd if not np.isinf(nfd) else None,
            "nfd_similarity_level": nfd_similarity,
            "rmse": rmse
        }
        
        print("CALCULATION COMPLETE!")
        print(f"Final result: {result}")
        print("=" * 50)
        return result
        
    except Exception as e:
        print("=" * 50)
        print(f"ERROR in calculate_similarity_metrics: {str(e)}")
        import traceback
        traceback.print_exc()
        print("=" * 50)
        return {
            "sse": None,
            "nsse": None,
            "nsse_similarity_level": None,
            "frechet_distance": None,
            "nfd": None,
            "nfd_similarity_level": None,
            "rmse": None,
            "error": str(e)
        }

def generate_graph_image(baseline_df, sample_df, sample_name: str) -> bytes:
    """Generate a graph image for AI analysis"""
    try:
        fig, ax = plt.subplots(figsize=(10, 6))
        
        # Create the comparison plot
        ax.plot(baseline_df.iloc[:, 0], baseline_df.iloc[:, 1], 'b-', linewidth=2, label='Baseline')
        ax.plot(sample_df.iloc[:, 0], sample_df.iloc[:, 1], 'r-', linewidth=2, label=f'Sample: {sample_name}')
        
        ax.set_xlabel('X-axis')
        ax.set_ylabel('Y-axis')
        ax.set_title(f'Baseline vs {sample_name} Comparison')
        ax.legend()
        ax.grid(True, alpha=0.3)
        
        # Save to bytes
        img_buffer = io.BytesIO()
        fig.savefig(img_buffer, format='PNG', dpi=150, bbox_inches='tight')
        img_buffer.seek(0)
        img_bytes = img_buffer.read()
        
        plt.close(fig)
        return img_bytes
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating graph image: {str(e)}")

def analyze_data_statistics(baseline_df, sample_df, sample_name: str) -> dict:
    """Generate statistical summary of the data"""
    try:
        stats = {
            "sample_name": sample_name,
            "baseline_stats": {
                "count": len(baseline_df),
                "mean_y": float(baseline_df.iloc[:, 1].mean()),
                "std_y": float(baseline_df.iloc[:, 1].std()),
                "min_y": float(baseline_df.iloc[:, 1].min()),
                "max_y": float(baseline_df.iloc[:, 1].max()),
                "range_x": [float(baseline_df.iloc[:, 0].min()), float(baseline_df.iloc[:, 0].max())]
            },
            "sample_stats": {
                "count": len(sample_df),
                "mean_y": float(sample_df.iloc[:, 1].mean()),
                "std_y": float(sample_df.iloc[:, 1].std()),
                "min_y": float(sample_df.iloc[:, 1].min()),
                "max_y": float(sample_df.iloc[:, 1].max()),
                "range_x": [float(sample_df.iloc[:, 0].min()), float(sample_df.iloc[:, 0].max())]
            }
        }
        
        # Calculate differences
        stats["differences"] = {
            "mean_diff": stats["sample_stats"]["mean_y"] - stats["baseline_stats"]["mean_y"],
            "std_diff": stats["sample_stats"]["std_y"] - stats["baseline_stats"]["std_y"],
            "range_diff": stats["sample_stats"]["max_y"] - stats["sample_stats"]["min_y"] - (stats["baseline_stats"]["max_y"] - stats["baseline_stats"]["min_y"])
        }
        
        # Calculate similarity metrics
        if NUMPY_AVAILABLE:
            stats["similarity"] = calculate_similarity_metrics(baseline_df, sample_df)
        else:
            stats["similarity"] = {
                "error": "NumPy not available for similarity calculations"
            }
        
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing statistics: {str(e)}")

@router.post("/generate_insights")
async def generate_graph_insights(
    baseline: UploadFile = File(...),
    sample: UploadFile = File(...),
    sample_name: Optional[str] = Form(None)
):
    """
    Generate AI-powered insights and analysis for a graph comparison between baseline and sample data
    """
    try:
        # Check if required modules are available
        if not GENAI_AVAILABLE:
            return JSONResponse(
                status_code=500, 
                content={"error": "Google Generative AI library not available"}
            )
        
        if not MATPLOTLIB_AVAILABLE:
            return JSONResponse(
                status_code=500, 
                content={"error": "Matplotlib library not available"}
            )
        
        if not GEMINI_API_KEY:
            return JSONResponse(
                status_code=500, 
                content={"error": "Gemini AI API key not configured"}
            )
        
        # Process uploaded files
        try:
            baseline_df = process_file(baseline)
            sample_df = process_file(sample)
        except Exception as e:
            return JSONResponse(
                status_code=400, 
                content={"error": f"Failed to process uploaded files: {str(e)}"}
            )
        
        # Use filename if sample_name not provided
        if not sample_name:
            sample_name = sample.filename.split('.')[0] if sample.filename else "Unknown Sample"
        
        # Generate statistical analysis
        try:
            stats = analyze_data_statistics(baseline_df, sample_df, sample_name)
        except Exception as e:
            return JSONResponse(
                status_code=500, 
                content={"error": f"Failed to analyze statistics: {str(e)}"}
            )
        
        # Generate graph image for AI analysis
        try:
            graph_bytes = generate_graph_image(baseline_df, sample_df, sample_name)
            graph_b64 = base64.b64encode(graph_bytes).decode()
        except Exception as e:
            return JSONResponse(
                status_code=500, 
                content={"error": f"Failed to generate graph image: {str(e)}"}
            )
        
        # Configure Gemini model with fallback
        model = None
        model_names = ['models/gemini-2.5-flash','models/gemini-pro', 'gemini-pro', 'models/gemini-1.0-pro', 'gemini-1.0-pro-latest']
        
        for model_name in model_names:
            try:
                model = genai.GenerativeModel(model_name)
                break
            except Exception as e:
                continue
        
        if model is None:
            # Provide statistical analysis without AI insights
            try:
                from datetime import datetime
                analysis_result = {
                    "sample_name": sample_name,
                    "statistics": stats,
                    "ai_insights": f"""**Statistical Analysis Summary**

**Key Observations:**
- Baseline Mean: {stats['baseline_stats']['mean_y']:.3f} ± {stats['baseline_stats']['std_y']:.3f}
- Sample Mean: {stats['sample_stats']['mean_y']:.3f} ± {stats['sample_stats']['std_y']:.3f}
- Mean Difference: {stats['differences']['mean_diff']:.3f}

**Note:** AI-powered insights are currently unavailable, but the statistical analysis above provides key numerical comparisons between your baseline and sample data. The system successfully processed your data and calculated the essential metrics for comparison.

For detailed AI interpretation, please try again later when the AI service is restored.""",
                    "metadata": {
                        "baseline_file": baseline.filename,
                        "sample_file": sample.filename,
                        "analysis_timestamp": datetime.now().isoformat(),
                        "status": "statistical_only"
                    }
                }
                
                return JSONResponse(content=analysis_result)
            except Exception as e:
                return JSONResponse(
                    status_code=500, 
                    content={"error": f"Failed to prepare statistical analysis: {str(e)}"}
                )
        
        # Create detailed prompt
        prompt = f"""
        Analyze this graph comparison between baseline data and sample data ({sample_name}).
        
        Statistical Summary:
        - Baseline: Mean={stats['baseline_stats']['mean_y']:.3f}, Std={stats['baseline_stats']['std_y']:.3f}, Range=[{stats['baseline_stats']['min_y']:.3f}, {stats['baseline_stats']['max_y']:.3f}]
        - Sample: Mean={stats['sample_stats']['mean_y']:.3f}, Std={stats['sample_stats']['std_y']:.3f}, Range=[{stats['sample_stats']['min_y']:.3f}, {stats['sample_stats']['max_y']:.3f}]
        - Mean Difference: {stats['differences']['mean_diff']:.3f}
        
        Please provide:
        1. **Key Observations**: What are the most significant differences between baseline and sample?
        2. **Trend Analysis**: Describe the overall trends, patterns, and behaviors you observe
        3. **Statistical Insights**: Interpret the statistical differences (mean, variance, range changes)
        4. **Potential Implications**: What might these differences suggest about the underlying process or system?
        5. **Areas of Interest**: Highlight specific regions or features that warrant further investigation
        6. **Data Quality Assessment**: Comment on data consistency, outliers, or anomalies
        
        Keep your analysis scientific, objective, and actionable. Focus on providing insights that would be valuable for researchers or analysts.
        """
        
        # Generate AI analysis with fallback
        try:
            response = model.generate_content([
                prompt,
                {
                    "mime_type": "image/png",
                    "data": graph_b64
                }
            ])
            
            if not response or not response.text:
                raise Exception("Empty response from Gemini AI")
                
            ai_insights = response.text
                
        except Exception as e:
            # Fallback to statistical analysis when AI fails
            ai_insights = f"""**Statistical Analysis Summary**

**Key Observations:**
- Baseline Mean: {stats['baseline_stats']['mean_y']:.3f} ± {stats['baseline_stats']['std_y']:.3f}
- Sample Mean: {stats['sample_stats']['mean_y']:.3f} ± {stats['sample_stats']['std_y']:.3f}
- Mean Difference: {stats['differences']['mean_diff']:.3f}

**Trend Analysis:**
The sample data shows {"an increase" if stats['differences']['mean_diff'] > 0 else "a decrease" if stats['differences']['mean_diff'] < 0 else "no significant change"} compared to the baseline, with a difference of {abs(stats['differences']['mean_diff']):.3f} units.

**Statistical Insights:**
- Data points: Baseline ({stats['baseline_stats']['count']}), Sample ({stats['sample_stats']['count']})
- Variance change: {"increased" if stats['differences']['std_diff'] > 0 else "decreased" if stats['differences']['std_diff'] < 0 else "remained similar"}
- Range: Baseline [{stats['baseline_stats']['min_y']:.3f}, {stats['baseline_stats']['max_y']:.3f}], Sample [{stats['sample_stats']['min_y']:.3f}, {stats['sample_stats']['max_y']:.3f}]

**Note:** This analysis is based on statistical calculations. AI-powered insights are temporarily unavailable but will provide more detailed interpretation when the service is restored."""
        
        # Prepare response
        try:
            from datetime import datetime
            analysis_result = {
                "sample_name": sample_name,
                "statistics": stats,
                "ai_insights": ai_insights,
                "metadata": {
                    "baseline_file": baseline.filename,
                    "sample_file": sample.filename,
                    "analysis_timestamp": datetime.now().isoformat()
                }
            }
            
            return JSONResponse(content=analysis_result)
        except Exception as e:
            return JSONResponse(
                status_code=500, 
                content={"error": f"Failed to prepare response: {str(e)}"}
            )
        
    except Exception as e:
        return JSONResponse(
            status_code=500, 
            content={"error": f"Failed to generate insights: {str(e)}"}
        )

@router.get("/health")
async def analysis_health():
    """Health check for analysis service"""
    gemini_status = "configured" if GEMINI_API_KEY else "not_configured"
    return {
        "status": "ok",
        "gemini_api": gemini_status,
        "service": "graph_analysis"
    }