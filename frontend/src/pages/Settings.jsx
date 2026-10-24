import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Eye, 
  Type, 
  Volume2, 
  Languages, 
  Server, 
  Sparkles, 
  Check, 
  RotateCcw,
  ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';

export default function Settings({ 
  theme, 
  setTheme, 
  fontSize, 
  setFontSize 
}) {
  const [health, setHealth] = useState(null);
  const [ttsSpeed, setTtsSpeed] = useState(() => localStorage.getItem('accesslearn_tts_speed') || '1.0');
  const [defaultLang, setDefaultLang] = useState(() => localStorage.getItem('accesslearn_default_lang') || 'en');
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    api.getHealth()
      .then(data => setHealth(data))
      .catch(err => setHealth({ status: 'offline', error: err.message }));
  }, []);

  const handleSaveTTS = (speed) => {
    setTtsSpeed(speed);
    localStorage.setItem('accesslearn_tts_speed', speed);
    showNotice();
  };

  const handleSaveLang = (lang) => {
    setDefaultLang(lang);
    localStorage.setItem('accesslearn_default_lang', lang);
    showNotice();
  };

  const showNotice = () => {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const handleResetDefaults = () => {
    setTheme('light');
    setFontSize('medium');
    handleSaveTTS('1.0');
    handleSaveLang('en');
  };

  return (
    <div className="page-container" style={{ maxWidth: '850px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <SettingsIcon size={28} style={{ color: 'var(--primary)' }} aria-hidden="true" />
            Accessibility & Preferences
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
            Personalize your viewing contrast, text size, and speech preferences.
          </p>
        </div>

        {savedNotice && (
          <span className="badge badge-emerald" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
            <Check size={14} /> Saved
          </span>
        )}
      </div>

      {/* Visual Accessibility Settings */}
      <section className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Eye size={20} style={{ color: 'var(--primary)' }} />
          Display & High Contrast
        </h2>

        <div className="form-group">
          <label className="form-label" id="theme-group-label">Color Contrast Mode</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }} role="radiogroup" aria-labelledby="theme-group-label">
            {[
              { id: 'light', label: 'Default Light', desc: 'WCAG AAA contrast' },
              { id: 'dark', label: 'Dark Mode', desc: 'Reduces glare' },
              { id: 'high-contrast', label: 'High Contrast', desc: 'Maximum visibility & bold borders' }
            ].map(t => (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={theme === t.id}
                onClick={() => setTheme(t.id)}
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${theme === t.id ? 'var(--primary)' : 'var(--border-color)'}`,
                  backgroundColor: theme === t.id ? 'var(--bg-highlight)' : 'var(--bg-surface)',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  {t.label}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {t.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Font Size Scaling */}
        <div className="form-group" style={{ marginTop: '1.5rem' }}>
          <label className="form-label" id="font-group-label">
            <Type size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.35rem' }} />
            Text Scaling
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }} role="radiogroup" aria-labelledby="font-group-label">
            {[
              { id: 'small', label: 'A (Small)' },
              { id: 'medium', label: 'A (Medium - Default)' },
              { id: 'large', label: 'A (Large)' },
              { id: 'xlarge', label: 'A (X-Large)' }
            ].map(f => (
              <button
                key={f.id}
                type="button"
                role="radio"
                aria-checked={fontSize === f.id}
                onClick={() => setFontSize(f.id)}
                className={`btn btn-sm ${fontSize === f.id ? 'btn-primary' : 'btn-secondary'}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Live Preview Box */}
          <div 
            style={{ 
              marginTop: '1rem', 
              padding: '1rem', 
              borderRadius: 'var(--radius-md)', 
              backgroundColor: 'var(--bg-muted)', 
              border: '1px solid var(--border-color)' 
            }}
          >
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
              Text Size Preview:
            </span>
            <p style={{ margin: 0 }}>
              AccessLearn AI makes education inclusive for every student through personalized readability.
            </p>
          </div>
        </div>
      </section>

      {/* Audio & Speech Preferences */}
      <section className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Volume2 size={20} style={{ color: 'var(--primary)' }} />
          Audio & Text-to-Speech Defaults
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
          <div className="form-group">
            <label htmlFor="pref-speech-rate" className="form-label">Default Playback Speed</label>
            <select
              id="pref-speech-rate"
              className="form-select"
              value={ttsSpeed}
              onChange={(e) => handleSaveTTS(e.target.value)}
            >
              <option value="0.75">0.75x (Slower, clear articulation)</option>
              <option value="1.0">1.0x (Standard reading pace)</option>
              <option value="1.25">1.25x (Fast)</option>
              <option value="1.5">1.5x (Very Fast)</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="pref-default-lang" className="form-label">
              <Languages size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.35rem' }} />
              Preferred Language
            </label>
            <select
              id="pref-default-lang"
              className="form-select"
              value={defaultLang}
              onChange={(e) => handleSaveLang(e.target.value)}
            >
              <option value="en">English</option>
              <option value="te">తెలుగు (Telugu)</option>
            </select>
          </div>
        </div>
      </section>

      {/* System Status & Backend Configuration */}
      <section className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Server size={20} style={{ color: 'var(--primary)' }} />
          System & AI Engine Status
        </h2>

        {health ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.95rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <span>Backend Server Status:</span>
              <span className={`badge ${health.status === 'healthy' ? 'badge-emerald' : 'badge-rose'}`}>
                {health.status}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <span>AI Engine Mode:</span>
              <span className={`badge ${health.is_demo_mode ? 'badge-amber' : 'badge-indigo'}`}>
                <Sparkles size={12} />
                {health.is_demo_mode ? 'Demo / Mock AI Mode' : 'Live Google Gemini'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <span>Configured Model:</span>
              <span style={{ fontFamily: 'monospace' }}>{health.model || 'gemini-1.5-flash'}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>PDF Upload Limit:</span>
              <span>{health.upload_limit_mb || 10} MB max</span>
            </div>
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)' }}>Checking backend status...</p>
        )}
      </section>

      {/* Reset button */}
      <div style={{ textAlign: 'right' }}>
        <button
          onClick={handleResetDefaults}
          className="btn btn-secondary btn-sm"
          style={{ gap: '0.35rem' }}
        >
          <RotateCcw size={14} /> Reset All Preferences to Defaults
        </button>
      </div>
    </div>
  );
}
