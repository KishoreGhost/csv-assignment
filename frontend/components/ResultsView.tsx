'use client';

import { useState } from 'react';
import { CrmRecord, ImportResponse, SkippedRecord } from '../types';
import styles from './ResultsView.module.css';

interface ResultsViewProps {
  result: ImportResponse;
  onReset: () => void;
}

const CRM_FIELDS: { key: keyof CrmRecord; label: string }[] = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'mobile_without_country_code', label: 'Mobile' },
  { key: 'country_code', label: 'Code' },
  { key: 'company', label: 'Company' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'country', label: 'Country' },
  { key: 'crm_status', label: 'Status' },
  { key: 'crm_note', label: 'Note' },
  { key: 'data_source', label: 'Source' },
  { key: 'created_at', label: 'Date' },
  { key: 'lead_owner', label: 'Owner' },
  { key: 'possession_time', label: 'Possession' },
  { key: 'description', label: 'Description' },
];

const STATUS_BADGE: Record<string, string> = {
  GOOD_LEAD_FOLLOW_UP: 'badge-success',
  DID_NOT_CONNECT: 'badge-warning',
  BAD_LEAD: 'badge-error',
  SALE_DONE: 'badge-success',
};

function exportToCsv(records: CrmRecord[], filename: string) {
  const headers = CRM_FIELDS.map((f) => f.key).join(',');
  const rows = records.map((r) =>
    CRM_FIELDS.map((f) => {
      const val = r[f.key] || '';
      return val.includes(',') || val.includes('\n') || val.includes('"')
        ? `"${val.replace(/"/g, '""')}"`
        : val;
    }).join(',')
  );
  const csv = [headers, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ResultsView({ result, onReset }: ResultsViewProps) {
  const [activeTab, setActiveTab] = useState<'imported' | 'skipped'>('imported');
  const { records, skipped, totalProcessed, totalImported, totalSkipped } = result.data;

  const importRate = totalProcessed > 0 ? Math.round((totalImported / totalProcessed) * 100) : 0;

  const visibleFields = CRM_FIELDS.filter((f) => records.some((r) => r[f.key]));

  return (
    <div className={`${styles.wrapper} animate-fade-in`}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Import complete</h2>
          <p className={styles.subtitle}>AI structured {totalProcessed.toLocaleString()} records into CRM format</p>
        </div>
        <div className={styles.headerActions}>
          <button className="btn btn-secondary btn-sm" onClick={() => exportToCsv(records, 'groweasy-crm-records.csv')} id="export-csv-btn">
            Export CSV
          </button>
          <button className="btn btn-primary btn-sm" onClick={onReset} id="import-another-btn">
            New Import
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className="stat-card">
          <span className="stat-label">Total</span>
          <span className="stat-value" style={{ color: 'var(--text-primary)' }}>{totalProcessed.toLocaleString()}</span>
          <span className="stat-sub">rows processed</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Imported</span>
          <span className="stat-value" style={{ color: 'var(--success)' }}>{totalImported.toLocaleString()}</span>
          <span className="stat-sub">{importRate}% success rate</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Skipped</span>
          <span className="stat-value" style={{ color: totalSkipped > 0 ? 'var(--warning)' : 'var(--text-dim)' }}>
            {totalSkipped.toLocaleString()}
          </span>
          <span className="stat-sub">missing email &amp; phone</span>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'imported' ? styles.active : ''}`}
          onClick={() => setActiveTab('imported')}
          id="tab-imported"
        >
          <span className={`badge ${activeTab === 'imported' ? 'badge-success' : 'badge-neutral'}`}>{totalImported}</span>
          Imported
        </button>
        {totalSkipped > 0 && (
          <button
            className={`${styles.tab} ${activeTab === 'skipped' ? styles.active : ''}`}
            onClick={() => setActiveTab('skipped')}
            id="tab-skipped"
          >
            <span className={`badge ${activeTab === 'skipped' ? 'badge-warning' : 'badge-neutral'}`}>{totalSkipped}</span>
            Skipped
          </button>
        )}
      </div>

      {/* Imported records */}
      {activeTab === 'imported' && (
        <div className="data-table-wrapper" style={{ maxHeight: '440px' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                {visibleFields.map((f) => <th key={f.key}>{f.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {records.map((record, i) => (
                <tr key={i}>
                  <td style={{ color: 'var(--text-dim)' }}>{i + 1}</td>
                  {visibleFields.map((f) => (
                    <td key={f.key} title={record[f.key] || ''}>
                      {f.key === 'crm_status' && record[f.key] ? (
                        <span className={`badge ${STATUS_BADGE[record[f.key]!] || 'badge-neutral'}`}
                          style={{ fontSize: '10px', whiteSpace: 'nowrap' }}>
                          {record[f.key]!.replace(/_/g, ' ')}
                        </span>
                      ) : (
                        record[f.key] || <span style={{ color: 'var(--text-dim)' }}>&mdash;</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Skipped records */}
      {activeTab === 'skipped' && skipped.length > 0 && (
        <div className="data-table-wrapper" style={{ maxHeight: '440px' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Row</th>
                <th>Reason</th>
                {Object.keys(skipped[0].rawData).slice(0, 6).map((h) => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {skipped.map((row: SkippedRecord, i) => (
                <tr key={i}>
                  <td style={{ color: 'var(--text-dim)' }}>{row.rowIndex}</td>
                  <td><span className="badge badge-error" style={{ fontSize: '10px' }}>{row.reason}</span></td>
                  {Object.keys(skipped[0].rawData).slice(0, 6).map((h) => (
                    <td key={h} title={row.rawData[h] || ''}>
                      {row.rawData[h] || <span style={{ color: 'var(--text-dim)' }}>&mdash;</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}