import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  HelpCircle, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  Award, 
  RotateCcw, 
  Languages, 
  BookOpen, 
  Calendar,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Quiz() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialLessonId = searchParams.get('lessonId');

  const [lessons, setLessons] = useState([]);
  const [selectedLessonId, setSelectedLessonId] = useState(initialLessonId ? parseInt(initialLessonId, 10) : null);
  const [numQuestions, setNumQuestions] = useState(4);
  const [language, setLanguage] = useState('en'); // 'en' | 'te'

  const [activeQuiz, setActiveQuiz] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attempts, setAttempts] = useState([]);
  const [viewMode, setViewMode] = useState('quiz'); // 'quiz' | 'history'

  useEffect(() => {
    api.getLessons()
      .then((data) => {
        setLessons(data);
        if (data.length > 0 && !selectedLessonId) {
          setSelectedLessonId(data[0].id);
        }
      })
      .catch((err) => console.error('Failed to load lessons:', err));

    loadAttempts();
  }, []);

  const loadAttempts = async () => {
    try {
      const data = await api.getQuizAttempts();
      setAttempts(data);
    } catch (err) {
      console.error('Failed to load attempts:', err);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!selectedLessonId) {
      alert('Please select a lesson first.');
      return;
    }

    setIsGenerating(true);
    setQuizResult(null);
    setUserAnswers({});

    try {
      const res = await api.generateQuiz(selectedLessonId, numQuestions, language);
      setActiveQuiz(res.quiz);
      setViewMode('quiz');
    } catch (err) {
      alert(`Error generating quiz: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectOption = (qIndex, optionIndex) => {
    if (quizResult) return; // Prevent changing after submission
    setUserAnswers(prev => ({
      ...prev,
      [qIndex]: optionIndex
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;
    const questions = activeQuiz.questions || [];
    
    // Check all answered
    if (Object.keys(userAnswers).length < questions.length) {
      if (!window.confirm('You have not answered all questions. Submit anyway?')) {
        return;
      }
    }

    // Prepare array of answer indices (-1 for unanswered)
    const answersArray = questions.map((_, idx) => 
      userAnswers[idx] !== undefined ? userAnswers[idx] : -1
    );

    setIsSubmitting(true);
    try {
      const res = await api.submitQuiz(activeQuiz.id, answersArray);
      setQuizResult(res);
      loadAttempts(); // refresh history
    } catch (err) {
      alert(`Error evaluating quiz: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetake = () => {
    setUserAnswers({});
    setQuizResult(null);
  };

  return (
    <div className="page-container" style={{ maxWidth: '900px' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <HelpCircle size={28} style={{ color: 'var(--primary)' }} aria-hidden="true" />
            Interactive Practice Quizzes
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
            Reinforce learning with dynamically generated multiple-choice quizzes in English & Telugu.
          </p>
        </div>

        <div role="tablist" style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            role="tab"
            aria-selected={viewMode === 'quiz'}
            onClick={() => setViewMode('quiz')}
            className={`btn btn-sm ${viewMode === 'quiz' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Quiz Taker
          </button>
          <button
            role="tab"
            aria-selected={viewMode === 'history'}
            onClick={() => setViewMode('history')}
            className={`btn btn-sm ${viewMode === 'history' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Score History ({attempts.length})
          </button>
        </div>
      </div>

      {viewMode === 'quiz' && (
        <>
          {/* Quiz Generator Configuration Panel */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={18} style={{ color: 'var(--primary)' }} />
              Generate Quiz from Learning Material
            </h2>

            {lessons.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                Please upload a study material PDF in the <Link to="/learn">Learn</Link> tab to generate quizzes.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label htmlFor="quiz-lesson-select" className="form-label" style={{ fontSize: '0.85rem' }}>
                    Select Study Material:
                  </label>
                  <select
                    id="quiz-lesson-select"
                    className="form-select"
                    value={selectedLessonId || ''}
                    onChange={(e) => {
                      const id = parseInt(e.target.value, 10);
                      setSelectedLessonId(id);
                      setSearchParams({ lessonId: id });
                    }}
                  >
                    {lessons.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label htmlFor="quiz-lang-select" className="form-label" style={{ fontSize: '0.85rem' }}>
                    Quiz Language:
                  </label>
                  <select
                    id="quiz-lang-select"
                    className="form-select"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    <option value="en">English</option>
                    <option value="te">తెలుగు (Telugu)</option>
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label htmlFor="quiz-count-select" className="form-label" style={{ fontSize: '0.85rem' }}>
                    Number of Questions:
                  </label>
                  <select
                    id="quiz-count-select"
                    className="form-select"
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(parseInt(e.target.value, 10))}
                  >
                    <option value="3">3 Questions</option>
                    <option value="4">4 Questions</option>
                    <option value="5">5 Questions</option>
                  </select>
                </div>

                <button
                  onClick={handleGenerateQuiz}
                  disabled={isGenerating}
                  className="btn btn-primary"
                  style={{ gap: '0.4rem', height: '42px' }}
                >
                  <Sparkles size={16} aria-hidden="true" />
                  {isGenerating ? 'Generating...' : 'Create Quiz'}
                </button>
              </div>
            )}
          </div>

          {/* Active Quiz Card */}
          {isGenerating ? (
            <div className="card" style={{ padding: '3rem 1rem' }}>
              <LoadingSpinner message={`Generating accessible quiz questions in ${language === 'te' ? 'Telugu' : 'English'}...`} />
            </div>
          ) : activeQuiz ? (
            <div>
              {/* Quiz Header */}
              <div 
                className="card" 
                style={{ 
                  marginBottom: '1rem', 
                  backgroundColor: 'var(--bg-muted)', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '1rem 1.25rem' 
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{activeQuiz.title}</h3>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {activeQuiz.questions.length} Questions &bull; Language: {activeQuiz.language === 'te' ? 'తెలుగు' : 'English'}
                  </span>
                </div>
                {quizResult && (
                  <button onClick={handleRetake} className="btn btn-secondary btn-sm" style={{ gap: '0.35rem' }}>
                    <RotateCcw size={14} /> Retake Quiz
                  </button>
                )}
              </div>

              {/* Score Banner when completed */}
              {quizResult && (
                <div 
                  className={`alert ${quizResult.passed ? 'alert-success' : 'alert-warning'}`}
                  role="status"
                  style={{ 
                    padding: '1.25rem', 
                    borderRadius: 'var(--radius-lg)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    marginBottom: '1.5rem' 
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Award size={32} aria-hidden="true" />
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.2rem' }}>
                        Your Score: {quizResult.score} / {quizResult.total_questions} ({quizResult.percentage}%)
                      </h3>
                      <p style={{ margin: 0, fontSize: '0.9rem' }}>
                        {quizResult.passed 
                          ? '🌟 Excellent job! You demonstrated great understanding of this material.' 
                          : '💡 Good practice! Review the explanations below and try once more.'}
                      </p>
                    </div>
                  </div>
                  <span className={`badge ${quizResult.passed ? 'badge-emerald' : 'badge-amber'}`} style={{ fontSize: '0.9rem', padding: '0.4rem 0.8rem' }}>
                    {quizResult.passed ? 'Passed' : 'Needs Review'}
                  </span>
                </div>
              )}

              {/* Question Items List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {activeQuiz.questions.map((q, qIdx) => {
                  const selectedOpt = userAnswers[qIdx];
                  const feedbackItem = quizResult?.feedback?.[qIdx];
                  const isCorrect = feedbackItem?.is_correct;

                  return (
                    <fieldset 
                      key={qIdx} 
                      className="card"
                      style={{
                        borderLeft: quizResult 
                          ? `5px solid ${isCorrect ? 'var(--accent-emerald)' : 'var(--accent-rose)'}`
                          : '1px solid var(--border-color)',
                        padding: '1.25rem 1.5rem',
                      }}
                    >
                      <legend style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                        Question {qIdx + 1}: {q.question}
                      </legend>

                      {/* Options */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {q.options.map((opt, optIdx) => {
                          const isOptionSelected = selectedOpt === optIdx;
                          const isOptionCorrectAnswer = quizResult && optIdx === q.correct_index;

                          let optionBg = 'var(--bg-surface)';
                          let optionBorder = 'var(--border-color)';

                          if (quizResult) {
                            if (isOptionCorrectAnswer) {
                              optionBg = '#dcfce7';
                              optionBorder = 'var(--accent-emerald)';
                            } else if (isOptionSelected && !isCorrect) {
                              optionBg = '#fee2e2';
                              optionBorder = 'var(--accent-rose)';
                            }
                          } else if (isOptionSelected) {
                            optionBg = 'var(--bg-highlight)';
                            optionBorder = 'var(--primary)';
                          }

                          return (
                            <label
                              key={optIdx}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.75rem 1rem',
                                borderRadius: 'var(--radius-md)',
                                border: `1.5px solid ${optionBorder}`,
                                backgroundColor: optionBg,
                                cursor: quizResult ? 'default' : 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              <input
                                type="radio"
                                name={`question-${qIdx}`}
                                checked={isOptionSelected}
                                onChange={() => handleSelectOption(qIdx, optIdx)}
                                disabled={Boolean(quizResult)}
                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                              />
                              <span style={{ fontSize: '0.98rem', flex: 1, color: 'var(--text-primary)' }}>
                                {opt}
                              </span>
                              {quizResult && isOptionCorrectAnswer && (
                                <CheckCircle2 size={18} style={{ color: 'var(--accent-emerald)' }} aria-label="Correct answer" />
                              )}
                              {quizResult && isOptionSelected && !isCorrect && (
                                <XCircle size={18} style={{ color: 'var(--accent-rose)' }} aria-label="Incorrect answer" />
                              )}
                            </label>
                          );
                        })}
                      </div>

                      {/* Explanation box after submitting */}
                      {quizResult && (
                        <div 
                          style={{
                            marginTop: '1rem',
                            padding: '0.75rem 1rem',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: 'var(--bg-muted)',
                            fontSize: '0.9rem',
                            borderLeft: '3px solid var(--primary)'
                          }}
                        >
                          <span style={{ fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>
                            Explanation:
                          </span>
                          <span>{q.explanation}</span>
                        </div>
                      )}
                    </fieldset>
                  );
                })}
              </div>

              {/* Submit Button */}
              {!quizResult && (
                <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                  <button
                    onClick={handleSubmitQuiz}
                    disabled={isSubmitting}
                    className="btn btn-primary"
                    style={{ padding: '0.75rem 2rem', fontSize: '1.05rem', minWidth: '180px' }}
                  >
                    {isSubmitting ? 'Evaluating...' : 'Submit Answers'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
              <HelpCircle size={44} style={{ color: 'var(--primary)', marginBottom: '0.75rem' }} />
              <h3 style={{ fontSize: '1.2rem' }}>Ready to test your knowledge?</h3>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 1.5rem auto' }}>
                Select one of your uploaded PDF study materials above and click <strong>Create Quiz</strong> to generate questions.
              </p>
            </div>
          )}
        </>
      )}

      {/* History Mode */}
      {viewMode === 'history' && (
        <div className="card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Quiz Scoring History</h2>
          {attempts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              No quiz attempts recorded yet. Take your first quiz!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {attempts.map((att) => {
                const percent = Math.round((att.score / att.total_questions) * 100);
                const isPassed = percent >= 60;
                return (
                  <div
                    key={att.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-muted)'
                    }}
                  >
                    <div>
                      <h3 style={{ fontSize: '0.95rem', margin: 0 }}>{att.quiz_title}</h3>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Date: {new Date(att.created_at).toLocaleString()}
                      </span>
                    </div>
                    <span className={`badge ${isPassed ? 'badge-emerald' : 'badge-amber'}`} style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                      {att.score} / {att.total_questions} ({percent}%)
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
