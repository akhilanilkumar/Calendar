import React, { useState } from 'react';
import { Clock, ArrowRight, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getUserAvailability } from '../utils/storage';

export default function AvailabilitySetup() {
  const { user, saveAvailability, navigate, showToast } = useApp();
  const initialSchedule = getUserAvailability(user ? user.username : 'akhil');

  const [days, setDays] = useState(initialSchedule.days);
  const [timezone, setTimezone] = useState(initialSchedule.timezone || 'Asia/Kolkata (GMT +5:30)');

  const timeOptions = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
  ];

  const handleToggleDay = (dayName) => {
    setDays(prev => ({
      ...prev,
      [dayName]: { ...prev[dayName], enabled: !prev[dayName].enabled }
    }));
  };

  const handleTimeChange = (dayName, field, value) => {
    setDays(prev => ({
      ...prev,
      [dayName]: { ...prev[dayName], [field]: value }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveAvailability({
      timezone,
      days,
      blockedDates: initialSchedule.blockedDates || []
    });
    showToast('Setup complete! Your booking page is live.');
    navigate('/dashboard');
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
          maxWidth: '640px',
          padding: '44px',
          background: '#12121a',
          border: '1px solid rgba(29, 185, 84, 0.3)',
          borderRadius: 'var(--radius-xl)'
        }}
      >
        {/* Step Indicator */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
          <div style={{ flex: 1, height: '4px', background: 'var(--accent-green)', borderRadius: '2px' }} />
          <div style={{ flex: 1, height: '4px', background: 'var(--accent-green)', borderRadius: '2px' }} />
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
            <Clock size={28} />
          </div>
          <h2 style={{ fontSize: '1.9rem', fontWeight: '800', marginBottom: '8px' }}>When can people book you?</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Set your weekly working hours. You can customize this anytime later.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Weekly Days Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
            {Object.keys(days).map((dayName) => {
              const config = days[dayName];
              return (
                <div
                  key={dayName}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 18px',
                    background: '#0a0a0e',
                    borderRadius: 'var(--radius-md)',
                    border: config.enabled ? '1px solid rgba(29, 185, 84, 0.3)' : '1px solid var(--border-subtle)'
                  }}
                >
                  {/* Day Label + Toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', width: '150px' }}>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={config.enabled}
                        onChange={() => handleToggleDay(dayName)}
                      />
                      <span className="toggle-slider" />
                    </label>
                    <span style={{ fontWeight: '700', fontSize: '0.95rem', color: config.enabled ? '#fff' : 'var(--text-muted)' }}>
                      {dayName}
                    </span>
                  </div>

                  {/* Start and End Pickers */}
                  {config.enabled ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <select
                        className="form-select"
                        style={{ padding: '8px 12px', fontSize: '0.85rem', width: '100px' }}
                        value={config.start}
                        onChange={(e) => handleTimeChange(dayName, 'start', e.target.value)}
                      >
                        {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                      <select
                        className="form-select"
                        style={{ padding: '8px 12px', fontSize: '0.85rem', width: '100px' }}
                        value={config.end}
                        onChange={(e) => handleTimeChange(dayName, 'end', e.target.value)}
                      >
                        {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      Unavailable
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Timezone */}
          <div className="input-group" style={{ marginBottom: '32px' }}>
            <label className="input-label">Timezone</label>
            <select
              className="form-select"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            >
              <option value="Asia/Kolkata (GMT +5:30)">Asia/Kolkata (GMT +5:30)</option>
              <option value="UTC (GMT +0:00)">UTC (GMT +0:00)</option>
              <option value="America/New_York (EST)">America/New_York (EST)</option>
              <option value="America/Los_Angeles (PST)">America/Los_Angeles (PST)</option>
              <option value="Europe/London (GMT)">Europe/London (GMT)</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
            Save Availability & Finish Setup <Check size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
