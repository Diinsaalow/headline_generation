from fastapi import HTTPException, status
from pymongo import ASCENDING, DESCENDING, MongoClient
from pymongo.collection import Collection
from pymongo.database import Database
from pymongo.errors import PyMongoError

from core.config import get_settings

_client: MongoClient | None = None
_database: Database | None = None
_last_connection_error: str | None = None


def initialize_indexes(database: Database) -> None:
    database.users.create_index("email", unique=True)
    database.history.create_index([("user_id", ASCENDING), ("created_at", DESCENDING)])


def connect_to_mongo() -> Database | None:
    global _client, _database, _last_connection_error

    if _database is not None:
        return _database

    settings = get_settings()

    try:
        client = MongoClient(
            settings.mongodb_uri,
            tz_aware=True,
            serverSelectionTimeoutMS=3000,
            connectTimeoutMS=3000,
            socketTimeoutMS=3000,
        )
        client.admin.command("ping")
        database = client[settings.mongodb_database]
        initialize_indexes(database)
    except PyMongoError as error:
        _client = None
        _database = None
        _last_connection_error = str(error)
        return None

    _client = client
    _database = database
    _last_connection_error = None
    return _database


def close_mongo_connection() -> None:
    global _client, _database

    if _client is not None:
        _client.close()

    _client = None
    _database = None


def get_database() -> Database:
    database = connect_to_mongo()
    if database is None:
        message = "MongoDB is unavailable. Start MongoDB and try again."
        if _last_connection_error:
            message = f"{message} Last error: {_last_connection_error}"

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=message,
        )

    return database


def get_collection(name: str) -> Collection:
    return get_database()[name]


def get_mongo_status() -> dict:
    return {
        "mongo_connected": _database is not None,
        "mongo_error": _last_connection_error,
    }
