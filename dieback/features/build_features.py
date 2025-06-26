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

def add_lowess(df):
    def apply_lowess(indice, row):
        return lowess(endog=row[indice], exog=row["dates"], frac=0.5, return_sorted=False)

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

def add_informations(csv_path_input, csv_path_output):
    df = pd.read_csv(csv_path_input)

    df = convert_columns(df)
    df = add_lowess(df)
    df = add_max_min_diff(df)
    df = add_last_value_mean_diff(df)

    df.to_pickle(csv_path_output)


if __name__ == "__main__":
    # Charger le fichier CSV
    csv_path_input = "../data/vegetationData/indices_vegetation_1000_coupes_rases.csv"
    csv_path_output = "../data/vegetationData/indices_vegetation_1000_coupes_rases_enriched_csv.pkl"

    add_informations(csv_path_input, csv_path_output)









