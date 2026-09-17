import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional
from statsmodels.tsa.seasonal import seasonal_decompose

def analyze_time_series(
    df: pd.DataFrame,
    product_name: Optional[str] = None,
    category: Optional[str] = None
) -> Dict[str, Any]:
    """
    Performs time-series analysis:
    - Daily aggregation
    - 7-day and 30-day rolling averages
    - Seasonal decomposition (Trend, Seasonality, Residual)
    - Autocorrelation metrics
    - Product / Category summaries
    """
    filtered_df = df.copy()
    if product_name and product_name != "ALL":
        filtered_df = filtered_df[filtered_df["product_name"] == product_name]
    if category and category != "ALL":
        filtered_df = filtered_df[filtered_df["category"] == category]

    if filtered_df.empty:
        return {"error": "No data available for the selected filters."}

    # Aggregate daily
    daily = filtered_df.groupby("date").agg({
        "sales_qty": "sum",
        "revenue": "sum"
    }).reset_index().sort_values("date")

    daily["date"] = pd.to_datetime(daily["date"])

    # Fill missing dates in range with 0 sales if any gap
    min_date = daily["date"].min()
    max_date = daily["date"].max()
    full_date_range = pd.date_range(start=min_date, end=max_date, freq="D")

    daily = daily.set_index("date").reindex(full_date_range, fill_value=0).reset_index()
    daily.rename(columns={"index": "date"}, inplace=True)
    daily["date_str"] = daily["date"].dt.strftime("%Y-%m-%d")

    # Rolling Moving Averages
    daily["ma_7"] = daily["sales_qty"].rolling(window=7, min_periods=1).mean().round(2)
    daily["ma_30"] = daily["sales_qty"].rolling(window=30, min_periods=1).mean().round(2)

    # Seasonal Decomposition (using period=7 for weekly seasonality)
    sales_series = daily["sales_qty"].values
    num_points = len(sales_series)

    trend_vals = np.zeros(num_points)
    seasonal_vals = np.zeros(num_points)
    residual_vals = np.zeros(num_points)

    if num_points >= 14:
        try:
            decomp = seasonal_decompose(
                daily.set_index("date")["sales_qty"],
                model="additive",
                period=7,
                extrapolate_trend='period'
            )
            trend_vals = np.nan_to_num(decomp.trend.values, nan=0.0).round(2)
            seasonal_vals = np.nan_to_num(decomp.seasonal.values, nan=0.0).round(2)
            residual_vals = np.nan_to_num(decomp.resid.values, nan=0.0).round(2)
        except Exception:
            # Fallback simple trend
            x = np.arange(num_points)
            z = np.polyfit(x, sales_series, 1)
            p = np.poly1d(z)
            trend_vals = p(x).round(2)
            residual_vals = (sales_series - trend_vals).round(2)

    # Calculate Autocorrelation Lags (Lag 1, 7, 14, 30)
    series_s = pd.Series(sales_series)
    autocorr = {
        "lag_1": round(float(series_s.autocorr(lag=1) or 0.0), 3),
        "lag_7": round(float(series_s.autocorr(lag=7) or 0.0), 3),
        "lag_14": round(float(series_s.autocorr(lag=14) or 0.0), 3),
        "lag_30": round(float(series_s.autocorr(lag=30) or 0.0), 3)
    }

    # Format result chart data
    chart_data = []
    for i in range(num_points):
        chart_data.append({
            "date": daily["date_str"].iloc[i],
            "sales": int(daily["sales_qty"].iloc[i]),
            "revenue": round(float(daily["revenue"].iloc[i]), 2),
            "ma_7": float(daily["ma_7"].iloc[i]),
            "ma_30": float(daily["ma_30"].iloc[i]),
            "trend": float(trend_vals[i]),
            "seasonal": float(seasonal_vals[i]),
            "residual": float(residual_vals[i])
        })

    # Summary Statistics
    total_sales = int(daily["sales_qty"].sum())
    avg_daily_sales = round(float(daily["sales_qty"].mean()), 2)
    max_daily_sales = int(daily["sales_qty"].max())
    std_sales = round(float(daily["sales_qty"].std() or 0.0), 2)

    # Category and Product breakdown
    prod_breakdown = df.groupby("product_name").agg({
        "sales_qty": "sum",
        "revenue": "sum"
    }).reset_index().to_dict(orient="records")

    cat_breakdown = df.groupby("category").agg({
        "sales_qty": "sum",
        "revenue": "sum"
    }).reset_index().to_dict(orient="records")

    return {
        "summary": {
            "total_sales": total_sales,
            "avg_daily_sales": avg_daily_sales,
            "max_daily_sales": max_daily_sales,
            "std_sales": std_sales,
            "total_days": num_points
        },
        "autocorrelation": autocorr,
        "time_series": chart_data,
        "product_breakdown": prod_breakdown,
        "category_breakdown": cat_breakdown
    }
