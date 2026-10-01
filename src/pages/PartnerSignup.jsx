import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, getDoc, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/ToastProvider';
import { sanitizeInput } from '../utils/validators';
import { generateMembershipNumber, getCurrentSchoolYear, getCurrentSemester } from '../utils/memberNumber';
import { Chrome, Loader } from 'lucide-react';
import './Register.css'; // Reuse register CSS for consistent form styling

export default function PartnerSignup() {
  const { user, member, loading, signInWithGoogle, refreshMember } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [signingIn, setSigningIn] = useState(false);

  const [form, setForm] = useState({
    businessName: '',
    contactPerson: '',
    contactNumber: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const err = {};
    if (!form.businessName.trim()) err.businessName = 'Business Name is required';
    if (!form.contactPerson.trim()) err.contactPerson = 'Contact Person is required';
    if (!form.contactNumber.trim()) err.contactNumber = 'Contact Number is required';
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);

    try {
      const counterRef = doc(db, 'org', 'partnerCounter');
      let newCount = 1;

      await runTransaction(db, async (t) => {
        const snap = await t.get(counterRef);
        if (snap.exists()) {
          newCount = snap.data().count + 1;
        }
        t.set(counterRef, { count: newCount }, { merge: true });
      });

      const memberNum = generateMembershipNumber(newCount, 'partner');
      const schoolYear = getCurrentSchoolYear();
      const semester = getCurrentSemester();

      const memberData = {
        role: 'partner',
        status: 'pending',
        fullName: sanitizeInput(form.businessName),
        contactPerson: sanitizeInput(form.contactPerson),
        contactNumber: sanitizeInput(form.contactNumber),
        email: user.email,
        membershipNumber: memberNum,
        schoolYear,
        semester,
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'members', user.uid), memberData);
      toast('Partner application submitted successfully!', 'success');
      
      // Refresh Auth Context so it sees the new member doc
      await refreshMember();
      
      // App.jsx will automatically redirect from /partner-signup to /verify since member exists
    } catch (err) {
      console.error(err);
      toast('Registration failed. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="register-page">
      <div className="register-bg partner-bg" aria-hidden="true" />
      <div className="container register-container">
        <div className="register-card glass" style={{ border: '1px solid rgba(255, 188, 1, 0.2)' }}>
          <div className="register-header">
            <img src="/logo.jpg" alt="SSC-AL" className="register-logo partner-logo" />
            <div>
              <span className="partner-badge">Business Portal</span>
              <h1 className="register-title">Partner Application</h1>
              <p className="register-sub">Apply to verify and accept SSC-AL membership cards.</p>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}><Loader className="spin-icon" style={{ margin: '0 auto' }} /></div>
          ) : !user ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
                Please sign in with your business Google account to continue with the partner application.
              </p>
              <button
                className="btn btn-gold btn-lg partner-submit"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={async () => {
                  setSigningIn(true);
                  try {
                    await signInWithGoogle();
                  } catch (err) {
                    if (err?.code !== 'auth/popup-closed-by-user' && err?.code !== 'auth/cancelled-popup-request') {
                      toast('Sign in failed. Try again.', 'error');
                    }
                  } finally {
                    setSigningIn(false);
                  }
                }}
                disabled={signingIn}
              >
                {signingIn ? <><Loader size={20} className="spin-icon" /> Signing in…</> : <><Chrome size={20} /> Continue with Google</>}
              </button>
            </div>
          ) : (
            <form className="register-fields" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label">Business / Organization Name</label>
              <input
                type="text"
                className={`input ${errors.businessName ? 'input-error' : ''}`}
                value={form.businessName}
                onChange={e => setForm(f => ({ ...f, businessName: e.target.value }))}
                placeholder="e.g. Alangilan Cafe"
              />
              {errors.businessName && <span className="field-error">{errors.businessName}</span>}
            </div>

            <div className="form-group">
              <label className="label">Contact Person Name</label>
              <input
                type="text"
                className={`input ${errors.contactPerson ? 'input-error' : ''}`}
                value={form.contactPerson}
                onChange={e => setForm(f => ({ ...f, contactPerson: e.target.value }))}
                placeholder="e.g. John Doe"
              />
              {errors.contactPerson && <span className="field-error">{errors.contactPerson}</span>}
            </div>

            <div className="form-group">
              <label className="label">Contact Number</label>
              <input
                type="tel"
                className={`input ${errors.contactNumber ? 'input-error' : ''}`}
                value={form.contactNumber}
                onChange={e => setForm(f => ({ ...f, contactNumber: e.target.value }))}
                placeholder="e.g. 09123456789"
              />
              {errors.contactNumber && <span className="field-error">{errors.contactNumber}</span>}
            </div>

            <button type="submit" className="btn btn-primary register-submit partner-submit" disabled={submitting}>
              {submitting ? <Loader size={18} className="spin-icon" /> : 'Submit Application'}
            </button>
          </form>
          )}

          <p className="register-note">
            Your application will be reviewed by the Supreme Student Council. 
            You will be able to access the Partner Scanner Dashboard once approved.
          </p>
        </div>
      </div>
    </main>
  );
}

