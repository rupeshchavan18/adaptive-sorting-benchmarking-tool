import type { BenchmarkResult } from '../types';

import { formatBytes, formatTime, formatNumber } from '../utils/dataGenerators';

interface BenchmarkResultsTableProps {
  results: BenchmarkResult[];
  inputSize: number;
  onVisualizeAlgo?: (algoKey: 'insertion' | 'merge' | 'quick' | 'heap' | 'adaptive') => void;
}

export const BenchmarkResultsTable: React.FC<BenchmarkResultsTableProps> = ({
  results,
  inputSize,
  onVisualizeAlgo,
}) => {
  if (results.length === 0) return null;

  // Determine the fastest algorithm
  const fastestTime = Math.min(...results.map((r) => r.executionTimeUs));
  const minComparisons = Math.min(...results.map((r) => r.comparisons));

  const adaptiveResult = results.find((r) => r.algorithmKey === 'adaptive');
  const insertionResult = results.find((r) => r.algorithmKey === 'insertion');

  // Check if input was already sorted or nearly sorted based on Insertion Sort comparison count
  const isSortedInput = insertionResult && inputSize > 1 && insertionResult.comparisons <= inputSize;

  return (
    <div className="card results-panel" aria-label="Benchmark Comparison Results">
      <div className="card-title">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span>📊</span>
          <span>Benchmark Comparison Results</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span className="badge-tag">N = {formatNumber(inputSize)} elements</span>
          <span className="badge-tag" style={{ color: 'var(--emerald-400)', borderColor: 'rgba(16,185,129,0.3)' }}>
            ✓ 100% C++ Engine
          </span>
        </div>
      </div>

      {isSortedInput && (
        <div className="sorted-input-highlight-banner" style={{
          background: 'rgba(56, 189, 248, 0.1)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          fontSize: '0.825rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          color: '#bae6fd'
        }}>
          <span>📈</span>
          <div>
            <strong>Already-Sorted Dataset Detected:</strong> Insertion Sort and Adaptive Sort operate in ideal linear <strong>O(N)</strong> time with only {insertionResult.comparisons} comparisons (exactly N-1)! Meanwhile, standard divide-and-conquer algorithms still perform O(N log N) work.
          </div>
        </div>
      )}

      {/* Main Comparative Table */}
      <div className="table-wrapper">
        <table className="benchmark-table">
          <thead>
            <tr>
              <th>Algorithm</th>
              <th>Execution Time (Measured)</th>
              <th>Comparisons (Measured)</th>
              <th>Theoretical Space (Estimated)</th>
              <th>Auxiliary Heap (Measured)</th>
              <th>Call Stack Depth (Tracked)</th>
              <th>Process Peak RAM (Measured)</th>
              <th>Status</th>
              {onVisualizeAlgo && <th>Visualizer</th>}
            </tr>
          </thead>
          <tbody>
            {results.map((r) => {
              const isTimeWinner = results.length > 1 && r.executionTimeUs === fastestTime;
              const isCompWinner = results.length > 1 && r.comparisons === minComparisons;

              return (
                <tr
                  key={r.algorithmKey}
                  className={isTimeWinner ? 'highlight-winner' : ''}
                >
                  {/* Algorithm Name & Badges */}
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <div className={`algo-badge ${r.algorithmKey}`}>
                        <span>{r.algorithmName}</span>
                        {isTimeWinner && (
                          <span className="winner-crown" title="Fastest execution on this dataset">
                            🏆 Fastest
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                        {r.strategyBranch}
                      </span>
                    </div>
                  </td>

                  {/* Execution Time */}
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span
                        className="mono"
                        style={{
                          fontWeight: 700,
                          color: isTimeWinner ? 'var(--emerald-400)' : 'var(--cyan-400)',
                        }}
                      >
                        {formatTime(r.executionTimeUs)}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                        ({r.executionTimeMs.toFixed(4)} ms)
                      </span>
                    </div>
                  </td>

                  {/* Comparison Count */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span
                        className="mono"
                        style={{
                          fontWeight: 600,
                          color: isCompWinner ? 'var(--emerald-400)' : 'var(--amber-400)',
                        }}
                      >
                        {formatNumber(r.comparisons)}
                      </span>
                      {isCompWinner && results.length > 1 && (
                        <span style={{ fontSize: '0.68rem', color: 'var(--emerald-400)' }}>
                          (Min)
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Theoretical Space */}
                  <td>
                    <span className="badge-tag mono">{r.theoreticalAuxSpace}</span>
                  </td>

                  {/* Auxiliary Heap Bytes */}
                  <td>
                    <span className="mono" style={{ color: r.auxiliaryHeapBytes > 0 ? 'var(--purple-400)' : 'var(--text-dim)' }}>
                      {formatBytes(r.auxiliaryHeapBytes)}
                    </span>
                  </td>

                  {/* Stack Depth */}
                  <td>
                    <span className="mono" style={{ color: 'var(--text-muted)' }}>
                      ~{r.maxCallStackDepth} frame{r.maxCallStackDepth > 1 ? 's' : ''}
                    </span>
                  </td>

                  {/* Process Peak Working Set */}
                  <td>
                    <span className="mono" style={{ color: 'var(--text-muted)' }}>
                      {formatBytes(r.peakWorkingSetBytes)}
                    </span>
                  </td>

                  {/* Status */}
                  <td>
                    {r.isSorted ? (
                      <span
                        style={{
                          color: 'var(--emerald-400)',
                          fontSize: '0.75rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}
                      >
                        ✓ Verified
                      </span>
                    ) : (
                      <span style={{ color: 'var(--rose-400)', fontSize: '0.75rem' }}>
                        ✗ Unsorted
                      </span>
                    )}
                  </td>

                  {/* Visualizer Action */}
                  {onVisualizeAlgo && (
                    <td>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => onVisualizeAlgo(r.algorithmKey)}
                        style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem', color: 'var(--cyan-400)', borderColor: 'rgba(56, 189, 248, 0.3)' }}
                        title={`Step-by-step teaching visualization for ${r.algorithmName}`}
                      >
                        <span>🔍</span> Visualize
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Adaptive Sort Decision Rationale Callout */}
      {adaptiveResult && (
        <div className="adaptive-decision-callout" role="note">
          <div className="adaptive-decision-icon">💡</div>
          <div>
            <div style={{ fontWeight: 600, marginBottom: '0.2rem', color: 'var(--emerald-400)' }}>
              Adaptive Sort Decision Engine: {adaptiveResult.strategyBranch}
            </div>
            <div>{adaptiveResult.strategyDetails}</div>
          </div>
        </div>
      )}

      {/* Mini Metric Cards Grid */}
      <div style={{ marginTop: '1.25rem' }}>
        <h3 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
          Detailed Metrics per Algorithm
        </h3>
        <div className="result-cards-grid">
          {results.map((r) => {
            const isWinner = results.length > 1 && r.executionTimeUs === fastestTime;
            return (
              <div
                key={r.algorithmKey}
                className={`mini-metric-card ${isWinner ? 'winner' : ''}`}
              >
                <div className="mini-card-header">
                  <span className={`algo-badge ${r.algorithmKey}`}>
                    {r.algorithmName}
                  </span>
                  <span className="badge-tag mono">{r.theoreticalTimeComplexity}</span>
                </div>

                <div className="metric-row">
                  <span className="metric-label">Execution Time (Measured):</span>
                  <span className="metric-val time">{formatTime(r.executionTimeUs)}</span>
                </div>

                <div className="metric-row">
                  <span className="metric-label">Comparisons (Measured):</span>
                  <span className="metric-val comparisons">{formatNumber(r.comparisons)}</span>
                </div>

                <div className="metric-row">
                  <span className="metric-label">Auxiliary Heap (Measured):</span>
                  <span className="metric-val memory">{formatBytes(r.auxiliaryHeapBytes)}</span>
                </div>

                <div className="metric-row">
                  <span className="metric-label">Space Complexity (Estimated):</span>
                  <span className="metric-val">{r.theoreticalAuxSpace}</span>
                </div>

                <div className="metric-row">
                  <span className="metric-label">Strategy Route:</span>
                  <span className="metric-val" style={{ fontSize: '0.75rem' }}>
                    {r.strategyBranch}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
