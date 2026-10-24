import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  LayoutDashboard, 
  BookOpen, 
  Bot, 
  HelpCircle, 
  Settings as SettingsIcon,
  Sparkles,
  Globe2
} from 'lucide-react';

export default function Sidebar({ mobileOpen, setMobileOpen, isDemoMode }) {
  const navItems = [
    { to: '/', label: 'Home', icon: Home, end: true },
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/learn', label: 'Learn & TTS', icon: BookOpen },
    { to: '/tutor', label: 'AI Tutor', icon: Bot },
    { to: '/quiz', label: 'Quizzes', icon: HelpCircle },
    { to: '/settings', label: 'Settings', icon: SettingsIcon },
  ];

  const handleLinkClick = () => {
    if (window.innerWidth < 768) {
      setMobileOpen(false);
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 45,
          }}
          aria-hidden="true"
        />
      )}

      <aside
        id="app-sidebar"
        role="navigation"
        aria-label="Sidebar Navigation"
        style={{
          width: '260px',
          backgroundColor: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '1.25rem 0.85rem',
          position: mobileOpen ? 'fixed' : 'relative',
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 50,
          transform: mobileOpen || (typeof window !== 'undefined' && window.innerWidth >= 768) ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s ease-in-out',
        }}
      >
        <div>
          {/* Section title */}
          <p 
            style={{ 
              fontSize: '0.75rem', 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em', 
              color: 'var(--text-muted)', 
              fontWeight: 700, 
              padding: '0 0.75rem',
              marginBottom: '0.75rem' 
            }}
          >
            Navigation
          </p>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={handleLinkClick}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.7rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    textDecoration: 'none',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '0.95rem',
                    color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                    backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                    border: isActive ? '1px solid var(--primary)' : '1px solid transparent',
                    transition: 'all 0.15s ease'
                  })}
                >
                  <Icon size={20} aria-hidden="true" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer badges */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              fontSize: '0.8rem', 
              color: 'var(--text-muted)',
              padding: '0 0.5rem'
            }}
          >
            <Globe2 size={16} aria-hidden="true" />
            <span>English &bull; తెలుగు (Telugu)</span>
          </div>

          <div
            style={{
              padding: '0.6rem 0.75rem',
              backgroundColor: isDemoMode ? 'var(--bg-muted)' : 'var(--primary-light)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Sparkles size={16} style={{ color: isDemoMode ? 'var(--accent-amber)' : 'var(--primary)' }} aria-hidden="true" />
            <div>
              <span style={{ fontWeight: 600, display: 'block', color: 'var(--text-primary)' }}>
                {isDemoMode ? 'Demo AI Mode' : 'Gemini AI Active'}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {isDemoMode ? 'Zero configuration required' : 'Powered by Google Gemini'}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
