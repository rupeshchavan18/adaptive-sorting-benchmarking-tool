import React, { useState, useEffect } from 'react';
import type { DataPreset } from '../../types';
import {
  generateRandomData,
  generateSortedData,
  generateReverseSortedData,
  generateNearlySortedData,
  parseCommaSeparatedInput,
} from '../../utils/dataGenerators';

interface VisualizerInputPanelProps {
  selectedAlgorithm: 'insertion' | 'merge' | 'quick' | 'heap' | 'adaptive';
  initialData?: number[];
  onSelectAlgorithm: (algo: 'insertion' | 'merge' | 'quick' | 'heap' | 'adaptive', data?: number[]) => void;
  onFetchTrace: (algo: 'insertion' | 'merge' | 'quick' | 'heap' | 'adaptive', data: number[]) => void;
  isLoading: boolean;
}

export const VisualizerInputPanel: React.FC<VisualizerInputPanelProps> = ({
  selectedAlgorithm,
  initialData,
  onSelectAlgorithm,
  onFetchTrace,
  isLoading,
}) => {
  const [preset, setPreset] = useState<DataPreset | 'slide_quick' | 'slide_merge'>('slide_quick');
  const [arraySize, setArraySize] = useState<number>(initialData && initialData.length > 0 ? initialData.length : 7);
  const [rawText, setRawText] = useState<string>(
    initialData && initialData.length > 0 ? initialData.join(', ') : '26, 22, 12, 29, 19, 33, 35'
  );
  const [validationError, setValidationError] = useState<string | null>(null);
  const [parsedCount, setParsedCount] = useState<number>(initialData && initialData.length > 0 ? initialData.length : 7);

  // Sync if initialData prop updates (e.g. user jumped from BenchmarkResultsTable)
  useEffect(() => {
    if (initialData && initialData.length > 0) {
      setRawText(initialData.join(', '));
      setArraySize(initialData.length);
      setPreset('custom');
    }
  }, [initialData]);

  // Apply preset helper
  const applyPreset = (chosenPreset: DataPreset | 'slide_quick' | 'slide_merge', size: number = arraySize) => {
    setPreset(chosenPreset);
    let arr: number[] = [];
    if (chosenPreset === 'slide_quick') {
      arr = [26, 22, 12, 29, 19, 33, 35];
      setArraySize(7);
    } else if (chosenPreset === 'slide_merge') {
      arr = [6, 7, 11, 3, 13, 8, 9, 4];
      setArraySize(8);
    } else if (chosenPreset === 'random') {
      arr = generateRandomData(size, 5, 99);
    } else if (chosenPreset === 'sorted') {
      arr = generateSortedData(size, 10, 5);
    } else if (chosenPreset === 'reverse') {
      arr = generateReverseSortedData(size, size * 10, 5);
    } else if (chosenPreset === 'nearly_sorted') {
      arr = generateNearlySortedData(size, 8);
    }
    setRawText(arr.join(', '));
  };

  useEffect(() => {
    const { numbers, error } = parseCommaSeparatedInput(rawText);
    if (error) {
      setValidationError(error);
      setParsedCount(0);
    } else {
      setValidationError(null);
      setParsedCount(numbers.length);
    }
  }, [rawText]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPreset('custom');
    setRawText(e.target.value);
  };

  const handleSizeChange = (newSize: number) => {
    setArraySize(newSize);
    if (preset !== 'custom' && preset !== 'slide_quick' && preset !== 'slide_merge') {
      applyPreset(preset, newSize);
    } else {
      applyPreset('random', newSize);
    }
  };

  const handleGenerate = () => {
    const { numbers, error } = parseCommaSeparatedInput(rawText);
    if (error) {
      setValidationError(error);
      return;
    }
    onFetchTrace(selectedAlgorithm, numbers);
  };

  return (
    <div className="card visualizer-input-card" aria-label="Visualizer Setup and Controls">
      <div className="card-title">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>🎓</span>
          <span>Algorithm Visualizer Setup</span>
        </div>
        <span className="badge-tag" style={{ color: 'var(--emerald-400)', borderColor: 'rgba(16,185,129,0.3)' }}>
          C++ Trace Engine
        </span>
      </div>

      {/* Allowed 5 Algorithms Selector Tabs */}
      <div className="vis-algo-tabs">
        <button
          type="button"
          className={`vis-algo-tab ${selectedAlgorithm === 'adaptive' ? 'active adaptive' : ''}`}
          onClick={() => {
            const { numbers } = parseCommaSeparatedInput(rawText);
            onSelectAlgorithm('adaptive', numbers);
          }}
        >
          <span className="tab-icon">⚡</span>
          <span className="tab-text">Adaptive Sort</span>
        </button>
        <button
          type="button"
          className={`vis-algo-tab ${selectedAlgorithm === 'insertion' ? 'active insertion' : ''}`}
          onClick={() => {
            const { numbers } = parseCommaSeparatedInput(rawText);
            onSelectAlgorithm('insertion', numbers);
          }}
        >
          <span className="tab-icon">📥</span>
          <span className="tab-text">Insertion Sort</span>
        </button>
        <button
          type="button"
          className={`vis-algo-tab ${selectedAlgorithm === 'merge' ? 'active merge' : ''}`}
          onClick={() => {
            const { numbers } = parseCommaSeparatedInput(rawText);
            onSelectAlgorithm('merge', numbers);
          }}
        >
          <span className="tab-icon">🔀</span>
          <span className="tab-text">Merge Sort</span>
        </button>
        <button
          type="button"
          className={`vis-algo-tab ${selectedAlgorithm === 'quick' ? 'active quick' : ''}`}
          onClick={() => {
            const { numbers } = parseCommaSeparatedInput(rawText);
            onSelectAlgorithm('quick', numbers);
          }}
        >
          <span className="tab-icon">⚡</span>
          <span className="tab-text">Quick Sort</span>
        </button>
        <button
          type="button"
          className={`vis-algo-tab ${selectedAlgorithm === 'heap' ? 'active heap' : ''}`}
          onClick={() => {
            const { numbers } = parseCommaSeparatedInput(rawText);
            onSelectAlgorithm('heap', numbers);
          }}
        >
          <span className="tab-icon">🌲</span>
          <span className="tab-text">Heap Sort</span>
        </button>
      </div>

      {/* Teaching Preset Buttons */}
      <div className="vis-presets-row">
        <span className="vis-preset-label">Presets:</span>
        <div className="vis-preset-pills">
          <button
            type="button"
            className={`btn-preset-mini ${preset === 'slide_quick' ? 'active' : ''}`}
            onClick={() => {
              const data = [26, 22, 12, 29, 19, 33, 35];
              applyPreset('slide_quick');
              onSelectAlgorithm('quick', data);
            }}
            title="Class Slide Example from quick sort.pptx [26, 22, 12, 29, 19, 33, 35]"
          >
            📖 Quick Slide (N=7)
          </button>
          <button
            type="button"
            className={`btn-preset-mini ${preset === 'slide_merge' ? 'active' : ''}`}
            onClick={() => {
              const data = [6, 7, 11, 3, 13, 8, 9, 4];
              applyPreset('slide_merge');
              onSelectAlgorithm('merge', data);
            }}
            title="Class Slide Example from merge sort.pptx [6, 7, 11, 3, 13, 8, 9, 4]"
          >
            📖 Merge Slide (N=8)
          </button>
          <button
            type="button"
            className={`btn-preset-mini ${preset === 'random' ? 'active' : ''}`}
            onClick={() => applyPreset('random')}
          >
            🎲 Random
          </button>
          <button
            type="button"
            className={`btn-preset-mini ${preset === 'nearly_sorted' ? 'active' : ''}`}
            onClick={() => applyPreset('nearly_sorted')}
          >
            ⚡ Nearly Sorted
          </button>
          <button
            type="button"
            className={`btn-preset-mini ${preset === 'sorted' ? 'active' : ''}`}
            onClick={() => applyPreset('sorted')}
          >
            📈 Sorted
          </button>
          <button
            type="button"
            className={`btn-preset-mini ${preset === 'reverse' ? 'active' : ''}`}
            onClick={() => applyPreset('reverse')}
          >
            📉 Reverse
          </button>
        </div>
      </div>

      {/* Quick Size Chips */}
      <div className="vis-size-row">
        <span className="vis-preset-label">Size (N):</span>
        <div className="vis-size-chips">
          {[5, 7, 8, 10, 12, 16, 25].map((s) => (
            <button
              key={s}
              type="button"
              className={`size-chip ${arraySize === s && preset !== 'custom' ? 'active' : ''}`}
              onClick={() => handleSizeChange(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Comma-Separated Text Input */}
      <div className="control-group" style={{ marginBottom: '0.75rem' }}>
        <div className="control-label">
          <span>Array Elements (comma separated):</span>
          <span className="badge-tag mono">{parsedCount} items</span>
        </div>
        <textarea
          className="text-input-area"
          rows={2}
          value={rawText}
          onChange={handleTextChange}
          placeholder="e.g. 26, 22, 12, 29, 19, 33, 35"
          spellCheck={false}
          style={{ minHeight: '60px' }}
        />
        {validationError && (
          <div className="alert-error" style={{ marginTop: '0.4rem', padding: '0.4rem 0.6rem' }}>
            <span>⚠️</span>
            <span>{validationError}</span>
          </div>
        )}
      </div>

      {/* Trigger Button */}
      <button
        type="button"
        className="btn-run"
        onClick={handleGenerate}
        disabled={isLoading || parsedCount === 0 || Boolean(validationError)}
        style={{ padding: '0.75rem 1rem' }}
      >
        {isLoading ? (
          <>
            <span className="spinner"></span>
            <span>Generating Native C++ Trace...</span>
          </>
        ) : (
          <>
            <span>🎬</span>
            <span>Fetch C++ Trace & Visualize</span>
          </>
        )}
      </button>
    </div>
  );
};
