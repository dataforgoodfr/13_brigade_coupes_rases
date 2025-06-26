import pandas as pd
import matplotlib.pyplot as plt
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
import seaborn as sns


def plot_clustering(df, list_of_features):
    # 1. Chargement des données
    X = df[list_of_features].dropna()

    # 2. Standardisation
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    k = 9
    kmeans = KMeans(n_clusters=k, random_state=42)
    df["cluster"] = kmeans.fit_predict(X_scaled)

    pca = PCA(n_components=2)
    X_pca = pca.fit_transform(X_scaled)
    df["pca1"] = X_pca[:, 0]
    df["pca2"] = X_pca[:, 1]

    print(pca.explained_variance_ratio_)
    plt.figure(figsize=(8, 6))
    sns.scatterplot(data=df, x="pca1", y="pca2", hue="cluster", palette="Set2")
    plt.title(f"{k} clusters KMeans sur les indices de végétation (PCA)")
    plt.grid(True)
    plt.show()

def plot_histogram(df, list_of_features):
    num_features = len(list_of_features)
    cols = 3  # nombre de colonnes dans la grille d'affichage
    rows = (num_features + cols - 1) // cols  # nombre de lignes nécessaires

    plt.figure(figsize=(cols * 5, rows * 4))

    for i, feature in enumerate(list_of_features):
        plt.subplot(rows, cols, i + 1)
        df[feature].dropna().hist(bins=30)
        plt.title(feature)
        plt.xlabel("Valeur")
        plt.ylabel("Fréquence")

    plt.tight_layout()
    plt.show()

def correlation_matrix(df, list_of_features):
    n = len(list_of_features)

    # Initialisation de la somme des matrices
    corr_sum = pd.DataFrame(np.zeros((n, n)), columns=list_of_features, index=list_of_features)
    count = 0

    # Boucle sur les lignes
    for _, row in df.iterrows():
        # Créer un DataFrame avec les valeurs ligne par ligne
        data = {col: row[col] for col in list_of_features}
        df_row = pd.DataFrame(data)

        # Corrélation seulement si au moins 2 lignes (observations)
        if df_row.shape[0] >= 2:
            corr = df_row.corr()
            corr_sum += corr
            count += 1

    # Moyenne des matrices de corrélation
    corr_mean = corr_sum / count

    plt.figure(figsize=(8, 6))
    sns.heatmap(corr_mean, annot=True, cmap="coolwarm", fmt=".2f")
    plt.title("Matrice de corrélation moyenne")
    plt.show()


def plot_indice_for_anomalies(df, features, min_score=-10, max_score=10):
    # Filtrer les anomalies
    df_anomalies = df[(df["anomaly_score"] > min_score) & (df["anomaly_score"] < max_score)]
    df_anomalies = df_anomalies.sort_values(by="anomaly_score", ascending=False)
    # Affichage un plot à la fois
    for i, row in df_anomalies.iterrows():
        n = len(features)
        fig, axes = plt.subplots(nrows=n, ncols=1, figsize=(12, 2.5 * n), sharex=True)

        # Si n = 1, axes n'est pas une liste => forcer à liste
        if n == 1:
            axes = [axes]

        for ax, feature in zip(axes, features):
            dates = row["dates"]
            values = row[feature]
            trend = row.get(f"trend_lowess_{feature}", None)

            ax.scatter(dates, values, label=feature, color='blue', s=10)
            if trend is not None:
                ax.plot(dates, trend, label=f"{feature} (LOWESS)", color='red')

            ax.set_ylabel(feature)
            ax.grid(True)
            ax.legend(loc='upper left')

        axes[-1].set_xlabel("Date")
        fig.suptitle(f"Série ID: {row['coupe_rase_id']} (anomalie score {row['anomaly_score']})", fontsize=14)
        plt.tight_layout(rect=[0, 0, 1, 0.97])
        plt.show()

if __name__ == "__main__":
    '''
    I. Analyse du fichier créé à partir du masque foret et de GEE
    '''
    df_foret_path = "../data/vegetationData/indices_vegetation_1000_polygons_mean_over_2018-2019.csv"
    df_foret = pd.read_csv(df_foret_path)
    # indices de végétation
    features = ["CRSWIR", "NDVI", "BSI", "NDWI", "NBR", "NDMI"]
    plot_clustering(df_foret, features)

    '''
    II. Analyse du fichier créé à partir des coupes rases et de GEE + anomaly score
    '''
    df_coupe_rase_enriched_path = "../data/vegetationData/indices_vegetation_1000_coupes_rases_enriched_csv.pkl"
    df_coupe_rase_enriched = pd.read_pickle(df_coupe_rase_enriched_path)

    # Matrice de corrélation entre les différents indices de végétation (moyenne effectuée sur les 1000 matrices de corrélation de chaque coupe rase)
    correlation_matrix(df_coupe_rase_enriched, features)

    # features créées à partir des indices de végétation
    features_1 = [feature+"_max_min_lowess_diff" for feature in features]
    features_2 = [feature+"_last_value_mean_lowess_diff" for feature in features]

    # Représentation de la distribution des données pour les features créées 1 et 2
    plot_histogram(df_coupe_rase_enriched, features_1)
    plot_histogram(df_coupe_rase_enriched, features_2)

    # Visualisation des différents indices en fonction du score d'anomalie -> Filtrer le score (range ~ entre -0.2 et 0.3)
    # Plus le score est elevé, plus la foret avant la coupe rase est suceptible d'être dans un état inhabituel (dépérissement ?)
    plot_indice_for_anomalies(df_coupe_rase_enriched, features, 0.15, 1)

