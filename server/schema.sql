-- Schedulify MariaDB Schema
-- Database: schedulify
-- Credentials: admin / admin@321

CREATE DATABASE IF NOT EXISTS schedulify CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE schedulify;

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(64)  NOT NULL UNIQUE,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(128) NOT NULL DEFAULT '',
  bio           TEXT,
  timezone      VARCHAR(64)  NOT NULL DEFAULT 'Asia/Kolkata (GMT +5:30)',
  verified      BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- AVAILABILITY DAYS  (7 rows per user)
-- ============================================================
CREATE TABLE IF NOT EXISTS availability_days (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT         NOT NULL,
  day_name   VARCHAR(12) NOT NULL,   -- Monday, Tuesday, ...
  enabled    BOOLEAN     NOT NULL DEFAULT FALSE,
  start_time VARCHAR(5)  NOT NULL DEFAULT '09:00',  -- HH:MM
  end_time   VARCHAR(5)  NOT NULL DEFAULT '17:00',
  UNIQUE KEY uq_user_day (user_id, day_name),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- BLOCKED DATES
-- ============================================================
CREATE TABLE IF NOT EXISTS blocked_dates (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT  NOT NULL,
  blocked_date DATE NOT NULL,
  UNIQUE KEY uq_user_blocked (user_id, blocked_date),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- BOOKINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS bookings (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  host_id         INT          NOT NULL,
  guest_name      VARCHAR(128) NOT NULL,
  guest_email     VARCHAR(255) NOT NULL,
  booking_date    DATE         NOT NULL,
  start_time      VARCHAR(5)   NOT NULL,  -- HH:MM
  end_time        VARCHAR(5)   NOT NULL,
  time_slot_label VARCHAR(64)  NOT NULL DEFAULT '',
  timezone        VARCHAR(64)  NOT NULL DEFAULT '',
  message         TEXT,
  status          VARCHAR(16)  NOT NULL DEFAULT 'confirmed',  -- confirmed | cancelled
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (host_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- EMAIL OUTBOX  (simulated transactional emails)
-- ============================================================
CREATE TABLE IF NOT EXISTS email_outbox (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  booking_id      INT          NOT NULL,
  recipient_type  VARCHAR(8)   NOT NULL,  -- HOST | GUEST
  recipient_email VARCHAR(255) NOT NULL,
  subject         VARCHAR(512) NOT NULL,
  body_json       JSON         NOT NULL,
  sent_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- SEED: Demo user "akhil"
-- Password: password123  →  bcrypt hash (pre-computed)
-- $2a$10$8KzQ5Zl2Q6oWQ3lNJ9OgEeqRKv5r5Oz7hI9TJnGjO4N3FvqB5HSXC
-- ============================================================
INSERT IGNORE INTO users (username, email, password_hash, name, bio, timezone)
VALUES (
  'akhil',
  'akhil@example.com',
  '$2a$10$placeholder_will_be_replaced_at_runtime',
  'Akhil Anil',
  'Product & Engineering Lead. Book a 1-hour slot with me for project architecture, code reviews, or coffee chat.',
  'Asia/Kolkata (GMT +5:30)'
);

-- Default Mon–Fri availability for demo user
-- We use a variable approach; since we just inserted, we can use LAST_INSERT_ID or a subquery
INSERT IGNORE INTO availability_days (user_id, day_name, enabled, start_time, end_time)
SELECT u.id, d.day_name, d.enabled, d.start_time, d.end_time
FROM users u
CROSS JOIN (
  SELECT 'Monday'    AS day_name, TRUE  AS enabled, '09:00' AS start_time, '17:00' AS end_time UNION ALL
  SELECT 'Tuesday',               TRUE,             '09:00',               '17:00'             UNION ALL
  SELECT 'Wednesday',             TRUE,             '09:00',               '17:00'             UNION ALL
  SELECT 'Thursday',              TRUE,             '09:00',               '17:00'             UNION ALL
  SELECT 'Friday',                TRUE,             '09:00',               '17:00'             UNION ALL
  SELECT 'Saturday',              FALSE,            '10:00',               '15:00'             UNION ALL
  SELECT 'Sunday',                FALSE,            '10:00',               '15:00'
) AS d
WHERE u.username = 'akhil';

-- Seed blocked dates
INSERT IGNORE INTO blocked_dates (user_id, blocked_date)
SELECT u.id, d.bd
FROM users u
CROSS JOIN (
  SELECT '2026-08-30' AS bd UNION ALL
  SELECT '2026-09-01'
) AS d
WHERE u.username = 'akhil';
