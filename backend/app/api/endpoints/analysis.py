from fastapi import APIRouter, Query
from typing import Optional

from backend.app.services.cleaning import generate_sample_sales_data, clean_sales_data
from backend.app.services.analysis import analyze_time_series
from backend.app.services.anomaly import detect_anomalies
from backend.app.api.endpoints.data import get_current_data

router = APIRouter(prefix="/api/analysis", tags=["analysis"])

@router.get("/time-series")
def get_time_series_analysis(
    product_name: Optional[str] = Query(None),
    category: Optional[str] = Query(None)
):
    """Calculates moving averages, seasonal decomposition, and metrics for selected product/category."""
    df = get_current_data()
    result = analyze_time_series(df, product_name=product_name, category=category)
    return result

@router.get("/anomalies")
def get_anomalies(
    method: str = Query("zscore", description="zscore, iqr, or isolation_forest"),
    sensitivity: float = Query(2.5, ge=1.0, le=5.0),
    product_name: Optional[str] = Query(None)
):
    """Detects sales anomalies using statistical or ML models."""
    df = get_current_data()
    result = detect_anomalies(
        df,
        method=method,
        sensitivity=sensitivity,
        product_name=product_name
    )
    return result
