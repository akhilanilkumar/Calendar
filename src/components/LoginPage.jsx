import React, { useState } from 'react';
import { Calendar, ArrowRight, Lock, Mail } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function LoginPage() {
  const { login, navigate, showToast } = useApp();
  const [email, setEmail] = useState('akhil@example.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setTimeout(() => {
      login(email, password);
      setLoading(false);
    }, 400);
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    showToast(`Password reset link sent to ${resetEmail || email}!`);
    setIsForgotModalOpen(false);
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
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '6px' }}>Welcome back</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem' }}>
            Log in to manage your 1-hour availability & bookings.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
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

          <div className="input-group" style={{ marginBottom: '16px' }}>
            <div className="flex-between" style={{ marginBottom: '8px' }}>
              <label className="input-label" style={{ marginBottom: 0 }}>Password</label>
              <button
                type="button"
                onClick={() => { setResetEmail(email); setIsForgotModalOpen(true); }}
                style={{ background: 'none', border: 'none', color: 'var(--accent-green-bright)', fontSize: '0.8rem', cursor: 'pointer' }}
              >
                Forgot password?
              </button>
            </div>
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
            style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: '12px' }}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Log in'} <ArrowRight size={18} />
          </button>
        </form>

        {/* Demo Credentials Tip */}
        <div
          style={{
            marginTop: '24px',
            background: 'var(--accent-green-subtle)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(29, 185, 84, 0.2)',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)'
          }}
        >
          <strong style={{ color: 'var(--accent-green-bright)' }}>Demo Account pre-filled:</strong><br />
          Email: <code style={{ color: '#fff' }}>akhil@example.com</code><br />
          Username: <code style={{ color: '#fff' }}>akhil</code>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '28px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <button
            onClick={() => navigate('/signup')}
            style={{ background: 'none', border: 'none', color: 'var(--accent-green-bright)', fontWeight: '700', cursor: 'pointer' }}
          >
            Sign up
          </button>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsForgotModalOpen(false)}>
          <div
            className="spotify-card animate-fade-in"
            style={{ maxWidth: '400px', width: '100%', padding: '28px', background: '#14141c' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Reset your password</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Enter your account email address and we'll send you a password reset link.
            </p>
            <form onSubmit={handleForgotSubmit}>
              <div className="input-group">
                <label className="input-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsForgotModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Send Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
