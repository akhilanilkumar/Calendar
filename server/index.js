import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb, initDatabase } from './db.js';

const app = express();
const PORT = 3001;
const JWT_SECRET = 'schedulify_mvp_secret_key_2026';

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// ─── JWT Middleware ──────────────────────────────────────────
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.userId = decoded.userId;
    } catch { /* ignore */ }
  }
  next();
}

function formatUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    name: row.name,
    bio: row.bio,
    timezone: row.timezone,
    verified: !!row.verified,
    createdAt: row.created_at
  };
}

// ═══════════════════════════════════════════════════════════════
// AUTH ROUTES
// ═══════════════════════════════════════════════════════════════

// POST /api/auth/signup
app.post('/api/auth/signup', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const db = await getDb();
    const cleanEmail = email.toLowerCase().trim();
    const existing = await db.get('SELECT id FROM users WHERE email = ?', cleanEmail);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    let baseUsername = cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'user';
    let username = baseUsername;
    let counter = 1;
    while (true) {
      const taken = await db.get('SELECT id FROM users WHERE username = ?', username);
      if (!taken) break;
      username = `${baseUsername}${counter}`;
      counter++;
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const result = await db.run(`
      INSERT INTO users (username, email, password_hash, name, bio, timezone)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
      username,
      cleanEmail,
      passwordHash,
      name || baseUsername,
      'Welcome to my 1-hour slot booking page! Pick a time that works for you.',
      'Asia/Kolkata (GMT +5:30)'
    );

    const userId = result.lastID;

    // Insert default availability
    const days = [
      ['Monday', 1, '09:00', '17:00'],
      ['Tuesday', 1, '09:00', '17:00'],
      ['Wednesday', 1, '09:00', '17:00'],
      ['Thursday', 1, '09:00', '17:00'],
      ['Friday', 1, '09:00', '17:00'],
      ['Saturday', 0, '10:00', '15:00'],
      ['Sunday', 0, '10:00', '15:00']
    ];

    for (const [dayName, enabled, start, end] of days) {
      await db.run(`
        INSERT INTO availability_days (user_id, day_name, enabled, start_time, end_time)
        VALUES (?, ?, ?, ?, ?)
      `, userId, dayName, enabled, start, end);
    }

    const newUser = await db.get('SELECT * FROM users WHERE id = ?', userId);
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user: formatUser(newUser) });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Signup failed' });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  try {
    const db = await getDb();
    const user = await db.get('SELECT * FROM users WHERE email = ?', email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: formatUser(user) });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const user = await db.get('SELECT * FROM users WHERE id = ?', req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: formatUser(user) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// ═══════════════════════════════════════════════════════════════
// USER ROUTES
// ═══════════════════════════════════════════════════════════════

// GET /api/users/:username — Public profile lookup
app.get('/api/users/:username', async (req, res) => {
  try {
    const db = await getDb();
    const user = await db.get('SELECT * FROM users WHERE username = ?', req.params.username.toLowerCase().trim());
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: formatUser(user) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// GET /api/users/:username/check — Username availability
app.get('/api/users/:username/check', optionalAuth, async (req, res) => {
  const username = req.params.username.toLowerCase().trim();
  const reserved = ['admin', 'api', 'login', 'signup', 'dashboard', 'settings', 'availability', 'setup'];
  if (reserved.includes(username)) return res.json({ available: false });

  try {
    const db = await getDb();
    const user = await db.get('SELECT id FROM users WHERE username = ?', username);
    if (!user) return res.json({ available: true });
    if (req.userId && user.id === req.userId) return res.json({ available: true });
    res.json({ available: false });
  } catch (err) {
    res.status(500).json({ error: 'Check failed' });
  }
});

// PUT /api/users/profile — Update profile
app.put('/api/users/profile', authenticateToken, async (req, res) => {
  const { name, username, bio } = req.body;
  try {
    const db = await getDb();
    if (username) {
      const existing = await db.get('SELECT id FROM users WHERE username = ? AND id != ?', username.toLowerCase().trim(), req.userId);
      if (existing) return res.status(409).json({ error: 'Username already taken' });
    }

    const current = await db.get('SELECT * FROM users WHERE id = ?', req.userId);
    const newName = name !== undefined ? name : current.name;
    const newUsername = username ? username.toLowerCase().trim() : current.username;
    const newBio = bio !== undefined ? bio : current.bio;

    await db.run('UPDATE users SET name = ?, username = ?, bio = ? WHERE id = ?',
      newName, newUsername, newBio, req.userId
    );

    const updated = await db.get('SELECT * FROM users WHERE id = ?', req.userId);
    res.json({ user: formatUser(updated) });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Update failed' });
  }
});

// ═══════════════════════════════════════════════════════════════
// AVAILABILITY ROUTES
// ═══════════════════════════════════════════════════════════════

// GET /api/availability/:username
app.get('/api/availability/:username', async (req, res) => {
  try {
    const db = await getDb();
    const user = await db.get('SELECT id, timezone FROM users WHERE username = ?', req.params.username.toLowerCase().trim());
    if (!user) return res.status(404).json({ error: 'User not found' });

    const dayRows = await db.all(`
      SELECT day_name, enabled, start_time, end_time FROM availability_days
      WHERE user_id = ?
    `, user.id);

    const blockedRows = await db.all('SELECT blocked_date FROM blocked_dates WHERE user_id = ?', user.id);

    const days = {};
    for (const row of dayRows) {
      days[row.day_name] = {
        enabled: !!row.enabled,
        start: row.start_time,
        end: row.end_time
      };
    }

    res.json({
      timezone: user.timezone,
      days,
      blockedDates: blockedRows.map(r => r.blocked_date)
    });
  } catch (err) {
    console.error('Availability fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

// PUT /api/availability — Save weekly schedule
app.put('/api/availability', authenticateToken, async (req, res) => {
  const { timezone, days } = req.body;
  try {
    const db = await getDb();

    if (timezone) {
      await db.run('UPDATE users SET timezone = ? WHERE id = ?', timezone, req.userId);
    }

    if (days) {
      for (const [dayName, config] of Object.entries(days)) {
        await db.run(`
          INSERT INTO availability_days (user_id, day_name, enabled, start_time, end_time)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(user_id, day_name) DO UPDATE SET
            enabled = excluded.enabled,
            start_time = excluded.start_time,
            end_time = excluded.end_time
        `, req.userId, dayName, config.enabled ? 1 : 0, config.start, config.end);
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Availability save error:', err);
    res.status(500).json({ error: 'Failed to save availability' });
  }
});

// POST /api/availability/block — Add blocked date
app.post('/api/availability/block', authenticateToken, async (req, res) => {
  const { date } = req.body;
  try {
    const db = await getDb();
    await db.run('INSERT OR IGNORE INTO blocked_dates (user_id, blocked_date) VALUES (?, ?)', req.userId, date);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to block date' });
  }
});

// DELETE /api/availability/block/:dateStr — Remove blocked date
app.delete('/api/availability/block/:dateStr', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    await db.run('DELETE FROM blocked_dates WHERE user_id = ? AND blocked_date = ?', req.userId, req.params.dateStr);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to unblock date' });
  }
});

// ═══════════════════════════════════════════════════════════════
// SLOTS ROUTE — 1-hour slot generator
// ═══════════════════════════════════════════════════════════════

// GET /api/slots/:username/:date
app.get('/api/slots/:username/:date', async (req, res) => {
  const { username, date } = req.params;
  try {
    const db = await getDb();
    const user = await db.get('SELECT id, timezone FROM users WHERE username = ?', username.toLowerCase().trim());
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Check blocked dates
    const blocked = await db.get('SELECT id FROM blocked_dates WHERE user_id = ? AND blocked_date = ?', user.id, date);
    if (blocked) return res.json({ slots: [] });

    // Find day of week
    const dateObj = new Date(`${date}T00:00:00`);
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = daysOfWeek[dateObj.getDay()];

    const dayConfig = await db.get('SELECT enabled, start_time, end_time FROM availability_days WHERE user_id = ? AND day_name = ?', user.id, dayName);
    if (!dayConfig || !dayConfig.enabled) return res.json({ slots: [] });

    const startHour = parseInt(dayConfig.start_time.split(':')[0], 10);
    const endHour = parseInt(dayConfig.end_time.split(':')[0], 10);

    const bookings = await db.all("SELECT start_time FROM bookings WHERE host_id = ? AND booking_date = ? AND status = 'confirmed'", user.id, date);
    const bookedStarts = new Set(bookings.map(b => b.start_time));

    const formatAmPm = (hour) => {
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const h12 = hour % 12 === 0 ? 12 : hour % 12;
      return `${String(h12).padStart(2, '0')}:00 ${ampm}`;
    };

    const slots = [];
    for (let h = startHour; h < endHour; h++) {
      const startStr = `${String(h).padStart(2, '0')}:00`;
      const endStr = `${String(h + 1).padStart(2, '0')}:00`;
      const label = `${formatAmPm(h)} – ${formatAmPm(h + 1)}`;
      const isBooked = bookedStarts.has(startStr);

      slots.push({ startTime: startStr, endTime: endStr, label, isBooked });
    }

    res.json({ slots, timezone: user.timezone });
  } catch (err) {
    console.error('Slots error:', err);
    res.status(500).json({ error: 'Failed to generate slots' });
  }
});

// ═══════════════════════════════════════════════════════════════
// BOOKING ROUTES
// ═══════════════════════════════════════════════════════════════

// POST /api/bookings
app.post('/api/bookings', async (req, res) => {
  const { hostUsername, guestName, guestEmail, date, startTime, endTime, timezone, message } = req.body;

  if (!hostUsername || !guestName || !guestEmail || !date || !startTime || !endTime) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const db = await getDb();
    const host = await db.get('SELECT id, name, email, timezone FROM users WHERE username = ?', hostUsername.toLowerCase().trim());
    if (!host) return res.status(404).json({ error: 'Host not found' });

    // Double-booking check
    const conflict = await db.get("SELECT id FROM bookings WHERE host_id = ? AND booking_date = ? AND start_time = ? AND status = 'confirmed'", host.id, date, startTime);
    if (conflict) {
      return res.status(409).json({ error: 'DOUBLE_BOOKING_CONFLICT' });
    }

    const formatAmPm = (timeStr) => {
      const hour = parseInt(timeStr.split(':')[0], 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const h12 = hour % 12 === 0 ? 12 : hour % 12;
      return `${String(h12).padStart(2, '0')}:00 ${ampm}`;
    };
    const slotLabel = `${formatAmPm(startTime)} – ${formatAmPm(endTime)}`;
    const tz = timezone || host.timezone;

    const result = await db.run(`
      INSERT INTO bookings (host_id, guest_name, guest_email, booking_date, start_time, end_time, time_slot_label, timezone, message, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')
    `, host.id, guestName, guestEmail, date, startTime, endTime, slotLabel, tz, message || '');

    const bookingId = result.lastID;

    // Dispatch simulated confirmation emails into outbox
    const guestEmailBody = JSON.stringify({
      hostName: host.name,
      guestName,
      date,
      timeSlot: slotLabel,
      timezone: tz,
      message: message || ''
    });

    const hostEmailBody = JSON.stringify({
      hostName: host.name,
      guestName,
      guestEmail,
      date,
      timeSlot: slotLabel,
      timezone: tz,
      message: message || ''
    });

    await db.run(`
      INSERT INTO email_outbox (booking_id, recipient_type, recipient_email, subject, body_json)
      VALUES (?, ?, ?, ?, ?)
    `, bookingId, 'GUEST', guestEmail, `Confirmed: 1-Hour Meeting with ${host.name}`, guestEmailBody);

    await db.run(`
      INSERT INTO email_outbox (booking_id, recipient_type, recipient_email, subject, body_json)
      VALUES (?, ?, ?, ?, ?)
    `, bookingId, 'HOST', host.email, `New Reservation: ${guestName} booked a meeting with you`, hostEmailBody);

    const booking = await db.get('SELECT * FROM bookings WHERE id = ?', bookingId);

    res.json({
      booking: {
        id: booking.id,
        hostUsername: hostUsername.toLowerCase().trim(),
        hostName: host.name,
        guestName: booking.guest_name,
        guestEmail: booking.guest_email,
        date: booking.booking_date,
        timeSlot: booking.time_slot_label,
        startTime: booking.start_time,
        endTime: booking.end_time,
        timezone: booking.timezone,
        message: booking.message,
        status: booking.status,
        createdAt: booking.created_at
      }
    });
  } catch (err) {
    console.error('Booking creation error:', err);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// GET /api/bookings
app.get('/api/bookings', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const user = await db.get('SELECT username, name FROM users WHERE id = ?', req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const rows = await db.all('SELECT * FROM bookings WHERE host_id = ? ORDER BY booking_date ASC, start_time ASC', req.userId);

    const bookings = rows.map(b => ({
      id: b.id,
      hostUsername: user.username,
      hostName: user.name,
      guestName: b.guest_name,
      guestEmail: b.guest_email,
      date: b.booking_date,
      timeSlot: b.time_slot_label,
      startTime: b.start_time,
      endTime: b.end_time,
      timezone: b.timezone,
      message: b.message,
      status: b.status,
      createdAt: b.created_at
    }));

    res.json({ bookings });
  } catch (err) {
    console.error('Bookings fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// PUT /api/bookings/:id/cancel
app.put('/api/bookings/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    await db.run("UPDATE bookings SET status = 'cancelled' WHERE id = ? AND host_id = ?", req.params.id, req.userId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

// ═══════════════════════════════════════════════════════════════
// EMAIL OUTBOX
// ═══════════════════════════════════════════════════════════════

// GET /api/emails
app.get('/api/emails', async (req, res) => {
  try {
    const db = await getDb();
    const rows = await db.all('SELECT * FROM email_outbox ORDER BY sent_at DESC LIMIT 50');

    const emails = rows.map(r => {
      let body;
      try { body = typeof r.body_json === 'string' ? JSON.parse(r.body_json) : (r.body_json || {}); } catch { body = {}; }
      return {
        id: r.id,
        bookingId: r.booking_id,
        recipientType: r.recipient_type,
        recipientEmail: r.recipient_email,
        subject: r.subject,
        hostName: body.hostName || '',
        guestName: body.guestName || '',
        guestEmail: body.guestEmail || '',
        date: body.date || '',
        timeSlot: body.timeSlot || '',
        timezone: body.timezone || '',
        message: body.message || '',
        sentAt: r.sent_at
      };
    });

    res.json({ emails });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch emails' });
  }
});

// ═══════════════════════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════════════════════
async function startServer() {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`\n  ✓ Schedulify API server running at http://localhost:${PORT}`);
    console.log(`  ✓ Database: Portable SQLite database @ server/schedulify.db`);
    console.log(`  ✓ Demo user: akhil@example.com / password123\n`);
  });
}

startServer();
