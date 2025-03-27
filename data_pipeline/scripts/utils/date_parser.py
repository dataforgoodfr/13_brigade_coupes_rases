import pandas as pd
from datetime import datetime, timedelta


def parse_yyddd(value):
    if isinstance(value, pd.Series):
        return value.apply(parse_yyddd)

    # Extraction de YY et DDD
    yy = value // 1000  # Partie année (YY)
    ddd = value % 1000  # Jour de l'année (DDD)

    # Conversion de YY en année complète
    year = 2000 + yy

    # Calcul de la date
    date = datetime(year, 1, 1) + timedelta(days=ddd - 1)

    return date.strftime("%Y-%m-%d")
