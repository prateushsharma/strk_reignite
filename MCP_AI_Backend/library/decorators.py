import inspect
import functools
from typing import Any, Type, Union, get_type_hints, get_origin, get_args

class ToolError(Exception):
    """Base error class for tool-related exceptions."""
    def __init__(self, tool_info: str, message: str):
        super().__init__(f"{tool_info}: {message}")
        self.tool_info = tool_info
        self.message = message

def _get_tool_identifier(func_or_name):
    """Generate an identifier for the tool."""
    if isinstance(func_or_name, str):
        return f"tool '{func_or_name}'"
    return f"tool {getattr(func_or_name, '__qualname__', getattr(func_or_name, '__name__', 'unnamed'))}"

def _validate_type(value: Any, expected_type: Type) -> bool:
    """Check if a value matches the expected type."""
    if expected_type is Any:
        return True
    if get_origin(expected_type) is Union:
        return any(_validate_type(value, t) for t in get_args(expected_type))
    try:
        return isinstance(value, expected_type)
    except TypeError:
        return False

def tool(
    name: str = None,
    description: str = None,
    parameters: list = None,  # list[tuple[str, Type, bool]]
    returns: list = None     # list[Type]
):
    """Decorator to mark a function as a tool with metadata."""
    # Store parameters in a different variable name to avoid shadowing
    input_parameters = [] if parameters is None else parameters
    input_returns = [] if returns is None else returns

    def decorator(func):
        # Create tool identifier using name or function info
        tool_id = _get_tool_identifier(name if name else func)

        # Validate required fields
        if name is None:
            raise ToolError(tool_id, "@tool must have a 'name' parameter")
        if not isinstance(name, str) or not name.strip():
            raise ToolError(tool_id, "Tool name must be a non-empty string")
        if description is None:
            raise ToolError(tool_id, "@tool must have a 'description' parameter")
        if not isinstance(description, str) or not description.strip():
            raise ToolError(tool_id, "Tool description must be a non-empty string")

        # Validate parameters structure
        for i, param in enumerate(input_parameters):
            if len(param) != 3:
                raise ToolError(tool_id, 
                    f"Parameter {i} must be (name, type, required)")
            p_name, p_type, p_required = param
            if not isinstance(p_name, str) or not p_name.strip():
                raise ToolError(tool_id, f"Parameter {i} name must be a string")
            if not isinstance(p_required, bool):
                raise ToolError(tool_id, f"Parameter {i} required must be a bool")

        # Validate function signature
        sig = inspect.signature(func)
        params = list(sig.parameters.values())

        if len(input_parameters) != len(params):
            raise ToolError(tool_id,
                f"Declared {len(input_parameters)} parameters but "
                f"function accepts {len(params)}"
            )

        # Validate parameter defaults match required flags
        for (p_name, _, p_required), param in zip(input_parameters, params):
            has_default = param.default != inspect.Parameter.empty
            if p_required and has_default:
                raise ToolError(tool_id,
                    f"Parameter '{p_name}' is required but has a default value")
            if not p_required and not has_default:
                raise ToolError(tool_id,
                    f"Parameter '{p_name}' is optional but has no default value")

        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            try:
                # Bind and validate arguments
                bound = sig.bind(*args, **kwargs)
                bound.apply_defaults()

                for (p_name, p_type, _), (arg_name, arg_val) in zip(
                    input_parameters, bound.arguments.items()
                ):
                    if not _validate_type(arg_val, p_type):
                        raise TypeError(
                            f"{tool_id}: Argument '{arg_name}' should be "
                            f"type {p_type}, got {type(arg_val).__name__}"
                        )

                result = await func(*args, **kwargs)

                # Validate return types
                if input_returns:
                    if not isinstance(result, tuple):
                        results = (result,)
                    else:
                        results = result
                    if len(results) != len(input_returns):
                        raise ToolError(tool_id,
                            f"Expected {len(input_returns)} returns, "
                            f"got {len(results)}")
                    for i, (val, typ) in enumerate(zip(results, input_returns)):
                        if not _validate_type(val, typ):
                            raise TypeError(
                                f"{tool_id}: Return {i} should be "
                                f"type {typ}, got {type(val).__name__}"
                            )
                return result
            except Exception as e:
                if not isinstance(e, (ToolError, TypeError)):
                    raise ToolError(tool_id, f"Execution failed: {str(e)}") from e
                raise

        # Attach tool metadata
        wrapper._is_tool = True
        wrapper._tool_name = name
        wrapper._tool_description = description
        wrapper._tool_parameters = input_parameters
        wrapper._tool_returns = input_returns

        return wrapper
    return decorator