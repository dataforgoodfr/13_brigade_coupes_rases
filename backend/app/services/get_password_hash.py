import bcrypt

# bcrypt n'utilise que les 72 premiers octets d'un mot de passe. Jusqu'à
# bcrypt 4 la troncature était silencieuse ; bcrypt 5 lève une erreur au-delà.
# On tronque explicitement pour rester compatible avec les empreintes existantes.
BCRYPT_MAX_BYTES = 72


def password_to_bytes(password: str) -> bytes:
    return password.encode("utf-8")[:BCRYPT_MAX_BYTES]


def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password=password_to_bytes(password), salt=salt)
    return hashed_password.decode("utf-8")
