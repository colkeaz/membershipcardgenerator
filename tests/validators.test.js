import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  validateFullName,
  validateStudentId,
  isValidUniversityEmail,
  sanitizeInput,
} from '../src/utils/validators.js';

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
    it('accepts valid student ID formats (20XX-XXXXX)', () => {
      assert.strictEqual(validateStudentId('2021-12345'), null);
      assert.strictEqual(validateStudentId('2024-00001'), null);
      assert.strictEqual(validateStudentId('2020-99999'), null);
    });

    it('rejects empty or whitespace-only student IDs', () => {
      assert.strictEqual(validateStudentId(''), 'Student ID is required');
      assert.strictEqual(validateStudentId('   '), 'Student ID is required');
      assert.strictEqual(validateStudentId(null), 'Student ID is required');
    });

    it('blocks SQL injection attempts in student ID', () => {
      const sqli = "2021-12345' OR 1=1--";
      assert.strictEqual(validateStudentId(sqli), 'Format must be 20XX-XXXXX');
    });

    it('blocks malformed or arbitrary alphanumeric student IDs', () => {
      assert.strictEqual(validateStudentId('SR-12345'), 'Format must be 20XX-XXXXX');
      assert.strictEqual(validateStudentId('2021-ABCDE'), 'Format must be 20XX-XXXXX');
      assert.strictEqual(validateStudentId('202112345'), 'Format must be 20XX-XXXXX');
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
});
