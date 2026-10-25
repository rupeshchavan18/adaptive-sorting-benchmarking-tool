# Verification & Testing Report

This document details the test matrix, test datasets, edge cases, and verification results for the **Adaptive Sorting Algorithm Benchmarking Tool**.

---

## 1. Test Methodology

Testing covers both the **compiled native C++ engine** (`cpp/sorter.exe`) and the **full-stack pipeline** (`Node.js Express backend` -> `C++` -> `React frontend`).

Verification validates:
1. **Mathematical Monotonic Sorting**: Every algorithm must produce output where `arr[i-1] <= arr[i]` for all $1 \le i < N$.
2. **Comparison Counter Integrity**: Comparisons must be non-zero (except for trivial $N=1$) and strictly reflect operations performed in C++.
3. **Trace Terminal Correctness**: The final step of any visualizer trace must have `type: "sorted"` and contain a fully sorted array.
4. **Adaptive Selection Soundness**:
   - Arrays with $N \le 24$: Selects **Branch 1: Insertion Sort (Small Size)**.
   - Arrays with $N > 24$ and adjacent disorder $\le 5\%$: Selects **Branch 2: Insertion Sort (Nearly Sorted)**.
   - Arrays with $N > 24$ and adjacent disorder $> 5\%$: Selects **Branch 3: Quick Sort (General / Disordered)**.
   - Arrays with $N \le 1$: Selects **Trivial** with $O(1)$ space.

---

## 2. Test Execution Matrix & Results

All tests below were executed against the live backend (`http://localhost:5050`) and compiled binary (`cpp/sorter.exe`):

| Test ID | Dataset Name | Size (N) | Input Sample | Expected Outcome | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-01** | API Health & Status | - | `GET /api/status` | Engine ready, compiler detected, 5 algorithms listed | HTTP 200, `engineReady: true`, algorithms matched | **PASS** |
| **TC-02** | Random Array | 15 | `[45, 12, 89, 34, ...]` | All 5 sorted; Adaptive picks Small Size Insertion | 5/5 sorted; Adaptive picked Insertion ($N \le 24$) | **PASS** |
| **TC-03** | Sorted Array | 10 | `[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]` | Insertion & Adaptive sort in linear $O(N)$ comparisons ($N-1=9$) | Insertion & Adaptive: 9 comparisons, $O(N)$ time | **PASS** |
| **TC-04** | Reverse-Sorted | 10 | `[10, 9, 8, 7, ... 1]` | All 5 sorted; Insertion worst-case comparisons ($45$) | All sorted; Insertion: 45 comparisons ($\frac{N(N-1)}{2}$) | **PASS** |
| **TC-05** | Nearly-Sorted | 12 | `[1, 2, 4, 3, 5, 6, ...]` | All 5 sorted; minimal shifts | All sorted; Adaptive chose Small Size Insertion | **PASS** |
| **TC-06** | All Duplicates | 8 | `[7, 7, 7, 7, 7, 7, 7, 7]` | All sorted; no infinite loops or crashes | All 5 sorted verified; Insertion took 7 comparisons | **PASS** |
| **TC-07** | Negative Numbers | 9 | `[-15, 20, -3, 0, 8, -25, ...]` | Correct negative sorting; min is `-25` | Sorted: `[-25, -15, -3, -1, 0, 5, 8, 14, 20]` | **PASS** |
| **TC-08** | Single Element | 1 | `[42]` | Handled trivially; 0 comparisons; stack depth 1; $O(1)$ space | `isSorted: true`, 0 comparisons, stack depth 1 | **PASS** |
| **TC-09** | Empty Array | 0 | `[]` | Clean 400 Bad Request error; no server crash | HTTP 400, `"Invalid or empty data array provided."` | **PASS** |
| **TC-10** | Large Random | 2000 | Random integers $[0..10000]$ | Quick Sort faster than Insertion; all 5 sorted | Quick: 115µs, Insertion: 1515µs; all sorted verified | **PASS** |
| **TC-11** | Large Nearly-Sorted | 2000 | Ascending with 15 random swaps | Adaptive detects disorder $\le 5\%$, picks Insertion | Adaptive: 4013 comps, 27.2µs, Insertion chosen | **PASS** |
| **TC-12** | Large Disordered | 50 | 50 random numbers ($N > 24$) | Adaptive detects disorder $> 5\%$, picks Quick Sort | Adaptive picked Quick Sort (General / Disordered) | **PASS** |

---

## 3. Visualizer Step-by-Step Trace Matrix

Each algorithm was validated on `/api/trace` with `[26, 22, 12, 29, 19, 33, 35]`:

| Algorithm | Total Steps | Final State | Comparisons | Trace Verification |
| :--- | :--- | :--- | :--- | :--- |
| **Insertion Sort** | 30 steps | `[12, 19, 22, 26, 29, 33, 35]` | 10 | Sorted prefix expands step-by-step; key cards and shift indices match. |
| **Merge Sort** | 60 steps | `[12, 19, 22, 26, 29, 33, 35]` | 13 | Recursive split down to single-element base cases; $i, j, k$ buffer merges match. |
| **Quick Sort** | 32 steps | `[12, 19, 22, 26, 29, 33, 35]` | 15 | Pivots selected, $i$ and $j$ pointers scanned, swaps occur, pivot locks at final index. |
| **Heap Sort** | 73 steps | `[12, 19, 22, 26, 29, 33, 35]` | 20 | Bottom-up max-heap construction verified; root extraction into sorted suffix verified. |
| **Adaptive Sort** | 32 steps | `[12, 19, 22, 26, 29, 33, 35]` | 10 | Evaluates $N=7 \le 24$, presents decision card, routes to Insertion Sort steps. |

---

## 4. How to Re-Run the Verification Suite

With the backend running on port 5050, run the automated verification script:
```bash
node "C:\Users\gaura\.gemini\antigravity-ide\brain\99ed2e4f-6ce4-4feb-93fe-be43123752b0\scratch\test_suite.js"
```
Or test the native binary directly from terminal:
```bash
echo "26, 22, 12, 29, 19, 33, 35" | cpp\sorter.exe --algo all
```
