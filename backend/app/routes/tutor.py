from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.database import db
from app.services.ai_service import ai_service

router = APIRouter(prefix="/api/tutor", tags=["AI Tutor"])

class TutorQuestionRequest(BaseModel):
    question: str = Field(..., min_length=2, max_length=1500)
    lesson_id: Optional[int] = None
    language: str = "en"

@router.post("/ask")
async def ask_tutor(payload: TutorQuestionRequest):
    """
    Submits a question to the AI Tutor.
    If lesson_id is provided, grounds the answer in the lesson context.
    Persists question and response to SQLite learning history.
    """
    context_text = None
    if payload.lesson_id:
        lesson = db.get_lesson_by_id(payload.lesson_id)
        if lesson:
            context_text = lesson.get("extracted_text")

    # Fetch recent conversation history
    history = db.get_chat_history(lesson_id=payload.lesson_id, limit=6)

    # Save student question
    db.save_chat_message(
        lesson_id=payload.lesson_id,
        role="user",
        message=payload.question,
        language=payload.language
    )

    # Ask AI Service
    ai_result = await ai_service.ask_tutor(
        question=payload.question,
        context_text=context_text,
        chat_history=history,
        language=payload.language
    )

    # Save tutor response
    db.save_chat_message(
        lesson_id=payload.lesson_id,
        role="assistant",
        message=ai_result["answer"],
        language=ai_result["language"]
    )

    return {
        "answer": ai_result["answer"],
        "language": ai_result["language"],
        "is_mock": ai_result["is_mock"],
        "lesson_id": payload.lesson_id
    }

@router.get("/history")
def get_chat_history(
    lesson_id: Optional[int] = None,
    limit: int = 40
):
    """Retrieves conversation history between user and AI Tutor."""
    actual_lesson_id = int(lesson_id) if lesson_id is not None and not hasattr(lesson_id, 'default') else None
    actual_limit = int(limit) if not hasattr(limit, 'default') else 40
    return db.get_chat_history(lesson_id=actual_lesson_id, limit=actual_limit)

@router.delete("/history")
def clear_chat_history(lesson_id: Optional[int] = Query(None)):
    """Clears conversation history."""
    db.clear_chat_history(lesson_id=lesson_id)
    return {"message": "Chat history cleared successfully."}

