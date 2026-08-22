import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from './db.js';

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

// Optional auth — sets req.userId if token present, but doesn't block
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

// ─── Helper: format user object for response ────────────────
function formatUser(row) {
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

// ─── Seed: Fix demo user password hash on first run ─────────
async function seedDemoPassword() {
  let conn;
  try {
    conn = await pool.getConnection();
    const [user] = await conn.query("SELECT id, password_hash FROM users WHERE username = 'akhil'");
    if (user && user.password_hash.startsWith('$2a$10$placeholder')) {
      const hash = await bcrypt.hash('password123', 10);
      await conn.query("UPDATE users SET password_hash = ? WHERE id = ?", [hash, user.id]);
      console.log('✓ Demo user akhil password hash updated');
    }
  } catch (err) {
    console.error('Seed error:', err.message);
  } finally {
    if (conn) conn.release();
  }
}

// ═══════════════════════════════════════════════════════════════
// AUTH ROUTES
// ═══════════════════════════════════════════════════════════════

// POST /api/auth/signup
app.post('/api/auth/signup', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  let conn;
  try {
    conn = await pool.getConnection();

    // Check if email already exists
    const existing = await conn.query("SELECT id FROM users WHERE email = ?", [email.toLowerCase()]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Generate username from email
    let baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'user';
    let username = baseUsername;
    let counter = 1;
    while (true) {
      const taken = await conn.query("SELECT id FROM users WHERE username = ?", [username]);
      if (taken.length === 0) break;
      username = `${baseUsername}${counter}`;
      counter++;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await conn.query(
      `INSERT INTO users (username, email, password_hash, name, bio, timezone)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        username,
        email.toLowerCase(),
        passwordHash,
        name || baseUsername,
        'Welcome to my 1-hour slot booking page! Pick a time that works for you.',
        'Asia/Kolkata (GMT +5:30)'
      ]
    );

    const userId = Number(result.insertId);

    // Insert default availability (Mon-Fri 09-17, Sat-Sun off)
    const days = [
      ['Monday', true, '09:00', '17:00'],
      ['Tuesday', true, '09:00', '17:00'],
      ['Wednesday', true, '09:00', '17:00'],
      ['Thursday', true, '09:00', '17:00'],
      ['Friday', true, '09:00', '17:00'],
      ['Saturday', false, '10:00', '15:00'],
      ['Sunday', false, '10:00', '15:00']
    ];
    for (const [dayName, enabled, start, end] of days) {
      await conn.query(
        "INSERT INTO availability_days (user_id, day_name, enabled, start_time, end_time) VALUES (?, ?, ?, ?, ?)",
        [userId, dayName, enabled, start, end]
      );
    }

    const [newUser] = await conn.query("SELECT * FROM users WHERE id = ?", [userId]);
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user: formatUser(newUser) });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Signup failed' });
  } finally {
    if (conn) conn.release();
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query("SELECT * FROM users WHERE email = ?", [email.toLowerCase()]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: formatUser(user) });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  } finally {
    if (conn) conn.release();
  }
});

// GET /api/auth/me
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query("SELECT * FROM users WHERE id = ?", [req.userId]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ user: formatUser(rows[0]) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  } finally {
    if (conn) conn.release();
  }
});

// ═══════════════════════════════════════════════════════════════
// USER ROUTES
// ═══════════════════════════════════════════════════════════════

// GET /api/users/:username — Public profile lookup
app.get('/api/users/:username', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query("SELECT * FROM users WHERE username = ?", [req.params.username.toLowerCase()]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ user: formatUser(rows[0]) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  } finally {
    if (conn) conn.release();
  }
});

// GET /api/users/:username/check — Username availability
app.get('/api/users/:username/check', optionalAuth, async (req, res) => {
  const username = req.params.username.toLowerCase().trim();
  const reserved = ['admin', 'api', 'login', 'signup', 'dashboard', 'settings', 'availability', 'setup'];
  if (reserved.includes(username)) return res.json({ available: false });

  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query("SELECT id FROM users WHERE username = ?", [username]);
    if (rows.length === 0) return res.json({ available: true });
    // If the caller owns it, it's "available" for them
    if (req.userId && rows[0].id === req.userId) return res.json({ available: true });
    res.json({ available: false });
  } catch (err) {
    res.status(500).json({ error: 'Check failed' });
  } finally {
    if (conn) conn.release();
  }
});

// PUT /api/users/profile — Update profile (authenticated)
app.put('/api/users/profile', authenticateToken, async (req, res) => {
  const { name, username, bio } = req.body;
  let conn;
  try {
    conn = await pool.getConnection();

    // If username is changing, check it's available
    if (username) {
      const existing = await conn.query("SELECT id FROM users WHERE username = ? AND id != ?", [username.toLowerCase(), req.userId]);
      if (existing.length > 0) return res.status(409).json({ error: 'Username already taken' });
    }

    await conn.query(
      "UPDATE users SET name = COALESCE(?, name), username = COALESCE(?, username), bio = COALESCE(?, bio) WHERE id = ?",
      [name, username ? username.toLowerCase() : null, bio, req.userId]
    );

    const [updated] = await conn.query("SELECT * FROM users WHERE id = ?", [req.userId]);
    res.json({ user: formatUser(updated) });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Update failed' });
  } finally {
    if (conn) conn.release();
  }
});

// ═══════════════════════════════════════════════════════════════
// AVAILABILITY ROUTES
// ═══════════════════════════════════════════════════════════════

// GET /api/availability/:username — Public: get weekly schedule + blocked dates
app.get('/api/availability/:username', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const [user] = await conn.query("SELECT id, timezone FROM users WHERE username = ?", [req.params.username.toLowerCase()]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const dayRows = await conn.query(
      "SELECT day_name, enabled, start_time, end_time FROM availability_days WHERE user_id = ? ORDER BY FIELD(day_name, 'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')",
      [user.id]
    );

    const blockedRows = await conn.query(
      "SELECT blocked_date FROM blocked_dates WHERE user_id = ?",
      [user.id]
    );

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
      blockedDates: blockedRows.map(r => {
        const d = r.blocked_date;
        if (d instanceof Date) {
          return d.toISOString().split('T')[0];
        }
        return String(d).split('T')[0];
      })
    });
  } catch (err) {
    console.error('Availability fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch availability' });
  } finally {
    if (conn) conn.release();
  }
});

// PUT /api/availability — Save weekly schedule (authenticated)
app.put('/api/availability', authenticateToken, async (req, res) => {
  const { timezone, days } = req.body;
  let conn;
  try {
    conn = await pool.getConnection();

    if (timezone) {
      await conn.query("UPDATE users SET timezone = ? WHERE id = ?", [timezone, req.userId]);
    }

    if (days) {
      for (const [dayName, config] of Object.entries(days)) {
        await conn.query(
          `INSERT INTO availability_days (user_id, day_name, enabled, start_time, end_time)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE enabled = VALUES(enabled), start_time = VALUES(start_time), end_time = VALUES(end_time)`,
          [req.userId, dayName, config.enabled, config.start, config.end]
        );
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Availability save error:', err);
    res.status(500).json({ error: 'Failed to save availability' });
  } finally {
    if (conn) conn.release();
  }
});

// POST /api/availability/block — Add blocked date
app.post('/api/availability/block', authenticateToken, async (req, res) => {
  const { date } = req.body;
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query(
      "INSERT IGNORE INTO blocked_dates (user_id, blocked_date) VALUES (?, ?)",
      [req.userId, date]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to block date' });
  } finally {
    if (conn) conn.release();
  }
});

// DELETE /api/availability/block/:dateStr — Remove blocked date
app.delete('/api/availability/block/:dateStr', authenticateToken, async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query(
      "DELETE FROM blocked_dates WHERE user_id = ? AND blocked_date = ?",
      [req.userId, req.params.dateStr]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to unblock date' });
  } finally {
    if (conn) conn.release();
  }
});

// ═══════════════════════════════════════════════════════════════
// SLOTS ROUTE — Server-side 1-hour slot generation
// ═══════════════════════════════════════════════════════════════

// GET /api/slots/:username/:date
app.get('/api/slots/:username/:date', async (req, res) => {
  const { username, date } = req.params;
  let conn;
  try {
    conn = await pool.getConnection();

    // Lookup user
    const [user] = await conn.query("SELECT id, timezone FROM users WHERE username = ?", [username.toLowerCase()]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Check blocked dates
    const blocked = await conn.query(
      "SELECT id FROM blocked_dates WHERE user_id = ? AND blocked_date = ?",
      [user.id, date]
    );
    if (blocked.length > 0) return res.json({ slots: [] });

    // Find day of week
    const dateObj = new Date(`${date}T00:00:00`);
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = daysOfWeek[dateObj.getDay()];

    // Get availability for that day
    const dayRows = await conn.query(
      "SELECT enabled, start_time, end_time FROM availability_days WHERE user_id = ? AND day_name = ?",
      [user.id, dayName]
    );
    if (dayRows.length === 0 || !dayRows[0].enabled) return res.json({ slots: [] });

    const startHour = parseInt(dayRows[0].start_time.split(':')[0], 10);
    const endHour = parseInt(dayRows[0].end_time.split(':')[0], 10);

    // Get existing confirmed bookings for this host on this date
    const bookings = await conn.query(
      "SELECT start_time FROM bookings WHERE host_id = ? AND booking_date = ? AND status = 'confirmed'",
      [user.id, date]
    );
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
  } finally {
    if (conn) conn.release();
  }
});

// ═══════════════════════════════════════════════════════════════
// BOOKING ROUTES
// ═══════════════════════════════════════════════════════════════

// POST /api/bookings — Create a booking (public — no auth required for guest)
app.post('/api/bookings', async (req, res) => {
  const { hostUsername, guestName, guestEmail, date, startTime, endTime, timezone, message } = req.body;

  if (!hostUsername || !guestName || !guestEmail || !date || !startTime || !endTime) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  let conn;
  try {
    conn = await pool.getConnection();

    // Find host
    const [host] = await conn.query("SELECT id, name, email, timezone FROM users WHERE username = ?", [hostUsername.toLowerCase()]);
    if (!host) return res.status(404).json({ error: 'Host not found' });

    // Double-booking check
    const conflicts = await conn.query(
      "SELECT id FROM bookings WHERE host_id = ? AND booking_date = ? AND start_time = ? AND status = 'confirmed'",
      [host.id, date, startTime]
    );
    if (conflicts.length > 0) {
      return res.status(409).json({ error: 'DOUBLE_BOOKING_CONFLICT' });
    }

    // Compute slot label
    const formatAmPm = (timeStr) => {
      const hour = parseInt(timeStr.split(':')[0], 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const h12 = hour % 12 === 0 ? 12 : hour % 12;
      return `${String(h12).padStart(2, '0')}:00 ${ampm}`;
    };
    const slotLabel = `${formatAmPm(startTime)} – ${formatAmPm(endTime)}`;
    const tz = timezone || host.timezone;

    const result = await conn.query(
      `INSERT INTO bookings (host_id, guest_name, guest_email, booking_date, start_time, end_time, time_slot_label, timezone, message, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')`,
      [host.id, guestName, guestEmail, date, startTime, endTime, slotLabel, tz, message || '']
    );

    const bookingId = Number(result.insertId);

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

    await conn.query(
      "INSERT INTO email_outbox (booking_id, recipient_type, recipient_email, subject, body_json) VALUES (?, 'GUEST', ?, ?, ?)",
      [bookingId, guestEmail, `Confirmed: 1-Hour Meeting with ${host.name}`, guestEmailBody]
    );

    await conn.query(
      "INSERT INTO email_outbox (booking_id, recipient_type, recipient_email, subject, body_json) VALUES (?, 'HOST', ?, ?, ?)",
      [bookingId, host.email, `New Reservation: ${guestName} booked a meeting with you`, hostEmailBody]
    );

    // Return the created booking
    const [booking] = await conn.query("SELECT * FROM bookings WHERE id = ?", [bookingId]);

    res.json({
      booking: {
        id: booking.id,
        hostUsername: hostUsername.toLowerCase(),
        hostName: host.name,
        guestName: booking.guest_name,
        guestEmail: booking.guest_email,
        date: typeof booking.booking_date === 'object' ? booking.booking_date.toISOString().split('T')[0] : String(booking.booking_date).split('T')[0],
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
  } finally {
    if (conn) conn.release();
  }
});

// GET /api/bookings — Get bookings for authenticated host
app.get('/api/bookings', authenticateToken, async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const [user] = await conn.query("SELECT username, name FROM users WHERE id = ?", [req.userId]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const rows = await conn.query(
      "SELECT * FROM bookings WHERE host_id = ? ORDER BY booking_date ASC, start_time ASC",
      [req.userId]
    );

    const bookings = rows.map(b => ({
      id: b.id,
      hostUsername: user.username,
      hostName: user.name,
      guestName: b.guest_name,
      guestEmail: b.guest_email,
      date: typeof b.booking_date === 'object' ? b.booking_date.toISOString().split('T')[0] : String(b.booking_date).split('T')[0],
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
  } finally {
    if (conn) conn.release();
  }
});

// PUT /api/bookings/:id/cancel — Cancel a booking (authenticated)
app.put('/api/bookings/:id/cancel', authenticateToken, async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query(
      "UPDATE bookings SET status = 'cancelled' WHERE id = ? AND host_id = ?",
      [req.params.id, req.userId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel booking' });
  } finally {
    if (conn) conn.release();
  }
});

// ═══════════════════════════════════════════════════════════════
// EMAIL OUTBOX
// ═══════════════════════════════════════════════════════════════

// GET /api/emails — Get email outbox (public — used by Email Inspector)
app.get('/api/emails', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(
      "SELECT * FROM email_outbox ORDER BY sent_at DESC LIMIT 50"
    );

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
  } finally {
    if (conn) conn.release();
  }
});

// ═══════════════════════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════════════════════
async function start() {
  await seedDemoPassword();
  app.listen(PORT, () => {
    console.log(`\n  ✓ Schedulify API server running at http://localhost:${PORT}`);
    console.log(`  ✓ Database: schedulify @ localhost (MariaDB)`);
    console.log(`  ✓ Demo user: akhil@example.com / password123\n`);
  });
}

start();
