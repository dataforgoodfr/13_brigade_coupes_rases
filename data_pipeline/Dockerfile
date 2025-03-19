FROM python:3.11-slim

# Update package and install GDAL
RUN apt update && apt install -y \
    gdal-bin \
    libgdal-dev \
    g++ \
    cron \
    nano

# Install the rigth version of GDAL
RUN pip install pygdal==$(gdal-config --version).*

# Configure repository add install dependancies
WORKDIR /app
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Configure the cron jobs permissions 
COPY . /app
RUN mkdir -p /app/logs && chmod 777 /app/logs
COPY cron-job.sh /app/cron-job.sh
RUN chmod +x /app/cron-job.sh

# configure the cronjob and give permissions
RUN echo "*/40 * * * * /app/cron-job.sh" > /etc/cron.d/etl-job
RUN chmod 0644 /etc/cron.d/etl-job
RUN crontab /etc/cron.d/etl-job

# Give the right permissions for cron jobs
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh
RUN chmod -R 755 /app/scripts

# run script
ENTRYPOINT ["/app/entrypoint.sh"]