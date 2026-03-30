import requests
from ..config import get_settings
from ..models.weather import WeatherData, WeatherRisk

settings = get_settings()

OPENWEATHER_BASE = "https://api.openweathermap.org/data/2.5/weather"


def _detect_risk(data: dict) -> WeatherRisk:
    """Detect weather risks from OpenWeather response."""
    weather_id = data["weather"][0]["id"]
    temp = data["main"]["temp"]
    wind = data["wind"]["speed"]

    # Thunderstorm / tornado
    if weather_id < 300:
        return WeatherRisk(
            level="high",
            type="storm",
            message="Severe storm detected in your area!",
            advice="Do not go to the field. Secure your crops and equipment immediately.",
        )
    # Heavy rain / extreme rain
    if 500 <= weather_id <= 531 and weather_id != 500:
        return WeatherRisk(
            level="high",
            type="rain",
            message="Heavy rainfall warning!",
            advice="Ensure proper drainage. Avoid spraying fertilizers or pesticides.",
        )
    # Light rain
    if weather_id == 500:
        return WeatherRisk(
            level="low",
            type="rain",
            message="Light rain expected.",
            advice="Hold off on irrigation. Good time for soil to recharge.",
        )
    # Snow / extreme cold
    if 600 <= weather_id <= 622:
        return WeatherRisk(
            level="high",
            type="frost",
            message="Frost / snowfall warning!",
            advice="Cover sensitive crops. Bring young seedlings indoors if possible.",
        )
    # Heatwave (above 38°C)
    if temp > 38:
        return WeatherRisk(
            level="high",
            type="heatwave",
            message=f"Extreme heat alert! Temperature is {temp:.1f}°C.",
            advice="Water crops early morning or late evening. Provide shade to sensitive crops.",
        )
    # High heat (33–38°C)
    if temp > 33:
        return WeatherRisk(
            level="medium",
            type="heatwave",
            message=f"High temperature: {temp:.1f}°C.",
            advice="Increase irrigation frequency. Monitor crops for heat stress.",
        )
    # High winds
    if wind > 15:
        return WeatherRisk(
            level="medium",
            type="storm",
            message=f"Strong winds detected ({wind:.1f} m/s).",
            advice="Check crop supports and staking. Avoid spraying on windy days.",
        )

    return WeatherRisk(level="none")


def fetch_weather(lat: float, lon: float) -> WeatherData:
    """Fetch weather data from OpenWeather API."""
    params = {
        "lat": lat,
        "lon": lon,
        "appid": settings.openweather_api_key,
        "units": "metric",
    }
    resp = requests.get(OPENWEATHER_BASE, params=params, timeout=10)
    resp.raise_for_status()
    data = resp.json()

    risk = _detect_risk(data)

    return WeatherData(
        temperature=round(data["main"]["temp"], 1),
        feels_like=round(data["main"]["feels_like"], 1),
        humidity=data["main"]["humidity"],
        condition=data["weather"][0]["description"].title(),
        condition_icon=data["weather"][0]["icon"],
        wind_speed=round(data["wind"]["speed"], 1),
        visibility=round(data.get("visibility", 10000) / 1000, 1),
        city=data["name"],
        country=data["sys"]["country"],
        risk=risk,
    )
