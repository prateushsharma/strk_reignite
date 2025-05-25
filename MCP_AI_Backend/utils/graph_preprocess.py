import json

def filter_workflow_json(input_json):
    return {
        "nodes": [
            {
                "id": node["id"],
                "type": node["type"],
                "data": node.get("data", {})
            }
            for node in input_json.get("nodes", [])
        ],
        "edges": [
            {
                "source": edge["source"],
                "target": edge["target"],
            }
            for edge in input_json.get("edges", [])
        ]
    }