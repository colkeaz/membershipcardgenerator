import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, X } from 'lucide-react';
import './Benefits.css';

const PARTNERS = [
  {
    name: "Shakey's",
    benefit: "10% discount on regular-priced items",
    logo: "/partnership-logo/shakeys.png",
    conditions: ["Applies to regular-priced items only.", "For dine-in, cardholder must be present.", "Cannot combine with other discounts."],
    colSpan: 8, rowSpan: 2
  },
  {
    name: "Batangas Country Club",
    benefit: "10% off dining & 40% off rooms",
    logo: "/partnership-logo/Batangas_Country_Club.png",
    conditions: ["10% discount on dining at Mango Grill, AppleVille, etc.", "40% discount applies to room rates."],
    colSpan: 4, rowSpan: 2
  },
  {
    name: "Dink Republic",
    benefit: "10% off court rentals",
    logo: "/partnership-logo/dink_republic.png",
    conditions: ["Valid only from 7:00 AM to 4:00 PM.", "Applies to open-play sessions organized by Dink Republic."],
    colSpan: 6, rowSpan: 1
  },
  {
    name: "Max Mango",
    benefit: "10% discount per order",
    logo: "/partnership-logo/max_mango.png",
    conditions: ["Applies per order upon presentation of valid card."],
    colSpan: 6, rowSpan: 1
  },
  {
    name: "Lumino Photobooth",
    benefit: "15% off services",
    logo: "/partnership-logo/lumino_photobooth.png",
    conditions: ["Subject to establishment's applicable policies."],
    colSpan: 4, rowSpan: 1
  },
  {
    name: "NSP Dental Clinic",
    benefit: "10% off dental services",
    logo: "/partnership-logo/NSP_Dental_Clinic.png",
    conditions: ["Applies to dental services availed by the cardholder."],
    colSpan: 8, rowSpan: 1
  },
  {
    name: "South Peak",
    benefit: "50% discount",
    logo: "/partnership-logo/southpeak_gardenandeventsplace.png",
    conditions: ["Subject to existing policies.", "Cannot combine with other discounts."],
    colSpan: 8, rowSpan: 2
  },
  {
    name: "Brighthub",
    benefit: "5% off & Complimentary Access",
    logo: "/partnership-logo/brighthub.png",
    conditions: ["5% discount on student desk rates for groups of 10.", "One comp access for every 20 persons."],
    colSpan: 4, rowSpan: 2
  },
  {
    name: "Élan Pilates",
    benefit: "Discounted Classes",
    logo: "/partnership-logo/elan_pilates.png",
    conditions: ["Group class: ₱949.", "Single private class: ₱1,799.", "Bookings subject to studio availability."],
    colSpan: 5, rowSpan: 1
  },
  {
    name: "Vertex Prints",
    benefit: "10% off printing & copying",
    logo: "/partnership-logo/vertex_prints.png",
    conditions: ["Printing requires a minimum of 150 pages.", "Photocopying requires a minimum of 50 pages."],
    colSpan: 7, rowSpan: 1
  },
  {
    name: "LCKD IN",
    benefit: "Free Sessions & Group Discounts",
    logo: "/partnership-logo/lckd_in.png",
    conditions: ["1 comp session after 8 paid sessions.", "₱10 discount for every 15 cumulative study hours.", "Group discounts up to 20%."],
    colSpan: 12, rowSpan: 1
  }
];

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
          {PARTNERS.map((partner, idx) => (
            <div 
              key={idx} 
              className="double-bezel-outer" 
              style={{ 
                '--col': partner.colSpan, 
                '--row': partner.rowSpan,
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
                    <ArrowUpRight size={16} strokeWidth={1.5} />
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
              <p className="partner-modal-benefit">{activePartner.benefit}</p>
              
              <div className="partner-modal-conditions-box">
                <h4 className="conditions-label">Terms & Conditions</h4>
                <ul className="conditions-list">
                  {activePartner.conditions.map((cond, i) => (
                    <li key={i}>{cond}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
