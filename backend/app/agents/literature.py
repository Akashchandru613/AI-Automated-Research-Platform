import json
import time

import httpx

from app.config import settings
from app.agents.prompts import LITERATURE_PROMPT

SEMANTIC_SCHOLAR_API = "https://api.semanticscholar.org/graph/v1/paper/search/bulk"


def search_semantic_scholar_sync(query: str, limit: int = 5) -> list[dict]:
    try:
        response = httpx.get(
            SEMANTIC_SCHOLAR_API,
            params={
                "query": query,
                "limit": limit,
                "fields": "title,authors,year,abstract,url,citationCount,externalIds",
            },
            timeout=15,
        )
        response.raise_for_status()
        data = response.json()
        papers = []
        for paper in data.get("data", []):
            authors = [a.get("name", "") for a in paper.get("authors", [])]
            doi = paper.get("externalIds", {}).get("DOI")
            papers.append({
                "title": paper.get("title", ""),
                "authors": authors,
                "year": paper.get("year"),
                "abstract": (paper.get("abstract") or "")[:300],
                "url": paper.get("url", ""),
                "doi": doi,
                "citation_count": paper.get("citationCount", 0),
            })
        return papers
    except Exception:
        return []


async def search_semantic_scholar(query: str, limit: int = 10) -> list[dict]:
    """Async version for the API route."""
    async with httpx.AsyncClient(timeout=15) as client:
        try:
            response = await client.get(
                SEMANTIC_SCHOLAR_API,
                params={
                    "query": query,
                    "limit": limit,
                    "fields": "title,authors,year,abstract,url,citationCount,externalIds",
                },
            )
            response.raise_for_status()
            data = response.json()
            papers = []
            for paper in data.get("data", []):
                authors = [a.get("name", "") for a in paper.get("authors", [])]
                doi = paper.get("externalIds", {}).get("DOI")
                papers.append({
                    "title": paper.get("title", ""),
                    "authors": authors,
                    "year": paper.get("year"),
                    "abstract": (paper.get("abstract") or "")[:300],
                    "url": paper.get("url", ""),
                    "doi": doi,
                    "citation_count": paper.get("citationCount", 0),
                })
            return papers
        except Exception:
            return []


def literature_node_sync(state: dict) -> dict:
    start = time.time()

    user_query = state.get("user_query", "")
    analysis_summary = ""

    if state.get("analysis_results") and state["analysis_results"].get("interpretation"):
        analysis_summary = state["analysis_results"]["interpretation"][:500]
    elif state.get("document_summary"):
        analysis_summary = state["document_summary"][:500]

    search_queries = [user_query]

    if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "your-gemini-api-key":
        try:
            from app.agents.orchestrator import get_llm
            prompt = LITERATURE_PROMPT.format(
                user_query=user_query,
                analysis_summary=analysis_summary,
            )
            llm = get_llm()
            response = llm.invoke(prompt)
            content = response.content.strip()
            if "[" in content:
                content = content[content.index("["):content.rindex("]") + 1]
            extra_queries = json.loads(content)
            search_queries.extend(extra_queries[:3])
        except Exception:
            pass

    all_papers = []
    seen_titles = set()

    for query in search_queries[:4]:
        papers = search_semantic_scholar_sync(query, limit=3)
        for paper in papers:
            if paper["title"] not in seen_titles:
                seen_titles.add(paper["title"])
                all_papers.append(paper)
        time.sleep(0.5)

    return {
        "literature_results": all_papers[:10],
        "related_papers": all_papers[:10],
        "completed_tasks": ["literature"],
        "current_agent": "literature",
        "agent_trace": [{"agent": "literature", "papers_found": len(all_papers), "queries": search_queries, "duration": round(time.time() - start, 2)}],
    }
