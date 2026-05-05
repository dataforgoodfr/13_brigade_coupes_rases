# # # # # # # # # # # # 
# Image docker de run #
# # # # # # # # # # # # 

# Conda-forge-based image (maintained); avoids deprecated continuumio/miniconda3.
FROM condaforge/miniforge3:latest

# Clever (and most CI) use the git repo root as Docker build context while
# CC_DOCKERFILE points at this file — paths must be prefixed with data_pipeline/.
WORKDIR /app/data_pipeline

# Installe les dépendances système nécessaires pour GDAL et PostgreSQL
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Crée l'environnement conda avec Python 3.13, GDAL et Poetry (conda-forge; évite pip pour Poetry)
ENV CONDA_ALWAYS_YES=true
RUN conda create -y -n py3_13 python=3.13 -c conda-forge && \
    conda install -y -n py3_13 -c conda-forge gdal poetry && \
    conda clean -afy

# Active l'environnement conda
SHELL ["conda", "run", "-n", "py3_13", "/bin/bash", "-c"]

# Poetry déclenche pip pour les wheels — timeouts plus tolérants sur réseaux lents / CI
ENV PIP_DEFAULT_TIMEOUT=120 \
    PIP_RETRIES=5

# Configure Poetry pour ne pas créer de virtualenv (on utilise déjà conda)
RUN poetry config virtualenvs.create false

# Install from committed lock (repro builds; avoids `poetry lock` needing full PyPI resolve in CI/Docker).
# If pyproject and lock drift, run `poetry lock` in data_pipeline/ and commit both.
COPY data_pipeline/pyproject.toml data_pipeline/poetry.lock ./
RUN poetry install --no-interaction --no-ansi --no-root

# Copie le reste du sous-projet (écrase pyproject/poetry.lock par les mêmes fichiers du repo)
COPY data_pipeline/ ./

RUN poetry install --no-interaction --no-ansi --only-root

# Détecter tôt les incompatibilités GeoPandas / dask-geopandas (imports lourds du run)
RUN python -c "import dask_geopandas; import geopandas"

# CORRECTION: Force l'utilisation des bibliothèques conda (dont libstdc++ récent)
ENV LD_LIBRARY_PATH=/opt/conda/envs/py3_13/lib

# Commande par défaut pour lancer la pipeline
CMD ["conda", "run", "--no-capture-output", "-n", "py3_13", "python", "-m", "pipeline.scripts.run_pipeline"]
