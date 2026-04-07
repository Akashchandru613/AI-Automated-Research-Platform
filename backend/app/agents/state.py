from __future__ import annotations

from typing import TypedDict, Annotated
from operator import add


class AgentState(TypedDict, total=False):
    # --- Inputs ---
    user_query: str
    csv_data: dict | None              # {columns, dtypes, row_count, rows, full_data}
    pdf_text: str | None
    file_type: str                     # csv, pdf, text

    # --- Orchestrator ---
    tasks_to_run: list[str]
    completed_tasks: Annotated[list[str], add]

    # --- Data Cleaning Agent ---
    cleaning_report: dict | None
    cleaned_data: dict | None

    # --- Analysis Agent ---
    analysis_results: dict | None

    # --- Summary Agent ---
    document_summary: str | None
    key_findings: list[str] | None

    # --- Literature Agent ---
    literature_results: list[dict] | None
    related_papers: list[dict] | None

    # --- Report Generator ---
    final_report: str | None

    # --- Control ---
    current_agent: str
    error: str | None
    agent_trace: Annotated[list[dict], add]
