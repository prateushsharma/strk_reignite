from lynq import *
import asyncio

api_key="enter_your_api_key"

@Tool.register({
    "name": "query_database",
    "description": "Executes SQL queries on main database",
    "params": [
        ("query", str, True),
        ("timeout", int, False)
    ],
    "returns": [dict],
    "type": "db",
    "examples": [
        {
            "input": {
                "query": "SELECT * FROM users",
                "timeout": 5000
            }
        }
    ]
})
async def query_database(query: str, timeout: int = 3000) -> dict:
    """Simulated database query execution"""
    return {
        "query": query,
        "status": "success",
        "execution_time": 50,
        "results": []
    }

@Tool.register({
    "name": "add_numbers",
    "description": "Adds two numbers",
    "params": [
        ("a", int, True),
        ("b", int, True)
    ],
    "returns": [int],
    "type": "func",
    "examples": [
        {
            "input": {
                "a": 5,
                "b": 10
            }
        }
    ]
})
async def add_numbers(a: int, b: int) -> int:
    """Simple addition function"""
    return a + b

# ==================== AGENTS ====================
# Register agents directly without any function association
Agent.register(
    name="AnalysisBot",
    description="Data analysis specialist",
    backstory="Developed for big data processing",
    goal="Generate actionable insights",
    tool_access=[],
    agent_access=[],
    api_key=api_key,
    self_loop=True
)

Agent.register(
    name="ResearchBot",
    description="Advanced research assistant",
    backstory="Created in 2024 for academic support",
    goal="Provide reliable research findings",
    tool_access=["query_database", "add_numbers"],
    agent_access=["AnalysisBot"],
    api_key=api_key,
    self_loop=False
)

# print(fetch_data("query_database"))
# print(fetch_agent("ResearchBot"))

# print(get_prompt(agent="ResearchBot", query="How to use the query_database tool?", data="This is a test"))

# run_agent(query="How to use the query_database tool?", agent="ResearchBot", api_key=api_key)

asyncio.run(run_agent(query="Create a query about how you want to check your blood reports", agent_name="Whatever the 3rd agent name you define is", verbose=True))