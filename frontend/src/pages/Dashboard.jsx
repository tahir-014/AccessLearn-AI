import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  HelpCircle, 
  Bot, 
  Award, 
  FileUp, 
  ArrowRight, 
  Trash2, 
  Calendar,
  AlertCircle,
  Sparkles,
  FileText
} from 'lucide-react';
import { api } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [statsData, lessonsData, attemptsData] = await Promise.all([
        api.getStats(),
        api.getLessons(),
        api.getQuizAttempts()
      ]);
      setStats(statsData);
      setLessons(lessonsData);
      setAttempts(attemptsData);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleDeleteLesson = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }
    setDeletingId(id);
    try {
      await api.deleteLesson(id);
      setLessons(prev => prev.filter(l => l.id !== id));
      // Refresh stats
      const newStats = await api.getStats();
      setStats(newStats);
    } catch (err) {
      alert(`Error deleting lesson: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <LoadingSpinner message="Loading your learning dashboard..." size="lg" />
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.25rem' }}>Learning Dashboard</h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
            Track your study materials, practice quizzes, and comprehension progress.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/learn" className="btn btn-primary btn-sm">
            <FileUp size={16} aria-hidden="true" />
            Upload PDF
          </Link>
          <Link to="/tutor" className="btn btn-secondary btn-sm">
            <Bot size={16} aria-hidden="true" />
            Ask Tutor
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          <AlertCircle size={20} aria-hidden="true" />
          <div>{error}</div>
        </div>
      )}

      {/* Metrics Overview Cards */}
      <section aria-labelledby="stats-heading" style={{ marginBottom: '2.5rem' }}>
        <h2 id="stats-heading" className="sr-only">Learning Metrics</h2>
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}
        >
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', backgroundColor: '#e0e7ff', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={24} />
            </div>
            <div>
              <span style={{ fontSize: '1.75rem', fontWeight: 800, display: 'block', lineHeight: 1.1 }}>
                {stats?.total_lessons || 0}
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Uploaded Lessons
              </span>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', backgroundColor: '#d1fae5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HelpCircle size={24} />
            </div>
            <div>
              <span style={{ fontSize: '1.75rem', fontWeight: 800, display: 'block', lineHeight: 1.1 }}>
                {stats?.total_quizzes || 0}
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Quizzes Generated
              </span>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', backgroundColor: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award size={24} />
            </div>
            <div>
              <span style={{ fontSize: '1.75rem', fontWeight: 800, display: 'block', lineHeight: 1.1 }}>
                {stats?.average_score_percent ? `${stats.average_score_percent}%` : '0%'}
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Avg Quiz Score ({stats?.total_attempts || 0} attempts)
              </span>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', backgroundColor: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={24} />
            </div>
            <div>
              <span style={{ fontSize: '1.75rem', fontWeight: 800, display: 'block', lineHeight: 1.1 }}>
                {stats?.questions_asked || 0}
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Tutor Questions Asked
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid: Recent Lessons and Quiz Attempts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.75rem' }}>
        {/* Recent Lessons List */}
        <section aria-labelledby="lessons-section-heading">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 id="lessons-section-heading" style={{ fontSize: '1.25rem', margin: 0 }}>
              Study Materials ({lessons.length})
            </h2>
            <Link to="/learn" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
              Manage All &rarr;
            </Link>
          </div>

          {lessons.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
              <FileText size={40} style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }} />
              <h3 style={{ fontSize: '1.1rem' }}>No learning materials uploaded yet</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                Upload your first PDF textbook chapter, notes, or article to begin.
              </p>
              <Link to="/learn" className="btn btn-primary btn-sm">
                Upload a PDF
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {lessons.slice(0, 5).map((lesson) => (
                <div 
                  key={lesson.id} 
                  className="card" 
                  style={{ 
                    padding: '1rem 1.25rem',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    gap: '1rem' 
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <Link to={`/learn?id=${lesson.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        {lesson.title}
                      </Link>
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>{lesson.page_count} page(s)</span>
                      <span>&bull;</span>
                      <span>{(lesson.file_size / 1024).toFixed(0)} KB</span>
                      {lesson.has_simplified_te ? (
                        <span className="badge badge-emerald">తెలుగు ready</span>
                      ) : null}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Link 
                      to={`/learn?id=${lesson.id}`} 
                      className="btn btn-secondary btn-sm" 
                      title="Study and listen to this lesson"
                    >
                      Study
                    </Link>
                    <Link 
                      to={`/quiz?lessonId=${lesson.id}`} 
                      className="btn btn-secondary btn-sm" 
                      title="Generate a quiz from this lesson"
                    >
                      Quiz
                    </Link>
                    <button
                      onClick={() => handleDeleteLesson(lesson.id, lesson.title)}
                      disabled={deletingId === lesson.id}
                      className="btn btn-secondary btn-sm"
                      style={{ color: 'var(--accent-rose)' }}
                      title="Delete lesson"
                      aria-label={`Delete ${lesson.title}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent Quiz Attempts */}
        <section aria-labelledby="attempts-section-heading">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 id="attempts-section-heading" style={{ fontSize: '1.25rem', margin: 0 }}>
              Recent Quiz Scores
            </h2>
            <Link to="/quiz" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
              Practice More &rarr;
            </Link>
          </div>

          {attempts.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
              <Award size={40} style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }} />
              <h3 style={{ fontSize: '1.1rem' }}>No quizzes attempted yet</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                Generate a quiz from any uploaded PDF to test your retention.
              </p>
              <Link to="/quiz" className="btn btn-primary btn-sm">
                Generate First Quiz
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {attempts.slice(0, 5).map((att) => {
                const percent = Math.round((att.score / att.total_questions) * 100);
                const isPassed = percent >= 60;
                return (
                  <div 
                    key={att.id} 
                    className="card" 
                    style={{ 
                      padding: '1rem 1.25rem',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      gap: '1rem' 
                    }}
                  >
                    <div>
                      <h3 style={{ fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                        {att.quiz_title || 'Quiz Assessment'}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <Calendar size={13} aria-hidden="true" />
                        <span>{new Date(att.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span 
                        className={`badge ${isPassed ? 'badge-emerald' : 'badge-amber'}`}
                        style={{ fontSize: '0.85rem', fontWeight: 700 }}
                      >
                        {att.score} / {att.total_questions} ({percent}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
