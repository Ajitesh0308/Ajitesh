from fastapi.testclient import TestClient
from backend.app.main import app
import io

client = TestClient(app)

def test_sample_data_endpoint():
    response = client.get("/api/data/sample?days=60")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["status"] == "success"
    assert "sample_records" in json_data
    assert len(json_data["sample_records"]) > 0

def test_csv_upload_endpoint():
    csv_content = (
        "Date,Product_ID,Product_Name,Category,Sales_Qty,Price\n"
        "2026-01-01,P1,Widget A,Gadgets,10,15.0\n"
        "2026-01-02,P1,Widget A,Gadgets,,15.0\n"
        "2026-01-02,P1,Widget A,Gadgets,12,15.0\n"
    )
    files = {"file": ("test.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    data = {"impute_method": "ffill", "drop_duplicates": "true"}
    response = client.post("/api/data/upload", files=files, data=data)
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["status"] == "success"
    assert json_data["stats"]["duplicates_removed"] >= 1
