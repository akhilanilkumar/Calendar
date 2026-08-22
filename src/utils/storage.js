// Local Storage Data Engine & Business Logic for Schedulify MVP

const STORAGE_KEYS = {
  USERS: 'schedulify_users_v1',
  CURRENT_USER: 'schedulify_current_user_v1',
  AVAILABILITY: 'schedulify_availability_v1',
  BOOKINGS: 'schedulify_bookings_v1',
  EMAILS: 'schedulify_emails_v1'
};

// Initial Seed Data
const DEFAULT_DEMO_USER = {
  id: 'user_akhil_001',
  username: 'akhil',
  name: 'Akhil Anil',
  email: 'akhil@example.com',
  bio: 'Product & Engineering Lead. Book a 1-hour slot with me for project architecture, code reviews, or coffee chat.',
  avatarUrl: '',
  verified: true
};

const DEFAULT_WEEKLY_SCHEDULE = {
  timezone: 'Asia/Kolkata (GMT +5:30)',
  days: {
    Monday: { enabled: true, start: '09:00', end: '17:00' },
    Tuesday: { enabled: true, start: '09:00', end: '17:00' },
    Wednesday: { enabled: true, start: '09:00', end: '17:00' },
    Thursday: { enabled: true, start: '09:00', end: '17:00' },
    Friday: { enabled: true, start: '09:00', end: '17:00' },
    Saturday: { enabled: false, start: '10:00', end: '15:00' },
    Sunday: { enabled: false, start: '10:00', end: '15:00' }
  },
  blockedDates: ['2026-08-30', '2026-09-01']
};

// Helper: Get next date string formatted YYYY-MM-DD
function getFormattedDateOffset(daysAhead) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const DEFAULT_SAMPLE_BOOKINGS = [
  {
    id: 'bk_001',
    hostUsername: 'akhil',
    hostName: 'Akhil Anil',
    guestName: 'John Doe',
    guestEmail: 'john@example.com',
    date: getFormattedDateOffset(2), // 2 days from now
    timeSlot: '10:00 AM – 11:00 AM',
    startTime: '10:00',
    endTime: '11:00',
    timezone: 'Asia/Kolkata (GMT +5:30)',
    message: 'Looking forward to reviewing the new product features and backend architecture.',
    status: 'confirmed',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'bk_002',
    hostUsername: 'akhil',
    hostName: 'Akhil Anil',
    guestName: 'Sarah Jenkins',
    guestEmail: 'sarah@example.com',
    date: getFormattedDateOffset(3), // 3 days from now
    timeSlot: '02:00 PM – 03:00 PM',
    startTime: '14:00',
    endTime: '15:00',
    timezone: 'Asia/Kolkata (GMT +5:30)',
    message: 'Discussion regarding design system components and Spotify UI aesthetics.',
    status: 'confirmed',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
  }
];

// Initialize Storage Engine
export function initializeStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([DEFAULT_DEMO_USER]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(DEFAULT_DEMO_USER));
  }
  if (!localStorage.getItem(STORAGE_KEYS.AVAILABILITY)) {
    const initialAvailability = {
      [DEFAULT_DEMO_USER.username]: DEFAULT_WEEKLY_SCHEDULE
    };
    localStorage.setItem(STORAGE_KEYS.AVAILABILITY, JSON.stringify(initialAvailability));
  }
  if (!localStorage.getItem(STORAGE_KEYS.BOOKINGS)) {
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(DEFAULT_SAMPLE_BOOKINGS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.EMAILS)) {
    localStorage.setItem(STORAGE_KEYS.EMAILS, JSON.stringify([]));
  }
}

// User Accounts Logic
export function getUsers() {
  initializeStorage();
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
}

export function getCurrentUser() {
  initializeStorage();
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || 'null');
}

export function setCurrentUser(user) {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
}

export function isUsernameAvailable(username, currentUserId = null) {
  const users = getUsers();
  const cleanUsername = username.toLowerCase().trim();
  const reservedWords = ['admin', 'api', 'login', 'signup', 'dashboard', 'settings', 'availability', 'setup'];
  if (reservedWords.includes(cleanUsername)) return false;
  
  const existing = users.find(u => u.username.toLowerCase() === cleanUsername);
  if (!existing) return true;
  if (currentUserId && existing.id === currentUserId) return true;
  return false;
}

export function registerUser(email, password, name = '') {
  const users = getUsers();
  const baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  
  let uniqueUsername = baseUsername || 'user';
  let counter = 1;
  while (!isUsernameAvailable(uniqueUsername)) {
    uniqueUsername = `${baseUsername}${counter}`;
    counter++;
  }

  const newUser = {
    id: `user_${Date.now()}`,
    username: uniqueUsername,
    name: name || baseUsername,
    email,
    password, // Demo local storage only
    bio: `Welcome to my 1-hour slot booking page! Pick a time that works for you.`,
    avatarUrl: '',
    verified: true
  };

  users.push(newUser);
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  setCurrentUser(newUser);

  // Setup default availability for new user
  const availabilityMap = getAvailabilityMap();
  availabilityMap[newUser.username] = JSON.parse(JSON.stringify(DEFAULT_WEEKLY_SCHEDULE));
  localStorage.setItem(STORAGE_KEYS.AVAILABILITY, JSON.stringify(availabilityMap));

  return newUser;
}

export function updateUserProfile(userId, updates) {
  const users = getUsers();
  const index = users.findIndex(u => u.id === userId);
  if (index === -1) return null;

  const oldUsername = users[index].username;
  users[index] = { ...users[index], ...updates };
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

  const currentUser = getCurrentUser();
  if (currentUser && currentUser.id === userId) {
    setCurrentUser(users[index]);
  }

  // If username changed, migrate availability map key
  if (updates.username && updates.username !== oldUsername) {
    const availMap = getAvailabilityMap();
    if (availMap[oldUsername]) {
      availMap[updates.username] = availMap[oldUsername];
      delete availMap[oldUsername];
      localStorage.setItem(STORAGE_KEYS.AVAILABILITY, JSON.stringify(availMap));
    }
  }

  return users[index];
}

// Availability Engine
export function getAvailabilityMap() {
  initializeStorage();
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.AVAILABILITY) || '{}');
}

export function getUserAvailability(username) {
  const availMap = getAvailabilityMap();
  if (availMap[username]) return availMap[username];
  return DEFAULT_WEEKLY_SCHEDULE;
}

export function saveUserAvailability(username, newSchedule) {
  const availMap = getAvailabilityMap();
  availMap[username] = newSchedule;
  localStorage.setItem(STORAGE_KEYS.AVAILABILITY, JSON.stringify(availMap));
  return newSchedule;
}

// 1-Hour Time Slot Generator Logic
export function generateAvailableSlots(username, dateString) {
  // dateString: YYYY-MM-DD
  const schedule = getUserAvailability(username);
  if (!schedule) return [];

  // 1. Check if date is in blocked dates
  if (schedule.blockedDates && schedule.blockedDates.includes(dateString)) {
    return [];
  }

  // 2. Find day of week for dateString
  // Append T00:00:00 to avoid timezone offset shifts on Date parsing
  const dateObj = new Date(`${dateString}T00:00:00`);
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = daysOfWeek[dateObj.getDay()];

  const dayConfig = schedule.days[dayName];
  if (!dayConfig || !dayConfig.enabled) {
    return [];
  }

  const startHour = parseInt(dayConfig.start.split(':')[0], 10);
  const endHour = parseInt(dayConfig.end.split(':')[0], 10);

  // Parse existing confirmed bookings for host on this date
  const bookings = getBookingsForHost(username).filter(
    b => b.date === dateString && b.status !== 'cancelled'
  );

  const slots = [];
  for (let h = startHour; h < endHour; h++) {
    const startStr = `${String(h).padStart(2, '0')}:00`;
    const endStr = `${String(h + 1).padStart(2, '0')}:00`;
    
    // Format 12-hour AM/PM label
    const formatAmPm = (hour) => {
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const h12 = hour % 12 === 0 ? 12 : hour % 12;
      return `${String(h12).padStart(2, '0')}:00 ${ampm}`;
    };

    const label = `${formatAmPm(h)} – ${formatAmPm(h + 1)}`;

    // Check if slot conflicts with existing booking
    const isBooked = bookings.some(b => {
      const bStartHour = parseInt(b.startTime.split(':')[0], 10);
      return bStartHour === h;
    });

    slots.push({
      startTime: startStr,
      endTime: endStr,
      label,
      isBooked
    });
  }

  return slots;
}

// Bookings Engine
export function getAllBookings() {
  initializeStorage();
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKINGS) || '[]');
}

export function getBookingsForHost(username) {
  const all = getAllBookings();
  return all.filter(b => b.hostUsername.toLowerCase() === username.toLowerCase());
}

export function createBooking({ hostUsername, hostName, guestName, guestEmail, date, slot, timezone, message }) {
  const allBookings = getAllBookings();

  // Double Booking Check!
  const isConflict = allBookings.some(b => 
    b.hostUsername.toLowerCase() === hostUsername.toLowerCase() &&
    b.date === date &&
    b.startTime === slot.startTime &&
    b.status !== 'cancelled'
  );

  if (isConflict) {
    throw new Error('DOUBLE_BOOKING_CONFLICT');
  }

  const newBooking = {
    id: `bk_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    hostUsername,
    hostName,
    guestName,
    guestEmail,
    date,
    timeSlot: slot.label,
    startTime: slot.startTime,
    endTime: slot.endTime,
    timezone,
    message: message || '',
    status: 'confirmed',
    createdAt: new Date().toISOString()
  };

  allBookings.push(newBooking);
  localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(allBookings));

  // Generate Emails for Host and Guest
  dispatchConfirmationEmails(newBooking);

  return newBooking;
}

export function cancelBooking(bookingId) {
  const all = getAllBookings();
  const index = all.findIndex(b => b.id === bookingId);
  if (index !== -1) {
    all[index].status = 'cancelled';
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(all));
    return all[index];
  }
  return null;
}

// Simulated Transactional Email Dispatcher & Outbox
export function getEmailOutbox() {
  initializeStorage();
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.EMAILS) || '[]');
}

function dispatchConfirmationEmails(booking) {
  const outbox = getEmailOutbox();

  // 1. Guest Email
  const guestEmailObj = {
    id: `mail_guest_${Date.now()}`,
    recipientType: 'GUEST',
    recipientEmail: booking.guestEmail,
    subject: `Confirmed: 1-Hour Meeting with ${booking.hostName}`,
    hostName: booking.hostName,
    guestName: booking.guestName,
    date: booking.date,
    timeSlot: booking.timeSlot,
    timezone: booking.timezone,
    message: booking.message,
    sentAt: new Date().toISOString()
  };

  // 2. Host Email
  const hostEmailObj = {
    id: `mail_host_${Date.now()}`,
    recipientType: 'HOST',
    recipientEmail: `${booking.hostUsername}@example.com`,
    subject: `New Reservation: ${booking.guestName} booked a meeting with you`,
    hostName: booking.hostName,
    guestName: booking.guestName,
    guestEmail: booking.guestEmail,
    date: booking.date,
    timeSlot: booking.timeSlot,
    timezone: booking.timezone,
    message: booking.message,
    sentAt: new Date().toISOString()
  };

  outbox.unshift(guestEmailObj, hostEmailObj);
  localStorage.setItem(STORAGE_KEYS.EMAILS, JSON.stringify(outbox));
}
