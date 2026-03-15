from google import genai
from .config import settings

client = None
if settings.GEMINI_API_KEY:
    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
    except Exception as e:
        print(f"Failed to initialize Gemini Client: {e}")
        client = None
else:
    print("GEMINI_API_KEY is not set. AI services will fail.")
