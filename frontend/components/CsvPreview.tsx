'use client';

import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ParsedCsv } from '../types';
import styles from './CsvPreview.module.css';

interface CsvPreviewProps {
  data: ParsedCsv;
  onConfirm: () => void;
}

const MAX_DISPLAY_ROWS = 500;
const ROW_HEIGHT = 36;

export default function CsvPreview({ data, onConfirm }: CsvPreviewProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const displayRows = data.rows.slice(0, MAX_DISPLAY_ROWS);

  const rowVirtualizer = useVirtualizer({
    count: displayRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
  });

  return (
    <div className={`${styles.wrapper} animate-fade-in`}>
      {/* Header row */}
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <h2 className={styles.title}>Preview</h2>
          <p className={styles.subtitle}>
            {data.fileName} &middot; {data.rows.length.toLocaleString()} rows &middot; {data.headers.length} columns
          </p>
        </div>
        <div className={styles.meta}>
          {data.rows.length > MAX_DISPLAY_ROWS && (
            <span className="badge badge-warning">
              First {MAX_DISPLAY_ROWS.toLocaleString()} shown
            </span>
          )}
        </div>
      </div>

      {/* Virtualized table */}
      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <div className={styles.tableHeaderInner}>
            <div className={styles.rowNum}>#</div>
            {data.headers.map((header) => (
              <div key={header} className={styles.headerCell}>{header}</div>
            ))}
          </div>
        </div>

        <div
          ref={parentRef}
          className={styles.tableBody}
          style={{ height: `${Math.min(displayRows.length * ROW_HEIGHT, 380)}px` }}
        >
          <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = displayRows[virtualRow.index];
              return (
                <div
                  key={virtualRow.index}
                  className={styles.tableRow}
                  style={{
                    position: 'absolute',
                    top: virtualRow.start,
                    left: 0,
                    right: 0,
                    height: ROW_HEIGHT,
                  }}
                >
                  <div className={styles.rowNum}>{virtualRow.index + 1}</div>
                  {data.headers.map((header) => (
                    <div key={header} className={styles.cell} title={row[header] || ''}>
                      {row[header] || <span className={styles.empty}>&mdash;</span>}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <button className="btn btn-primary btn-lg" onClick={onConfirm} id="confirm-import-btn">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 8h12M8 2l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Confirm Import
        </button>
      </div>
    </div>
  );
}