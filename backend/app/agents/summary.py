import time

from app.config import settings
from app.agents.prompts import SUMMARY_PROMPT


def summary_node(state: dict) -> dict:
    start = time.time()
    pdf_text = state.get("pdf_text")

    if not pdf_text:
        return {
            "completed_tasks": ["summary"],
            "current_agent": "summary",
            "agent_trace": [{"agent": "summary", "skipped": True, "reason": "No PDF text", "duration": 0}],
        }

    # Truncate if too long
    doc_text = pdf_text[:8000]

    if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "your-gemini-api-key":
        # Fallback: basic extraction without AI
        sentences = pdf_text.split(".")
        summary = ". ".join(sentences[:10]) + "." if sentences else "No content to summarize."
        return {
            "document_summary": summary,
            "key_findings": ["AI summarization unavailable - showing first 10 sentences"],
            "completed_tasks": ["summary"],
            "current_agent": "summary",
            "agent_trace": [{"agent": "summary", "method": "fallback", "duration": round(time.time() - start, 2)}],
        }

    try:
        from app.agents.orchestrator import get_llm

        prompt = SUMMARY_PROMPT.format(
            document_text=doc_text,
            user_query=state.get("user_query", ""),
        )

        llm = get_llm()
        response = llm.invoke(prompt)
        content = response.content

        # Parse key findings (look for bullet points)
        lines = content.split("\n")
        findings = []
        summary_parts = []
        in_findings = False

        for line in lines:
            stripped = line.strip()
            if "key finding" in stripped.lower() or "finding" in stripped.lower() and "**" in stripped:
                in_findings = True
                continue
            if in_findings and (stripped.startswith("-") or stripped.startswith("*")):
                findings.append(stripped.lstrip("-* "))
            elif not in_findings:
                summary_parts.append(stripped)

        doc_summary = content  # Full AI response
        if not findings:
            findings = ["See full summary for details"]

        return {
            "document_summary": doc_summary,
            "key_findings": findings[:8],
            "completed_tasks": ["summary"],
            "current_agent": "summary",
            "agent_trace": [{"agent": "summary", "findings_count": len(findings), "duration": round(time.time() - start, 2)}],
        }
    except Exception as e:
        return {
            "document_summary": f"Summary generation failed: {str(e)}",
            "key_findings": [],
            "completed_tasks": ["summary"],
            "current_agent": "summary",
            "error": str(e),
            "agent_trace": [{"agent": "summary", "error": str(e), "duration": round(time.time() - start, 2)}],
        }
