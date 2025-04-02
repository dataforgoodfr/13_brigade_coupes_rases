# Use the base Python 3.11 slim image
FROM python:3.11-slim

# Update package lists and install GDAL, its dependencies, and Cron
RUN apt-get update && apt-get install -y \
    gdal-bin \          # GDAL binary tools
    libgdal-dev \       # GDAL development libraries
    g++ \               # C++ compiler
    cron \              # Cron service for scheduled tasks
    && rm -rf /var/lib/apt/lists/*  # Clean up package lists

# Upgrade pip, setuptools, and wheel for better dependency management
RUN pip install --upgrade pip setuptools wheel

# Install Poetry for managing project dependencies
RUN pip install poetry

# Set the working directory in the container
WORKDIR /app

# Copy pyproject.toml and poetry.lock to the container for dependency resolution
COPY pyproject.toml poetry.lock* /app/

# Configure Poetry to not create a virtual environment (use the global Python environment)
RUN poetry config virtualenvs.create false

# Install project dependencies using Poetry in non-interactive mode without ANSI output
RUN poetry install --no-interaction --no-ansi

# Install the specific version of pygdal that matches the installed GDAL version
RUN pip install "pygdal==$(gdal-config --version).*"

# Copy all project files into the container
COPY . /app

# Make run.sh executable
RUN chmod +x /app/run.sh

# Schedule a cron job to run run.sh every minute and log its output
RUN echo "* * * * * /app/run.sh >> /app/logs/cron.log 2>&1" > /etc/cron.d/data_pipeline

# Set appropriate permissions for the cron file
RUN chmod 0644 /etc/cron.d/data_pipeline

# Create a directory for temporary data storage and set appropriate permissions
RUN mkdir -p /app/data_temp && chmod -R a+rwx /app/data_temp

# Apply the scheduled cron job
RUN crontab /etc/cron.d/data_pipeline

# Start the Cron service in the foreground to keep the container running
CMD ["cron", "-f"]