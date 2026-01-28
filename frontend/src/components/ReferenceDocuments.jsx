import { useState } from 'react';
import './ReferenceDocuments.css';

export default function ReferenceDocuments({ onDocumentsChange }) {
  const [documents, setDocuments] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocContent, setNewDocContent] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddDocument = () => {
    if (!newDocTitle.trim() || !newDocContent.trim()) {
      alert('Please provide both title and content for the document.');
      return;
    }

    const newDoc = {
      id: Date.now(),
      title: newDocTitle.trim(),
      content: newDocContent.trim(),
      addedAt: new Date().toISOString(),
    };

    const updatedDocs = [...documents, newDoc];
    setDocuments(updatedDocs);
    if (onDocumentsChange) {
      onDocumentsChange(updatedDocs);
    }

    // Reset form
    setNewDocTitle('');
    setNewDocContent('');
    setShowAddForm(false);
  };

  const handleRemoveDocument = (id) => {
    const updatedDocs = documents.filter(doc => doc.id !== id);
    setDocuments(updatedDocs);
    if (onDocumentsChange) {
      onDocumentsChange(updatedDocs);
    }
  };

  return (
    <div className="reference-documents">
      <div
        className="reference-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="reference-title">
          <span className="reference-icon">📚</span>
          <span>Reference Documents</span>
          <span className="reference-count">{documents.length}</span>
        </div>
        <button className="expand-btn">
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {isExpanded && (
        <div className="reference-content">
          <div className="reference-info">
            <p>
              Add reference documents, policies, or context that the council should consider.
              These will be included in the analysis.
            </p>
            <p className="reference-warning">
              ⚠️ <strong>Do NOT upload</strong> confidential or sensitive information.
            </p>
          </div>

          {documents.length > 0 && (
            <div className="documents-list">
              {documents.map(doc => (
                <div key={doc.id} className="document-item">
                  <div className="document-header">
                    <span className="document-title">📄 {doc.title}</span>
                    <button
                      className="remove-doc-btn"
                      onClick={() => handleRemoveDocument(doc.id)}
                      title="Remove document"
                    >
                      ×
                    </button>
                  </div>
                  <div className="document-preview">
                    {doc.content.substring(0, 150)}
                    {doc.content.length > 150 && '...'}
                  </div>
                  <div className="document-meta">
                    {doc.content.length} characters
                  </div>
                </div>
              ))}
            </div>
          )}

          {!showAddForm ? (
            <button
              className="add-document-btn"
              onClick={() => setShowAddForm(true)}
            >
              + Add Document
            </button>
          ) : (
            <div className="add-document-form">
              <input
                type="text"
                placeholder="Document title (e.g., 'Company AI Policy Draft')"
                value={newDocTitle}
                onChange={(e) => setNewDocTitle(e.target.value)}
                className="doc-title-input"
              />
              <textarea
                placeholder="Paste document content here... (policies, guidelines, requirements, etc.)"
                value={newDocContent}
                onChange={(e) => setNewDocContent(e.target.value)}
                className="doc-content-input"
                rows="8"
              />
              <div className="form-actions">
                <button
                  className="cancel-btn"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewDocTitle('');
                    setNewDocContent('');
                  }}
                >
                  Cancel
                </button>
                <button
                  className="save-btn"
                  onClick={handleAddDocument}
                >
                  Add Document
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
