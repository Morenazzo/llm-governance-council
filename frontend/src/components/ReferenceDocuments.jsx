import { useState, useRef } from 'react';
import './ReferenceDocuments.css';

export default function ReferenceDocuments({ onDocumentsChange }) {
  const [documents, setDocuments] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocContent, setNewDocContent] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const fileExtension = file.name.split('.').pop().toLowerCase();
      let content = '';

      // Handle different file types
      if (['txt', 'md', 'csv', 'json', 'xml', 'yaml', 'yml'].includes(fileExtension)) {
        // Text-based files
        content = await file.text();
      } else if (fileExtension === 'pdf') {
        // For PDF, we'll try to extract text (basic approach)
        alert('PDF files are supported but text extraction may be limited. For best results, copy-paste text from your PDF reader.');
        content = await file.text(); // This won't work well for PDFs, but better than nothing
      } else if (['doc', 'docx'].includes(fileExtension)) {
        alert('Word documents (.doc, .docx) are not directly supported. Please copy-paste the text or save as .txt first.');
        setIsUploading(false);
        event.target.value = ''; // Reset file input
        return;
      } else {
        // Try to read as text anyway
        content = await file.text();
      }

      // Auto-fill form with file content
      setNewDocTitle(file.name);
      setNewDocContent(content);
      setShowAddForm(true);

    } catch (error) {
      console.error('Error reading file:', error);
      alert('Error reading file. Please try copying and pasting the content instead.');
    } finally {
      setIsUploading(false);
      event.target.value = ''; // Reset file input
    }
  };

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
            <div className="add-document-options">
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.csv,.json,.xml,.yaml,.yml,.pdf,.doc,.docx"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <button
                className="upload-file-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? '📤 Uploading...' : '📁 Upload File'}
              </button>
              <span className="option-separator">or</span>
              <button
                className="add-document-btn"
                onClick={() => setShowAddForm(true)}
              >
                ✏️ Paste Text
              </button>
            </div>
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
