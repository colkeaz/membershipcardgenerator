/**
 * Generates a unique membership number: SSC-AL-YYYY-XXXXX
 * Uses current school year + a zero-padded counter
 */
export function generateMembershipNumber(sequence) {
  const year = new Date().getFullYear();
  const padded = String(sequence).padStart(5, '0');
  return `SSC-AL-${year}-${padded}`;
}

/**
 * Returns school year string e.g. "2025-2026"
 */
export function getCurrentSchoolYear() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12
  if (month >= 6) {
    return `${year}-${year + 1}`;
  }
  return `${year - 1}-${year}`;
}

/**
 * Returns current semester based on month
 */
export function getCurrentSemester() {
  const month = new Date().getMonth() + 1;
  if (month >= 8 && month <= 12) return '1st Semester';
  if (month >= 1 && month <= 5)  return '2nd Semester';
  return 'Summer';
}

/**
 * Returns expiry label e.g. "Valid until May 2026"
 */
export function getExpiryLabel(schoolYear, semester) {
  if (!schoolYear || !semester) return '';
  const [, endYear] = schoolYear.split('-');
  if (semester === '1st Semester') return `Valid until Jan ${endYear}`;
  if (semester === '2nd Semester') return `Valid until May ${endYear}`;
  return `Valid until Aug ${endYear}`;
}
