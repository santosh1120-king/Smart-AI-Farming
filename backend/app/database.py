from motor.motor_asyncio import AsyncIOMotorClient
from .config import get_settings

settings = get_settings()

client: AsyncIOMotorClient = None


async def connect_db():
    global client
    client = AsyncIOMotorClient(settings.mongodb_url)
    print("✅ Connected to MongoDB")


async def close_db():
    global client
    if client:
        client.close()
        print("🔴 MongoDB connection closed")


def get_database():
    return client[settings.database_name]


def get_collection(name: str):
    db = get_database()
    return db[name]
