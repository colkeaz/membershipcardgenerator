import Papa from 'papaparse';
import { generateMembershipNumber, getCurrentSchoolYear, getCurrentSemester } from './memberNumber';

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
        const members = result.data.map((row, i) => ({
          fullName:         row.fullname || row['full name'] || row.name || '',
          studentId:        row.studentid || row['student id'] || row.id || '',
          course:           row.course || row.program || '',
          yearLevel:        row.yearlevel || row['year level'] || row.year || '',
          membershipNumber: generateMembershipNumber(i + 1),
          schoolYear:       getCurrentSchoolYear(),
          semester:         getCurrentSemester(),
          status:           'pending',
          role:             'member',
        }));
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
  const fields = ['membershipNumber', 'fullName', 'studentId', 'course', 'yearLevel', 'schoolYear', 'semester', 'status', 'role'];
  const csv = Papa.unparse(members, { fields });
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
