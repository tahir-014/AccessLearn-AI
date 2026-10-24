import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Learn from './pages/Learn';
import Tutor from './pages/Tutor';
import Quiz from './pages/Quiz';
import Settings from './pages/Settings';
import { api } from './services/api';

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('accesslearn_theme') || 'light');
  const [fontSize, setFontSize] = useState(() => localStorage.getItem('accesslearn_font_size') || 'medium');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(true);

  // Sync Theme with HTML Attribute & LocalStorage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('accesslearn_theme', theme);
  }, [theme]);

  // Sync Font Size with HTML Attribute & LocalStorage
  useEffect(() => {
    document.documentElement.setAttribute('data-font-size', fontSize);
    localStorage.setItem('accesslearn_font_size', fontSize);
  }, [fontSize]);

  // Fetch backend status on mount
  useEffect(() => {
    api.getHealth()
      .then(res => {
        setIsDemoMode(Boolean(res.is_demo_mode));
      })
      .catch(() => {
        setIsDemoMode(true);
      });
  }, []);

  const toggleTheme = () => {
    setTheme(prev => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'high-contrast';
      return 'light';
    });
  };

  const cycleFontSize = () => {
    setFontSize(prev => {
      if (prev === 'small') return 'medium';
      if (prev === 'medium') return 'large';
      if (prev === 'large') return 'xlarge';
      return 'small';
    });
  };

  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar 
          mobileOpen={mobileMenuOpen} 
          setMobileOpen={setMobileMenuOpen} 
          isDemoMode={isDemoMode}
        />

        <div className="main-content">
          <Navbar 
            theme={theme}
            toggleTheme={toggleTheme}
            fontSize={fontSize}
            cycleFontSize={cycleFontSize}
            mobileMenuOpen={mobileMenuOpen}
            setMobileMenuOpen={setMobileMenuOpen}
          />

          <main id="main-content" tabIndex="-1" style={{ outline: 'none' }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/learn" element={<Learn />} />
              <Route path="/tutor" element={<Tutor />} />
              <Route path="/quiz" element={<Quiz />} />
              <Route 
                path="/settings" 
                element={
                  <Settings 
                    theme={theme} 
                    setTheme={setTheme} 
                    fontSize={fontSize} 
                    setFontSize={setFontSize} 
                  />
                } 
              />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
