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

export const YEAR_LEVELS = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
  '5th Year and above ',
];

export const DEPARTMENTS = {
  "Department of Chemical Engineering": [
    "Bachelor of Science in Ceramics Engineering (BSCerE)",
    "Bachelor of Science in Chemical Engineering (BSChE)",
    "Bachelor of Science in Food Engineering (BSFE)",
    "Bachelor of Science in Metallurgical Engineering (BSMetE)"
  ],
  "Department of Civil Engineering": [
    "Bachelor of Science in Civil Engineering (BSCE)",
    "Bachelor of Science in Geodetic Engineering (BSGE)",
    "Bachelor of Science in Geological Engineering (BSGeoE)",
    "Bachelor of Science in Sanitary Engineering (BSSE)",
    "Bachelor of Science in Transportation Systems Engineering (BSTE)"
  ],
  "Department of Electrical Engineering": [
    "Bachelor of Science in Computer Engineering (BSCpE)",
    "Bachelor of Science in Electrical Engineering (BSEE)"
  ],
  "Department of Electronics Engineering": [
    "Bachelor of Science in Aerospace Engineering (BSAeE)",
    "Bachelor of Science in Biomedical Engineering (BSBioE)",
    "Bachelor of Science in Electronics Engineering (BSECE)",
    "Bachelor of Science in Instrumentation and Control Engineering (BSICE)",
    "Bachelor of Science in Mechatronics Engineering (BSMexE)"
  ],
  "Department of Industrial Engineering": [
    "Bachelor of Science in Industrial Engineering (BSIE)"
  ],
  "Department of Mechanical Engineering": [
    "Bachelor of Science in Automotive Engineering (BSAE)",
    "Bachelor of Science in Mechanical Engineering (BSME)",
    "Bachelor of Science in Petroleum Engineering (BSPetE)",
    "Bachelor of Science in Naval Architecture and Marine Engineering (BSNAME)"
  ],
  "College of Architecture, Fine Arts and Design": [
    "Bachelor of Fine Arts and Design Major in Visual Communication",
    "Bachelor of Science in Architecture",
    "Bachelor of Science in Interior Design"
  ],
  "College of Informatics and Computing Sciences": [
    "Bachelor of Science in Computer Science",
    "Bachelor of Science in Information Technology"
  ],
  "College of Engineering and Technology": [
    "Bachelor of Automotive Engineering Technology",
    "Bachelor of Civil Engineering Technology",
    "Bachelor of Computer Engineering Technology",
    "Bachelor of Drafting Engineering Technology",
    "Bachelor of Electrical Engineering Technology",
    "Bachelor of Electronics Engineering Technology",
    "Bachelor of Food Engineering Technology",
    "Bachelor of Instrumentation and Control Engineering Technology",
    "Bachelor of Mechanical Engineering Technology",
    "Bachelor of Mechatronics Engineering Technology",
    "Bachelor of Welding and Fabrication Engineering Technology"
  ],
  "CAF Lobo": [
    "Bachelor of Science in Agriculture",
    "Bachelor of Science in Forestry"
  ],
  "CICS Balayan": [
    "Bachelor of Science in Information Technology"
  ],
  "CET Balayan": [
    "Bachelor of Industrial Technology - Automotive Technology",
    "Bachelor of Industrial Technology - Civil Technology",
    "Bachelor of Industrial Technology - Computer Technology",
    "Bachelor of Industrial Technology - Drafting Technology",
    "Bachelor of Industrial Technology - Electrical Technology",
    "Bachelor of Industrial Technology - Electronics Technology",
    "Bachelor of Industrial Technology - Instrumentation and Control Technology",
    "Bachelor of Industrial Technology - Mechanical Technology"
  ],
  "CICS Mabini": [
    "Bachelor of Science in Information Technology"
  ],
  "College of Engineering and Technology LIMA": [
    "Bachelor of Science in Aerospace Engineering (BSAeE)",
    "Bachelor of Science in Automotive Engineering (BSAE)",
    "Bachelor of Science in Biomedical Engineering (BSBioE)",
    "Bachelor of Science in Food Engineering (BSFE)",
    "Bachelor of Science in Instrumentation and Control Engineering (BSICE)",
    "Bachelor of Science in Mechatronics Engineering (BSMexE)",
    "Bachelor of Science in Transportation Systems Engineering (BSTE)",
    "Bachelor of Computer Engineering Technology",
    "Bachelor of Electrical Engineering Technology"
  ]
};

export const TICKET_CATEGORIES = [
  {
    value: 'edit_details',
    label: 'Edit Registration Details (Name, SR-Code, Department, Program, Year Level)',
  },
];

export const EDITABLE_DETAIL_FIELDS = [
  { key: 'fullName',   label: 'Full Name' },
  { key: 'studentId',  label: 'SR-Code' },
  { key: 'department', label: 'Department / College' },
  { key: 'program',    label: 'Program' },
  { key: 'yearLevel',  label: 'Year Level' },
];

/**
 * Compares current member details with proposed changes across all 5 registration fields.
 * Returns an array of { key, label, before, after } for fields that changed.
 */
export function computeRegistrationDiff(current = {}, proposed = {}) {
  const diffs = [];
  for (const { key, label } of EDITABLE_DETAIL_FIELDS) {
    const beforeVal = key === 'program'
      ? String(current.program || current.course || '').trim()
      : String(current[key] || '').trim();
    const afterVal = key === 'program'
      ? String(proposed.program || proposed.course || '').trim()
      : String(proposed[key] || '').trim();

    if (beforeVal !== afterVal) {
      diffs.push({
        key,
        label,
        before: beforeVal || '—',
        after: afterVal || '—',
      });
    }
  }
  return diffs;
}
