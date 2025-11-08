from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from typing import List, Optional
import os
import base64
import io
import json
import traceback
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor
import asyncio

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

# Optimized: Use numba for JIT compilation if available
try:
    from numba import jit
    NUMBA_AVAILABLE = True
except ImportError:
    NUMBA_AVAILABLE = False
    jit = lambda x: x  # No-op decorator if numba not available

import numpy as np

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

# Thread pool for parallel processing
executor = ThreadPoolExecutor(max_workers=3)

def generate_graph_image(baseline_df, sample_df, sample_name: str) -> bytes:
    """Generate a graph image for AI analysis"""
    try:
        fig, ax = plt.subplots(figsize=(8, 5), dpi=100)  # Reduced size and DPI
        
        # Downsample for plotting if too many points
        max_plot_points = 1000
        baseline_plot = baseline_df if len(baseline_df) <= max_plot_points else baseline_df.iloc[::len(baseline_df)//max_plot_points]
        sample_plot = sample_df if len(sample_df) <= max_plot_points else sample_df.iloc[::len(sample_df)//max_plot_points]
        
        ax.plot(baseline_plot.iloc[:, 0], baseline_plot.iloc[:, 1], 'b-', linewidth=1.5, label='Baseline')
        ax.plot(sample_plot.iloc[:, 0], sample_plot.iloc[:, 1], 'r-', linewidth=1.5, label=f'Sample: {sample_name}')
        
        ax.set_xlabel('X-axis')
        ax.set_ylabel('Y-axis')
        ax.set_title(f'Baseline vs {sample_name}')
        ax.legend()
        ax.grid(True, alpha=0.3)
        
        # Save with lower quality for faster generation
        img_buffer = io.BytesIO()
        fig.savefig(img_buffer, format='PNG', dpi=100, bbox_inches='tight')
        img_buffer.seek(0)
        img_bytes = img_buffer.read()
        
        plt.close(fig)
        return img_bytes
        
    except Exception as e:
        plt.close('all')
        return b""

# Optimized: Numba-accelerated Fréchet distance calculation
if NUMBA_AVAILABLE:
    @jit(nopython=True, cache=True)
    def _frechet_distance_numba(p1_x, p1_y, p2_x, p2_y):
        """Numba-optimized discrete Fréchet distance"""
        n, m = len(p1_x), len(p2_x)
        ca = np.full((n, m), np.inf)
        
        # Base case
        ca[0, 0] = np.sqrt((p1_x[0] - p2_x[0])**2 + (p1_y[0] - p2_y[0])**2)
        
        # Fill first row
        for j in range(1, m):
            d = np.sqrt((p1_x[0] - p2_x[j])**2 + (p1_y[0] - p2_y[j])**2)
            ca[0, j] = max(ca[0, j-1], d)
        
        # Fill first column
        for i in range(1, n):
            d = np.sqrt((p1_x[i] - p2_x[0])**2 + (p1_y[i] - p2_y[0])**2)
            ca[i, 0] = max(ca[i-1, 0], d)
        
        # Fill the rest
        for i in range(1, n):
            for j in range(1, m):
                d = np.sqrt((p1_x[i] - p2_x[j])**2 + (p1_y[i] - p2_y[j])**2)
                ca[i, j] = max(min(ca[i-1, j], ca[i, j-1], ca[i-1, j-1]), d)
        
        return ca[n-1, m-1]
    
    def discrete_frechet_distance(curve1, curve2):
        """Fast Fréchet distance using Numba"""
        p1_x = np.array([p[0] for p in curve1], dtype=np.float64)
        p1_y = np.array([p[1] for p in curve1], dtype=np.float64)
        p2_x = np.array([p[0] for p in curve2], dtype=np.float64)
        p2_y = np.array([p[1] for p in curve2], dtype=np.float64)
        return _frechet_distance_numba(p1_x, p1_y, p2_x, p2_y)
else:
    # Fallback: Optimized numpy version without numba
    def discrete_frechet_distance(curve1, curve2):
        """Optimized discrete Fréchet distance without numba"""
        p1 = np.array(curve1)
        p2 = np.array(curve2)
        n, m = len(p1), len(p2)
        
        ca = np.full((n, m), np.inf)
        ca[0, 0] = np.linalg.norm(p1[0] - p2[0])
        
        for j in range(1, m):
            ca[0, j] = max(ca[0, j-1], np.linalg.norm(p1[0] - p2[j]))
        
        for i in range(1, n):
            ca[i, 0] = max(ca[i-1, 0], np.linalg.norm(p1[i] - p2[0]))
        
        for i in range(1, n):
            for j in range(1, m):
                d = np.linalg.norm(p1[i] - p2[j])
                ca[i, j] = max(min(ca[i-1, j], ca[i, j-1], ca[i-1, j-1]), d)
        
        return ca[n-1, m-1]

def calculate_similarity_metrics(baseline_df, sample_df):
    """
    Optimized similarity metrics calculation with downsampling for large datasets
    """
    try:
        # Downsample if datasets are very large
        max_points = 5000  # Limit for Fréchet calculation
        baseline_work = baseline_df
        sample_work = sample_df
        
        if len(baseline_df) > max_points:
            step = len(baseline_df) // max_points
            baseline_work = baseline_df.iloc[::step]
        
        if len(sample_df) > max_points:
            step = len(sample_df) // max_points
            sample_work = sample_df.iloc[::step]
        
        # Extract numpy arrays
        baseline_x = baseline_work.iloc[:, 0].to_numpy(dtype=np.float64)
        baseline_y = baseline_work.iloc[:, 1].to_numpy(dtype=np.float64)
        sample_x = sample_work.iloc[:, 0].to_numpy(dtype=np.float64)
        sample_y = sample_work.iloc[:, 1].to_numpy(dtype=np.float64)
        
        # 1. SSE - vectorized operations
        sample_y_interp = np.interp(baseline_x, sample_x, sample_y)
        sse = float(np.sum((baseline_y - sample_y_interp) ** 2))
        normalized_sse = float(sse / len(baseline_y))
        rmse = float(np.sqrt(normalized_sse))
        
        # 2. Fréchet Distance - with further downsampling if needed
        max_frechet_points = 500
        if len(baseline_work) > max_frechet_points:
            step = len(baseline_work) // max_frechet_points
            baseline_curve = list(zip(baseline_x[::step], baseline_y[::step]))
        else:
            baseline_curve = list(zip(baseline_x, baseline_y))
        
        if len(sample_work) > max_frechet_points:
            step = len(sample_work) // max_frechet_points
            sample_curve = list(zip(sample_x[::step], sample_y[::step]))
        else:
            sample_curve = list(zip(sample_x, sample_y))
        
        frechet_dist = float(discrete_frechet_distance(baseline_curve, sample_curve))
        
        return {
            "sse": sse,
            "frechet_distance": frechet_dist,
            "normalized_sse": normalized_sse,
            "rmse": rmse
        }
        
    except Exception as e:
        print(f"Error calculating similarity metrics: {str(e)}")
        return {
            "sse": None,
            "frechet_distance": None,
            "normalized_sse": None,
            "rmse": None,
            "error": str(e)
        }

def analyze_data_statistics(baseline_df, sample_df, sample_name: str) -> dict:
    """Generate statistical summary - optimized with parallel processing"""
    try:
        # Basic stats (fast)
        stats = {
            "sample_name": sample_name,
            "baseline_stats": {
                "count": int(len(baseline_df)),
                "mean_y": float(baseline_df.iloc[:, 1].mean()),
                "std_y": float(baseline_df.iloc[:, 1].std()),
                "min_y": float(baseline_df.iloc[:, 1].min()),
                "max_y": float(baseline_df.iloc[:, 1].max()),
                "range_x": [float(baseline_df.iloc[:, 0].min()), float(baseline_df.iloc[:, 0].max())]
            },
            "sample_stats": {
                "count": int(len(sample_df)),
                "mean_y": float(sample_df.iloc[:, 1].mean()),
                "std_y": float(sample_df.iloc[:, 1].std()),
                "min_y": float(sample_df.iloc[:, 1].min()),
                "max_y": float(sample_df.iloc[:, 1].max()),
                "range_x": [float(sample_df.iloc[:, 0].min()), float(sample_df.iloc[:, 0].max())]
            }
        }
        
        stats["differences"] = {
            "mean_diff": stats["sample_stats"]["mean_y"] - stats["baseline_stats"]["mean_y"],
            "std_diff": stats["sample_stats"]["std_y"] - stats["baseline_stats"]["std_y"],
            "range_diff": stats["sample_stats"]["max_y"] - stats["sample_stats"]["min_y"] - 
                         (stats["baseline_stats"]["max_y"] - stats["baseline_stats"]["min_y"])
        }
        
        # Similarity metrics (can be slow, but now optimized)
        similarity_metrics = calculate_similarity_metrics(baseline_df, sample_df)
        stats["similarity"] = similarity_metrics
        
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
    Optimized: Generate AI-powered insights with parallel processing
    """
    try:
        if not GENAI_AVAILABLE or not MATPLOTLIB_AVAILABLE or not GEMINI_API_KEY:
            return JSONResponse(
                status_code=500,
                content={"error": "Required services not available"}
            )
        
        # Process files
        baseline_df = process_file(baseline)
        sample_df = process_file(sample)
        
        if not sample_name:
            sample_name = sample.filename.split('.')[0] if sample.filename else "Unknown Sample"
        
        # Run stats analysis and image generation in parallel
        loop = asyncio.get_event_loop()
        stats_future = loop.run_in_executor(executor, analyze_data_statistics, baseline_df, sample_df, sample_name)
        image_future = loop.run_in_executor(executor, generate_graph_image, baseline_df, sample_df, sample_name)
        
        # Wait for both to complete
        stats, graph_bytes = await asyncio.gather(stats_future, image_future)
        
        graph_b64 = base64.b64encode(graph_bytes).decode() if graph_bytes else None
        
        # Configure Gemini model
        model = None
        model_names = ['models/gemini-2.0-flash-exp', 'models/gemini-1.5-flash', 'models/gemini-pro']
        
        for model_name in model_names:
            try:
                model = genai.GenerativeModel(model_name)
                break
            except Exception:
                continue
        
        if model is None:
            # Fallback without AI
            from datetime import datetime
            sim = stats.get("similarity", {})
            similarity_info = f"""
**Similarity Metrics:**
- SSE: {sim.get('sse', 'N/A'):.2f if sim.get('sse') is not None else 'N/A'}
- RMSE: {sim.get('rmse', 'N/A'):.4f if sim.get('rmse') is not None else 'N/A'}
- Fréchet Distance: {sim.get('frechet_distance', 'N/A'):.4f if sim.get('frechet_distance') is not None else 'N/A'}
"""
            
            analysis_result = {
                "sample_name": sample_name,
                "statistics": stats,
                "ai_insights": f"""**Statistical Analysis Summary**

**Key Observations:**
- Baseline Mean: {stats['baseline_stats']['mean_y']:.3f} ± {stats['baseline_stats']['std_y']:.3f}
- Sample Mean: {stats['sample_stats']['mean_y']:.3f} ± {stats['sample_stats']['std_y']:.3f}
- Mean Difference: {stats['differences']['mean_diff']:.3f}

{similarity_info}

**Note:** AI insights unavailable. Statistical analysis completed successfully.""",
                "metadata": {
                    "baseline_file": baseline.filename,
                    "sample_file": sample.filename,
                    "analysis_timestamp": datetime.now().isoformat(),
                    "status": "statistical_only"
                }
            }
            return JSONResponse(content=analysis_result)
        
        # Create concise prompt for faster AI response
        sim = stats.get("similarity", {})
        prompt = f"""Analyze this graph comparison briefly (3-4 sentences):

Baseline: Mean={stats['baseline_stats']['mean_y']:.2f}, Std={stats['baseline_stats']['std_y']:.2f}
Sample ({sample_name}): Mean={stats['sample_stats']['mean_y']:.2f}, Std={stats['sample_stats']['std_y']:.2f}
Difference: {stats['differences']['mean_diff']:.2f}

Similarity: SSE={sim.get('sse', 'N/A')}, Fréchet={sim.get('frechet_distance', 'N/A')}

Provide: 1) Key differences 2) Similarity interpretation 3) Main insight"""
        
        # Generate AI analysis with timeout
        try:
            response = model.generate_content(
                [prompt, {"mime_type": "image/png", "data": graph_b64}],
                generation_config=genai.types.GenerationConfig(
                    max_output_tokens=4000,  # Limit response length
                    temperature=0.7,
                )
            )
            ai_insights = response.text if response and response.text else "AI analysis unavailable"
        except Exception:
            ai_insights = f"**Quick Analysis:** Sample shows {abs(stats['differences']['mean_diff']):.2f} difference from baseline."
        
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
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to generate insights: {str(e)}"}
        )

@router.get("/health")
async def analysis_health():
    """Health check for analysis service"""
    return {
        "status": "ok",
        "gemini_api": "configured" if GEMINI_API_KEY else "not_configured",
        "numba_available": NUMBA_AVAILABLE,
        "service": "graph_analysis"
    }