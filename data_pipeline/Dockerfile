# # # # # # # # # # # # 
# Image docker de run #
# # # # # # # # # # # # 

# Utilise une image de base avec conda
FROM continuumio/miniconda3:latest

# Clever (and most CI) use the git repo root as Docker build context while
# CC_DOCKERFILE points at this file — paths must be prefixed with data_pipeline/.
WORKDIR /app/data_pipeline

# Installe les dépendances système nécessaires pour GDAL et PostgreSQL
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Crée l'environnement conda avec Python 3.13 et GDAL (non-interactive)
ENV CONDA_ALWAYS_YES=true
RUN conda create -y -n py3_13 python=3.13 -c conda-forge && \
    conda install -y -n py3_13 -c conda-forge gdal && \
    conda clean -afy

# Active l'environnement conda
SHELL ["conda", "run", "-n", "py3_13", "/bin/bash", "-c"]

# Installe Poetry
RUN pip install poetry

# Configure Poetry pour ne pas créer de virtualenv (on utilise déjà conda)
RUN poetry config virtualenvs.create false

# Lock file must match pyproject.toml; host copy is excluded via root .dockerignore
# so we always resolve deps in-image (avoids "pyproject.toml changed since poetry.lock").
COPY data_pipeline/pyproject.toml ./
RUN poetry lock --no-interaction
RUN poetry install --no-interaction --no-ansi --no-root

# Copie le code du sous-projet pipeline (poetry.lock excluded from context)
COPY data_pipeline/ ./

RUN poetry install --no-interaction --no-ansi --only-root

# CORRECTION: Force l'utilisation des bibliothèques conda (dont libstdc++ récent)
ENV LD_LIBRARY_PATH=/opt/conda/envs/py3_13/lib

# Commande par défaut pour lancer la pipeline
CMD ["conda", "run", "--no-capture-output", "-n", "py3_13", "python", "-m", "pipeline.scripts.run_pipeline"]
