import fs from 'fs';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DB_PATH || path.join(__dirname, 'schedulify.db');
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let dbInstance = null;

export async function getDb() {
  if (dbInstance) return dbInstance;

  dbInstance = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  await dbInstance.exec('PRAGMA foreign_keys = ON;');
  return dbInstance;
}

// Initialize Schema & Seed Data
export async function initDatabase() {
  const db = await getDb();

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      username      TEXT NOT NULL UNIQUE,
      email         TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name          TEXT NOT NULL DEFAULT '',
      bio           TEXT,
      timezone      TEXT NOT NULL DEFAULT 'Asia/Kolkata (GMT +5:30)',
      verified      INTEGER NOT NULL DEFAULT 1,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS availability_days (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL,
      day_name   TEXT NOT NULL,
      enabled    INTEGER NOT NULL DEFAULT 0,
      start_time TEXT NOT NULL DEFAULT '09:00',
      end_time   TEXT NOT NULL DEFAULT '17:00',
      UNIQUE(user_id, day_name),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS blocked_dates (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id      INTEGER NOT NULL,
      blocked_date TEXT NOT NULL,
      UNIQUE(user_id, blocked_date),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      host_id         INTEGER NOT NULL,
      guest_name      TEXT NOT NULL,
      guest_email     TEXT NOT NULL,
      booking_date    TEXT NOT NULL,
      start_time      TEXT NOT NULL,
      end_time        TEXT NOT NULL,
      time_slot_label TEXT NOT NULL DEFAULT '',
      timezone        TEXT NOT NULL DEFAULT '',
      message         TEXT,
      status          TEXT NOT NULL DEFAULT 'confirmed',
      created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (host_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS email_outbox (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id      INTEGER NOT NULL,
      recipient_type  TEXT NOT NULL,
      recipient_email TEXT NOT NULL,
      subject         TEXT NOT NULL,
      body_json       TEXT NOT NULL,
      sent_at         DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
    );
  `);

  // Seed Demo User 'akhil' if not present
  const existingUser = await db.get('SELECT * FROM users WHERE username = ?', 'akhil');
  if (!existingUser) {
    const passwordHash = bcrypt.hashSync('password123', 10);
    const result = await db.run(`
      INSERT INTO users (username, email, password_hash, name, bio, timezone)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
      'akhil',
      'akhil@example.com',
      passwordHash,
      'Akhil Anil',
      'Product & Engineering Lead. Book a 1-hour slot with me for project architecture, code reviews, or coffee chat.',
      'Asia/Kolkata (GMT +5:30)'
    );

    const userId = result.lastID;

    // Default Mon-Fri availability
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

    // Seed blocked dates
    await db.run('INSERT INTO blocked_dates (user_id, blocked_date) VALUES (?, ?)', userId, '2026-08-30');
    await db.run('INSERT INTO blocked_dates (user_id, blocked_date) VALUES (?, ?)', userId, '2026-09-01');

    console.log('✓ Demo user akhil & availability seeded into SQLite database');
  }

  return db;
}

export default getDb;
