import React, { useState, useEffect, useRef } from 'react';
import type { TraceResponse, TraceStep } from '../../types';
import { VisualizerInputPanel } from './VisualizerInputPanel';
import { VisualizerControls } from './VisualizerControls';
import { InsertionSortView } from './InsertionSortView';
import { MergeSortView } from './MergeSortView';
import { QuickSortView } from './QuickSortView';
import { HeapSortView } from './HeapSortView';
import { AdaptiveSortView } from './AdaptiveSortView';

interface SortingVisualizerProps {
  initialAlgorithm?: 'insertion' | 'merge' | 'quick' | 'heap' | 'adaptive';
  initialData?: number[];
}

export const SortingVisualizer: React.FC<SortingVisualizerProps> = ({
  initialAlgorithm = 'quick',
  initialData = [26, 22, 12, 29, 19, 33, 35],
}) => {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<'insertion' | 'merge' | 'quick' | 'heap' | 'adaptive'>(
    initialAlgorithm
  );
  const [traceResponse, setTraceResponse] = useState<TraceResponse | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(700); // 700ms default (1x)
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch trace from backend API
  const fetchTrace = async (
    algo: 'insertion' | 'merge' | 'quick' | 'heap' | 'adaptive',
    data: number[]
  ) => {
    setIsLoading(true);
    setErrorMessage(null);
    setIsPlaying(false);

    try {
      const res = await fetch('/api/trace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          algorithm: algo,
          data,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || `Failed with status ${res.status}`);
      }

      setTraceResponse(json);
      setCurrentStepIndex(0);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch trace from C++ engine.';
      setErrorMessage(msg);
      console.error('Visualizer fetchTrace error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchTrace(initialAlgorithm, initialData);
  }, []);

  // Sync with prop changes if triggered from benchmark table
  useEffect(() => {
    if (initialAlgorithm) {
      setSelectedAlgorithm(initialAlgorithm);
    }
  }, [initialAlgorithm]);

  const steps = traceResponse?.steps || [];
  const totalSteps = steps.length;
  const currentStep: TraceStep | undefined = steps[currentStepIndex];

  // Auto playback loop
  useEffect(() => {
    if (isPlaying) {
      if (currentStepIndex >= totalSteps - 1) {
        setIsPlaying(false);
        return;
      }

      timerRef.current = setTimeout(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= totalSteps - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, playbackSpeed);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentStepIndex, totalSteps, playbackSpeed]);

  // Step controls handlers
  const handlePlayToggle = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      if (currentStepIndex >= totalSteps - 1) {
        setCurrentStepIndex(0);
      }
      setIsPlaying(true);
    }
  };

  const handlePrev = () => {
    setIsPlaying(false);
    setCurrentStepIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setIsPlaying(false);
    setCurrentStepIndex((prev) => Math.min(totalSteps - 1, prev + 1));
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
  };

  const handleStepChange = (step: number) => {
    setIsPlaying(false);
    setCurrentStepIndex(Math.max(0, Math.min(totalSteps - 1, step)));
  };

  return (
    <div className="sorting-visualizer-container" aria-label="Step-by-Step Algorithm Visualizer">
      {/* Top Input & Setup Panel */}
      <VisualizerInputPanel
        selectedAlgorithm={selectedAlgorithm}
        initialData={initialData}
        onSelectAlgorithm={(algo, data) => {
          setSelectedAlgorithm(algo);
          const targetData = data && data.length > 0 ? data : (traceResponse?.steps[0]?.array || initialData);
          fetchTrace(algo, targetData);
        }}
        onFetchTrace={(algo, data) => fetchTrace(algo, data)}
        isLoading={isLoading}
      />

      {/* Error Alert */}
      {errorMessage && (
        <div className="alert-error" role="alert" style={{ marginTop: '1rem' }}>
          <span>⚠️</span>
          <div>
            <strong>Error generating trace from C++ engine:</strong>
            <div>{errorMessage}</div>
          </div>
        </div>
      )}

      {/* Playback Controls Bar */}
      <VisualizerControls
        currentStep={currentStepIndex}
        totalSteps={totalSteps}
        isPlaying={isPlaying}
        onPlayToggle={handlePlayToggle}
        onPrev={handlePrev}
        onNext={handleNext}
        onReset={handleReset}
        onStepChange={handleStepChange}
        playbackSpeed={playbackSpeed}
        onSpeedChange={setPlaybackSpeed}
        pass={currentStep?.pass}
        phase={currentStep?.phase}
        comparisons={currentStep?.comparisons ?? 0}
      />

      {/* Main Algorithm Visual Stage */}
      {currentStep ? (
        <div className="visualizer-stage-wrapper">
          {selectedAlgorithm === 'insertion' && <InsertionSortView step={currentStep} />}
          {selectedAlgorithm === 'merge' && <MergeSortView step={currentStep} />}
          {selectedAlgorithm === 'quick' && <QuickSortView step={currentStep} />}
          {selectedAlgorithm === 'heap' && <HeapSortView step={currentStep} />}
          {selectedAlgorithm === 'adaptive' && <AdaptiveSortView step={currentStep} />}
        </div>
      ) : (
        <div className="card empty-state" style={{ marginTop: '1.5rem' }}>
          <div className="empty-state-icon">🎬</div>
          <h3>Select an Algorithm and click "Fetch C++ Trace & Visualize"</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.35rem' }}>
            Generates real execution trace steps directly from the native C++ engine.
          </p>
        </div>
      )}

      {/* Step Narrative & Pedagogical Explanation Card */}
      {currentStep && (
        <div className="card step-narrative-card">
          <div className="step-narrative-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="narrative-icon">📖</span>
              <strong style={{ color: 'var(--cyan-400)' }}>
                Step {currentStepIndex + 1} of {totalSteps}: {currentStep.type.toUpperCase().replace(/_/g, ' ')}
              </strong>
            </div>
            <span className="badge-tag mono">
              Cumulative Comparisons: {currentStep.comparisons}
            </span>
          </div>

          <div className="step-narrative-body">
            <p className="narrative-text">{currentStep.description}</p>
          </div>
        </div>
      )}

      {/* Visual Color Legend Bar */}
      <div className="card visualizer-legend-bar">
        <span className="legend-title">Color Guide:</span>
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-swatch key"></span>
            <span>Key / Pivot</span>
          </div>
          <div className="legend-item">
            <span className="legend-swatch compare"></span>
            <span>Active Comparison</span>
          </div>
          <div className="legend-item">
            <span className="legend-swatch swap"></span>
            <span>Shift / Swap</span>
          </div>
          <div className="legend-item">
            <span className="legend-swatch sorted"></span>
            <span>Sorted Prefix / Final</span>
          </div>
          <div className="legend-item">
            <span className="legend-swatch unsorted"></span>
            <span>Unsorted / Active Heap</span>
          </div>
        </div>
      </div>
    </div>
  );
};
