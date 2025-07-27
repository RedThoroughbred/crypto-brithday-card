"""
Structured logging configuration using structlog.
Provides consistent, searchable logs across the application.
"""

import structlog
import logging
import sys
from typing import Any, Dict


def setup_logging() -> None:
    """Configure structured logging for the application."""
    
    # Configure standard library logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=logging.INFO,
    )
    
    # Configure structlog
    structlog.configure(
        processors=[
            # Add context from standard library logging
            structlog.stdlib.filter_by_level,
            # Add timestamp
            structlog.processors.TimeStamper(fmt="iso"),
            # Add logger name and level
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            # Add call site information (file, line, function)
            structlog.processors.CallsiteParameterAdder(
                parameters=[
                    structlog.processors.CallsiteParameter.FILENAME,
                    structlog.processors.CallsiteParameter.FUNC_NAME,
                    structlog.processors.CallsiteParameter.LINENO,
                ]
            ),
            # Format as JSON for production, key-value for development
            structlog.dev.ConsoleRenderer() if sys.stdout.isatty() else structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.stdlib.BoundLogger,
        logger_factory=structlog.stdlib.LoggerFactory(),
        context_class=dict,
        cache_logger_on_first_use=True,
    )


def get_logger(name: str = None) -> structlog.BoundLogger:
    """Get a structured logger instance."""
    return structlog.get_logger(name)


class LoggingMiddleware:
    """Middleware to log HTTP requests and responses."""
    
    def __init__(self, app):
        self.app = app
        self.logger = get_logger("http")
    
    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            request_id = id(scope)  # Simple request ID
            method = scope["method"]
            path = scope["path"]
            
            self.logger.info(
                "HTTP request started",
                request_id=request_id,
                method=method,
                path=path,
            )
            
            # TODO: Add request timing and response status logging
        
        await self.app(scope, receive, send)