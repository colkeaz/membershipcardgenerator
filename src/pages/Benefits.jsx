import React, { useEffect, useRef, useState } from 'react';
import { Plus, X, MapPin } from 'lucide-react';
import './Benefits.css';
import { partnersData } from '../data/partners.js';

export default function Benefits() {
  const gridRef = useRef(null);
  const [activePartner, setActivePartner] = useState(null);

  useEffect(() => {
    // Inject Plus Jakarta Sans for the awwwards-tier typography look
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // Intersection Observer for scroll interpolation (Entry Animations)
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
        }
      });
    }, { threshold: 0.1 });

    const cards = document.querySelectorAll('.double-bezel-outer, .bento-header');
    cards.forEach(card => observer.observe(card));

    return () => {
      document.head.removeChild(link);
      cards.forEach(card => observer.unobserve(card));
    };
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (activePartner) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [activePartner]);

  return (
    <>
      <main className="bento-container">
        <div className="bento-header">
          <span className="eyebrow">Official Partners</span>
          <h1 className="massive-title">
            Elevate Your<br />Student Experience.
          </h1>
          <p className="bento-subtitle">
            Present your validated digital SSC-AL Membership Card to unlock institutional privileges, exclusively curated for Alangilan campus students.
          </p>
        </div>

        <div className="bento-grid" ref={gridRef}>
          {partnersData.map((partner, idx) => (
            <div 
              key={idx} 
              className="double-bezel-outer" 
              style={{ 
                '--col': partner.span.col, 
                '--row': partner.span.row,
                '--delay': `${(idx % 4) * 100}ms`
              }}
              onClick={() => setActivePartner(partner)}
            >
              <div className="double-bezel-inner group">
                <div className="partner-logo-wrapper">
                  <img src={partner.logo} alt={partner.name} className="partner-app-icon" />
                </div>
                <div className="partner-info">
                  <h3>{partner.name}</h3>
                  <p>{partner.benefit}</p>
                </div>
                <div className="button-in-button">
                  <span className="icon-wrapper">
                    <Plus size={16} strokeWidth={1.5} />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Partner Detail Modal */}
      {activePartner && (
        <div className="partner-modal-overlay animate-fade-in" onClick={() => setActivePartner(null)}>
          <div className="partner-modal-content animate-slide-up" onClick={e => e.stopPropagation()}>
            <button className="partner-modal-close" onClick={() => setActivePartner(null)}>
              <X size={24} color="#fff" />
            </button>
            <div className="partner-modal-hero">
              <img src={activePartner.logo} alt={activePartner.name} className="partner-modal-icon" />
            </div>
            <div className="partner-modal-body">
              <h2 className="partner-modal-title">{activePartner.name}</h2>
              <div className="partner-modal-benefit-badge">{activePartner.benefit}</div>
              
                            <div className="partner-modal-conditions-box">
                {activePartner.branches && activePartner.branches.length > 0 && (
                  <div style={{ marginBottom: '24px' }}>
                    <h4 className="conditions-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={14} /> Participating Branches
                    </h4>
                    <ul className="conditions-list" style={{ marginBottom: '16px' }}>
                      {activePartner.branches.map((branch, i) => (
                        <li key={i}>{branch}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <h4 className="conditions-label">Terms & Conditions</h4>
                <ul className="conditions-list">
                  {activePartner.conditions.map((cond, i) => (
                    <li key={i}>{cond}</li>
                  ))}
                </ul>
              </div>
            </div>
              <div className="partner-modal-footer">
                <span className="partner-modal-footer-title">How to redeem</span>
                <span className="partner-modal-footer-text">Present your active SSC-AL Digital Card upon transaction</span>
              </div>
          </div>
        </div>
      )}
    </>
  );
}
