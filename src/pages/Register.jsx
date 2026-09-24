import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/ToastProvider';
import { generateMembershipNumber, getCurrentSchoolYear, getCurrentSemester } from '../utils/memberNumber';
// Fixed: MED-01 Missing Input Sanitization on Registration as per audit
import { validateFullName, validateStudentId, sanitizeInput } from '../utils/validators';
import { UserCheck, BookOpen, GraduationCap, Hash } from 'lucide-react';
import PrivacyConsentModal from '../components/PrivacyConsentModal';
import './Register.css';

const YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];
const COURSES = [
  'BS Computer Engineering',
  'BS Civil Engineering',
  'BS Electrical Engineering',
  'BS Electronics Engineering',
  'BS Industrial Engineering',
  'BS Mechanical Engineering',
  'BS Chemical Engineering',
  'BS Architecture',
  'BS Information Technology',
  'BS Computer Science',
  'Other',
];

export default function Register() {
  const { user, refreshMember } = useAuth();
  const toast    = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName:  user?.displayName || '',
    studentId: '',
    course:    '',
    yearLevel: '',
  });
  const [loading, setLoading]           = useState(false);
  const [errors,  setErrors]            = useState({});
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Fixed: MED-01 Missing Input Sanitization on Registration as per audit
  const validate = () => {
    const e = {};
    const nameErr = validateFullName(form.fullName);
    if (nameErr) e.fullName = nameErr;

    const idErr = validateStudentId(form.studentId);
    if (idErr) e.studentId = idErr;

    if (!form.course)    e.course    = 'Please select your program';
    if (!form.yearLevel) e.yearLevel = 'Please select your year level';
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  /* Step 1: Validate form fields, then open the privacy consent modal */
  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setShowPrivacyModal(true);
  };

  /* Step 2a: User accepted — proceed with the actual registration */
  const handleAcceptPrivacy = useCallback(async () => {
    setLoading(true);
    try {
      // Use a counter doc to get the next sequence number atomically
      const counterRef = doc(db, 'org', 'memberCounter');
      const memberRef  = doc(db, 'members', user.uid);

      // Fixed: MED-01 Sanitize inputs before persisting to Firestore
      const cleanFullName  = sanitizeInput(form.fullName, 100);
      const cleanStudentId = sanitizeInput(form.studentId, 20);

      let membershipNumber;
      await runTransaction(db, async (tx) => {
        const counterSnap = await tx.get(counterRef);
        const seq = (counterSnap.exists() ? counterSnap.data().count : 0) + 1;
        membershipNumber = generateMembershipNumber(seq);
        tx.set(counterRef, { count: seq }, { merge: true });
        tx.set(memberRef, {
          uid:              user.uid,
          email:            user.email,
          fullName:         cleanFullName,
          studentId:        cleanStudentId,
          program:          form.course,
          course:           form.course,
          yearLevel:        form.yearLevel,
          membershipNumber,
          schoolYear:       getCurrentSchoolYear(),
          semester:         getCurrentSemester(),
          status:           'pending',
          role:             'member',
          privacyConsent:   true,
          privacyConsentAt: serverTimestamp(),
          createdAt:        serverTimestamp(),
        });
      });

      await refreshMember();
      toast('Registration submitted! Awaiting officer approval.', 'success');
      navigate('/card');
    } catch (err) {
      console.error(err);
      toast('Registration failed. Please try again.', 'error');
    } finally {
      setLoading(false);
      setShowPrivacyModal(false);
    }
  }, [form, user, refreshMember, toast, navigate]);

  /* Step 2b: User declined — close modal, halt registration */
  const handleDeclinePrivacy = useCallback(() => {
    setShowPrivacyModal(false);
    toast('You must accept the Data Privacy terms to register.', 'info');
  }, [toast]);

  return (
    <main className="register-page">
      <div className="register-bg" aria-hidden="true" />
      <div className="container register-container">
        <div className="register-card glass">
          {/* Header */}
          <div className="register-header">
            <img src="/logo.jpg" alt="SSC-AL" className="register-logo" />
            <div>
              <h1 className="register-title">Join SSC-AL</h1>
              <p className="register-sub">Complete your membership registration</p>
            </div>
          </div>

          <form id="registration-form" onSubmit={handleSubmit} noValidate>
            <div className="register-fields">
              {/* Full Name */}
              <div className="form-group">
                <label htmlFor="reg-fullName" className="form-label">
                  <UserCheck size={13} style={{ display:'inline', marginRight:4 }} />
                  Full Name
                </label>
                <input
                  id="reg-fullName"
                  name="fullName"
                  type="text"
                  className={`form-input ${errors.fullName ? 'input-error' : ''}`}
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Juan Dela Cruz"
                  autoComplete="name"
                />
                {errors.fullName && <span className="field-error">{errors.fullName}</span>}
              </div>

              {/* Student ID */}
              <div className="form-group">
                <label htmlFor="reg-studentId" className="form-label">
                  <Hash size={13} style={{ display:'inline', marginRight:4 }} />
                  SR-Code
                </label>
                <input
                  id="reg-studentId"
                  name="studentId"
                  type="text"
                  className={`form-input ${errors.studentId ? 'input-error' : ''}`}
                  value={form.studentId}
                  onChange={handleChange}
                  placeholder="20XX-XXXXX"
                />
                {errors.studentId && <span className="field-error">{errors.studentId}</span>}
              </div>

              {/* Program */}
              <div className="form-group">
                <label htmlFor="reg-course" className="form-label">
                  <BookOpen size={13} style={{ display:'inline', marginRight:4 }} />
                  Program
                </label>
                <select
                  id="reg-course"
                  name="course"
                  className={`form-select ${errors.course ? 'input-error' : ''}`}
                  value={form.course}
                  onChange={handleChange}
                >
                  <option value="">Select program…</option>
                  {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.course && <span className="field-error">{errors.course}</span>}
              </div>

              {/* Year Level */}
              <div className="form-group">
                <label htmlFor="reg-yearLevel" className="form-label">
                  <GraduationCap size={13} style={{ display:'inline', marginRight:4 }} />
                  Year Level
                </label>
                <select
                  id="reg-yearLevel"
                  name="yearLevel"
                  className={`form-select ${errors.yearLevel ? 'input-error' : ''}`}
                  value={form.yearLevel}
                  onChange={handleChange}
                >
                  <option value="">Select year level…</option>
                  {YEAR_LEVELS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                {errors.yearLevel && <span className="field-error">{errors.yearLevel}</span>}
              </div>
            </div>

            <button
              id="btn-register-submit"
              type="submit"
              className="btn btn-primary btn-lg register-submit"
              disabled={loading}
            >
              {loading ? <><span className="spinner spinner-sm" />Registering…</> : 'Submit Registration'}
            </button>
          </form>

          <p className="register-note">
            Your registration will be reviewed by an SSC-AL officer before your card is activated.
          </p>
        </div>
      </div>

      {/* Data Privacy Consent Modal */}
      <PrivacyConsentModal
        isOpen={showPrivacyModal}
        onAccept={handleAcceptPrivacy}
        onDecline={handleDeclinePrivacy}
        loading={loading}
      />
    </main>
  );
}
