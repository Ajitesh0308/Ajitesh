from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_forecast_endpoint():
    response = client.get("/api/forecasting/forecast?horizon=30&model=holt_winters")
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert "metrics" in data
    assert "forecast_series" in data
    assert len(data["forecast_series"]) > 30
    assert data["metrics"]["mape"] >= 0

def test_forecast_arima_model():
    response = client.get("/api/forecasting/forecast?horizon=14&model=arima")
    assert response.status_code == 200
    data = response.json()
    assert data["summary"]["horizon_days"] == 14

def test_inventory_recommendations_endpoint():
    response = client.get("/api/forecasting/inventory?service_level=0.95")
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert "inventory" in data
    assert len(data["inventory"]) > 0
    first_item = data["inventory"][0]
    assert "safety_stock" in first_item
    assert "reorder_point" in first_item
    assert "eoq" in first_item
    assert "status" in first_item
