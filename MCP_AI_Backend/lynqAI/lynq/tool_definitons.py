import inspect
from typing import Tuple, get_origin, get_args

class Tool:
    _registry = {}

    def __init__(self, schema, func):
        self.schema = schema
        self.func = func

    @classmethod
    def register(cls, schema):
        cls._validate_schema(schema)
        name = schema['name']

        def decorator(func):
            if not inspect.iscoroutinefunction(func):
                raise TypeError(f"Tool function '{func.__name__}' must be async")

            if func.__name__ != name:
                raise ValueError(f"Function name '{func.__name__}' does not match tool name '{name}'")

            sig = inspect.signature(func)
            parameters = sig.parameters

            schema_params = {p[0] for p in schema['params']}
            func_params = set(parameters.keys())

            if schema_params != func_params:
                missing_in_func = schema_params - func_params
                missing_in_schema = func_params - schema_params
                errors = []
                if missing_in_func:
                    errors.append(f"params {missing_in_func} in schema but not in function")
                if missing_in_schema:
                    errors.append(f"params {missing_in_schema} in function but not in schema")
                raise ValueError(f"Parameter mismatch in tool '{name}': {', '.join(errors)}")

            for param_name, dtype, required in schema['params']:
                func_param = parameters[param_name]
                if func_param.default == inspect.Parameter.empty:
                    if not required:
                        raise ValueError(
                            f"Param '{param_name}' in tool '{name}' is marked as optional but function has no default"
                        )
                else:
                    if required:
                        raise ValueError(
                            f"Param '{param_name}' in tool '{name}' is marked as required but function has a default"
                        )

                if func_param.annotation != inspect.Parameter.empty:
                    expected_type = dtype
                    actual_type = func_param.annotation
                    if actual_type != expected_type:
                        raise TypeError(
                            f"Param '{param_name}' in tool '{name}' expects type {expected_type}, "
                            f"but function has annotation {actual_type}"
                        )

            return_annotation = sig.return_annotation
            if return_annotation != inspect.Signature.empty:
                if get_origin(return_annotation) is tuple:
                    expected_return_types = get_args(return_annotation)
                else:
                    expected_return_types = (return_annotation,)

                schema_return_types = schema['returns']
                if len(expected_return_types) != len(schema_return_types):
                    raise ValueError(
                        f"Return count mismatch in tool '{name}': function returns {len(expected_return_types)} "
                        f"values, schema expects {len(schema_return_types)}"
                    )

                for expected, actual in zip(expected_return_types, schema_return_types):
                    if expected != actual:
                        raise TypeError(
                            f"Return type mismatch in tool '{name}': expected {expected}, got {actual}"
                        )

            required_params = [p[0] for p in schema['params'] if p[2]]
            for idx, example in enumerate(schema['examples']):
                input_params = example.get('input', {})
                if not isinstance(input_params, dict):
                    raise TypeError(f"Example {idx} in tool '{name}' has invalid 'input' type (must be dict)")
                missing = [p for p in required_params if p not in input_params]
                if missing:
                    raise ValueError(
                        f"Example {idx} in tool '{name}' missing required params: {missing}"
                    )

            if name in cls._registry:
                raise ValueError(f"Tool name '{name}' is already registered")
            cls._registry[name] = Tool(schema, func)
            return func

        return decorator

    @classmethod
    def _validate_schema(cls, schema):
        required_fields = {'name', 'description', 'params', 'returns', 'type', 'examples'}
        schema_fields = set(schema.keys())
        missing = required_fields - schema_fields
        if missing:
            raise ValueError(f"Missing fields in tool schema: {missing}")
        extra = schema_fields - required_fields
        if extra:
            raise ValueError(f"Unexpected fields in tool schema: {extra}")

        name = schema['name']
        if not isinstance(name, str):
            raise TypeError(f"Tool 'name' must be a string")

        description = schema['description']
        if not isinstance(description, str):
            raise TypeError(f"Tool 'description' must be a string")

        params = schema['params']
        if not isinstance(params, list):
            raise TypeError(f"Tool 'params' must be a list")
        for param in params:
            if not (isinstance(param, tuple) and len(param) == 3):
                raise TypeError(f"Param {param} in tool '{name}' must be a tuple of length 3")
            param_name, dtype, required = param
            if not isinstance(param_name, str):
                raise TypeError(f"Param name '{param_name}' in tool '{name}' must be a string")
            if not isinstance(required, bool):
                raise TypeError(f"Required flag for param '{param_name}' in tool '{name}' must be a boolean")

        returns = schema['returns']
        if not isinstance(returns, list):
            raise TypeError(f"Tool 'returns' must be a list")
        for dtype in returns:
            if not isinstance(dtype, type):
                raise TypeError(f"Return type '{dtype}' in tool '{name}' must be a valid type")

        tool_type = schema['type']
        allowed_types = {"api", "func", "db", "system"}
        if tool_type not in allowed_types:
            raise ValueError(f"Invalid type '{tool_type}' for tool '{name}'. Allowed types: {allowed_types}")

        examples = schema['examples']
        if not isinstance(examples, list):
            raise TypeError(f"Tool 'examples' must be a list")
        for example in examples:
            if not isinstance(example, dict):
                raise TypeError(f"Example in tool '{name}' must be a dictionary")
            if 'input' not in example:
                raise ValueError(f"Example in tool '{name}' missing 'input' key")
            input_params = example['input']
            if not isinstance(input_params, dict):
                raise TypeError(f"Example 'input' in tool '{name}' must be a dictionary")

    @classmethod
    def get_tool(cls, name):
        return cls._registry.get(name)

    @classmethod
    def list_tools(cls):
        return list(cls._registry.keys())