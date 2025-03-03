# Introduction à PostGis

PostGis est une extension Postresql qui ajoute le support natif des données géographiques.
Elle doit être activée pour chaque base avec :
```SQL
CREATE EXTENSION postgis;
```

Pour savoir quelle version est activée : 
```SQL
SELECT postgis_full_version();
```

## Gestion des données

### Coordonnées
Les coordonnées peuvent être 
* **géographiques** (== "geodetic" == "lat/lon" == "lon/lat"). Ce sont des coordonnées sphériques exprimées en degrés. 
* **géométriques**, moins précises mais permettant des calculs plus rapides.

Il est possible de convertir les coordonnées d'un type à l'autre, pour bénéficier des fonctions des coordonnées géométriques, qui sont plus nombreuses que celles pour les coordonnées géographiques.
### Système de référence

Le **SRS** : Spatial Reference System ou **CRS** : Coordinate Reference System définit comment la géométrie est référencée à la surface de la Terre, autrement dit quel est le système de coordonnées utilisé.

Le **SRID** (Spatial Reference Identifier) est l'identifiant numérique du système de coordonnées  utilisé pour une carte ou un projet. **Utiliser le mauvais SRID faussera tous les calculs**.

* un SRS **géodétique** utilise des coordonnées angulaires ;
* un SRS **projeté** utilise une transformation mathématique pour aplatir le sphéroïde sur un plan et produire des coordonnées cartésiennes. Il peut être limité dans l'espace pour éviter des déformations importantes ; 
* un SRS **local** est un système de coordonnées cartésiennes sans référence à la surface de la Terre. Dans PostGis, il est identifié par le SRID 0.

### Géométrie

Une géométrie est un ensemble de points à 2 (X, Y), 3 (X, Y, Z) ou 4 dimensions (X, Y, Z, M).
C'est une classe abstraite, dont héritent nombreuses classes concrètes, qui sont soit des géométries, soit des collections de géométries.

![Représentation arborescentes des types abstraits et concrets de géométries et de collections de géométries](images/geometry_hierarchy.png "Hiérarchie des types géométriques")

Il existe 2 formats pour représenter une géométrie pour un usage externe :
* **WKT** : Well Known Text
* **WKB** : Well Known Binary

Il existe des fonctions de conversion de géométrie vers ces formats :

```SQL
text WKT = ST_AsText(geometry);
geometry = ST_GeomFromText(text WKT, SRID);

bytea WKB = ST_AsBinary(geometry);
geometry = ST_GeomFromWKB(bytea WKB, SRID);
```

PostGis autorise la création et le stockage de géométries invalides, qui devront être corrigées. [ST_IsValid](https://postgis.net/docs/ST_IsValid.html "ST_IsValid") permet de vérifier si une géométrie est correcte.

### Box2D

Le type `box2d` représente un rectangle qui englobe une géométrie ou une collection de géométries. Il peut être converti automatiquement en type `box3D` ou `geometry`.

### Box3D

Le type `box3d` représente un [parallélépipède rectangle](https://www.educastream.com/fr/parallelepipede-rectangle-6eme) qui englobe une géométrie ou une collection de géométries. Il peut être converti automatiquement en type `box`,  `box2D` ou `geometry`.

### Géographie

Le type `geography` représente une entité dans un systèmes de coordonnées géodésiques (système de coordonnées angulaires représentant la Terre avec un ellipsoïde).
La conversion éventuelle en type `geometry` doit être faite de façon explicite.

### Topologie

La topologie est une branche des mathématiques qui étudie les propriétés spatiales des objets et leurs relations. Dans les SIG, elle est utilisée pour décrire et analyser les relations entre des entités : comment elles sont connectées, quelles frontières (*boundaries*) elles elles partagent ou comment elles se recouvrent.

La topologie utilise des représentations sous forme de graphes, qui comprennent :
* des noeuds (*nodes*) : points de jonction ;
* des arêtes (*edges*) : lignes connectant les noeuds ;
* des faces (*faces*) : régions délimitées par des arêtes.

Le modèle topologique est le troisième modèle de représentation des données vectorielles dans PostGis, avec les modèles géométriques et géographiques. C'est un modèle 2D, comme le modèle géométrique. 

Le type `topology`et les fonctions associées servent à manipuler les faces, les arêtes et les noeuds.

## Format Shapefile

Le format [shapefile](https://fr.wikipedia.org/wiki/Shapefile) est un standard dans le monde des SIG (systèmes d'information géographiques).

Pour charger des données à ce format dans Postgresql, on utilise shp2pgsql. 

Pour exporter des fichiers au format shapefile, on utilise pgsql2shp
## Indexation

PostGist supporte plusieurs types d'index :
* **GIST** : très performant si les données tiennent en mémoire.
* **BRIN** : adapté uniquement si les données sont triées spatialement, et rarement mises à jour.
* **SP-GIST** : index générique qui supporte les recherches basées sur des quad-trees, k-d trees, ou radix trees.
## Requêtes spatiales

### Déteminer les relations spatiales
Les relations spatiales définissent comment deux géométries intéragissent.

### Modèle à 9 intersections dimensionnellement étendu
Les points d'une géométrie peuvent appartenir à 3 ensembles :
* **Boundary** : vide pour un `POINT`, les extrémités pour une `LINESTRING` de deux points (un segment), le contour pour un `POLYGON`
* **Interior** : le point lui-même pour un `POINT`, les points entre les extrémités pour une `LINESTRING`, les points à l'intérieur d'un `POLYGON`
* **Exterior** : tous les autres points

En comparant ces ensembles pour deux géométries on obtient une **matrice d'intersection**.

### Relations spatiales nommées
PostGis fournit des prédicats :
* [ST_Contains](https://postgis.net/docs/manual-3.4/fr/ST_Contains.html "ST_Contains")
* [ST_Crosses](https://postgis.net/docs/manual-3.4/fr/ST_Crosses.html "ST_Crosses")
* [ST_Disjoint](https://postgis.net/docs/manual-3.4/fr/ST_Disjoint.html "ST_Disjoint")
* [ST_Equals](https://postgis.net/docs/manual-3.4/fr/ST_Equals.html "ST_Equals")
* [ST_Intersects](https://postgis.net/docs/manual-3.4/fr/ST_Intersects.html "ST_Intersects") 
* [ST_Overlaps](https://postgis.net/docs/manual-3.4/fr/ST_Overlaps.html "ST_Overlaps") 
* [ST_Touches](https://postgis.net/docs/manual-3.4/fr/ST_Touches.html "ST_Touches")
* [ST_Within](https://postgis.net/docs/manual-3.4/fr/ST_Within.html "ST_Within")
* [ST_Covers](https://postgis.net/docs/manual-3.4/fr/ST_Covers.html "ST_Covers")
* [ST_CoveredBy](https://postgis.net/docs/manual-3.4/fr/ST_CoveredBy.html "ST_CoveredBy")
* [ST_ContainsProperly](https://postgis.net/docs/manual-3.4/fr/ST_ContainsProperly.html "ST_ContainsProperly")

Exemples d'utilisation :

```SQL
SELECT city.name, state.name, city.geom
FROM city JOIN state ON ST_Intersects(city.geom, state.geom);
```

```SQL
SELECT road_id, road_name
FROM roads
WHERE ST_Intersects(roads_geom, 'SRID=312;POLYGON((...))');
```

### Relations spatiales générales
Si les relations spatiales nommées sont insuffisantes, on peut utiliser des relations spatiales générales, mais c'est plus compliqué.

## Utilisation des index spatiaux

Pour avoir de bonnes performances lors des requêtes spatiales il faut qu'un index spatial soit utilisé. Les relations spatiales nommées le font automatiquement, tout comme les prédicats de distance :
* [ST_DWithin](https://postgis.net/docs/manual-3.4/fr/ST_DWithin.html "ST_DWithin")
* [ST_DFullyWithin](https://postgis.net/docs/manual-3.4/fr/ST_DFullyWithin.html "ST_DFullyWithin")
* [ST_3DDFullyWithin](https://postgis.net/docs/manual-3.4/fr/ST_3DDFullyWithin.html "ST_3DDFullyWithin")
* [ST_3DDWithin](https://postgis.net/docs/manual-3.4/fr/ST_3DDWithin.html "ST_3DDWithin")

Par contre, une fonction comme [ST_Distance](https://postgis.net/docs/manual-3.4/fr/ST_Distance.html "ST_Distance") nécessite qu'on précise l'opérateur spatial à utiliser :
* [un opérateur de délimitation](https://postgis.net/docs/manual-3.4/fr/reference.html#operators-bbox) : en général [&&](https://postgis.net/docs/manual-3.4/fr/geometry_overlaps.html "&&")
* ou [un opérateur de distance](https://postgis.net/docs/manual-3.4/fr/reference.html#operators-distance) : en général [<->](https://postgis.net/docs/manual-3.4/fr/geometry_distance_knn.html "<->")

## Performances

### Petites tables avec de grandes géométries
Pour les valeurs de taille supérieure à 2 Ko, Postgres utilise un mécanisme de stockage et de compression nommé TOAST (*The Oversized-Attribute Storage Technique*). Cela peut provoquer des requêtes lentes sur les petites tables contenant de grandes géométries.  La [documentation de PostGis](https://postgis.net/docs/performance_tips.html) décrit des solutions à ce problème.

### Clustering des index
Si les données d'une tables sont principalement écrites et rarement lues, et qu'un index unique PostGis GIST est utilisé pour la plupart des requêtes, il est recommandé d'utiliser la commande CLUSTER pour l'optimiser. Mais elle ne fonctionne que si les géométries sont non nulles. 

### Éviter les conversions de dimension
Les fonctions comme ST_AsText() or ST_AsBinary() peuvent convertir des données 3D ou 4D en données 2D, mais c'est coûteux sur de grands volumes. Si les dimensions supplémentaires ne sont jamais utilisées il est préférable de les abandonner définitivement :

```SQL
UPDATE mytable SET geom = ST_Force2D(geom);
VACUUM FULL ANALYZE mytable;
```

## SFCGAL

**CGAL** (Computational Geometry Algorithms Library) est une librairie fonctions spatiales 2D et 3D avancées.

**SFCGAL** est un wrapper autour de cette librairie.

## Format Raster

La représentation Raster est une représentation bitmap des données géographiques, par opposition aux données vectorielles. Chaque pixel donne une information telle qu'une altitude, une couleur ou une intensité. Les images satellite fournissent des données de ce type.

Les avantages et inconvénients des données raster par rapport aux données vectorielles sont typiques de ce que l'on connait dans le domaine de l'image.

PostGis possède une extension Raster.

On charge les données raster dans Postgresql  avec un outil nommé raster2pgsql, qui s'appuie sur la bibliothèque **GDAL** (Geospatial Data Abstraction Library). Les données sont alors stockées dans une colonne au format raster. PostGis dispose de types et de fonctions pour les manipuler.

## Adresses

### Address standardizer

L'extension *address_standardizer* convertit une adresse au format texte, sur une ligne, en des données structurées. Elle s'appuie sur des règles stockées dans une table. 

### Géocodeur Tiger 

L'extension *tiger_geocoder* permet :
* de charger des données, y compris à partir d'un cloud ;
* d'écrire des parsers d'adresses ;
* de convertir des adresses en coordonnées géographiques ;
* de convertir des coordonnées géographiques en adresse.

Bien que conçue au départ pour les USA, elle peut être utilisée pour de nombreux pays.

Il existe des alternatives basées sur OpenStreetMap, qui ne sont pas limitées aux USA.
