FROM python:3.13-slim

# Update package lists and install GDAL
RUN apt-get update
RUN apt-get install -y gdal-bin libgdal-dev


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

RUN apt-get install -y g++

# Install the specific version of pygdal that matches the installed GDAL version
RUN pip install "gdal==$(gdal-config --version)"

# Copy all the scripts into the container
COPY scripts/ /app/scripts/