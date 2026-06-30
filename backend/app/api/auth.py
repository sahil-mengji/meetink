"""
Auth API routes for Google OAuth 2.0 flow.
Handles /auth/google (redirect to Google) and /auth/google/callback (token exchange).
"""

import logging
from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse

from app.auth.google_oauth import (
    credentials_file_exists,
    get_authorization_url,
    exchange_code,
    load_credentials,
    revoke_token,
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/google")
def google_auth_start():
    """Redirect user to Google's OAuth consent screen."""
    logger.info("API Request: GET /auth/google — initiating OAuth flow")
    if not credentials_file_exists():
        raise HTTPException(
            status_code=500,
            detail="credentials.json not found. Place it in the backend directory.",
        )

    try:
        url = get_authorization_url()
        return RedirectResponse(url=url)
    except Exception as exc:
        logger.error("Failed to build OAuth URL: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/google/callback")
def google_auth_callback(code: str = "", error: str = ""):
    """Handle the OAuth callback from Google, exchange code for tokens."""
    logger.info("API Request: GET /auth/google/callback")

    if error:
        logger.error("OAuth error from Google: %s", error)
        raise HTTPException(status_code=400, detail=f"Google OAuth error: {error}")

    if not code:
        raise HTTPException(status_code=400, detail="Missing authorization code")

    try:
        token_data = exchange_code(code)
        logger.info("OAuth tokens saved successfully.")
        # Redirect to frontend with success indicator
        return RedirectResponse(url="http://localhost:5173/app?oauth=success")
    except Exception as exc:
        logger.error("Token exchange failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/google/status")
def google_auth_status():
    """Check whether Google OAuth is configured and authorized."""
    has_creds = credentials_file_exists()
    creds = load_credentials() if has_creds else None
    return {
        "credentials_file": has_creds,
        "authorized": creds is not None and creds.valid if creds else False,
        "auth_url": "/auth/google" if has_creds else None,
    }


@router.post("/google/revoke")
def google_auth_revoke():
    """Revoke the stored Google OAuth token."""
    logger.info("API Request: POST /auth/google/revoke")
    try:
        revoke_token()
        return {"status": "revoked"}
    except Exception as exc:
        logger.error("Failed to revoke token: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc)) from exc
