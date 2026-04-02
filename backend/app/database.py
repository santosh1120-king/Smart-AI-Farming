from datetime import datetime, timezone
from typing import Any, Iterable

import httpx

from .config import get_settings

settings = get_settings()

client: httpx.AsyncClient | None = None


def utcnow_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _normalize_value(value: Any) -> Any:
    if isinstance(value, datetime):
        return value.astimezone(timezone.utc).isoformat()
    if isinstance(value, dict):
        return {key: _normalize_value(val) for key, val in value.items()}
    if isinstance(value, list):
        return [_normalize_value(item) for item in value]
    return value


def _apply_filters(query: Any, filters: Iterable[tuple[str, str, Any]] | None):
    params = query.copy()
    for column, operator, value in filters or []:
        params[column] = f"{operator}.{_serialize_filter_value(value)}"
    return params


def _serialize_filter_value(value: Any) -> str:
    if isinstance(value, bool):
        return str(value).lower()
    if value is None:
        return "null"
    return str(value)


def _extract_count(response: httpx.Response) -> int:
    content_range = response.headers.get("content-range", "")
    if "/" not in content_range:
        return 0
    _, total = content_range.split("/", 1)
    try:
        return int(total)
    except ValueError:
        return 0


def _ensure_success(response: httpx.Response, action: str, table: str):
    if response.is_success:
        return
    raise RuntimeError(f"{action} failed for table '{table}': {response.status_code} {response.text}")


def get_supabase() -> httpx.AsyncClient:
    if client is None:
        raise RuntimeError("Supabase client is not initialized")
    return client


async def connect_db():
    global client
    if client is not None:
        return

    if not settings.supabase_url or not settings.supabase_key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_KEY must be configured")

    client = httpx.AsyncClient(
        base_url=f"{settings.supabase_url.rstrip('/')}/rest/v1",
        headers={
            "apikey": settings.supabase_key,
            "Authorization": f"Bearer {settings.supabase_key}",
            "Content-Type": "application/json",
        },
        timeout=30.0,
    )
    print("Connected to Supabase")


async def close_db():
    global client
    if client is not None:
        await client.aclose()
        client = None
    print("Supabase client closed")


async def insert_row(table: str, payload: dict[str, Any]) -> dict[str, Any]:
    response = await get_supabase().post(
        f"/{table}",
        headers={"Prefer": "return=representation"},
        json=_normalize_value(payload),
    )
    _ensure_success(response, "Insert", table)
    data = response.json()
    if not data:
        raise RuntimeError(f"Insert failed for table '{table}'")
    return data[0]


async def select_one(
    table: str,
    filters: Iterable[tuple[str, str, Any]] | None = None,
    order_by: str | None = None,
    desc: bool = False,
) -> dict[str, Any] | None:
    rows = await select_rows(table, filters=filters, order_by=order_by, desc=desc, limit=1)
    return rows[0] if rows else None


async def select_rows(
    table: str,
    filters: Iterable[tuple[str, str, Any]] | None = None,
    order_by: str | None = None,
    desc: bool = False,
    limit: int | None = None,
    offset: int | None = None,
) -> list[dict[str, Any]]:
    params = _apply_filters({"select": "*"}, filters)
    if order_by:
        params["order"] = f"{order_by}.{'desc' if desc else 'asc'}"
    if limit is not None:
        params["limit"] = str(limit)
    if offset is not None:
        params["offset"] = str(offset)

    response = await get_supabase().get(f"/{table}", params=params)
    _ensure_success(response, "Select", table)
    return response.json() or []


async def update_rows(
    table: str,
    payload: dict[str, Any],
    filters: Iterable[tuple[str, str, Any]] | None = None,
) -> list[dict[str, Any]]:
    params = _apply_filters({}, filters)
    response = await get_supabase().patch(
        f"/{table}",
        params=params,
        headers={"Prefer": "return=representation"},
        json=_normalize_value(payload),
    )
    _ensure_success(response, "Update", table)
    return response.json() or []


async def delete_rows(
    table: str,
    filters: Iterable[tuple[str, str, Any]] | None = None,
) -> list[dict[str, Any]]:
    params = _apply_filters({}, filters)
    response = await get_supabase().delete(
        f"/{table}",
        params=params,
        headers={"Prefer": "return=representation"},
    )
    _ensure_success(response, "Delete", table)
    return response.json() or []


async def count_rows(
    table: str,
    filters: Iterable[tuple[str, str, Any]] | None = None,
) -> int:
    params = _apply_filters({"select": "id", "limit": "1"}, filters)
    response = await get_supabase().get(
        f"/{table}",
        params=params,
        headers={"Prefer": "count=exact"},
    )
    _ensure_success(response, "Count", table)
    return _extract_count(response)
