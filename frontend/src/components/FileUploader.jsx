import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../services/api';

export default function FileUploader({ onUploadSuccess }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [customTitle, setCustomTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const fileInputRef = useRef(null);

  const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

  const validateAndSelectFile = (file) => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setErrorMessage('Please select a valid PDF file (.pdf).');
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      setErrorMessage(`The selected PDF exceeds the 10 MB size limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`);
      return;
    }

    setSelectedFile(file);
    if (!customTitle) {
      // Pre-fill nice readable title
      const baseName = file.name
     .replace(/\.pdf$/i, '')
     .replace(/[-_]/g, ' ');
      setCustomTitle(baseName.charAt(0).toUpperCase() + baseName.slice(1));
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSelectFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMessage('Please select a PDF document first.');
      return;
    }

    setIsUploading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await api.uploadLesson(selectedFile, customTitle);
      setSuccessMessage(`Document "${response.lesson.title}" uploaded and processed successfully!`);
      setSelectedFile(null);
      setCustomTitle('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      if (onUploadSuccess) {
        onUploadSuccess(response.lesson);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to upload document. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '640px', width: '100%', margin: '0 auto' }}>
      <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Upload size={22} style={{ color: 'var(--primary)' }} aria-hidden="true" />
        Upload Study Material (PDF)
      </h2>
      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
        Extract text, generate simplified explanations, and create quizzes in English & Telugu. Max size: 10MB.
      </p>

      {errorMessage && (
        <div className="alert alert-danger" role="alert" style={{ fontSize: '0.9rem' }}>
          <AlertCircle size={20} style={{ flexShrink: 0 }} aria-hidden="true" />
          <div>{errorMessage}</div>
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success" role="status" style={{ fontSize: '0.9rem' }}>
          <CheckCircle2 size={20} style={{ flexShrink: 0 }} aria-hidden="true" />
          <div>{successMessage}</div>
        </div>
      )}

      <form onSubmit={handleUploadSubmit}>
        {/* Drag and Drop Dropzone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current && fileInputRef.current.click();
            }
          }}
          tabIndex={0}
          role="button"
          aria-label="Upload PDF learning material dropzone. Click or press enter to browse files."
          style={{
            border: `2px dashed ${dragActive ? 'var(--primary)' : 'var(--border-strong)'}`,
            borderRadius: 'var(--radius-md)',
            backgroundColor: dragActive ? 'var(--bg-highlight)' : 'var(--bg-muted)',
            padding: '2rem 1.5rem',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            marginBottom: '1rem',
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleChange}
            style={{ display: 'none' }}
            aria-hidden="true"
          />

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
                boxShadow: 'var(--shadow-sm)',
              }}
              aria-hidden="true"
            >
              {selectedFile ? <FileText size={26} /> : <Upload size={24} />}
            </div>

            {selectedFile ? (
              <div>
                <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  {selectedFile.name}
                </p>
                <span className="badge badge-indigo">
                  {(selectedFile.size / 1024).toFixed(1)} KB &bull; Ready to upload
                </span>
              </div>
            ) : (
              <div>
                <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  Click to select a PDF or drag and drop here
                </p>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: 0 }}>
                  PDF documents up to 10MB
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Optional Title Field */}
        <div className="form-group">
          <label htmlFor="lesson-title-input" className="form-label" style={{ fontSize: '0.9rem' }}>
            Lesson Title (Optional)
          </label>
          <input
            id="lesson-title-input"
            type="text"
            className="form-input"
            placeholder="e.g. Science Chapter 4: Solar System"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            disabled={isUploading}
          />
        </div>

        <button
          type="submit"
          disabled={!selectedFile || isUploading}
          className="btn btn-primary"
          style={{ width: '100%', gap: '0.5rem' }}
        >
          {isUploading ? (
            <>
              <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} aria-hidden="true" />
              Processing & Extracting Content...
            </>
          ) : (
            <>
              <Upload size={18} aria-hidden="true" />
              Extract & Save Material
            </>
          )}
        </button>
      </form>
    </div>
  );
}
