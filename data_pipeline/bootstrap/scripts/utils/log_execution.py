import functools
import logging
import math
import sys
import time
from pathlib import Path
from typing import Any, Callable, Optional, TypeVar

T = TypeVar("T")


def _format_time(timespan: float, precision: int = 3) -> str:
    """
    Formats the timespan in a human readable form.
    Code copied from IPython.core.magics.execution._format_time
    """

    if timespan >= 60.0:
        # we have more than a minute, format that in a human readable form
        # Idea from http://snipplr.com/view/5713/
        parts = [("d", 60 * 60 * 24), ("h", 60 * 60), ("min", 60), ("s", 1)]
        time_parts: list[str] = []
        leftover = timespan
        for suffix, length in parts:
            value = int(leftover / length)
            if value > 0:
                leftover = leftover % length
                time_parts.append("%s%s" % (str(value), suffix))
            if leftover < 1:
                break
        return " ".join(time_parts)

    # Unfortunately characters outside of range(128) can cause problems in
    # certain terminals.
    # See bug: https://bugs.launchpad.net/ipython/+bug/348466
    # Try to prevent crashes by being more secure than it needs to
    # E.g. eclipse is able to print a µ, but has no sys.stdout.encoding set.
    units = ["s", "ms", "us", "ns"]  # the safe value
    if hasattr(sys.stdout, "encoding") and sys.stdout.encoding:
        try:
            "μ".encode(sys.stdout.encoding)
            units = ["s", "ms", "μs", "ns"]
        except Exception:
            pass
    scaling = [1, 1e3, 1e6, 1e9]

    if timespan > 0.0:
        order = min(-int(math.floor(math.log10(timespan)) // 3), 3)
    else:
        order = 3
    return "%.*g %s" % (precision, timespan * scaling[order], units[order])


def log_execution(
    result_filepath: str | Path | list[str | Path],
) -> Callable[[Callable[..., T]], Callable[..., Optional[T]]]:
    """
    Decorator for logging start, end, and duration
    """
    if not isinstance(result_filepath, list):
        result_filepath = [result_filepath]

    def decorator(func: Callable[..., T]) -> Callable[..., Optional[T]]:
        @functools.wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> Optional[T]:
            # Get the function name
            decorated_function_name = func.__name__

            # Check if we can skip the job
            if sum([Path(fp).exists() for fp in result_filepath]) == len(result_filepath):
                logging.info(
                    f"The result filepath {' & '.join([str(fp) for fp in result_filepath])} for the {decorated_function_name} "
                    "script already exist, we're skipping this job."
                )
                return None

            # Log start time and message
            logging.info(
                f"[============  Start of the {decorated_function_name} script ============]"
            )

            # Record start time
            start_time = time.perf_counter()

            # Execute the function
            result = func(*args, **kwargs)

            # Record end time
            end_time = time.perf_counter()

            # Log end time, memory usage, and duration
            logging.info(
                f"[============  End of the {decorated_function_name} script. "
                f"Total duration: {_format_time(end_time - start_time)} ============]"
            )

            return result

        return wrapper

    return decorator
