import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import './Stage1_5.css';

function getModelShortName(fullModelName) {
  return fullModelName.split('/')[1] || fullModelName;
}

export default function Stage1_5({ delphiResults, needsHumanReview, councilMembers }) {
  const [activeTab, setActiveTab] = useState(0);

  if (!delphiResults || delphiResults.length === 0) {
    return null;
  }

  const currentResult = delphiResults[activeTab];

  // Get council member info
  const memberInfo = councilMembers?.find(m => m.id === currentResult.member_id);

  return (
    <div className="stage stage1-5">
      <h3 className="stage-title">
        Stage 1.5: Delphi Reflection Round
        {needsHumanReview && (
          <span className="human-review-badge">⚠️ Human Review Needed</span>
        )}
      </h3>

      <p className="stage-description">
        Each model reviewed anonymized peer feedback and decided whether to revise or affirm their initial response.
        This iterative Delphi method helps surface consensus and preserve important dissent.
      </p>

      {needsHumanReview && (
        <div className="human-review-alert">
          <h4>🚨 Material Disagreements Detected</h4>
          <p>
            One or more council members have identified significant concerns that require human judgment.
            See the final synthesis for decision options.
          </p>
        </div>
      )}

      <div className="tabs">
        {delphiResults.map((result, index) => {
          const member = councilMembers?.find(m => m.id === result.member_id);
          return (
            <button
              key={index}
              className={`tab ${activeTab === index ? 'active' : ''} ${result.has_material_disagreement ? 'has-disagreement' : ''}`}
              onClick={() => setActiveTab(index)}
              title={result.has_material_disagreement ? 'Has material disagreement' : ''}
            >
              {getModelShortName(result.model)}
              {result.has_material_disagreement && ' ⚠️'}
            </button>
          );
        })}
      </div>

      <div className="tab-content">
        <div className="delphi-header">
          <div className="model-identity">
            <span className="model-name">{currentResult.model}</span>
            {memberInfo && (
              <span className="model-role">({memberInfo.role})</span>
            )}
          </div>
          <div className="decision-badge" data-decision={currentResult.decision?.toLowerCase()}>
            {currentResult.decision || 'N/A'}
          </div>
        </div>

        <div className="delphi-section">
          <h4 className="section-header">
            <span className="section-icon">💡</span>
            Revision Justification
          </h4>
          <div className="justification-content">
            <ReactMarkdown>{currentResult.revision_reason || 'No justification provided'}</ReactMarkdown>
          </div>
        </div>

        {currentResult.has_material_disagreement && (
          <div className="disagreement-alert">
            <strong>⚠️ Material Disagreement:</strong> This model has identified significant concerns
            with peer recommendations that may require human review.
          </div>
        )}

        <div className="delphi-section">
          <h4 className="section-header">
            <span className="section-icon">📝</span>
            Round 1: Initial Response
          </h4>
          <div className="response-content markdown-content">
            <ReactMarkdown>{currentResult.round1_response}</ReactMarkdown>
          </div>
        </div>

        <div className="delphi-section">
          <h4 className="section-header">
            <span className="section-icon">✅</span>
            Round 2: Final Response
          </h4>
          <div className="response-content markdown-content final-response">
            <ReactMarkdown>{currentResult.round2_response}</ReactMarkdown>
          </div>
          {currentResult.decision === 'REVISE' && (
            <div className="revision-note">
              ℹ️ This response was revised after peer feedback
            </div>
          )}
          {currentResult.decision === 'AFFIRM' && (
            <div className="affirm-note">
              ℹ️ Original response affirmed after peer review
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
