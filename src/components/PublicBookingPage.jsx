import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Globe, ArrowLeft, Check, CheckCircle2, User, Mail, MessageSquare, AlertCircle, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
import { apiGetUserByUsername, apiGetSlots } from '../utils/api';

export default function PublicBookingPage({ targetUsername }) {
  const { createBooking, openEmailInspector, navigate } = useApp();

  // Find host user (async)
  const username = (targetUsername || 'akhil').toLowerCase().trim();
  const [hostUser, setHostUser] = useState(null);
  const [hostLoading, setHostLoading] = useState(true);

  // Calendar State
  const [currentDateObj, setCurrentDateObj] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(() => {
    const today = new Date();
    const tm = new Date(today);
    tm.setDate(tm.getDate() + 1);
    const y = tm.getFullYear();
    const m = String(tm.getMonth() + 1).padStart(2, '0');
    const d = String(tm.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });

  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [hostTimezone, setHostTimezone] = useState('Asia/Kolkata (GMT +5:30)');

  // Booking Form State
  const [step, setStep] = useState('SLOT'); // 'SLOT', 'FORM', 'CONFIRMED'
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch host user on mount
  useEffect(() => {
    (async () => {
      setHostLoading(true);
      try {
        const user = await apiGetUserByUsername(username);
        setHostUser(user);
        setHostTimezone(user.timezone || 'Asia/Kolkata (GMT +5:30)');
      } catch {
        setHostUser(null);
      } finally {
        setHostLoading(false);
      }
    })();
  }, [username]);

  // Fetch slots when selectedDateStr or username changes
  useEffect(() => {
    if (!selectedDateStr || !hostUser) return;
    (async () => {
      setSlotsLoading(true);
      try {
        const data = await apiGetSlots(username, selectedDateStr);
        setAvailableSlots(data.slots || []);
        if (data.timezone) setHostTimezone(data.timezone);
      } catch {
        setAvailableSlots([]);
      } finally {
        setSlotsLoading(false);
      }
      setSelectedSlot(null);
    })();
  }, [username, selectedDateStr, hostUser]);

  // Handle Confetti on Success
  useEffect(() => {
    if (step === 'CONFIRMED') {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#1DB954', '#1ED760', '#ffffff']
        });
      } catch (e) {
        // ignore fallback
      }
    }
  }, [step]);

  if (hostLoading) {
    return (
      <div style={{ minHeight: 'calc(100vh - 72px)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)' }}>
        <Loader2 size={40} color="var(--accent-green)" style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!hostUser) {
    return (
      <div
        style={{
          minHeight: 'calc(100vh - 72px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          background: 'var(--bg-dark)',
          textAlign: 'center'
        }}
      >
        <div className="spotify-card" style={{ maxWidth: '440px', padding: '40px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔍</div>
          <h2 style={{ fontSize: '1.6rem', marginBottom: '8px' }}>User Not Found</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            The booking link <strong>example.com/{username}</strong> does not exist.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/signup')}>
            Claim this username
          </button>
        </div>
      </div>
    );
  }

  // Month navigation helpers
  const year = currentDateObj.getFullYear();
  const month = currentDateObj.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sun

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    setCurrentDateObj(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDateObj(new Date(year, month + 1, 1));
  };

  const handleSelectDate = (d) => {
    const monthStr = String(month + 1).padStart(2, '0');
    const dayStr = String(d).padStart(2, '0');
    const dateStr = `${year}-${monthStr}-${dayStr}`;
    setSelectedDateStr(dateStr);
  };

  const handleReserveSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSlot || !guestName || !guestEmail) return;

    setIsSubmitting(true);
    setErrorMsg('');

    const res = await createBooking({
      hostUsername: username,
      hostName: hostUser.name || username,
      guestName,
      guestEmail,
      date: selectedDateStr,
      slot: selectedSlot,
      timezone: hostTimezone,
      message
    });

    setIsSubmitting(false);

    if (res.success) {
      setConfirmedBooking(res.booking);
      setStep('CONFIRMED');
    } else {
      setErrorMsg(res.error === 'DOUBLE_BOOKING_CONFLICT'
        ? 'This time slot has just been reserved by someone else! Please select another time slot.'
        : 'Failed to reserve slot. Please try again.');
    }
  };

  return (
    <div style={{ background: 'var(--bg-dark)', minHeight: 'calc(100vh - 72px)', padding: '40px 20px' }}>
      <div className="container" style={{ maxWidth: '1000px' }}>
        
        {/* STEP 3: BOOKING CONFIRMED SCREEN */}
        {step === 'CONFIRMED' && confirmedBooking ? (
          <div
            className="spotify-card animate-fade-in"
            style={{
              maxWidth: '580px',
              margin: '40px auto',
              padding: '48px',
              textAlign: 'center',
              background: '#12121a',
              border: '1px solid var(--accent-green-glow)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 40px var(--accent-green-glow)'
            }}
          >
            <div
              className="animate-glow"
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'var(--accent-green)',
                color: '#000000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px auto'
              }}
            >
              <Check size={40} strokeWidth={3} />
            </div>

            <h2 style={{ fontSize: '2.2rem', fontWeight: '800', marginBottom: '8px' }}>You're booked!</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginBottom: '32px' }}>
              Your meeting with <strong style={{ color: '#fff' }}>{confirmedBooking.hostName}</strong> is confirmed.
            </p>

            {/* Confirmed Details Card */}
            <div
              style={{
                background: '#09090d',
                padding: '24px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                marginBottom: '32px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <CalendarIcon size={20} color="var(--accent-green)" />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>DATE & TIME</div>
                  <div style={{ fontWeight: '700', fontSize: '1.05rem' }}>
                    {confirmedBooking.date} • {confirmedBooking.timeSlot}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Globe size={20} color="var(--accent-green)" />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TIMEZONE</div>
                  <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{confirmedBooking.timezone}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <User size={20} color="var(--accent-green)" />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>GUEST NAME & EMAIL</div>
                  <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>
                    {confirmedBooking.guestName} ({confirmedBooking.guestEmail})
                  </div>
                </div>
              </div>
            </div>

            {/* Email Notification Notice */}
            <div
              style={{
                background: 'var(--accent-green-subtle)',
                padding: '14px 20px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(29, 185, 84, 0.25)',
                fontSize: '0.9rem',
                color: 'var(--accent-green-bright)',
                marginBottom: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}
            >
              <CheckCircle2 size={18} /> Confirmation emails dispatched to guest & host!
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                className="btn btn-primary"
                onClick={() => openEmailInspector()}
              >
                <Mail size={18} /> View Confirmation Emails
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => { setStep('SLOT'); setSelectedSlot(null); }}
              >
                Book Another Time
              </button>
            </div>
          </div>
        ) : step === 'FORM' && selectedSlot ? (
          /* STEP 2: BOOKING FORM */
          <div
            className="spotify-card animate-fade-in"
            style={{
              maxWidth: '540px',
              margin: '40px auto',
              padding: '40px',
              background: '#12121a',
              borderRadius: 'var(--radius-xl)'
            }}
          >
            <button
              onClick={() => setStep('SLOT')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '24px'
              }}
            >
              <ArrowLeft size={16} /> Back to slot selection
            </button>

            <h2 style={{ fontSize: '1.6rem', fontWeight: '800', marginBottom: '8px' }}>Confirm your meeting</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', marginBottom: '24px' }}>
              Reserve a 1-hour slot with <strong style={{ color: '#fff' }}>{hostUser.name || username}</strong>.
            </p>

            {/* Selected Slot Summary Badge */}
            <div
              style={{
                background: '#09090d',
                padding: '16px 20px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--accent-green-glow)',
                marginBottom: '28px',
                color: 'var(--accent-green-bright)',
                fontWeight: '700',
                fontSize: '0.95rem'
              }}
            >
              📅 {selectedDateStr} • ⏰ {selectedSlot.label}<br />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                Timezone: {hostTimezone}
              </span>
            </div>

            {errorMsg && (
              <div
                style={{
                  background: 'var(--danger-subtle)',
                  color: 'var(--danger)',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '20px',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <AlertCircle size={18} /> {errorMsg}
              </div>
            )}

            <form onSubmit={handleReserveSubmit}>
              <div className="input-group">
                <label className="input-label">Your Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. John Doe"
                  required
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Your Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="john@example.com"
                  required
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                />
              </div>

              <div className="input-group" style={{ marginBottom: '28px' }}>
                <label className="input-label">Message (Optional)</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="What would you like to discuss during our meeting?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{ width: '100%' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Reserving Slot...' : 'Reserve Meeting'}
              </button>
            </form>
          </div>
        ) : (
          /* STEP 1: CALENDAR & 1-HOUR SLOT SELECTION */
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 300px', gap: '30px', alignItems: 'start' }}>
            
            {/* Host Info Column */}
            <div className="spotify-card" style={{ background: '#12121a' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'var(--accent-green)',
                  color: '#000',
                  fontSize: '1.5rem',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                  boxShadow: '0 0 20px var(--accent-green-glow)'
                }}
              >
                {(hostUser.name || username).substring(0, 2).toUpperCase()}
              </div>

              <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '4px' }}>
                {hostUser.name || username}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
                @{hostUser.username}
              </p>

              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '24px' }}>
                {hostUser.bio || 'Book a 1-hour slot with me.'}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  <Clock size={16} color="var(--accent-green)" />
                  <span>1 Hour Slot</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <Globe size={16} color="var(--accent-green)" />
                  <span>{hostTimezone}</span>
                </div>
              </div>
            </div>

            {/* Calendar Column */}
            <div className="spotify-card" style={{ background: '#12121a' }}>
              <div className="flex-between" style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800' }}>
                  {monthNames[month]} {year}
                </h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-secondary btn-sm" onClick={handlePrevMonth}>&lt;</button>
                  <button className="btn btn-secondary btn-sm" onClick={handleNextMonth}>&gt;</button>
                </div>
              </div>

              {/* Day Headers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textAlign: 'center', marginBottom: '12px' }}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>{d}</div>
                ))}
              </div>

              {/* Day Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
                {Array.from({ length: firstDayIndex }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}

                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const dayNum = idx + 1;
                  const monthStr = String(month + 1).padStart(2, '0');
                  const dayStr = String(dayNum).padStart(2, '0');
                  const dateStr = `${year}-${monthStr}-${dayStr}`;

                  const isSelected = selectedDateStr === dateStr;

                  return (
                    <button
                      key={dayNum}
                      onClick={() => handleSelectDate(dayNum)}
                      style={{
                        padding: '12px 0',
                        borderRadius: 'var(--radius-md)',
                        border: isSelected ? '2px solid var(--accent-green)' : '1px solid var(--border-subtle)',
                        background: isSelected ? 'var(--accent-green)' : '#09090d',
                        color: isSelected ? '#000000' : '#ffffff',
                        fontWeight: '700',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        transition: 'var(--transition-fast)'
                      }}
                    >
                      {dayNum}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Slots Column */}
            <div className="spotify-card" style={{ background: '#12121a' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', marginBottom: '8px' }}>Available Slots</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                {selectedDateStr}
              </p>

              {availableSlots.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '380px', overflowY: 'auto' }}>
                  {availableSlots.map((slot) => {
                    const isSelected = selectedSlot && selectedSlot.startTime === slot.startTime;
                    return (
                      <button
                        key={slot.startTime}
                        disabled={slot.isBooked}
                        onClick={() => setSelectedSlot(slot)}
                        style={{
                          padding: '12px 16px',
                          borderRadius: 'var(--radius-md)',
                          border: isSelected
                            ? '2px solid var(--accent-green)'
                            : (slot.isBooked ? '1px solid var(--border-subtle)' : '1px solid var(--border-subtle)'),
                          background: isSelected
                            ? 'var(--accent-green)'
                            : (slot.isBooked ? '#16161f' : '#09090d'),
                          color: isSelected
                            ? '#000000'
                            : (slot.isBooked ? 'var(--text-muted)' : '#ffffff'),
                          opacity: slot.isBooked ? 0.5 : 1,
                          cursor: slot.isBooked ? 'not-allowed' : 'pointer',
                          fontWeight: '700',
                          fontSize: '0.875rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'var(--transition-fast)'
                        }}
                      >
                        <span>{slot.label}</span>
                        {slot.isBooked ? (
                          <span style={{ fontSize: '0.7rem', color: 'var(--danger)' }}>BOOKED</span>
                        ) : isSelected ? (
                          <span style={{ fontSize: '0.75rem', fontWeight: '800' }}>✓</span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  No available slots for this date.
                </div>
              )}

              {selectedSlot && (
                <button
                  className="btn btn-primary animate-fade-in"
                  style={{ width: '100%', marginTop: '20px' }}
                  onClick={() => setStep('FORM')}
                >
                  Next: Enter Details & Reserve
                </button>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
