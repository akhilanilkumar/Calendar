import React, { useState } from 'react';
import { Calendar, ArrowRight, Lock, Mail, User as UserIcon } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function SignupPage() {
  const { signup, navigate } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setTimeout(() => {
      signup(email, password, name);
      setLoading(false);
    }, 400);
  };

  const handleGoogleSignup = () => {
    setLoading(true);
    setTimeout(() => {
      signup('alex.google@example.com', 'google123', 'Alex Morgan');
      setLoading(false);
    }, 400);
  };

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 72px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        background: 'var(--bg-dark)'
      }}
    >
      <div
        className="spotify-card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '40px',
          background: '#12121a',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)'
        }}
      >
        {/* Brand Icon */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: 'var(--accent-green)',
              color: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              boxShadow: '0 0 20px var(--accent-green-glow)'
            }}
          >
            <Calendar size={28} />
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '6px' }}>Create your account</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem' }}>
            Start sharing your availability in minutes.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Full Name (Optional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Akhil Anil"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="name@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="input-group" style={{ marginBottom: '24px' }}>
            <label className="input-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create account'} <ArrowRight size={18} />
          </button>
        </form>

        {/* Divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            margin: '24px 0',
            color: 'var(--text-muted)',
            fontSize: '0.8rem'
          }}
        >
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
          <span>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
        </div>

        {/* Google SSO Mock */}
        <button
          type="button"
          className="btn btn-secondary"
          style={{ width: '100%', padding: '12px' }}
          onClick={handleGoogleSignup}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" style={{ marginRight: '8px' }}>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          Continue with Google
        </button>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '28px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <button
            onClick={() => navigate('/login')}
            style={{ background: 'none', border: 'none', color: 'var(--accent-green-bright)', fontWeight: '700', cursor: 'pointer' }}
          >
            Log in
          </button>
        </div>
      </div>
    </div>
  );
}
