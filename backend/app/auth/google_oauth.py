"""
auth/google_oauth.py
────────────────────
Google OAuth 2.0 helper for Google Calendar + Tasks integration.
"""

from __future__ import annotations

import json
import logging
import os
from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from google.oauth2.credentials import Credentials

logger = logging.getLogger(__name__)

# ── Config ─────────────────────────────────────────────────────────────────────

CREDENTIALS_FILE: Path = Path(os.getenv("GOOGLE_CREDENTIALS_FILE", "credentials.json"))
TOKEN_FILE: Path        = Path(os.getenv("GOOGLE_TOKEN_FILE", "token.json"))

# Both Calendar and Tasks scopes
SCOPES = [
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/tasks",
]

REDIRECT_URI: str = os.getenv(
    "GOOGLE_OAUTH_REDIRECT_URI",
    "http://localhost:8000/auth/google/callback",
)


# ── Public helpers ─────────────────────────────────────────────────────────────

def credentials_file_exists() -> bool:
    return CREDENTIALS_FILE.exists() and CREDENTIALS_FILE.stat().st_size > 0


def _load_client_secrets() -> dict:
    data = json.loads(CREDENTIALS_FILE.read_text())
    return data.get("web") or data.get("installed") or {}


def load_credentials() -> "Credentials | None":
    if not credentials_file_exists():
        logger.debug("credentials.json not found — mock mode active.")
        return None

    if not TOKEN_FILE.exists():
        logger.info("token.json not found — user must authorise at /auth/google.")
        return None

    try:
        from google.oauth2.credentials import Credentials
        from google.auth.transport.requests import Request

        creds = Credentials.from_authorized_user_file(str(TOKEN_FILE), SCOPES)

        if creds.valid:
            return creds

        if creds.expired and creds.refresh_token:
            logger.info("OAuth token expired — refreshing.")
            creds.refresh(Request())
            _save_token(creds)
            return creds

        logger.warning("Token invalid and unrefreshable — deleting token.json.")
        TOKEN_FILE.unlink(missing_ok=True)
        return None

    except Exception as exc:
        logger.error("Failed to load/refresh credentials: %s", exc)
        TOKEN_FILE.unlink(missing_ok=True)
        return None


def get_authorization_url() -> str:
    if not credentials_file_exists():
        raise RuntimeError(
            f"credentials.json not found at {CREDENTIALS_FILE.resolve()}."
        )

    secrets   = _load_client_secrets()
    client_id = secrets["client_id"]
    auth_uri  = secrets.get("auth_uri", "https://accounts.google.com/o/oauth2/auth")
    scope     = " ".join(SCOPES)

    import urllib.parse
    params = {
        "client_id":     client_id,
        "redirect_uri":  REDIRECT_URI,
        "response_type": "code",
        "scope":         scope,
        "access_type":   "offline",
        "prompt":        "consent",
    }
    return f"{auth_uri}?{urllib.parse.urlencode(params)}"


def exchange_code(code: str) -> dict:
    secrets       = _load_client_secrets()
    client_id     = secrets["client_id"]
    client_secret = secrets["client_secret"]
    token_uri     = secrets.get("token_uri", "https://oauth2.googleapis.com/token")

    import httpx
    response = httpx.post(
        token_uri,
        data={
            "code":          code,
            "client_id":     client_id,
            "client_secret": client_secret,
            "redirect_uri":  REDIRECT_URI,
            "grant_type":    "authorization_code",
        },
        timeout=10,
    )
    response.raise_for_status()
    token_data = response.json()

    if "error" in token_data:
        raise RuntimeError(f"Token exchange error: {token_data}")

    saved = {
        "token":         token_data.get("access_token"),
        "refresh_token": token_data.get("refresh_token"),
        "token_uri":     token_uri,
        "client_id":     client_id,
        "client_secret": client_secret,
        "scopes":        SCOPES,
    }
    TOKEN_FILE.write_text(json.dumps(saved, indent=2))
    logger.info("OAuth tokens saved to %s.", TOKEN_FILE)
    return saved


def get_calendar_service():
    creds = load_credentials()
    if creds is None:
        return None
    try:
        from googleapiclient.discovery import build
        return build("calendar", "v3", credentials=creds, cache_discovery=False)
    except Exception as exc:
        logger.error("Failed to build Calendar service: %s", exc)
        return None


def get_tasks_service():
    creds = load_credentials()
    if creds is None:
        return None
    try:
        from googleapiclient.discovery import build
        return build("tasks", "v1", credentials=creds, cache_discovery=False)
    except Exception as exc:
        logger.error("Failed to build Tasks service: %s", exc)
        return None


def revoke_token() -> None:
    try:
        import httpx
        creds = load_credentials()
        if creds and creds.token:
            httpx.post(
                "https://oauth2.googleapis.com/revoke",
                params={"token": creds.token},
                timeout=5,
            )
    except Exception as exc:
        logger.warning("Could not revoke token remotely: %s", exc)

    TOKEN_FILE.unlink(missing_ok=True)
    logger.info("token.json deleted.")


def _save_token(creds: "Credentials") -> None:
    token_data = {
        "token":         creds.token,
        "refresh_token": creds.refresh_token,
        "token_uri":     creds.token_uri,
        "client_id":     creds.client_id,
        "client_secret": creds.client_secret,
        "scopes":        list(creds.scopes or SCOPES),
    }
    TOKEN_FILE.write_text(json.dumps(token_data, indent=2))