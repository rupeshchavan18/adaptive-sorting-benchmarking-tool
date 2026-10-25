import React from 'react';

interface VisualizerControlsProps {
  currentStep: number;
  totalSteps: number;
  isPlaying: boolean;
  onPlayToggle: () => void;
  onPrev: () => void;
  onNext: () => void;
  onReset: () => void;
  onStepChange: (step: number) => void;
  playbackSpeed: number;
  onSpeedChange: (speed: number) => void;
  pass?: number;
  phase?: string;
  comparisons?: number;
}

export const VisualizerControls: React.FC<VisualizerControlsProps> = ({
  currentStep,
  totalSteps,
  isPlaying,
  onPlayToggle,
  onPrev,
  onNext,
  onReset,
  onStepChange,
  playbackSpeed,
  onSpeedChange,
  pass,
  phase,
  comparisons = 0,
}) => {
  const isAtStart = currentStep <= 0;
  const isAtEnd = totalSteps > 0 && currentStep >= totalSteps - 1;

  const speedOptions = [
    { label: '0.25x', value: 2000 },
    { label: '0.5x', value: 1200 },
    { label: '1x', value: 700 },
    { label: '2x', value: 350 },
    { label: '4x', value: 150 },
  ];

  return (
    <div className="card visualizer-controls-bar" aria-label="Visualizer Playback Controls">
      {/* Top Status Indicators */}
      <div className="controls-status-row">
        <div className="status-badges-group">
          <span className="badge-tag mono step-counter-badge">
            Step <strong>{totalSteps > 0 ? currentStep + 1 : 0}</strong> of <strong>{totalSteps}</strong>
          </span>

          {pass !== undefined && pass > 0 && (
            <span className="badge-tag mono pass-badge">
              Pass / Depth: <strong>{pass}</strong>
            </span>
          )}

          {phase && (
            <span className="badge-tag phase-badge">
              Phase: <strong>{phase.replace(/_/g, ' ')}</strong>
            </span>
          )}
        </div>

        <div className="comparisons-tally-badge" title="Exact comparison count from C++ execution">
          <span className="tally-icon">⚖️</span>
          <span>C++ Comparisons: <strong>{comparisons}</strong></span>
        </div>
      </div>

      {/* Progress Scrubber Slider */}
      <div className="scrubber-container">
        <input
          type="range"
          min="0"
          max={Math.max(0, totalSteps - 1)}
          value={currentStep}
          onChange={(e) => onStepChange(Number(e.target.value))}
          disabled={totalSteps <= 1}
          className="scrubber-slider"
          aria-label="Step progress scrubber"
        />
        <div className="scrubber-markers">
          <span>Start (Step 1)</span>
          <span className="scrubber-pct">
            {totalSteps > 1 ? Math.round(((currentStep + 1) / totalSteps) * 100) : 0}%
          </span>
          <span>Final (Step {totalSteps})</span>
        </div>
      </div>

      {/* Primary Action Buttons */}
      <div className="controls-buttons-row">
        <div className="playback-buttons">
          <button
            type="button"
            className="btn-control reset-btn"
            onClick={onReset}
            disabled={isAtStart && !isPlaying}
            title="Reset to beginning (Step 0)"
          >
            <span>⏮</span> Reset
          </button>

          <button
            type="button"
            className="btn-control prev-btn"
            onClick={onPrev}
            disabled={isAtStart || isPlaying}
            title="Step backward"
          >
            <span>◀</span> Prev
          </button>

          <button
            type="button"
            className={`btn-control play-btn ${isPlaying ? 'playing' : ''}`}
            onClick={onPlayToggle}
            disabled={totalSteps <= 1}
            title={isPlaying ? 'Pause animation' : 'Auto play trace'}
          >
            <span>{isPlaying ? '⏸' : '▶'}</span>
            <span>{isPlaying ? 'Pause' : isAtEnd ? 'Replay' : 'Play'}</span>
          </button>

          <button
            type="button"
            className="btn-control next-btn"
            onClick={onNext}
            disabled={isAtEnd || isPlaying}
            title="Step forward"
          >
            Next <span>▶</span>
          </button>
        </div>

        {/* Speed Selector */}
        <div className="speed-selector-group">
          <span className="speed-label">Speed:</span>
          <div className="speed-pills">
            {speedOptions.map((opt) => (
              <button
                key={opt.label}
                type="button"
                className={`speed-pill ${playbackSpeed === opt.value ? 'active' : ''}`}
                onClick={() => onSpeedChange(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
