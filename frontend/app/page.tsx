'use client';

import { useCallback, useState } from 'react';
import Papa from 'papaparse';
import StepIndicator from '../components/StepIndicator';
import FileUpload from '../components/FileUpload';
import CsvPreview from '../components/CsvPreview';
import ProcessingView from '../components/ProcessingView';
import ResultsView from '../components/ResultsView';
import { AppStep, ImportResponse, ParsedCsv, RawCsvRow } from '../types';
import { importCsv } from '../lib/api';
import styles from './page.module.css';

export default function Home() {
  const [step, setStep] = useState<AppStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsedCsv, setParsedCsv] = useState<ParsedCsv | null>(null);
  const [result, setResult] = useState<ImportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelected = useCallback((selectedFile: File) => {
    setFile(selectedFile);
    setError(null);

    Papa.parse<RawCsvRow>(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (!results.data || results.data.length === 0) {
          setError('The CSV file appears to be empty or has no data rows.');
          return;
        }
        const headers = results.meta.fields || [];
        setParsedCsv({
          headers,
          rows: results.data,
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
        });
        setStep('preview');
      },
      error: (err) => {
        setError(`Failed to parse CSV: ${err.message}`);
      },
    });
  }, []);

  const handleConfirmImport = useCallback(async () => {
    if (!file) return;
    setStep('processing');
    setError(null);

    try {
      const response = await importCsv(file);
      if (!response.success) {
        throw new Error(response.error || 'Import failed');
      }
      setResult(response);
      setStep('results');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(msg);
    }
  }, [file]);

  const handleRetry = useCallback(() => {
    setError(null);
    handleConfirmImport();
  }, [handleConfirmImport]);

  const handleReset = useCallback(() => {
    setStep('upload');
    setFile(null);
    setParsedCsv(null);
    setResult(null);
    setError(null);
  }, []);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brand}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M3 9h12M9 3l6 6-6 6" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="9" cy="9" r="8" stroke="var(--primary)" strokeWidth="1.2" />
            </svg>
            <span className={styles.brandName}>GrowEasy</span>
            <span className={styles.brandSub}>CSV Importer</span>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.container}>
          <StepIndicator currentStep={step} />

          <div className={styles.content}>
            {step === 'upload' && (
              <div className="animate-fade-in">
                <div className={styles.hero}>
                  <h1 className={styles.heroTitle}>CSV to CRM import</h1>
                  <p className={styles.heroDesc}>
                    Upload a CSV from any source &mdash; Facebook, Google Ads, Excel, or a manual export &mdash; and let AI map it to GrowEasy CRM fields.
                  </p>
                </div>
                <FileUpload onFileSelected={handleFileSelected} />
                {error && (
                  <div className={styles.errorBanner} role="alert">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                      <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.3" />
                      <path d="M7 4.5v3M7 10h.01" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                    </svg>
                    {error}
                  </div>
                )}
              </div>
            )}

            {step === 'preview' && parsedCsv && (
              <CsvPreview data={parsedCsv} onConfirm={handleConfirmImport} />
            )}

            {step === 'processing' && (
              <ProcessingView
                fileName={file?.name || ''}
                rowCount={parsedCsv?.rows.length || 0}
                error={error}
                onRetry={handleRetry}
              />
            )}

            {step === 'results' && result && (
              <ResultsView result={result} onReset={handleReset} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}