from lynq import Tool, Agent, run_agent
import asyncio

api_key="enter_your_api_key"

@Tool.register({
    "name": "fetch_anomalous_reports",
    "description": "It can find anomalous data in blood report as string input.",
    "params": [
        ("report_text", str, True)
    ],
    "returns": [str],
    "type": "func",
    "examples": [
        {
            "input": {
                "report_text": "WBC count is 2.5"
            }
        }
    ]
})
async def fetch_anomalous_reports(report_text: str) -> str:
    """Detects anomalies in blood report text"""
    return "Blood leukocytes found abnormally low — this is a cancerous indicator or a spleen malfunction. Check it out immediately."


@Tool.register({
    "name": "get_food_recommendations",
    "description": "Provides healthy food recommendations based on input query string.",
    "params": [
        ("query", str, True)
    ],
    "returns": [str],
    "type": "func",
    "examples": [
        {
            "input": {
                "query": "Low leukocyte levels"
            }
        }
    ]
})
async def get_food_recommendations(query: str) -> str:
    """Returns food recommendations for health improvement"""
    return ("To help address low leukocytes (white blood cell count), focus on a diet rich in vitamins and minerals, including Vitamin C, B vitamins, iron, "
            "beta-carotene, vitamin E, and zinc. Incorporating probiotic-rich foods and spices with anti-inflammatory properties is also beneficial. "
            "Prioritize lean protein sources, leafy greens, and fruits like berries, citrus fruits, and papaya.")


Agent.register(
    name="report_summariser",
    description="Summarises medical or analytical reports into human-readable summaries.",
    backstory="A fast and concise summariser trained to read and interpret structured and unstructured reports.",
    goal="Generate clean, brief summaries from any report text.",
    tool_access=[],
    agent_access=[],
    api_key=api_key,
    self_loop=True
)

Agent.register(
    name="health_food_recommender",
    description="Provides food recommendations based on abnormalities in blood test results.",
    backstory="Designed by nutrition experts to support medical diagnoses with dietary suggestions.",
    goal="Offer healthy food guidance to mitigate blood test abnormalities.",
    tool_access=["get_food_recommendations"],
    agent_access=["report_summariser"],
    api_key=api_key,
    self_loop=False
)

Agent.register(
    name="blood_report_analyser",
    description="Analyses blood reports for abnormalities and recommends further actions.",
    backstory="Designed by a team of hematologists and ML engineers to interpret medical test results accurately.",
    goal="Read blood reports, identify anomalies, and take appropriate next actions via tools or other agents.",
    tool_access=["fetch_anomalous_reports"],
    agent_access=["health_food_recommender"],
    api_key=api_key,
    self_loop=False
)

import asyncio

random_report = """
Patient: R. Sharma
Age: 46
Test Results:
- Hemoglobin: 13.5 g/dL
- RBC Count: 4.3 million cells/mcL
- WBC Count (Leukocytes): 2.4 thousand/mcL (Normal: 4.0 - 11.0)
- Platelets: 150,000/mcL
- Lymphocytes: 20%
- Neutrophils: 70%
- Monocytes: 8%
- Eosinophils: 2%
- Basophils: 0%
"""

query = f"I want you to find abnormalities in my blood report, provide me with healthy food recommendations and a proper summary of my report based on the anomalies:\n{random_report}"

# Run the agent
final_response = asyncio.run(run_agent(query=query, agent_name="blood_report_analyser", verbose=True))
print(final_response)