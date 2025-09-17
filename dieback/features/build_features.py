import pandas as pd
import numpy as np
import json
from statsmodels.nonparametric.smoothers_lowess import lowess



def convert_columns(df):
    def parse_list_column(col):
        return df[col].apply(lambda x: json.loads(x) if pd.notna(x) else [])

    index_cols = ["CRSWIR", "NDVI", "BSI", "NDWI", "NBR", "NDMI", "dates"]
    for col in index_cols:
        df[col] = parse_list_column(col)

    df['dates'] = df['dates'].apply(pd.to_datetime)

    return df

def add_lowess(df, frac=0.5):
    print("Start calcul lowess")
    def apply_lowess(indice, row):
        return lowess(endog=row[indice], exog=row["dates"], frac=frac, return_sorted=False)

    # calcul tendance
    list_of_indices_vegetation = ["CRSWIR", "NDVI", "BSI", "NDWI", "NBR", "NDMI"]
    for indice in list_of_indices_vegetation:
        df[f'trend_lowess_{indice}'] = df.apply(lambda row: apply_lowess(indice, row), axis=1)

    return df

def add_max_min_diff(df):
    def max_min_diff(lst):
        return max(lst) - min(lst)

    list_of_indices_vegetation = ["CRSWIR", "NDVI", "BSI", "NDWI", "NBR", "NDMI"]
    for indice in list_of_indices_vegetation:
        df[indice + '_max_min_lowess_diff'] = df[f'trend_lowess_{indice}'].apply(max_min_diff)

    return df


def add_last_value_mean_diff(df):
    def last_value_mean_diff(lst, indice):
        diff = lst[-1] - np.mean(lst)
        if indice in ["CRSWIR", "BSI"]:
            return max(0, diff)
        else:  # NDVI, NDWI, NBR, NDMI
            return min(0, diff)

    list_of_indices_vegetation = ["CRSWIR", "NDVI", "BSI", "NDWI", "NBR", "NDMI"]

    for indice in list_of_indices_vegetation:
        df[indice + '_last_value_mean_lowess_diff'] = df[f'trend_lowess_{indice}'].apply(
            lambda lst: last_value_mean_diff(lst, indice)
        )

    return df

def add_mean_over_years(df, overlap=0.5, window_days=365, freq="5D"):
    """
    Calcule la différence entre la dernière moyenne roulante (1 an)
    et la moyenne des moyennes précédentes, après interpolation régulière.

    Args:
        df (pd.DataFrame): Doit contenir une colonne "dates" + colonnes trend_lowess_x.
        overlap (float): Recouvrement (0 = aucun, 0.5 = 50%, etc.).
        window_days (int): Taille de la fenêtre en jours (par défaut 365).
        freq (str): Fréquence pour interpolation ('D' = jours, 'W' = semaines, etc.)
    """

    print("Start calculating mean rolling over years")

    def mean_over_year(values, dates, indice):
        dates = pd.to_datetime(dates)
        values = np.array(values)

        # construire une série régulière par interpolation
        ts = pd.Series(values, index=dates).sort_index()
        # gérer les doublons en faisant la moyenne
        ts = ts.groupby(ts.index).mean()
        regular_index = pd.date_range(start=dates.min(), end=dates.max(), freq=freq)
        ts_interp = ts.reindex(regular_index).interpolate(method="time")

        # calcul des moyennes roulantes par fenêtre glissante
        means = []
        step_days = int(window_days * (1 - overlap)) if overlap < 1 else 1

        current_end = ts_interp.index.max()
        while True:
            current_start = current_end - pd.Timedelta(days=window_days)
            window = ts_interp.loc[current_start:current_end]
            if len(window) == 0:
                break
            means.append(window.mean())
            # reculer la fenêtre
            current_end -= pd.Timedelta(days=step_days)
            if current_end < ts_interp.index.min():
                break

        if len(means) < 2:
            return np.nan

        last_mean = means[0]  # fenêtre la plus récente
        previous_mean = np.mean(means[1:])  # toutes les autres
        diff = last_mean - previous_mean

        if indice in ["CRSWIR", "BSI"]:
            return max(0, diff)
        else:  # NDVI, NDWI, NBR, NDMI
            return min(0, diff)

    list_of_indices_vegetation = ["CRSWIR", "NDVI", "BSI", "NDWI", "NBR", "NDMI"]

    for indice in list_of_indices_vegetation:
        df[indice + '_mean_lowess_over_year'] = df.apply(
            lambda row: mean_over_year(row[f'trend_lowess_{indice}'], row['dates'], indice),
            axis=1
        )

    return df

def add_informations(csv_path_input, csv_path_output):
    df = pd.read_csv(csv_path_input)

    df = convert_columns(df)
    df = add_lowess(df, 0.1)
    # df = add_max_min_diff(df)
    # df = add_last_value_mean_diff(df)
    df = add_mean_over_years(df, overlap=0.5)

    df.to_pickle(csv_path_output)


if __name__ == "__main__":
    # Charger le fichier CSV
    csv_path_input = "../data/vegetationData/indices_vegetation_2024_coupes_rases_05ha.csv"
    csv_path_output = "../data/vegetationData/indices_vegetation_2024_coupes_rases_05ha_enriched_csv.pkl"

    add_informations(csv_path_input, csv_path_output)









