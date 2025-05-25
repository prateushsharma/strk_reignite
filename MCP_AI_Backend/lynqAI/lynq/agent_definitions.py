from typing import Dict, Any
from dataclasses import dataclass
from lynq.tool_definitons import Tool

@dataclass
class AgentConfig:
    name: str
    description: str
    backstory: str
    goal: str
    tool_access: list[str]
    agent_access: list[str]
    api_key: str
    self_loop: bool

class Agent:
    _registry: Dict[str, AgentConfig] = {}

    @classmethod
    def register(cls,
                name: str,
                description: str,
                backstory: str,
                goal: str,
                tool_access: list[str],
                agent_access: list[str],
                api_key: str,
                self_loop: bool) -> None:
        """Main registration method with full validation"""
        
        # Type checking
        if not all(isinstance(arg, str) for arg in [name, description, backstory, goal, api_key]):
            raise TypeError("All string fields must be of type str")
            
        if not isinstance(tool_access, list) or not all(isinstance(t, str) for t in tool_access):
            raise TypeError("tool_access must be list of strings")
            
        if not isinstance(agent_access, list) or not all(isinstance(a, str) for a in agent_access):
            raise TypeError("agent_access must be list of strings")
            
        if not isinstance(self_loop, bool):
            raise TypeError("self_loop must be boolean")

        # Name collision check
        if name in cls._registry:
            raise ValueError(f"Agent '{name}' already exists")

        # Tool validation
        missing_tools = [t for t in tool_access if not Tool.get_tool(t)]
        if missing_tools:
            raise ValueError(f"Invalid tools: {missing_tools}")

        # Agent validation
        missing_agents = [a for a in agent_access if a not in cls._registry]
        if missing_agents:
            raise ValueError(f"Invalid agents: {missing_agents}")

        # Self-reference check
        if name in agent_access:
            raise ValueError(f"Agent cannot reference itself. Use self_loop=True instead")

        # Self-loop consistency check
        if self_loop and agent_access:
            raise ValueError("Cannot have both agent_access and self_loop=True")

        # Store configuration
        cls._registry[name] = AgentConfig(
            name=name,
            description=description,
            backstory=backstory,
            goal=goal,
            tool_access=tool_access,
            agent_access=agent_access,
            api_key=api_key,
            self_loop=self_loop
        )

    @classmethod
    def get(cls, name: str) -> AgentConfig:
        return cls._registry.get(name)

    @classmethod
    def list_all(cls) -> list[str]:
        return list(cls._registry.keys())