import json
import re

from app.config import settings
from app.agents.prompts import CHAT_PROMPT


def _local_answer(current_message: str, columns: list[str], analysis_summary: str) -> str | None:
    """Try to answer simple questions from the analysis data without AI."""
    msg = current_message.lower().strip()

    # Greetings and general conversation
    if msg in ("hi", "hello", "hey", "hi!", "hello!", "hey!", "howdy", "sup"):
        col_list = ", ".join(columns[:5]) + ("..." if len(columns) > 5 else "")
        return (
            f"Hi! I'm your ATLAS research assistant. I can help you explore your analysis results.\n\n"
            f"Your dataset has **{len(columns)} columns**: {col_list}\n\n"
            f"Try asking me:\n"
            f"- \"What is the average salary?\"\n"
            f"- \"Are there any outliers?\"\n"
            f"- \"What are the key insights?\"\n"
            f"- \"Suggest hypotheses to test\""
        )

    if any(w in msg for w in ["thank", "thanks", "thx"]):
        return "You're welcome! Let me know if you have more questions about your data."

    if msg in ("help", "what can you do", "what can you do?"):
        return (
            "I can help you with:\n\n"
            "- **Data questions**: \"What is the average X?\" or \"Show me stats for Y\"\n"
            "- **Outlier detection**: \"Are there any outliers?\"\n"
            "- **Insights**: \"What are the key findings?\"\n"
            "- **Hypothesis suggestions**: \"Suggest hypotheses\"\n"
            "- **Navigation**: \"Where can I see correlations?\"\n\n"
            "You can also explore the **Metrics**, **Charts**, and **Report** tabs directly."
        )

    # Parse analysis summary to extract metrics
    metrics = {}
    try:
        if analysis_summary:
            metrics = json.loads(analysis_summary) if analysis_summary.startswith("{") else {}
    except Exception:
        pass

    # Check for "average/mean of X" pattern
    for col in columns:
        col_lower = col.lower()
        if col_lower in msg and any(w in msg for w in ["average", "mean", "avg"]):
            if isinstance(metrics, dict):
                for key, val in metrics.items():
                    if col_lower in key.lower() and "mean" in key.lower():
                        return f"The average **{col}** is **{val}**."
            return f"Check the Metrics tab for the mean value of {col}."

    # General insights
    if any(w in msg for w in ["insight", "finding", "key", "summary", "tell me about"]):
        if columns:
            return (
                f"Based on the analysis of {len(columns)} columns ({', '.join(columns[:5])}), "
                f"check the **Metrics tab** for descriptive statistics, the **Correlation Matrix** "
                f"for relationships between variables, and the **Trends** section for directional patterns. "
                f"The **Report tab** has a full written summary."
            )

    # Outlier questions
    if "outlier" in msg:
        return (
            "Check the **Distributions** section in the Metrics tab — outliers are visible as bars "
            "far from the main distribution. Also check the Data Quality section of the Report."
        )

    # Hypothesis suggestions
    if "hypothes" in msg or "suggest" in msg:
        if len(columns) >= 2:
            return (
                f"Based on the available data, here are some hypotheses to test:\n\n"
                f"1. **Is there a significant correlation between {columns[0]} and {columns[1]}?** — Check the Correlation Matrix\n"
                f"2. **Are the distributions normal?** — Check Hypothesis Tests (Shapiro-Wilk results)\n"
                f"3. **Are there significant trends over time?** — Check the Trends section\n\n"
                f"Use the custom Chart Builder to visualize any of these relationships."
            )

    return None


def get_chat_response(
    user_query: str,
    columns: list[str],
    analysis_summary: str,
    chat_history: list[dict],
    current_message: str,
) -> str:
    history_str = ""
    for msg in chat_history[-10:]:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        history_str += f"{role}: {content}\n"

    if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "your-gemini-api-key":
        # Try local answer
        local = _local_answer(current_message, columns, analysis_summary)
        if local:
            return local
        return (
            "AI chat requires a Gemini API key. Configure GEMINI_API_KEY in the .env file.\n\n"
            "In the meantime, explore the **Metrics**, **Charts**, and **Report** tabs for insights."
        )

    # Try AI, with fast fallback — use google.generativeai directly (no langchain retry)
    try:
        import google.generativeai as genai

        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-2.0-flash")

        prompt = CHAT_PROMPT.format(
            user_query=user_query,
            columns=", ".join(columns) if columns else "N/A",
            analysis_summary=analysis_summary[:2000],
            chat_history=history_str,
            current_message=current_message,
        )
        response = model.generate_content(prompt)
        return response.text

    except Exception as e:
        # Fallback to local answer
        local = _local_answer(current_message, columns, analysis_summary)
        if local:
            return local

        if "429" in str(e) or "quota" in str(e).lower():
            return (
                "The AI service is temporarily rate-limited. Please try again in a minute.\n\n"
                "Meanwhile, explore the **Metrics**, **Charts**, and **Report** tabs for insights."
            )
        return "Sorry, I couldn't process your question right now. Please try again."
