from fastapi import APIRouter, Query
from typing import Optional

from backend.app.services.forecasting import forecast_demand
from backend.app.services.inventory import calculate_inventory_recommendations
from backend.app.api.endpoints.data import get_current_data

router = APIRouter(prefix="/api/forecasting", tags=["forecasting"])

@router.get("/forecast")
def get_demand_forecast(
    horizon: int = Query(30, ge=7, le=180),
    model: str = Query("holt_winters", description="holt_winters, arima, or ridge_poly"),
    product_name: Optional[str] = Query(None)
):
    """Generates time-series demand forecast with prediction bounds and model metrics."""
    df = get_current_data()
    result = forecast_demand(
        df,
        horizon=horizon,
        model_name=model,
        product_name=product_name
    )
    return result

@router.get("/inventory")
def get_inventory_recommendations(
    service_level: float = Query(0.95, ge=0.80, le=0.99),
    order_cost: float = Query(50.0, ge=5.0, le=500.0),
    holding_cost_pct: float = Query(0.20, ge=0.05, le=0.50)
):
    """Calculates Safety Stock, Reorder Point, EOQ, and Stockout Risk status."""
    df = get_current_data()
    result = calculate_inventory_recommendations(
        df,
        service_level=service_level,
        order_cost=order_cost,
        holding_cost_pct=holding_cost_pct
    )
    return result
