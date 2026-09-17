from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_time_series_analysis_endpoint():
    response = client.get("/api/analysis/time-series")
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert "time_series" in data
    assert len(data["time_series"]) > 0
    first_item = data["time_series"][0]
    assert "ma_7" in first_item
    assert "trend" in first_item
    assert "seasonal" in first_item

def test_anomaly_detection_endpoint():
    response = client.get("/api/analysis/anomalies?method=zscore&sensitivity=2.0")
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert "anomalies" in data
    assert "time_series" in data
    assert data["summary"]["method_used"] == "zscore"

def test_isolation_forest_anomaly():
    response = client.get("/api/analysis/anomalies?method=isolation_forest&sensitivity=2.5")
    assert response.status_code == 200
    data = response.json()
    assert data["summary"]["method_used"] == "isolation_forest"
