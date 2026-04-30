import json
import logging
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeoutError

from google import genai
from google.genai import errors as genai_errors
from django.conf import settings

logger = logging.getLogger(__name__)

_client = None
_TIMEOUT = 30


def get_client():
    global _client
    if _client is None:
        key = getattr(settings, 'GEMINI_API_KEY', '')
        if not key:
            raise ValueError("GEMINI_API_KEY is not set in .env")
        _client = genai.Client(api_key=key)
    return _client


def _call_blocking(prompt: str) -> str:
    client = get_client()
    model = getattr(settings, 'GEMINI_MODEL', 'gemini-2.5-flash-lite')
    response = client.models.generate_content(model=model, contents=prompt)
    return response.text.strip()


def call_gemini(prompt: str, caller: str = "gemini") -> dict:
    """Call Gemini, return parsed JSON dict. Never raises — returns {error: ...} on failure."""
    try:
        with ThreadPoolExecutor(max_workers=1) as executor:
            text = executor.submit(_call_blocking, prompt).result(timeout=_TIMEOUT)

        if text.startswith("```"):
            parts = text.split("```")
            text = parts[1].lstrip("json").strip() if len(parts) > 1 else text

        return json.loads(text)

    except FuturesTimeoutError:
        logger.warning("%s: timed out after %ds", caller, _TIMEOUT)
        return {"error": "timeout"}
    except genai_errors.ClientError as exc:
        if exc.code == 429:
            logger.warning("%s: quota exhausted", caller)
            return {"error": "quota_exhausted"}
        logger.warning("%s: client error: %s", caller, exc)
        return {"error": "unavailable"}
    except genai_errors.ServerError as exc:
        logger.warning("%s: server error: %s", caller, exc)
        return {"error": "unavailable"}
    except json.JSONDecodeError as exc:
        logger.warning("%s: JSON parse error: %s", caller, exc)
        return {"error": "parse_error"}
    except Exception as exc:
        logger.warning("%s: unexpected error: %s", caller, exc)
        return {"error": "unavailable"}
