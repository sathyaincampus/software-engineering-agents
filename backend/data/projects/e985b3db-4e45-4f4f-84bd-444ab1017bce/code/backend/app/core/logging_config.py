import logging
import sys
import os

from pythonjsonlogger import jsonlogger

# --- Configuration --- 
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
LOG_FORMAT = os.getenv("LOG_FORMAT", "json") # "json" or "plain"

# --- Log Levels Mapping ---
LOG_LEVELS = {
    "DEBUG": logging.DEBUG,
    "INFO": logging.INFO,
    "WARNING": logging.WARNING,
    "ERROR": logging.ERROR,
    "CRITICAL": logging.CRITICAL,
}

log_level_value = LOG_LEVELS.get(LOG_LEVEL, logging.INFO)

# --- Logger Setup --- 
def setup_logging():
    """Configures the root logger for the application."""
    
    # Get the root logger
    logger = logging.getLogger()
    logger.setLevel(log_level_value)

    # Clear existing handlers to avoid duplicate logs if setup is called multiple times
    if logger.hasHandlers():
        logger.handlers.clear()

    # Define formatter based on LOG_FORMAT environment variable
    if LOG_FORMAT == "json":
        # Using jsonlogger for structured logging
        formatter = jsonlogger.JsonFormatter(
            '%(asctime)s %(levelname)s %(name)s %(message)s %(pathname)s %(lineno)d'
        )
    else: # Default to plain text format
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s - %(pathname)s:%(lineno)d'
        )

    # Create a handler for console output (stdout)
    # Using sys.stdout explicitly ensures logs go to stdout, which is good for containers
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(log_level_value)
    handler.setFormatter(formatter)
    
    # Add the handler to the logger
    logger.addHandler(handler)

    # Optional: Add specific loggers for libraries if needed
    # logging.getLogger("uvicorn.access").setLevel(logging.WARNING) # Reduce verbosity of uvicorn access logs
    # logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING) # Reduce verbosity of DB logs

    return logger

# --- Example Usage (for testing the setup) --- 
if __name__ == "__main__":
    logger = setup_logging()
    
    logger.debug("This is a debug message.")
    logger.info("This is an info message. Configuration loaded.")
    logger.warning("This is a warning message. Something might be wrong.")
    logger.error("This is an error message. An operation failed.")
    logger.critical("This is a critical message. The system might be unstable.")

    # Example with extra data (for JSON format)
    extra_data = {"user_id": "user123", "request_id": "req456"}
    logger.info("User logged in successfully.", extra=extra_data)
