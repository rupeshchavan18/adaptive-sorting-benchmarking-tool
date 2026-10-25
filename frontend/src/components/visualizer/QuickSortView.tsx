import React from 'react';
import type { TraceStep } from '../../types';

interface QuickSortViewProps {
  step: TraceStep;
}

export const QuickSortView: React.FC<QuickSortViewProps> = ({ step }) => {
  const arr = step.array || [];
  const low = step.low ?? -1;
  const high = step.high ?? -1;
  const pivotIdx = step.pivotIndex ?? -1;
  const pivotVal = step.pivotValue !== -1000000000 ? step.pivotValue : undefined;
  const leftPtr = step.leftPointer ?? -1;
  const rightPtr = step.rightPointer ?? -1;
  const finalPivotIdx = step.finalPivotIndex ?? -1;
  const fixedPivots = step.fixedPivots || [];
  const swap1 = step.swapIdx1 ?? -1;
  const swap2 = step.swapIdx2 ?? -1;

  const isPivotLocked = step.type === 'pivot_placed';
  const isSwap = step.type === 'swap_elements' || step.type === 'swap_pivot';

  return (
    <div className="vis-stage quick-stage" aria-label="Quick Sort Visualization Stage">
      {/* Pivot & Subarray Control Banner */}
      <div className="quick-header-panel">
        <div className="pivot-card-highlight">
          <span className="pivot-crown-icon">👑</span>
          <div className="pivot-meta">
            <span className="pivot-label">Chosen Pivot:</span>
            <span className="pivot-value-chip">
              {pivotVal !== undefined ? pivotVal : 'None'}
              {pivotIdx !== -1 && <span className="pivot-sub">at index [{pivotIdx}]</span>}
            </span>
          </div>
        </div>

        <div className="quick-partition-info">
          <div className="partition-ranges">
            {low !== -1 && high !== -1 && (
              <span className="badge-tag mono range-pill">
                Active Partition Range: <strong>[{low} .. {high}]</strong>
              </span>
            )}
            {leftPtr !== -1 && leftPtr < arr.length && (
              <span className="badge-tag mono pointer-pill left">
                Left Pointer i = <strong>{leftPtr}</strong> (arr[i] = {arr[leftPtr]})
              </span>
            )}
            {rightPtr !== -1 && rightPtr < arr.length && (
              <span className="badge-tag mono pointer-pill right">
                Right Pointer j = <strong>{rightPtr}</strong> (arr[j] = {arr[rightPtr]})
              </span>
            )}
          </div>

          <div className="fixed-pivots-tally">
            <span className="fixed-icon">🔒</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Permanently Locked Pivots: {fixedPivots.length > 0 ? fixedPivots.map((p) => `arr[${p}]=${arr[p]}`).join(', ') : 'None yet'}
            </span>
          </div>
        </div>
      </div>

      {/* Pointer Pointers Stage Visualizer */}
      <div className="quick-array-stage">
        {/* Pointer Markers Row (Above Cards) */}
        <div className="pointers-track top-track">
          {arr.map((_, idx) => (
            <div key={`top-${idx}`} className="track-slot">
              {idx === pivotIdx && (
                <div className="pointer-marker pivot-marker">
                  <span>👑 PIVOT</span>
                </div>
              )}
              {idx === leftPtr && idx !== pivotIdx && (
                <div className="pointer-marker left-marker">
                  <span>i →</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Array Cards Row */}
        <div className="array-cards-row">
          {arr.map((val, idx) => {
            const inRange = low !== -1 && high !== -1 && idx >= low && idx <= high;
            const isPivot = idx === pivotIdx;
            const isLeft = idx === leftPtr;
            const isRight = idx === rightPtr;
            const isFinalPivot = idx === finalPivotIdx;
            const isLocked = fixedPivots.includes(idx);
            const isSwapping = idx === swap1 || idx === swap2;

            let cardClass = '';
            if (isFinalPivot && isPivotLocked) cardClass = 'pivot-final-locked';
            else if (isPivot) cardClass = 'pivot-card';
            else if (isSwapping) cardClass = 'swap-highlight';
            else if (isLocked) cardClass = 'locked-pivot-card';
            else if (isLeft && isRight) cardClass = 'pointers-met';
            else if (isLeft) cardClass = 'left-pointer-card';
            else if (isRight) cardClass = 'right-pointer-card';
            else if (inRange) cardClass = 'in-active-partition';
            else cardClass = 'inactive-card';

            return (
              <div key={idx} className={`array-card ${cardClass}`}>
                <div className="card-top-tag">
                  {isLocked && <span className="tag-locked">🔒 Final</span>}
                  {!isLocked && isPivot && <span className="tag-piv">👑 Pivot</span>}
                  {!isLocked && !isPivot && isLeft && isRight && <span className="tag-met">i = j</span>}
                  {!isLocked && !isPivot && isLeft && !isRight && <span className="tag-i">i (Scan)</span>}
                  {!isLocked && !isPivot && isRight && !isLeft && <span className="tag-j">j (Scan)</span>}
                  {!isLocked && !isPivot && !isLeft && !isRight && inRange && <span className="tag-part">Range</span>}
                  {!inRange && !isLocked && <span className="tag-idle">Idle</span>}
                </div>
                <div className="card-value">{val}</div>
                <div className="card-index">[{idx}]</div>
              </div>
            );
          })}
        </div>

        {/* Pointer Markers Row (Below Cards) */}
        <div className="pointers-track bottom-track">
          {arr.map((_, idx) => (
            <div key={`bot-${idx}`} className="track-slot">
              {idx === rightPtr && (
                <div className="pointer-marker right-marker">
                  <span>← j</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic Action Alerts */}
      {isSwap && (
        <div className="quick-action-banner swap-alert">
          <span className="action-icon">🔄</span>
          <span>
            {step.type === 'swap_pivot'
              ? `Swapping Pivot (${pivotVal}) from arr[${swap1}] into final partition slot arr[${swap2}]!`
              : `Swapping out-of-order elements: arr[${swap1}] (${arr[swap1]}) with arr[${swap2}] (${arr[swap2]})`}
          </span>
        </div>
      )}

      {isPivotLocked && finalPivotIdx !== -1 && (
        <div className="quick-action-banner lock-alert">
          <span className="action-icon">🔒</span>
          <span>
            Pivot <strong>{arr[finalPivotIdx]}</strong> reached its permanent position at index <strong>[{finalPivotIdx}]</strong>.
            All elements in left slice are ≤ {arr[finalPivotIdx]} and all elements in right slice are ≥ {arr[finalPivotIdx]}.
          </span>
        </div>
      )}
    </div>
  );
};
