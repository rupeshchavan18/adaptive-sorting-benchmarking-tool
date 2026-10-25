export interface BenchmarkResult {
  algorithmName: string;
  algorithmKey: 'insertion' | 'merge' | 'quick' | 'heap' | 'adaptive';
  inputSize: number;
  comparisons: number;
  executionTimeUs: number;
  executionTimeMs: number;
  theoreticalTimeComplexity: string;
  theoreticalAuxSpace: string;
  auxiliaryHeapBytes: number;
  inputDataBytes: number;
  maxCallStackDepth: number;
  peakWorkingSetBytes: number;
  strategyBranch: string;
  strategyDetails: string;
  isSorted: boolean;
  sortedData: number[];
}

export interface ApiResponseSingle {
  success: boolean;
  mode: 'single';
  result: BenchmarkResult;
  error?: string;
}

export interface ApiResponseAll {
  success: boolean;
  mode: 'all';
  inputSize: number;
  results: BenchmarkResult[];
  error?: string;
}

export type ApiResponse = ApiResponseSingle | ApiResponseAll;

export interface EngineStatus {
  engineReady: boolean;
  sorterExePath: string;
  compiler: string;
  algorithms: string[];
}

export type DataPreset = 'random' | 'sorted' | 'reverse' | 'nearly_sorted' | 'custom';

// ============================================================================
// Trace Event Types from Native C++ Engine
// ============================================================================
export interface TraceStep {
  stepIndex: number;
  pass: number;
  phase: string;
  type: string;
  array: number[];
  description: string;
  comparisons: number;

  // Insertion Sort specific
  key?: number;
  keyIndex?: number;
  insertIndex?: number;
  compareIndex?: number;
  sortedPrefixEnd?: number;

  // Merge Sort specific
  left?: number;
  mid?: number;
  right?: number;
  depth?: number;
  L?: number[];
  R?: number[];
  i?: number;
  j?: number;
  k?: number;
  mergedResult?: number[];

  // Quick Sort specific
  low?: number;
  high?: number;
  pivotIndex?: number;
  pivotValue?: number;
  leftPointer?: number;
  rightPointer?: number;
  finalPivotIndex?: number;
  fixedPivots?: number[];

  // Heap Sort specific
  heapSize?: number;
  rootIndex?: number;
  leftChildIndex?: number;
  rightChildIndex?: number;
  largestIndex?: number;
  swapIdx1?: number;
  swapIdx2?: number;
  sortedBoundary?: number;

  // Adaptive Sort specific
  adaptiveDecision?: string;
  adaptiveReason?: string;
  adjacentInversions?: number;
  inversionRatio?: number;
  chosenAlgorithm?: string;
}

export interface TraceResponse {
  success: boolean;
  mode: 'trace';
  algorithmKey: 'insertion' | 'merge' | 'quick' | 'heap' | 'adaptive';
  algorithmName: string;
  inputSize: number;
  comparisons: number;
  executionTimeUs: number;
  executionTimeMs: number;
  strategyBranch: string;
  strategyDetails: string;
  isSorted: boolean;
  totalSteps: number;
  steps: TraceStep[];
  sortedData: number[];
  error?: string;
}
