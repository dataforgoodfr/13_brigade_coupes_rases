from sklearn.ensemble import IsolationForest
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

def isolation_forest(df, features, plot=True):
    df_features = df[features]

    model = IsolationForest(random_state=42)
    model.fit(df_features)

    df.loc[df_features.index, "anomaly_score"] = model.decision_function(df_features) * -1
    if plot:
        sns.histplot(df["anomaly_score"], bins=50, kde=True)
        plt.title("Distribution des scores d'anomalie")
        plt.legend()
        plt.show()
    return df

if __name__ == "__main__":
    df_path = "../../data/vegetationData/indices_vegetation_2024_coupes_rases_05ha_enriched_csv.pkl"
    df = pd.read_pickle(df_path)

    features = ["CRSWIR", "NDVI", "BSI", "NDWI", "NBR", "NDMI"]
    # features = [feature+"_max_min_lowess_diff" for feature in features]
    # features = [feature+"_last_value_mean_lowess_diff" for feature in features]
    features = [feature + "_mean_lowess_over_year" for feature in features]

    df_features = df.dropna()

    df_anomalie = isolation_forest(df, features, True)
    df_anomalie.to_pickle(df_path)
