from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query
from typing import Optional, List, Dict, Any
import pandas as pd
import io

from backend.app.services.cleaning import generate_sample_sales_data, clean_sales_data

router = APIRouter(prefix="/api/data", tags=["data"])

# Global in-memory cache for loaded & cleaned DataFrame session
DATA_STORE: Dict[str, pd.DataFrame] = {}

def get_current_data() -> pd.DataFrame:
    if "df" not in DATA_STORE or DATA_STORE["df"].empty:
        # Load sample data by default
        sample_df = generate_sample_sales_data(days=180)
        cleaned_df, _ = clean_sales_data(sample_df)
        DATA_STORE["df"] = cleaned_df
    return DATA_STORE["df"]

@router.get("/sample")
def get_sample_dataset(days: int = Query(180, ge=30, le=730)):
    """Generates synthetic multi-product sample sales dataset and loads it into memory."""
    sample_df = generate_sample_sales_data(days=days)
    cleaned_df, stats = clean_sales_data(sample_df)
    DATA_STORE["df"] = cleaned_df
    return {
        "status": "success",
        "stats": stats,
        "sample_records": cleaned_df.head(20).to_dict(orient="records"),
        "total_records": len(cleaned_df),
        "products": cleaned_df['product_name'].unique().tolist(),
        "categories": cleaned_df['category'].unique().tolist()
    }

@router.post("/upload")
async def upload_csv_file(
    file: UploadFile = File(...),
    impute_method: Optional[str] = Form("ffill"),
    drop_duplicates: Optional[bool] = Form(True)
):
    """Uploads CSV sales data, applies data cleaning, and stores in session."""
    if not file.filename.endswith(".csv") and not file.filename.endswith(".txt"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    contents = await file.read()
    try:
        raw_df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV file: {str(e)}")

    try:
        cleaned_df, stats = clean_sales_data(
            raw_df,
            impute_method=impute_method or "ffill",
            drop_duplicates=drop_duplicates if drop_duplicates is not None else True
        )
        DATA_STORE["df"] = cleaned_df
        return {
            "status": "success",
            "filename": file.filename,
            "stats": stats,
            "preview": cleaned_df.head(20).to_dict(orient="records"),
            "products": cleaned_df['product_name'].unique().tolist(),
            "categories": cleaned_df['category'].unique().tolist()
        }
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Error cleaning CSV data: {str(e)}")

@router.get("/current")
def get_current_dataset_summary():
    """Gets summary stats and recent records of currently loaded dataset."""
    df = get_current_data()
    return {
        "total_records": len(df),
        "start_date": df['date'].min(),
        "end_date": df['date'].max(),
        "total_revenue": round(float(df['revenue'].sum()), 2),
        "total_sales_qty": int(df['sales_qty'].sum()),
        "products": df['product_name'].unique().tolist(),
        "categories": df['category'].unique().tolist(),
        "preview": df.head(15).to_dict(orient="records")
    }
