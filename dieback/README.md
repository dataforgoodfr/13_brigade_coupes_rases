
# 🌲 Expérimentation – Détection de dépérissement de forêt

## 🎯 Objectif global

À partir d’une détection de coupe rase (SUFOSAT), l’objectif est de vérifier si la zone concernée est effectivement en dépérissement. Cela fournira une information supplémentaire pour aider à identifier les **coupes rases abusives**.

---

## I. Identification des normales d'indices de végétation

### 🎯 Objectif

Vérifier si les amplitudes des indices de végétation correspondent à une fourchette de valeurs attendue.

---

### 1. Clustering sur les forêts

#### 📥 Récupération des données

##### a. Utilisation directe

Utiliser l’échantillon de **1000 forêts** depuis GEE :

```
dieback/data/vegetationData/indices_vegetation_1000_polygons_mean_over_2018-2019.csv
```

##### b. Téléchargement manuel

- Télécharger le masque forêt via [IGN](https://geoservices.ign.fr/bdforet) (~1 Go)
- Lancer le script suivant après avoir configuré les chemins :
  
  ```
  dieback/GEE_scripts/indices_vegetations_forest_for_clustering_from_GEE.py
  ```

Ces données contiennent les **moyennes temporelles et spatiales** sur 1 an des différents indices de végétation.

#### 📊 Clustering et visualisation

La première partie du script :

```
dieback/visualization/analyses.py
```

produit ce résultat :

![kmean_foret.png](img%2Fkmean_foret.png)

- Un **clustering K-means** (9 clusters) a été appliqué
- Une **PCA** a permis la visualisation

**Interprétations :**

- Les groupes ne sont **pas clairement séparés**
- Hypothèses :
  - Le masque forêt IGN pourrait mélanger plusieurs types de forêts
  - Les indices de végétation seuls ne suffisent peut-être pas à distinguer les types de forêts

⚠️ Certains points très excentrés pourraient correspondre à **des anomalies**.

---

### 2. Calcul des moyennes d'indices de végétation par type de forêt

🔧 **À FAIRE**

---

## II. Détection d’anomalies sur les séries temporelles des coupes rases

### 🎯 Objectif

Identifier les forêts **avant coupe rase** qui présentent un comportement **inhabituel** → **possible dépérissement**.

On commence par étudier les indices de végétation **moyennés sur toute la surface** pour faciliter les calculs.

---

#### 📥 Récupération des données

##### a. Utilisation directe

Utiliser l’échantillon de **1000 coupes rases** :

```
dieback/data/vegetationData/indices_vegetation_1000_coupes_rases.csv
```

##### b. Téléchargement manuel

- Télécharger les données depuis le bucket S3 : `brigade-coupe-rase-s3`
- Lancer le script après configuration :

  ```
  dieback/GEE_scripts/indices_vegetations_coupe_rase_from_GEE.py
  ```

Les données contiennent les **moyennes spatiales sur au moins 6 ans** pour chaque indice.

---

#### ⚙️ Construction des features

Approche : étudier la **tendance temporelle** des indices de végétation.

- Application de **Lowess** (régression locale lissée)
- Calcul de nouvelles features :
  - `Max lowess – Min lowess`
  - `Dernière valeur lowess – Moyenne lowess` 
  - `Moyenne roulante sur 1 an (courbe lowess interpolée) -> Dernière année - moyenne des précédentes` que l'on retiendra dans la suite

➡️ Script :  
```
dieback/features/build_features.py
```

---

#### 🚨 Détection d’anomalies

Algorithme utilisé : **Isolation Forest**, pour les raisons suivantes :

- Non supervisé (pas besoin de labels)
- Il peut être utilisé avec des données contenant à la fois des anomalies et des données normales
- Fonctionne bien si les anomalies sont **minoritaires**

Résultat : un **score d’anomalie** attribué à chaque coupe rase.

➡️ Script :  
```
dieback/models/anomaly_detection.py
```

---

#### 📈 Visualisation des résultats

Via la deuxième partie du script :

```
dieback/visualization/analyses.py
```

Visualisations proposées :

- Matrice de **corrélation** des indices sur les 1000 coupes rases
- Histogrammes des **features**
- Plots des séries temporelles selon les **scores d’anomalie**

Exemples de résultats :

| Anomalie détectée | Cas normal |
|-------------------|------------|
| ![anomalie.png](img%2Fanomalie.png) | ![normal.png](img%2Fnormal.png) |


📌 **Rappel des comportements attendus**

Lors d’un dépérissement, certains indices peuvent **augmenter** ou **diminuer** :

| Augmentation | Diminution |
|--------------|------------|
| CRSWIR       | NDVI       |
| BSI          | NDWI       |
|              | NBR        |
|              | NDMI       |



**Interprétations :**

Les anomalies détectées permettent de **séparer raisonnablement** les forêts avec un comportement d'indices végétatif anormal avant coupes rases.


#### ❓ Prochaines étapes

- On n'est pas capable de déterminer si les anomalies sont des dépérissements
- Solution sans labelisation ?
