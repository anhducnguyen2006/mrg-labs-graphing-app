from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from typing import List
import os
import zipfile
import tempfile
import shutil

from utils.plotter import generate_and_save, SAVE_DIR

app = FastAPI(title="MRG Labs Graphing API")

# CORS (dev: allow localhost frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "*"] ,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static mounting for generated graphs
static_root = os.path.join(os.path.dirname(__file__), 'static')
app.mount("/static", StaticFiles(directory=static_root), name="static")

@app.post("/generate_graphs")
async def generate_graphs(
    baseline: UploadFile = File(...),
    samples: List[UploadFile] = File(...),
    save_dir: str | None = Form(None),
    format: str = Form("png")
):
    try:
        # Generate the graphs and get their file paths
        saved_paths = generate_and_save(baseline, samples, save_subdir=save_dir, format=format)
        
        # Create a temporary zip file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.zip') as temp_zip:
            with zipfile.ZipFile(temp_zip.name, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                for relative_path in saved_paths:
                    # Convert relative path to absolute path
                    if relative_path.startswith('/static/generated_graphs/'):
                        file_path = os.path.join(SAVE_DIR, relative_path.replace('/static/generated_graphs/', ''))
                    else:
                        file_path = os.path.join(SAVE_DIR, os.path.basename(relative_path))
                    
                    if os.path.exists(file_path):
                        # Add file to zip with just the filename (no directories)
                        zip_file.write(file_path, os.path.basename(file_path))
            
            # Return the zip file as a download
            def cleanup_file():
                try:
                    os.unlink(temp_zip.name)
                except:
                    pass
            
            return FileResponse(
                path=temp_zip.name,
                filename=f"exported_graphs.zip",
                media_type='application/zip',
                background=cleanup_file
            )
    except Exception as e:
        return JSONResponse(status_code=400, content={"error": str(e)})

@app.get("/health")
async def health():
    return {"status": "ok"}

# Run: uvicorn app:app --reload --port 8080
