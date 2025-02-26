import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv, find_dotenv


# On charge les variables d'environnement
env_path = find_dotenv()
env_vars = load_dotenv(env_path)

db_url = os.environ.get('DB_URL')
db_user_name = os.environ.get('DB_USER_NAME')
db_pswd = os.environ.get('DB_PSWD')
db_host = os.environ.get('DB_HOST')
db_name = os.environ.get('DB_NAME')

# On construit l'URL utilisé pour se connecter à la DB
DATABASE_URL = f"postgresql+psycopg2://{db_user_name}:{db_pswd}@{db_host}/{db_name}"
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)

def get_session():
    return Session()
