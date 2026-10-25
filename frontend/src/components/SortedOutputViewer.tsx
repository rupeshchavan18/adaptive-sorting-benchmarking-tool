import { useState } from 'react';
import type { BenchmarkResult } from '../types';

import { formatNumber } from '../utils/dataGenerators';

interface SortedOutputViewerProps {
  results: BenchmarkResult[];
}

export const SortedOutputViewer: React.FC<SortedOutputViewerProps> = ({ results }) => {
  const [selectedAlgoIndex, setSelectedAlgoIndex] = useState<number>(0);
  const [showAll, setShowAll] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  if (results.length === 0) return null;

  const activeResult = results[selectedAlgoIndex] || results[0];
  const sortedData = activeResult.sortedData || [];
  const totalCount = sortedData.length;

  const displayLimit = 100;
  const itemsToDisplay = showAll ? sortedData : sortedData.slice(0, displayLimit);

  const handleCopy = () => {
    navigator.clipboard.writeText(sortedData.join(', '));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card output-preview-card" aria-label="Sorted Array Preview">
      <div className="output-preview-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span>📋</span>
          <strong style={{ color: 'var(--text-main)' }}>Sorted Output Preview</strong>
          {results.length > 1 && (
            <select
              value={selectedAlgoIndex}
              onChange={(e) => setSelectedAlgoIndex(Number(e.target.value))}
              style={{
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--cyan-400)',
                fontSize: '0.75rem',
                borderRadius: '4px',
                padding: '0.2rem 0.4rem',
                cursor: 'pointer',
              }}
              aria-label="Select algorithm output to view"
            >
              {results.map((r, idx) => (
                <option key={r.algorithmKey} value={idx}>
                  {r.algorithmName}
                </option>
              ))}
            </select>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {totalCount > displayLimit && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? `Show First ${displayLimit}` : `Show All (${formatNumber(totalCount)})`}
            </button>
          )}
          <button
            type="button"
            className="btn-secondary"
            onClick={handleCopy}
            title="Copy full sorted array to clipboard"
          >
            {copied ? '✓ Copied!' : '📋 Copy Array'}
          </button>
        </div>
      </div>

      <div className="output-box" tabIndex={0} aria-label="Sorted Numbers Sequence">
        {itemsToDisplay.join(', ')}
        {!showAll && totalCount > displayLimit && (
          <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>
            {` ... (+${formatNumber(totalCount - displayLimit)} more items)`}
          </span>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '0.5rem',
          fontSize: '0.725rem',
          color: 'var(--text-dim)',
          fontFamily: 'var(--font-mono)',
        }}
      >
        <span>
          Showing {itemsToDisplay.length} of {formatNumber(totalCount)} items
        </span>
        <span style={{ color: activeResult.isSorted ? 'var(--emerald-400)' : 'var(--rose-400)' }}>
          {activeResult.isSorted ? '✓ Monotonic non-decreasing order verified' : '✗ Sequence error'}
        </span>
      </div>
    </div>
  );
};
