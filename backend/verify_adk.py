import pkg_resources

try:
    import google.adk
    print(f"google.adk version: {google.adk.__version__}")
    print(f"google.adk dir: {dir(google.adk)}")
except ImportError:
    print("google.adk not found")

try:
    from google.adk.core import Agent
    print("google.adk.core.Agent found")
except ImportError:
    print("google.adk.core.Agent NOT found")

try:
    from google.adk import Agent
    print("google.adk.Agent found")
except ImportError:
    print("google.adk.Agent NOT found")
