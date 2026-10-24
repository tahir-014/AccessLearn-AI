import React from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Bot, 
  HelpCircle, 
  Volume2, 
  Languages, 
  Accessibility, 
  FileUp, 
  ArrowRight,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import FeatureCard from '../components/FeatureCard';

export default function Home() {
  return (
    <div className="page-container">
      {/* Hero Section */}
      <section 
        style={{
          textAlign: 'center',
          padding: '2.5rem 1rem 3.5rem 1rem',
          maxWidth: '850px',
          margin: '0 auto',
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <span className="badge badge-indigo" style={{ padding: '0.35rem 0.85rem', fontSize: '0.85rem' }}>
            <Sparkles size={14} aria-hidden="true" />
            Inclusive AI-Powered Learning
          </span>
          <span className="badge badge-emerald" style={{ padding: '0.35rem 0.85rem', fontSize: '0.85rem' }}>
            <Languages size={14} aria-hidden="true" />
            English &bull; తెలుగు
          </span>
        </div>

        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.25rem', letterSpacing: '-0.025em' }}>
          Education Made Accessible, Simple, and Barrier-Free.
        </h1>

        <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '2rem' }}>
          AccessLearn AI transforms complex PDF study materials into simplified, multilingual explanations, 
          interactive audio with Text-to-Speech, personalized tutoring, and auto-generated quizzes.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
          <Link to="/learn" className="btn btn-primary" style={{ padding: '0.75rem 1.75rem', fontSize: '1.05rem' }}>
            <FileUp size={20} aria-hidden="true" />
            Upload Study Material
          </Link>
          <Link to="/tutor" className="btn btn-secondary" style={{ padding: '0.75rem 1.75rem', fontSize: '1.05rem' }}>
            <Bot size={20} aria-hidden="true" />
            Chat with AI Tutor
          </Link>
          <Link to="/dashboard" className="btn btn-secondary" style={{ padding: '0.75rem 1.5rem', fontSize: '1.05rem' }}>
            View Dashboard <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* Feature Grid */}
      <section aria-labelledby="features-heading" style={{ marginTop: '2rem' }}>
        <h2 id="features-heading" style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '1.75rem' }}>
          Designed for Every Learner
        </h2>

        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
          }}
        >
          <FeatureCard
            icon={BookOpen}
            title="PDF Extraction & Simplification"
            description="Upload textbooks or notes up to 10MB. Our AI distills dense prose into clear summaries, key takeaways, and vocabulary."
            badgeText="Core Feature"
            badgeColor="badge-indigo"
            linkTo="/learn"
            actionLabel="Explore Summaries"
          />

          <FeatureCard
            icon={Languages}
            title="Bilingual: English & Telugu"
            description="Access learning materials and tutor explanations in both English and Telugu (తెలుగు) seamlessly with a single click."
            badgeText="Bilingual"
            badgeColor="badge-emerald"
            linkTo="/learn"
            actionLabel="Try Telugu Learning"
          />

          <FeatureCard
            icon={Volume2}
            title="Interactive Text-to-Speech"
            description="Listen to generated explanations aloud using browser speech synthesis with adjustable rate, pitch, and voice controls."
            badgeText="Audio Assist"
            badgeColor="badge-amber"
            linkTo="/learn"
            actionLabel="Listen to Lessons"
          />

          <FeatureCard
            icon={Bot}
            title="Context-Aware AI Tutor"
            description="Ask questions and receive patient, pedagogical guidance grounded directly in the PDF materials you uploaded."
            badgeText="AI Tutor"
            badgeColor="badge-indigo"
            linkTo="/tutor"
            actionLabel="Start Chatting"
          />

          <FeatureCard
            icon={HelpCircle}
            title="Automated Practice Quizzes"
            description="Test your understanding with instant quizzes created dynamically from your study materials. Track scores and reviews."
            badgeText="Evaluation"
            badgeColor="badge-emerald"
            linkTo="/quiz"
            actionLabel="Take a Quiz"
          />

          <FeatureCard
            icon={Accessibility}
            title="Accessibility First"
            description="Built to WCAG standards with high contrast themes, font size scaling, full keyboard navigation, and screen reader labels."
            badgeText="Inclusive"
            badgeColor="badge-amber"
            linkTo="/settings"
            actionLabel="Customize Display"
          />
        </div>
      </section>

      {/* Accessibility Commitment Notice */}
      <section 
        className="card" 
        style={{ 
          marginTop: '3.5rem', 
          backgroundColor: 'var(--bg-muted)',
          display: 'flex', 
          flexDirection: 'column',
          gap: '1rem',
          borderLeft: '4px solid var(--primary)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ShieldCheck size={28} style={{ color: 'var(--primary)' }} aria-hidden="true" />
          <h3 style={{ margin: 0 }}>Privacy & Accessibility Guarantee</h3>
        </div>
        <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
          AccessLearn AI stores your learning history locally in SQLite. Your API keys are kept safe on the backend 
          and never exposed to the client. Works seamlessly out of the box in Demo AI mode even without an external API key!
        </p>
      </section>
    </div>
  );
}
