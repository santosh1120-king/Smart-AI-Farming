import os
import json
import firebase_admin
from firebase_admin import credentials, messaging
from ..config import get_settings

settings = get_settings()
_initialized = False


def _init_firebase():
    global _initialized
    if _initialized:
        return
    creds_path = settings.firebase_credentials_path
    if os.path.exists(creds_path):
        cred = credentials.Certificate(creds_path)
        firebase_admin.initialize_app(cred)
        _initialized = True
    else:
        print(f"⚠️  Firebase credentials not found at {creds_path}. Push notifications disabled.")


_init_firebase()


def send_push_notification(fcm_token: str, title: str, body: str, data: dict = None) -> bool:
    """Send a push notification to a specific device via Firebase FCM."""
    if not _initialized:
        print("Firebase not initialized. Skipping notification.")
        return False
    try:
        message = messaging.Message(
            notification=messaging.Notification(title=title, body=body),
            data={k: str(v) for k, v in (data or {}).items()},
            token=fcm_token,
        )
        response = messaging.send(message)
        print(f"✅ Notification sent: {response}")
        return True
    except Exception as e:
        print(f"❌ Notification error: {e}")
        return False


def send_multicast_notification(tokens: list, title: str, body: str, data: dict = None) -> bool:
    """Send notification to multiple devices."""
    if not _initialized or not tokens:
        return False
    try:
        message = messaging.MulticastMessage(
            notification=messaging.Notification(title=title, body=body),
            data={k: str(v) for k, v in (data or {}).items()},
            tokens=tokens,
        )
        response = messaging.send_multicast(message)
        print(f"✅ Multicast sent: {response.success_count} success, {response.failure_count} failures")
        return True
    except Exception as e:
        print(f"❌ Multicast error: {e}")
        return False
