import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  BookOpen, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  RotateCcw, 
  Sparkles, 
  FileText, 
  Languages, 
  Bot, 
  HelpCircle,
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';
import { api } from '../services/api';
import FileUploader from '../components/FileUploader';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Learn() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialLessonId = searchParams.get('id');

  const [lessons, setLessons] = useState([]);
  const [selectedLessonId, setSelectedLessonId] = useState(initialLessonId ? parseInt(initialLessonId, 10) : null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [activeTab, setActiveTab] = useState('simplified'); // 'simplified' | 'original'
  
  // Simplification settings
  const [language, setLanguage] = useState('en'); // 'en' | 'te'
  const [level, setLevel] = useState('standard'); // 'standard' | 'simple' | 'bullets'
  const [simplifiedText, setSimplifiedText] = useState('');
  const [isSimplifying, setIsSimplifying] = useState(false);
  const [isMockMode, setIsMockMode] = useState(false);
  const [copied, setCopied] = useState(false);

  // Text-To-Speech state
  const [ttsSupported, setTtsSupported] = useState(true);
  const [ttsState, setTtsState] = useState('idle'); // 'idle' | 'playing' | 'paused'
  const [ttsRate, setTtsRate] = useState(1.0);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const utteranceRef = useRef(null);

  // Initialize Speech Synthesis
  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      setTtsSupported(false);
      return;
    }

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Fetch all lessons
  const fetchLessons = async (targetIdToSelect = null) => {
    try {
      const data = await api.getLessons();
      setLessons(data);
      if (data.length > 0) {
        const idToUse = targetIdToSelect || selectedLessonId || data[0].id;
        setSelectedLessonId(idToUse);
      }
    } catch (err) {
      console.error('Failed to load lessons:', err);
    }
  };

  useEffect(() => {
    fetchLessons();
  }, []);

  // Fetch full details of selected lesson
  useEffect(() => {
    if (!selectedLessonId) return;

    // Stop active speech when changing lessons
    stopTTS();

    api.getLesson(selectedLessonId)
      .then((data) => {
        setCurrentLesson(data);
        // Preload cached simplification if available
        if (language === 'te' && data.simplified_te) {
          setSimplifiedText(data.simplified_te);
        } else if (language === 'en' && data.simplified_en) {
          setSimplifiedText(data.simplified_en);
        } else {
          setSimplifiedText('');
        }
      })
      .catch((err) => {
        console.error('Failed to fetch lesson detail:', err);
      });
  }, [selectedLessonId]);

  // When language toggle changes, show cached version if available
  useEffect(() => {
    if (!currentLesson) return;
    stopTTS();
    if (language === 'te' && currentLesson.simplified_te) {
      setSimplifiedText(currentLesson.simplified_te);
    } else if (language === 'en' && currentLesson.simplified_en) {
      setSimplifiedText(currentLesson.simplified_en);
    } else {
      setSimplifiedText('');
    }
  }, [language]);

  const handleLessonUploaded = (newLesson) => {
    fetchLessons(newLesson.id);
  };

  const handleGenerateSimplification = async () => {
    if (!selectedLessonId) return;
    setIsSimplifying(true);
    stopTTS();

    try {
      const res = await api.simplifyLesson(selectedLessonId, language, level);
      setSimplifiedText(res.simplified_text);
      setIsMockMode(res.is_mock);
      // Update in-memory current lesson cache
      setCurrentLesson(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          [language === 'te' ? 'simplified_te' : 'simplified_en']: res.simplified_text
        };
      });
    } catch (err) {
      alert(`Error generating simplification: ${err.message}`);
    } finally {
      setIsSimplifying(false);
    }
  };

  // TTS Controls
  const startTTS = () => {
    if (!('speechSynthesis' in window) || !simplifiedText) return;

    window.speechSynthesis.cancel();

    // Clean markdown hashes/stars before speaking
    const textToSpeak = simplifiedText
      .replace(/[#*`_~]/g, '')
      .replace(/\[Page \d+\]/g, '')
      .trim();

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = ttsRate;
    
    // Choose appropriate voice
    const langCode = language === 'te' ? 'te' : 'en';
    const voice = availableVoices.find(v => v.lang.startsWith(langCode)) || null;
    if (voice) {
      utterance.voice = voice;
    }
    utterance.lang = language === 'te' ? 'te-IN' : 'en-US';

    utterance.onstart = () => setTtsState('playing');
    utterance.onpause = () => setTtsState('paused');
    utterance.onresume = () => setTtsState('playing');
    utterance.onend = () => setTtsState('idle');
    utterance.onerror = () => setTtsState('idle');

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const pauseTTS = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.pause();
      setTtsState('paused');
    }
  };

  const resumeTTS = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.resume();
      setTtsState('playing');
    }
  };

  const stopTTS = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setTtsState('idle');
    }
  };

  const handleCopyText = () => {
    if (!simplifiedText) return;
    navigator.clipboard.writeText(simplifiedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="page-container">
      {/* Title & Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.25rem' }}>Study & Simplify Material</h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
            Upload PDFs, extract clear summaries, listen with Text-to-Speech in English & Telugu.
          </p>
        </div>

        {selectedLessonId && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link to={`/tutor?lessonId=${selectedLessonId}`} className="btn btn-secondary btn-sm">
              <Bot size={16} aria-hidden="true" />
              Ask Tutor
            </Link>
            <Link to={`/quiz?lessonId=${selectedLessonId}`} className="btn btn-secondary btn-sm">
              <HelpCircle size={16} aria-hidden="true" />
              Quiz Me
            </Link>
          </div>
        )}
      </div>

      {/* Top Section: Upload Box & Lesson Selector */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <FileUploader onUploadSuccess={handleLessonUploaded} />

        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BookOpen size={20} style={{ color: 'var(--primary)' }} aria-hidden="true" />
              Select Active Study Material
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Choose from your library of {lessons.length} uploaded document(s).
            </p>

            {lessons.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No lessons uploaded yet. Upload a PDF on the left to start!
              </div>
            ) : (
              <div className="form-group">
                <label htmlFor="lesson-selector" className="sr-only">Choose study material</label>
                <select
                  id="lesson-selector"
                  className="form-select"
                  value={selectedLessonId || ''}
                  onChange={(e) => {
                    const id = parseInt(e.target.value, 10);
                    setSelectedLessonId(id);
                    setSearchParams({ id });
                  }}
                >
                  {lessons.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.title} ({l.page_count} pgs, {(l.file_size / 1024).toFixed(0)} KB)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {currentLesson && (
            <div style={{ backgroundColor: 'var(--bg-muted)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 600 }}>File:</span>
                <span>{currentLesson.filename}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 600 }}>Extracted Words:</span>
                <span>~{Math.round((currentLesson.extracted_text || '').split(/\s+/).length)} words</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600 }}>Telugu Ready:</span>
                <span>{currentLesson.simplified_te ? 'Yes' : 'Not generated yet'}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Material Viewer & Explainer */}
      {currentLesson ? (
        <div className="card" style={{ padding: '1.5rem' }}>
          {/* Controls Bar: Language, Format, Actions */}
          <div 
            style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              gap: '1rem',
              paddingBottom: '1rem',
              borderBottom: '1px solid var(--border-color)',
              marginBottom: '1.25rem'
            }}
          >
            {/* View Mode Tabs */}
            <div role="tablist" style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                role="tab"
                aria-selected={activeTab === 'simplified'}
                onClick={() => setActiveTab('simplified')}
                className={`btn btn-sm ${activeTab === 'simplified' ? 'btn-primary' : 'btn-secondary'}`}
              >
                <Sparkles size={16} aria-hidden="true" />
                Simplified Explanation
              </button>
              <button
                role="tab"
                aria-selected={activeTab === 'original'}
                onClick={() => setActiveTab('original')}
                className={`btn btn-sm ${activeTab === 'original' ? 'btn-primary' : 'btn-secondary'}`}
              >
                <FileText size={16} aria-hidden="true" />
                Original Extracted PDF
              </button>
            </div>

            {/* Language & Simplification Options (When in Simplified Tab) */}
            {activeTab === 'simplified' && (
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem' }}>
                {/* Language Switcher */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Languages size={18} style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
                  <div style={{ display: 'flex', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                    <button
                      type="button"
                      onClick={() => setLanguage('en')}
                      style={{
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.85rem',
                        fontWeight: language === 'en' ? 700 : 500,
                        backgroundColor: language === 'en' ? 'var(--primary)' : 'var(--bg-surface)',
                        color: language === 'en' ? '#ffffff' : 'var(--text-primary)',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      English
                    </button>
                    <button
                      type="button"
                      onClick={() => setLanguage('te')}
                      style={{
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.85rem',
                        fontWeight: language === 'te' ? 700 : 500,
                        backgroundColor: language === 'te' ? 'var(--primary)' : 'var(--bg-surface)',
                        color: language === 'te' ? '#ffffff' : 'var(--text-primary)',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      తెలుగు (Telugu)
                    </button>
                  </div>
                </div>

                {/* Level selector */}
                <select
                  className="form-select"
                  style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  aria-label="Simplification level"
                >
                  <option value="standard">Standard Explanation</option>
                  <option value="simple">Simple / Beginner</option>
                  <option value="bullets">Key Bullets Only</option>
                </select>

                <button
                  onClick={handleGenerateSimplification}
                  disabled={isSimplifying}
                  className="btn btn-primary btn-sm"
                  style={{ gap: '0.4rem' }}
                >
                  <Sparkles size={16} aria-hidden="true" />
                  {simplifiedText ? 'Regenerate' : 'Generate'} {language === 'te' ? 'తెలుగు' : 'English'}
                </button>
              </div>
            )}
          </div>

          {/* Text-To-Speech Bar (Visible when in Simplified Tab and text exists) */}
          {activeTab === 'simplified' && simplifiedText && (
            <div 
              style={{
                backgroundColor: 'var(--bg-muted)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem 1rem',
                marginBottom: '1.25rem',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
                border: '1px solid var(--border-color)'
              }}
              role="region"
              aria-label="Text to speech controls"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Volume2 size={20} style={{ color: 'var(--primary)' }} aria-hidden="true" />
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Text-to-Speech:</span>
                <span 
                  className={`badge ${ttsState === 'playing' ? 'badge-emerald' : 'badge-indigo'}`}
                  style={{ fontSize: '0.75rem', textTransform: 'capitalize' }}
                >
                  {ttsState}
                </span>
              </div>

              {ttsSupported ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {ttsState === 'idle' && (
                    <button onClick={startTTS} className="btn btn-primary btn-sm" style={{ gap: '0.35rem' }}>
                      <Play size={15} /> Play
                    </button>
                  )}
                  {ttsState === 'playing' && (
                    <button onClick={pauseTTS} className="btn btn-secondary btn-sm" style={{ gap: '0.35rem' }}>
                      <Pause size={15} /> Pause
                    </button>
                  )}
                  {ttsState === 'paused' && (
                    <button onClick={resumeTTS} className="btn btn-primary btn-sm" style={{ gap: '0.35rem' }}>
                      <Play size={15} /> Resume
                    </button>
                  )}
                  {(ttsState === 'playing' || ttsState === 'paused') && (
                    <button onClick={stopTTS} className="btn btn-secondary btn-sm" style={{ gap: '0.35rem' }}>
                      <RotateCcw size={15} /> Stop
                    </button>
                  )}

                  {/* Speech Rate Controls */}
                  <select
                    className="form-select"
                    style={{ width: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
                    value={ttsRate}
                    onChange={(e) => setTtsRate(parseFloat(e.target.value))}
                    aria-label="Speech playback speed"
                  >
                    <option value="0.75">0.75x Speed</option>
                    <option value="1.0">1.0x (Normal)</option>
                    <option value="1.25">1.25x Speed</option>
                    <option value="1.5">1.5x Speed</option>
                  </select>

                  <button 
                    onClick={handleCopyText} 
                    className="btn btn-secondary btn-sm"
                    title="Copy explanation text"
                    aria-label="Copy explanation text"
                  >
                    {copied ? <Check size={15} /> : <Copy size={15} />}
                  </button>
                </div>
              ) : (
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Speech synthesis not supported in this browser.
                </span>
              )}
            </div>
          )}

          {/* Tab Content 1: Simplified Explanation */}
          {activeTab === 'simplified' && (
            <div>
              {isSimplifying ? (
                <LoadingSpinner message={`Generating accessible explanation in ${language === 'te' ? 'Telugu (తెలుగు)' : 'English'}...`} />
              ) : simplifiedText ? (
                <div 
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.7,
                    fontSize: '1.05rem',
                    fontFamily: language === 'te' ? 'var(--font-telugu), var(--font-sans)' : 'var(--font-sans)'
                  }}
                  tabIndex={0}
                  aria-label="Simplified study content"
                >
                  {simplifiedText}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                  <Sparkles size={40} style={{ color: 'var(--primary)', marginBottom: '0.75rem' }} />
                  <h3 style={{ fontSize: '1.15rem' }}>No explanation generated for this lesson yet</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '500px', margin: '0 auto 1.5rem auto' }}>
                    Click below to generate a clear, accessible breakdown in {language === 'te' ? 'Telugu (తెలుగు)' : 'English'}.
                  </p>
                  <button onClick={handleGenerateSimplification} className="btn btn-primary">
                    <Sparkles size={18} aria-hidden="true" />
                    Generate {language === 'te' ? 'Telugu (తెలుగు)' : 'English'} Summary
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tab Content 2: Original Extracted PDF Text */}
          {activeTab === 'original' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  Total Characters: {(currentLesson.extracted_text || '').length} &bull; Pages: {currentLesson.page_count}
                </span>
              </div>
              <div 
                style={{
                  maxHeight: '500px',
                  overflowY: 'auto',
                  backgroundColor: 'var(--bg-muted)',
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-md)',
                  fontFamily: 'monospace',
                  fontSize: '0.9rem',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  border: '1px solid var(--border-color)'
                }}
                tabIndex={0}
                aria-label="Raw extracted text from PDF document"
              >
                {currentLesson.extracted_text || 'No text could be extracted.'}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
