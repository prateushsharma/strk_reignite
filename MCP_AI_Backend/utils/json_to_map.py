import json
from utils.graph_preprocess import filter_workflow_json

def map_json(graph):
    graph_json = filter_workflow_json(graph)
    if not graph_json:
        return "Invalid graph structure"
        
    def describe_node(node):
        node_type = node["type"].replace("Node", "").capitalize()
        desc = f"Node ID: {node['id']} | Type: {node_type}"
        if node["data"]:
            data_parts = [f"{k}: {v}" for k, v in node["data"].items()]
            desc += " | " + ", ".join(data_parts)
        return desc

    def describe_edge(edge):
        source = edge["source"]
        target = edge["target"]
        return f"{source} ➝ {target}"

    node_descriptions = [describe_node(node) for node in graph_json["nodes"]]
    edge_descriptions = [describe_edge(edge) for edge in graph_json["edges"]]

    final_output = "### Node Descriptions:\n"
    final_output += "\n".join(f"- {desc}" for desc in node_descriptions)
    final_output += "\n\n### Graph Connections:\n"
    final_output += "\n".join(f"- {desc}" for desc in edge_descriptions)

    return final_output

# data_c = {
#   "workflowId": "trading-workflow-1",
#   "name": "SUI Trading Agent Workflow",
#   "description": "Automated trading workflow for SUI tokens",
#   "nodes": [
#     {
#       "id": "startNode-001",
#       "type": "startNode",
#       "position": { "x": 144, "y": 380 },
#       "data": {}
#     },
#     {
#       "id": "agentNode-001",
#       "type": "agentNode",
#       "position": { "x": 435, "y": 456 },
#       "data": {
#         "name": "Sample trading agent 1",
#         "description": "This agent can only show when to purchase and sell, cannot do transactions"
#       }
#     },
#     {
#       "id": "strategyNode-001",
#       "type": "strategyNode",
#       "position": { "x": 555, "y": 191 },
#       "data": {
#         "strategyText": "purchase when price of 1 sui is 3.2 and send when it is 3.3"
#       }
#     },
#     {
#       "id": "modelNode-001",
#       "type": "modelNode",
#       "position": { "x": 239, "y": 703 },
#       "data": {
#         "model": "gpt4",
#         "parentId": "agentNode-001"
#       }
#     },
#     {
#       "id": "memoryNode-001",
#       "type": "memoryNode",
#       "position": { "x": 673, "y": 703 },
#       "data": {
#         "memoryType": "postgres",
#         "parentId": "agentNode-001"
#       }
#     },
#     {
#       "id": "notificationNode-001",
#       "type": "notificationNode",
#       "position": { "x": 1171, "y": 471 },
#       "data": {
#         "message": "Enter notification message"
#       }
#     }
#   ],
#   "edges": [
#     {
#       "id": "e-startNode-001-agentNode-001",
#       "source": "startNode-001",
#       "sourceHandle": "start-out",
#       "target": "agentNode-001",
#       "targetHandle": "agent-in",
#       "type": "smoothstep"
#     },
#     {
#       "id": "e-agentNode-001-modelNode-001",
#       "source": "agentNode-001",
#       "sourceHandle": "model-connect",
#       "target": "modelNode-001",
#       "targetHandle": "model-in",
#       "type": "smoothstep",
#       "style": {
#         "strokeWidth": 2,
#         "stroke": "#5e72e4",
#         "strokeDasharray": "5,5"
#       }
#     },
#     {
#       "id": "e-agentNode-001-memoryNode-001",
#       "source": "agentNode-001",
#       "sourceHandle": "memory-connect",
#       "target": "memoryNode-001",
#       "targetHandle": "memory-in",
#       "type": "smoothstep",
#       "style": {
#         "strokeWidth": 2,
#         "stroke": "#5e72e4",
#         "strokeDasharray": "5,5"
#       }
#     },
#     {
#       "id": "e-agentNode-001-notificationNode-001",
#       "source": "agentNode-001",
#       "sourceHandle": "agent-out",
#       "target": "notificationNode-001",
#       "targetHandle": "notification-in",
#       "type": "smoothstep"
#     },
#     {
#       "id": "e-strategyNode-001-agentNode-001",
#       "source": "startNode-001",
#       "sourceHandle": "start-out",
#       "target": "strategyNode-001",
#       "targetHandle": "strategy-in",
#       "type": "smoothstep"
#     }
#   ]
# }

# if __name__ == "__main__":
#     result = map_json(data_c)
#     print(result)