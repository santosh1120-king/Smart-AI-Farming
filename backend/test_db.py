import os

from dotenv import load_dotenv
import requests

load_dotenv()


def test_supabase_connection():
    supabase_url = os.getenv("SUPABASE_URL", "")
    supabase_key = (
        os.getenv("SUPABASE_KEY")
        or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        or os.getenv("SUPABASE_ANON_KEY")
        or ""
    )

    if not supabase_url or not supabase_key:
        print("SUPABASE_URL or SUPABASE_KEY is missing")
        return

    try:
        response = requests.get(
            f"{supabase_url.rstrip('/')}/rest/v1/government_schemes",
            headers={
                "apikey": supabase_key,
                "Authorization": f"Bearer {supabase_key}",
            },
            params={"select": "id", "limit": "1"},
            timeout=30,
        )
        response.raise_for_status()
        print("Supabase connected successfully")
        print(response.json())
    except Exception as exc:
        print(f"Supabase connection failed: {exc}")


if __name__ == "__main__":
    test_supabase_connection()
