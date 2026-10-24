import pytest
from app.database import db
from app.main import health_check
from app.routes import lessons, tutor, quizzes
from app.routes.tutor import TutorQuestionRequest
from app.routes.quizzes import GenerateQuizRequest, SubmitQuizRequest
from app.services.ai_service import ai_service

@pytest.fixture(scope="module", autouse=True)
def setup_database():
    """Ensure database tables are initialized and demo mode is forced for tests."""
    db.init_db()
    original_demo = ai_service.is_demo
    ai_service.is_demo = True
    yield
    ai_service.is_demo = original_demo

def test_health_endpoint():
    data = health_check()
    assert data["status"] == "healthy"
    assert "AccessLearn" in data["app"]
    assert "en" in data["languages_supported"]
    assert "te" in data["languages_supported"]

def test_dashboard_stats():
    stats = lessons.get_stats()
    assert "total_lessons" in stats
    assert "total_quizzes" in stats
    assert "total_attempts" in stats
    assert "average_score_percent" in stats
    assert "questions_asked" in stats

def test_list_lessons_empty_or_items():
    res = lessons.list_lessons(limit=10, offset=0)
    assert isinstance(res, list)

@pytest.mark.asyncio
async def test_tutor_conversation_flow():
    req = TutorQuestionRequest(
        question="How does photosynthesis help plants grow?",
        language="en"
    )
    ans = await tutor.ask_tutor(req)
    assert "answer" in ans
    assert ans["language"] == "en"
    assert len(ans["answer"]) > 5

    history = tutor.get_chat_history(limit=10)
    assert len(history) >= 2  # user message and tutor reply
    assert any(m["role"] == "user" for m in history)
    assert any(m["role"] == "assistant" for m in history)

@pytest.mark.asyncio
async def test_quiz_flow():
    # Insert a synthetic lesson
    lesson_id = db.insert_lesson(
        title="Intro to Biology",
        filename="bio.pdf",
        file_path="uploads/test_bio.pdf",
        file_size=1024,
        page_count=2,
        extracted_text="Cells are the basic unit of life. DNA carries genetic instructions in all organisms."
    )

    # Generate quiz
    gen_req = GenerateQuizRequest(
        lesson_id=lesson_id,
        num_questions=2,
        language="en"
    )
    quiz_res = await quizzes.generate_quiz(gen_req)
    quiz_obj = quiz_res["quiz"]
    quiz_id = quiz_obj["id"]
    assert len(quiz_obj["questions"]) == 2

    # Fetch quiz by id
    fetched = quizzes.get_quiz(quiz_id)
    assert fetched["id"] == quiz_id

    # Submit quiz answers
    sub_req = SubmitQuizRequest(answers=[0, 0])
    result = quizzes.submit_quiz_attempt(quiz_id, sub_req)
    assert "score" in result
    assert result["total_questions"] == 2
    assert "feedback" in result
    assert len(result["feedback"]) == 2

    # Verify attempt recorded
    attempts = quizzes.get_quiz_attempts(quiz_id=quiz_id)
    assert len(attempts) >= 1
    assert attempts[0]["quiz_id"] == quiz_id
