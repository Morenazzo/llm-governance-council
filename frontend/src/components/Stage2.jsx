import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import './Stage2.css';

function extractEvaluationAndRanking(text) {
  // Split the text into evaluation part and ranking part
  if (text.includes('FINAL RANKING:')) {
    const parts = text.split('FINAL RANKING:');
    return {
      evaluation: parts[0].trim(),
      rankingSection: parts[1] ? parts[1].trim() : ''
    };
  }
  return {
    evaluation: text,
    rankingSection: ''
  };
}

function getModelShortName(fullModelName) {
  return fullModelName.split('/')[1] || fullModelName;
}

function extractRationales(evaluationText) {
  // Try to extract rationales for each response from the evaluation
  const rationales = {};
  const lines = evaluationText.split('\n');
  let currentResponse = null;
  let currentRationale = [];

  lines.forEach(line => {
    // Check if line mentions a response (e.g., "Response A", "Response B:")
    const responseMatch = line.match(/Response ([A-Z])/i);
    if (responseMatch) {
      // Save previous rationale if exists
      if (currentResponse && currentRationale.length > 0) {
        rationales[currentResponse] = currentRationale.join(' ').substring(0, 100).trim();
      }
      // Start new rationale
      currentResponse = responseMatch[1].toUpperCase();
      currentRationale = [line.replace(/Response [A-Z]:?/i, '').trim()];
    } else if (currentResponse && line.trim()) {
      currentRationale.push(line.trim());
    }
  });

  // Save last rationale
  if (currentResponse && currentRationale.length > 0) {
    rationales[currentResponse] = currentRationale.join(' ').substring(0, 100).trim();
  }

  return rationales;
}

export default function Stage2({ rankings, labelToModel, responseMapping, councilMembers, aggregateRankings }) {
  const [activeTab, setActiveTab] = useState(0);

  if (!rankings || rankings.length === 0) {
    return null;
  }

  const currentRanking = rankings[activeTab];
  const { evaluation, rankingSection } = extractEvaluationAndRanking(currentRanking.ranking);
  
  // Extract rationales from the evaluation text
  const rationales = extractRationales(evaluation);

  // Debug: Log the mappings
  console.log('Stage2 - councilMembers:', councilMembers);
  console.log('Stage2 - responseMapping:', responseMapping);
  console.log('Stage2 - labelToModel:', labelToModel);
  console.log('Stage2 - parsed_ranking:', currentRanking.parsed_ranking);
  console.log('Stage2 - extracted rationales:', rationales);
  
  // Create a lookup map from councilMembers if available
  const memberById = {};
  if (councilMembers && Array.isArray(councilMembers)) {
    councilMembers.forEach(member => {
      memberById[member.id] = member;
    });
  }

  // Create final ranking using CouncilMember objects as single source of truth
  const finalRankingWithLabels = currentRanking.parsed_ranking?.map((label, index) => {
    // Extract response ID (A, B, C, D) from "Response A"
    const responseId = label.replace('Response ', '').trim();
    
    // Get council member data (single source of truth)
    const member = memberById[responseId];
    
    // Fallback to responseMapping if councilMembers not available
    const mappingData = responseMapping?.[responseId];
    const fullModelName = member?.model || mappingData?.model || labelToModel?.[label];
    const role = member?.role || mappingData?.role || 'Council Member';
    const modelShortName = fullModelName ? getModelShortName(fullModelName) : null;
    const rationale = rationales[responseId] || 'See evaluation above';
    
    console.log(`Rank ${index + 1}: ${label} -> ${responseId} -> ${fullModelName} (${role}) [from CouncilMember: ${!!member}]`);
    
    return {
      position: index + 1,
      responseId: responseId,
      fullModelName: fullModelName || label,
      modelShortName: modelShortName || label,
      role: role,
      anonymousLabel: label,
      rationale: rationale
    };
  }) || [];

  // Create machine-readable extracted ranking using CouncilMember objects
  const extractedRanking = currentRanking.parsed_ranking?.map((label, index) => {
    const responseId = label.replace('Response ', '').trim();
    
    // Use CouncilMember as source of truth
    const member = memberById[responseId];
    const mappingData = responseMapping?.[responseId];
    
    return {
      rank: index + 1,
      response_id: responseId,
      model: member?.model || mappingData?.model || labelToModel?.[label] || label,
      role: member?.role || mappingData?.role || 'Council Member',
      reviewer: currentRanking.model,
      timestamp: new Date().toISOString()
    };
  }) || [];

  return (
    <div className="stage stage2">
      <h3 className="stage-title">Stage 2: Peer Rankings</h3>

      <p className="stage-description">
        Each model evaluated all responses using <strong>anonymized identifiers</strong> (Response A, B, C, etc.) 
        to prevent bias. The deliberation preserved anonymity throughout the reasoning process.
      </p>

      {/* Mapping Legend - CouncilMember Objects as Single Source of Truth */}
      {councilMembers && councilMembers.length > 0 ? (
        <div className="mapping-legend">
          <h4 className="legend-title">
            <span className="section-icon">🔑</span>
            CouncilMember Identity Mapping
          </h4>
          <p className="legend-description">
            Single source of truth: CouncilMember objects created at Stage 1 (anonymity preserved during deliberation)
          </p>
          <div className="mapping-grid">
            {councilMembers.map((member) => (
              <div key={member.id} className="mapping-item">
                <span className="mapping-label">Response {member.id}</span>
                <span className="mapping-arrow">→</span>
                <span className="mapping-model">
                  <span className="model-short">{getModelShortName(member.model)}</span>
                  <span className="model-role">({member.role})</span>
                  <span className="model-full">{member.model}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : responseMapping && Object.keys(responseMapping).length > 0 && (
        <div className="mapping-legend">
          <h4 className="legend-title">
            <span className="section-icon">🔑</span>
            Response → Model → Role Mapping
          </h4>
          <p className="legend-description">
            Fallback mapping (preserved anonymity during deliberation)
          </p>
          <div className="mapping-grid">
            {Object.entries(responseMapping).map(([responseId, data]) => (
              <div key={responseId} className="mapping-item">
                <span className="mapping-label">Response {responseId}</span>
                <span className="mapping-arrow">→</span>
                <span className="mapping-model">
                  <span className="model-short">{getModelShortName(data.model)}</span>
                  <span className="model-role">({data.role})</span>
                  <span className="model-full">{data.model}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="tabs">
        {rankings.map((rank, index) => (
          <button
            key={index}
            className={`tab ${activeTab === index ? 'active' : ''}`}
            onClick={() => setActiveTab(index)}
          >
            {getModelShortName(rank.model)}
          </button>
        ))}
      </div>

      <div className="tab-content">
        <div className="ranking-model">
          Reviewer: {currentRanking.model}
        </div>

        {/* Internal Deliberation - Keep Anonymous */}
        <div className="evaluation-section">
          <h4 className="section-header">
            <span className="section-icon">🔍</span>
            Internal Deliberation (Anonymized)
          </h4>
          <div className="ranking-content markdown-content">
            <ReactMarkdown>{evaluation}</ReactMarkdown>
          </div>
        </div>

        {/* Final Ranking - Show Model, Role, Label, and Rationale */}
        {finalRankingWithLabels.length > 0 && (
          <div className="final-ranking-section">
            <h4 className="section-header">
              <span className="section-icon">🏆</span>
              Final Ranking (De-anonymized)
            </h4>
            <p className="section-description">
              Complete attribution with governance roles and reasoning:
            </p>
            <ol className="final-ranking-list">
              {finalRankingWithLabels.map((item) => (
                <li key={item.position} className="final-ranking-item">
                  <div className="rank-header">
                    <div className="model-info">
                      <span className="model-name-short">{item.modelShortName}</span>
                      <span className="model-role">({item.role})</span>
                    </div>
                    <span className="anonymous-label">{item.anonymousLabel}</span>
                  </div>
                  <div className="model-details">
                    <span className="model-path">{item.fullModelName}</span>
                  </div>
                  <div className="rationale">
                    <span className="rationale-label">Rationale:</span>
                    <span className="rationale-text">{item.rationale}</span>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Extracted Ranking - Machine-Readable Format */}
        {extractedRanking.length > 0 && (
          <div className="extracted-ranking-section">
            <h4 className="section-header">
              <span className="section-icon">📊</span>
              Extracted Ranking (Machine-Readable)
            </h4>
            <p className="section-description">
              Structured array format for downstream processing, analytics, and automation:
            </p>
            <pre className="machine-readable-format">
              {JSON.stringify(extractedRanking, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Aggregate Rankings */}
      {aggregateRankings && aggregateRankings.length > 0 && (
        <div className="aggregate-rankings">
          <h4>Aggregate Rankings (Collective Judgment)</h4>
          <p className="stage-description">
            Combined results across all peer evaluations (lower average rank is better):
          </p>
          <div className="aggregate-list">
            {aggregateRankings.map((agg, index) => (
              <div key={index} className="aggregate-item">
                <span className="rank-position">#{index + 1}</span>
                <div className="rank-model-info">
                  <span className="rank-model">
                    {getModelShortName(agg.model)}
                  </span>
                  {agg.role && (
                    <span className="rank-role">({agg.role})</span>
                  )}
                </div>
                <span className="rank-score">
                  Avg: {agg.average_rank.toFixed(2)}
                </span>
                <span className="rank-count">
                  ({agg.rankings_count} votes)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
