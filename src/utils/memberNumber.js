/**
 * Generates a unique membership number: SSC-AL-YYYY-XXXXX
 * Uses current school year + a zero-padded counter
 */
const DEPT_ACRONYMS = {
  "Department of Chemical Engineering": "CHE",
  "Department of Civil Engineering": "CE",
  "Department of Electrical Engineering": "EE",
  "Department of Electronics Engineering": "ECE",
  "Department of Industrial Engineering": "IE",
  "Department of Mechanical Engineering": "ME",
  "College of Architecture, Fine Arts and Design": "CAFAD",
  "College of Informatics and Computing Sciences": "CICS",
  "College of Engineering and Technology": "CET",
  "CAF Lobo": "CAF",
  "CICS Balayan": "CICS",
  "CET Balayan": "CET",
  "CICS Mabini": "CICS",
  "College of Engineering and Technology LIMA": "CET"
};

export function generateMembershipNumber(sequence, role = 'member', department = '') {
  const padded = String(sequence).padStart(5, '0');
  if (role === 'partner') {
    return `SSC-AL-PARTNER-${padded}`;
  }
  const year = new Date().getFullYear();
  const deptCode = DEPT_ACRONYMS[department] || 'AL';
  return `SSC-${year}-${deptCode}-${padded}`;
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
