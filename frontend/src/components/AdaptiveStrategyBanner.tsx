import React, { useState } from 'react';

export const AdaptiveStrategyBanner: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <section className="strategy-banner" aria-labelledby="strategy-title">
      <div 
        className="strategy-banner-header"
        onClick={() => setIsOpen(!isOpen)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsOpen(!isOpen); }}
      >
        <div className="strategy-banner-title" id="strategy-title">
          <span>🧠</span>
          <span>Adaptive Sorting Strategy & Decision Mechanics</span>
        </div>
        <button 
          type="button" 
          className="toggle-details-btn"
          aria-expanded={isOpen}
        >
          {isOpen ? '▲ Hide Details' : '▼ Show Strategy Documentation'}
        </button>
      </div>

      {isOpen && (
        <div className="strategy-content">
          <div className="strategy-box">
            <div className="strategy-box-title insertion">
              <span>⚡</span> Branch 1: Small Array (N ≤ 24)
            </div>
            <p>
              When input size is small (N ≤ 24), divide-and-conquer overhead (pivot calculation, recursion stack, cache misses) outweighs benefits. 
              <strong>Insertion Sort</strong> is chosen directly for minimal constant factors and fast in-place execution.
            </p>
          </div>

          <div className="strategy-box">
            <div className="strategy-box-title adaptive">
              <span>📈</span> Branch 2: Nearly Sorted (Inversion Ratio ≤ 5%)
            </div>
            <p>
              For N &gt; 24, an initial O(N) scan measures adjacent disorder <code>(arr[i] &gt; arr[i+1])</code>. If inversions are ≤ 5.0%, 
              <strong>Insertion Sort</strong> is selected. Because each item only shifts a few places, it finishes in near-linear <strong>O(N)</strong> time.
            </p>
          </div>

          <div className="strategy-box">
            <div className="strategy-box-title quick">
              <span>🚀</span> Branch 3: General / Disordered (Inversion &gt; 5%)
            </div>
            <p>
              If the array is both large and disordered, the algorithm routes to <strong>Quick Sort</strong> (with middle pivot) 
              guaranteeing optimal <strong>O(N log N)</strong> average partitioning without degradation.
            </p>
          </div>
        </div>
      )}
    </section>
  );
};
