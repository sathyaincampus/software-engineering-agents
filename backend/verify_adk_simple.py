try:
    import google.adk
    print("google.adk imported")
    print(dir(google.adk))
except ImportError:
    print("google.adk NOT found")
