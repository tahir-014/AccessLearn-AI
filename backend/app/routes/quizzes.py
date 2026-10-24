from typing import Any, List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.database import db
from app.services.ai_service import ai_service

router = APIRouter(prefix="/api/quizzes", tags=["Quizzes"])

class GenerateQuizRequest(BaseModel):
    lesson_id: int
    num_questions: int = Field(default=4, ge=1, le=10)
    language: str = "en"

class SubmitQuizRequest(BaseModel):
    answers: List[int] = Field(..., description="List of chosen option indices matching questions")

@router.post("/generate")
async def generate_quiz(payload: GenerateQuizRequest):
    """
    Generates an accessible multiple-choice quiz from the selected lesson.
    Saves the generated quiz in SQLite.
    """
    lesson = db.get_lesson_by_id(payload.lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found.")

    text = lesson.get("extracted_text") or ""
    if not text.strip():
        raise HTTPException(status_code=400, detail="Lesson has no readable text to generate a quiz from.")

    result = await ai_service.generate_quiz(
        text=text,
        num_questions=payload.num_questions,
        language=payload.language
    )

    lang_title = "తెలుగు క్విజ్" if payload.language.lower().startswith("te") else "Quiz"
    quiz_title = f"{lesson.get('title', 'Lesson')} - {lang_title}"

    quiz_id = db.save_quiz(
        lesson_id=payload.lesson_id,
        title=quiz_title,
        language=result["language"],
        questions=result["questions"]
    )

    created_quiz = db.get_quiz_by_id(quiz_id)
    return {
        "message": "Quiz generated successfully.",
        "quiz": created_quiz,
        "is_mock": result["is_mock"]
    }

@router.get("/lesson/{lesson_id}")
def get_quizzes_for_lesson(lesson_id: int):
    """Retrieves all quizzes generated for a specific lesson."""
    return db.get_quizzes_by_lesson(lesson_id)

@router.get("/attempts")
def get_quiz_attempts(
    quiz_id: Optional[int] = None,
    limit: int = 20
):
    """Retrieves recent quiz scoring history and attempts."""
    actual_quiz_id = int(quiz_id) if quiz_id is not None and not hasattr(quiz_id, 'default') else None
    actual_limit = int(limit) if not hasattr(limit, 'default') else 20
    return db.get_quiz_attempts(quiz_id=actual_quiz_id, limit=actual_limit)

@router.get("/{quiz_id}")
def get_quiz(quiz_id: int):
    """Retrieves a single quiz by ID."""
    quiz = db.get_quiz_by_id(quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found.")
    return quiz

@router.post("/{quiz_id}/submit")
def submit_quiz_attempt(quiz_id: int, payload: SubmitQuizRequest):
    """
    Evaluates user answers against correct answer indices,
    computes score, saves the attempt in SQLite, and returns detailed results.
    """
    quiz = db.get_quiz_by_id(quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found.")

    questions = quiz.get("questions") or []
    total = len(questions)
    
    if len(payload.answers) != total:
        raise HTTPException(
            status_code=400,
            detail=f"Expected {total} answers, but received {len(payload.answers)}."
        )

    score = 0
    feedback = []

    for idx, q in enumerate(questions):
        user_choice = payload.answers[idx]
        correct_choice = q.get("correct_index", 0)
        is_correct = (user_choice == correct_choice)
        if is_correct:
            score += 1

        feedback.append({
            "question_index": idx,
            "question": q.get("question"),
            "options": q.get("options", []),
            "selected_index": user_choice,
            "correct_index": correct_choice,
            "is_correct": is_correct,
            "explanation": q.get("explanation", "")
        })

    # Record attempt in DB
    attempt_id = db.save_quiz_attempt(
        quiz_id=quiz_id,
        score=score,
        total_questions=total,
        answers=payload.answers
    )

    percent = round((score / total) * 100, 1) if total > 0 else 0.0

    return {
        "attempt_id": attempt_id,
        "quiz_id": quiz_id,
        "score": score,
        "total_questions": total,
        "percentage": percent,
        "passed": percent >= 60.0,
        "feedback": feedback
    }
