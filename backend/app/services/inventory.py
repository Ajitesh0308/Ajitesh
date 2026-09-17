import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional
from backend.app.services.forecasting import forecast_demand

def calculate_inventory_recommendations(
    df: pd.DataFrame,
    service_level: float = 0.95, # Z-score: 0.90 -> 1.28, 0.95 -> 1.65, 0.99 -> 2.33
    order_cost: float = 50.0, # fixed ordering cost ($ S)
    holding_cost_pct: float = 0.20 # annual holding cost percentage
) -> Dict[str, Any]:
    """
    Calculates inventory optimization parameters for all products in dataset:
    - Safety Stock (SS)
    - Reorder Point (ROP)
    - Economic Order Quantity (EOQ)
    - Days of Inventory Remaining (DIR)
    - Stockout Risk Alert level (CRITICAL, WARNING, SAFE)
    """
    if df.empty:
        return {"items": [], "summary": {}}

    # Z-factor mapping for service levels
    z_map = {0.90: 1.28, 0.95: 1.65, 0.99: 2.33}
    z_score = z_map.get(round(service_level, 2), 1.65)

    products = df["product_name"].unique()
    recommendations = []

    total_inventory_value = 0.0
    critical_stockouts = 0
    reorder_required_count = 0

    for prod in products:
        prod_df = df[df["product_name"] == prod]
        if prod_df.empty:
            continue

        prod_id = prod_df["product_id"].iloc[0]
        category = prod_df["category"].iloc[0]
        price = float(prod_df["price"].iloc[0])
        current_stock = int(prod_df["stock_level"].iloc[0])
        lead_time = int(prod_df["lead_time_days"].iloc[0])

        # Get 30-day forecast to determine expected daily demand
        f_res = forecast_demand(prod_df, horizon=30, product_name=prod)
        daily_demand = f_res["summary"]["avg_forecast_daily"]

        # Calculate daily demand standard deviation from historical data
        daily_hist = prod_df.groupby("date")["sales_qty"].sum()
        std_demand = float(daily_hist.std() or 1.0)

        # 1. Lead Time Demand (LTD)
        ltd = daily_demand * lead_time

        # 2. Safety Stock (SS = Z * std_d * sqrt(L))
        safety_stock = int(np.ceil(z_score * std_demand * np.sqrt(lead_time)))

        # 3. Reorder Point (ROP = LTD + SS)
        reorder_point = int(np.ceil(ltd + safety_stock))

        # 4. Economic Order Quantity (EOQ = sqrt(2 * D * S / H))
        annual_demand = max(1, daily_demand * 365)
        unit_holding_cost = max(0.5, price * holding_cost_pct)
        eoq = int(np.ceil(np.sqrt((2 * annual_demand * order_cost) / unit_holding_cost)))

        # 5. Days of Inventory Remaining (DIR)
        dir_days = round(current_stock / max(0.1, daily_demand), 1)

        # 6. Risk Level & Status
        if current_stock <= reorder_point / 2.0:
            status = "CRITICAL"
            action = f"URGENT: Reorder immediately! Stock ({current_stock}) is below critical safety threshold."
            critical_stockouts += 1
            reorder_required_count += 1
        elif current_stock <= reorder_point:
            status = "WARNING"
            action = f"Reorder soon. Stock ({current_stock}) is at or below Reorder Point ({reorder_point})."
            reorder_required_count += 1
        else:
            status = "HEALTHY"
            action = f"Stock level healthy ({current_stock} units). Next order recommended in {max(0, int(dir_days - lead_time))} days."

        inv_value = round(current_stock * price, 2)
        total_inventory_value += inv_value

        recommendations.append({
            "product_id": prod_id,
            "product_name": prod,
            "category": category,
            "unit_price": price,
            "current_stock": current_stock,
            "lead_time_days": lead_time,
            "daily_demand": daily_demand,
            "std_demand": round(std_demand, 2),
            "safety_stock": safety_stock,
            "reorder_point": reorder_point,
            "eoq": eoq,
            "inventory_value": inv_value,
            "days_of_supply": dir_days,
            "status": status,
            "recommended_action": action,
            "suggested_order_qty": eoq if current_stock <= reorder_point else 0
        })

    return {
        "summary": {
            "total_products": len(recommendations),
            "total_inventory_value": round(total_inventory_value, 2),
            "critical_stockouts": critical_stockouts,
            "reorder_required_count": reorder_required_count,
            "service_level_pct": int(service_level * 100)
        },
        "inventory": recommendations
    }
