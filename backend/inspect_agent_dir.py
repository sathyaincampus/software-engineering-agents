from google.adk import Agent

print("Agent public methods:")
print([m for m in dir(Agent) if not m.startswith('_')])
