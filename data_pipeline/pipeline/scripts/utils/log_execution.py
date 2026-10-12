import functools
import logging
import math
import sys
import time
from collections.abc import Callable
from typing import Any


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
                time_parts.append(f"{value}{suffix}")
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
    return f"{timespan * scaling[order]:.{precision}g} {units[order]}"


def log_execution[T](func: Callable[..., T]) -> Callable[..., T]:
    """
    Journalise le début, la fin et la durée d'une étape de la pipeline.

    L'étape est toujours exécutée, même si son fichier de sortie existe déjà :
    un fichier laissé par une exécution précédente (autre date de départ,
    autre raster) serait sinon repris sans être recalculé.
    """

    @functools.wraps(func)
    def wrapper(*args: Any, **kwargs: Any) -> T:
        decorated_function_name = func.__name__
        logging.info(
            f"[============  Start of the {decorated_function_name} script ============]"
        )
        start_time = time.perf_counter()

        result = func(*args, **kwargs)

        end_time = time.perf_counter()
        logging.info(
            f"[============  End of the {decorated_function_name} script. "
            f"Total duration: {_format_time(end_time - start_time)} ============]"
        )
        return result

    return wrapper
