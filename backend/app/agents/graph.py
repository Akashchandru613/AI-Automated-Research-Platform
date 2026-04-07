_compiled_graph = None


def build_graph():
    from langgraph.graph import StateGraph, START, END
    from app.agents.state import AgentState
    from app.agents.orchestrator import orchestrator_node
    from app.agents.data_cleaning import data_cleaning_node
    from app.agents.analysis import analysis_node
    from app.agents.summary import summary_node
    from app.agents.literature import literature_node_sync
    from app.agents.report_generator import report_generator_node
    from app.agents.router import route_after_orchestrator, check_completion

    graph = StateGraph(AgentState)

    graph.add_node("orchestrator", orchestrator_node)
    graph.add_node("data_cleaning", data_cleaning_node)
    graph.add_node("analysis", analysis_node)
    graph.add_node("summary", summary_node)
    graph.add_node("literature", literature_node_sync)
    graph.add_node("check_complete", lambda state: {"current_agent": "check_complete"})
    graph.add_node("report_generator", report_generator_node)

    graph.add_edge(START, "orchestrator")

    graph.add_conditional_edges(
        "orchestrator",
        route_after_orchestrator,
        {
            "data_cleaning": "data_cleaning",
            "analysis": "analysis",
            "summary": "summary",
            "literature": "literature",
            "report_generator": "report_generator",
        },
    )

    graph.add_edge("data_cleaning", "check_complete")
    graph.add_edge("analysis", "check_complete")
    graph.add_edge("summary", "check_complete")
    graph.add_edge("literature", "check_complete")

    graph.add_conditional_edges(
        "check_complete",
        check_completion,
        {
            "data_cleaning": "data_cleaning",
            "analysis": "analysis",
            "summary": "summary",
            "literature": "literature",
            "report_generator": "report_generator",
        },
    )

    graph.add_edge("report_generator", END)

    return graph.compile()


@property
def compiled_graph():
    global _compiled_graph
    if _compiled_graph is None:
        _compiled_graph = build_graph()
    return _compiled_graph


# Module-level accessor
def get_compiled_graph():
    global _compiled_graph
    if _compiled_graph is None:
        _compiled_graph = build_graph()
    return _compiled_graph
