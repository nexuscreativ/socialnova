"""
SocialNova API - File upload/storage service.

Secure local file storage with:
  * extension allow-listing (`settings.ALLOWED_EXTENSIONS`)
  * size enforcement (`settings.MAX_UPLOAD_SIZE`)
  * filename sanitisation (uuid-prefixed, path-traversal safe)
  * an in-memory metadata registry (no new DB models)
"""
import base64
import logging
import mimetypes
import os
import re
import threading
import time
import uuid
from pathlib import Path
from typing import Dict, Optional
from urllib.parse import quote

from config import settings

logger = logging.getLogger("socialnova.storage")

# ─── In-memory metadata registry ────────────────────────────────────────────

_metadata_lock = threading.Lock()
_UPLOAD_META: Dict[str, dict] = {}


def _ensure_upload_dir() -> Path:
    path = Path(settings.UPLOAD_DIR)
    path.mkdir(parents=True, exist_ok=True)
    return path


def _sanitize_extension(ext: str) -> str:
    """Return a lowercased extension including the dot, or '' if none."""
    ext = (ext or "").lower()
    if not ext.startswith("."):
        ext = f".{ext}"
    return ext if len(ext) <= 10 else ""


def validate_filename(filename: str) -> str:
    """Validate + return the sanitised extension for a filename."""
    raw_ext = Path(filename or "").suffix
    ext = _sanitize_extension(raw_ext)
    allowed = {str(a).lower().lstrip(".") or str(a).lower() for a in settings.ALLOWED_EXTENSIONS}
    allowed_dots = {a if a.startswith(".") else f".{a}" for a in allowed}
    if not ext or ext not in allowed_dots:
        raise ValueError(f"File type '{ext}' is not allowed")
    return ext


def _sanitize_stem(name: str) -> str:
    """Produce a URL-safe stem from an arbitrary name."""
    pure = Path(name or "file").stem
    safe = re_sub(r"[^A-Za-z0-9._-]", "_", pure)
    return (safe or "file")[:80]


def re_sub(pattern, repl, string):
    return re.sub(pattern, repl, string)


def sanitize_filename(original_name: str) -> str:
    """Return a uuid-prefixed safe filename preserving the validated extension."""
    ext = validate_extension(original_name)
    stem = _sanitize_stem(original_name)
    return f"{uuid.uuid4().hex[:12]}-{stem}{ext}"


def validate_extension(original_name: str) -> str:
    """Validate extension and return the lowercased dot-extension."""
    return validate_filename_ext(original_name)


def validate_filename_ext(original_name: str) -> str:
    """Validate filename extension against allowed set. Raises ValueError."""
    ext = _sanitize_extension(Path(original_name or "").suffix)
    allowed = _allowed_ext_set()
    if not ext or ext not in allowed:
        raise ValueError(f"File extension '{ext}' is not allowed")
    return ext


def _allowed_ext_set() -> set:
    return {a if a.startswith(".") else f".{a}" for a in map(str, settings.ALLOWED_EXTENSIONS)}


def check_size(size: int) -> None:
    if size < 0 or size > settings.MAX_UPLOAD_SIZE:
        raise ValueError(
            f"File too large (max {settings.MAX_UPLOAD_SIZE // (1024 * 1024)}MB)"
        )


# ─── Core save API ──────────────────────────────────────────────────────────

def save_upload_bytes(data: bytes, original_name: str, content_type: Optional[str] = None) -> dict:
    """Validate + persist raw bytes. Returns a metadata dict. Never writes to DB."""
    if not data:
        raise ValueError("Empty file")
    check_size(len(data))
    ext = validate_extension(original_name or "file.bin")
    stored_name = sanitize_filename(original_name or f"file{ext}")

    target = _ensure_upload_dir() / stored_name
    target.write_bytes(data)

    meta = {
        "id": uuid.uuid4().hex,
        "filename": stored_name,
        "original_name": os.path.basename(original_name or "upload"),
        "size": len(data),
        "content_type": content_type or mimetypes.guess_type(stored_name)[0] or "application/octet-stream",
        "extension": ext,
        "created_at": time.time(),
    }
    with _metadata_lock:
        _UPLOAD_META[meta["id"]] = meta
        _UPLOAD_META[stored_name] = meta
    return meta


def save_upload(
    data: bytes,
    original_name: str,
    content_type: Optional[str] = None,
) -> dict:
    return save_upload_bytes(data, original_name, content_type)


def save_base64(data_b64: str, original_name: Optional[str] = None, content_type: Optional[str] = None) -> dict:
    """Accept a base64 string (with or without data: URI prefix)."""
    try:
        if data_b64.startswith("data:"):
            header, _, b64 = data_b64.partition(",")
            if content_type is None and ";" in header:
                content_type = header.split(";")[0].removeprefix("data:")
            data_b64 = b64
        data = base64.b64decode(data_b64, validate=False)
    except Exception as exc:
        raise ValueError("Invalid base64 payload") from exc
    name = original_name or _guess_name(content_type)
    return save_upload_bytes(data, name, content_type)


def _guess_name(content_type: Optional[str]) -> str:
    mapping = {
        "image/png": "image.png",
        "image/jpeg": "image.jpg",
        "image/gif": "image.gif",
        "image/webp": "image.webp",
        "application/pdf": "document.pdf",
        "text/plain": "file.txt",
    }
    return mapping.get((content_type or "").lower(), "file.bin")


# ─── Lookup / serving helpers ───────────────────────────────────────────────

def resolve_path(filename: str) -> Path:
    """Resolve a stored filename to a safe absolute path.

    Rejects path traversal by asserting the result stays under UPLOAD_DIR.
    """
    safe_name = Path(filename or "").name
    if not safe_name or safe_name != filename:
        raise ValueError("Invalid filename")
    root = _ensure_upload_dir().resolve()
    candidate = (root / safe_name).resolve()
    if not str(candidate).startswith(str(root)):
        raise ValueError("Path traversal detected")
    return candidate


def file_exists(filename: str) -> bool:
    try:
        return resolve_path(filename).is_file()
    except Exception:
        return False


def get_metadata(upload_id_or_name: str) -> Optional[dict]:
    with _metadata_lock:
        return _UPLOAD_META.get(upload_id_or_name)


def build_public_url(filename: str, request=None) -> str:
    base = settings.API_URL.rstrip("/") if settings.API_URL else ""
    if base and "localhost" not in base and "127.0.0.1" not in base:
        return f"{base}/uploads/{filename}"
    if request is not None:
        base = str(request.base_url).rstrip("/")
        return f"{base}/uploads/{filename}"
    return f"/uploads/{filename}"


def rebuild_upload_registry() -> int:
    """Rescan UPLOAD_DIR on boot and repopulate the in-memory metadata registry.

    The registry lives in memory only, so after a restart (e.g. a new Fly
    instance) previously uploaded files would still be servable by path but
    would lose their metadata. Re-scanning restores per-filename metadata.
    Returns the number of files registered.
    """
    directory = _ensure_upload_dir()
    count = 0
    try:
        with _metadata_lock:
            for name in os.listdir(directory):
                if name.startswith(".") or name in _UPLOAD_META:
                    continue
                full = directory / name
                try:
                    stat = full.stat()
                except OSError:
                    continue
                if not full.is_file():
                    continue
                meta = {
                    "id": name,
                    "filename": name,
                    "original_name": name,
                    "size": stat.st_size,
                    "content_type": mimetypes.guess_type(name)[0] or "application/octet-stream",
                    "extension": Path(name).suffix,
                    "created_at": stat.st_mtime,
                }
                _UPLOAD_META[name] = meta
                count += 1
    except OSError as exc:
        logger.warning("storage.registry_rebuild_failed", extra={"error": str(exc)})
    return count