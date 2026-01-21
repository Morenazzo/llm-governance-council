import ReactMarkdown from 'react-markdown';
import './Stage3.css';

export default function Stage3({ finalResponse }) {
  if (!finalResponse) {
    return null;
  }

  const needsHumanReview = finalResponse.needs_human_review;

  return (
    <div className="stage stage3">
      <h3 className="stage-title">
        Stage 3: Final Council Answer
        {needsHumanReview && (
          <span className="human-decision-badge">🚨 Human Decision Required</span>
        )}
      </h3>

      {needsHumanReview && (
        <div className="human-decision-alert">
          <h4>⚠️ Material Disagreements Require Your Judgment</h4>
          <p>
            The council has identified significant divergence on high-risk recommendations.
            Please review the options below and make the final decision.
          </p>
        </div>
      )}

      <div className="final-response">
        <div className="chairman-label">
          Chairman: {finalResponse.model.split('/')[1] || finalResponse.model}
        </div>
        <div className="final-text markdown-content">
          <ReactMarkdown>{finalResponse.response}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
