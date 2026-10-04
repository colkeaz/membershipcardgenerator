import React from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Clock,
  ClipboardList,
  MapPin,
  ShieldAlert,
  ArrowRight,
  RotateCcw,
  Home,
  Sparkles,
  Mail,
} from 'lucide-react';
import './OfficeRegistration.css';

export default function OfficeRegistration() {
  return (
    <main className="office-reg-page">
      <div className="office-reg-bg" aria-hidden="true" />

      <div className="container office-reg-container">
        <div className="office-reg-card glass">
          {/* Header */}
          <div className="office-reg-header">
            <div className="office-reg-badge">
              <ShieldAlert size={14} />
              Online Consent Declined
            </div>

            <div className="office-reg-icon-wrap">
              <Building2 size={36} />
            </div>

            <h1 className="office-reg-title">In-Person Registration Required</h1>
            <p className="office-reg-subtitle">
              To complete your registration for the SSC-AL membership card without online
              data processing, you must personally visit the SSC-AL office face-to-face.
            </p>
          </div>

          {/* Privacy Opt-Out Notice */}
          <div className="office-notice-box">
            <div className="office-notice-title">
              <ShieldAlert size={18} />
              Data Privacy Act (RA 10173) Notice
            </div>
            <p className="office-notice-desc">
              Because you opted out of online data consent, your personal information cannot
              be processed or stored through this digital web portal. You are welcome to
              submit a physical paper application and complete your membership verification
              directly with our student officers on campus.
            </p>
          </div>

          {/* Information Grid */}
          <div className="office-info-grid">
            {/* Location */}
            <div className="office-info-card">
              <div className="office-card-head">
                <div className="office-card-icon">
                  <MapPin size={20} />
                </div>
                <h2 className="office-card-title">Office Location</h2>
              </div>
              <p className="office-card-content">
                <strong>Supreme Student Council (SSC-AL) Office</strong><br />
                Student Services Center Building<br />
                Batangas State University - TNEU<br />
                Alangilan Campus, Golden Country Homes, Batangas City
              </p>
            </div>

            {/* Operating Hours */}
            <div className="office-info-card">
              <div className="office-card-head">
                <div className="office-card-icon">
                  <Clock size={20} />
                </div>
                <h2 className="office-card-title">Office Hours</h2>
              </div>
              <p className="office-card-content">
                <strong>Monday to Friday:</strong> 8:00 AM – 5:00 PM<br />
                <strong>Lunch Break:</strong> 12:00 PM – 1:00 PM<br />
                <em>Closed on Saturdays, Sundays, and official University Holidays.</em>
              </p>
            </div>

            {/* What to Bring */}
            <div className="office-info-card">
              <div className="office-card-head">
                <div className="office-card-icon">
                  <ClipboardList size={20} />
                </div>
                <h2 className="office-card-title">What to Bring (Requirements)</h2>
              </div>
              <ul className="office-req-list">
                <li>Valid BatStateU Student ID or Certificate of Registration (COR)</li>
                <li>Official SR-Code (e.g. 24-00627) and Program details</li>
                <li>1x1 or 2x2 formal ID photo (for physical laminated card)</li>
                <li>Membership fee payment receipt / proof (if applicable)</li>
              </ul>
            </div>

            {/* Inquiries */}
            <div className="office-info-card">
              <div className="office-card-head">
                <div className="office-card-icon">
                  <Mail size={20} />
                </div>
                <h2 className="office-card-title">Questions & Inquiries</h2>
              </div>
              <p className="office-card-content">
                Need assistance before visiting?<br />
                <strong>Email:</strong> ssc.alangilan@g.batstate-u.edu.ph<br />
                <strong>Facebook:</strong> BatStateU Supreme Student Council - Alangilan<br />
                Our officers will gladly assist you with your manual registration.
              </p>
            </div>
          </div>

          {/* Steps */}
          <div className="office-steps-section">
            <h2 className="office-steps-title">What to Expect at the Office</h2>
            <div className="office-steps-list">
              <div className="office-step-item">
                <span className="office-step-num">1</span>
                <span className="office-step-text">Approach the SSC-AL Membership Desk during operating hours.</span>
              </div>
              <div className="office-step-item">
                <span className="office-step-num">2</span>
                <span className="office-step-text">Fill out and physically sign the physical Data Privacy & Membership form.</span>
              </div>
              <div className="office-step-item">
                <span className="office-step-num">3</span>
                <span className="office-step-text">Present your student credentials to the verifying officer.</span>
              </div>
              <div className="office-step-item">
                <span className="office-step-num">4</span>
                <span className="office-step-text">Receive your verified membership credentials and physical card.</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="office-reg-actions">
            <div className="office-btn-group">
              <Link to="/register" className="btn btn-primary btn-lg">
                <RotateCcw size={16} /> Changed Your Mind? Register Online
              </Link>
              <Link to="/benefits" className="btn btn-secondary btn-lg">
                <Sparkles size={16} /> View Membership Benefits
              </Link>
              <Link to="/" className="btn btn-ghost btn-lg">
                <Home size={16} /> Return to Home
              </Link>
            </div>
            <p className="office-reg-note">
              You can return to the online registration form at any time if you decide to accept the digital Data Privacy terms.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

