import base64
import json
from openai import AsyncOpenAI
from ..config import get_settings

settings = get_settings()
# Gemini is accessed through Google's OpenAI-compatible endpoint.
client = AsyncOpenAI(
    api_key=settings.gemini_api_key,
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
)

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


async def analyze_crop_image(image_data: bytes, filename: str) -> dict:
    """Analyze a crop image using Gemini via the OpenAI-compatible API."""
    # Encode image to base64
    b64_image = base64.b64encode(image_data).decode("utf-8")
    
    # Determine media type
    ext = filename.lower().split(".")[-1]
    media_types = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png", "webp": "image/webp"}
    media_type = media_types.get(ext, "image/jpeg")

    response = await client.chat.completions.create(
        model="gemini-2.0-flash",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{media_type};base64,{b64_image}",
                            "detail": "high",
                        },
                    },
                    {"type": "text", "text": "Analyze this crop image and provide detailed assessment."},
                ],
            },
        ],
        max_tokens=800,
        temperature=0.2,
    )

    content = response.choices[0].message.content.strip()
    # Strip markdown code blocks if present
    if content.startswith("```"):
        content = content.split("```")[1]
        if content.startswith("json"):
            content = content[4:]
    
    return json.loads(content)


async def answer_farming_question(query: str, context: str = None) -> str:
    """Answer farming-related questions using Gemini."""
    system = """You are a knowledgeable and friendly agricultural advisor for Indian farmers.
    Provide practical, simple, actionable advice. Keep answers concise (2-4 sentences).
    Use simple language that farmers can understand. Focus on local Indian farming practices.
    Always be encouraging and supportive."""
    
    messages = [{"role": "system", "content": system}]
    if context:
        messages.append({"role": "user", "content": f"Context: {context}"})
    messages.append({"role": "user", "content": query})
    
    response = await client.chat.completions.create(
        model="gemini-2.0-flash",
        messages=messages,
        max_tokens=300,
        temperature=0.7,
    )
    return response.choices[0].message.content.strip()
