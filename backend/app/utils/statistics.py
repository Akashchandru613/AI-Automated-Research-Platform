import numpy as np
import pandas as pd
from scipy import stats


def compute_descriptive_stats(df: pd.DataFrame) -> dict:
    results = {}
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()

    for col in numeric_cols:
        series = df[col].dropna()
        if len(series) == 0:
            continue
        results[col] = {
            "mean": round(float(series.mean()), 4),
            "median": round(float(series.median()), 4),
            "mode": round(float(series.mode().iloc[0]), 4) if len(series.mode()) > 0 else None,
            "std_dev": round(float(series.std()), 4),
            "variance": round(float(series.var()), 4),
            "min": round(float(series.min()), 4),
            "max": round(float(series.max()), 4),
            "q1": round(float(series.quantile(0.25)), 4),
            "q3": round(float(series.quantile(0.75)), 4),
            "skewness": round(float(series.skew()), 4),
            "kurtosis": round(float(series.kurtosis()), 4),
            "missing_count": int(df[col].isna().sum()),
            "unique_count": int(series.nunique()),
            "count": int(len(series)),
        }
    return results


def compute_correlation_matrix(df: pd.DataFrame) -> dict:
    numeric_df = df.select_dtypes(include=[np.number])
    if numeric_df.shape[1] < 2:
        return {"columns": [], "matrix": []}

    corr = numeric_df.corr()
    return {
        "columns": corr.columns.tolist(),
        "matrix": [[round(float(v), 4) for v in row] for row in corr.values],
    }


def compute_hypothesis_tests(df: pd.DataFrame) -> list[dict]:
    tests = []
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()

    for col in numeric_cols:
        series = df[col].dropna()
        if len(series) < 8:
            continue

        # Normality test (Shapiro-Wilk, max 5000 samples)
        sample = series.sample(min(len(series), 5000), random_state=42)
        stat, p_value = stats.shapiro(sample)
        tests.append({
            "test_name": "Shapiro-Wilk Normality Test",
            "column": col,
            "statistic": round(float(stat), 6),
            "p_value": round(float(p_value), 6),
            "conclusion": f"{'Normally' if p_value > 0.05 else 'Not normally'} distributed (p={p_value:.4f})",
        })

    # T-test for first two numeric columns
    if len(numeric_cols) >= 2:
        col_a, col_b = numeric_cols[0], numeric_cols[1]
        a = df[col_a].dropna()
        b = df[col_b].dropna()
        if len(a) > 1 and len(b) > 1:
            stat, p_value = stats.ttest_ind(a, b, equal_var=False)
            tests.append({
                "test_name": "Welch's T-Test",
                "columns": [col_a, col_b],
                "statistic": round(float(stat), 6),
                "p_value": round(float(p_value), 6),
                "conclusion": f"{'Significant' if p_value < 0.05 else 'No significant'} difference (p={p_value:.4f})",
            })

    return tests


def compute_distributions(df: pd.DataFrame, bins: int = 20) -> dict:
    distributions = {}
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()

    for col in numeric_cols:
        series = df[col].dropna()
        if len(series) == 0:
            continue
        hist, bin_edges = np.histogram(series, bins=bins)
        distributions[col] = {
            "counts": [int(h) for h in hist],
            "bin_edges": [round(float(e), 4) for e in bin_edges],
        }
    return distributions


def compute_trends(df: pd.DataFrame) -> dict:
    trends = {}
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()

    for col in numeric_cols:
        series = df[col].dropna()
        if len(series) < 3:
            continue
        x = np.arange(len(series))
        slope, intercept, r_value, p_value, std_err = stats.linregress(x, series.values)
        trends[col] = {
            "slope": round(float(slope), 6),
            "intercept": round(float(intercept), 4),
            "r_squared": round(float(r_value**2), 4),
            "p_value": round(float(p_value), 6),
            "direction": "increasing" if slope > 0 else "decreasing" if slope < 0 else "flat",
        }
    return trends


def compute_all_metrics(df: pd.DataFrame) -> dict:
    return {
        "descriptive": compute_descriptive_stats(df),
        "correlations": compute_correlation_matrix(df),
        "hypothesis_tests": compute_hypothesis_tests(df),
        "distributions": compute_distributions(df),
        "trends": compute_trends(df),
    }
