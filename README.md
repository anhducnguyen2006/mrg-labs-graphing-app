# MRG Labs Graphing App

Full-stack web application for the 2025 Schneider Prize challenge. Upload a single baseline CSV and multiple sample CSVs, preview overlay graphs in the browser, and batch-export all sample-vs-baseline plots as PNG images.

## Tech Stack
- Frontend: React + Vite + TypeScript, Chakra UI, Chart.js (react-chartjs-2), Papa Parse, Axios
- Backend: FastAPI, Pandas, Matplotlib
- Containerization: Docker (optional), docker-compose

## Features
- Baseline CSV (single) + multiple sample CSV uploads
- Local CSV parsing for preview (Papa Parse, skipping first row)
- Real-time interactive preview of baseline vs selected sample (Chart.js)
- Batch export: backend generates and saves PNG graphs (`backend/static/generated_graphs/`)
- Legend includes filenames; axes labeled A (Y) and cm⁻¹ (X)

## Project Structure
```
mrg-labs-graphing-app/
  frontend/
    src/
      components/
      pages/
  backend/
    utils/plotter.py
    static/generated_graphs/
```

## Running Locally (Dev)
### Backend
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.app:app --reload --port 8080
```
### Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend dev server runs at http://localhost:5173 and proxies /generate_graphs to backend.

## Docker
```bash
docker compose build
docker compose up
```
Frontend served at http://localhost:5173 (nginx), backend at http://localhost:8080.

## API
POST /generate_graphs
Form fields: baseline (file), samples (files[])
Response: `{ "saved_paths": ["/static/generated_graphs/sample1.png", ...] }`

## Future Enhancements
- Authentication / user workspaces
- Additional file validation & error reporting
- Support for exporting combined multi-sample overlay graph
- Base64 previews returned from backend

## License
Proprietary (adjust as needed).
