from logging import Formatter, LogRecord


class DataFormatter(Formatter):
    """Default format, with extra={"data": ...} appended when provided."""

    def format(self, record: LogRecord) -> str:
        message = super().format(record)
        data = getattr(record, "data", None)
        return f"{message} - DATA:{data}" if data is not None else message


LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "()": "conf.log.DataFormatter",
            "fmt": "[%(levelname)s:%(asctime)s] %(message)s",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "default",
            "level": "INFO",
        },
    },
    "loggers": {
        "default": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
    },
}
