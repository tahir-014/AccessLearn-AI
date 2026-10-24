import pytest
from app.services.ai_service import ai_service

@pytest.fixture(autouse=True)
def force_demo_mode():
    """Ensure tests run deterministically in demo mode without external network delays."""
    original = ai_service.is_demo
    ai_service.is_demo = True
    yield
    ai_service.is_demo = original

@pytest.mark.asyncio
async def test_simplify_lesson_english():
    sample_text = "Photosynthesis is the process by which green plants transform light energy into chemical energy."
    result = await ai_service.simplify_lesson(sample_text, language="en", level="standard")
    
    assert "simplified_text" in result
    assert result["language"] == "en"
    assert len(result["simplified_text"]) > 20

@pytest.mark.asyncio
async def test_simplify_lesson_telugu():
    sample_text = "Gravitational force pulls objects toward the center of the Earth."
    result = await ai_service.simplify_lesson(sample_text, language="te", level="simple")
    
    assert "simplified_text" in result
    assert result["language"] == "te"
    assert len(result["simplified_text"]) > 20

@pytest.mark.asyncio
async def test_ask_tutor_response():
    question = "What is gravity?"
    context = "Gravity is a universal force of attraction acting between all matter."
    result = await ai_service.ask_tutor(question, context_text=context, language="en")
    
    assert "answer" in result
    assert result["language"] == "en"
    assert len(result["answer"]) > 10

@pytest.mark.asyncio
async def test_generate_quiz_structure():
    text = "Computers process data using the central processing unit (CPU). Memory (RAM) holds temporary runtime instructions."
    result = await ai_service.generate_quiz(text, num_questions=3, language="en")
    
    assert "questions" in result
    questions = result["questions"]
    assert len(questions) > 0
    q1 = questions[0]
    assert "question" in q1
    assert "options" in q1
    assert len(q1["options"]) >= 2
    assert "correct_index" in q1
    assert "explanation" in q1

