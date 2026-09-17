import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional
from sklearn.ensemble import IsolationForest

def detect_anomalies(
    df: pd.DataFrame,
    method: str = "zscore", # "zscore", "iqr", "isolation_forest"
    sensitivity: float = 2.5, # threshold sigma / multiplier
    product_name: Optional[str] = None
) -> Dict[str, Any]:
    """
    Detects sales anomalies using statistical (Z-Score, IQR) or ML (Isolation Forest) methods.
    """
    filtered_df = df.copy()
    if product_name and product_name != "ALL":
        filtered_df = filtered_df[filtered_df["product_name"] == product_name]

    if filtered_df.empty:
        return {"anomalies": [], "time_series": []}

    daily = filtered_df.groupby("date").agg({
        "sales_qty": "sum",
        "revenue": "sum"
    }).reset_index().sort_values("date")

    sales = daily["sales_qty"].values.astype(float)
    n = len(sales)

    is_anomaly = np.zeros(n, dtype=bool)
    scores = np.zeros(n, dtype=float)
    upper_bounds = np.zeros(n, dtype=float)
    lower_bounds = np.zeros(n, dtype=float)

    # 1. Z-Score Method
    if method == "zscore":
        mean = np.mean(sales)
        std = np.std(sales) if np.std(sales) > 0 else 1.0
        z_scores = np.abs((sales - mean) / std)
        scores = z_scores
        is_anomaly = z_scores > sensitivity
        upper_bounds = np.full(n, mean + sensitivity * std)
        lower_bounds = np.full(n, max(0, mean - sensitivity * std))

    # 2. IQR Method
    elif method == "iqr":
        q25, q75 = np.percentile(sales, 25), np.percentile(sales, 75)
        iqr = q75 - q25
        upper = q75 + (sensitivity * iqr)
        lower = max(0, q25 - (sensitivity * iqr))
        upper_bounds = np.full(n, upper)
        lower_bounds = np.full(n, lower)
        is_anomaly = (sales > upper) | (sales < lower)
        scores = np.where(sales > upper, (sales - upper) / (iqr + 1e-5), np.where(sales < lower, (lower - sales) / (iqr + 1e-5), 0.0))

    # 3. Isolation Forest Method
    else: # isolation_forest
        contamination = min(0.1, max(0.01, 1.0 / sensitivity / 10.0))
        iso = IsolationForest(contamination=contamination, random_state=42)
        X = sales.reshape(-1, 1)
        preds = iso.fit_predict(X) # -1 for anomaly, 1 for normal
        is_anomaly = preds == -1
        mean = np.mean(sales)
        std = np.std(sales) or 1.0
        upper_bounds = np.full(n, mean + 2.0 * std)
        lower_bounds = np.full(n, max(0, mean - 2.0 * std))
        raw_scores = -iso.score_samples(X)
        scores = (raw_scores - raw_scores.min()) / (raw_scores.max() - raw_scores.min() + 1e-5)

    # Compile result records
    anomalies_list = []
    series_with_anomalies = []

    for i in range(n):
        dt = daily["date"].iloc[i]
        qty = int(sales[i])
        rev = round(float(daily["revenue"].iloc[i]), 2)
        flagged = bool(is_anomaly[i])
        score = round(float(scores[i]), 2)
        upper_b = round(float(upper_bounds[i]), 2)
        lower_b = round(float(lower_bounds[i]), 2)

        if flagged:
            severity = "HIGH" if score > 3.0 else ("MEDIUM" if score > 2.0 else "LOW")
            type_str = "Spike" if qty > upper_b else "Dip"
            deviation_pct = round(((qty - upper_b) / max(1, upper_b)) * 100, 1) if type_str == "Spike" else round(((lower_b - qty) / max(1, lower_b)) * 100, 1)

            anomalies_list.append({
                "date": dt,
                "sales_qty": qty,
                "revenue": rev,
                "expected_upper": upper_b,
                "expected_lower": lower_b,
                "anomaly_type": type_str,
                "severity": severity,
                "score": score,
                "description": f"{type_str} detected: {qty} units ({deviation_pct}% deviation from expected threshold)"
            })

        series_with_anomalies.append({
            "date": dt,
            "sales": qty,
            "revenue": rev,
            "is_anomaly": flagged,
            "upper_bound": upper_b,
            "lower_bound": lower_b
        })

    return {
        "summary": {
            "total_anomalies": len(anomalies_list),
            "spikes_count": sum(1 for a in anomalies_list if a["anomaly_type"] == "Spike"),
            "dips_count": sum(1 for a in anomalies_list if a["anomaly_type"] == "Dip"),
            "method_used": method,
            "sensitivity": sensitivity
        },
        "anomalies": anomalies_list,
        "time_series": series_with_anomalies
    }
