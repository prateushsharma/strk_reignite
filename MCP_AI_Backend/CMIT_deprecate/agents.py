_registered_agents = []

def register(**kwargs):
    def decorator(func):
        _registered_agents.append({
            "name": kwargs.get("name"),
            "description": kwargs.get("description"),
            "task": kwargs.get("task"),
            "tool_access": kwargs.get("tool_access"),
            "agent_access": kwargs.get("agent_access"),
            "self_loop": kwargs.get("self_loop"),
            "response_type": kwargs.get("response_type"),
            "api_key": kwargs.get("api_key"),
            "function": func
        })
        return func
    return decorator

def get_list():
    return [agent["name"] for agent in _registered_agents]

def display():
    for agent in _registered_agents:
        print(f"Agent: {agent['name']}")
        print(f"  Description: {agent['description']}")
        print(f"  Task: {agent['task']}")
        print(f"  Tool Access: {agent['tool_access']}")
        print(f"  Agent Access: {agent['agent_access']}")
        print(f"  Self Loop: {agent['self_loop']}")
        print(f"  Response Type: {agent['response_type']}")
        print(f"  API Key: {agent['api_key']}")
        print()
