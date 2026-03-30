import asyncio
import httpx
import json
import base64

async def test():
    token = ""
    # 1. Login to get a token
    try:
        async with httpx.AsyncClient() as client:
            res = await client.post("http://localhost:8000/api/auth/login", json={
                "email": "testapi2@example.com",
                "password": "password123"
            })
            if res.status_code != 200:
                print("Login failed:", res.text)
                return
            token = res.json()["access_token"]
            
            # 2. Dummy image for crop analysis
            dummy_img = b"R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" # 1x1 transparent gif
            dummy_bytes = base64.b64decode(dummy_img)

            # multipart/form-data
            files = {'file': ('dummy.jpg', dummy_bytes, 'image/jpeg')}
            headers = {"Authorization": f"Bearer {token}"}
            res_crop = await client.post("http://localhost:8000/api/crop/analyze", files=files, headers=headers)
            print("Crop Analysis status:", res_crop.status_code)
            print("Response:", res_crop.text)
            
    except Exception as e:
        print("Error:", e)

asyncio.run(test())
