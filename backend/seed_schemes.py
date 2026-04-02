"""
Seed Supabase with sample Indian government agricultural schemes.
Run: python seed_schemes.py
"""
import os
import uuid
from datetime import datetime, timezone

from dotenv import load_dotenv
import requests

load_dotenv()

from app.data.schemes_data import SCHEMES

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = (
    os.getenv("SUPABASE_KEY")
    or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    or os.getenv("SUPABASE_ANON_KEY")
    or ""
)


def utcnow_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def seed():
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise RuntimeError("SUPABASE_URL and SUPABASE_KEY must be configured before seeding")
    base_url = f"{SUPABASE_URL.rstrip('/')}/rest/v1/government_schemes"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
    }

    delete_response = requests.delete(
        base_url,
        headers={**headers, "Prefer": "return=representation"},
        params={"id": "neq."},
        timeout=30,
    )
    delete_response.raise_for_status()

    payload = [
        {
            "id": uuid.uuid4().hex,
            **scheme,
            "created_at": utcnow_iso(),
        }
        for scheme in SCHEMES
    ]
    insert_response = requests.post(
        base_url,
        headers={**headers, "Prefer": "return=representation"},
        json=payload,
        timeout=30,
    )
    insert_response.raise_for_status()
    print(f"Seeded {len(insert_response.json() or [])} government schemes into Supabase")


if __name__ == "__main__":
    seed()
