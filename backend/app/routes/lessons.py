import os
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, File, Form, HTTPException, UploadFile, Query
from pydantic import BaseModel
from uuid import uuid4
from app.config import settings
from app.database import db
from app.services.ai_service import ai_service
from app.services.pdf_service import validate_and_extract_pdf

router = APIRouter(prefix="/api/lessons", tags=["Lessons"])

class SimplifyRequest(BaseModel):
    language: str = "en"
    level: str = "standard"

@router.get("/stats", tags=["Dashboard"])
def get_stats():
    """Returns overview learning statistics for dashboard."""
    return db.get_dashboard_stats()

@router.get("")
def list_lessons(limit: int = 50, offset: int = 0):
    """Retrieves list of uploaded lessons."""
    actual_limit = int(limit) if not hasattr(limit, 'default') else 50
    actual_offset = int(offset) if not hasattr(offset, 'default') else 0
    return db.get_lessons(limit=actual_limit, offset=actual_offset)

@router.post("/upload")
async def upload_lesson(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None)
):
    """
    Accepts a PDF file, validates type/size, extracts text,
    and stores the lesson record in SQLite.
    """
    extraction_result = await validate_and_extract_pdf(file)
    
    lesson_title = title.strip() if title and title.strip() else Path(file.filename).stem.replace("_", " ").title()
    
    # Save file safely to uploads directory
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)

    # Use a unique filename; never rely on the original file's disk path.
    original_name = (file.filename or "upload.pdf").replace("\\", "/")
    original_name = Path(original_name).name
    safe_original_name = original_name.replace(" ", "_")
    safe_filename = f"{uuid4().hex}_{safe_original_name}"

    saved_file_path = upload_dir / safe_filename

    with open(saved_file_path, "wb") as f:
        f.write(extraction_result["file_bytes"])

    saved_file_path = str(saved_file_path)
    lesson_id = db.insert_lesson(
        title=lesson_title,
        filename=file.filename,
        file_path=saved_file_path,
        file_size=extraction_result["file_size"],
        page_count=extraction_result["page_count"],
        extracted_text=extraction_result["text"]
    )

    created_lesson = db.get_lesson_by_id(lesson_id)
    return {
        "message": "Lesson material uploaded and processed successfully.",
        "lesson": created_lesson,
        "is_scanned": extraction_result["is_scanned"]
    }

@router.get("/{lesson_id}")
def get_lesson(lesson_id: int):
    """Gets details and extracted text of a single lesson."""
    lesson = db.get_lesson_by_id(lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found.")
    return lesson

@router.post("/{lesson_id}/simplify")
async def simplify_lesson(lesson_id: int, request: SimplifyRequest):
    """
    Generates simplified accessible explanation of the lesson material.
    Supports English ('en') and Telugu ('te').
    """
    lesson = db.get_lesson_by_id(lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found.")

    text = lesson.get("extracted_text") or ""
    if not text.strip():
        raise HTTPException(status_code=400, detail="This lesson contains no extracted text to simplify.")

    result = await ai_service.simplify_lesson(
        text=text,
        language=request.language,
        level=request.level
    )

    # Cache simplification in database
    db.update_lesson_simplification(lesson_id, request.language, result["simplified_text"])

    return {
        "lesson_id": lesson_id,
        "language": result["language"],
        "simplified_text": result["simplified_text"],
        "is_mock": result["is_mock"]
    }

@router.delete("/{lesson_id}")
def delete_lesson(lesson_id: int):
    """Deletes a lesson and removes its physical file from storage."""
    lesson = db.get_lesson_by_id(lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found.")

    file_path = lesson.get("file_path")
    if file_path and os.path.exists(file_path):
        try:
            os.remove(file_path)
        except Exception:
            pass

    deleted = db.delete_lesson(lesson_id)
    return {"message": "Lesson deleted successfully.", "deleted": deleted}
