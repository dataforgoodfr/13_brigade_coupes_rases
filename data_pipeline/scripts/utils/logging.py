import logging
import sys


def etl_logger(logger_name=None):
    logger = logging.getLogger(logger_name if logger_name else __name__)
    logger.setLevel(logging.INFO)
    
    if logger.hasHandlers():
        logger.handlers.clear()
    
    file_handler = logging.FileHandler(f"logs/{logger_name}.log", mode="a") if logger_name else logging.FileHandler("logs/default.log", mode="a")
    file_format = logging.Formatter("%(asctime)s,%(msecs)03d %(name)s %(levelname)s %(message)s", 
                                    datefmt="%Y-%m-%d %H:%M:%S")
    file_handler.setFormatter(file_format)
    logger.addHandler(file_handler)
    
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(file_format)
    logger.addHandler(console_handler)
    
    return logger