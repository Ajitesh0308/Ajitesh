from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.endpoints import data, analysis, forecasting

app = FastAPI(
    title="Demand Forecasting API",
    description="Backend API for Sales-Data Upload, Time-Series Analysis, Anomaly Detection, Forecasting & Inventory Recommendations",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(data.router)
app.include_router(analysis.router)
app.include_router(forecasting.router)

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "demand-forecasting-backend"}
