# # # # # # # # # # # # 
# Image docker de run #
# # # # # # # # # # # # 

# Utilise une image de base avec conda
FROM continuumio/miniconda3:latest

# Définit le répertoire de travail
WORKDIR /app

# Installe les dépendances système nécessaires pour GDAL et PostgreSQL
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Crée l'environnement conda avec Python 3.13 et GDAL
RUN conda create -n py3_13 python=3.13 -c conda-forge && \
    conda install -n py3_13 -c conda-forge gdal && \
    conda clean -afy

# Active l'environnement conda
SHELL ["conda", "run", "-n", "py3_13", "/bin/bash", "-c"]

# Installe Poetry
RUN pip install poetry

# Configure Poetry pour ne pas créer de virtualenv (on utilise déjà conda)
RUN poetry config virtualenvs.create false

# Copie les fichiers de configuration Poetry
COPY pyproject.toml poetry.lock* ./

# Installe les dépendances du projet
RUN poetry install --no-interaction --no-ansi --no-root

# Copie tout le code du projet
COPY . .

# Installe le projet lui-même
RUN poetry install --no-interaction --no-ansi --only-root

# CORRECTION: Force l'utilisation des bibliothèques conda (dont libstdc++ récent)
ENV LD_LIBRARY_PATH=/opt/conda/envs/py3_13/lib:$LD_LIBRARY_PATH

# Commande par défaut pour lancer la pipeline
CMD ["conda", "run", "--no-capture-output", "-n", "py3_13", "python", "-m", "pipeline.scripts.run_pipeline"]
