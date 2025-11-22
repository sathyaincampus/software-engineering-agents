try:
    from google.genai.agent import Agent
    print("google.genai.agent.Agent found")
except ImportError:
    print("google.genai.agent.Agent NOT found")

try:
    from google.genai import types
    print("google.genai.types found")
except ImportError:
    print("google.genai.types NOT found")
