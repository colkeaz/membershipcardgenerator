import { getCurrentSchoolYear, getCurrentSemester } from './memberNumber.js';

export const DEMO_MEMBER = {
  fullName: 'DELA CRUZ, JUAN M.',
  studentId: '2024-00001',
  department: 'Department of Electrical Engineering',
  program: 'BS Computer Engineering',
  yearLevel: '2nd Year',
  get membershipNumber() { return `SSC-AL-${new Date().getFullYear()}-00001`; },
  get schoolYear() { return getCurrentSchoolYear(); },
  get semester() { return getCurrentSemester(); },
  status: 'active',
};

export const DEMO_QR_TEXT = 'https://membershipcardgen.web.app/verify?preview=true';
