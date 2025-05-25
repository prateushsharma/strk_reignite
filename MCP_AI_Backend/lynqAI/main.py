from lynq import *
import asyncio

# ==================== TOOLS ====================
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

# ==================== AGENTS ====================
# Register agents directly without any function association
Agent.register(
    name="AnalysisBot",
    description="Data analysis specialist",
    backstory="Developed for big data processing",
    goal="Generate actionable insights",
    tool_access=[],
    agent_access=[],
    api_key="ana-456-abc",
    self_loop=True
)

Agent.register(
    name="ResearchBot",
    description="Advanced research assistant",
    backstory="Created in 2024 for academic support",
    goal="Provide reliable research findings",
    tool_access=["query_database", "add_numbers"],
    agent_access=["AnalysisBot"],
    api_key="res-789-xzy",
    self_loop=False
)

async def main():
    # List all available tools and agents
    print("Available tools:", Tool.list_tools())

    # Demonstrate tool usage
    print("\n=== Tool Demonstration ===")
    add_tool = Tool.get_tool("add_numbers")
    if add_tool:
        result = await add_tool.func(a=3, b=4)
        print(f"Addition result: {result}")

    # db_tool = Tool.get_tool("query_database")
    # if db_tool:
    #     result = await db_tool.func("SELECT * FROM products", timeout=2000)
    #     print(f"Database result: {result}")

    # # Demonstrate agent access
    # print("\n=== Agent Demonstration ===")
        
    # # Retrieve agent configuration
    # research_bot = Agent.get("ResearchBot")
    # print(f"Research Bot tools: {research_bot.tool_access}")
    # print(f"Collaborates with: {research_bot.agent_access}")

    # # List all agents
    # print("All registered agents:", Agent.list_all())

if __name__ == "__main__":
    asyncio.run(main())