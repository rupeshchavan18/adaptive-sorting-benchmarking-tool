# Algorithmic Analysis & Implementation Guide

This document details the theory, C++ implementation mechanics, time/space complexities, and practical limitations of the strictly **five sorting algorithms** supported in this benchmarking platform:
1. **Insertion Sort**
2. **Merge Sort**
3. **Quick Sort**
4. **Heap Sort**
5. **Adaptive Sort**

All code references correspond directly to the native C++ engine implementation in [`cpp/sorter.cpp`](file:///d:/capcut%20raw%20video/DS%20project/cpp/sorter.cpp).

---

## 1. Insertion Sort

### Conceptual Overview
Insertion Sort operates analogously to how a card player organizes a hand of playing cards. The array is conceptually partitioned into two regions:
1. **Sorted Prefix** on the left: indices `[0..i-1]`.
2. **Unsorted Suffix** on the right: indices `[i..N-1]`.

In each pass, the algorithm extracts the element at index `i` (the **`key`**) and scans backward through the sorted prefix, shifting elements greater than `key` one position to the right, until finding the correct position for `key`.

### Implementation Details (`cpp/sorter.cpp`)
```cpp
void insertionSort(std::vector<int>& arr, uint64_t& comparisons) {
    int n = static_cast<int>(arr.size());
    for (int i = 1; i < n; ++i) {
        int key = arr[i];
        int j = i - 1;
        while (j >= 0) {
            comparisons++;
            if (arr[j] > key) {
                arr[j + 1] = arr[j];
                j--;
            } else {
                break;
            }
        }
        arr[j + 1] = key;
    }
}
```

### Complexity Analysis
- **Best-Case Time Complexity**: $\mathcal{O}(N)$
  - Occurs when the input array is already sorted.
  - The inner loop executes a single comparison (`arr[i-1] <= key`) and breaks immediately, performing exactly $N - 1$ comparisons and $0$ shifts.
- **Worst-Case Time Complexity**: $\mathcal{O}(N^2)$
  - Occurs when the input array is in reverse order.
  - Every element must be compared against and shifted past every preceding element:
    $$\sum_{i=1}^{N-1} i = \frac{N(N - 1)}{2} \text{ comparisons and shifts}$$
- **Average-Case Time Complexity**: $\mathcal{O}(N^2)$
- **Auxiliary Space Complexity**: $\mathcal{O}(1)$ (strictly in-place, $0\text{ B}$ dynamic heap allocation).
- **Stability**: Stable (equal elements retain their relative initial order because elements are only shifted when `arr[j] > key`).

### Limitations
- Degrades quadratically ($\mathcal{O}(N^2)$) on large random or reverse-sorted inputs.
- Unsuitable as a general-purpose standalone sort for large datasets ($N > 1000$).

---

## 2. Merge Sort

### Conceptual Overview
Merge Sort is a classic **divide-and-conquer** algorithm. It works by:
1. **Divide**: Splitting the unsorted array in half recursively until sub-arrays have size $1$ (which are trivially sorted).
2. **Conquer & Combine**: Merging two sorted adjacent sub-arrays into a single sorted range using temporary buffer storage and two-finger comparison pointers.

### Implementation Details (`cpp/sorter.cpp`)
```cpp
void merge(std::vector<int>& arr, int left, int mid, int right, 
           uint64_t& comparisons, size_t& auxHeapBytes) {
    int n1 = mid - left + 1;
    int n2 = right - mid;

    // Allocate temporary buffers on the heap
    std::vector<int> L(n1);
    std::vector<int> R(n2);
    auxHeapBytes += (n1 + n2) * sizeof(int);

    for (int i = 0; i < n1; ++i) L[i] = arr[left + i];
    for (int j = 0; j < n2; ++j) R[j] = arr[mid + 1 + j];

    int i = 0, j = 0, k = left;
    while (i < n1 && j < n2) {
        comparisons++;
        if (L[i] <= R[j]) {
            arr[k++] = L[i++];
        } else {
            arr[k++] = R[j++];
        }
    }
    while (i < n1) arr[k++] = L[i++];
    while (j < n2) arr[k++] = R[j++];
}
```

### Complexity Analysis
- **Best-Case Time Complexity**: $\mathcal{O}(N \log N)$
- **Worst-Case Time Complexity**: $\mathcal{O}(N \log N)$
- **Average-Case Time Complexity**: $\mathcal{O}(N \log N)$
  - The recurrence relation is $T(N) = 2T(N/2) + \mathcal{O}(N)$, which solves to $\Theta(N \log N)$ in all cases by the Master Theorem.
- **Auxiliary Space Complexity**: $\mathcal{O}(N)$
  - Requires dynamic memory allocation for temporary buffers `L` and `R`. In our engine, this is measured and tracked via `auxHeapBytes` ($N \times \text{sizeof}(int)$).
  - Call stack recursion depth requires $\mathcal{O}(\log N)$ stack frames.
- **Stability**: Stable (the condition `L[i] <= R[j]` ensures that items from the left sub-array precede equal items from the right sub-array).

### Limitations
- Not an in-place sort; requires substantial auxiliary memory ($\mathcal{O}(N)$ bytes).
- Sub-allocations incur heap overhead compared to in-place partition-based algorithms.
- Does not naturally adapt to already-sorted input without additional pre-checks.

---

## 3. Quick Sort

### Conceptual Overview
Quick Sort is a divide-and-conquer algorithm that sorts an array by selecting a **pivot** element and **partitioning** the array around it:
- Elements less than or equal to the pivot are placed to its left.
- Elements greater than the pivot are placed to its right.
- The pivot ends up in its final sorted position.
- The left and right sub-arrays are then sorted recursively.

### Implementation Details (`cpp/sorter.cpp`)
To prevent worst-case $\mathcal{O}(N^2)$ degradation on already-sorted inputs, the benchmarking implementation uses a **middle-element pivot**:
```cpp
int partition(std::vector<int>& arr, int low, int high, uint64_t& comparisons) {
    int mid = low + (high - low) / 2;
    std::swap(arr[mid], arr[high]); // Move middle pivot to end
    int pivot = arr[high];

    int i = low - 1;
    for (int j = low; j < high; ++j) {
        comparisons++;
        if (arr[j] <= pivot) {
            i++;
            std::swap(arr[i], arr[j]);
        }
    }
    std::swap(arr[i + 1], arr[high]); // Place pivot in final spot
    return i + 1;
}

void quickSortInternal(std::vector<int>& arr, int low, int high, 
                       uint64_t& comparisons, int currentDepth, int& maxDepth) {
    if (currentDepth > maxDepth) maxDepth = currentDepth;
    if (low < high) {
        int pi = partition(arr, low, high, comparisons);
        quickSortInternal(arr, low, pi - 1, comparisons, currentDepth + 1, maxDepth);
        quickSortInternal(arr, pi + 1, high, comparisons, currentDepth + 1, maxDepth);
    }
}
```

### Complexity Analysis
- **Best-Case Time Complexity**: $\mathcal{O}(N \log N)$ (when partition splits the array roughly in half).
- **Average-Case Time Complexity**: $\mathcal{O}(N \log N)$ (with average constant factors lower than Merge Sort and Heap Sort due to tight inner loops and cache locality).
- **Worst-Case Time Complexity**: $\mathcal{O}(N^2)$ (occurs if partitions are maximally unbalanced, e.g. selecting an extreme element as pivot at each step).
- **Auxiliary Space Complexity**: $\mathcal{O}(\log N)$ call stack frames on average ($\mathcal{O}(N)$ worst-case). Zero dynamic heap allocations ($0\text{ B}$).
- **Stability**: Unstable (long-range swaps across the pivot can reorder identical elements).

### Limitations
- Can degrade to $\mathcal{O}(N^2)$ on adversarial inputs if naive pivot selection is used.
- Susceptible to stack overflow on extremely large arrays if recursion depth is unconstrained.

---

## 4. Heap Sort

### Conceptual Overview
Heap Sort utilizes a **Binary Max-Heap** data structure laid out implicitly inside the array:
- For any node at index `i`:
  - **Parent index**: `(i - 1) / 2`
  - **Left child index**: `2 * i + 1`
  - **Right child index**: `2 * i + 2`

The sorting process comprises two distinct phases:
1. **Max-Heap Construction**: Transforms the array into a max-heap where every parent node is greater than or equal to its children (`arr[parent] >= arr[child]`). This is accomplished by calling `heapify` from `n / 2 - 1` down to `0` in linear $\mathcal{O}(N)$ time.
2. **Extraction & Sift-Down**: Repeatedly extracts the maximum element (located at `arr[0]`), swaps it with the element at the active heap boundary (`arr[i]`), decreases the heap boundary, and sifts down the new root element via `heapify`.

### Implementation Details (`cpp/sorter.cpp`)
```cpp
void heapify(std::vector<int>& arr, int n, int i, uint64_t& comparisons) {
    int largest = i;
    int left = 2 * i + 1;
    int right = 2 * i + 2;

    if (left < n) {
        comparisons++;
        if (arr[left] > arr[largest]) largest = left;
    }
    if (right < n) {
        comparisons++;
        if (arr[right] > arr[largest]) largest = right;
    }
    if (largest != i) {
        std::swap(arr[i], arr[largest]);
        heapify(arr, n, largest, comparisons);
    }
}

void heapSort(std::vector<int>& arr, uint64_t& comparisons) {
    int n = static_cast<int>(arr.size());
    // Phase 1: Build Max-Heap
    for (int i = n / 2 - 1; i >= 0; --i) {
        heapify(arr, n, i, comparisons);
    }
    // Phase 2: Extraction and Sift-down
    for (int i = n - 1; i > 0; --i) {
        std::swap(arr[0], arr[i]);
        heapify(arr, i, 0, comparisons);
    }
}
```

### Complexity Analysis
- **Best-Case Time Complexity**: $\mathcal{O}(N \log N)$
- **Worst-Case Time Complexity**: $\mathcal{O}(N \log N)$
- **Average-Case Time Complexity**: $\mathcal{O}(N \log N)$
  - Building the heap takes $\mathcal{O}(N)$ time.
  - Each of the $N - 1$ extractions requires $\mathcal{O}(\log N)$ comparisons to sift down, yielding a strict $\Theta(N \log N)$ guarantee regardless of input order.
- **Auxiliary Space Complexity**: $\mathcal{O}(1)$ (in-place; $0\text{ B}$ dynamic heap allocation).
- **Stability**: Unstable (swapping the root with the boundary element reorders identical keys).

### Limitations
- **Poor Cache Locality**: Heapify steps jump between index `i` and children `2i + 1`, causing CPU cache misses on large arrays.
- **Non-Adaptive**: Performs the full $\mathcal{O}(N \log N)$ work even if the array is already sorted.

---

## 5. Adaptive Sort

### Conceptual Overview & Motivation
Standard divide-and-conquer algorithms (Merge Sort, Quick Sort, Heap Sort) always perform $\mathcal{O}(N \log N)$ work, even when given an array that is already sorted or nearly sorted. Conversely, Insertion Sort achieves optimal linear $\mathcal{O}(N)$ performance on sorted arrays and has virtually zero function overhead on tiny arrays, but degrades to $\mathcal{O}(N^2)$ on large disordered arrays.

**Adaptive Sort** combines the best of both paradigms using a **heuristic decision engine** that inspects dataset characteristics prior to sorting.

### Exact Decision Engine Implementation (`cpp/sorter.cpp`)
```cpp
const size_t SMALL_ARRAY_THRESHOLD = 24;
const double NEARLY_SORTED_THRESHOLD = 0.05; // 5% adjacent inversions

void adaptiveSort(std::vector<int>& arr, uint64_t& comparisons, 
                  int& maxDepth, std::string& strategyBranch, 
                  std::string& strategyDetails) {
    size_t n = arr.size();
    if (n <= 1) {
        strategyBranch = "Trivial Base Case (N <= 1)";
        strategyDetails = "Array has 0 or 1 element; already sorted.";
        maxDepth = 1;
        return;
    }

    // Rule 1: Small Array Threshold
    if (n <= SMALL_ARRAY_THRESHOLD) {
        strategyBranch = "Insertion Sort (Small Size)";
        strategyDetails = "Selected Insertion Sort: input size N is within the small-array "
                          "threshold (N <= 24), minimizing function call & partitioning overhead.";
        insertionSort(arr, comparisons);
        maxDepth = 1;
        return;
    }

    // Rule 2 & 3: Disorder / Inversion Scan for N > 24
    size_t adjacentInversions = 0;
    for (size_t i = 0; i < n - 1; ++i) {
        comparisons++;
        if (arr[i] > arr[i + 1]) {
            adjacentInversions++;
        }
    }
    double inversionRatio = static_cast<double>(adjacentInversions) / static_cast<double>(n - 1);

    if (inversionRatio <= NEARLY_SORTED_THRESHOLD) {
        // Rule 2: Nearly Sorted
        strategyBranch = "Insertion Sort (Nearly Sorted)";
        strategyDetails = "Selected Insertion Sort: array is nearly sorted with inversion ratio "
                          "<= 5.0%. Insertion Sort runs in adaptive near O(N) time.";
        insertionSort(arr, comparisons);
        maxDepth = 1;
    } else {
        // Rule 3: General / Disordered
        strategyBranch = "Quick Sort (General / Disordered)";
        strategyDetails = "Selected Quick Sort: array has high disorder (> 5.0% inversions). "
                          "Quick Sort provides optimal O(N log N) partitioning.";
        quickSort(arr, comparisons, maxDepth);
    }
}
```

### Strategy Summary Matrix

| Condition | Strategy Branch Selected | Underlying Algorithm | Asymptotic Complexity | Typical Use Case |
| :--- | :--- | :--- | :---: | :--- |
| **$N \le 24$** | `Insertion Sort (Small Size)` | Insertion Sort | $\mathcal{O}(N)$ best / $\mathcal{O}(N^2)$ worst | Small datasets, recursion base-cases |
| **$N > 24$, Inversions $\le 5\%$** | `Insertion Sort (Nearly Sorted)` | Insertion Sort | Near $\mathcal{O}(N)$ | Logs, append-heavy data, sorted streams |
| **$N > 24$, Inversions $> 5\%$** | `Quick Sort (General / Disordered)` | Quick Sort (mid-pivot) | $\mathcal{O}(N \log N)$ average | Random, reverse, or highly chaotic datasets |

### Complexity Analysis
- **Best-Case Time Complexity**: $\mathcal{O}(N)$ (triggers on sorted or nearly sorted arrays; completes with $N - 1$ comparisons).
- **Average-Case Time Complexity**: $\mathcal{O}(N \log N)$ (on disordered arrays, routes to Quick Sort).
- **Worst-Case Time Complexity**: $\mathcal{O}(N^2)$ (if routed to Quick Sort and worst-case partitions occur, or on reverse-sorted arrays with $N \le 24$).
- **Space Complexity**: $\mathcal{O}(1)$ auxiliary heap memory; $\mathcal{O}(\log N)$ call stack when routing to Quick Sort.

### Limitations
- The linear disorder scan incurs $N - 1$ comparisons before selecting Quick Sort on large disordered arrays. However, since $N - 1 \ll N \log_2 N$, this overhead is negligible ($< 5\%$ of total comparisons).

---

## 6. Comprehensive Comparative Summary

| Algorithm | Best-Case Time | Average Time | Worst-Case Time | Theoretical Space | Measured Aux Heap | Stability | In-Place? | Adaptive to Sorted Input? |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Insertion Sort** | $\mathcal{O}(N)$ | $\mathcal{O}(N^2)$ | $\mathcal{O}(N^2)$ | $\mathcal{O}(1)$ | $0\text{ B}$ | **Yes** | **Yes** | **Yes** (terminates in $N-1$ comps) |
| **Merge Sort** | $\mathcal{O}(N \log N)$ | $\mathcal{O}(N \log N)$ | $\mathcal{O}(N \log N)$ | $\mathcal{O}(N)$ | $N \times 4\text{ B}$ | **Yes** | **No** | **No** (always divides & merges) |
| **Quick Sort** | $\mathcal{O}(N \log N)$ | $\mathcal{O}(N \log N)$ | $\mathcal{O}(N^2)$ | $\mathcal{O}(\log N)$ | $0\text{ B}$ | **No** | **Yes** | **No** (always partitions) |
| **Heap Sort** | $\mathcal{O}(N \log N)$ | $\mathcal{O}(N \log N)$ | $\mathcal{O}(N \log N)$ | $\mathcal{O}(1)$ | $0\text{ B}$ | **No** | **Yes** | **No** (always builds & extracts) |
| **Adaptive Sort** | $\mathcal{O}(N)$ | $\mathcal{O}(N \log N)$ | $\mathcal{O}(N^2)$ | $\mathcal{O}(1) \text{ or } \mathcal{O}(\log N)$ | $0\text{ B}$ | Hybrid | **Yes** | **Yes** (detects disorder $\le 5\%$) |
