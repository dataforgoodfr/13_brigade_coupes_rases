# # # # # # # # # # # #
# Image docker de run #
# # # # # # # # # # # #

# Clever (and most CI) use the git repo root as Docker build context while
# CC_DOCKERFILE points at this file — paths must be prefixed with data_pipeline/.
FROM condaforge/miniforge3:latest

WORKDIR /app/data_pipeline

# Installe les dépendances système nécessaires pour GDAL et PostgreSQL
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Crée l'environnement conda avec Python 3.13 + GDAL en une seule passe
# (deux appels conda séparés doublent le pic mémoire du solveur)
ENV CONDA_ALWAYS_YES=true
RUN mamba create -y -n py3_13 python=3.13 gdal -c conda-forge && \
    mamba clean -afy

# Installe Poetry dans py3_13 pour que les packages atterrissent dans le bon env
RUN /opt/conda/envs/py3_13/bin/pip install poetry
RUN /opt/conda/envs/py3_13/bin/poetry config virtualenvs.create false

# Copie les fichiers de configuration Poetry (context = repo root)
COPY data_pipeline/pyproject.toml data_pipeline/poetry.lock* ./

# Installe les dépendances du projet dans py3_13
RUN /opt/conda/envs/py3_13/bin/poetry install --no-interaction --no-ansi --no-root

# Copie le code du sous-projet pipeline
COPY data_pipeline/ ./

# Installe le projet lui-même dans py3_13
RUN /opt/conda/envs/py3_13/bin/poetry install --no-interaction --no-ansi --only-root

ENV PATH="/opt/conda/envs/py3_13/bin:${PATH}"

# Force l'utilisation des bibliothèques conda (dont libstdc++ récent)
ENV LD_LIBRARY_PATH=/opt/conda/envs/py3_13/lib

# Commande par défaut pour lancer la pipeline
CMD ["python", "-m", "pipeline.scripts.run_pipeline"]
