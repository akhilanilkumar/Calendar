import React from 'react';
import { Calendar, Mail, User, LogOut, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Navbar() {
  const { user, currentPath, navigate, logout, emailOutbox, openEmailInspector } = useApp();

  const isPublicPage = currentPath.startsWith('/u/') || (currentPath !== '/' && currentPath !== '/login' && currentPath !== '/signup' && !currentPath.startsWith('/dashboard') && !currentPath.startsWith('/setup'));

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'rgba(9, 9, 11, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-subtle)',
        height: '72px',
        display: 'flex',
        alignItems: 'center'
      }}
    >
      <div className="container flex-between">
        {/* Brand Logo */}
        <div
          onClick={() => navigate('/')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-green)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px var(--accent-green-glow)'
            }}
          >
            <Calendar size={22} color="#000000" strokeWidth={2.5} />
          </div>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', fontWeight: '800', tracking: '-0.03em' }}>
            Schedulify
          </span>
        </div>

        {/* Center Nav Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'none',
              border: 'none',
              color: currentPath === '/' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontSize: '0.925rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'var(--transition-fast)'
            }}
          >
            Home
          </button>
          <button
            onClick={() => {
              if (currentPath !== '/') navigate('/');
              setTimeout(() => {
                const el = document.getElementById('how-it-works');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '0.925rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'var(--transition-fast)'
            }}
          >
            How it works
          </button>
          <button
            onClick={() => {
              if (currentPath !== '/') navigate('/');
              setTimeout(() => {
                const el = document.getElementById('features');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '0.925rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'var(--transition-fast)'
            }}
          >
            Features
          </button>
          <button
            onClick={() => navigate('/akhil')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-green)',
              fontSize: '0.925rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'var(--transition-fast)'
            }}
          >
            Demo Page
          </button>
        </nav>

        {/* Right CTA / User Session */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Email Outbox Inspector Button */}
          {emailOutbox.length > 0 && (
            <button
              onClick={() => openEmailInspector()}
              className="btn btn-secondary btn-sm"
              title="View Confirmation Email Outbox"
              style={{ position: 'relative' }}
            >
              <Mail size={16} /> Emails
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: 'var(--accent-green)',
                  color: '#000',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  fontSize: '0.7rem',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {emailOutbox.length}
              </span>
            </button>
          )}

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => navigate('/dashboard')}
              >
                <User size={16} /> Dashboard
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={logout}
                title="Log out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => navigate('/login')}
              >
                Log in
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => navigate('/signup')}
              >
                Get Started <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
