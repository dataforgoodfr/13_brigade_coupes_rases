## Utilisation du docker en développement

1. Installer l'image docker
```bash
docker build -t data-pipeline:latest .
```

2. Lancer le conteneur en mode développement
```bash
docker run -it --rm -v $(pwd):/app data-pipeline:latest bash
```

3. Dans le conteneur, activer l'environnement conda
```bash
conda activate py3_13
```

4. Exécuter le code
```bash
# Lancer la pipeline
python -m pipeline.scripts.run_pipeline
```