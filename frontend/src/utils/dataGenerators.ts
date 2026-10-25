/**
 * Utility functions for generating benchmark test datasets
 * and formatting measurement values.
 */

export function generateRandomData(size: number, min = 1, max = 1000): number[] {
  const result: number[] = [];
  for (let i = 0; i < size; i++) {
    result.push(Math.floor(Math.random() * (max - min + 1)) + min);
  }
  return result;
}

export function generateSortedData(size: number, start = 1, step = 1): number[] {
  const result: number[] = [];
  for (let i = 0; i < size; i++) {
    result.push(start + i * step);
  }
  return result;
}

export function generateReverseSortedData(size: number, start = 1000, step = 1): number[] {
  const result: number[] = [];
  for (let i = 0; i < size; i++) {
    result.push(start - i * step);
  }
  return result;
}

export function generateNearlySortedData(size: number, perturbationPercent = 5): number[] {
  const arr = generateSortedData(size, 1, 2);
  const swapsCount = Math.max(1, Math.round((size * (perturbationPercent / 100)) / 2));

  for (let s = 0; s < swapsCount; s++) {
    const idx1 = Math.floor(Math.random() * size);
    // Swap with an adjacent or nearby neighbor to maintain the "nearly sorted" property
    const offset = Math.random() < 0.5 ? 1 : 2;
    const idx2 = Math.min(size - 1, Math.max(0, idx1 + (Math.random() < 0.5 ? offset : -offset)));
    const temp = arr[idx1];
    arr[idx1] = arr[idx2];
    arr[idx2] = temp;
  }

  return arr;
}

export function parseCommaSeparatedInput(text: string): { numbers: number[]; error?: string } {
  const trimmed = text.trim();
  if (!trimmed) {
    return { numbers: [], error: 'Input is empty. Please enter comma-separated numbers.' };
  }

  const rawTokens = trimmed.split(/[\s,]+/);
  const numbers: number[] = [];

  for (let i = 0; i < rawTokens.length; i++) {
    const tok = rawTokens[i];
    if (tok === '') continue;
    const n = Number(tok);
    if (isNaN(n) || !Number.isInteger(n)) {
      return { numbers: [], error: `Invalid integer "${tok}" at position ${i + 1}.` };
    }
    numbers.push(n);
  }

  if (numbers.length === 0) {
    return { numbers: [], error: 'No valid numbers found in the input.' };
  }

  return { numbers };
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let val = bytes;
  let idx = 0;
  while (val >= 1024 && idx < units.length - 1) {
    val /= 1024;
    idx++;
  }
  return `${val.toFixed(idx === 0 ? 0 : 2)} ${units[idx]}`;
}

export function formatTime(microseconds: number): string {
  if (microseconds < 1) {
    return `${(microseconds * 1000).toFixed(1)} ns`;
  }
  if (microseconds < 1000) {
    return `${microseconds.toFixed(2)} µs`;
  }
  const ms = microseconds / 1000;
  if (ms < 1000) {
    return `${ms.toFixed(3)} ms`;
  }
  return `${(ms / 1000).toFixed(3)} s`;
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}
