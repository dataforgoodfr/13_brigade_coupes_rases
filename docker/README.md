# Image de la base de développement

`postgres/Dockerfile` construit l'image PostgreSQL/PostGIS utilisée par le
service `db` du `docker-compose.yml` de la racine ; `create-databases.sh` crée
une base par nom listé dans `DATABASES` (`local` pour le développement, `test`
pour les tests du backend).

## Démarrer la base

Depuis la racine du dépôt :

```bash
docker compose up db pgadmin        # ajouter -d pour la lancer en arrière-plan
```

PostgreSQL écoute sur `localhost:5432`, utilisateur et mot de passe `devuser`,
conteneur `coupes-rases-database`. Les données sont conservées dans le volume
`coupes-rases-data` ; `docker compose down -v` le supprime.

## Se connecter à la base

pgAdmin est sur [http://localhost:8888](http://localhost:8888)
(`devuser@devuser.com` / `devuser`) ; enregistrer le serveur avec l'hôte `db`,
le port `5432`, la base `postgres`, utilisateur et mot de passe `devuser`.

Avec le [client psql](https://www.postgresql.org/download/) :

```bash
docker exec -it coupes-rases-database psql -U devuser -d local
# ou, sans docker exec
PGPASSWORD=devuser psql -h localhost -U devuser -d local
```

Tout autre client convient, par exemple [DBeaver](https://dbeaver.io/).

## Lire les e-mails envoyés en local

Avec la pile complète (`docker compose up`), le backend envoie ses e-mails à
[Mailpit](https://mailpit.axllent.org/), qui les affiche sur
[http://localhost:8025](http://localhost:8025) sans rien expédier.
