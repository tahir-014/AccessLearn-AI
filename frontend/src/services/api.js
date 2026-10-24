// AccessLearn AI API Client

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

async function handleResponse(response) {
  if (!response.ok) {
    let errorDetail = 'An unexpected error occurred.';
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.detail || errorJson.message || JSON.stringify(errorJson);
    } catch {
      errorDetail = response.statusText || `Request failed with code ${response.status}`;
    }
    throw new Error(errorDetail);
  }
  return response.json();
}

export const api = {
  // System Health
  async getHealth() {
    const res = await fetch(`${API_BASE}/api/health`);
    return handleResponse(res);
  },

  // Dashboard Stats
  async getStats() {
    const res = await fetch(`${API_BASE}/api/lessons/stats`);
    return handleResponse(res);
  },

  // Lessons
  async getLessons() {
    const res = await fetch(`${API_BASE}/api/lessons`);
    return handleResponse(res);
  },

  async getLesson(id) {
    const res = await fetch(`${API_BASE}/api/lessons/${id}`);
    return handleResponse(res);
  },

  async uploadLesson(file, title = '') {
    const formData = new FormData();
    formData.append('file', file);
    if (title.trim()) {
      formData.append('title', title.trim());
    }

    const res = await fetch(`${API_BASE}/api/lessons/upload`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse(res);
  },

  async simplifyLesson(id, language = 'en', level = 'standard') {
    const res = await fetch(`${API_BASE}/api/lessons/${id}/simplify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language, level }),
    });
    return handleResponse(res);
  },

  async deleteLesson(id) {
    const res = await fetch(`${API_BASE}/api/lessons/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  // AI Tutor
  async askTutor(question, lessonId = null, language = 'en') {
    const res = await fetch(`${API_BASE}/api/tutor/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, lesson_id: lessonId, language }),
    });
    return handleResponse(res);
  },

  async getTutorHistory(lessonId = null) {
    const url = lessonId 
      ? `${API_BASE}/api/tutor/history?lesson_id=${lessonId}` 
      : `${API_BASE}/api/tutor/history`;
    const res = await fetch(url);
    return handleResponse(res);
  },

  async clearTutorHistory(lessonId = null) {
    const url = lessonId 
      ? `${API_BASE}/api/tutor/history?lesson_id=${lessonId}` 
      : `${API_BASE}/api/tutor/history`;
    const res = await fetch(url, { method: 'DELETE' });
    return handleResponse(res);
  },

  // Quizzes
  async generateQuiz(lessonId, numQuestions = 4, language = 'en') {
    const res = await fetch(`${API_BASE}/api/quizzes/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lesson_id: lessonId, num_questions: numQuestions, language }),
    });
    return handleResponse(res);
  },

  async getQuiz(quizId) {
    const res = await fetch(`${API_BASE}/api/quizzes/${quizId}`);
    return handleResponse(res);
  },

  async getQuizzesForLesson(lessonId) {
    const res = await fetch(`${API_BASE}/api/quizzes/lesson/${lessonId}`);
    return handleResponse(res);
  },

  async submitQuiz(quizId, answers) {
    const res = await fetch(`${API_BASE}/api/quizzes/${quizId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers }),
    });
    return handleResponse(res);
  },

  async getQuizAttempts(quizId = null) {
    const url = quizId 
      ? `${API_BASE}/api/quizzes/attempts?quiz_id=${quizId}` 
      : `${API_BASE}/api/quizzes/attempts`;
    const res = await fetch(url);
    return handleResponse(res);
  },
};
