import React from 'react';

export const MemoryLegend: React.FC = () => {
  return (
    <div className="card" style={{ marginTop: '1.5rem' }}>
      <h3 className="card-title" style={{ marginBottom: '0.5rem' }}>
        <span>💾 Memory Measurement & Estimation Methodology</span>
        <span className="badge-tag">Transparency</span>
      </h3>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
        Memory consumption in sorting algorithms is categorized into asymptotic theoretical space, dynamic auxiliary heap allocation, and physical process footprint:
      </p>

      <div className="memory-legend">
        <div className="memory-legend-item">
          <strong>Theoretical Space Complexity</strong>
          <span>
            The mathematical asymptotic bound: <code>O(1)</code> for in-place algorithms (Insertion &amp; Heap), <code>O(log N)</code> recursion frames for Quick Sort, and <code>O(N)</code> for Merge Sort buffers.
          </span>
        </div>

        <div className="memory-legend-item">
          <strong>Auxiliary Heap Allocated</strong>
          <span>
            Actual bytes allocated dynamically on the heap during the sort. Merge Sort allocates <code>N × sizeof(int)</code> temporary buffer bytes. In-place algorithms register <code>0 B</code>.
          </span>
        </div>

        <div className="memory-legend-item">
          <strong>Call Stack Recursion Depth</strong>
          <span>
            Recursion depth recorded at runtime. Quick Sort and Merge Sort average <code>~log₂(N)</code> stack frames. Insertion and Heap sort use an iterative <code>1</code> frame.
          </span>
        </div>

        <div className="memory-legend-item">
          <strong>Process Peak Working Set (RAM)</strong>
          <span>
            Hardware physical RAM in bytes currently mapped into the sorting process's virtual address space, queried directly via Windows PSAPI (<code>GetProcessMemoryInfo</code>).
          </span>
        </div>
      </div>
    </div>
  );
};
