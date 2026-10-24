import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Bot, 
  Send, 
  User, 
  Sparkles, 
  Volume2, 
  Languages, 
  Trash2, 
  BookOpen, 
  Copy, 
  Check,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Tutor() {
  const [searchParams, setSearchParams] = useSearchParams();
  const lessonIdParam = searchParams.get('lessonId');

  const [lessons, setLessons] = useState([]);
  const [selectedLessonId, setSelectedLessonId] = useState(lessonIdParam ? parseInt(lessonIdParam, 10) : null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [language, setLanguage] = useState('en'); // 'en' | 'te'
  const [isSending, setIsSending] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [ttsActiveId, setTtsActiveId] = useState(null);

  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  // Load lessons and conversation history
  useEffect(() => {
    api.getLessons()
      .then((data) => {
        setLessons(data);
        if (lessonIdParam && !selectedLessonId) {
          setSelectedLessonId(parseInt(lessonIdParam, 10));
        }
      })
      .catch((err) => console.error('Failed to load lessons:', err));
  }, []);

  const loadHistory = async (lessonId) => {
    try {
      const history = await api.getTutorHistory(lessonId);
      setMessages(history);
    } catch (err) {
      console.error('Failed to fetch tutor chat history:', err);
    }
  };

  useEffect(() => {
    loadHistory(selectedLessonId);
  }, [selectedLessonId]);

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    const query = inputText.trim();
    if (!query || isSending) return;

    // Optimistically show user message
    const tempUserMsg = {
      id: Date.now(),
      role: 'user',
      message: query,
      language: language,
      created_at: new Date().toISOString()
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setInputText('');
    setIsSending(true);

    try {
      const res = await api.askTutor(query, selectedLessonId, language);
      const assistantMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        message: res.answer,
        language: res.language,
        created_at: new Date().toISOString()
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      alert(`Error asking AI Tutor: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleClearChat = async () => {
    if (!window.confirm('Clear conversation history?')) return;
    try {
      await api.clearTutorHistory(selectedLessonId);
      setMessages([]);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } catch (err) {
      alert(`Error clearing chat: ${err.message}`);
    }
  };

  // Text-to-speech for tutor message
  const speakMessage = (text, lang, msgId) => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on this device.');
      return;
    }

    if (ttsActiveId === msgId) {
      window.speechSynthesis.cancel();
      setTtsActiveId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#`_~]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = lang === 'te' ? 'te-IN' : 'en-US';
    
    // Pick appropriate voice
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.startsWith(lang === 'te' ? 'te' : 'en'));
    if (voice) utterance.voice = voice;

    utterance.onend = () => setTtsActiveId(null);
    utterance.onerror = () => setTtsActiveId(null);

    setTtsActiveId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickPrompts = [
    { label: "Summarize this clearly", text: "Can you summarize the most important points in simple, clear terms?" },
    { label: "Give a real-world example", text: "Please provide a relatable, everyday real-world example to explain this." },
    { label: "Explain like I'm 10", text: "Explain this concept in very simple language as if I'm a beginner." },
    { label: "తెలుగులో వివరించండి", text: "ఈ భావనను నాకు అర్థమయ్యేలా సులభమైన తెలుగులో వివరించగలరా?" }
  ];

  return (
    <div className="page-container" style={{ maxWidth: '960px' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <Bot size={28} style={{ color: 'var(--primary)' }} aria-hidden="true" />
            AI Tutor & Study Companion
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
            Ask questions, clarify complex concepts, and receive bilingual support in English & Telugu.
          </p>
        </div>

        {messages.length > 0 && (
          <button
            onClick={handleClearChat}
            className="btn btn-secondary btn-sm"
            style={{ color: 'var(--accent-rose)', gap: '0.35rem' }}
            title="Clear chat history"
          >
            <Trash2 size={15} /> Clear Chat
          </button>
        )}
      </div>

      {/* Control Bar: Study Material Context & Language */}
      <div 
        className="card"
        style={{
          padding: '0.85rem 1.25rem',
          marginBottom: '1rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '240px' }}>
          <BookOpen size={18} style={{ color: 'var(--primary)' }} aria-hidden="true" />
          <label htmlFor="context-select" style={{ fontSize: '0.9rem', fontWeight: 600 }}>Study Context:</label>
          <select
            id="context-select"
            className="form-select"
            style={{ padding: '0.35rem 0.6rem', fontSize: '0.85rem' }}
            value={selectedLessonId || ''}
            onChange={(e) => {
              const val = e.target.value ? parseInt(e.target.value, 10) : null;
              setSelectedLessonId(val);
              if (val) setSearchParams({ lessonId: val });
              else setSearchParams({});
            }}
          >
            <option value="">General Knowledge (No specific PDF attached)</option>
            {lessons.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title}
              </option>
            ))}
          </select>
        </div>

        {/* Language selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Languages size={18} style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
          <div style={{ display: 'flex', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              style={{
                padding: '0.35rem 0.65rem',
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
                padding: '0.35rem 0.65rem',
                fontSize: '0.85rem',
                fontWeight: language === 'te' ? 700 : 500,
                backgroundColor: language === 'te' ? 'var(--primary)' : 'var(--bg-surface)',
                color: language === 'te' ? '#ffffff' : 'var(--text-primary)',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              తెలుగు
            </button>
          </div>
        </div>
      </div>

      {/* Chat Messages Container */}
      <div 
        className="card"
        style={{
          minHeight: '420px',
          maxHeight: '600px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          padding: '1.25rem',
          marginBottom: '1rem',
          backgroundColor: 'var(--bg-primary)'
        }}
        role="log"
        aria-live="polite"
        aria-label="Tutor conversation history"
      >
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', margin: 'auto', padding: '2rem 1rem' }}>
            <Bot size={48} style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
            <h2 style={{ fontSize: '1.3rem' }}>How can I help you learn today?</h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 1.5rem auto', fontSize: '0.95rem' }}>
              I can explain difficult concepts, answer questions from your uploaded documents, 
              or speak with you in English and Telugu.
            </p>

            {/* Quick Prompt Badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
              {quickPrompts.map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => setInputText(qp.text)}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.85rem' }}
                >
                  <Sparkles size={14} style={{ color: 'var(--primary)' }} />
                  {qp.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            const isTelugu = msg.language === 'te';
            return (
              <div
                key={msg.id || index}
                style={{
                  display: 'flex',
                  flexDirection: isUser ? 'row-reverse' : 'row',
                  gap: '0.75rem',
                  alignItems: 'flex-start',
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: isUser ? 'var(--primary)' : 'var(--bg-highlight)',
                    color: isUser ? '#ffffff' : 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontWeight: 700,
                  }}
                  aria-hidden="true"
                >
                  {isUser ? <User size={18} /> : <Bot size={20} />}
                </div>

                {/* Bubble */}
                <div
                  style={{
                    maxWidth: '80%',
                    padding: '0.85rem 1.15rem',
                    borderRadius: 'var(--radius-lg)',
                    borderBottomRightRadius: isUser ? '2px' : 'var(--radius-lg)',
                    borderBottomLeftRadius: !isUser ? '2px' : 'var(--radius-lg)',
                    backgroundColor: isUser ? 'var(--primary)' : 'var(--bg-surface)',
                    color: isUser ? '#ffffff' : 'var(--text-primary)',
                    boxShadow: 'var(--shadow-sm)',
                    border: isUser ? 'none' : '1px solid var(--border-color)',
                    fontSize: '0.98rem',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    fontFamily: isTelugu ? 'var(--font-telugu), var(--font-sans)' : 'var(--font-sans)',
                  }}
                >
                  <div>{msg.message}</div>

                  {/* Actions on Assistant Messages (TTS, Copy) */}
                  {!isUser && (
                    <div 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem', 
                        marginTop: '0.6rem', 
                        paddingTop: '0.4rem', 
                        borderTop: '1px solid var(--border-color)',
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)'
                      }}
                    >
                      <button
                        onClick={() => speakMessage(msg.message, msg.language, msg.id || index)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', gap: '0.3rem' }}
                        aria-label={ttsActiveId === (msg.id || index) ? "Stop speaking this message" : "Listen to this message"}
                      >
                        <Volume2 size={13} aria-hidden="true" />
                        {ttsActiveId === (msg.id || index) ? 'Stop' : 'Listen'}
                      </button>

                      <button
                        onClick={() => handleCopy(msg.message, msg.id || index)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', gap: '0.3rem' }}
                        aria-label="Copy message text"
                      >
                        {copiedId === (msg.id || index) ? <Check size={13} /> : <Copy size={13} />}
                        {copiedId === (msg.id || index) ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {isSending && (
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--bg-highlight)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={20} style={{ color: 'var(--primary)' }} />
            </div>
            <div style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
              <LoadingSpinner message="AI Tutor is thinking..." size="sm" />
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.75rem' }}>
        <input
          type="text"
          className="form-input"
          placeholder={language === 'te' ? "మీ ప్రశ్నను ఇక్కడ అడగండి..." : "Ask your tutor a question (e.g. 'Can you explain this step-by-step?')..."}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={isSending}
          aria-label="Message to AI Tutor"
          style={{ flex: 1 }}
        />

        <button
          type="submit"
          disabled={!inputText.trim() || isSending}
          className="btn btn-primary"
          style={{ gap: '0.5rem', minWidth: '110px' }}
          aria-label="Send message to AI Tutor"
        >
          <Send size={18} aria-hidden="true" />
          Send
        </button>
      </form>
    </div>
  );
}
