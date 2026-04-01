from motor.motor_asyncio import AsyncIOMotorClient

from .config import get_settings

settings = get_settings()

client: AsyncIOMotorClient = None


async def connect_db():
    global client
    client = AsyncIOMotorClient(settings.mongodb_url, serverSelectionTimeoutMS=10000)
    try:
        await client.admin.command("ping")
        print("Connected to MongoDB")
    except Exception as exc:
        client = None
        raise RuntimeError(f"MongoDB connection failed: {exc}") from exc


async def close_db():
    global client
    if client:
        client.close()
        print("MongoDB connection closed")


def get_database():
    return client[settings.database_name]


def get_collection(name: str):
    db = get_database()
    return db[name]
