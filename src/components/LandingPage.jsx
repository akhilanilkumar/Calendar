import React, { useState } from 'react';
import { ArrowRight, Calendar, Clock, CheckCircle, Copy, Share2, Sparkles, User, Lock, ExternalLink } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function LandingPage() {
  const { navigate, user } = useApp();
  const [selectedPreviewSlot, setSelectedPreviewSlot] = useState('10:00 AM');
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/akhil`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div style={{ background: 'var(--bg-dark)', color: 'var(--text-primary)' }}>
      {/* HERO SECTION */}
      <section style={{ padding: '80px 0 100px 0', position: 'relative', overflow: 'hidden' }}>
        {/* Subtle Spotify Background Glow */}
        <div
          style={{
            position: 'absolute',
            top: '-150px',
            right: '-100px',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(29, 185, 84, 0.15) 0%, rgba(0,0,0,0) 70%)',
            pointerEvents: 'none'
          }}
        />

        <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center' }}>
          {/* Left Content */}
          <div className="animate-fade-in">
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 16px',
                borderRadius: 'var(--radius-pill)',
                background: 'rgba(29, 185, 84, 0.1)',
                border: '1px solid rgba(29, 185, 84, 0.25)',
                color: 'var(--accent-green-bright)',
                fontSize: '0.85rem',
                fontWeight: '700',
                marginBottom: '24px'
              }}
            >
              <Sparkles size={16} /> Spotify-inspired scheduling
            </div>

            <h1
              style={{
                fontSize: '3.6rem',
                fontWeight: '800',
                lineHeight: '1.1',
                marginBottom: '24px',
                letterSpacing: '-0.03em'
              }}
            >
              Your time.<br />
              Your schedule.<br />
              <span style={{ color: 'var(--accent-green-bright)' }}>One link.</span>
            </h1>

            <p
              style={{
                fontSize: '1.2rem',
                color: 'var(--text-secondary)',
                lineHeight: '1.6',
                marginBottom: '36px',
                maxWidth: '500px'
              }}
            >
              Create your personal booking page and let people reserve a time that works for you. No friction, zero integrations required.
            </p>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <button
                className="btn btn-primary btn-lg"
                onClick={() => navigate(user ? '/dashboard' : '/signup')}
              >
                {user ? 'Go to Dashboard' : "Get Started — It's Free"} <ArrowRight size={20} />
              </button>
              <button
                className="btn btn-secondary btn-lg"
                onClick={() => {
                  const el = document.getElementById('how-it-works');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                See how it works
              </button>
            </div>

            {/* Quick Link Pill */}
            <div
              style={{
                marginTop: '40px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                background: '#14141c',
                padding: '10px 18px',
                borderRadius: 'var(--radius-pill)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.9rem'
              }}
            >
              <span style={{ color: 'var(--text-muted)' }}>Your link:</span>
              <code style={{ color: 'var(--accent-green-bright)', fontWeight: '700' }}>schedulify.com/akhil</code>
              <button
                onClick={handleCopyLink}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                title="Copy link"
              >
                {copiedLink ? <CheckCircle size={16} color="var(--accent-green)" /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          {/* Right Hero Booking Preview Card */}
          <div className="animate-fade-in" style={{ animationDelay: '0.15s' }}>
            <div
              className="spotify-card"
              style={{
                background: '#16161e',
                border: '1px solid rgba(29, 185, 84, 0.3)',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(29, 185, 84, 0.15)',
                padding: '32px',
                borderRadius: 'var(--radius-xl)'
              }}
            >
              {/* Profile Header */}
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #1DB954 0%, #106b2f 100%)',
                    color: '#fff',
                    fontSize: '1.5rem',
                    fontWeight: '800',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px auto',
                    boxShadow: '0 8px 20px var(--accent-green-glow)'
                  }}
                >
                  AA
                </div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: '800' }}>Akhil Anil</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Book a 1-hour slot • GMT +5:30
                </p>
              </div>

              {/* Month Header */}
              <div className="flex-between" style={{ marginBottom: '16px', background: '#101017', padding: '10px 16px', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-primary)' }}>August 2026</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-green)', fontWeight: '700' }}>● Available Days</span>
              </div>

              {/* Mini Calendar Grid Preview */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', textAlign: 'center', marginBottom: '24px' }}>
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                  <div key={i} style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>{day}</div>
                ))}
                {[20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31].map((d) => {
                  const isSelected = d === 25;
                  const isAvailable = [24, 25, 26, 27, 28].includes(d);
                  return (
                    <div
                      key={d}
                      style={{
                        padding: '8px 0',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        borderRadius: 'var(--radius-sm)',
                        background: isSelected ? 'var(--accent-green)' : (isAvailable ? '#1d1d28' : 'transparent'),
                        color: isSelected ? '#000' : (isAvailable ? '#fff' : 'var(--text-muted)'),
                        border: isSelected ? 'none' : (isAvailable ? '1px solid var(--border-subtle)' : 'none'),
                        cursor: isAvailable ? 'pointer' : 'default'
                      }}
                    >
                      {d}
                    </div>
                  );
                })}
              </div>

              {/* Time Slots Preview */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '10px' }}>
                  Available 1-Hour Slots
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {['09:00 AM', '10:00 AM', '11:00 AM'].map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setSelectedPreviewSlot(slot)}
                      style={{
                        padding: '10px',
                        borderRadius: 'var(--radius-md)',
                        border: selectedPreviewSlot === slot ? '2px solid var(--accent-green)' : '1px solid var(--border-subtle)',
                        background: selectedPreviewSlot === slot ? 'var(--accent-green-subtle)' : '#101017',
                        color: selectedPreviewSlot === slot ? 'var(--accent-green-bright)' : '#fff',
                        fontWeight: '700',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        transition: 'var(--transition-fast)'
                      }}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              {/* Test Button */}
              <button
                className="btn btn-primary"
                style={{ width: '100%' }}
                onClick={() => navigate('/akhil')}
              >
                Open Live Public Page ({selectedPreviewSlot}) <ExternalLink size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" style={{ padding: '100px 0', background: 'var(--bg-base)', borderTop: '1px solid var(--border-subtle)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '650px', margin: '0 auto 60px auto' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '16px' }}>
              Simple scheduling in 3 steps.
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
              Create your link, set your hours, and share. No complicated calendars or external software setups.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px' }}>
            {/* Step 1 */}
            <div className="spotify-card" style={{ padding: '36px' }}>
              <div
                style={{
                  fontSize: '2.5rem',
                  fontWeight: '900',
                  color: 'var(--accent-green)',
                  marginBottom: '16px',
                  fontFamily: 'var(--font-heading)'
                }}
              >
                01
              </div>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '12px' }}>Create your link</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '0.95rem' }}>
                Choose your username and claim your personal booking URL.
              </p>
              <div
                style={{
                  marginTop: '20px',
                  background: '#121218',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  fontFamily: 'monospace',
                  color: 'var(--accent-green-bright)',
                  fontSize: '0.875rem'
                }}
              >
                example.com/akhil
              </div>
            </div>

            {/* Step 2 */}
            <div className="spotify-card" style={{ padding: '36px' }}>
              <div
                style={{
                  fontSize: '2.5rem',
                  fontWeight: '900',
                  color: 'var(--accent-green)',
                  marginBottom: '16px',
                  fontFamily: 'var(--font-heading)'
                }}
              >
                02
              </div>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '12px' }}>Set your availability</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '0.95rem' }}>
                Define when you're available on each day of the week and block specific dates.
              </p>
              <div
                style={{
                  marginTop: '20px',
                  background: '#121218',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.85rem'
                }}
              >
                Mon–Fri • 09:00 AM – 05:00 PM
              </div>
            </div>

            {/* Step 3 */}
            <div className="spotify-card" style={{ padding: '36px' }}>
              <div
                style={{
                  fontSize: '2.5rem',
                  fontWeight: '900',
                  color: 'var(--accent-green)',
                  marginBottom: '16px',
                  fontFamily: 'var(--font-heading)'
                }}
              >
                03
              </div>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '12px' }}>Share & get booked</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '0.95rem' }}>
                Send your link. Guests choose a 1-hour slot and both receive instant email confirmations.
              </p>
              <div
                style={{
                  marginTop: '20px',
                  background: '#121218',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--accent-green-bright)',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <CheckCircle size={16} /> Instant Confirmation Emails
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCT SHOWCASE SECTION */}
      <section style={{ padding: '100px 0', background: 'var(--bg-dark)', borderTop: '1px solid var(--border-subtle)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 60px auto' }}>
            <div className="badge badge-green" style={{ marginBottom: '16px' }}>Product Showcase</div>
            <h2 style={{ fontSize: '2.6rem', fontWeight: '800', marginBottom: '16px' }}>
              A calendar people actually want to use.
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
              Dark, bold, visual, and simple. Designed to give guests a friction-free booking experience in under 30 seconds.
            </p>
          </div>

          {/* Large Interactive Card Showcase */}
          <div
            className="spotify-card"
            style={{
              maxWidth: '900px',
              margin: '0 auto',
              padding: '48px',
              background: '#14141c',
              border: '1px solid var(--border-bright)',
              borderRadius: 'var(--radius-xl)'
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      background: 'var(--accent-green)',
                      color: '#000',
                      fontSize: '1.25rem',
                      fontWeight: '800',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    AA
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.4rem' }}>Akhil Anil</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>example.com/akhil</p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-secondary)' }}>
                    <Clock size={18} color="var(--accent-green)" />
                    <span>Exact 60-minute meeting duration</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-secondary)' }}>
                    <Lock size={18} color="var(--accent-green)" />
                    <span>Strict double-booking prevention engine</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-secondary)' }}>
                    <User size={18} color="var(--accent-green)" />
                    <span>No account creation required for guests</span>
                  </div>
                </div>

                <button
                  className="btn btn-primary"
                  onClick={() => navigate('/akhil')}
                >
                  Test Live Booking Experience
                </button>
              </div>

              <div style={{ background: '#09090d', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px', fontWeight: '700' }}>
                  BOOKING PREVIEW
                </div>
                <div style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '16px' }}>
                  Select Time Slot • Tuesday, Aug 25
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {['09:00 AM – 10:00 AM', '10:00 AM – 11:00 AM', '11:00 AM – 12:00 PM', '02:00 PM – 03:00 PM'].map((slot, i) => (
                    <div
                      key={slot}
                      style={{
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-md)',
                        background: i === 1 ? 'var(--accent-green-subtle)' : '#161620',
                        border: i === 1 ? '1px solid var(--accent-green)' : '1px solid var(--border-subtle)',
                        color: i === 1 ? 'var(--accent-green-bright)' : 'var(--text-primary)',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <span>{slot}</span>
                      {i === 1 && <span style={{ fontSize: '0.75rem', fontWeight: '800' }}>SELECTED</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" style={{ padding: '100px 0', background: 'var(--bg-base)', borderTop: '1px solid var(--border-subtle)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 60px auto' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '16px' }}>
              Everything you need. Nothing you don't.
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
              Stripped down to the essential MVP features for ultra-fast performance.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', maxWidth: '900px', margin: '0 auto' }}>
            <div className="spotify-card">
              <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', color: 'var(--accent-green-bright)' }}>Personal booking link</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                One simple, memorable URL you can place in your email signature, LinkedIn bio, or WhatsApp messages.
              </p>
            </div>

            <div className="spotify-card">
              <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', color: 'var(--accent-green-bright)' }}>Your availability</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                Set your custom weekly working hours, configure timezones, and block specific dates whenever needed.
              </p>
            </div>

            <div className="spotify-card">
              <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', color: 'var(--accent-green-bright)' }}>One-hour meetings</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                Every reservation is a clean 60-minute slot. Prevents meeting bloat and keeps your schedule structured.
              </p>
            </div>

            <div className="spotify-card">
              <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', color: 'var(--accent-green-bright)' }}>Instant confirmation</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                Both host and guest instantly receive full confirmation emails containing date, time, timezone, and guest details.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section style={{ padding: '100px 0', background: 'var(--bg-dark)', borderTop: '1px solid var(--border-subtle)' }}>
        <div className="container">
          <div
            style={{
              background: 'linear-gradient(135deg, #14141c 0%, #102a19 100%)',
              border: '1px solid rgba(29, 185, 84, 0.4)',
              borderRadius: 'var(--radius-xl)',
              padding: '80px 40px',
              textAlign: 'center',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)'
            }}
          >
            <h2 style={{ fontSize: '3.2rem', fontWeight: '800', marginBottom: '16px', letterSpacing: '-0.03em' }}>
              Stop asking<br />
              <span style={{ color: 'var(--accent-green-bright)' }}>"When are you free?"</span>
            </h2>

            <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '36px', maxWidth: '500px', margin: '0 auto 36px auto' }}>
              Give people a single link instead and let them reserve a 1-hour slot in seconds.
            </p>

            <button
              className="btn btn-primary btn-lg"
              onClick={() => navigate(user ? '/dashboard' : '/signup')}
            >
              Create your booking page <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: '40px 0', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-dark)' }}>
        <div className="container flex-between" style={{ flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Calendar size={20} color="var(--accent-green)" />
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: '800', fontSize: '1.1rem' }}>Schedulify</span>
          </div>

          <div style={{ display: 'flex', gap: '24px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            <a href="#how-it-works" onClick={(e) => { e.preventDefault(); navigate('/'); }}>How it works</a>
            <a href="#features" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Features</a>
            <a href="/login" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>Login</a>
            <a href="/signup" onClick={(e) => { e.preventDefault(); navigate('/signup'); }}>Sign up</a>
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            © 2026 Schedulify • Spotify-Inspired Booking MVP
          </div>
        </div>
      </footer>
    </div>
  );
}
