import json
import sqlite3
from contextlib import contextmanager
from datetime import datetime
from typing import Any, Dict, List, Optional
from app.config import settings

def get_db_connection() -> sqlite3.Connection:
    """Creates a connection to SQLite with row dictionary factory."""
    conn = sqlite3.connect(settings.DATABASE_PATH, timeout=15.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

@contextmanager
def db_session():
    """Context manager for safe transactional database operations."""
    conn = get_db_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_db():
    """Initializes SQLite database tables and indices."""
    with db_session() as conn:
        cursor = conn.cursor()
        
        # Table: Lessons (Uploaded materials and extracted text)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS lessons (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                filename TEXT NOT NULL,
                file_path TEXT NOT NULL,
                file_size INTEGER NOT NULL,
                page_count INTEGER NOT NULL DEFAULT 1,
                extracted_text TEXT NOT NULL,
                simplified_en TEXT,
                simplified_te TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Table: Tutor Chats (History of AI tutor conversation)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tutor_chats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                lesson_id INTEGER,
                role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
                message TEXT NOT NULL,
                language TEXT NOT NULL DEFAULT 'en',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
            )
        """)

        # Table: Quizzes (Generated multiple-choice questions)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS quizzes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                lesson_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                language TEXT NOT NULL DEFAULT 'en',
                questions_json TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
            )
        """)

        # Table: Quiz Attempts (User scores and history)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS quiz_attempts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                quiz_id INTEGER NOT NULL,
                score INTEGER NOT NULL,
                total_questions INTEGER NOT NULL,
                answers_json TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
            )
        """)

        # Indices for optimal query performance
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_lessons_created ON lessons(created_at DESC)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_tutor_lesson ON tutor_chats(lesson_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_quizzes_lesson ON quizzes(lesson_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_attempts_quiz ON quiz_attempts(quiz_id)")

# Database helper functions

def insert_lesson(title: str, filename: str, file_path: str, file_size: int, page_count: int, extracted_text: str) -> int:
    with db_session() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO lessons (title, filename, file_path, file_size, page_count, extracted_text)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (title, filename, file_path, file_size, page_count, extracted_text))
        return cursor.lastrowid

def get_lessons(limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
    with db_session() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, title, filename, file_size, page_count, 
                   LENGTH(extracted_text) as text_length,
                   (simplified_en IS NOT NULL) as has_simplified_en,
                   (simplified_te IS NOT NULL) as has_simplified_te,
                   created_at
            FROM lessons
            ORDER BY id DESC
            LIMIT ? OFFSET ?
        """, (limit, offset))
        rows = cursor.fetchall()
        return [dict(row) for row in rows]

def get_lesson_by_id(lesson_id: int) -> Optional[Dict[str, Any]]:
    with db_session() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM lessons WHERE id = ?", (lesson_id,))
        row = cursor.fetchone()
        return dict(row) if row else None

def update_lesson_simplification(lesson_id: int, language: str, simplified_text: str):
    field = "simplified_te" if language.lower().startswith("te") else "simplified_en"
    with db_session() as conn:
        cursor = conn.cursor()
        cursor.execute(f"UPDATE lessons SET {field} = ? WHERE id = ?", (simplified_text, lesson_id))

def delete_lesson(lesson_id: int) -> bool:
    with db_session() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM lessons WHERE id = ?", (lesson_id,))
        return cursor.rowcount > 0

# Tutor Chat helpers
def save_chat_message(lesson_id: Optional[int], role: str, message: str, language: str = "en") -> int:
    with db_session() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO tutor_chats (lesson_id, role, message, language)
            VALUES (?, ?, ?, ?)
        """, (lesson_id, role, message, language))
        return cursor.lastrowid

def get_chat_history(lesson_id: Optional[int] = None, limit: int = 40) -> List[Dict[str, Any]]:
    with db_session() as conn:
        cursor = conn.cursor()
        if lesson_id:
            cursor.execute("""
                SELECT * FROM tutor_chats 
                WHERE lesson_id = ? 
                ORDER BY id ASC 
                LIMIT ?
            """, (lesson_id, limit))
        else:
            cursor.execute("""
                SELECT * FROM tutor_chats 
                ORDER BY id ASC 
                LIMIT ?
            """, (limit,))
        return [dict(row) for row in cursor.fetchall()]

def clear_chat_history(lesson_id: Optional[int] = None):
    with db_session() as conn:
        cursor = conn.cursor()
        if lesson_id:
            cursor.execute("DELETE FROM tutor_chats WHERE lesson_id = ?", (lesson_id,))
        else:
            cursor.execute("DELETE FROM tutor_chats")

# Quiz helpers
def save_quiz(lesson_id: int, title: str, language: str, questions: List[Dict[str, Any]]) -> int:
    with db_session() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO quizzes (lesson_id, title, language, questions_json)
            VALUES (?, ?, ?, ?)
        """, (lesson_id, title, language, json.dumps(questions, ensure_ascii=False)))
        return cursor.lastrowid

def get_quizzes_by_lesson(lesson_id: int) -> List[Dict[str, Any]]:
    with db_session() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT q.id, q.lesson_id, q.title, q.language, q.questions_json, q.created_at,
                   (SELECT COUNT(*) FROM quiz_attempts a WHERE a.quiz_id = q.id) as attempts_count,
                   (SELECT MAX(score) FROM quiz_attempts a WHERE a.quiz_id = q.id) as best_score
            FROM quizzes q
            WHERE q.lesson_id = ?
            ORDER BY q.id DESC
        """, (lesson_id,))
        rows = cursor.fetchall()
        results = []
        for r in rows:
            d = dict(r)
            d["questions"] = json.loads(d.pop("questions_json"))
            results.append(d)
        return results

def get_quiz_by_id(quiz_id: int) -> Optional[Dict[str, Any]]:
    with db_session() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM quizzes WHERE id = ?", (quiz_id,))
        row = cursor.fetchone()
        if not row:
            return None
        d = dict(row)
        d["questions"] = json.loads(d.pop("questions_json"))
        return d

def save_quiz_attempt(quiz_id: int, score: int, total_questions: int, answers: List[Any]) -> int:
    with db_session() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO quiz_attempts (quiz_id, score, total_questions, answers_json)
            VALUES (?, ?, ?, ?)
        """, (quiz_id, score, total_questions, json.dumps(answers)))
        return cursor.lastrowid

def get_quiz_attempts(quiz_id: Optional[int] = None, limit: int = 20) -> List[Dict[str, Any]]:
    with db_session() as conn:
        cursor = conn.cursor()
        if quiz_id:
            cursor.execute("""
                SELECT a.*, q.title as quiz_title, q.lesson_id
                FROM quiz_attempts a
                JOIN quizzes q ON a.quiz_id = q.id
                WHERE a.quiz_id = ?
                ORDER BY a.id DESC LIMIT ?
            """, (quiz_id, limit))
        else:
            cursor.execute("""
                SELECT a.*, q.title as quiz_title, q.lesson_id
                FROM quiz_attempts a
                JOIN quizzes q ON a.quiz_id = q.id
                ORDER BY a.id DESC LIMIT ?
            """, (limit,))
        rows = cursor.fetchall()
        results = []
        for r in rows:
            d = dict(r)
            d["answers"] = json.loads(d.pop("answers_json"))
            results.append(d)
        return results

def get_dashboard_stats() -> Dict[str, Any]:
    """Aggregates learning stats for the dashboard overview."""
    with db_session() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM lessons")
        total_lessons = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM quizzes")
        total_quizzes = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*), AVG(score * 100.0 / total_questions) FROM quiz_attempts")
        attempts_row = cursor.fetchone()
        total_attempts = attempts_row[0] or 0
        avg_score = round(attempts_row[1] or 0.0, 1)

        cursor.execute("SELECT COUNT(*) FROM tutor_chats WHERE role = 'user'")
        questions_asked = cursor.fetchone()[0]

        return {
            "total_lessons": total_lessons,
            "total_quizzes": total_quizzes,
            "total_attempts": total_attempts,
            "average_score_percent": avg_score,
            "questions_asked": questions_asked
        }
