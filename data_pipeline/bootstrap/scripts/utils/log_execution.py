import functools
import logging
import math
import sys
import time
from collections.abc import Callable
from pathlib import Path
from typing import Any, TypeVar

T = TypeVar("T")


def _format_time(timespan: float, precision: int = 3) -> str:
    """
    Formate une durée en secondes dans un format lisible par l'humain.
    
    Exemples de sortie :
    - 0.0015 secondes -> "1.50 ms"
    - 45 secondes -> "45.0 s"
    - 150 secondes -> "2min 30s"
    - 7200 secondes -> "2h"
    
    Code inspiré de IPython.core.magics.execution._format_time
    
    Parameters
    ----------
    timespan : float
        Durée en secondes
    precision : int, optional
        Nombre de chiffres significatifs pour l'affichage (par défaut: 3)
    
    Returns
    -------
    str
        Durée formatée de manière lisible
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


def log_execution(
    result_filepath: str | Path | list[str | Path],
) -> Callable[[Callable[..., T]], Callable[..., T | None]]:
    """
    Décorateur pour automatiser le logging d'exécution d'une fonction.
    
    Ce décorateur ajoute trois fonctionnalités :
    1. Vérifie si le(s) fichier(s) de résultat existe(nt) déjà et skip l'exécution si c'est le cas
    2. Log le début et la fin de l'exécution de la fonction
    3. Mesure et affiche la durée totale d'exécution
    
    Parameters
    ----------
    result_filepath : str | Path | list[str | Path]
        Chemin(s) du/des fichier(s) de résultat. Si tous les fichiers existent,
        la fonction décorée ne sera pas exécutée (pour éviter les re-calculs inutiles).
    
    Returns
    -------
    Callable
        La fonction décorée avec les fonctionnalités de logging automatique.
        Retourne None si le résultat existe déjà, sinon retourne le résultat de la fonction.
    
    Examples
    --------
    >>> @log_execution(["output1.fgb", "output2.fgb"])
    >>> def process_data():
    >>>     # Votre code de traitement
    >>>     pass
    
    Notes
    -----
    - Si au moins un fichier de résultat est manquant, la fonction sera exécutée
    - Les logs utilisent le format : [HH:MM:SS][INFO] message
    - La durée est formatée de manière lisible (ex: "2h 15min 30s" ou "150 ms")
    """
    if not isinstance(result_filepath, list):
        result_filepath = [result_filepath]

    def decorator(func: Callable[..., T]) -> Callable[..., T | None]:
        @functools.wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> T | None:
            # Get the function name
            decorated_function_name = func.__name__

            # Check if we can skip the job
            if sum([Path(fp).exists() for fp in result_filepath]) == len(
                result_filepath
            ):
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
