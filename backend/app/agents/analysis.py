import json
import time

import pandas as pd

from app.config import settings
from app.agents.prompts import ANALYSIS_PROMPT
from app.utils.statistics import compute_all_metrics


def analysis_node(state: dict) -> dict:
    start = time.time()

    # Use cleaned data if available, otherwise raw
    data = state.get("cleaned_data") or state.get("csv_data")
    if not data:
        return {
            "completed_tasks": ["analysis"],
            "current_agent": "analysis",
            "agent_trace": [{"agent": "analysis", "skipped": True, "reason": "No data", "duration": 0}],
        }

    df = pd.DataFrame(data["full_data"])
    all_metrics = compute_all_metrics(df)

    # Get AI interpretation if Gemini is configured
    interpretation = None
    if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "your-gemini-api-key":
        try:
            from app.agents.orchestrator import get_llm

            # Prepare a condensed stats summary for the prompt
            stats_summary = {
                "descriptive": {col: {k: v for k, v in stats.items() if k in ["mean", "median", "std_dev", "min", "max"]}
                               for col, stats in all_metrics["descriptive"].items()},
                "correlation_highlights": [],
                "hypothesis_tests": all_metrics["hypothesis_tests"][:3],
                "trend_summary": {col: t["direction"] for col, t in all_metrics["trends"].items()},
            }

            # Find notable correlations (|r| > 0.5)
            corr = all_metrics["correlations"]
            if corr["columns"]:
                for i, col_a in enumerate(corr["columns"]):
                    for j, col_b in enumerate(corr["columns"]):
                        if i < j and abs(corr["matrix"][i][j]) > 0.5:
                            stats_summary["correlation_highlights"].append({
                                "columns": [col_a, col_b],
                                "r": corr["matrix"][i][j],
                            })

            prompt = ANALYSIS_PROMPT.format(
                columns=data["columns"],
                row_count=data["row_count"],
                stats_json=json.dumps(stats_summary, indent=2)[:3000],
                user_query=state.get("user_query", ""),
            )

            llm = get_llm()
            response = llm.invoke(prompt)
            interpretation = response.content
        except Exception as e:
            interpretation = f"AI interpretation unavailable: {str(e)}"

    all_metrics["interpretation"] = interpretation

    return {
        "analysis_results": all_metrics,
        "completed_tasks": ["analysis"],
        "current_agent": "analysis",
        "agent_trace": [{"agent": "analysis", "metrics_computed": len(all_metrics["descriptive"]), "duration": round(time.time() - start, 2)}],
    }
