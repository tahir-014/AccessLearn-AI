import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Eye, Sun, Moon, Volume2, Menu, X, Sparkles } from 'lucide-react';

export default function Navbar({ 
  theme, 
  toggleTheme, 
  fontSize, 
  cycleFontSize, 
  mobileMenuOpen, 
  setMobileMenuOpen 
}) {
  const location = useLocation();

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/learn', label: 'Learn & TTS' },
    { to: '/tutor', label: 'AI Tutor' },
    { to: '/quiz', label: 'Quizzes' },
    { to: '/settings', label: 'Settings' },
  ];

  return (
    <header 
      role="banner"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-color)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      {/* Skip to Content Link for keyboard / screen reader users */}
      <a 
        href="#main-content" 
        style={{
          position: 'absolute',
          top: '-50px',
          left: '10px',
          padding: '8px 16px',
          background: 'var(--primary)',
          color: '#ffffff',
          fontWeight: 700,
          zIndex: 100,
          borderRadius: '4px',
          textDecoration: 'none',
          transition: 'top 0.2s ease',
        }}
        onFocus={(e) => { e.currentTarget.style.top = '10px'; }}
        onBlur={(e) => { e.currentTarget.style.top = '-50px'; }}
      >
        Skip to main content
      </a>

      <div 
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Brand identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', padding: '0.4rem', border: 'none', background: 'transparent' }}
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <Link 
            to="/" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.6rem', 
              textDecoration: 'none',
              color: 'var(--text-primary)'
            }}
            aria-label="AccessLearn AI Home"
          >
            <img 
              src="/logo.svg" 
              alt="" 
              style={{ width: '36px', height: '36px', borderRadius: '8px' }} 
              aria-hidden="true" 
            />
            <div>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em', display: 'block', lineHeight: 1.1 }}>
                AccessLearn <span style={{ color: 'var(--primary)' }}>AI</span>
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>
                Inclusive Education
              </span>
            </div>
          </Link>
        </div>

        {/* Accessibility Quick Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Quick Font Size Switcher */}
          <button
            onClick={cycleFontSize}
            className="btn btn-secondary btn-sm"
            title={`Adjust text size (Current: ${fontSize})`}
            aria-label={`Adjust text size, current size is ${fontSize}`}
            style={{ padding: '0.35rem 0.65rem', fontWeight: 700 }}
          >
            <span aria-hidden="true" style={{ fontSize: '1.05rem' }}>A±</span>
            <span className="sr-only">Change font size</span>
          </button>

          {/* Theme / High Contrast Switcher */}
          <button
            onClick={toggleTheme}
            className="btn btn-secondary btn-sm"
            title={`Current theme: ${theme}. Click to change theme.`}
            aria-label={`Toggle accessibility theme. Current theme is ${theme}`}
            style={{ padding: '0.35rem 0.65rem' }}
          >
            {theme === 'high-contrast' ? (
              <Eye size={18} style={{ color: 'var(--accent-amber)' }} aria-hidden="true" />
            ) : theme === 'dark' ? (
              <Moon size={18} aria-hidden="true" />
            ) : (
              <Sun size={18} aria-hidden="true" />
            )}
            <span style={{ fontSize: '0.8rem', textTransform: 'capitalize' }}>
              {theme === 'high-contrast' ? 'High Contrast' : theme}
            </span>
          </button>

          <Link
            to="/tutor"
            className="btn btn-primary btn-sm"
            style={{ display: 'none', gap: '0.4rem' }}
            id="desktop-tutor-cta"
          >
            <Sparkles size={16} aria-hidden="true" />
            Ask Tutor
          </Link>
        </div>
      </div>
    </header>
  );
}
