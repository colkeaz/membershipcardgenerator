import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  validateFullName,
  validateStudentId,
  isValidUniversityEmail,
  sanitizeInput,
} from '../src/utils/validators.js';
import {
  DEPARTMENTS,
  YEAR_LEVELS,
  EDITABLE_DETAIL_FIELDS,
  computeRegistrationDiff,
} from '../src/utils/constants.js';
import { generateMembershipNumber } from '../src/utils/memberNumber.js';

describe('Security Audit — MED-01: Registration Input Sanitization & Validation', () => {
  describe('Full Name Validation (validateFullName)', () => {
    it('accepts valid Filipino and English names with accents', () => {
      assert.strictEqual(validateFullName('Juan Dela Cruz'), null);
      assert.strictEqual(validateFullName('Maria Santos-Reyes'), null);
      assert.strictEqual(validateFullName('Niña Peña'), null);
      assert.strictEqual(validateFullName('Jose P. Rizal Jr.'), null);
    });

    it('rejects empty or whitespace-only names', () => {
      assert.strictEqual(validateFullName(''), 'Full name is required');
      assert.strictEqual(validateFullName('   '), 'Full name is required');
      assert.strictEqual(validateFullName(null), 'Full name is required');
    });

    it('blocks names exceeding 100 characters (buffer/storage DoS)', () => {
      const longName = 'A'.repeat(101);
      assert.strictEqual(validateFullName(longName), 'Name is too long (max 100 chars)');
    });

    it('blocks XSS script payload attempts', () => {
      const xssPayload = '<script>alert("xss")</script>';
      assert.strictEqual(validateFullName(xssPayload), 'Name contains invalid characters');
    });

    it('blocks SQL injection style payloads', () => {
      const sqliPayload = "Juan' OR '1'='1";
      assert.strictEqual(validateFullName(sqliPayload), 'Name contains invalid characters');
    });

    it('blocks HTML tag injection', () => {
      const htmlPayload = '<img src=x onerror=alert(1)>';
      assert.strictEqual(validateFullName(htmlPayload), 'Name contains invalid characters');
    });
  });

  describe('Student ID Validation (validateStudentId)', () => {
    it('accepts valid student ID formats (e.g. 24-00627, 21-12345, 2024-00001)', () => {
      assert.strictEqual(validateStudentId('24-00627'), null);
      assert.strictEqual(validateStudentId('21-12345'), null);
      assert.strictEqual(validateStudentId('2024-00001'), null);
      assert.strictEqual(validateStudentId('2020-99999'), null);
    });

    it('rejects empty or whitespace-only student IDs', () => {
      assert.strictEqual(validateStudentId(''), 'Student ID is required');
      assert.strictEqual(validateStudentId('   '), 'Student ID is required');
      assert.strictEqual(validateStudentId(null), 'Student ID is required');
    });

    it('blocks SQL injection attempts in student ID', () => {
      const sqli = "24-00627' OR 1=1--";
      assert.strictEqual(validateStudentId(sqli), 'Format must be YY-XXXXX (e.g. 24-00627)');
    });

    it('blocks malformed or arbitrary alphanumeric student IDs', () => {
      assert.strictEqual(validateStudentId('SR-12345'), 'Format must be YY-XXXXX (e.g. 24-00627)');
      assert.strictEqual(validateStudentId('24-ABCDE'), 'Format must be YY-XXXXX (e.g. 24-00627)');
      assert.strictEqual(validateStudentId('2400627'), 'Format must be YY-XXXXX (e.g. 24-00627)');
      assert.strictEqual(validateStudentId('2-00627'), 'Format must be YY-XXXXX (e.g. 24-00627)');
    });
  });

  describe('Text Sanitization (sanitizeInput)', () => {
    it('strips dangerous angle brackets from input', () => {
      const dirty = '<script>evil()</script>Hello World';
      const clean = sanitizeInput(dirty);
      assert.strictEqual(clean, 'scriptevil()/scriptHello World');
    });

    it('truncates inputs to maximum permitted length', () => {
      const longInput = 'X'.repeat(150);
      const clean = sanitizeInput(longInput, 50);
      assert.strictEqual(clean.length, 50);
    });
  });
});

describe('Security Audit — HIGH-02: University OAuth Domain Validation', () => {
  it('allows valid university domain emails (@g.batstate-u.edu.ph)', () => {
    assert.strictEqual(isValidUniversityEmail('student@g.batstate-u.edu.ph'), true);
    assert.strictEqual(isValidUniversityEmail('21-00001@g.batstate-u.edu.ph'), true);
  });

  it('rejects unauthorized external email providers', () => {
    assert.strictEqual(isValidUniversityEmail('attacker@gmail.com'), false);
    assert.strictEqual(isValidUniversityEmail('attacker@yahoo.com'), false);
    assert.strictEqual(isValidUniversityEmail('admin@bulsu.edu.ph'), false);
  });

  it('rejects domain spoofing and subdomain traversal attempts', () => {
    assert.strictEqual(isValidUniversityEmail('attacker@g.batstate-u.edu.ph.attacker.com'), false);
    assert.strictEqual(isValidUniversityEmail('attacker@evil-g.batstate-u.edu.ph'), false);
    assert.strictEqual(isValidUniversityEmail('attacker@batstate-u.edu.ph'), false);
  });

  it('validates whitelisted administrator emails', () => {
    assert.strictEqual(isValidUniversityEmail('sscalangilan.storage@gmail.com'), true);
    assert.strictEqual(isValidUniversityEmail('paala.luke24@gmail.com'), true);
  });
});

describe('Registration Detail Correction Tickets — All 5 Fields & Department ID Rule', () => {
  it('exposes all 5 editable registration fields including SR-Code (studentId)', () => {
    const keys = EDITABLE_DETAIL_FIELDS.map((f) => f.key);
    assert.deepStrictEqual(keys, [
      'fullName',
      'studentId',
      'department',
      'program',
      'yearLevel',
    ]);
    assert.ok(Object.keys(DEPARTMENTS).length >= 14);
    assert.strictEqual(YEAR_LEVELS.length, 5);
  });

  it('detects changes across all 5 registration fields (Full Name, SR-Code, Department, Program, Year Level)', () => {
    const current = {
      fullName: 'Juan Dela Cruz',
      studentId: '24-00627',
      department: 'Department of Electrical Engineering',
      program: 'Bachelor of Science in Electrical Engineering (BSEE)',
      yearLevel: '1st Year',
    };
    const proposed = {
      fullName: 'Juan M. Dela Cruz',
      studentId: '24-00628',
      department: 'Department of Civil Engineering',
      program: 'Bachelor of Science in Civil Engineering (BSCE)',
      yearLevel: '2nd Year',
    };

    const diffs = computeRegistrationDiff(current, proposed);
    assert.strictEqual(diffs.length, 5);
    assert.strictEqual(diffs[0].key, 'fullName');
    assert.strictEqual(diffs[1].key, 'studentId');
    assert.strictEqual(diffs[1].before, '24-00627');
    assert.strictEqual(diffs[1].after, '24-00628');
    assert.strictEqual(diffs[2].key, 'department');
    assert.strictEqual(diffs[3].key, 'program');
    assert.strictEqual(diffs[4].key, 'yearLevel');
  });

  it('returns an empty array when no registration fields were modified', () => {
    const current = {
      fullName: 'Juan Dela Cruz',
      studentId: '24-00627',
      department: 'Department of Electrical Engineering',
      program: 'Bachelor of Science in Electrical Engineering (BSEE)',
      yearLevel: '1st Year',
    };
    assert.strictEqual(computeRegistrationDiff(current, { ...current }).length, 0);
  });

  it('generates a new department-specific membershipNumber with a new sequence when department changes', () => {
    const oldNum = generateMembershipNumber(12, 'member', 'Department of Electrical Engineering');
    const newNum = generateMembershipNumber(13, 'member', 'Department of Civil Engineering');
    const year = new Date().getFullYear();

    assert.strictEqual(oldNum, `SSC-${year}-EE-00012`);
    assert.strictEqual(newNum, `SSC-${year}-CE-00013`);
    assert.notStrictEqual(oldNum, newNum);
  });
});


