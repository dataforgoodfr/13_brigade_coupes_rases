import logging

def etl_logger(log_filename):
    logging.basicConfig(filename=log_filename,
            filemode='a',
            format='%(asctime)s,%(msecs)03d %(name)s %(levelname)s %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S',
            # level=logging.DEBUG
            level=logging.INFO
    )

    return logging.getLogger(__name__)