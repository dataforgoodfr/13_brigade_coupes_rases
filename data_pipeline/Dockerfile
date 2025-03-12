# Utilisation de Python avec les librairies de GDAL
FROM python:3.11-slim

# Mettre à jour les paquets et installer GDAL + Cron
RUN apt update && apt install -y \
    gdal-bin \
    libgdal-dev \
    g++ \
    cron

# Installer pygdal avec la bonne version
RUN pip install pygdal==$(gdal-config --version).*

# Définir le répertoire de travail
WORKDIR /app

# Copier le fichier requirements.txt
COPY requirements.txt /app/requirements.txt

# Installer les dépendances Python
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copier les fichiers du projet
COPY . /app

# Copier le script run.sh
COPY run.sh /app/run.sh
RUN chmod +x /app/run.sh

# Planifier les tâches cron
RUN echo "* * * * * /app/run.sh >> /app/logs/cron.log 2>&1" > /etc/cron.d/data_pipeline

# Donner les permissions appropriées au fichier cron
RUN chmod 0644 /etc/cron.d/data_pipeline
RUN chmod -R a+rwx /app/data_temp

# # Appliquer les tâches cron
RUN crontab /etc/cron.d/data_pipeline

# # Démarrer le service cron
CMD cron -f

# CMD ["python", "scripts/main.py"]