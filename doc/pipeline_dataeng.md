# Documentation Data Eng

## Glossaire

🧩 Comprendre la logique de regroupement

Les polygones de coupe rase détectés (par Sufosat) sont très nombreux : plusieurs millions entre 2018 et 2025. Pour faciliter leur visualisation, ils sont regroupés selon une logique spatio-temporelle à deux niveaux :
🟦 **Polygone**
* Unité de base issue de Sufosat.
* Représente une coupe rase détectée à une date précise.
Datation des polygones:
Date de détection: date à laquelle la coupe rase a été observée via les satellites

🟨 **Clear cut**
* Représente un regroupement de polygones proches dans le temps et dans l’espace.
* Critères de regroupement : polygones distants de moins de 100 mètres et détectés dans un intervalle de moins d’un an.
* Créé à chaque nouvelle analyse (environ tous les 6 mois).
Datation des clear cuts:
Min et Max Date de détection: dates des detections des polygones qui consistuent la clear cut, min et max.
Date d’analyse: date unique d'analyse qui correspond a la creation du groupement des polygone en une clear cut.

🟥 Clear cut report
* Entité “parent” des clear cuts.
* Représente un regroupement persistant dans le temps.
* Lorsqu’un nouveau clear cut est détecté, il est rattaché à un clear cut report existant s’il est à moins de 100m et moins d’un an de distance d’un clear cut déjà présent dans ce rapport.
* Sinon, il crée un nouveau clear cut report.
Datation des cleats cuts:
Max date de detection: date de detection du polygone le plus recent. C'est cette date qui est prise pour le rattachement d'un clear cut a un clear cut report (inferieur a un an).


📝 Pourquoi ce regroupement ? Afficher tous les polygones individuellement serait trop lourd pour le système (6M+ en 2025). Le regroupement permet une visualisation claire et fluide dans le front-end, ainsi qu’un filtrage efficace par zone ou par période.

🗓️ Logique de datation
* Date de détection : date à laquelle la coupe rase a été observée via les satellites (par Sufosat).
* Date d’analyse : date à laquelle la pipeline a été exécutée pour identifier de nouvelles coupes.

🗺️ Enrichissement des données

Chaque clear cut report est enrichi avec :
* Zone Natura 2000
* Pente moyenne du terrain
* Commune, département
Voir le details dans [Clear cut description](./clear-cut-description.md)
Ces informations permettent au système d’alerte d’identifier des cas potentiellement “abusifs” (coupes en zones sensibles ou sur pentes fortes), même si la logique exacte d’abus n’est pas gérée par la pipeline elle-même, mais plus tard dans la base de données.

## Documentation développeur – Pipeline de traitement des coupes rases

🔁 Vue d’ensemble de la pipeline

Cette pipeline, déclenchée sur un schedule, traite les nouvelles données de coupes rases fournies par Sufosat (au format TIFF) et les injecte dans une base PostgreSQL/PostGIS après un traitement géospatial et temporel.
L’objectif est d’identifier les nouvelles coupes depuis la dernière analyse, de les regrouper en objets “clear cuts”, et de les rattacher (ou non) à des “clear cut reports” existants selon une logique définie.

⏱️ Déclenchement & vérification de nouveauté

* Le script s’exécute automatiquement tous les 2 ou 3 mois via un cron job.
* À chaque exécution, il vérifie la disponibilité d’une nouvelle version des données Sufosat :
    * Requête envoyée au fichier metadata de Sufosat (JSON).
    * Comparaison de la date de mise à jour avec celle de la dernière analyse, stockée dans un fichier JSON local sur le storage persistant.
* Si une nouvelle version est détectée :
    * Le fichier TIFF est téléchargé dans le bucket puis localement.
    * Le fichier métadata JSON de suivi est mis à jour avec la date du jour.

📐 Étape 1 : Polygonisation des données Sufosat

* Le fichier TIFF (raster) est converti en polygones représentant des zones de coupes rases.
* Chaque polygone est associé à une date de détection.
* On applique un filtrage temporel : seuls les polygones dont la date de détection est postérieure à la dernière analyse sont conservés pour traitement.

📦 Étape 2 : Regroupement en clear cuts

* Les polygones détectés sont regroupés pour former des objets “clear cut”.
* Logique de regroupement :
    * Les polygones doivent être distants de moins de 100 mètres.
    * Et leur date de détection doit être dans un intervalle de 1 an maximum.

🧬 Étape 3 : Rattachement aux clear cut reports

Chaque clear cut est comparé à la liste des clear cut reports existants, qui contiennent :

* Une géométrie englobante (bounding area).
* La dernière date d’ajout d’un clear cut.

Pour chaque clear cut :

* S’il est à moins de 100m d’un clear cut report existant et si sa date de détection est à moins d’un an de la dernière date du report :
    * ➕ Il est rattaché au clear cut report correspondant.
    * 🕓 Le champ “dernière date de détection” du report est mis à jour.
* Sinon :
    * 🆕 Un nouveau clear cut report est créé, avec un identifiant unique.


🗃️ Étape 4 : Insertion en base

Les objets sont ensuite enrichis avec des données géographiques auxiliaires (zones protégées, pentes, communes, départements, etc.) puis insérés dans la base PostgreSQL/PostGIS :

* clear_cut_reports (entités parents)
* clear_cuts (groupes de polygones)
* Chaque table contient les géométries et les métadonnées utiles à l’affichage et au filtrage dans le front-end.

🧷 Structure des fichiers persistents

Bucket : brigade-coupe-rase-s3
Repertoire Data eng : /dataeng 
* /sufosat_data/forest-clearcuts_mainland-france_sufosat_dates_v3-metadata.json
     Contient :

json
{
  "version": number,                    // Version du format de données
  "s3_key": string,                     // Chemin du fichier dans le bucket S3
  "bucket_name": string,                // Nom du bucket S3
  "data_source_link": string,          // Lien vers la source des données (ex: Zenodo)
  "date_source": string (ISO 8601),    // Date à laquelle la source a été enregistrée
  "file_name": string,                 // Nom du fichier source
  "date_extract": string (YYYY-MM-DD), // Date d'extraction des métadonnées
  "size": integer,                     // Taille du fichier en octets
  "mimetype": string,                  // Type MIME du fichier (ex: image/tiff)
  "metadata": {
    "width": integer,                  // Largeur de l'image en pixels
    "height": integer                  // Hauteur de l'image en pixels
  }
}

* /sufosat_data/
     Contient les fichiers TIFF téléchargés et traités.

