_registered_tools = []

def register(**kwargs):
    def decorator(func):
        _registered_tools.append({
            "name": kwargs.get("name"),
            "description": kwargs.get("description"),
            "input_spec": kwargs.get("input_spec"),
            "output_spec": kwargs.get("output_spec"),
            "permissions": kwargs.get("permissions"),
            "rate_limit": kwargs.get("rate_limit"),
            "timeout": kwargs.get("timeout"),
            "max_retries": kwargs.get("max_retries"),
            "backoff": kwargs.get("backoff"),
            "function": func
        })
        return func
    return decorator

def get_list():
    return [tool["name"] for tool in _registered_tools]

def display():
    for tool in _registered_tools:
        print(f"Tool: {tool['name']}")
        print(f"  Description: {tool['description']}")
        print(f"  Inputs: {tool['input_spec']}")
        print(f"  Output: {tool['output_spec']}")
        print(f"  Permissions: {tool['permissions']}")
        print(f"  Rate Limit: {tool['rate_limit']}")
        print(f"  Timeout: {tool['timeout']}")
        print(f"  Max Retries: {tool['max_retries']}")
        print(f"  Backoff: {tool['backoff']}")
        print()
