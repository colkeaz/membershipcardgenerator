import React from 'react';
import './Legal.css';

export default function TermsOfService() {
  return (
    <main className="legal-page page-animate">
      <div className="container">
        <h1 className="legal-title">Terms & Conditions</h1>
        <p className="legal-updated">Last Updated: {new Date().toLocaleDateString()}</p>
        
        <div className="legal-content">
          <p>
            By registering for and using the SSC-AL Digital Membership Card, you agree to comply with and be bound by the following Terms & Conditions.
          </p>

          <h2>1. Card Usage and Ownership</h2>
          <ul>
            <li>The Digital Membership Card is the property of the Supreme Student Council - Alangilan (SSC-AL).</li>
            <li>The card is issued exclusively for the personal use of the enrolled student whose name and SR-Code appear on the ID.</li>
            <li><strong>The card is strictly non-transferable.</strong> You may not lend, share, or allow anyone else to use your digital ID or QR code.</li>
          </ul>

          <h2>2. Partner Establishment Discounts and Benefits</h2>
          <p>When availing of benefits from our Partner Establishments (as per the Memorandum of Agreement), the following general rules apply:</p>
          <ul>
            <li>A valid SSC Membership Card must be presented to avail of the discount. The establishment will scan the QR code to verify your active status.</li>
            <li>For dine-in or in-person transactions, the qualified student cardholder <strong>must be personally present</strong>.</li>
            <li>The discount generally applies to regular-priced items only and is subject to the specific store's existing policies and guidelines.</li>
            <li>Items or transactions already covered by existing discounts, special offers, or promotions are excluded from the SSC-AL discount.</li>
            <li>Only one discount/ID may be availed per transaction. Combining discounts from multiple IDs is strictly prohibited.</li>
            <li>Customers must comply with the partner store's verification procedures and protocols.</li>
          </ul>

          <h2>3. Account Security</h2>
          <p>
            You are responsible for maintaining the confidentiality of your BatStateU Google Account used to access this application. 
            Do not share screenshots of your QR code, as it contains cryptographic signatures unique to your identity.
          </p>

          <h2>4. Violations and Revocation</h2>
          <p>
            Any misuse of the Digital Membership Card—including but not limited to transferring the card to another individual, attempting to forge or manipulate the QR code signature, or harassing partner establishment staff—will result in:
          </p>
          <ul>
            <li>Immediate and permanent deactivation of your digital membership.</li>
            <li>Revocation of all associated privileges and benefits.</li>
            <li>Potential reporting to the BatStateU Discipline Office for appropriate disciplinary action under the student handbook.</li>
          </ul>

          <h2>5. Modifications to Benefits</h2>
          <p>
            SSC-AL reserves the right to modify, suspend, or terminate partner agreements and benefits at any time without prior notice. 
            Always check the official Benefits page for the most up-to-date list of active partner establishments.
          </p>
        </div>
      </div>
    </main>
  );
}
