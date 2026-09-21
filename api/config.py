import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/mushibot_db")
DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://")

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

DEFAULT_INSECURE_SECRET = "change-me-to-a-secure-secret-key-that-is-long"
KNOWN_INSECURE_SECRETS = {
    DEFAULT_INSECURE_SECRET,
    "secret",
    "jwtsecret",
    "changeme",
    "replace-with-a-long-random-secret",
    "admin",
    "password",
    "123456",
}

JWT_SECRET = os.getenv("JWT_SECRET", DEFAULT_INSECURE_SECRET)
ENV = os.getenv("ENVIRONMENT", "development").lower()

is_production = ENV in ("production", "prod")
is_insecure_secret = (
    not JWT_SECRET
    or JWT_SECRET in KNOWN_INSECURE_SECRETS
    or len(JWT_SECRET) < 32
)

if is_insecure_secret:
    raise RuntimeError(
        "Insecure, weak, or missing JWT_SECRET. Set a random JWT_SECRET of at least 32 characters."
    )

ALLOWED_JWT_ALGORITHMS = ("HS256", "HS384", "HS512")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
if JWT_ALGORITHM not in ALLOWED_JWT_ALGORITHMS:
    raise ValueError(
        f"Unsupported or insecure JWT_ALGORITHM '{JWT_ALGORITHM}'. Allowed algorithms: {list(ALLOWED_JWT_ALGORITHMS)}"
    )

try:
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    if ACCESS_TOKEN_EXPIRE_MINUTES <= 0:
        ACCESS_TOKEN_EXPIRE_MINUTES = 60
except (ValueError, TypeError):
    ACCESS_TOKEN_EXPIRE_MINUTES = 60

INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY", "")
INTERNAL_TOKEN = os.getenv("INTERNAL_TOKEN", INTERNAL_API_KEY)

NEXTJS_URL = os.getenv("NEXTJS_URL", "http://localhost:3000")
FASTAPI_INTERNAL_URL = os.getenv("FASTAPI_INTERNAL_URL", "http://127.0.0.1:8080")


def is_running_in_docker() -> bool:
    """Check if application is running inside a Docker container or Docker compose production."""
    return (
        os.path.exists("/.dockerenv")
        or os.getenv("RUNNING_IN_DOCKER", "").lower() in ("true", "1", "yes")
        or os.getenv("ENVIRONMENT", "").lower() in ("production", "prod")
    )


def resolve_docker_url(url: str | None) -> str | None:
    """
    If running inside Docker, map loopback addresses (localhost, 127.0.0.1, 0.0.0.0)
    to host.docker.internal so the container can reach services running on the host machine.
    """
    if not url:
        return url
    if not is_running_in_docker():
        return url
    try:
        from urllib.parse import urlparse, urlunparse
        parsed = urlparse(url)
        if parsed.hostname in ("localhost", "127.0.0.1", "0.0.0.0"):
            netloc = "host.docker.internal"
            if parsed.port:
                netloc = f"{netloc}:{parsed.port}"
            return urlunparse(parsed._replace(netloc=netloc))
    except Exception:
        pass
    return url
