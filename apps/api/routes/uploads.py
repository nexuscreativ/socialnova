"""
Upload routes: secure file upload with extension/size validation.
"""
import logging
import mimetypes
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, status
from fastapi.responses import FileResponse, JSONResponse

from deps import get_current_user
from models import User
from config import settings
from services.storage import (
    build_public_url,
    delete_upload,
    file_exists,
    list_uploads_meta,
    resolve_path,
    save_base64,
    save_upload,
)

router = APIRouter(prefix="/uploads", tags=["Uploads"])

logger = logging.getLogger("socialnova.uploads")


async def _read_capped(file: UploadFile) -> bytes:
    """Read the body up to MAX_UPLOAD_SIZE+1 to bound memory usage."""
    data = await file.read(settings.MAX_UPLOAD_SIZE + 1)
    if len(data) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds {settings.MAX_UPLOAD_SIZE} bytes limit",
        )
    return data


async def _persist(data: bytes, original_name: str, content_type: Optional[str], request: Request) -> dict:
    try:
        meta = await __import__("asyncio").to_thread(
            save_upload, data, original_name, content_type
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    meta["url"] = build_public_url(meta["filename"], request=request)
    logger.info(
        "upload.created",
        extra={"extra_data": {"filename": meta["filename"], "size": meta["size"]}},
    )
    return meta


@router.get("")
@router.get("/")
async def list_uploads(
    request: Request,
    user: User = Depends(get_current_user),
):
    """List all uploaded media so editors can reuse assets (media library)."""
    items = []
    for m in list_uploads_meta():
        fn = m.get("filename")
        if not fn:
            continue
        items.append(
            {
                "filename": fn,
                "url": build_public_url(fn, request=request),
                "original_name": m.get("original_name", fn),
                "size": m.get("size", 0),
                "content_type": m.get("content_type", ""),
                "created_at": m.get("created_at"),
            }
        )
    return {"items": items}


@router.delete("/{filename}")
async def delete_upload_route(
    filename: str,
    user: User = Depends(get_current_user),
):
    """Delete an uploaded file from the media library."""
    if not filename or "/" in filename or chr(92) in filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid filename")
    removed = delete_upload(filename)
    if not removed:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
    return {"ok": True, "filename": filename}


@router.post("", status_code=status.HTTP_201_CREATED)
async def upload_file(
    request: Request,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
):
    """Upload a single file (multipart/form-data, field name `file`)."""
    data = await _read_capped(file)
    return await _persist(data, file.filename or "upload.bin", file.content_type, request)


@router.post("/media", status_code=status.HTTP_201_CREATED)
async def upload_media(
    request: Request,
    file: Optional[UploadFile] = File(None),
    user: User = Depends(get_current_user),
):
    """Upload via multipart (`file`) OR base64 JSON body.

    JSON body shape: {"data": "<base64>", "filename": "...", "content_type": ""}
    """
    if file is not None:
        data = await _read_capped(file)
        return await _persist(data, file.filename or "upload.bin", file.content_type, request)

    try:
        body = await request.json()
    except Exception:
        body = None

    if not body or not body.get("data"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide a `file` field or a JSON body with a `data` base64 string",
        )

    try:
        meta = await __import__("asyncio").to_thread(
            save_base64,
            body["data"],
            body.get("filename"),
            body.get("content_type"),
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    meta["url"] = build_public_url(meta["filename"], request)
    return JSONResponse(status_code=status.HTTP_201_CREATED, content=meta)


@router.get("/{filename}")
async def get_upload(filename: str):
    """Serve an uploaded file by its (safe, uuid-prefixed) filename."""
    if not filename or "/" in filename or "\\" in filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid filename")

    if not file_exists(filename):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")

    media_type = mimetypes.guess_type(filename)[0] or "application/octet-stream"
    return FileResponse(resolve_unsafe(filename), media_type=media_type)


# Resolve is guarded inside services.storage; do it in a thread to keep the
# event loop free of blocking calls.
def resolve_unsafe(filename: str) -> str:
    from services.storage import resolve_path

    return str(resolve_path(filename))
