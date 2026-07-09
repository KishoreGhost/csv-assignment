'use client';

import { useCallback, useRef, useState } from 'react';
import styles from './FileUpload.module.css';

interface FileUploadProps {
  onFileSelected: (file: File) => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileUpload({ onFileSelected }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);
      if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
        setError('Please upload a valid CSV file');
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        setError('File size must be under 50 MB');
        return;
      }
      setSelectedFile(file);
      onFileSelected(file);
    },
    [onFileSelected]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className={styles.wrapper}>
      <div
        className={`${styles.dropzone} ${isDragging ? styles.dragging : ''} ${selectedFile ? styles.hasFile : ''}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload CSV file"
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={onInputChange}
          className={styles.input}
          id="csv-file-input"
          aria-label="CSV file input"
        />

        {selectedFile ? (
          <div className={styles.fileInfo}>
            <div className={styles.checkIcon}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="9" stroke="var(--success)" strokeWidth="1.5" />
                <path d="M6 10l3 3 5-5" stroke="var(--success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className={styles.fileMeta}>
              <span className={styles.fileName}>{selectedFile.name}</span>
              <span className={styles.fileSize}>{formatBytes(selectedFile.size)}</span>
            </div>
            <span className={styles.changeHint}>Click to change</span>
          </div>
        ) : (
          <div className={styles.placeholder}>
            <div className={`${styles.uploadIcon} ${isDragging ? styles.uploadIconActive : ''}`}>
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="19" stroke="var(--border-bright)" strokeWidth="1.5" strokeDasharray="4 3" />
                <path d="M20 28V16M20 16l-4 4M20 16l4 4" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 30h16" stroke="var(--text-dim)" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div className={styles.placeholderText}>
              <span className={styles.primary}>
                {isDragging ? 'Drop CSV here' : 'Drag & drop CSV file'}
              </span>
              <span className={styles.secondary}>or click to browse — .csv only, up to 50 MB</span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className={styles.errorMsg} role="alert">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.3" />
            <path d="M7 4.5v3M7 10h.01" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
}