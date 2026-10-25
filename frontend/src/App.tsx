import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { AdaptiveStrategyBanner } from './components/AdaptiveStrategyBanner';
import { InputControlPanel } from './components/InputControlPanel';
import { BenchmarkResultsTable } from './components/BenchmarkResultsTable';
import { SortedOutputViewer } from './components/SortedOutputViewer';
import { MemoryLegend } from './components/MemoryLegend';
import { SortingVisualizer } from './components/visualizer/SortingVisualizer';
import type { BenchmarkResult, EngineStatus } from './types';

export const App: React.FC = () => {
  const [engineStatus, setEngineStatus] = useState<EngineStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<boolean>(true);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [runError, setRunError] = useState<string | null>(null);

  // Tab State: 'benchmark' | 'visualizer'
  const [activeTab, setActiveTab] = useState<'benchmark' | 'visualizer'>('benchmark');

  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>('all');
  const [benchmarkResults, setBenchmarkResults] = useState<BenchmarkResult[]>([]);
  const [activeInputSize, setActiveInputSize] = useState<number>(0);
  const [activeInputData, setActiveInputData] = useState<number[]>([]);

  // Visualizer initial state pass-through
  const [visualizerTargetAlgo, setVisualizerTargetAlgo] = useState<'insertion' | 'merge' | 'quick' | 'heap' | 'adaptive'>('quick');
  const [visualizerTargetData, setVisualizerTargetData] = useState<number[]>([26, 22, 12, 29, 19, 33, 35]);

  // Fetch C++ engine status from local backend
  const fetchStatus = async () => {
    try {
      setLoadingStatus(true);
      const res = await fetch('/api/status');
      if (res.ok) {
        const data: EngineStatus = await res.json();
        setEngineStatus(data);
      }
    } catch (err) {
      console.warn('Backend not responding yet on /api/status:', err);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Run benchmark against backend -> C++ binary
  const handleRunSort = async (algorithm: string, numbers: number[]) => {
    setIsRunning(true);
    setRunError(null);
    setActiveInputData(numbers);

    try {
      const response = await fetch('/api/sort', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          algorithm,
          data: numbers,
        }),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || `HTTP error ${response.status}`);
      }

      if (json.mode === 'all') {
        setBenchmarkResults(json.results || []);
        setActiveInputSize(json.inputSize || numbers.length);
      } else if (json.mode === 'single' && json.result) {
        setBenchmarkResults([json.result]);
        setActiveInputSize(json.result.inputSize || numbers.length);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown execution error occurred.';
      setRunError(`Sorting execution failed: ${msg}`);
      console.error('RunSort error:', err);
    } finally {
      setIsRunning(false);
    }
  };

  // Jump from Benchmark Table directly into Visualizer
  const handleJumpToVisualizer = (algoKey: 'insertion' | 'merge' | 'quick' | 'heap' | 'adaptive') => {
    setVisualizerTargetAlgo(algoKey);
    // If benchmark data is available, pass up to 16 elements for high-clarity teaching visualization
    if (activeInputData.length > 0) {
      setVisualizerTargetData(activeInputData.slice(0, 16));
    }
    setActiveTab('visualizer');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="app-container">
      {/* Top Navigation & Status */}
      <Header status={engineStatus} loadingStatus={loadingStatus} />

      {/* Main Mode Segmented Tab Switcher */}
      <div className="main-tab-nav" role="tablist" aria-label="Main application mode">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'benchmark' ? 'active' : ''}`}
          onClick={() => setActiveTab('benchmark')}
          role="tab"
          aria-selected={activeTab === 'benchmark'}
        >
          <span className="tab-btn-icon">📊</span>
          <span className="tab-btn-text">Benchmark Lab (All 5 Algorithms)</span>
        </button>

        <button
          type="button"
          className={`tab-btn ${activeTab === 'visualizer' ? 'active' : ''}`}
          onClick={() => setActiveTab('visualizer')}
          role="tab"
          aria-selected={activeTab === 'visualizer'}
        >
          <span className="tab-btn-icon">🎬</span>
          <span className="tab-btn-text">Step-by-Step C++ Visualizer</span>
          <span className="tab-highlight-tag">Pedagogical</span>
        </button>
      </div>

      {activeTab === 'benchmark' ? (
        <>
          {/* Adaptive Sorting Strategy Documentation Banner */}
          <AdaptiveStrategyBanner />

          {/* Main Interactive Grid */}
          <main className="main-grid">
            {/* Left: Input & Preset Controls */}
            <InputControlPanel
              onRunSort={handleRunSort}
              isRunning={isRunning}
              selectedAlgorithm={selectedAlgorithm}
              setSelectedAlgorithm={setSelectedAlgorithm}
            />

            {/* Right: Results or Initial Showcase */}
            <div className="results-container">
              {runError && (
                <div className="alert-error" role="alert">
                  <span>⚠️</span>
                  <div>
                    <strong>Error running C++ sorting engine:</strong>
                    <div>{runError}</div>
                    <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', opacity: 0.85 }}>
                      Ensure the local Node.js backend is running on port 5050 and g++ is available.
                    </div>
                  </div>
                </div>
              )}

              {benchmarkResults.length > 0 ? (
                <>
                  {/* Comparative Metrics Table */}
                  <BenchmarkResultsTable
                    results={benchmarkResults}
                    inputSize={activeInputSize}
                    onVisualizeAlgo={handleJumpToVisualizer}
                  />

                  {/* Sorted Output Preview & Copy */}
                  <SortedOutputViewer results={benchmarkResults} />
                </>
              ) : (
                <div className="card empty-state">
                  <div className="empty-state-icon">⚡</div>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                    Ready to Benchmark C++ Algorithms
                  </h2>
                  <p style={{ maxWidth: '480px', margin: '0 auto', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Configure test data on the left using presets (<strong>Random</strong>, <strong>Sorted</strong>, <strong>Reverse</strong>, or <strong>Nearly Sorted</strong>), then click <strong>"Execute All 5 Algorithms in C++"</strong> to profile runtime and comparisons in real time.
                  </p>
                </div>
              )}
            </div>
          </main>

          {/* Memory Methodology Reference */}
          <MemoryLegend />
        </>
      ) : (
        /* Visualizer Mode */
        <main className="visualizer-main-view">
          <SortingVisualizer
            initialAlgorithm={visualizerTargetAlgo}
            initialData={visualizerTargetData}
          />
        </main>
      )}

      {/* Project Footer */}
      <footer style={{ marginTop: '2.5rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
        <p>
          Adaptive Sorting Algorithm Benchmarking & Visualizer Tool • C++ DSA Project • Pure Native Backend Execution
        </p>
      </footer>
    </div>
  );
};

export default App;
