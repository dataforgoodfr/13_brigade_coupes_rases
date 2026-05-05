# # # # # # # # # # # # 
# Image docker de run #
# # # # # # # # # # # # 
#
# Si le build échoue sur « All attempts to connect to pypi.org failed » :
#   docker build --network=host -f data_pipeline/Dockerfile -t data-pipeline .
# Ou derrière proxy / miroir PyPI d’entreprise :
#   docker build -f data_pipeline/Dockerfile \
#     --build-arg HTTPS_PROXY=$HTTPS_PROXY --build-arg HTTP_PROXY=$HTTP_PROXY \
#     --build-arg PIP_INDEX_URL=https://…/simple/ -t data-pipeline .

# Conda-forge-based image (maintained); avoids deprecated continuumio/miniconda3.
FROM condaforge/miniforge3:latest

# Fournis ces build-args si ton réseau / Docker bloque PyPI ou impose un proxy.
ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG NO_PROXY
ARG PIP_INDEX_URL=https://pypi.org/simple
# Mettre à 1 uniquement si le curl de pré-vol échoue à tort (ex. filtre HTTP bizarre) ; Poetry a toujours besoin d’atteindre l’index pip.
ARG SKIP_PYPI_PREFLIGHT=0
ENV HTTP_PROXY=${HTTP_PROXY} \
    HTTPS_PROXY=${HTTPS_PROXY} \
    NO_PROXY=${NO_PROXY} \
    PIP_INDEX_URL=${PIP_INDEX_URL}

# Clever (and most CI) use the git repo root as Docker build context while
# CC_DOCKERFILE points at this file — paths must be prefixed with data_pipeline/.
WORKDIR /app/data_pipeline

# Installe les dépendances système nécessaires pour GDAL et PostgreSQL
RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    build-essential \
    libpq-dev \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Environnement d’exécution : Python + GDAL seulement (évite les paquets conda en conflit avec le lock Poetry).
ENV CONDA_ALWAYS_YES=true
RUN conda create -y -n py3_13 python=3.13 -c conda-forge && \
    conda install -y -n py3_13 -c conda-forge gdal && \
    conda clean -afy

# Poetry dans l’env « base » ; pip/Poetry utilisent les build-args proxy ci-dessus.
RUN conda install -y -n base -c conda-forge poetry && conda clean -afy

# Python du projet en premier, puis conda base (où se trouve poetry).
ENV PATH="/opt/conda/envs/py3_13/bin:/opt/conda/bin:${PATH}" \
    POETRY_HTTP_TIMEOUT=300 \
    PIP_DEFAULT_TIMEOUT=120 \
    PIP_RETRIES=8 \
    REQUESTS_CA_BUNDLE=/etc/ssl/certs/ca-certificates.crt \
    SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt

# Vérif réseau explicite (même hôte que PIP_INDEX_URL, donc compatible miroir d’entreprise)
RUN if [ "${SKIP_PYPI_PREFLIGHT}" = "1" ]; then \
      echo "SKIP_PYPI_PREFLIGHT=1: pré-vol PyPI ignoré."; \
    else \
      curl -fsSIL --connect-timeout 15 --max-time 45 -o /dev/null "${PIP_INDEX_URL}" \
      || (echo "ERROR: HTTPS vers PIP_INDEX_URL impossible depuis le build Docker." && \
          echo "Essayez: docker build --network=host -f data_pipeline/Dockerfile ." && \
          echo "Ou définissez HTTPS_PROXY / HTTP_PROXY / PIP_INDEX_URL (miroir PyPI)." && exit 1); \
    fi

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
CMD ["python", "-m", "pipeline.scripts.run_pipeline"]
