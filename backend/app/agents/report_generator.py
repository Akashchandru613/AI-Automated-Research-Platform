import json
import time

from app.config import settings
from app.agents.prompts import REPORT_PROMPT


def _build_rich_template(user_query, cleaning_report, analysis_results, document_summary, key_findings, literature_results):
    """Generate a detailed report from analysis data without AI."""
    sections = []
    sections.append(f"# Research Report: {user_query}\n")

    # Executive Summary
    summary_parts = []
    if analysis_results and analysis_results.get("descriptive"):
        n_cols = len(analysis_results["descriptive"])
        first_col = list(analysis_results["descriptive"].keys())[0] if n_cols else None
        n_rows = analysis_results["descriptive"].get(first_col, {}).get("count", "unknown") if first_col else "unknown"
        summary_parts.append(f"This analysis examined a dataset with **{n_cols} numeric variables** and **{n_rows} observations**.")
    if cleaning_report:
        score = cleaning_report.get("overall_quality_score", "N/A")
        summary_parts.append(f"The data quality score is **{score}/100**.")
    if literature_results:
        summary_parts.append(f"**{len(literature_results)} related academic papers** were identified.")
    sections.append(f"## Executive Summary\n\n" + " ".join(summary_parts) + "\n")

    # Data Quality
    if cleaning_report:
        sections.append("## Data Quality Assessment\n")
        score = cleaning_report.get("overall_quality_score", "N/A")
        sections.append(f"**Overall Quality Score: {score}/100**\n")

        missing = cleaning_report.get("missing_values", {})
        if missing:
            sections.append("### Missing Values\n")
            sections.append("| Column | Missing Count | Percentage | Recommendation |")
            sections.append("|--------|--------------|------------|----------------|")
            for col, info in missing.items():
                sections.append(f"| {col} | {info['count']} | {info['percentage']}% | {info['recommendation']} |")
            sections.append("")

        outliers = cleaning_report.get("outliers", {})
        if outliers:
            sections.append("### Outliers Detected\n")
            sections.append("| Column | Outlier Count | Lower Bound | Upper Bound |")
            sections.append("|--------|--------------|-------------|-------------|")
            for col, info in outliers.items():
                sections.append(f"| {col} | {info['count']} | {info['bounds'][0]} | {info['bounds'][1]} |")
            sections.append("")

        if not missing and not outliers:
            sections.append("No missing values or outliers detected. The dataset is clean.\n")

    # Statistical Analysis
    if analysis_results and analysis_results.get("descriptive"):
        desc = analysis_results["descriptive"]
        sections.append("## Statistical Analysis\n")
        sections.append("### Descriptive Statistics\n")
        sections.append("| Variable | Mean | Median | Std Dev | Min | Max |")
        sections.append("|----------|------|--------|---------|-----|-----|")
        for col, stats in desc.items():
            sections.append(
                f"| **{col}** | {stats.get('mean', 'N/A')} | {stats.get('median', 'N/A')} | "
                f"{stats.get('std_dev', 'N/A')} | {stats.get('min', 'N/A')} | {stats.get('max', 'N/A')} |"
            )
        sections.append("")

        # Correlations
        corr = analysis_results.get("correlations", {})
        if corr.get("columns") and corr.get("matrix"):
            sections.append("### Notable Correlations\n")
            notable = []
            cols = corr["columns"]
            matrix = corr["matrix"]
            for i in range(len(cols)):
                for j in range(i + 1, len(cols)):
                    r = matrix[i][j]
                    if abs(r) > 0.4:
                        strength = "strong" if abs(r) > 0.7 else "moderate"
                        direction = "positive" if r > 0 else "negative"
                        notable.append((cols[i], cols[j], r, strength, direction))
            if notable:
                for col_a, col_b, r, strength, direction in sorted(notable, key=lambda x: -abs(x[2])):
                    sections.append(f"- **{col_a}** and **{col_b}**: r = {r:.4f} ({strength} {direction} correlation)")
            else:
                sections.append("No strong correlations (|r| > 0.4) found between variables.")
            sections.append("")

        # Hypothesis Tests
        tests = analysis_results.get("hypothesis_tests", [])
        if tests:
            sections.append("### Hypothesis Tests\n")
            for test in tests:
                name = test.get("test_name", "Test")
                p = test.get("p_value", "N/A")
                conclusion = test.get("conclusion", "")
                col_info = test.get("column", test.get("columns", ""))
                sections.append(f"- **{name}** ({col_info}): p-value = {p} — {conclusion}")
            sections.append("")

        # Trends
        trends = analysis_results.get("trends", {})
        if trends:
            sections.append("### Trend Analysis\n")
            for col, t in trends.items():
                direction = t.get("direction", "unknown")
                r2 = t.get("r_squared", "N/A")
                slope = t.get("slope", "N/A")
                sections.append(f"- **{col}**: {direction} trend (slope = {slope}, R\u00b2 = {r2})")
            sections.append("")

    # Document Insights
    if document_summary and document_summary != "No documents were analyzed.":
        sections.append(f"## Document Insights\n\n{document_summary}\n")

    if key_findings:
        sections.append("### Key Findings\n")
        for f in key_findings:
            sections.append(f"- {f}")
        sections.append("")

    # Literature
    if literature_results:
        sections.append("## Related Literature\n")
        for i, paper in enumerate(literature_results[:8], 1):
            title = paper.get("title", "Unknown")
            year = paper.get("year", "N/A")
            authors = ", ".join(paper.get("authors", [])[:3])
            if len(paper.get("authors", [])) > 3:
                authors += " et al."
            abstract = paper.get("abstract", "")[:150]
            sections.append(f"**[{i}]** {title} ({year})")
            if authors:
                sections.append(f"   *{authors}*")
            if abstract:
                sections.append(f"   {abstract}...")
            sections.append("")

    # Conclusions
    sections.append("## Conclusions\n")
    if analysis_results and analysis_results.get("descriptive"):
        n_vars = len(analysis_results["descriptive"])
        sections.append(f"The analysis covered {n_vars} numeric variables. ")
        notable_corrs = []
        corr = analysis_results.get("correlations", {})
        if corr.get("columns"):
            cols = corr["columns"]
            matrix = corr["matrix"]
            for i in range(len(cols)):
                for j in range(i + 1, len(cols)):
                    if abs(matrix[i][j]) > 0.5:
                        notable_corrs.append(f"{cols[i]}-{cols[j]}")
        if notable_corrs:
            sections.append(f"Notable correlations were found between: {', '.join(notable_corrs[:5])}. ")
        sections.append("Review the interactive dashboard for detailed visualizations and further exploration.\n")

    sections.append("---\n*Generated by ATLAS - AI-Powered Tool for Literature & Analytical Studies*")

    return "\n".join(sections)


def report_generator_node(state: dict) -> dict:
    start = time.time()

    user_query = state.get("user_query", "Analyze the provided data")
    cleaning_report = state.get("cleaning_report")
    analysis_results = state.get("analysis_results")
    document_summary = state.get("document_summary")
    key_findings = state.get("key_findings")
    literature_results = state.get("literature_results")

    if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "your-gemini-api-key":
        report = _build_rich_template(user_query, cleaning_report, analysis_results, document_summary, key_findings, literature_results)
        return {
            "final_report": report,
            "completed_tasks": ["report_generator"],
            "current_agent": "report_generator",
            "agent_trace": [{"agent": "report_generator", "method": "template", "duration": round(time.time() - start, 2)}],
        }

    # Format for AI prompt
    cleaning_str = json.dumps(cleaning_report, indent=2)[:2000] if cleaning_report else "No data cleaning performed."
    analysis_str = ""
    if analysis_results:
        interpretation = analysis_results.get("interpretation", "")
        descriptive = analysis_results.get("descriptive", {})
        analysis_str = f"Interpretation:\n{interpretation}\n\nDescriptive Stats:\n{json.dumps(descriptive, indent=2)[:2000]}"
    else:
        analysis_str = "No statistical analysis performed."

    doc_str = document_summary or "No documents analyzed."
    findings_str = "\n".join(f"- {f}" for f in (key_findings or [])) or "None."
    lit_str = ""
    if literature_results:
        for paper in literature_results[:5]:
            lit_str += f"- {paper.get('title', 'Unknown')} ({paper.get('year', 'N/A')}) by {', '.join(paper.get('authors', [])[:3])}\n"
    else:
        lit_str = "No related literature found."

    try:
        from app.agents.orchestrator import get_llm
        prompt = REPORT_PROMPT.format(
            user_query=user_query, cleaning_report=cleaning_str,
            analysis_results=analysis_str, document_summary=doc_str,
            key_findings=findings_str, literature_results=lit_str,
        )
        llm = get_llm()
        response = llm.invoke(prompt)
        return {
            "final_report": response.content,
            "completed_tasks": ["report_generator"],
            "current_agent": "report_generator",
            "agent_trace": [{"agent": "report_generator", "method": "ai", "duration": round(time.time() - start, 2)}],
        }
    except Exception as e:
        # Fallback to template on AI failure
        report = _build_rich_template(user_query, cleaning_report, analysis_results, document_summary, key_findings, literature_results)
        return {
            "final_report": report,
            "completed_tasks": ["report_generator"],
            "current_agent": "report_generator",
            "agent_trace": [{"agent": "report_generator", "method": "template-fallback", "error": str(e), "duration": round(time.time() - start, 2)}],
        }
