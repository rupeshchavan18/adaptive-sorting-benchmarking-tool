import React from 'react';
import type { TraceStep } from '../../types';

interface InsertionSortViewProps {
  step: TraceStep;
}

export const InsertionSortView: React.FC<InsertionSortViewProps> = ({ step }) => {
  const arr = step.array || [];
  const n = arr.length;
  const sortedEnd = step.sortedPrefixEnd !== undefined ? step.sortedPrefixEnd : -1;
  const key = step.key;
  const keyIdx = step.keyIndex;
  const insertIdx = step.insertIndex;
  const compIdx = step.compareIndex;

  return (
    <div className="vis-stage insertion-stage" aria-label="Insertion Sort Visualization Stage">
      {/* Key Inspector Floating Card */}
      <div className="key-inspector-box">
        <div className="key-inspector-header">
          <span className="key-icon">🔑</span>
          <span className="key-title">Active Key In Hand</span>
        </div>
        <div className="key-inspector-body">
          {key !== undefined && key !== -1 ? (
            <div className="key-display-chip">
              <span className="key-val">{key}</span>
              <span className="key-meta">from index {keyIdx}</span>
            </div>
          ) : (
            <span className="key-idle">No key selected yet (Initial setup)</span>
          )}
        </div>
        <div className="key-action-hint">
          {step.type === 'select_key' && 'Extracted from unsorted portion. Ready to find insertion slot.'}
          {step.type === 'compare' && `Comparing key (${key}) with arr[${compIdx}] (${arr[compIdx!]}).`}
          {step.type === 'shift' && `arr[${compIdx}] > key: element shifted right to index ${insertIdx}.`}
          {step.type === 'insert' && `Slot found! Inserting key (${key}) into index ${insertIdx}.`}
          {step.type === 'sorted' && 'All elements placed. Entire array is sorted!'}
          {step.type === 'init' && 'First element arr[0] trivially constitutes the initial sorted prefix.'}
        </div>
      </div>

      {/* Array Dual-Zone Display: Sorted Prefix vs Unsorted Portion */}
      <div className="zones-container">
        {/* Zone 1: Sorted Prefix */}
        <div className="zone-box sorted-prefix-zone">
          <div className="zone-header sorted">
            <span className="zone-badge">✓ Sorted Prefix</span>
            <span className="zone-range">indices [0 .. {Math.max(0, sortedEnd)}]</span>
          </div>

          <div className="zone-elements">
            {arr.slice(0, Math.max(0, sortedEnd + 1)).map((val, idx) => {
              const isComparing = idx === compIdx;
              const isInsertTarget = idx === insertIdx;

              return (
                <div
                  key={`sorted-${idx}`}
                  className={`array-card sorted-card ${isComparing ? 'comparing' : ''} ${isInsertTarget ? 'insert-target' : ''}`}
                >
                  <div className="card-top-tag">
                    {isComparing && <span className="tag-comp">Compare</span>}
                    {isInsertTarget && <span className="tag-insert">Insert</span>}
                    {!isComparing && !isInsertTarget && <span className="tag-ok">✓</span>}
                  </div>
                  <div className="card-value">{val}</div>
                  <div className="card-index">[{idx}]</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Boundary Divider */}
        {sortedEnd < n - 1 && (
          <div className="zone-divider">
            <span className="divider-line"></span>
            <span className="divider-text">Split Boundary</span>
            <span className="divider-line"></span>
          </div>
        )}

        {/* Zone 2: Unsorted Portion */}
        {sortedEnd < n - 1 && (
          <div className="zone-box unsorted-zone">
            <div className="zone-header unsorted">
              <span className="zone-badge">Unsorted Portion</span>
              <span className="zone-range">indices [{sortedEnd + 1} .. {n - 1}]</span>
            </div>

            <div className="zone-elements">
              {arr.slice(sortedEnd + 1).map((val, relIdx) => {
                const idx = sortedEnd + 1 + relIdx;
                const isKeyOrigin = idx === keyIdx;
                const isShifted = step.type === 'shift' && idx === insertIdx;

                return (
                  <div
                    key={`unsorted-${idx}`}
                    className={`array-card unsorted-card ${isKeyOrigin ? 'key-origin' : ''} ${isShifted ? 'shifted' : ''}`}
                  >
                    <div className="card-top-tag">
                      {isKeyOrigin && <span className="tag-key">Key Origin</span>}
                      {isShifted && <span className="tag-shift">Shifted →</span>}
                      {!isKeyOrigin && !isShifted && <span className="tag-waiting">Pending</span>}
                    </div>
                    <div className="card-value">{val}</div>
                    <div className="card-index">[{idx}]</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Global Array State Reference Bar */}
      <div className="full-array-strip">
        <div className="strip-title">Array Index Map:</div>
        <div className="strip-tiles">
          {arr.map((val, idx) => {
            const isSorted = idx <= sortedEnd;
            const isComp = idx === compIdx;
            const isKey = idx === keyIdx;
            const isIns = idx === insertIdx;

            let statusClass = isSorted ? 'is-sorted' : 'is-unsorted';
            if (isComp) statusClass = 'is-comp';
            if (isKey) statusClass = 'is-key';
            if (isIns) statusClass = 'is-ins';

            return (
              <div key={idx} className={`strip-tile ${statusClass}`}>
                <span className="tile-idx">{idx}</span>
                <span className="tile-val">{val}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
