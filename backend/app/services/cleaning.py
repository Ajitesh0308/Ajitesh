import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import io
from typing import Dict, Any, Tuple, List, Optional

def generate_sample_sales_data(days: int = 180) -> pd.DataFrame:
    """Generates synthetic multi-product sales data over a given number of days."""
    np.random.seed(42)
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=days)
    dates = pd.date_range(start=start_date, end=end_date, freq='D')
    start_timestamp = pd.Timestamp(start_date)

    categories = {
        'Electronics': [
            {'id': 'PROD-101', 'name': 'Wireless Headphones', 'base_qty': 45, 'price': 89.99, 'stock': 350, 'lead_time': 5},
            {'id': 'PROD-102', 'name': 'Mechanical Keyboard', 'base_qty': 30, 'price': 129.50, 'stock': 200, 'lead_time': 7},
            {'id': 'PROD-103', 'name': '4K Monitor 27"', 'base_qty': 20, 'price': 349.99, 'stock': 85, 'lead_time': 10}
        ],
        'Apparel': [
            {'id': 'PROD-201', 'name': 'Running Shoes', 'base_qty': 60, 'price': 75.00, 'stock': 420, 'lead_time': 4},
            {'id': 'PROD-202', 'name': 'Cotton Hoodie', 'base_qty': 50, 'price': 49.99, 'stock': 300, 'lead_time': 3}
        ],
        'Home & Kitchen': [
            {'id': 'PROD-301', 'name': 'Espresso Machine', 'base_qty': 15, 'price': 299.00, 'stock': 60, 'lead_time': 14}
        ]
    }

    rows = []

    for dt in dates:
        day_of_week = dt.weekday()
        # Weekly seasonality multiplier (weekends sell more)
        seasonality = 1.35 if day_of_week in [5, 6] else 1.0
        # Long term upward trend factor
        trend = 1.0 + (dt - start_timestamp).days * 0.0015

        for category, products in categories.items():
            for prod in products:
                # Base random noise
                noise = np.random.normal(1.0, 0.18)

                # Synthetic anomaly spikes on random days
                is_spike = np.random.rand() < 0.015
                anomaly_factor = np.random.uniform(2.5, 4.0) if is_spike else 1.0

                sales = int(max(0, round(prod['base_qty'] * seasonality * trend * noise * anomaly_factor)))
                revenue = round(sales * prod['price'], 2)

                rows.append({
                    'date': dt.strftime('%Y-%m-%d'),
                    'product_id': prod['id'],
                    'product_name': prod['name'],
                    'category': category,
                    'sales_qty': sales,
                    'price': prod['price'],
                    'revenue': revenue,
                    'stock_level': prod['stock'],
                    'lead_time_days': prod['lead_time']
                })

    df = pd.DataFrame(rows)

    # Introduce a few realistic data quality issues for cleaning test
    if len(df) > 20:
        # 1. Null sales values in 2% of rows
        null_indices = np.random.choice(df.index, size=int(len(df) * 0.02), replace=False)
        df.loc[null_indices, 'sales_qty'] = np.nan

        # 2. Duplicate rows
        dup_indices = np.random.choice(df.index, size=int(len(df) * 0.01), replace=False)
        duplicates = df.loc[dup_indices].copy()
        df = pd.concat([df, duplicates], ignore_index=True)

    return df


def clean_sales_data(
    df: pd.DataFrame,
    impute_method: str = 'ffill',
    drop_duplicates: bool = True
) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Cleans raw sales dataset:
    - Standardizes column names
    - Converts date strings to YYYY-MM-DD
    - Handles missing values according to selected method ('ffill', 'bfill', 'mean', 'zero')
    - Removes or aggregates duplicates
    - Calculates missing revenues or prices
    """
    raw_rows = len(df)
    cleaning_stats = {
        'initial_rows': raw_rows,
        'missing_values_fixed': 0,
        'duplicates_removed': 0,
        'final_rows': 0,
        'columns_found': list(df.columns)
    }

    # Standardize column headers
    col_mapping = {}
    for col in df.columns:
        c_lower = str(col).strip().lower().replace(' ', '_').replace('-', '_')
        if c_lower in ['date', 'ds', 'timestamp', 'time', 'day']:
            col_mapping[col] = 'date'
        elif c_lower in ['product_id', 'productid', 'sku', 'item_id', 'id']:
            col_mapping[col] = 'product_id'
        elif c_lower in ['product_name', 'productname', 'item_name', 'title', 'product']:
            col_mapping[col] = 'product_name'
        elif c_lower in ['category', 'cat', 'department']:
            col_mapping[col] = 'category'
        elif c_lower in ['sales_qty', 'sales', 'quantity', 'qty', 'units_sold', 'demand']:
            col_mapping[col] = 'sales_qty'
        elif c_lower in ['price', 'unit_price', 'cost']:
            col_mapping[col] = 'price'
        elif c_lower in ['revenue', 'sales_amount', 'total_sales', 'total']:
            col_mapping[col] = 'revenue'
        elif c_lower in ['stock_level', 'stock', 'inventory', 'current_stock']:
            col_mapping[col] = 'stock_level'
        elif c_lower in ['lead_time_days', 'lead_time', 'leadtime']:
            col_mapping[col] = 'lead_time_days'

    df = df.rename(columns=col_mapping)

    # Ensure required columns exist
    if 'date' not in df.columns:
        raise ValueError("Missing 'date' column in CSV file.")
    if 'sales_qty' not in df.columns:
        raise ValueError("Missing 'sales_qty' / 'quantity' / 'demand' column in CSV file.")

    if 'product_id' not in df.columns:
        df['product_id'] = 'DEFAULT_PROD'
    if 'product_name' not in df.columns:
        df['product_name'] = df['product_id']
    if 'category' not in df.columns:
        df['category'] = 'General'

    if 'price' not in df.columns:
        df['price'] = np.nan
    if 'revenue' not in df.columns:
        df['revenue'] = np.nan
    if 'stock_level' not in df.columns:
        df['stock_level'] = 100
    if 'lead_time_days' not in df.columns:
        df['lead_time_days'] = 7

    # Convert date
    df['date'] = pd.to_datetime(df['date'], errors='coerce')
    # Drop rows with invalid unparseable dates
    df = df.dropna(subset=['date'])
    df['date'] = df['date'].dt.strftime('%Y-%m-%d')

    # Handle duplicates
    if drop_duplicates:
        initial_len = len(df)
        df = df.groupby(['date', 'product_id', 'product_name', 'category'], as_index=False).agg({
            'sales_qty': 'sum',
            'price': 'mean',
            'revenue': 'sum',
            'stock_level': 'first',
            'lead_time_days': 'first'
        })
        cleaning_stats['duplicates_removed'] = initial_len - len(df)

    # Count missing values before imputation
    missing_qty_count = df['sales_qty'].isnull().sum()
    cleaning_stats['missing_values_fixed'] += int(missing_qty_count)

    # Impute missing sales_qty
    if missing_qty_count > 0:
        if impute_method == 'zero':
            df['sales_qty'] = df['sales_qty'].fillna(0)
        elif impute_method == 'mean':
            df['sales_qty'] = df['sales_qty'].fillna(df['sales_qty'].mean())
        elif impute_method == 'bfill':
            df['sales_qty'] = df['sales_qty'].bfill().ffill()
        else: # ffill default
            df['sales_qty'] = df['sales_qty'].ffill().bfill()

    df['sales_qty'] = df['sales_qty'].apply(lambda x: max(0, round(float(x))))

    # Fill price/revenue defaults if missing
    if df['price'].isnull().all():
        df['price'] = 10.00
    else:
        df['price'] = df['price'].fillna(df['price'].median())

    if df['revenue'].isnull().all():
        df['revenue'] = df['sales_qty'] * df['price']
    else:
        df['revenue'] = df['revenue'].fillna(df['sales_qty'] * df['price'])

    df['stock_level'] = df['stock_level'].fillna(100)
    df['lead_time_days'] = df['lead_time_days'].fillna(7)

    # Sort chronological
    df = df.sort_values(by=['date', 'product_id']).reset_index(drop=True)
    cleaning_stats['final_rows'] = len(df)

    return df, cleaning_stats
