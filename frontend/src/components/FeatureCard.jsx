import React from 'react';
import { Link } from 'react-router-dom';

export default function FeatureCard({
  icon: Icon,
  title,
  description,
  badgeText,
  badgeColor = 'badge-indigo',
  linkTo,
  actionLabel = 'Explore',
  onAction,
}) {
  return (
    <div 
      className="card feature-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        position: 'relative'
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          {Icon && (
            <div 
              style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-hidden="true"
            >
              <Icon size={24} />
            </div>
          )}
          {badgeText && (
            <span className={`badge ${badgeColor}`}>{badgeText}</span>
          )}
        </div>

        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{title}</h3>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
          {description}
        </p>
      </div>

      <div>
        {linkTo ? (
          <Link to={linkTo} className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
            {actionLabel} &rarr;
          </Link>
        ) : onAction ? (
          <button onClick={onAction} className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
