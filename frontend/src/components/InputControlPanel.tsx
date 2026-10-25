import { useEffect, useState } from 'react';
import type { DataPreset } from '../types';


import {
  generateRandomData,
  generateSortedData,
  generateReverseSortedData,
  generateNearlySortedData,
  parseCommaSeparatedInput,
  formatNumber,
} from '../utils/dataGenerators';

interface InputControlPanelProps {
  onRunSort: (algorithm: string, numbers: number[]) => void;
  isRunning: boolean;
  selectedAlgorithm: string;
  setSelectedAlgorithm: (algo: string) => void;
}

export const InputControlPanel: React.FC<InputControlPanelProps> = ({
  onRunSort,
  isRunning,
  selectedAlgorithm,
  setSelectedAlgorithm,
}) => {
  const [preset, setPreset] = useState<DataPreset>('nearly_sorted');
  const [arraySize, setArraySize] = useState<number>(60);
  const [perturbation, setPerturbation] = useState<number>(5);
  const [rawText, setRawText] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Array stats
  const [parsedCount, setParsedCount] = useState<number>(0);
  const [minVal, setMinVal] = useState<number | null>(null);
  const [maxVal, setMaxVal] = useState<number | null>(null);
  const [inversionsRatio, setInversionsRatio] = useState<number | null>(null);

  // Generate data on preset or size change
  const applyPreset = (
    chosenPreset: DataPreset,
    size: number = arraySize,
    pert: number = perturbation
  ) => {
    setPreset(chosenPreset);
    let arr: number[] = [];
    if (chosenPreset === 'random') {
      arr = generateRandomData(size, 1, Math.max(1000, size * 5));
    } else if (chosenPreset === 'sorted') {
      arr = generateSortedData(size, 1, 2);
    } else if (chosenPreset === 'reverse') {
      arr = generateReverseSortedData(size, size * 2, 2);
    } else if (chosenPreset === 'nearly_sorted') {
      arr = generateNearlySortedData(size, pert);
    } else {
      return;
    }
    setRawText(arr.join(', '));
  };

  // Initial load
  useEffect(() => {
    applyPreset('nearly_sorted', 60, 5);
  }, []);

  // Update parsed numbers & stats whenever rawText changes
  useEffect(() => {
    const { numbers, error } = parseCommaSeparatedInput(rawText);
    if (error) {
      setValidationError(error);
      setParsedCount(0);
      setMinVal(null);
      setMaxVal(null);
      setInversionsRatio(null);
    } else {
      setValidationError(null);
      setParsedCount(numbers.length);
      let min = numbers[0];
      let max = numbers[0];
      let invCount = 0;
      for (let i = 0; i < numbers.length; i++) {
        if (numbers[i] < min) min = numbers[i];
        if (numbers[i] > max) max = numbers[i];
        if (i < numbers.length - 1 && numbers[i] > numbers[i + 1]) {
          invCount++;
        }
      }
      setMinVal(min);
      setMaxVal(max);
      if (numbers.length > 1) {
        setInversionsRatio((invCount / (numbers.length - 1)) * 100);
      } else {
        setInversionsRatio(0);
      }
    }
  }, [rawText]);

  const handleSizeChange = (newSize: number) => {
    setArraySize(newSize);
    if (preset !== 'custom') {
      applyPreset(preset, newSize, perturbation);
    }
  };

  const handlePerturbationChange = (newPert: number) => {
    setPerturbation(newPert);
    if (preset === 'nearly_sorted') {
      applyPreset('nearly_sorted', arraySize, newPert);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPreset('custom');
    setRawText(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { numbers, error } = parseCommaSeparatedInput(rawText);
    if (error) {
      setValidationError(error);
      return;
    }
    onRunSort(selectedAlgorithm, numbers);
  };

  return (
    <aside className="card input-panel" aria-label="Benchmarking Configuration">
      <h2 className="card-title">
        <span>⚙️ Test Data & Settings</span>
        <span className="badge-tag">Native C++</span>
      </h2>

      {/* Preset Buttons */}
      <div className="preset-buttons" role="group" aria-label="Test Data Presets">
        <button
          type="button"
          className={`btn-preset ${preset === 'random' ? 'active' : ''}`}
          onClick={() => applyPreset('random')}
          title="Generates random unordered numbers"
        >
          <span>🎲</span> Random
        </button>
        <button
          type="button"
          className={`btn-preset ${preset === 'sorted' ? 'active' : ''}`}
          onClick={() => applyPreset('sorted')}
          title="Generates pre-sorted ascending numbers"
        >
          <span>📈</span> Sorted
        </button>
        <button
          type="button"
          className={`btn-preset ${preset === 'reverse' ? 'active' : ''}`}
          onClick={() => applyPreset('reverse')}
          title="Generates descending reverse-sorted numbers"
        >
          <span>📉</span> Reverse
        </button>
        <button
          type="button"
          className={`btn-preset ${preset === 'nearly_sorted' ? 'active' : ''}`}
          onClick={() => applyPreset('nearly_sorted')}
          title="Generates sorted numbers with ~5% randomized local swaps"
        >
          <span>⚡</span> Nearly Sorted
        </button>
      </div>

      {/* Array Size Slider */}
      <div className="control-group">
        <div className="control-label">
          <span>Array Size (N)</span>
          <span className="mono" style={{ color: 'var(--cyan-400)', fontWeight: 600 }}>
            {formatNumber(arraySize)} elements
          </span>
        </div>
        <input
          type="range"
          min="8"
          max="2000"
          step="1"
          value={arraySize}
          onChange={(e) => handleSizeChange(Number(e.target.value))}
          className="control-slider"
          aria-label="Input Array Size Slider"
        />
        <div className="quick-slider-ticks">
          <span onClick={() => handleSizeChange(16)} style={{ cursor: 'pointer' }}>16 (Small)</span>
          <span onClick={() => handleSizeChange(50)} style={{ cursor: 'pointer' }}>50</span>
          <span onClick={() => handleSizeChange(250)} style={{ cursor: 'pointer' }}>250</span>
          <span onClick={() => handleSizeChange(1000)} style={{ cursor: 'pointer' }}>1,000</span>
          <span onClick={() => handleSizeChange(2000)} style={{ cursor: 'pointer' }}>2,000</span>
        </div>
      </div>

      {/* Perturbation Slider for Nearly Sorted */}
      {preset === 'nearly_sorted' && (
        <div className="control-group">
          <div className="control-label">
            <span>Disorder / Swap Perturbation</span>
            <span className="mono" style={{ color: 'var(--emerald-400)' }}>
              {perturbation}%
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="20"
            step="1"
            value={perturbation}
            onChange={(e) => handlePerturbationChange(Number(e.target.value))}
            className="control-slider"
            aria-label="Perturbation Percentage Slider"
          />
          <div className="quick-slider-ticks">
            <span>1% (Minimal)</span>
            <span>5% (Threshold boundary)</span>
            <span>20% (High disorder)</span>
          </div>
        </div>
      )}

      {/* Editable Comma-separated Text Input */}
      <div className="control-group">
        <div className="control-label">
          <span>Input Data (Comma-separated integers)</span>
          {preset === 'custom' && <span className="badge-tag">Custom Edits</span>}
        </div>
        <textarea
          className="text-input-area"
          value={rawText}
          onChange={handleTextChange}
          placeholder="e.g. 42, 17, 89, 5, 23, 1..."
          rows={4}
          spellCheck={false}
          aria-label="Comma-separated input data"
        />
        <div className="input-stats-bar">
          <span>Count: <strong>{parsedCount}</strong></span>
          {minVal !== null && maxVal !== null && (
            <span>Range: [{minVal} ... {maxVal}]</span>
          )}
          {inversionsRatio !== null && (
            <span title="Ratio of adjacent out-of-order pairs">
              Disorder: <strong>{inversionsRatio.toFixed(1)}%</strong>
            </span>
          )}
        </div>
      </div>

      {validationError && (
        <div className="alert-error" role="alert">
          <span>⚠️</span>
          <span>{validationError}</span>
        </div>
      )}

      {/* Algorithm Selector */}
      <div className="control-group">
        <div className="control-label">
          <span>Target Algorithm</span>
        </div>
        <div className="algo-tabs" role="tablist">
          <button
            type="button"
            className={`algo-tab all-tab ${selectedAlgorithm === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedAlgorithm('all')}
            role="tab"
            aria-selected={selectedAlgorithm === 'all'}
          >
            🚀 Benchmark All 5 Algorithms
          </button>
          <button
            type="button"
            className={`algo-tab ${selectedAlgorithm === 'adaptive' ? 'active' : ''}`}
            onClick={() => setSelectedAlgorithm('adaptive')}
            role="tab"
            aria-selected={selectedAlgorithm === 'adaptive'}
          >
            Adaptive Sort
          </button>
          <button
            type="button"
            className={`algo-tab ${selectedAlgorithm === 'quick' ? 'active' : ''}`}
            onClick={() => setSelectedAlgorithm('quick')}
            role="tab"
            aria-selected={selectedAlgorithm === 'quick'}
          >
            Quick Sort
          </button>
          <button
            type="button"
            className={`algo-tab ${selectedAlgorithm === 'merge' ? 'active' : ''}`}
            onClick={() => setSelectedAlgorithm('merge')}
            role="tab"
            aria-selected={selectedAlgorithm === 'merge'}
          >
            Merge Sort
          </button>
          <button
            type="button"
            className={`algo-tab ${selectedAlgorithm === 'heap' ? 'active' : ''}`}
            onClick={() => setSelectedAlgorithm('heap')}
            role="tab"
            aria-selected={selectedAlgorithm === 'heap'}
          >
            Heap Sort
          </button>
          <button
            type="button"
            className={`algo-tab ${selectedAlgorithm === 'insertion' ? 'active' : ''}`}
            onClick={() => setSelectedAlgorithm('insertion')}
            role="tab"
            aria-selected={selectedAlgorithm === 'insertion'}
          >
            Insertion Sort
          </button>
        </div>
      </div>

      {/* Submit Run Button */}
      <button
        type="button"
        className="btn-run"
        disabled={isRunning || Boolean(validationError) || parsedCount === 0}
        onClick={handleSubmit}
      >
        {isRunning ? (
          <>
            <span className="spinner"></span>
            <span>Running C++ Benchmark...</span>
          </>
        ) : (
          <>
            <span>⚡</span>
            <span>
              {selectedAlgorithm === 'all'
                ? 'Execute All 5 Algorithms in C++'
                : `Sort with ${selectedAlgorithm.toUpperCase()}`}
            </span>
          </>
        )}
      </button>
    </aside>
  );
};
