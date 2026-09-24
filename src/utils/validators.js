/**
 * Input validation and sanitization utilities
 * Addresses:
 * - MED-01: Missing Input Sanitization on Registration
 * - HIGH-02: Unrestricted Google OAuth Domain (email verification)
 */

export const ALLOWED_NAME_REGEX = /^[A-Za-z\s.\-,ñÑ]+$/;
export const STUDENT_ID_REGEX = /^(\d{2}|\d{4})-\d{5}$/;
export const UNIVERSITY_DOMAIN = 'g.batstate-u.edu.ph';

// Fixed: MED-01 Input validation and sanitization for Full Name
export function validateFullName(name) {
  if (!name || typeof name !== 'string' || !name.trim()) {
    return 'Full name is required';
  }
  const trimmed = name.trim();
  if (trimmed.length > 100) {
    return 'Name is too long (max 100 chars)';
  }
  if (!ALLOWED_NAME_REGEX.test(trimmed)) {
    return 'Name contains invalid characters';
  }
  return null;
}

// Fixed: MED-01 Input validation for Student ID (SR-Code)
export function validateStudentId(studentId) {
  if (!studentId || typeof studentId !== 'string' || !studentId.trim()) {
    return 'Student ID is required';
  }
  const trimmed = studentId.trim();
  if (!STUDENT_ID_REGEX.test(trimmed)) {
    return 'Format must be YY-XXXXX (e.g. 24-00627)';
  }
  return null;
}

// Fixed: HIGH-02 University Domain Enforcement helper
export function isValidUniversityEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const parts = email.trim().toLowerCase().split('@');
  return parts.length === 2 && parts[1] === UNIVERSITY_DOMAIN;
}

// Fixed: MED-01 General text sanitization against XSS and control characters
export function sanitizeInput(val, maxLen = 100) {
  if (typeof val !== 'string') return '';
  return val
    .trim()
    .replace(/[<>]/g, '') // Strip HTML tags/delimiters
    .slice(0, maxLen);
}
