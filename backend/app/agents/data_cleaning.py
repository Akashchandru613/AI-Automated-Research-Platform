import json
import time

import pandas as pd
import numpy as np

from app.config import settings
from app.agents.prompts import DATA_CLEANING_PROMPT


def data_cleaning_node(state: dict) -> dict:
    start = time.time()
    csv_data = state.get("csv_data")

    if not csv_data:
        return {
            "completed_tasks": ["data_cleaning"],
            "current_agent": "data_cleaning",
            "agent_trace": [{"agent": "data_cleaning", "skipped": True, "reason": "No CSV data", "duration": 0}],
        }

    df = pd.DataFrame(csv_data["full_data"])

    # Missing values analysis
    missing = {}
    for col in df.columns:
        miss_count = int(df[col].isna().sum())
        if miss_count > 0:
            missing[col] = {
                "count": miss_count,
                "percentage": round(miss_count / len(df) * 100, 2),
                "recommendation": "drop" if miss_count / len(df) > 0.5 else "impute",
            }

    # Outlier detection using IQR for numeric columns
    outliers = {}
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    for col in numeric_cols:
        series = df[col].dropna()
        if len(series) < 4:
            continue
        q1 = float(series.quantile(0.25))
        q3 = float(series.quantile(0.75))
        iqr = q3 - q1
        lower = q1 - 1.5 * iqr
        upper = q3 + 1.5 * iqr
        outlier_count = int(((series < lower) | (series > upper)).sum())
        if outlier_count > 0:
            outliers[col] = {
                "count": outlier_count,
                "method": "IQR",
                "bounds": [round(lower, 4), round(upper, 4)],
            }

    # Type issues
    type_issues = {}
    for col in df.columns:
        if df[col].dtype == object:
            try:
                pd.to_numeric(df[col], errors="raise")
                type_issues[col] = {
                    "current_type": "object",
                    "suggested_type": "numeric",
                    "reason": "Column contains numeric values stored as strings",
                }
            except (ValueError, TypeError):
                pass

    total_issues = sum(m["count"] for m in missing.values()) + sum(o["count"] for o in outliers.values()) + len(type_issues)
    max_issues = len(df) * len(df.columns)
    quality_score = max(0, round(100 - (total_issues / max(max_issues, 1) * 100)))

    cleaning_report = {
        "missing_values": missing,
        "outliers": outliers,
        "type_issues": type_issues,
        "overall_quality_score": quality_score,
        "summary": f"Dataset has {len(df)} rows, {len(df.columns)} columns. Quality score: {quality_score}/100. "
                   f"Found {len(missing)} columns with missing values, {len(outliers)} columns with outliers, "
                   f"{len(type_issues)} type issues.",
    }

    # Clean the data (impute missing, fix types)
    cleaned_df = df.copy()
    for col in numeric_cols:
        if col in missing:
            cleaned_df[col].fillna(cleaned_df[col].median(), inplace=True)
    for col, issue in type_issues.items():
        if issue["suggested_type"] == "numeric":
            cleaned_df[col] = pd.to_numeric(cleaned_df[col], errors="coerce")

    cleaned_data = {
        "columns": cleaned_df.columns.tolist(),
        "dtypes": {col: str(dtype) for col, dtype in cleaned_df.dtypes.items()},
        "row_count": len(cleaned_df),
        "full_data": cleaned_df.to_dict(orient="list"),
    }

    return {
        "cleaning_report": cleaning_report,
        "cleaned_data": cleaned_data,
        "completed_tasks": ["data_cleaning"],
        "current_agent": "data_cleaning",
        "agent_trace": [{"agent": "data_cleaning", "quality_score": quality_score, "duration": round(time.time() - start, 2)}],
    }
