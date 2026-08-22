import React, { useState, useEffect } from 'react';
import { Check, X, ArrowRight, Link as LinkIcon, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function UsernameSetup() {
  const { user, updateProfile, checkUsernameAvailable, navigate, showToast } = useApp();
  const [username, setUsername] = useState(user ? user.username : 'myname');
  const [isAvailable, setIsAvailable] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!username.trim()) {
      setIsAvailable(false);
      return;
    }
    setChecking(true);
    const timer = setTimeout(async () => {
      const avail = await checkUsernameAvailable(username);
      setIsAvailable(avail);
      setChecking(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [username, user, checkUsernameAvailable]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAvailable || !username) return;

    if (user) {
      await updateProfile({ username: username.toLowerCase().trim() });
    }
    showToast('Username set successfully!');
    navigate('/setup/availability');
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
          maxWidth: '520px',
          padding: '44px',
          background: '#12121a',
          border: '1px solid rgba(29, 185, 84, 0.3)',
          borderRadius: 'var(--radius-xl)'
        }}
      >
        {/* Step Indicator */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
          <div style={{ flex: 1, height: '4px', background: 'var(--accent-green)', borderRadius: '2px' }} />
          <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }} />
        </div>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'var(--accent-green-subtle)',
              color: 'var(--accent-green)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto'
            }}
          >
            <LinkIcon size={28} />
          </div>
          <h2 style={{ fontSize: '1.9rem', fontWeight: '800', marginBottom: '8px' }}>Create your personal link</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Choose a unique username for your public 1-hour booking page.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group" style={{ marginBottom: '24px' }}>
            <label className="input-label">Public Meeting URL</label>
            <div style={{ display: 'flex', alignItems: 'center', background: '#09090d', border: '1px solid var(--border-bright)', borderRadius: 'var(--radius-md)', padding: '4px 14px' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: '700', fontSize: '0.95rem', select: 'none' }}>
                schedulify.com/
              </span>
              <input
                type="text"
                className="form-input"
                style={{ background: 'transparent', border: 'none', boxShadow: 'none', padding: '10px 4px', fontWeight: '700', color: 'var(--accent-green-bright)' }}
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                placeholder="username"
                required
              />
            </div>

            {/* Live Validation Feedback */}
            <div style={{ marginTop: '10px', height: '24px', fontSize: '0.875rem', fontWeight: '600' }}>
              {checking ? (
                <span style={{ color: 'var(--text-muted)' }}>Checking availability...</span>
              ) : isAvailable ? (
                <span style={{ color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Check size={18} /> ✓ This username is available
                </span>
              ) : (
                <span style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <X size={18} /> ✕ This username is already taken
                </span>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%' }}
            disabled={!isAvailable || checking}
          >
            Continue <ArrowRight size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
