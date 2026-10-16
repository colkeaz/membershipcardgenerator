import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import {
  YEAR_LEVELS,
  DEPARTMENTS,
  TICKET_CATEGORIES,
  computeRegistrationDiff,
} from '../utils/constants';
import {
  validateFullName,
  validateStudentId,
  sanitizeInput,
} from '../utils/validators';
import {
  X,
  FileEdit,
  UserCheck,
  Hash,
  BookOpen,
  GraduationCap,
  AlertTriangle,
  ArrowRight,
  MessageSquareText,
} from 'lucide-react';

export default function SubmitTicketModal({
  isOpen,
  onClose,
  member,
  user,
  onSuccess,
}) {
  const [category, setCategory] = useState('edit_details');
  const [reason, setReason] = useState('');
  const [form, setForm] = useState({
    fullName: '',
    studentId: '',
    department: '',
    program: '',
    yearLevel: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Sync initial form state whenever modal opens or member changes
  useEffect(() => {
    if (isOpen && member) {
      setCategory('edit_details');
      setReason('');
      setForm({
        fullName: member.fullName || '',
        studentId: member.studentId || '',
        department: member.department || '',
        program: member.program || member.course || '',
        yearLevel: member.yearLevel || '',
      });
      setErrors({});
    }
  }, [isOpen, member]);

  if (!isOpen || !member) return null;

  const normalizedStudentId = (form.studentId || '').replace(/[–—−]/g, '-').trim();
  const diffs = computeRegistrationDiff(member, {
    ...form,
    fullName: sanitizeInput(form.fullName, 100),
    studentId: sanitizeInput(normalizedStudentId, 20),
  });
  const departmentChanged =
    Boolean(form.department) && form.department !== member.department;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'department') {
      setForm((prev) => ({ ...prev, department: value, program: '' }));
      setErrors((prev) => ({ ...prev, department: '', program: '', general: '' }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
      setErrors((prev) => ({ ...prev, [name]: '', general: '' }));
    }
  };

  const validate = () => {
    const e = {};
    const cleanReason = sanitizeInput(reason, 500);
    if (!cleanReason) {
      e.reason = 'Please provide a reason for submitting this ticket.';
    } else if (cleanReason.length < 5) {
      e.reason = 'Please provide a brief explanation (at least 5 characters).';
    }

    const nameErr = validateFullName(form.fullName);
    if (nameErr) e.fullName = nameErr;

    const idErr = validateStudentId(normalizedStudentId);
    if (idErr) e.studentId = idErr;

    if (!form.department) e.department = 'Please select your department';
    if (!form.program) e.program = 'Please select your program';
    if (!form.yearLevel) e.yearLevel = 'Please select your year level';

    if (Object.keys(e).length === 0 && diffs.length === 0) {
      e.general =
        'No changes detected. Please modify at least one field (Full Name, SR-Code, Department, Program, or Year Level) before submitting.';
    }
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      const cleanReason = sanitizeInput(reason, 500);
      const cleanFullName = sanitizeInput(form.fullName, 100);
      const cleanStudentId = sanitizeInput(normalizedStudentId, 20);

      await addDoc(collection(db, 'tickets'), {
        uid: user.uid,
        email: user.email,
        membershipNumber: member.membershipNumber || '',
        memberStatus: member.status || 'pending',
        category,
        reason: cleanReason,
        currentDetails: {
          fullName: member.fullName || '',
          studentId: member.studentId || '',
          department: member.department || '',
          program: member.program || member.course || '',
          yearLevel: member.yearLevel || '',
        },
        proposedChanges: {
          fullName: cleanFullName,
          studentId: cleanStudentId,
          department: form.department,
          program: form.program,
          course: form.program,
          yearLevel: form.yearLevel,
        },
        departmentChanged,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to submit ticket:', err);
      setErrors({
        general: err?.message || 'Failed to submit ticket. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ticket-modal-title"
    >
      <div className="modal ticket-modal">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="ticket-modal-icon">
              <FileEdit size={18} />
            </div>
            <div>
              <h2 id="ticket-modal-title" style={{ fontSize: '1.15rem', margin: 0 }}>
                Submit Correction Ticket
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                Request an officer to update errors in your registration details
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="ticket-modal-form">
          {/* Step 1: Ticket Type & Reason */}
          <div className="form-group">
            <label htmlFor="ticket-category" className="form-label">
              Ticket Category
            </label>
            <select
              id="ticket-category"
              className="form-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {TICKET_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="ticket-reason" className="form-label">
              <MessageSquareText size={13} style={{ display: 'inline', marginRight: 4 }} />
              Reason for Submission
            </label>
            <textarea
              id="ticket-reason"
              rows={2}
              maxLength={500}
              className={`form-input ${errors.reason ? 'input-error' : ''}`}
              placeholder="Explain what needs to be corrected (e.g., typo in SR-Code, misclicked department or year level)..."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (errors.reason) setErrors((prev) => ({ ...prev, reason: '' }));
              }}
              style={{ resize: 'vertical', minHeight: '64px' }}
            />
            {errors.reason && <span className="field-error">{errors.reason}</span>}
          </div>

          {/* Step 2: All 5 Editable Registration Fields */}
          {category === 'edit_details' && (
            <div className="ticket-fields-section">
              <div className="ticket-fields-section-header">
                <span>Corrected Registration Details</span>
                <span className="ticket-fields-hint">Edit any field that has an error</span>
              </div>

              <div className="ticket-fields-grid">
                {/* 1. Full Name */}
                <div className="form-group">
                  <label htmlFor="ticket-fullName" className="form-label">
                    <UserCheck size={13} style={{ display: 'inline', marginRight: 4 }} />
                    Full Name
                  </label>
                  <input
                    id="ticket-fullName"
                    name="fullName"
                    type="text"
                    className={`form-input ${errors.fullName ? 'input-error' : ''}`}
                    value={form.fullName}
                    onChange={handleChange}
                    placeholder="Juan Dela Cruz"
                  />
                  {errors.fullName && <span className="field-error">{errors.fullName}</span>}
                </div>

                {/* 2. SR-Code (studentId) */}
                <div className="form-group">
                  <label htmlFor="ticket-studentId" className="form-label">
                    <Hash size={13} style={{ display: 'inline', marginRight: 4 }} />
                    SR-Code
                  </label>
                  <input
                    id="ticket-studentId"
                    name="studentId"
                    type="text"
                    className={`form-input ${errors.studentId ? 'input-error' : ''}`}
                    value={form.studentId}
                    onChange={handleChange}
                    placeholder="24-XXXXX (e.g. 24-00627)"
                  />
                  {errors.studentId && <span className="field-error">{errors.studentId}</span>}
                </div>

                {/* 3. Department / College */}
                <div className="form-group">
                  <label htmlFor="ticket-department" className="form-label">
                    <BookOpen size={13} style={{ display: 'inline', marginRight: 4 }} />
                    Department / College
                  </label>
                  <select
                    id="ticket-department"
                    name="department"
                    className={`form-select ${errors.department ? 'input-error' : ''}`}
                    value={form.department}
                    onChange={handleChange}
                  >
                    <option value="">Select department…</option>
                    {Object.keys(DEPARTMENTS).map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                  {errors.department && <span className="field-error">{errors.department}</span>}
                </div>

                {/* 4. Program */}
                <div className="form-group">
                  <label htmlFor="ticket-program" className="form-label">
                    <BookOpen size={13} style={{ display: 'inline', marginRight: 4 }} />
                    Program
                  </label>
                  <select
                    id="ticket-program"
                    name="program"
                    className={`form-select ${errors.program ? 'input-error' : ''}`}
                    value={form.program}
                    onChange={handleChange}
                    disabled={!form.department}
                  >
                    <option value="">Select program…</option>
                    {form.department &&
                      (DEPARTMENTS[form.department] || []).map((prog) => (
                        <option key={prog} value={prog}>
                          {prog}
                        </option>
                      ))}
                  </select>
                  {errors.program && <span className="field-error">{errors.program}</span>}
                </div>

                {/* 5. Year Level */}
                <div className="form-group">
                  <label htmlFor="ticket-yearLevel" className="form-label">
                    <GraduationCap size={13} style={{ display: 'inline', marginRight: 4 }} />
                    Year Level
                  </label>
                  <select
                    id="ticket-yearLevel"
                    name="yearLevel"
                    className={`form-select ${errors.yearLevel ? 'input-error' : ''}`}
                    value={form.yearLevel}
                    onChange={handleChange}
                  >
                    <option value="">Select year level…</option>
                    {YEAR_LEVELS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                  {errors.yearLevel && <span className="field-error">{errors.yearLevel}</span>}
                </div>
              </div>

              {/* Warning when Department is changed */}
              {departmentChanged && (
                <div className="ticket-dept-warning" role="note">
                  <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <strong>Department Change Notice:</strong> Because Membership Numbers are
                    indexed by department, approving a department change will automatically
                    assign you a <strong>new Membership Number</strong> corresponding to{' '}
                    <em>{form.department}</em>.
                  </div>
                </div>
              )}

              {/* Live summary of fields being modified */}
              {diffs.length > 0 && (
                <div className="ticket-diff-preview">
                  <span className="ticket-diff-preview-title">
                    Changes to be submitted ({diffs.length}):
                  </span>
                  <div className="ticket-diff-list">
                    {diffs.map((d) => (
                      <div key={d.key} className="ticket-diff-row">
                        <span className="ticket-diff-label">{d.label}:</span>
                        <span className="ticket-diff-before">{d.before}</span>
                        <ArrowRight size={12} className="ticket-diff-arrow" />
                        <span className="ticket-diff-after">{d.after}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {errors.general && (
            <div className="ticket-general-error" role="alert">
              {errors.general}
            </div>
          )}

          <div className="ticket-modal-actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              id="btn-submit-ticket"
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="spinner spinner-sm" /> Submitting Ticket…
                </>
              ) : (
                'Submit Ticket for Approval'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
