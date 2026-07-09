'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './ProcessingView.module.css';

interface ProcessingViewProps {
  fileName: string;
  rowCount: number;
  error: string | null;
  onRetry?: () => void;
}

const PROCESSING_MESSAGES = [
  'Reading column headers',
  'Matching fields to GrowEasy CRM',
  'Extracting lead contact details',
  'Checking required email and mobile fields',
  'Separating skipped rows with reasons',
  'Preparing structured CRM records',
];

const BATCH_SIZE = 20;

export default function ProcessingView({ fileName, rowCount, error, onRetry }: ProcessingViewProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(5);
  const [recordsProcessed, setRecordsProcessed] = useState(0);

  useEffect(() => {
    if (error) return;

    const msgInterval = setInterval(() => {
      setMessageIndex((i) => (i + 1) % PROCESSING_MESSAGES.length);
    }, 2200);

    const progInterval = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) return p;
        return Math.min(90, p + 2.4);
      });
      setRecordsProcessed((r) => {
        const next = r + Math.max(1, Math.ceil(rowCount / 80));
        return Math.min(next, rowCount);
      });
    }, 320);

    return () => {
      clearInterval(msgInterval);
      clearInterval(progInterval);
    };
  }, [error, rowCount]);

  if (error) {
    return (
      <div className={`${styles.wrapper} animate-fade-in`}>
        <div className={styles.errorState}>
          <div className={styles.errorIcon}>
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <circle cx="18" cy="18" r="16" stroke="var(--error)" strokeWidth="1.5" />
              <path d="M12 12l12 12M24 12L12 24" stroke="var(--error)" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
          <h3 className={styles.errorTitle}>Processing failed</h3>
          <p className={styles.errorMsg}>{error}</p>
          {onRetry && (
            <button className="btn btn-primary" onClick={onRetry} id="retry-btn">
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  const batchCount = Math.max(1, Math.ceil(rowCount / BATCH_SIZE));
  const activeBatch = Math.min(batchCount, Math.max(1, Math.ceil(recordsProcessed / BATCH_SIZE)));

  return (
    <div className={`${styles.wrapper} animate-fade-in`}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Mapping with AI</h2>
          <p className={styles.subtitle}>
            Processing <strong>{rowCount.toLocaleString()}</strong> rows from <strong>{fileName}</strong>
          </p>
        </div>
        <span className={styles.batch}>Batch {activeBatch} of {batchCount}</span>
      </div>

      <div className={styles.panel}>
        <div className={styles.message}>{PROCESSING_MESSAGES[messageIndex]}</div>

        <div className={styles.progressSection}>
          <div className={styles.progressTop}>
            <span className={styles.progressPct}>{Math.round(progress)}%</span>
          </div>
          <div className="progress-track" aria-hidden="true">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className={styles.progressBottom}>
            <span>{recordsProcessed.toLocaleString()} / {rowCount.toLocaleString()} records</span>
            <span>{BATCH_SIZE} per batch</span>
          </div>
        </div>
      </div>
    </div>
  );
}