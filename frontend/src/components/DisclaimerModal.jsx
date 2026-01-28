import { useState, useEffect } from 'react';
import './DisclaimerModal.css';

export default function DisclaimerModal({ onAccept }) {
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    // Check if user has previously accepted
    const hasAccepted = localStorage.getItem('disclaimer_accepted');
    if (hasAccepted === 'true') {
      setAccepted(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('disclaimer_accepted', 'true');
    setAccepted(true);
    if (onAccept) onAccept();
  };

  if (accepted) {
    return null; // Don't show if already accepted
  }

  return (
    <div className="disclaimer-modal-overlay">
      <div className="disclaimer-modal">
        <div className="disclaimer-header">
          <h2>⚠️ Important Disclaimer</h2>
          <p className="disclaimer-subtitle">Please Read Carefully Before Using</p>
        </div>

        <div className="disclaimer-content">
          <div className="disclaimer-section">
            <h3>🚨 This is NOT Legal Advice</h3>
            <p>
              The LLM Governance Council is a <strong>research prototype</strong> and{' '}
              <strong>decision-support tool</strong>. It is <strong>NOT</strong> a substitute
              for professional legal, compliance, or governance advice.
            </p>
          </div>

          <div className="disclaimer-section">
            <h3>⚙️ Experimental Software</h3>
            <ul>
              <li>This tool may produce incorrect or incomplete recommendations</li>
              <li>AI models can hallucinate or generate plausible but wrong information</li>
              <li>Output may be inconsistent across different runs</li>
              <li>No warranty or guarantee of fitness for any purpose</li>
            </ul>
          </div>

          <div className="disclaimer-section warning">
            <h3>🔒 Do NOT Input Sensitive Data</h3>
            <ul>
              <li>❌ Confidential business information</li>
              <li>❌ Personal identifiable information (PII)</li>
              <li>❌ Protected health information (PHI)</li>
              <li>❌ Financial or payment data</li>
              <li>❌ Attorney-client privileged material</li>
            </ul>
            <p className="warning-note">
              <strong>All queries are processed by third-party AI providers.</strong> Data may be retained
              according to their policies. Always anonymize and sanitize your input.
            </p>
          </div>

          <div className="disclaimer-section">
            <h3>✅ Before Taking Action</h3>
            <ol>
              <li>Consult qualified legal counsel</li>
              <li>Engage compliance professionals</li>
              <li>Conduct independent risk assessment</li>
              <li>Validate all recommendations</li>
              <li>Obtain executive approval</li>
            </ol>
          </div>

          <div className="disclaimer-section">
            <h3>📋 Your Responsibilities</h3>
            <p>By using this tool, you acknowledge:</p>
            <ul>
              <li>You will NOT treat output as professional advice</li>
              <li>You will NOT input confidential information</li>
              <li>You will validate recommendations with professionals</li>
              <li>You accept full responsibility for your decisions</li>
              <li>You understand the limitations and risks</li>
            </ul>
          </div>

          <div className="disclaimer-footer">
            <p className="disclaimer-link">
              Full disclaimer: <a href="https://github.com/Morenazzo/llm-governance-council/blob/main/DISCLAIMER.md" target="_blank" rel="noopener noreferrer">DISCLAIMER.md</a>
            </p>
          </div>
        </div>

        <div className="disclaimer-actions">
          <label className="disclaimer-checkbox">
            <input type="checkbox" id="accept-checkbox" />
            <span>
              I have read and understand the disclaimer. I acknowledge this is NOT legal advice
              and will NOT input sensitive information.
            </span>
          </label>
          <button
            className="disclaimer-accept-btn"
            onClick={handleAccept}
            disabled={!document.getElementById('accept-checkbox')?.checked}
          >
            I Understand and Accept
          </button>
        </div>
      </div>
    </div>
  );
}
