import React from 'react';
import type { TraceStep } from '../../types';
import { InsertionSortView } from './InsertionSortView';
import { QuickSortView } from './QuickSortView';

interface AdaptiveSortViewProps {
  step: TraceStep;
}

export const AdaptiveSortView: React.FC<AdaptiveSortViewProps> = ({ step }) => {
  const n = step.array ? step.array.length : 0;
  const decision = step.adaptiveDecision;
  const reason = step.adaptiveReason;
  const adjInv = step.adjacentInversions;
  const invRatio = step.inversionRatio;
  const chosen = step.chosenAlgorithm;

  const isSmall = n <= 24;
  const isNearlySorted = invRatio !== undefined && invRatio >= 0 && invRatio <= 5.0;

  // Determine which sub-view to display based on step phase or chosen algorithm
  const isQuickBranch =
    chosen === 'quick' ||
    step.phase.startsWith('scan_') ||
    step.phase === 'select_pivot' ||
    step.phase === 'pivot_place' ||
    step.phase === 'pivot_locked';

  return (
    <div className="vis-stage adaptive-stage" aria-label="Adaptive Sort Visualization Stage">
      {/* Selection Strategy Evaluation & Decision Card */}
      <div className="adaptive-strategy-card">
        <div className="adaptive-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span className="adaptive-icon">🧠</span>
            <span className="adaptive-title">Adaptive Sort Selection Strategy Engine</span>
          </div>
          <span className="badge-tag" style={{ color: 'var(--emerald-400)', borderColor: 'rgba(16,185,129,0.3)' }}>
            Evaluated in C++ Before Sorting
          </span>
        </div>

        {/* Evaluation Metrics Grid */}
        <div className="adaptive-eval-grid">
          {/* Criterion 1: Array Size */}
          <div className={`eval-box ${isSmall ? 'selected-branch' : 'evaluated'}`}>
            <div className="eval-box-header">
              <span>Rule 1: Input Array Size</span>
              {isSmall && <span className="eval-tag match">Matched!</span>}
            </div>
            <div className="eval-box-metric">
              <span className="metric-num">N = {n}</span>
              <span className="metric-threshold">Threshold: N ≤ 24</span>
            </div>
            <p className="eval-box-desc">
              Small arrays run faster with Insertion Sort due to minimal constant factors and no recursive frame setup.
            </p>
          </div>

          {/* Criterion 2: Level of Disorder (Adjacent Inversions) */}
          <div className={`eval-box ${!isSmall && isNearlySorted ? 'selected-branch' : !isSmall ? 'evaluated' : 'skipped'}`}>
            <div className="eval-box-header">
              <span>Rule 2: Inversion Disorder Scan</span>
              {!isSmall && isNearlySorted && <span className="eval-tag match">Matched!</span>}
              {!isSmall && !isNearlySorted && <span className="eval-tag fallback">High Disorder</span>}
              {isSmall && <span className="eval-tag skip">Skipped (N≤24)</span>}
            </div>
            <div className="eval-box-metric">
              <span className="metric-num">
                {invRatio !== undefined && invRatio >= 0 ? `${invRatio.toFixed(1)}%` : adjInv !== undefined && adjInv >= 0 ? `${adjInv} invs` : 'Scanned'}
              </span>
              <span className="metric-threshold">Threshold: Disorder ≤ 5.0%</span>
            </div>
            <p className="eval-box-desc">
              For N &gt; 24, an O(N) scan counts out-of-order adjacent pairs. If disorder ≤ 5%, Insertion Sort runs in near-linear O(N).
            </p>
          </div>

          {/* Decision Outcome */}
          <div className="eval-box outcome-box">
            <div className="eval-box-header">
              <span>Selected Algorithm Route</span>
              <span className="eval-tag active">ACTIVE</span>
            </div>
            <div className="eval-outcome-name">
              {decision || (isSmall ? 'Insertion Sort (Small Size)' : 'Evaluating Strategy...')}
            </div>
            <p className="eval-box-desc">
              {reason || 'Evaluating dataset properties in C++ to guarantee optimal time & space efficiency.'}
            </p>
          </div>
        </div>

        {/* Selected Strategy Rationale Banner */}
        {decision && (
          <div className="decision-callout-banner">
            <span className="callout-icon">💡</span>
            <div>
              <strong>Selection Rationale:</strong> {reason}
            </div>
          </div>
        )}
      </div>

      {/* Active Branch Sub-Visualizer */}
      <div className="adaptive-substage">
        <div className="substage-header">
          <span className="substage-tag">
            {isQuickBranch ? '⚡ Sub-Visualizer: Quick Sort Mode' : '📥 Sub-Visualizer: Insertion Sort Mode'}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            Showing step-by-step execution of chosen algorithm
          </span>
        </div>

        {isQuickBranch && <QuickSortView step={step} />}
        {!isQuickBranch && <InsertionSortView step={step} />}
      </div>
    </div>
  );
};
