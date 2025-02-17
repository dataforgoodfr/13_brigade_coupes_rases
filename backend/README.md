# Brigade Coupes Rases backend

## Installation

Install python 3.11.
Create an environment

```bash
python -m venv venv
```

activate it

```bash
source venv/bin/activate
```

Now you are using an environment isolated from your system. If you do `which python` you should see the path to the python binary in the venv directory.
Install the dependencies

```bash
pip install -r requirements.txt
```

## Run the server

It might be easier to run db + server with the docker-compose file in the root of the project. If you want to run the server manually, you need to have a postgres database running. Then run the following command to start the server:

```bash
python -m app.main
```

Once the server is running, you can access the API in `http://localhost:8000`. You can see the OpenAPI docs in `http://localhost:8000/docs`. These are automatically generated from the code.

## Run the tests

```bash
python -m pytest
```
