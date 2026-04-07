import json
import time

from app.config import settings
from app.agents.prompts import ORCHESTRATOR_PROMPT


def get_llm():
    from langchain_google_genai import ChatGoogleGenerativeAI
    return ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        google_api_key=settings.GEMINI_API_KEY,
        temperature=0.1,
        max_retries=1,
    )


def orchestrator_node(state: dict) -> dict:
    start = time.time()

    user_query = state.get("user_query", "")
    file_type = state.get("file_type", "text")
    has_csv = state.get("csv_data") is not None
    has_pdf = state.get("pdf_text") is not None

    # If no Gemini key, use rule-based routing
    if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "your-gemini-api-key":
        tasks = []
        if has_csv:
            tasks.extend(["data_cleaning", "analysis"])
        if has_pdf:
            tasks.append("summary")
        tasks.append("literature")
        return {
            "tasks_to_run": tasks,
            "current_agent": "orchestrator",
            "agent_trace": [{"agent": "orchestrator", "tasks": tasks, "method": "rule-based", "duration": round(time.time() - start, 2)}],
        }

    prompt = ORCHESTRATOR_PROMPT.format(
        user_query=user_query,
        file_type=file_type,
        has_csv=has_csv,
        has_pdf=has_pdf,
    )

    try:
        llm = get_llm()
        response = llm.invoke(prompt)
        content = response.content.strip()
        if "[" in content:
            content = content[content.index("["):content.rindex("]") + 1]
        tasks = json.loads(content)
    except Exception:
        tasks = []
        if has_csv:
            tasks.extend(["data_cleaning", "analysis"])
        if has_pdf:
            tasks.append("summary")
        tasks.append("literature")

    return {
        "tasks_to_run": tasks,
        "current_agent": "orchestrator",
        "agent_trace": [{"agent": "orchestrator", "tasks": tasks, "duration": round(time.time() - start, 2)}],
    }
