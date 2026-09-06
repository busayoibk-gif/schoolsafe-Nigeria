/**
 * Utilities for Nigerian locale, Africa/Lagos timezone, and Nigerian phone validation/formatting
 */

export const LAGOS_TIMEZONE = 'Africa/Lagos';

/**
 * Get current date string in Lagos timezone formatted as YYYY-MM-DD
 */
export function getLagosDate(date: Date = new Date()): string {
  // Use Intl.DateTimeFormat with Africa/Lagos
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: LAGOS_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date); // outputs YYYY-MM-DD
}

/**
 * Get current formatted time in Lagos (e.g. "08:15 AM")
 */
export function getLagosTime(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-NG', {
    timeZone: LAGOS_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/**
 * Get full formatted date for display (e.g. "Monday, 15 Sept 2026")
 */
export function formatLagosFullDate(dateStr?: string | Date): string {
  if (!dateStr) return '';
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return new Intl.DateTimeFormat('en-NG', {
    timeZone: LAGOS_TIMEZONE,
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
}

/**
 * Check whether a specific time (e.g., "08:20 AM") is later than late threshold (e.g., "08:15")
 */
export function isTimeLate(timeStr: string, lateThreshold: string = '08:15'): boolean {
  try {
    // Parse timeStr like "08:20 AM" or "08:20:00" or Date ISO
    let hours = 0;
    let minutes = 0;

    if (timeStr.includes(':')) {
      const isPM = /PM/i.test(timeStr);
      const isAM = /AM/i.test(timeStr);
      const clean = timeStr.replace(/[^\d:]/g, '').trim();
      const parts = clean.split(':').map(Number);
      hours = parts[0] || 0;
      minutes = parts[1] || 0;

      if (isPM && hours < 12) hours += 12;
      if (isAM && hours === 12) hours = 0;
    }

    const [tHours, tMinutes] = lateThreshold.split(':').map(Number);
    const timeInMins = hours * 60 + minutes;
    const threshInMins = tHours * 60 + (tMinutes || 0);

    return timeInMins > threshInMins;
  } catch {
    return false;
  }
}

/**
 * Nigerian phone number parsing, validation, and normalization
 */
export interface NigerianPhoneResult {
  isValid: boolean;
  raw: string;
  normalized: string; // e.g. 2348031234567 (used by Termii and E.164)
  formatted: string;  // e.g. +234 803 123 4567 (used in display)
  local: string;      // e.g. 0803 123 4567
  error?: string;
}

export function parseNigerianPhone(phone: string): NigerianPhoneResult {
  if (!phone || typeof phone !== 'string') {
    return {
      isValid: false,
      raw: phone || '',
      normalized: '',
      formatted: '',
      local: '',
      error: 'Phone number is required',
    };
  }

  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');

  let digits = cleaned;
  if (cleaned.startsWith('+234')) {
    digits = '234' + cleaned.slice(4);
  } else if (cleaned.startsWith('234')) {
    digits = cleaned;
  } else if (cleaned.startsWith('0')) {
    digits = '234' + cleaned.slice(1);
  } else if (cleaned.length === 10) {
    digits = '234' + cleaned;
  }

  // A standard Nigerian mobile number is 13 digits starting with 234
  // Valid network prefixes: 70, 80, 81, 90, 91
  const isMatch = /^234[789][01]\d{8}$/.test(digits) || /^234\d{10}$/.test(digits);

  if (!isMatch) {
    return {
      isValid: false,
      raw: phone,
      normalized: digits,
      formatted: phone,
      local: phone,
      error: 'Invalid Nigerian phone number. Format should be 080XXXXXXXX or +23480XXXXXXXX',
    };
  }

  const localPart = digits.slice(3); // 10 digits
  const formatted = `+234 ${localPart.slice(0, 3)} ${localPart.slice(3, 6)} ${localPart.slice(6)}`;
  const local = `0${localPart.slice(0, 3)} ${localPart.slice(3, 6)} ${localPart.slice(6)}`;

  return {
    isValid: true,
    raw: phone,
    normalized: digits,
    formatted,
    local,
  };
}

/**
 * Format class and stream display according to requirements:
 * "Reception 1 – Wisdom"
 * Creche without stream: "Creche 1"
 */
export function formatClassStream(className: string, streamName?: string | null): string {
  if (!streamName || streamName.trim() === '' || streamName === 'None') {
    return className;
  }
  return `${className} – ${streamName}`;
}
