FROM apache/airflow:2.10.5
USER root
RUN apt update && apt install -y gdal-bin libgdal-dev g++
USER airflow
RUN pip install pygdal==$(gdal-config --version).*
RUN pip install --no-cache-dir "apache-airflow==${AIRFLOW_VERSION}"
COPY requirements.txt /requirements.txt
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r /requirements.txt