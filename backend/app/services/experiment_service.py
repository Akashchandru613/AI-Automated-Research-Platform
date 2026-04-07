import json
import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session
from app.models.experiment import Experiment
from app.models.metric import Metric
from app.models.report import Report
from app.models.citation import Citation
from app.models.file_upload import FileUpload
from app.utils.file_parsers import parse_csv, parse_pdf


TEMPLATE_QUERIES = {
    "eda": "Perform exploratory data analysis. Identify patterns, distributions, correlations, and anomalies.",
    "ab_test": "Perform A/B test analysis. Compare groups and determine statistical significance.",
    "survey": "Analyze survey data. Identify response distributions, key themes, and demographic patterns.",
    "correlation": "Perform correlation analysis. Find relationships between variables and their significance.",
}


async def run_experiment_pipeline(experiment_id: uuid.UUID, file_upload_id: uuid.UUID | None, query: str):
    async with async_session() as db:
        # Update status to running
        result = await db.execute(select(Experiment).where(Experiment.id == experiment_id))
        experiment = result.scalar_one()
        experiment.status = "running"
        experiment.started_at = datetime.now(timezone.utc)
        await db.commit()

        try:
            # Build initial state
            initial_state = {
                "user_query": query,
                "csv_data": None,
                "pdf_text": None,
                "file_type": "text",
                "agent_trace": [],
            }

            # Load file if specified
            if file_upload_id:
                file_result = await db.execute(select(FileUpload).where(FileUpload.id == file_upload_id))
                file_upload = file_result.scalar_one_or_none()
                if file_upload:
                    if file_upload.file_type == "csv":
                        csv_data = parse_csv(file_upload.file_path)
                        initial_state["csv_data"] = csv_data
                        initial_state["file_type"] = "csv"
                    elif file_upload.file_type == "pdf":
                        pdf_data = parse_pdf(file_upload.file_path)
                        initial_state["pdf_text"] = pdf_data["text"]
                        initial_state["file_type"] = "pdf"

            # Run the LangGraph pipeline (lazy import to avoid slow startup)
            from app.agents.graph import get_compiled_graph
            graph = get_compiled_graph()
            final_state = graph.invoke(initial_state)

            # Persist metrics
            if final_state.get("analysis_results"):
                ar = final_state["analysis_results"]

                # Descriptive metrics
                for col, stats in ar.get("descriptive", {}).items():
                    for metric_name, value in stats.items():
                        metric = Metric(
                            experiment_id=experiment_id,
                            metric_name=metric_name,
                            metric_value={"value": value},
                            column_name=col,
                            category="descriptive",
                        )
                        db.add(metric)

                # Correlation matrix
                if ar.get("correlations", {}).get("matrix"):
                    metric = Metric(
                        experiment_id=experiment_id,
                        metric_name="correlation_matrix",
                        metric_value=ar["correlations"],
                        column_name=None,
                        category="inferential",
                    )
                    db.add(metric)

                # Hypothesis tests
                for test in ar.get("hypothesis_tests", []):
                    metric = Metric(
                        experiment_id=experiment_id,
                        metric_name=test["test_name"],
                        metric_value=test,
                        column_name=test.get("column"),
                        category="inferential",
                    )
                    db.add(metric)

                # Distributions
                for col, dist in ar.get("distributions", {}).items():
                    metric = Metric(
                        experiment_id=experiment_id,
                        metric_name="distribution",
                        metric_value=dist,
                        column_name=col,
                        category="descriptive",
                    )
                    db.add(metric)

                # Trends
                for col, trend in ar.get("trends", {}).items():
                    metric = Metric(
                        experiment_id=experiment_id,
                        metric_name="trend",
                        metric_value=trend,
                        column_name=col,
                        category="descriptive",
                    )
                    db.add(metric)

            # Persist cleaning metrics
            if final_state.get("cleaning_report"):
                cr = final_state["cleaning_report"]
                metric = Metric(
                    experiment_id=experiment_id,
                    metric_name="data_quality_score",
                    metric_value={"value": cr.get("overall_quality_score", 0)},
                    column_name=None,
                    category="cleaning",
                )
                db.add(metric)

                for col, info in cr.get("outliers", {}).items():
                    metric = Metric(
                        experiment_id=experiment_id,
                        metric_name="outlier_count",
                        metric_value={"value": info["count"], "bounds": info["bounds"]},
                        column_name=col,
                        category="cleaning",
                    )
                    db.add(metric)

            # Persist report
            if final_state.get("final_report"):
                report = Report(
                    experiment_id=experiment_id,
                    title=f"Analysis Report: {query[:100]}",
                    content_markdown=final_state["final_report"],
                    summary=final_state.get("document_summary", "")[:500] if final_state.get("document_summary") else None,
                )
                db.add(report)
                await db.flush()

                # Persist citations from literature results
                for paper in (final_state.get("literature_results") or []):
                    citation = Citation(
                        report_id=report.id,
                        paper_title=paper.get("title", "Unknown"),
                        authors=paper.get("authors", []),
                        year=paper.get("year"),
                        doi=paper.get("doi"),
                        url=paper.get("url"),
                        relevance_score=0.5,
                        relationship_type="related",
                    )
                    db.add(citation)

            # Update experiment
            experiment.status = "completed"
            experiment.completed_at = datetime.now(timezone.utc)
            experiment.agent_trace = final_state.get("agent_trace", [])
            await db.commit()

        except Exception as e:
            experiment.status = "failed"
            experiment.error_message = str(e)
            experiment.completed_at = datetime.now(timezone.utc)
            await db.commit()
            raise
