import asyncio
import motor.motor_asyncio

async def test():
    try:
        print("Testing connection...")
        client = motor.motor_asyncio.AsyncIOMotorClient('mongodb+srv://bittu20077002_db_user:NCMUpGh6UYW3Aami@cluster0.67pj2i5.mongodb.net/?appName=Cluster0', serverSelectionTimeoutMS=5000)
        await client.server_info()
        print("SUCCESS")
    except Exception as e:
        print(f"FAILED: {type(e).__name__} - {str(e)}")

asyncio.run(test())
