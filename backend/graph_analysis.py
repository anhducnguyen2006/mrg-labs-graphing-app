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