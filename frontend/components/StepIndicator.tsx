'use client';

import styles from './StepIndicator.module.css';

interface Step {
  id: string;
  label: string;
}

const STEPS: Step[] = [
  { id: 'upload', label: 'Upload' },
  { id: 'preview', label: 'Preview' },
  { id: 'processing', label: 'AI Processing' },
  { id: 'results', label: 'Results' },
];

interface StepIndicatorProps {
  currentStep: string;
}

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <nav className={styles.wrapper} aria-label="Import progress">
      {STEPS.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isActive = index === currentIndex;

        return (
          <div key={step.id} className={styles.stepWrapper}>
            <div
              className={`${styles.step} ${isActive ? styles.active : ''} ${isCompleted ? styles.completed : ''}`}
              aria-current={isActive ? 'step' : undefined}
            >
              <div className={styles.dot} aria-hidden="true">
                {isCompleted ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <span className={styles.num}>{index + 1}</span>
                )}
              </div>
              <span className={styles.label}>{step.label}</span>
            </div>
            {index < STEPS.length - 1 && (
              <div className={`${styles.connector} ${isCompleted ? styles.connectorFilled : ''}`} aria-hidden="true" />
            )}
          </div>
        );
      })}
    </nav>
  );
}