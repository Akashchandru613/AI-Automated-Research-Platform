from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.experiment import Experiment
from app.models.report import Report
from app.models.citation import Citation
from app.agents.literature import search_semantic_scholar

router = APIRouter(tags=["literature"])


@router.get("/api/literature/search")
async def search_literature(
    query: str = Query(...),
    current_user: User = Depends(get_current_user),
):
    papers = await search_semantic_scholar(query, limit=10)
    return {"papers": papers, "query": query}


@router.get("/api/experiments/{experiment_id}/knowledge-graph")
async def get_knowledge_graph(
    experiment_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Get experiment
    result = await db.execute(select(Experiment).where(Experiment.id == experiment_id))
    experiment = result.scalar_one_or_none()
    if not experiment:
        return {"nodes": [], "links": []}

    # Get citations
    report_result = await db.execute(select(Report).where(Report.experiment_id == experiment_id))
    report = report_result.scalar_one_or_none()
    if not report:
        return {"nodes": [], "links": []}

    citations_result = await db.execute(select(Citation).where(Citation.report_id == report.id))
    citations = citations_result.scalars().all()

    # Build graph
    nodes = [{"id": "experiment", "label": experiment.query or "Experiment", "type": "experiment", "size": 20}]
    links = []

    for citation in citations:
        node_id = f"paper_{citation.id}"
        nodes.append({
            "id": node_id,
            "label": citation.paper_title[:50],
            "type": "paper",
            "year": citation.year,
            "authors": citation.authors,
            "size": 10,
        })
        links.append({
            "source": "experiment",
            "target": node_id,
            "relationship": citation.relationship_type or "related",
        })

    # Add concept nodes from keywords in the query
    if experiment.query:
        words = experiment.query.split()
        important_words = [w for w in words if len(w) > 4][:5]
        for word in important_words:
            concept_id = f"concept_{word}"
            nodes.append({"id": concept_id, "label": word, "type": "concept", "size": 8})
            links.append({"source": "experiment", "target": concept_id, "relationship": "keyword"})

    return {"nodes": nodes, "links": links}
