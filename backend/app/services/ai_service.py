import base64
import json
from dataclasses import dataclass
from typing import Any

import httpx


SYSTEM_PROMPT = """You are an expert agricultural AI assistant. Analyze crop images and provide detailed assessments.
When analyzing a crop image, you must respond ONLY with a valid JSON object (no markdown, no explanation) with this exact structure:
{
  "crop_type": "Crop name (e.g., Rice, Wheat, Tomato, Corn)",
  "growth_stage": "Stage name (e.g., Seedling, Vegetative, Flowering, Fruiting, Harvest-ready)",
  "growth_percentage": 65,
  "health_status": "Healthy|Risk|Diseased",
  "confidence": 0.87,
  "detected_issues": ["list of issues found, empty array if healthy"],
  "recommendations": ["actionable recommendation 1", "recommendation 2", "recommendation 3"],
  "next_steps": ["immediate step 1", "next step 2", "long term step 3"]
}
Health status rules:
- Healthy: No visible disease, good color, normal growth
- Risk: Minor yellowing, slight wilting, stress signs but treatable
- Diseased: Clear disease spots, rot, severe discoloration, pest damage
"""

TEXT_SYSTEM_PROMPT = """You are a knowledgeable and friendly agricultural advisor for Indian farmers.
Provide practical, simple, actionable advice. Keep answers concise but useful.
If the user shares crop conditions, symptoms, weather, or soil notes, explain the likely issue and the next best actions.
"""

MODEL_CASCADE = {
    "text_fast": [
        ("groq", "llama-3.1-8b-instant"),
        ("openrouter", "meta-llama/llama-3.3-70b-instruct:free"),
    ],
    "text_complex": [
        ("groq", "llama-3.3-70b-versatile"),
        ("groq", "llama-3.1-8b-instant"),
        ("openrouter", "meta-llama/llama-3.3-70b-instruct:free"),
    ],
    "vision": [
        ("openrouter", "google/gemini-2.0-flash-lite-001"),
        ("openrouter", "meta-llama/llama-3.3-70b-instruct:free"),
    ],
}


@dataclass
class AIResult:
    content: str
    provider: str
    model: str


class AIServiceError(RuntimeError):
    pass


def build_provider_keys(headers: dict[str, str]) -> dict[str, str]:
    return {
        "groq": headers.get("x-ai-groq-key", "").strip(),
        "openrouter": headers.get("x-ai-openrouter-key", "").strip(),
    }


def _clean_json_payload(content: str) -> str:
    text = content.strip()
    if text.startswith("```"):
        parts = text.split("```")
        if len(parts) >= 2:
            text = parts[1]
        if text.startswith("json"):
            text = text[4:]
    return text.strip()


def _extract_message_text(payload: dict[str, Any]) -> str:
    choices = payload.get("choices") or []
    if not choices:
        raise AIServiceError("AI provider returned no choices")

    message = choices[0].get("message") or {}
    content = message.get("content", "")
    if isinstance(content, list):
        text_parts = []
        for item in content:
            if item.get("type") == "text":
                text_parts.append(item.get("text", ""))
        content = "\n".join(part for part in text_parts if part)

    if not isinstance(content, str) or not content.strip():
        raise AIServiceError("AI provider returned empty content")
    return content.strip()


def _provider_endpoint(provider: str) -> tuple[str, dict[str, str]]:
    if provider == "groq":
        return "https://api.groq.com/openai/v1/chat/completions", {}
    if provider == "openrouter":
        return "https://openrouter.ai/api/v1/chat/completions", {
            "HTTP-Referer": "http://localhost:5173",
            "X-Title": "Smart AI Farming",
        }
    raise AIServiceError(f"Unsupported provider '{provider}'")


async def _call_provider(
    provider: str,
    api_key: str,
    model: str,
    messages: list[dict[str, Any]],
    max_tokens: int,
    temperature: float,
) -> AIResult:
    if not api_key:
        raise AIServiceError(f"{provider.title()} API key is missing")

    url, extra_headers = _provider_endpoint(provider)
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        **extra_headers,
    }
    payload = {
        "model": model,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": temperature,
    }

    async with httpx.AsyncClient(timeout=45.0) as client:
        response = await client.post(url, headers=headers, json=payload)

    if response.is_success:
        content = _extract_message_text(response.json())
        return AIResult(content=content, provider=provider, model=model)

    detail = response.text
    try:
        data = response.json()
        detail = data.get("error", {}).get("message") or data
    except Exception:
        pass
    raise AIServiceError(f"{provider.title()} {model} failed: {detail}")


async def _run_waterfall(
    task_type: str,
    provider_keys: dict[str, str],
    messages: list[dict[str, Any]],
    max_tokens: int,
    temperature: float,
) -> AIResult:
    errors: list[str] = []
    for provider, model in MODEL_CASCADE[task_type]:
        api_key = provider_keys.get(provider, "")
        if not api_key:
            errors.append(f"{provider.title()} key missing")
            continue
        try:
            return await _call_provider(provider, api_key, model, messages, max_tokens, temperature)
        except AIServiceError as exc:
            errors.append(str(exc))
            continue

    raise AIServiceError("All AI providers failed. " + " | ".join(errors))


def _build_image_content(image_data: bytes, filename: str) -> dict[str, Any]:
    b64_image = base64.b64encode(image_data).decode("utf-8")
    ext = filename.lower().split(".")[-1]
    media_types = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png", "webp": "image/webp"}
    media_type = media_types.get(ext, "image/jpeg")
    return {
        "type": "image_url",
        "image_url": {
            "url": f"data:{media_type};base64,{b64_image}",
        },
    }


async def analyze_crop_image(
    image_data: bytes,
    filename: str,
    provider_keys: dict[str, str],
    notes: str | None = None,
) -> dict[str, Any]:
    if not provider_keys.get("openrouter"):
        raise AIServiceError(
            "OpenRouter API key is required for image analysis in the free-tier waterfall."
        )

    user_prompt = "Analyze this crop image and provide a detailed assessment."
    if notes:
        user_prompt += f" Additional farmer notes: {notes}"

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "user",
            "content": [
                _build_image_content(image_data, filename),
                {"type": "text", "text": user_prompt},
            ],
        },
    ]

    result = await _run_waterfall(
        task_type="vision",
        provider_keys=provider_keys,
        messages=messages,
        max_tokens=800,
        temperature=0.2,
    )

    analysis = json.loads(_clean_json_payload(result.content))
    return {
        "analysis": analysis,
        "provider": result.provider,
        "model": result.model,
    }


async def answer_farming_question(
    query: str,
    provider_keys: dict[str, str],
    context: str | None = None,
) -> dict[str, str]:
    messages = [{"role": "system", "content": TEXT_SYSTEM_PROMPT}]
    if context:
        messages.append({"role": "user", "content": f"Farmer context:\n{context}"})
    messages.append({"role": "user", "content": query})

    task_type = "text_fast" if len(query) < 120 and not context else "text_complex"
    result = await _run_waterfall(
        task_type=task_type,
        provider_keys=provider_keys,
        messages=messages,
        max_tokens=400,
        temperature=0.5,
    )

    return {
        "response": result.content,
        "provider": result.provider,
        "model": result.model,
    }
