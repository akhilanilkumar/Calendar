import React, { useState, useEffect } from 'react';
import { Copy, ExternalLink, Calendar, Clock, User, Check, X, Ban, Settings, Plus, Mail } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { apiGetAvailability, apiSaveAvailability, apiBlockDate, apiUnblockDate, apiGetBookings } from '../utils/api';

export default function Dashboard() {
  const { user, updateProfile, cancelBooking, navigate, showToast } = useApp();
  const [activeTab, setActiveTab] = useState('HOME'); // 'HOME', 'MEETINGS', 'AVAILABILITY', 'SETTINGS'
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  // Availability State
  const [schedule, setSchedule] = useState({ timezone: 'Asia/Kolkata (GMT +5:30)', days: {}, blockedDates: [] });
  const [newBlockedDate, setNewBlockedDate] = useState('');

  // Bookings State
  const [bookings, setBookings] = useState([]);

  // Profile Settings State
  const [profileName, setProfileName] = useState(user ? user.name : '');
  const [profileUsername, setProfileUsername] = useState(user ? user.username : '');
  const [profileBio, setProfileBio] = useState(user ? user.bio : '');

  const hostUsername = user ? user.username : 'akhil';
  const upcomingBookings = bookings.filter(b => b.status === 'confirmed');

  // Fetch data on mount
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [avail, bks] = await Promise.all([
          apiGetAvailability(hostUsername),
          apiGetBookings()
        ]);
        setSchedule(avail);
        setBookings(bks);
      } catch (err) {
        console.error('Dashboard data fetch error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [hostUsername]);

  const publicUrl = `${window.location.origin}/${hostUsername}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    showToast('Booking link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveAvailabilityForm = async (e) => {
    e.preventDefault();
    try {
      await apiSaveAvailability(schedule.timezone, schedule.days);
      showToast('Availability settings saved!');
    } catch (err) {
      showToast(err.message || 'Failed to save', 'error');
    }
  };

  const handleToggleDay = (dayName) => {
    setSchedule(prev => ({
      ...prev,
      days: {
        ...prev.days,
        [dayName]: { ...prev.days[dayName], enabled: !prev.days[dayName].enabled }
      }
    }));
  };

  const handleTimeChange = (dayName, field, value) => {
    setSchedule(prev => ({
      ...prev,
      days: {
        ...prev.days,
        [dayName]: { ...prev.days[dayName], [field]: value }
      }
    }));
  };

  const handleAddBlockedDate = async () => {
    if (!newBlockedDate) return;
    if (schedule.blockedDates && schedule.blockedDates.includes(newBlockedDate)) return;
    try {
      await apiBlockDate(newBlockedDate);
      setSchedule(prev => ({ ...prev, blockedDates: [...(prev.blockedDates || []), newBlockedDate] }));
      setNewBlockedDate('');
      showToast(`Blocked date ${newBlockedDate}`);
    } catch (err) {
      showToast(err.message || 'Failed to block date', 'error');
    }
  };

  const handleRemoveBlockedDate = async (dateStr) => {
    try {
      await apiUnblockDate(dateStr);
      setSchedule(prev => ({ ...prev, blockedDates: (prev.blockedDates || []).filter(d => d !== dateStr) }));
      showToast(`Unblocked date ${dateStr}`);
    } catch (err) {
      showToast(err.message || 'Failed to unblock date', 'error');
    }
  };

  const handleCancelBookingLocal = async (bookingId) => {
    await cancelBooking(bookingId);
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    await updateProfile({
      name: profileName,
      username: profileUsername,
      bio: profileBio
    });
  };

  return (
    <div style={{ background: 'var(--bg-dark)', minHeight: 'calc(100vh - 72px)', padding: '40px 0' }}>
      <div className="container">
        {/* Header Greeting */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '2.4rem', fontWeight: '800', marginBottom: '4px' }}>
            Good afternoon, {user ? user.name || user.username : 'Akhil'} 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
            Your booking page is ready to share.
          </p>
        </div>

        {/* Spotify-style Tabs Navigation */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '32px',
            background: '#14141c',
            padding: '6px',
            borderRadius: 'var(--radius-pill)',
            width: 'fit-content',
            border: '1px solid var(--border-subtle)'
          }}
        >
          {['HOME', 'MEETINGS', 'AVAILABILITY', 'SETTINGS'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '10px 24px',
                borderRadius: 'var(--radius-pill)',
                border: 'none',
                fontFamily: 'var(--font-heading)',
                fontWeight: '700',
                fontSize: '0.875rem',
                cursor: 'pointer',
                background: activeTab === tab ? 'var(--accent-green)' : 'transparent',
                color: activeTab === tab ? '#000000' : 'var(--text-secondary)',
                transition: 'var(--transition-fast)'
              }}
            >
              {tab === 'HOME' && 'Home'}
              {tab === 'MEETINGS' && `Upcoming (${upcomingBookings.length})`}
              {tab === 'AVAILABILITY' && 'Availability'}
              {tab === 'SETTINGS' && 'Settings'}
            </button>
          ))}
        </div>

        {/* TAB 1: HOME */}
        {activeTab === 'HOME' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              {/* Booking Link Card */}
              <div
                className="spotify-card"
                style={{
                  background: 'linear-gradient(135deg, #181824 0%, #0d2817 100%)',
                  border: '1px solid rgba(29, 185, 84, 0.4)',
                  padding: '36px'
                }}
              >
                <div className="badge badge-green" style={{ marginBottom: '14px' }}>
                  YOUR BOOKING LINK
                </div>
                <h2
                  style={{
                    fontSize: '1.8rem',
                    fontWeight: '800',
                    color: '#fff',
                    marginBottom: '20px',
                    wordBreak: 'break-all'
                  }}
                >
                  {publicUrl}
                </h2>

                <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                  <button className="btn btn-primary" onClick={handleCopy}>
                    {copied ? <Check size={18} /> : <Copy size={18} />} {copied ? 'Copied!' : 'Copy link'}
                  </button>
                  <button className="btn btn-secondary" onClick={() => navigate(`/${hostUsername}`)}>
                    <ExternalLink size={18} /> Open booking page
                  </button>
                </div>
              </div>

              {/* Upcoming Meetings List */}
              <div className="spotify-card">
                <div className="flex-between" style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>UPCOMING MEETINGS</h3>
                  <button
                    onClick={() => setActiveTab('MEETINGS')}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-green-bright)', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}
                  >
                    View All
                  </button>
                </div>

                {upcomingBookings.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {upcomingBookings.slice(0, 3).map((bk) => (
                      <div
                        key={bk.id}
                        style={{
                          background: '#121218',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-md)',
                          padding: '16px 20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '1.05rem', color: '#fff' }}>
                            {bk.guestName}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            {bk.guestEmail} • 1 hour meeting
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--accent-green-bright)', marginTop: '4px', fontWeight: '600' }}>
                            📅 {bk.date} @ {bk.timeSlot}
                          </div>
                        </div>

                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleCancelBookingLocal(bk.id)}
                        >
                          Cancel
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-muted)' }}>
                    No upcoming meetings yet. Share your booking link to start receiving reservations!
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar Summary Card */}
            <div>
              <div className="spotify-card">
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '16px' }}>YOUR AVAILABILITY</h3>
                <div style={{ marginBottom: '16px', color: 'var(--text-secondary)', fontSize: '0.925rem' }}>
                  <strong style={{ color: '#fff' }}>Working Days:</strong><br />
                  Mon — Fri<br />
                  <span style={{ color: 'var(--accent-green-bright)', fontWeight: '700' }}>09:00 AM — 05:00 PM</span>
                </div>
                <div style={{ marginBottom: '24px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Timezone: {schedule.timezone || 'Asia/Kolkata (GMT +5:30)'}
                </div>

                <button
                  className="btn btn-outline"
                  style={{ width: '100%' }}
                  onClick={() => setActiveTab('AVAILABILITY')}
                >
                  Edit availability
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MEETINGS */}
        {activeTab === 'MEETINGS' && (
          <div className="spotify-card">
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '24px' }}>All Reservations</h2>

            {bookings.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {bookings.map((bk) => (
                  <div
                    key={bk.id}
                    style={{
                      background: '#12121a',
                      border: bk.status === 'confirmed' ? '1px solid var(--border-subtle)' : '1px dashed var(--danger-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: '800', fontSize: '1.1rem' }}>{bk.guestName}</span>
                        {bk.status === 'confirmed' ? (
                          <span className="badge badge-green">CONFIRMED</span>
                        ) : (
                          <span className="badge badge-danger">CANCELLED</span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        Email: {bk.guestEmail}
                      </div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--accent-green-bright)', fontWeight: '700', marginTop: '6px' }}>
                        {bk.date} • {bk.timeSlot} ({bk.timezone})
                      </div>
                      {bk.message && (
                        <div style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          "{bk.message}"
                        </div>
                      )}
                    </div>

                    {bk.status === 'confirmed' && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleCancelBookingLocal(bk.id)}
                      >
                        Cancel Reservation
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                No reservations found.
              </div>
            )}
          </div>
        )}

        {/* TAB 3: AVAILABILITY */}
        {activeTab === 'AVAILABILITY' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
            <div className="spotify-card">
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '24px' }}>Weekly Availability</h2>

              <form onSubmit={handleSaveAvailabilityForm}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '28px' }}>
                  {Object.keys(schedule.days).map((dayName) => {
                    const config = schedule.days[dayName];
                    return (
                      <div
                        key={dayName}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '14px 18px',
                          background: '#0c0c12',
                          borderRadius: 'var(--radius-md)',
                          border: config.enabled ? '1px solid rgba(29, 185, 84, 0.3)' : '1px solid var(--border-subtle)'
                        }}
                      >
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

                        {config.enabled ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                              type="text"
                              className="form-input"
                              style={{ width: '90px', padding: '6px 10px', fontSize: '0.85rem' }}
                              value={config.start}
                              onChange={(e) => handleTimeChange(dayName, 'start', e.target.value)}
                            />
                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                            <input
                              type="text"
                              className="form-input"
                              style={{ width: '90px', padding: '6px 10px', fontSize: '0.85rem' }}
                              value={config.end}
                              onChange={(e) => handleTimeChange(dayName, 'end', e.target.value)}
                            />
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

                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </form>
            </div>

            {/* Date Blocker Card */}
            <div>
              <div className="spotify-card">
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '16px' }}>Block Specific Dates</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Prevent bookings on holidays or vacation days.
                </p>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                  <input
                    type="date"
                    className="form-input"
                    value={newBlockedDate}
                    onChange={(e) => setNewBlockedDate(e.target.value)}
                  />
                  <button className="btn btn-secondary btn-sm" onClick={handleAddBlockedDate}>
                    <Plus size={16} /> Block
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(schedule.blockedDates || []).map((dateStr) => (
                    <div
                      key={dateStr}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: '#121218',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.875rem'
                      }}
                    >
                      <span style={{ fontWeight: '700', color: 'var(--danger)' }}>🚫 {dateStr}</span>
                      <button
                        onClick={() => handleRemoveBlockedDate(dateStr)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SETTINGS */}
        {activeTab === 'SETTINGS' && (
          <div className="spotify-card" style={{ maxWidth: '600px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '24px' }}>Account Settings</h2>

            <form onSubmit={handleSaveProfile}>
              <div className="input-group">
                <label className="input-label">Display Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Username (URL Slug)</label>
                <input
                  type="text"
                  className="form-input"
                  value={profileUsername}
                  onChange={(e) => setProfileUsername(e.target.value)}
                />
              </div>

              <div className="input-group" style={{ marginBottom: '28px' }}>
                <label className="input-label">Short Description / Bio</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={profileBio}
                  onChange={(e) => setProfileBio(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary">
                Update Profile
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
