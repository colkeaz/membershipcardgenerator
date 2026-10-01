import Papa from 'papaparse';
import { generateMembershipNumber, getCurrentSchoolYear, getCurrentSemester } from './memberNumber.js';

/**
 * Fixed: MED-03 CSV Import Injection Risk as per audit
 * Strips formula-injection prefixes (=, +, -, @, tabs, carriage returns)
 * and truncates fields to avoid excessive payload storage.
 */
export function sanitizeCsvField(val, maxLen = 200) {
  if (typeof val !== 'string') return '';
  // Strip leading formula execution characters
  let clean = val.trim().replace(/^[=+\-@\t\r]+/, '');
  // Strip dangerous angle brackets to mitigate script/HTML storage
  clean = clean.replace(/[<>]/g, '');
  // Enforce maximum length limit
  return clean.slice(0, maxLen);
}

/**
 * Parse a CSV file and return an array of member objects.
 * Expected CSV columns (case-insensitive):
 *   fullName, studentId, course, yearLevel
 */
export function parseCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, ''),
      complete: (result) => {
        if (result.errors.length) {
          reject(new Error(result.errors[0].message));
          return;
        }
        const members = result.data.map((row, i) => {
          // Fixed: MED-03 Sanitize each incoming field from CSV
          const rawName = row.fullname || row['full name'] || row.name || '';
          const rawSid  = row.studentid || row['student id'] || row.id || '';
          const rawProg = row.program || row.course || '';
          const rawDept = row.department || row.college || '';
          const rawYear = row.yearlevel || row['year level'] || row.year || '';

          const prog = sanitizeCsvField(rawProg, 100);
          const dept = sanitizeCsvField(rawDept, 100);
          return {
            fullName:         sanitizeCsvField(rawName, 100),
            studentId:        sanitizeCsvField(rawSid, 20),
            department:       dept,
            program:          prog,
            course:           prog,
            yearLevel:        sanitizeCsvField(rawYear, 20),
            membershipNumber: generateMembershipNumber(i + 1, 'member', dept),
            schoolYear:       getCurrentSchoolYear(),
            semester:         getCurrentSemester(),
            status:           'pending',
            role:             'member',
          };
        });
        resolve(members);
      },
      error: (err) => reject(err),
    });
  });
}

/**
 * Export an array of member objects to a downloadable CSV file.
 */
export function exportToCSV(members, filename = 'ssc-al-members.csv') {
  const formatted = members.map(m => ({
    membershipNumber: m.membershipNumber,
    fullName:         m.fullName,
    studentId:        m.studentId,
    department:       m.department,
    program:          m.program || m.course,
    yearLevel:        m.yearLevel,
    schoolYear:       m.schoolYear,
    semester:         m.semester,
    status:           m.status,
    role:             m.role,
  }));
  const fields = ['membershipNumber', 'fullName', 'studentId', 'department', 'program', 'yearLevel', 'schoolYear', 'semester', 'status', 'role'];
  const csv = Papa.unparse(formatted, { fields });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
