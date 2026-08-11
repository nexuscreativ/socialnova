import yaml
from pathlib import Path
from typing import Dict, Any

class AgentFactory:
    """Generates agents from YAML specs"""
    
    def __init__(self, templates_dir: str = None):
        if templates_dir is None:
            templates_dir = Path(__file__).parent / "templates"
        self.templates_dir = Path(templates_dir)
    
    def load_template(self, name: str) -> Dict[str, Any]:
        """Load a YAML template"""
        template_path = self.templates_dir / f"{name}.yaml"
        with open(template_path) as f:
            return yaml.safe_load(f)
    
    def list_templates(self) -> list:
        """List all available templates"""
        return [f.stem for f in self.templates_dir.glob("*.yaml")]
    
    def generate_agent_code(self, spec: Dict[str, Any]) -> str:
        """Generate Python agent class from spec"""
        name = spec["metadata"]["name"]
        description = spec["metadata"]["description"]
        tier = spec["metadata"]["tier"]
        
        return f'''from agents.base import BaseAgent
from typing import Dict, Any, Optional

class {name}Agent(BaseAgent):
    """Auto-generated agent: {description}"""
    
    name = "{name}"
    description = "{description}"
    tier = "{tier}"
    task_type = "general"
    
    SYSTEM_PROMPT = """{spec.get("prompt", {}).get("system", "")}"""
    
    async def execute(self, task: Dict[str, Any], context: Optional[Dict] = None) -> Dict[str, Any]:
        messages = [
            {"role": "system", "content": self.SYSTEM_PROMPT},
            {"role": "user", "content": str(task)},
        ]
        
        response = await self.llm_call(messages)
        content = response.get("choices", [{{}}])[0].get("message", {}).get("content", "")
        
        return {{
            "agent": self.name,
            "result": content,
            "model_used": response.get("model", "unknown"),
            "tokens_used": response.get("usage", {}).get("total_tokens", 0),
        }}
'''
    
    def create_agent(self, template_name: str) -> str:
        """Create a new agent from template"""
        spec = self.load_template(template_name)
        return self.generate_agent_code(spec)


# Singleton
_factory = None

def get_agent_factory() -> AgentFactory:
    global _factory
    if _factory is None:
        _factory = AgentFactory()
    return _factory
