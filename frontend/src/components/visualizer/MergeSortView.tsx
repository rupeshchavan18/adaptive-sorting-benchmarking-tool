import React from 'react';
import type { TraceStep } from '../../types';

interface MergeSortViewProps {
  step: TraceStep;
}

export const MergeSortView: React.FC<MergeSortViewProps> = ({ step }) => {
  const arr = step.array || [];
  const left = step.left ?? -1;
  const mid = step.mid ?? -1;
  const right = step.right ?? -1;
  const depth = step.depth ?? 0;
  const L = step.L || [];
  const R = step.R || [];
  const ptrI = step.i ?? -1;
  const ptrJ = step.j ?? -1;
  const ptrK = step.k ?? -1;
  const mergedResult = step.mergedResult || [];

  const isSplitting = step.type === 'split';
  const isSingle = step.type === 'single_element';
  const isMerging = step.phase.startsWith('merge');
  const isMergedResult = step.type === 'merged_result';

  return (
    <div className="vis-stage merge-stage" aria-label="Merge Sort Visualization Stage">
      {/* Divide & Conquer Status Card */}
      <div className="merge-status-box">
        <div className="merge-status-left">
          <span className="merge-phase-badge">
            {isSplitting && '✂️ Divide Phase: Recursive Split'}
            {isSingle && '🎯 Base Case: Single-Element Array'}
            {isMerging && '🔄 Conquer Phase: Merging Two Subarrays'}
            {isMergedResult && '✨ Merged Subarray Complete'}
            {step.type === 'sorted' && '🏆 Entire Array Fully Merged & Sorted'}
            {step.type === 'init' && '🚀 Merge Sort Initialized'}
          </span>
          <span className="badge-tag mono">Recursion Depth: {depth}</span>
        </div>

        {left !== -1 && right !== -1 && (
          <div className="merge-range-badges">
            <span className="range-badge current">Active Range: [{left} .. {right}]</span>
            {mid !== -1 && (
              <>
                <span className="range-badge left-half">Left Half: [{left} .. {mid}]</span>
                <span className="range-badge right-half">Right Half: [{mid + 1} .. {right}]</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Single-Element Base Case Callout */}
      {isSingle && (
        <div className="base-case-banner">
          <span className="base-case-icon">💡</span>
          <div>
            <strong>Base Case Reached (Single Element):</strong> Subarray at index [{left}] contains only 1 element ({arr[left]}).
            By definition of Merge Sort, an array of size 1 is trivially sorted! Now ready to unwind call stack and merge.
          </div>
        </div>
      )}

      {/* Active Merge Procedure Workspace (L vs R Buffers) */}
      {(L.length > 0 || R.length > 0) && (
        <div className="merge-workspace">
          <div className="merge-workspace-title">
            <span>⚔️ Merge Procedure Buffers: L[{L.length}] & R[{R.length}]</span>
            {ptrK !== -1 && <span className="mono badge-tag">Target Placement Index: arr[{ptrK}]</span>}
          </div>

          <div className="buffers-grid">
            {/* Left Buffer L */}
            <div className="buffer-column left-buffer">
              <div className="buffer-header">
                <span className="buffer-name">Left Buffer (L)</span>
                <span className="mono pointer-tag">Pointer i = {ptrI >= 0 ? ptrI : 'done'}</span>
              </div>
              <div className="buffer-cards">
                {L.map((val, idx) => {
                  const isActive = idx === ptrI;
                  const isExhausted = ptrI > idx;

                  return (
                    <div
                      key={`L-${idx}`}
                      className={`array-card buffer-card left ${isActive ? 'active-pointer' : ''} ${isExhausted ? 'exhausted' : ''}`}
                    >
                      <div className="card-top-tag">{isActive ? 'i → Compare' : isExhausted ? 'Used' : `L[${idx}]`}</div>
                      <div className="card-value">{val}</div>
                      <div className="card-index">L[{idx}]</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* VS Comparator Badge */}
            <div className="merge-vs-indicator">
              <span className="vs-circle">VS</span>
              {step.type === 'merge_compare' && ptrI >= 0 && ptrI < L.length && ptrJ >= 0 && ptrJ < R.length && (
                <div className="vs-decision">
                  {L[ptrI] <= R[ptrJ] ? (
                    <span style={{ color: 'var(--cyan-400)' }}>L[{ptrI}] ({L[ptrI]}) ≤ R[{ptrJ}] ({R[ptrJ]})</span>
                  ) : (
                    <span style={{ color: 'var(--purple-400)' }}>R[{ptrJ}] ({R[ptrJ]}) &lt; L[{ptrI}] ({L[ptrI]})</span>
                  )}
                </div>
              )}
            </div>

            {/* Right Buffer R */}
            <div className="buffer-column right-buffer">
              <div className="buffer-header">
                <span className="buffer-name">Right Buffer (R)</span>
                <span className="mono pointer-tag">Pointer j = {ptrJ >= 0 ? ptrJ : 'done'}</span>
              </div>
              <div className="buffer-cards">
                {R.map((val, idx) => {
                  const isActive = idx === ptrJ;
                  const isExhausted = ptrJ > idx;

                  return (
                    <div
                      key={`R-${idx}`}
                      className={`array-card buffer-card right ${isActive ? 'active-pointer' : ''} ${isExhausted ? 'exhausted' : ''}`}
                    >
                      <div className="card-top-tag">{isActive ? 'j → Compare' : isExhausted ? 'Used' : `R[${idx}]`}</div>
                      <div className="card-value">{val}</div>
                      <div className="card-index">R[{idx}]</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Merged Result Highlight */}
      {isMergedResult && mergedResult.length > 0 && (
        <div className="merged-result-banner">
          <span className="banner-icon">✨</span>
          <div>
            <strong>Merged Result for Range [{left} .. {right}]:</strong>
            <div className="merged-chips-row">
              {mergedResult.map((val, idx) => (
                <span key={idx} className="merged-chip">{val}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Target Array Display */}
      <div className="main-array-container">
        <div className="array-header-label">
          <span>Target Array (arr):</span>
          <span className="mono" style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>
            {left !== -1 && right !== -1 ? `Active sub-array highlighted in [${left}..${right}]` : 'Full Array'}
          </span>
        </div>

        <div className="array-cards-row">
          {arr.map((val, idx) => {
            const inActiveRange = left !== -1 && right !== -1 && idx >= left && idx <= right;
            const isTargetK = idx === ptrK;
            const inLeftHalf = inActiveRange && idx <= mid;
            const inRightHalf = inActiveRange && idx > mid;

            let cardClass = '';
            if (isTargetK) cardClass = 'target-k';
            else if (inLeftHalf) cardClass = 'in-left-half';
            else if (inRightHalf) cardClass = 'in-right-half';
            else if (inActiveRange) cardClass = 'in-active-range';

            return (
              <div key={idx} className={`array-card ${cardClass}`}>
                <div className="card-top-tag">
                  {isTargetK && <span className="tag-k">k (Placed)</span>}
                  {!isTargetK && inLeftHalf && <span className="tag-l-half">Left</span>}
                  {!isTargetK && inRightHalf && <span className="tag-r-half">Right</span>}
                  {!inActiveRange && <span className="tag-dim">Idle</span>}
                </div>
                <div className="card-value">{val}</div>
                <div className="card-index">[{idx}]</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
