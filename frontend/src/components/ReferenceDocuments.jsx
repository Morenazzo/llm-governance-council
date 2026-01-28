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

  // Size limits
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const MAX_CHARACTERS = 100000; // ~100k characters (roughly 25-50 pages)

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      alert(`File too large (${formatFileSize(file.size)}). Maximum size is ${formatFileSize(MAX_FILE_SIZE)}. Please use a smaller file or copy-paste the relevant sections.`);
      event.target.value = '';
      return;
    }

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
        alert('⚠️ PDF text extraction is limited.\n\nFor best results:\n1. Open your PDF\n2. Select and copy the text\n3. Use "Paste Text" option instead\n\nYou can continue, but text may not be extracted correctly.');
        content = await file.text(); // This won't work well for PDFs, but better than nothing
      } else if (['doc', 'docx'].includes(fileExtension)) {
        alert('❌ Word documents not supported.\n\nPlease:\n1. Open your Word document\n2. Copy the text (Ctrl+A, Ctrl+C)\n3. Use "Paste Text" option instead\n\nOr save as .txt file first.');
        setIsUploading(false);
        event.target.value = ''; // Reset file input
        return;
      } else {
        // Try to read as text anyway
        content = await file.text();
      }

      // Check content length
      if (content.length > MAX_CHARACTERS) {
        const shouldContinue = confirm(
          `⚠️ Large document (${content.length.toLocaleString()} characters)\n\n` +
          `Recommended maximum: ${MAX_CHARACTERS.toLocaleString()} characters\n\n` +
          `Large documents may:\n` +
          `• Take longer to process\n` +
          `• Exceed AI model context limits\n` +
          `• Increase costs\n\n` +
          `Recommended: Extract only relevant sections.\n\n` +
          `Continue anyway?`
        );
        
        if (!shouldContinue) {
          setIsUploading(false);
          event.target.value = '';
          return;
        }
      }

      // Auto-fill form with file content
      setNewDocTitle(file.name);
      setNewDocContent(content);
      setShowAddForm(true);

    } catch (error) {
      console.error('Error reading file:', error);
      alert('❌ Error reading file.\n\nPlease try:\n1. Copy text from the file\n2. Use "Paste Text" option instead');
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
            <div className="reference-limits">
              <strong>Limits:</strong> Max 5MB file size, ~100k characters recommended (~25-50 pages)
            </div>
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
