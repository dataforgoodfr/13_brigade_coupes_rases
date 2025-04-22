from datetime import datetime

def encode_yyddd(date_str: str) -> int:
    """
    Encode a date string in 'YYYY-MM-DD HH:MM:SS' format to a YYDDD integer code.
    
    Examples:
      '2024-01-01 00:00:00' -> 24001
      '2024-12-31 00:00:00' -> 24366  (2024 is a leap year: 366th day)
    """
    dt = datetime.strptime(date_str, "%Y-%m-%d %H:%M:%S")
    
    yy = dt.year % 100
    
    doy = dt.timetuple().tm_yday
    
    return yy * 1000 + doy