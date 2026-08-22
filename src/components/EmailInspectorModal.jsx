import React, { useState } from 'react';
import { X, Mail, Calendar, Clock, User, Check, Download } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function EmailInspectorModal() {
  const { isEmailModalOpen, setIsEmailModalOpen, emailOutbox, inspectingEmail, setInspectingEmail } = useApp();
  const [activeTab, setActiveTab] = useState('GUEST'); // 'GUEST' or 'HOST'

  if (!isEmailModalOpen) return null;

  // Filter latest guest and host emails or inspect selected email
  const latestGuestMail = emailOutbox.find(m => m.recipientType === 'GUEST') || inspectingEmail;
  const latestHostMail = emailOutbox.find(m => m.recipientType === 'HOST') || inspectingEmail;

  const currentMail = activeTab === 'GUEST' ? latestGuestMail : latestHostMail;

  const handleDownloadIcs = () => {
    if (!currentMail) return;
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Schedulify 1-Hour Slot Booking//EN
BEGIN:VEVENT
SUMMARY:Meeting with ${currentMail.hostName}
DESCRIPTION:1-Hour Slot Booking. ${currentMail.message || ''}
DTSTART:${currentMail.date.replace(/-/g, '')}T090000Z
DTEND:${currentMail.date.replace(/-/g, '')}T100000Z
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `meeting_${currentMail.date}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="modal-backdrop" onClick={() => setIsEmailModalOpen(false)}>
      <div
        className="spotify-card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: '#121218',
          border: '1px solid rgba(29, 185, 84, 0.3)',
          padding: '28px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-between" style={{ marginBottom: '20px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', background: 'var(--accent-green-subtle)', borderRadius: '8px', color: 'var(--accent-green)' }}>
              <Mail size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Transactional Email Inspector</h3>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                Simulated real-time emails sent to Host & Guest upon reservation creation.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsEmailModalOpen(false)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Receiver Tabs */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', background: '#1c1c26', padding: '4px', borderRadius: 'var(--radius-pill)' }}>
          <button
            onClick={() => setActiveTab('GUEST')}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: 'var(--radius-pill)',
              border: 'none',
              fontFamily: 'var(--font-heading)',
              fontWeight: '700',
              fontSize: '0.85rem',
              cursor: 'pointer',
              background: activeTab === 'GUEST' ? 'var(--accent-green)' : 'transparent',
              color: activeTab === 'GUEST' ? '#000' : 'var(--text-secondary)',
              transition: 'var(--transition-fast)'
            }}
          >
            Guest Confirmation Email
          </button>
          <button
            onClick={() => setActiveTab('HOST')}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: 'var(--radius-pill)',
              border: 'none',
              fontFamily: 'var(--font-heading)',
              fontWeight: '700',
              fontSize: '0.85rem',
              cursor: 'pointer',
              background: activeTab === 'HOST' ? 'var(--accent-green)' : 'transparent',
              color: activeTab === 'HOST' ? '#000' : 'var(--text-secondary)',
              transition: 'var(--transition-fast)'
            }}
          >
            Host Notification Email
          </button>
        </div>

        {/* Email Preview Card */}
        {currentMail ? (
          <div
            style={{
              background: '#09090d',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              overflow: 'hidden'
            }}
          >
            {/* Email Meta Bar */}
            <div style={{ background: '#181822', padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                To: <strong style={{ color: 'var(--text-primary)' }}>{currentMail.recipientEmail}</strong>
              </div>
              <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--accent-green-bright)' }}>
                {currentMail.subject}
              </div>
            </div>

            {/* Email Body */}
            <div style={{ padding: '24px' }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'var(--accent-green-subtle)',
                    color: 'var(--accent-green)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px auto'
                  }}
                >
                  <Check size={28} />
                </div>
                <h4 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>
                  {activeTab === 'GUEST' ? `You're booked with ${currentMail.hostName}` : `Someone booked a meeting with you!`}
                </h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Your 1-hour slot reservation has been confirmed.
                </p>
              </div>

              {/* Details Box */}
              <div
                style={{
                  background: '#161620',
                  borderRadius: 'var(--radius-md)',
                  padding: '20px',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  marginBottom: '24px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Calendar size={18} color="var(--accent-green)" />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>DATE</div>
                    <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{currentMail.date}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Clock size={18} color="var(--accent-green)" />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TIME & TIMEZONE</div>
                    <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>
                      {currentMail.timeSlot} ({currentMail.timezone})
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <User size={18} color="var(--accent-green)" />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {activeTab === 'GUEST' ? 'HOST' : 'GUEST'}
                    </div>
                    <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>
                      {activeTab === 'GUEST' ? currentMail.hostName : `${currentMail.guestName} (${currentMail.guestEmail})`}
                    </div>
                  </div>
                </div>

                {currentMail.message && (
                  <div style={{ marginTop: '6px', paddingTop: '12px', borderTop: '1px dashed var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>GUEST MESSAGE</div>
                    <div style={{ fontStyle: 'italic', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      "{currentMail.message}"
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button className="btn btn-outline btn-sm" onClick={handleDownloadIcs}>
                  <Download size={16} /> Download .ics Calendar Event
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            No email notifications generated yet. Create a test booking to generate real-time emails!
          </div>
        )}
      </div>
    </div>
  );
}
