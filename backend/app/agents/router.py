def route_after_orchestrator(state: dict) -> str:
    tasks = state.get("tasks_to_run", [])
    if not tasks:
        return "report_generator"
    first_task = tasks[0]
    if first_task in ("data_cleaning", "analysis", "summary", "literature"):
        return first_task
    return "report_generator"


def check_completion(state: dict) -> str:
    tasks_to_run = state.get("tasks_to_run", [])
    completed = state.get("completed_tasks", [])

    for task in tasks_to_run:
        if task not in completed:
            return task

    return "report_generator"
