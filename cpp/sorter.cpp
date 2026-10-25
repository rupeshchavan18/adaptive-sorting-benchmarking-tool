/**
 * ============================================================================
 * Adaptive Sorting Algorithm Benchmarking & Visualizer Engine (C++11)
 * ============================================================================
 * 
 * DSA Project: Adaptive Sorting Algorithm Benchmarking Tool
 * 
 * Implemented Algorithms (Only 5 Allowed):
 *  1. Merge Sort      - O(N log N) time, O(N) auxiliary space, stable divide-and-conquer
 *  2. Quick Sort      - O(N log N) average time, O(log N) stack, in-place partitioning
 *  3. Heap Sort       - O(N log N) worst-case time, O(1) auxiliary space, binary heap
 *  4. Insertion Sort  - O(N^2) worst-case, O(N) best-case (sorted), O(1) space
 *  5. Adaptive Sort   - Intelligently switches between Insertion Sort and Quick Sort
 *                       based on array size and level of disorder (nearly sortedness).
 * 
 * Tracing & Benchmarking:
 *  - Supports pure high-speed native benchmarking via `--algo <algo|all>`
 *  - Supports fine-grained step-by-step pedagogical trace generation via `--trace`
 *  - Strictly tracks pairwise comparisons and high-precision execution timings
 *  - No mock/fake steps; all visualizer events originate from actual C++ execution
 * 
 * ============================================================================
 */

#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <chrono>
#include <cstdint>
#include <cstdlib>
#include <algorithm>
#include <cmath>
#include <iomanip>


#ifdef _WIN32
#include <windows.h>
#include <psapi.h>
#endif

// ============================================================================
// Benchmarking Structures
// ============================================================================
struct BenchmarkResult {
    std::string algorithmName;
    std::string algorithmKey;
    size_t inputSize;
    uint64_t comparisons;
    double executionTimeUs;
    double executionTimeMs;
    std::string theoreticalTimeComplexity;
    std::string theoreticalAuxSpace;
    size_t auxiliaryHeapBytes;
    size_t inputDataBytes;
    int maxCallStackDepth;
    size_t peakWorkingSetBytes;
    std::string strategyBranch;
    std::string strategyDetails;
    bool isSorted;
    std::vector<int> sortedData;
};

// High-precision timer using Windows QueryPerformanceCounter
class PrecisionTimer {
#ifdef _WIN32
    LARGE_INTEGER freq;
    LARGE_INTEGER start;
#else
    std::chrono::high_resolution_clock::time_point start;
#endif
public:
    PrecisionTimer() {
#ifdef _WIN32
        QueryPerformanceFrequency(&freq);
#endif
    }
    void startTimer() {
#ifdef _WIN32
        QueryPerformanceCounter(&start);
#else
        start = std::chrono::high_resolution_clock::now();
#endif
    }
    double stopTimerUs() {
#ifdef _WIN32
        LARGE_INTEGER end;
        QueryPerformanceCounter(&end);
        double microseconds = (static_cast<double>(end.QuadPart - start.QuadPart) * 1000000.0) / static_cast<double>(freq.QuadPart);
        return microseconds;
#else
        auto end = std::chrono::high_resolution_clock::now();
        std::chrono::duration<double, std::micro> elapsed = end - start;
        return elapsed.count();
#endif
    }
};

// Helper: Measure current process peak working set in bytes (Windows)
size_t getPeakWorkingSetMemory() {
#ifdef _WIN32
    PROCESS_MEMORY_COUNTERS pmc;
    if (GetProcessMemoryInfo(GetCurrentProcess(), &pmc, sizeof(pmc))) {
        return pmc.PeakWorkingSetSize;
    }
#endif
    return 0;
}

// JSON Escaping helper
std::string escapeJson(const std::string& s) {
    std::ostringstream o;
    for (char c : s) {
        if (c == '"') o << "\\\"";
        else if (c == '\\') o << "\\\\";
        else if (c == '\b') o << "\\b";
        else if (c == '\f') o << "\\f";
        else if (c == '\n') o << "\\n";
        else if (c == '\r') o << "\\r";
        else if (c == '\t') o << "\\t";
        else o << c;
    }
    return o.str();
}

// ============================================================================
// 1. INSERTION SORT (Benchmarking Implementation)
// ============================================================================
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

// ============================================================================
// 2. MERGE SORT (Benchmarking Implementation)
// ============================================================================
void merge(std::vector<int>& arr, int left, int mid, int right, uint64_t& comparisons, size_t& auxHeapBytes) {
    int n1 = mid - left + 1;
    int n2 = right - mid;

    std::vector<int> L(n1);
    std::vector<int> R(n2);
    auxHeapBytes += (n1 + n2) * sizeof(int);

    for (int i = 0; i < n1; ++i) {
        L[i] = arr[left + i];
    }
    for (int j = 0; j < n2; ++j) {
        R[j] = arr[mid + 1 + j];
    }

    int i = 0;
    int j = 0;
    int k = left;

    while (i < n1 && j < n2) {
        comparisons++;
        if (L[i] <= R[j]) {
            arr[k++] = L[i++];
        } else {
            arr[k++] = R[j++];
        }
    }

    while (i < n1) {
        arr[k++] = L[i++];
    }
    while (j < n2) {
        arr[k++] = R[j++];
    }
}

void mergeSortInternal(std::vector<int>& arr, int left, int right, uint64_t& comparisons, size_t& auxHeapBytes, int currentDepth, int& maxDepth) {
    if (currentDepth > maxDepth) maxDepth = currentDepth;
    if (left < right) {
        int mid = left + (right - left) / 2;
        mergeSortInternal(arr, left, mid, comparisons, auxHeapBytes, currentDepth + 1, maxDepth);
        mergeSortInternal(arr, mid + 1, right, comparisons, auxHeapBytes, currentDepth + 1, maxDepth);
        merge(arr, left, mid, right, comparisons, auxHeapBytes);
    }
}

void mergeSort(std::vector<int>& arr, uint64_t& comparisons, size_t& auxHeapBytes, int& maxDepth) {
    maxDepth = (arr.size() > 1) ? 0 : 1;
    if (arr.size() > 1) {
        mergeSortInternal(arr, 0, static_cast<int>(arr.size()) - 1, comparisons, auxHeapBytes, 1, maxDepth);
    }
}

// ============================================================================
// 3. QUICK SORT (Benchmarking Implementation)
// ============================================================================
int partition(std::vector<int>& arr, int low, int high, uint64_t& comparisons) {
    int mid = low + (high - low) / 2;
    std::swap(arr[mid], arr[high]);
    int pivot = arr[high];

    int i = low - 1;
    for (int j = low; j < high; ++j) {
        comparisons++;
        if (arr[j] <= pivot) {
            i++;
            std::swap(arr[i], arr[j]);
        }
    }
    std::swap(arr[i + 1], arr[high]);
    return i + 1;
}

void quickSortInternal(std::vector<int>& arr, int low, int high, uint64_t& comparisons, int currentDepth, int& maxDepth) {
    if (currentDepth > maxDepth) maxDepth = currentDepth;
    if (low < high) {
        int pi = partition(arr, low, high, comparisons);
        quickSortInternal(arr, low, pi - 1, comparisons, currentDepth + 1, maxDepth);
        quickSortInternal(arr, pi + 1, high, comparisons, currentDepth + 1, maxDepth);
    }
}

void quickSort(std::vector<int>& arr, uint64_t& comparisons, int& maxDepth) {
    maxDepth = (arr.size() > 1) ? 0 : 1;
    if (arr.size() > 1) {
        quickSortInternal(arr, 0, static_cast<int>(arr.size()) - 1, comparisons, 1, maxDepth);
    }
}

// ============================================================================
// 4. HEAP SORT (Benchmarking Implementation)
// ============================================================================
void heapify(std::vector<int>& arr, int n, int i, uint64_t& comparisons) {
    int largest = i;
    int left = 2 * i + 1;
    int right = 2 * i + 2;

    if (left < n) {
        comparisons++;
        if (arr[left] > arr[largest]) {
            largest = left;
        }
    }

    if (right < n) {
        comparisons++;
        if (arr[right] > arr[largest]) {
            largest = right;
        }
    }

    if (largest != i) {
        std::swap(arr[i], arr[largest]);
        heapify(arr, n, largest, comparisons);
    }
}

void heapSort(std::vector<int>& arr, uint64_t& comparisons) {
    int n = static_cast<int>(arr.size());
    for (int i = n / 2 - 1; i >= 0; --i) {
        heapify(arr, n, i, comparisons);
    }
    for (int i = n - 1; i > 0; --i) {
        std::swap(arr[0], arr[i]);
        heapify(arr, i, 0, comparisons);
    }
}

// ============================================================================
// 5. ADAPTIVE SORT (Benchmarking Implementation)
// ============================================================================
void adaptiveSort(
    std::vector<int>& arr,
    uint64_t& comparisons,
    size_t& auxHeapBytes,
    int& maxDepth,
    std::string& strategyBranch,
    std::string& strategyDetails
) {
    int n = static_cast<int>(arr.size());
    if (n <= 1) {
        strategyBranch = "Trivial";
        strategyDetails = "Array has 0 or 1 element; already sorted.";
        return;
    }

    const int SMALL_THRESHOLD = 24;
    const double NEARLY_SORTED_THRESHOLD = 0.05; // 5% adjacent inversions

    // Branch 1: Small Array Threshold
    if (n <= SMALL_THRESHOLD) {
        strategyBranch = "Insertion Sort (Small Size)";
        std::ostringstream ss;
        ss << "Selected Insertion Sort: input size N=" << n 
           << " is within the small-array threshold (N <= " << SMALL_THRESHOLD 
           << "), where Insertion Sort minimizes function call & partitioning overhead.";
        strategyDetails = ss.str();
        insertionSort(arr, comparisons);
        maxDepth = 1;
        return;
    }

    // Branch 2: Inversion density scan
    int adjacentInversions = 0;
    for (int i = 0; i < n - 1; ++i) {
        comparisons++;
        if (arr[i] > arr[i + 1]) {
            adjacentInversions++;
        }
    }

    double inversionRatio = static_cast<double>(adjacentInversions) / static_cast<double>(n - 1);

    if (inversionRatio <= NEARLY_SORTED_THRESHOLD) {
        strategyBranch = "Insertion Sort (Nearly Sorted)";
        std::ostringstream ss;
        ss << std::fixed << std::setprecision(2);
        ss << "Selected Insertion Sort: array is nearly sorted with " << adjacentInversions
           << " adjacent inversion(s) (" << (inversionRatio * 100.0) << "% <= " 
           << (NEARLY_SORTED_THRESHOLD * 100.0) 
           << "% threshold). Insertion Sort runs in adaptive near O(N) time.";
        strategyDetails = ss.str();
        insertionSort(arr, comparisons);
        maxDepth = 1;
    } else {
        strategyBranch = "Quick Sort (General / Disordered)";
        std::ostringstream ss;
        ss << std::fixed << std::setprecision(2);
        ss << "Selected Quick Sort: array size N=" << n << " with high disorder ("
           << adjacentInversions << " adjacent inversions, " << (inversionRatio * 100.0)
           << "% > " << (NEARLY_SORTED_THRESHOLD * 100.0) 
           << "% threshold). Quick Sort provides optimal O(N log N) partitioning.";
        strategyDetails = ss.str();
        quickSort(arr, comparisons, maxDepth);
    }
}

// Verification Helper
bool verifySorted(const std::vector<int>& arr) {
    for (size_t i = 1; i < arr.size(); ++i) {
        if (arr[i - 1] > arr[i]) {
            return false;
        }
    }
    return true;
}

// Single Algorithm Runner & Benchmarking Harness
BenchmarkResult runBenchmark(const std::string& algoKey, std::vector<int> data) {
    BenchmarkResult res;
    res.inputSize = data.size();
    res.comparisons = 0;
    res.auxiliaryHeapBytes = 0;
    res.maxCallStackDepth = 1;
    res.inputDataBytes = data.size() * sizeof(int);

    PrecisionTimer timer;
    timer.startTimer();

    if (algoKey == "insertion") {
        res.algorithmName = "Insertion Sort";
        res.algorithmKey = "insertion";
        res.theoreticalTimeComplexity = "O(N^2) worst / O(N) best";
        res.theoreticalAuxSpace = "O(1)";
        res.strategyBranch = "In-Place Insertion";
        res.strategyDetails = "Iteratively shifts unsorted elements into their correct position in the sorted prefix.";
        insertionSort(data, res.comparisons);
    } else if (algoKey == "merge") {
        res.algorithmName = "Merge Sort";
        res.algorithmKey = "merge";
        res.theoreticalTimeComplexity = "O(N log N)";
        res.theoreticalAuxSpace = "O(N)";
        res.strategyBranch = "Divide & Conquer";
        res.strategyDetails = "Recursively divides array into halves and merges sorted sub-arrays using temporary buffers.";
        mergeSort(data, res.comparisons, res.auxiliaryHeapBytes, res.maxCallStackDepth);
    } else if (algoKey == "quick") {
        res.algorithmName = "Quick Sort";
        res.algorithmKey = "quick";
        res.theoreticalTimeComplexity = "O(N log N) avg / O(N^2) worst";
        res.theoreticalAuxSpace = "O(log N)";
        res.strategyBranch = "Pivot Partitioning";
        res.strategyDetails = "Selects a middle pivot to partition elements into smaller and greater subsets recursively.";
        quickSort(data, res.comparisons, res.maxCallStackDepth);
    } else if (algoKey == "heap") {
        res.algorithmName = "Heap Sort";
        res.algorithmKey = "heap";
        res.theoreticalTimeComplexity = "O(N log N)";
        res.theoreticalAuxSpace = "O(1)";
        res.strategyBranch = "Max-Heap Extraction";
        res.strategyDetails = "Builds an in-place max-heap and iteratively extracts the maximum root to the end.";
        heapSort(data, res.comparisons);
    } else if (algoKey == "adaptive") {
        res.algorithmName = "Adaptive Sort";
        res.algorithmKey = "adaptive";
        res.theoreticalTimeComplexity = "O(N) best / O(N log N) avg";
        adaptiveSort(data, res.comparisons, res.auxiliaryHeapBytes, res.maxCallStackDepth, res.strategyBranch, res.strategyDetails);
        if (res.strategyBranch.find("Insertion") != std::string::npos || res.strategyBranch == "Trivial") {
            res.theoreticalAuxSpace = "O(1)";
        } else {
            res.theoreticalAuxSpace = "O(log N)";
        }
    } else {
        res.algorithmName = "Unknown";
        res.algorithmKey = algoKey;
        res.theoreticalTimeComplexity = "N/A";
        res.theoreticalAuxSpace = "N/A";
        res.strategyBranch = "Error";
        res.strategyDetails = "Unknown algorithm requested.";
    }

    res.executionTimeUs = timer.stopTimerUs();
    res.executionTimeMs = res.executionTimeUs / 1000.0;
    res.peakWorkingSetBytes = getPeakWorkingSetMemory();
    res.isSorted = verifySorted(data);
    res.sortedData = data;

    return res;
}

// Print single benchmark result as JSON
void printResultJson(const BenchmarkResult& r, bool includeSortedData = true) {
    std::cout << "{"
              << "\"algorithmName\":\"" << escapeJson(r.algorithmName) << "\","
              << "\"algorithmKey\":\"" << escapeJson(r.algorithmKey) << "\","
              << "\"inputSize\":" << r.inputSize << ","
              << "\"comparisons\":" << r.comparisons << ","
              << std::fixed << std::setprecision(4)
              << "\"executionTimeUs\":" << r.executionTimeUs << ","
              << "\"executionTimeMs\":" << r.executionTimeMs << ","
              << "\"theoreticalTimeComplexity\":\"" << escapeJson(r.theoreticalTimeComplexity) << "\","
              << "\"theoreticalAuxSpace\":\"" << escapeJson(r.theoreticalAuxSpace) << "\","
              << "\"auxiliaryHeapBytes\":" << r.auxiliaryHeapBytes << ","
              << "\"inputDataBytes\":" << r.inputDataBytes << ","
              << "\"maxCallStackDepth\":" << r.maxCallStackDepth << ","
              << "\"peakWorkingSetBytes\":" << r.peakWorkingSetBytes << ","
              << "\"strategyBranch\":\"" << escapeJson(r.strategyBranch) << "\","
              << "\"strategyDetails\":\"" << escapeJson(r.strategyDetails) << "\","
              << "\"isSorted\":" << (r.isSorted ? "true" : "false");

    if (includeSortedData) {
        std::cout << ",\"sortedData\":[";
        for (size_t i = 0; i < r.sortedData.size(); ++i) {
            if (i > 0) std::cout << ",";
            std::cout << r.sortedData[i];
        }
        std::cout << "]";
    }
    std::cout << "}";
}

// ============================================================================
// Trace Event Structures for Pedagogical Visualizer
// ============================================================================
struct TraceStep {
    int stepIndex = 0;
    int pass = 0;
    std::string phase = "";
    std::string type = "";
    std::vector<int> array;
    std::string description = "";
    uint64_t comparisons = 0;

    // Insertion Sort specific
    int key = -1;
    int keyIndex = -1;
    int insertIndex = -1;
    int compareIndex = -1;
    int sortedPrefixEnd = -1;

    // Merge Sort specific
    int left = -1;
    int mid = -1;
    int right = -1;
    int depth = 0;
    std::vector<int> L;
    std::vector<int> R;
    int i = -1;
    int j = -1;
    int k = -1;
    std::vector<int> mergedResult;

    // Quick Sort specific
    int low = -1;
    int high = -1;
    int pivotIndex = -1;
    int pivotValue = -1000000000;
    int leftPointer = -1;
    int rightPointer = -1;
    int finalPivotIndex = -1;
    std::vector<int> fixedPivots;

    // Heap Sort specific
    int heapSize = -1;
    int rootIndex = -1;
    int leftChildIndex = -1;
    int rightChildIndex = -1;
    int largestIndex = -1;
    int swapIdx1 = -1;
    int swapIdx2 = -1;
    int sortedBoundary = -1;

    // Adaptive Sort specific
    std::string adaptiveDecision = "";
    std::string adaptiveReason = "";
    int adjacentInversions = -1;
    double inversionRatio = -1.0;
    std::string chosenAlgorithm = "";
};

// ============================================================================
// Traced Algorithms (Generating Real Step Events in C++)
// ============================================================================

// 1. Traced Insertion Sort
void traceInsertionSort(
    std::vector<int>& arr,
    std::vector<TraceStep>& trace,
    uint64_t& comparisons,
    int& stepNum
) {
    int n = static_cast<int>(arr.size());

    // Initial state: first element is sorted prefix
    TraceStep s0;
    s0.stepIndex = stepNum++;
    s0.pass = 0;
    s0.phase = "init";
    s0.type = "init";
    s0.array = arr;
    s0.sortedPrefixEnd = 0;
    s0.comparisons = comparisons;
    s0.description = "Initial state: Element arr[0] is trivially the sorted prefix. Unsorted portion spans indices [1.." + std::to_string(n - 1) + "].";
    trace.push_back(s0);

    for (int i = 1; i < n; ++i) {
        int key = arr[i];
        int keyOrigIdx = i;

        // Select key
        TraceStep sKey;
        sKey.stepIndex = stepNum++;
        sKey.pass = i;
        sKey.phase = "select_key";
        sKey.type = "select_key";
        sKey.array = arr;
        sKey.key = key;
        sKey.keyIndex = keyOrigIdx;
        sKey.sortedPrefixEnd = i - 1;
        sKey.comparisons = comparisons;
        std::ostringstream ss;
        ss << "Pass " << i << ": Pick key = " << key << " from unsorted portion at index " << i 
           << ". Current sorted prefix is indices [0.." << (i - 1) << "].";
        sKey.description = ss.str();
        trace.push_back(sKey);

        int j = i - 1;
        while (j >= 0) {
            comparisons++;

            TraceStep sComp;
            sComp.stepIndex = stepNum++;
            sComp.pass = i;
            sComp.phase = "compare";
            sComp.type = "compare";
            sComp.array = arr;
            sComp.key = key;
            sComp.keyIndex = keyOrigIdx;
            sComp.compareIndex = j;
            sComp.sortedPrefixEnd = i - 1;
            sComp.comparisons = comparisons;

            if (arr[j] > key) {
                std::ostringstream sc;
                sc << "Comparing key (" << key << ") with arr[" << j << "] (" << arr[j] << "). "
                   << "Since " << arr[j] << " > " << key << ", shift element right to index " << (j + 1) << ".";
                sComp.description = sc.str();
                trace.push_back(sComp);

                arr[j + 1] = arr[j];

                TraceStep sShift;
                sShift.stepIndex = stepNum++;
                sShift.pass = i;
                sShift.phase = "shift";
                sShift.type = "shift";
                sShift.array = arr;
                sShift.key = key;
                sShift.keyIndex = keyOrigIdx;
                sShift.insertIndex = j + 1;
                sShift.compareIndex = j;
                sShift.sortedPrefixEnd = i - 1;
                sShift.comparisons = comparisons;
                std::ostringstream ssf;
                ssf << "Shifted " << arr[j] << " into index " << (j + 1) << ". Looking left for key " << key << "'s insertion spot.";
                sShift.description = ssf.str();
                trace.push_back(sShift);

                j--;
            } else {
                std::ostringstream sc;
                sc << "Comparing key (" << key << ") with arr[" << j << "] (" << arr[j] << "). "
                   << "Since " << arr[j] << " <= " << key << ", correct position found at index " << (j + 1) << ".";
                sComp.description = sc.str();
                trace.push_back(sComp);
                break;
            }
        }

        arr[j + 1] = key;

        TraceStep sIns;
        sIns.stepIndex = stepNum++;
        sIns.pass = i;
        sIns.phase = "insert";
        sIns.type = "insert";
        sIns.array = arr;
        sIns.key = key;
        sIns.keyIndex = keyOrigIdx;
        sIns.insertIndex = j + 1;
        sIns.sortedPrefixEnd = i;
        sIns.comparisons = comparisons;
        std::ostringstream ssi;
        ssi << "Inserted key " << key << " into index " << (j + 1) 
            << ". Sorted prefix expanded to [0.." << i << "].";
        sIns.description = ssi.str();
        trace.push_back(sIns);
    }

    TraceStep sEnd;
    sEnd.stepIndex = stepNum++;
    sEnd.pass = n;
    sEnd.phase = "sorted";
    sEnd.type = "sorted";
    sEnd.array = arr;
    sEnd.sortedPrefixEnd = n - 1;
    sEnd.comparisons = comparisons;
    sEnd.description = "Insertion Sort complete. All elements are in verified non-decreasing sorted order.";
    trace.push_back(sEnd);
}

// 2. Traced Merge Sort
void traceMerge(
    std::vector<int>& arr,
    int left,
    int mid,
    int right,
    int depth,
    int& stepNum,
    std::vector<TraceStep>& trace,
    uint64_t& comparisons
) {
    int n1 = mid - left + 1;
    int n2 = right - mid;

    std::vector<int> L(n1);
    std::vector<int> R(n2);
    for (int idx = 0; idx < n1; ++idx) L[idx] = arr[left + idx];
    for (int idx = 0; idx < n2; ++idx) R[idx] = arr[mid + 1 + idx];

    TraceStep ms;
    ms.stepIndex = stepNum++;
    ms.phase = "merge_start";
    ms.type = "merge_start";
    ms.array = arr;
    ms.left = left;
    ms.mid = mid;
    ms.right = right;
    ms.depth = depth;
    ms.L = L;
    ms.R = R;
    ms.comparisons = comparisons;
    std::ostringstream ss;
    ss << "Merge Procedure: Merging Left sub-array [";
    for (size_t x = 0; x < L.size(); ++x) ss << (x > 0 ? ", " : "") << L[x];
    ss << "] and Right sub-array [";
    for (size_t x = 0; x < R.size(); ++x) ss << (x > 0 ? ", " : "") << R[x];
    ss << "] into arr[" << left << ".." << right << "].";
    ms.description = ss.str();
    trace.push_back(ms);

    int i = 0, j = 0, k = left;
    while (i < n1 && j < n2) {
        comparisons++;

        TraceStep mc;
        mc.stepIndex = stepNum++;
        mc.phase = "merge_compare";
        mc.type = "merge_compare";
        mc.array = arr;
        mc.left = left;
        mc.mid = mid;
        mc.right = right;
        mc.depth = depth;
        mc.L = L;
        mc.R = R;
        mc.i = i;
        mc.j = j;
        mc.k = k;
        mc.comparisons = comparisons;

        std::ostringstream sc;
        sc << "Comparing L[" << i << "] (" << L[i] << ") with R[" << j << "] (" << R[j] << "). ";
        if (L[i] <= R[j]) {
            sc << "Since " << L[i] << " <= " << R[j] << ", placing L[" << i << "] into arr[" << k << "].";
            mc.description = sc.str();
            trace.push_back(mc);

            arr[k++] = L[i++];
        } else {
            sc << "Since " << R[j] << " < " << L[i] << ", placing R[" << j << "] into arr[" << k << "].";
            mc.description = sc.str();
            trace.push_back(mc);

            arr[k++] = R[j++];
        }

        TraceStep mp;
        mp.stepIndex = stepNum++;
        mp.phase = "merge_place";
        mp.type = "merge_place";
        mp.array = arr;
        mp.left = left;
        mp.mid = mid;
        mp.right = right;
        mp.depth = depth;
        mp.L = L;
        mp.R = R;
        mp.i = i;
        mp.j = j;
        mp.k = k - 1;
        mp.comparisons = comparisons;
        std::ostringstream sp;
        sp << "Updated arr[" << (k - 1) << "] = " << arr[k - 1] << ".";
        mp.description = sp.str();
        trace.push_back(mp);
    }

    while (i < n1) {
        arr[k] = L[i];
        TraceStep rem;
        rem.stepIndex = stepNum++;
        rem.phase = "merge_remaining";
        rem.type = "merge_remaining";
        rem.array = arr;
        rem.left = left;
        rem.mid = mid;
        rem.right = right;
        rem.depth = depth;
        rem.L = L;
        rem.R = R;
        rem.i = i;
        rem.j = j;
        rem.k = k;
        rem.comparisons = comparisons;
        std::ostringstream sr;
        sr << "Right sub-array exhausted. Copying remaining L[" << i << "] (" << L[i] << ") into arr[" << k << "].";
        rem.description = sr.str();
        trace.push_back(rem);
        i++;
        k++;
    }

    while (j < n2) {
        arr[k] = R[j];
        TraceStep rem;
        rem.stepIndex = stepNum++;
        rem.phase = "merge_remaining";
        rem.type = "merge_remaining";
        rem.array = arr;
        rem.left = left;
        rem.mid = mid;
        rem.right = right;
        rem.depth = depth;
        rem.L = L;
        rem.R = R;
        rem.i = i;
        rem.j = j;
        rem.k = k;
        rem.comparisons = comparisons;
        std::ostringstream sr;
        sr << "Left sub-array exhausted. Copying remaining R[" << j << "] (" << R[j] << ") into arr[" << k << "].";
        rem.description = sr.str();
        trace.push_back(rem);
        j++;
        k++;
    }

    TraceStep mDone;
    mDone.stepIndex = stepNum++;
    mDone.phase = "merged_result";
    mDone.type = "merged_result";
    mDone.array = arr;
    mDone.left = left;
    mDone.mid = mid;
    mDone.right = right;
    mDone.depth = depth;
    mDone.L = L;
    mDone.R = R;
    mDone.comparisons = comparisons;
    std::vector<int> resSlice;
    for (int idx = left; idx <= right; ++idx) resSlice.push_back(arr[idx]);
    mDone.mergedResult = resSlice;
    std::ostringstream sd;
    sd << "Merged Result: Subarray range [" << left << ".." << right << "] is now fully sorted: [";
    for (size_t idx = 0; idx < resSlice.size(); ++idx) {
        sd << (idx > 0 ? ", " : "") << resSlice[idx];
    }
    sd << "].";
    mDone.description = sd.str();
    trace.push_back(mDone);
}

void traceMergeSortInternal(
    std::vector<int>& arr,
    int left,
    int right,
    int depth,
    int& stepNum,
    std::vector<TraceStep>& trace,
    uint64_t& comparisons
) {
    if (left < right) {
        int mid = left + (right - left) / 2;

        TraceStep sp;
        sp.stepIndex = stepNum++;
        sp.phase = "split";
        sp.type = "split";
        sp.array = arr;
        sp.left = left;
        sp.mid = mid;
        sp.right = right;
        sp.depth = depth;
        sp.comparisons = comparisons;
        std::ostringstream ss;
        ss << "Recursive Split (Depth " << depth << "): Dividing range [" << left << ".." << right 
           << "] into Left [" << left << ".." << mid << "] and Right [" << (mid + 1) << ".." << right << "].";
        sp.description = ss.str();
        trace.push_back(sp);

        traceMergeSortInternal(arr, left, mid, depth + 1, stepNum, trace, comparisons);
        traceMergeSortInternal(arr, mid + 1, right, depth + 1, stepNum, trace, comparisons);
        traceMerge(arr, left, mid, right, depth, stepNum, trace, comparisons);
    } else if (left == right) {
        TraceStep se;
        se.stepIndex = stepNum++;
        se.phase = "single_element";
        se.type = "single_element";
        se.array = arr;
        se.left = left;
        se.mid = left;
        se.right = right;
        se.depth = depth;
        se.comparisons = comparisons;
        std::ostringstream ss;
        ss << "Base Case (Depth " << depth << "): Subarray range [" << left << ".." << left 
           << "] has only 1 element (" << arr[left] << "). Single-element arrays are trivially sorted!";
        se.description = ss.str();
        trace.push_back(se);
    }
}

// 3. Traced Quick Sort (Teaching style following class slide partition)
void traceQuickSortInternal(
    std::vector<int>& arr,
    int low,
    int high,
    int& stepNum,
    int pass,
    std::vector<TraceStep>& trace,
    uint64_t& comparisons,
    std::vector<int>& fixedPivots
) {
    if (low < high) {
        int orig_low = low;
        int orig_high = high;
        int pivotVal = arr[orig_low];
        int pos_pivot = orig_low;

        TraceStep sp;
        sp.stepIndex = stepNum++;
        sp.pass = pass;
        sp.phase = "select_pivot";
        sp.type = "select_pivot";
        sp.array = arr;
        sp.low = orig_low;
        sp.high = orig_high;
        sp.pivotIndex = pos_pivot;
        sp.pivotValue = pivotVal;
        sp.leftPointer = orig_low;
        sp.rightPointer = orig_high;
        sp.fixedPivots = fixedPivots;
        sp.comparisons = comparisons;
        std::ostringstream ss;
        ss << "Pass " << pass << ": Partitioning subarray [" << orig_low << ".." << orig_high 
           << "]. Selected arr[" << pos_pivot << "] = " << pivotVal << " as pivot.";
        sp.description = ss.str();
        trace.push_back(sp);

        int l = orig_low;
        int r = orig_high;

        while (l < r) {
            // Scan right pointer r leftwards while arr[r] >= pivotVal and l < r
            while (r > l) {
                comparisons++;
                TraceStep scR;
                scR.stepIndex = stepNum++;
                scR.pass = pass;
                scR.phase = "scan_right";
                scR.type = "compare";
                scR.array = arr;
                scR.low = orig_low;
                scR.high = orig_high;
                scR.pivotIndex = pos_pivot;
                scR.pivotValue = pivotVal;
                scR.leftPointer = l;
                scR.rightPointer = r;
                scR.fixedPivots = fixedPivots;
                scR.comparisons = comparisons;

                if (arr[r] >= pivotVal) {
                    std::ostringstream ssR;
                    ssR << "Scanning right pointer (j=" << r << "): arr[" << r << "] (" << arr[r]
                        << ") >= pivot (" << pivotVal << "). Element is >= pivot; moving pointer j left.";
                    scR.description = ssR.str();
                    trace.push_back(scR);
                    r--;
                } else {
                    std::ostringstream ssR;
                    ssR << "Right pointer stopped at j=" << r << ": arr[" << r << "] (" << arr[r]
                        << ") < pivot (" << pivotVal << "). Element belongs in left partition.";
                    scR.description = ssR.str();
                    trace.push_back(scR);
                    break;
                }
            }

            // Scan left pointer l rightwards while arr[l] <= pivotVal and l < r
            while (l < r) {
                comparisons++;
                TraceStep scL;
                scL.stepIndex = stepNum++;
                scL.pass = pass;
                scL.phase = "scan_left";
                scL.type = "compare";
                scL.array = arr;
                scL.low = orig_low;
                scL.high = orig_high;
                scL.pivotIndex = pos_pivot;
                scL.pivotValue = pivotVal;
                scL.leftPointer = l;
                scL.rightPointer = r;
                scL.fixedPivots = fixedPivots;
                scL.comparisons = comparisons;

                if (arr[l] <= pivotVal) {
                    std::ostringstream ssL;
                    ssL << "Scanning left pointer (i=" << l << "): arr[" << l << "] (" << arr[l]
                        << ") <= pivot (" << pivotVal << "). Element is <= pivot; moving pointer i right.";
                    scL.description = ssL.str();
                    trace.push_back(scL);
                    l++;
                } else {
                    std::ostringstream ssL;
                    ssL << "Left pointer stopped at i=" << l << ": arr[" << l << "] (" << arr[l]
                        << ") > pivot (" << pivotVal << "). Element belongs in right partition.";
                    scL.description = ssL.str();
                    trace.push_back(scL);
                    break;
                }
            }

            if (l < r) {
                TraceStep sSwap;
                sSwap.stepIndex = stepNum++;
                sSwap.pass = pass;
                sSwap.phase = "swap";
                sSwap.type = "swap_elements";
                sSwap.low = orig_low;
                sSwap.high = orig_high;
                sSwap.pivotIndex = pos_pivot;
                sSwap.pivotValue = pivotVal;
                sSwap.leftPointer = l;
                sSwap.rightPointer = r;
                sSwap.swapIdx1 = l;
                sSwap.swapIdx2 = r;
                sSwap.fixedPivots = fixedPivots;
                sSwap.comparisons = comparisons;
                std::ostringstream ssS;
                ssS << "Swapping out-of-place elements: arr[" << l << "] (" << arr[l] 
                    << ") and arr[" << r << "] (" << arr[r] << ").";
                sSwap.description = ssS.str();

                std::swap(arr[l], arr[r]);
                sSwap.array = arr;
                trace.push_back(sSwap);
            }
        }

        int finalPivotPos = r;
        if (pos_pivot != finalPivotPos) {
            TraceStep sPivSwap;
            sPivSwap.stepIndex = stepNum++;
            sPivSwap.pass = pass;
            sPivSwap.phase = "pivot_place";
            sPivSwap.type = "swap_pivot";
            sPivSwap.low = orig_low;
            sPivSwap.high = orig_high;
            sPivSwap.pivotIndex = pos_pivot;
            sPivSwap.pivotValue = pivotVal;
            sPivSwap.finalPivotIndex = finalPivotPos;
            sPivSwap.swapIdx1 = pos_pivot;
            sPivSwap.swapIdx2 = finalPivotPos;
            sPivSwap.fixedPivots = fixedPivots;
            sPivSwap.comparisons = comparisons;
            std::ostringstream ssp;
            ssp << "Pointers crossed at index " << finalPivotPos 
                << ". Swapping pivot (" << pivotVal << ") from arr[" << pos_pivot << "] into final position arr[" << finalPivotPos << "].";
            sPivSwap.description = ssp.str();

            std::swap(arr[pos_pivot], arr[finalPivotPos]);
            sPivSwap.array = arr;
            trace.push_back(sPivSwap);
        }

        fixedPivots.push_back(finalPivotPos);

        TraceStep sPivLocked;
        sPivLocked.stepIndex = stepNum++;
        sPivLocked.pass = pass;
        sPivLocked.phase = "pivot_locked";
        sPivLocked.type = "pivot_placed";
        sPivLocked.array = arr;
        sPivLocked.low = orig_low;
        sPivLocked.high = orig_high;
        sPivLocked.pivotIndex = finalPivotPos;
        sPivLocked.pivotValue = pivotVal;
        sPivLocked.finalPivotIndex = finalPivotPos;
        sPivLocked.fixedPivots = fixedPivots;
        sPivLocked.comparisons = comparisons;
        std::ostringstream ssl;
        ssl << "Pivot " << pivotVal << " is now permanently LOCKED at final sorted index " << finalPivotPos
            << "! Subarray [" << orig_low << ".." << (finalPivotPos - 1) << "] is <= " << pivotVal
            << ", and [" << (finalPivotPos + 1) << ".." << orig_high << "] is >= " << pivotVal << ".";
        sPivLocked.description = ssl.str();
        trace.push_back(sPivLocked);

        traceQuickSortInternal(arr, orig_low, finalPivotPos - 1, stepNum, pass + 1, trace, comparisons, fixedPivots);
        traceQuickSortInternal(arr, finalPivotPos + 1, orig_high, stepNum, pass + 1, trace, comparisons, fixedPivots);
    } else if (low == high) {
        fixedPivots.push_back(low);
        TraceStep se;
        se.stepIndex = stepNum++;
        se.pass = pass;
        se.phase = "single_element";
        se.type = "pivot_placed";
        se.array = arr;
        se.low = low;
        se.high = high;
        se.finalPivotIndex = low;
        se.fixedPivots = fixedPivots;
        se.comparisons = comparisons;
        std::ostringstream ss;
        ss << "Single-element range [" << low << ".." << low << "] with value " << arr[low] 
           << " is trivially in its final sorted position.";
        se.description = ss.str();
        trace.push_back(se);
    }
}

// 4. Traced Heap Sort
void traceHeapify(
    std::vector<int>& arr,
    int heapSize,
    int i,
    int& stepNum,
    std::vector<TraceStep>& trace,
    uint64_t& comparisons,
    int sortedBoundary
) {
    int largest = i;
    int left = 2 * i + 1;
    int right = 2 * i + 2;

    TraceStep sInsp;
    sInsp.stepIndex = stepNum++;
    sInsp.phase = "heapify";
    sInsp.type = "heapify_inspect";
    sInsp.array = arr;
    sInsp.heapSize = heapSize;
    sInsp.rootIndex = i;
    sInsp.leftChildIndex = (left < heapSize ? left : -1);
    sInsp.rightChildIndex = (right < heapSize ? right : -1);
    sInsp.largestIndex = largest;
    sInsp.sortedBoundary = sortedBoundary;
    sInsp.comparisons = comparisons;
    std::ostringstream ss;
    ss << "Heapify inspecting node at index " << i << " (value " << arr[i] << "). Active max-heap size = " << heapSize << ".";
    sInsp.description = ss.str();
    trace.push_back(sInsp);

    if (left < heapSize) {
        comparisons++;
        TraceStep sCompL;
        sCompL.stepIndex = stepNum++;
        sCompL.phase = "heapify";
        sCompL.type = "heapify_compare";
        sCompL.array = arr;
        sCompL.heapSize = heapSize;
        sCompL.rootIndex = i;
        sCompL.leftChildIndex = left;
        sCompL.rightChildIndex = (right < heapSize ? right : -1);
        sCompL.sortedBoundary = sortedBoundary;
        sCompL.comparisons = comparisons;
        std::ostringstream sl;
        sl << "Comparing parent arr[" << largest << "] (" << arr[largest] 
           << ") with left child arr[" << left << "] (" << arr[left] << ").";
        if (arr[left] > arr[largest]) {
            sl << " Left child is larger (" << arr[left] << " > " << arr[largest] << ").";
            largest = left;
        } else {
            sl << " Parent is larger or equal.";
        }
        sCompL.largestIndex = largest;
        sCompL.description = sl.str();
        trace.push_back(sCompL);
    }

    if (right < heapSize) {
        comparisons++;
        TraceStep sCompR;
        sCompR.stepIndex = stepNum++;
        sCompR.phase = "heapify";
        sCompR.type = "heapify_compare";
        sCompR.array = arr;
        sCompR.heapSize = heapSize;
        sCompR.rootIndex = i;
        sCompR.leftChildIndex = (left < heapSize ? left : -1);
        sCompR.rightChildIndex = right;
        sCompR.sortedBoundary = sortedBoundary;
        sCompR.comparisons = comparisons;
        std::ostringstream sr;
        sr << "Comparing current largest arr[" << largest << "] (" << arr[largest] 
           << ") with right child arr[" << right << "] (" << arr[right] << ").";
        if (arr[right] > arr[largest]) {
            sr << " Right child is larger (" << arr[right] << " > " << arr[largest] << ").";
            largest = right;
        } else {
            sr << " Current largest remains unchanged.";
        }
        sCompR.largestIndex = largest;
        sCompR.description = sr.str();
        trace.push_back(sCompR);
    }

    if (largest != i) {
        TraceStep sSwap;
        sSwap.stepIndex = stepNum++;
        sSwap.phase = "heapify";
        sSwap.type = "heapify_swap";
        sSwap.heapSize = heapSize;
        sSwap.rootIndex = i;
        sSwap.largestIndex = largest;
        sSwap.swapIdx1 = i;
        sSwap.swapIdx2 = largest;
        sSwap.sortedBoundary = sortedBoundary;
        sSwap.comparisons = comparisons;
        std::ostringstream sw;
        sw << "Max-Heap Violation: Parent arr[" << i << "] (" << arr[i] 
           << ") < child arr[" << largest << "] (" << arr[largest] 
           << "). Swapping them to restore Max-Heap property.";
        sSwap.description = sw.str();

        std::swap(arr[i], arr[largest]);
        sSwap.array = arr;
        trace.push_back(sSwap);

        traceHeapify(arr, heapSize, largest, stepNum, trace, comparisons, sortedBoundary);
    } else {
        TraceStep sOk;
        sOk.stepIndex = stepNum++;
        sOk.phase = "heapify";
        sOk.type = "heapify_done";
        sOk.array = arr;
        sOk.heapSize = heapSize;
        sOk.rootIndex = i;
        sOk.largestIndex = largest;
        sOk.sortedBoundary = sortedBoundary;
        sOk.comparisons = comparisons;
        std::ostringstream sok;
        sok << "Node arr[" << i << "] (" << arr[i] << ") satisfies Max-Heap property (>= all children).";
        sOk.description = sok.str();
        trace.push_back(sOk);
    }
}

void traceHeapSort(std::vector<int> arr, std::vector<TraceStep>& trace, uint64_t& comparisons) {
    int n = static_cast<int>(arr.size());
    int stepNum = 0;

    TraceStep s0;
    s0.stepIndex = stepNum++;
    s0.phase = "init";
    s0.type = "init";
    s0.array = arr;
    s0.heapSize = n;
    s0.sortedBoundary = n;
    s0.comparisons = comparisons;
    s0.description = "Heap Sort: Phase 1 begins. Constructing a Max-Heap from the input array in bottom-up order.";
    trace.push_back(s0);

    for (int i = n / 2 - 1; i >= 0; --i) {
        traceHeapify(arr, n, i, stepNum, trace, comparisons, n);
    }

    TraceStep sBuilt;
    sBuilt.stepIndex = stepNum++;
    sBuilt.phase = "heap_built";
    sBuilt.type = "heap_built";
    sBuilt.array = arr;
    sBuilt.heapSize = n;
    sBuilt.rootIndex = 0;
    sBuilt.sortedBoundary = n;
    sBuilt.comparisons = comparisons;
    std::ostringstream sb;
    sb << "Phase 1 Complete: Valid Max-Heap successfully constructed! Root at index 0 holds the maximum element ("
       << arr[0] << "). Now starting Phase 2: Extraction.";
    sBuilt.description = sb.str();
    trace.push_back(sBuilt);

    for (int i = n - 1; i > 0; --i) {
        TraceStep sExt;
        sExt.stepIndex = stepNum++;
        sExt.pass = n - i;
        sExt.phase = "extraction";
        sExt.type = "extract_max";
        sExt.heapSize = i + 1;
        sExt.swapIdx1 = 0;
        sExt.swapIdx2 = i;
        sExt.sortedBoundary = i + 1;
        sExt.comparisons = comparisons;
        std::ostringstream se;
        se << "Extraction Pass " << (n - i) << ": Swapping max root arr[0] (" << arr[0] 
           << ") with last heap element arr[" << i << "] (" << arr[i] << ").";
        sExt.description = se.str();

        std::swap(arr[0], arr[i]);
        sExt.array = arr;
        trace.push_back(sExt);

        TraceStep sPlaced;
        sPlaced.stepIndex = stepNum++;
        sPlaced.pass = n - i;
        sPlaced.phase = "extraction";
        sPlaced.type = "element_sorted";
        sPlaced.array = arr;
        sPlaced.heapSize = i;
        sPlaced.sortedBoundary = i;
        sPlaced.comparisons = comparisons;
        std::ostringstream sp;
        sp << "Element " << arr[i] << " is now permanently sorted at index " << i 
           << "! Active heap size reduces to " << i << ". Heapifying new root arr[0] (" << arr[0] << ")...";
        sPlaced.description = sp.str();
        trace.push_back(sPlaced);

        traceHeapify(arr, i, 0, stepNum, trace, comparisons, i);
    }

    TraceStep sEnd;
    sEnd.stepIndex = stepNum++;
    sEnd.pass = n;
    sEnd.phase = "sorted";
    sEnd.type = "sorted";
    sEnd.array = arr;
    sEnd.heapSize = 0;
    sEnd.sortedBoundary = 0;
    sEnd.comparisons = comparisons;
    sEnd.description = "Heap Sort complete! All elements have been extracted in ascending order.";
    trace.push_back(sEnd);
}

// 5. Traced Adaptive Sort
void traceAdaptiveSort(
    std::vector<int> arr,
    std::vector<TraceStep>& trace,
    uint64_t& comparisons,
    std::string& strategyBranch,
    std::string& strategyDetails
) {
    int n = static_cast<int>(arr.size());
    int stepNum = 0;

    const int SMALL_THRESHOLD = 24;
    const double NEARLY_SORTED_THRESHOLD = 0.05;

    TraceStep s0;
    s0.stepIndex = stepNum++;
    s0.phase = "adaptive_eval";
    s0.type = "adaptive_check_size";
    s0.array = arr;
    s0.comparisons = comparisons;
    std::ostringstream ss0;
    ss0 << "Adaptive Sort Decision Engine: Evaluating array with N = " << n 
        << " elements. First testing Small Array Threshold (N <= " << SMALL_THRESHOLD << ").";
    s0.description = ss0.str();
    trace.push_back(s0);

    if (n <= 1) {
        strategyBranch = "Trivial";
        strategyDetails = "Array has 0 or 1 element; already sorted.";
        TraceStep sTriv;
        sTriv.stepIndex = stepNum++;
        sTriv.phase = "adaptive_decision";
        sTriv.type = "sorted";
        sTriv.array = arr;
        sTriv.description = "Array has 0 or 1 element and is already trivially sorted.";
        trace.push_back(sTriv);
        return;
    }

    if (n <= SMALL_THRESHOLD) {
        strategyBranch = "Insertion Sort (Small Size)";
        std::ostringstream sDet;
        sDet << "Selected Insertion Sort: input size N=" << n 
             << " is within small-array threshold (N <= " << SMALL_THRESHOLD 
             << "), minimizing recursion and pivot overhead.";
        strategyDetails = sDet.str();

        TraceStep sDec;
        sDec.stepIndex = stepNum++;
        sDec.phase = "adaptive_decision";
        sDec.type = "adaptive_decision";
        sDec.array = arr;
        sDec.adaptiveDecision = "Insertion Sort (Small Size)";
        sDec.adaptiveReason = strategyDetails;
        sDec.chosenAlgorithm = "insertion";
        sDec.comparisons = comparisons;
        std::ostringstream ssd;
        ssd << "Decision Made: Selected Insertion Sort! Array size N=" << n << " <= " << SMALL_THRESHOLD
            << ". Small slices run fastest with Insertion Sort due to near-zero setup overhead and optimal cache locality.";
        sDec.description = ssd.str();
        trace.push_back(sDec);

        traceInsertionSort(arr, trace, comparisons, stepNum);
        return;
    }

    TraceStep sScanStart;
    sScanStart.stepIndex = stepNum++;
    sScanStart.phase = "adaptive_eval";
    sScanStart.type = "adaptive_scan_start";
    sScanStart.array = arr;
    sScanStart.comparisons = comparisons;
    std::ostringstream sss;
    sss << "Array size N=" << n << " > " << SMALL_THRESHOLD 
        << ". Performing O(N) disorder scan to measure adjacent inversions (arr[i] > arr[i+1]).";
    sScanStart.description = sss.str();
    trace.push_back(sScanStart);

    int adjacentInversions = 0;
    for (int i = 0; i < n - 1; ++i) {
        comparisons++;
        if (arr[i] > arr[i + 1]) {
            adjacentInversions++;
        }
    }

    double inversionRatio = static_cast<double>(adjacentInversions) / static_cast<double>(n - 1);
    double inversionPct = inversionRatio * 100.0;

    TraceStep sScanEnd;
    sScanEnd.stepIndex = stepNum++;
    sScanEnd.phase = "adaptive_eval";
    sScanEnd.type = "adaptive_scan_summary";
    sScanEnd.array = arr;
    sScanEnd.adjacentInversions = adjacentInversions;
    sScanEnd.inversionRatio = inversionPct;
    sScanEnd.comparisons = comparisons;
    std::ostringstream ssse;
    ssse << std::fixed << std::setprecision(2);
    ssse << "Disorder scan complete: Found " << adjacentInversions << " adjacent inversion(s) ("
         << inversionPct << "% disorder). Nearly-Sorted threshold is " << (NEARLY_SORTED_THRESHOLD * 100.0) << "%.";
    sScanEnd.description = ssse.str();
    trace.push_back(sScanEnd);

    if (inversionRatio <= NEARLY_SORTED_THRESHOLD) {
        strategyBranch = "Insertion Sort (Nearly Sorted)";
        std::ostringstream sDet;
        sDet << std::fixed << std::setprecision(2);
        sDet << "Selected Insertion Sort: array is nearly sorted with " << adjacentInversions
             << " inversion(s) (" << inversionPct << "% <= " << (NEARLY_SORTED_THRESHOLD * 100.0) 
             << "% threshold). Insertion Sort runs in adaptive near O(N) linear time.";
        strategyDetails = sDet.str();

        TraceStep sDec;
        sDec.stepIndex = stepNum++;
        sDec.phase = "adaptive_decision";
        sDec.type = "adaptive_decision";
        sDec.array = arr;
        sDec.adaptiveDecision = "Insertion Sort (Nearly Sorted)";
        sDec.adaptiveReason = strategyDetails;
        sDec.adjacentInversions = adjacentInversions;
        sDec.inversionRatio = inversionPct;
        sDec.chosenAlgorithm = "insertion";
        sDec.comparisons = comparisons;
        std::ostringstream ssd;
        ssd << "Decision Made: Selected Insertion Sort! Array is nearly sorted (" << inversionPct 
            << "% <= 5%). On nearly-sorted data, Insertion Sort takes O(N + d) time where d is minimal.";
        sDec.description = ssd.str();
        trace.push_back(sDec);

        traceInsertionSort(arr, trace, comparisons, stepNum);
    } else {
        strategyBranch = "Quick Sort (General / Disordered)";
        std::ostringstream sDet;
        sDet << std::fixed << std::setprecision(2);
        sDet << "Selected Quick Sort: array size N=" << n << " with high disorder ("
             << adjacentInversions << " inversions, " << inversionPct << "% > " 
             << (NEARLY_SORTED_THRESHOLD * 100.0) 
             << "% threshold). Quick Sort provides optimal O(N log N) partitioning.";
        strategyDetails = sDet.str();

        TraceStep sDec;
        sDec.stepIndex = stepNum++;
        sDec.phase = "adaptive_decision";
        sDec.type = "adaptive_decision";
        sDec.array = arr;
        sDec.adaptiveDecision = "Quick Sort (General / Disordered)";
        sDec.adaptiveReason = strategyDetails;
        sDec.adjacentInversions = adjacentInversions;
        sDec.inversionRatio = inversionPct;
        sDec.chosenAlgorithm = "quick";
        sDec.comparisons = comparisons;
        std::ostringstream ssd;
        ssd << "Decision Made: Selected Quick Sort! Array has high disorder (" << inversionPct 
            << "% > 5%). Quick Sort guarantees optimal O(N log N) average divide-and-conquer performance.";
        sDec.description = ssd.str();
        trace.push_back(sDec);

        std::vector<int> fixedPivots;
        traceQuickSortInternal(arr, 0, n - 1, stepNum, 1, trace, comparisons, fixedPivots);
    }
}

// Print full trace result as JSON
void printTraceJson(
    const std::string& algoKey,
    const std::string& algoName,
    const std::vector<int>& originalInput,
    const std::vector<TraceStep>& steps,
    const std::vector<int>& finalSorted,
    uint64_t totalComparisons,
    double executionTimeUs,
    const std::string& strategyBranch,
    const std::string& strategyDetails
) {
    std::cout << "{\"success\":true,\"mode\":\"trace\",\"algorithmKey\":\"" << escapeJson(algoKey)
              << "\",\"algorithmName\":\"" << escapeJson(algoName)
              << "\",\"inputSize\":" << originalInput.size()
              << ",\"comparisons\":" << totalComparisons
              << std::fixed << std::setprecision(4)
              << ",\"executionTimeUs\":" << executionTimeUs
              << ",\"executionTimeMs\":" << (executionTimeUs / 1000.0)
              << ",\"strategyBranch\":\"" << escapeJson(strategyBranch) << "\""
              << ",\"strategyDetails\":\"" << escapeJson(strategyDetails) << "\""
              << ",\"isSorted\":" << (verifySorted(finalSorted) ? "true" : "false")
              << ",\"totalSteps\":" << steps.size()
              << ",\"steps\":[";
    for (size_t s = 0; s < steps.size(); ++s) {
        if (s > 0) std::cout << ",";
        const TraceStep& st = steps[s];
        std::cout << "{"
                  << "\"stepIndex\":" << st.stepIndex << ","
                  << "\"pass\":" << st.pass << ","
                  << "\"phase\":\"" << escapeJson(st.phase) << "\","
                  << "\"type\":\"" << escapeJson(st.type) << "\","
                  << "\"description\":\"" << escapeJson(st.description) << "\","
                  << "\"comparisons\":" << st.comparisons << ","
                  << "\"array\":[";
        for (size_t a = 0; a < st.array.size(); ++a) {
            if (a > 0) std::cout << ",";
            std::cout << st.array[a];
        }
        std::cout << "]";

        // Insertion sort fields
        if (st.key != -1) std::cout << ",\"key\":" << st.key;
        if (st.keyIndex != -1) std::cout << ",\"keyIndex\":" << st.keyIndex;
        if (st.insertIndex != -1) std::cout << ",\"insertIndex\":" << st.insertIndex;
        if (st.compareIndex != -1) std::cout << ",\"compareIndex\":" << st.compareIndex;
        if (st.sortedPrefixEnd != -1) std::cout << ",\"sortedPrefixEnd\":" << st.sortedPrefixEnd;

        // Merge sort fields
        if (st.left != -1) std::cout << ",\"left\":" << st.left;
        if (st.mid != -1) std::cout << ",\"mid\":" << st.mid;
        if (st.right != -1) std::cout << ",\"right\":" << st.right;
        if (st.depth != 0) std::cout << ",\"depth\":" << st.depth;
        if (!st.L.empty()) {
            std::cout << ",\"L\":[";
            for (size_t x = 0; x < st.L.size(); ++x) {
                if (x > 0) std::cout << ",";
                std::cout << st.L[x];
            }
            std::cout << "]";
        }
        if (!st.R.empty()) {
            std::cout << ",\"R\":[";
            for (size_t x = 0; x < st.R.size(); ++x) {
                if (x > 0) std::cout << ",";
                std::cout << st.R[x];
            }
            std::cout << "]";
        }
        if (st.i != -1) std::cout << ",\"i\":" << st.i;
        if (st.j != -1) std::cout << ",\"j\":" << st.j;
        if (st.k != -1) std::cout << ",\"k\":" << st.k;
        if (!st.mergedResult.empty()) {
            std::cout << ",\"mergedResult\":[";
            for (size_t x = 0; x < st.mergedResult.size(); ++x) {
                if (x > 0) std::cout << ",";
                std::cout << st.mergedResult[x];
            }
            std::cout << "]";
        }

        // Quick sort fields
        if (st.low != -1) std::cout << ",\"low\":" << st.low;
        if (st.high != -1) std::cout << ",\"high\":" << st.high;
        if (st.pivotIndex != -1) std::cout << ",\"pivotIndex\":" << st.pivotIndex;
        if (st.pivotValue != -1000000000) std::cout << ",\"pivotValue\":" << st.pivotValue;
        if (st.leftPointer != -1) std::cout << ",\"leftPointer\":" << st.leftPointer;
        if (st.rightPointer != -1) std::cout << ",\"rightPointer\":" << st.rightPointer;
        if (st.finalPivotIndex != -1) std::cout << ",\"finalPivotIndex\":" << st.finalPivotIndex;
        if (!st.fixedPivots.empty()) {
            std::cout << ",\"fixedPivots\":[";
            for (size_t x = 0; x < st.fixedPivots.size(); ++x) {
                if (x > 0) std::cout << ",";
                std::cout << st.fixedPivots[x];
            }
            std::cout << "]";
        }

        // Heap sort fields
        if (st.heapSize != -1) std::cout << ",\"heapSize\":" << st.heapSize;
        if (st.rootIndex != -1) std::cout << ",\"rootIndex\":" << st.rootIndex;
        if (st.leftChildIndex != -1) std::cout << ",\"leftChildIndex\":" << st.leftChildIndex;
        if (st.rightChildIndex != -1) std::cout << ",\"rightChildIndex\":" << st.rightChildIndex;
        if (st.largestIndex != -1) std::cout << ",\"largestIndex\":" << st.largestIndex;
        if (st.swapIdx1 != -1) std::cout << ",\"swapIdx1\":" << st.swapIdx1;
        if (st.swapIdx2 != -1) std::cout << ",\"swapIdx2\":" << st.swapIdx2;
        if (st.sortedBoundary != -1) std::cout << ",\"sortedBoundary\":" << st.sortedBoundary;

        // Adaptive sort fields
        if (!st.adaptiveDecision.empty()) std::cout << ",\"adaptiveDecision\":\"" << escapeJson(st.adaptiveDecision) << "\"";
        if (!st.adaptiveReason.empty()) std::cout << ",\"adaptiveReason\":\"" << escapeJson(st.adaptiveReason) << "\"";
        if (st.adjacentInversions != -1) std::cout << ",\"adjacentInversions\":" << st.adjacentInversions;
        if (st.inversionRatio >= 0.0) std::cout << ",\"inversionRatio\":" << st.inversionRatio;
        if (!st.chosenAlgorithm.empty()) std::cout << ",\"chosenAlgorithm\":\"" << escapeJson(st.chosenAlgorithm) << "\"";

        std::cout << "}";
    }
    std::cout << "],\"sortedData\":[";
    for (size_t i = 0; i < finalSorted.size(); ++i) {
        if (i > 0) std::cout << ",";
        std::cout << finalSorted[i];
    }
    std::cout << "]}";
}

void runTrace(const std::string& algoKey, std::vector<int> data) {
    std::vector<TraceStep> trace;
    uint64_t comparisons = 0;
    std::string algoName = "";
    std::string strategyBranch = "";
    std::string strategyDetails = "";

    PrecisionTimer timer;
    timer.startTimer();

    std::vector<int> workData = data;

    if (algoKey == "insertion") {
        algoName = "Insertion Sort";
        strategyBranch = "In-Place Insertion";
        strategyDetails = "Iteratively shifts unsorted elements into their correct position in the sorted prefix.";
        int stepNum = 0;
        traceInsertionSort(workData, trace, comparisons, stepNum);
    } else if (algoKey == "merge") {
        algoName = "Merge Sort";
        strategyBranch = "Divide & Conquer";
        strategyDetails = "Recursively divides array into halves and merges sorted sub-arrays using temporary buffers.";
        int stepNum = 0;
        TraceStep s0;
        s0.stepIndex = stepNum++;
        s0.phase = "init";
        s0.type = "init";
        s0.array = workData;
        s0.comparisons = 0;
        s0.description = "Merge Sort: Divide-and-conquer begins. Recursively splitting array into sub-arrays down to single elements.";
        trace.push_back(s0);

        traceMergeSortInternal(workData, 0, static_cast<int>(workData.size()) - 1, 1, stepNum, trace, comparisons);

        TraceStep sEnd;
        sEnd.stepIndex = stepNum++;
        sEnd.phase = "sorted";
        sEnd.type = "sorted";
        sEnd.array = workData;
        sEnd.comparisons = comparisons;
        sEnd.description = "Merge Sort complete! All sub-arrays have been merged into the final sorted array.";
        trace.push_back(sEnd);
    } else if (algoKey == "quick") {
        algoName = "Quick Sort";
        strategyBranch = "Pivot Partitioning";
        strategyDetails = "Selects pivot, scans left and right pointers, swaps out-of-order elements, and locks pivot in its final position.";
        int stepNum = 0;
        std::vector<int> fixedPivots;
        TraceStep s0;
        s0.stepIndex = stepNum++;
        s0.phase = "init";
        s0.type = "init";
        s0.array = workData;
        s0.comparisons = 0;
        s0.description = "Quick Sort: Partitioning begins. Subarray is partitioned around a chosen pivot element.";
        trace.push_back(s0);

        traceQuickSortInternal(workData, 0, static_cast<int>(workData.size()) - 1, stepNum, 1, trace, comparisons, fixedPivots);

        TraceStep sEnd;
        sEnd.stepIndex = stepNum++;
        sEnd.phase = "sorted";
        sEnd.type = "sorted";
        sEnd.array = workData;
        sEnd.fixedPivots = fixedPivots;
        sEnd.comparisons = comparisons;
        sEnd.description = "Quick Sort complete! All recursive partitions resolved and pivots placed in their final positions.";
        trace.push_back(sEnd);
    } else if (algoKey == "heap") {
        algoName = "Heap Sort";
        strategyBranch = "Max-Heap Extraction";
        strategyDetails = "Builds an in-place max-heap and iteratively extracts the maximum root to the end.";
        traceHeapSort(workData, trace, comparisons);
    } else if (algoKey == "adaptive") {
        algoName = "Adaptive Sort";
        traceAdaptiveSort(workData, trace, comparisons, strategyBranch, strategyDetails);
    } else {
        std::cout << "{\"success\":false,\"error\":\"Unknown algorithm for trace: " << escapeJson(algoKey) << "\"}" << std::endl;
        return;
    }

    double execTimeUs = timer.stopTimerUs();
    std::vector<int> finalSorted = workData;
    if (!trace.empty() && !trace.back().array.empty()) {
        finalSorted = trace.back().array;
    }

    printTraceJson(algoKey, algoName, data, trace, finalSorted, comparisons, execTimeUs, strategyBranch, strategyDetails);
    std::cout << std::endl;
}

// ============================================================================
// Main CLI Parser
// ============================================================================
int main(int argc, char* argv[]) {
    std::string requestedAlgo = "all";
    bool traceMode = false;

    // Parse command line flags: --algo <merge|quick|heap|insertion|adaptive|all> [--trace]
    for (int i = 1; i < argc; ++i) {
        std::string arg = argv[i];
        if (arg == "--algo" && i + 1 < argc) {
            requestedAlgo = argv[++i];
        } else if (arg == "--trace") {
            traceMode = true;
        } else if (arg == "--help" || arg == "-h") {
            std::cout << "Usage: sorter.exe [--algo <merge|quick|heap|insertion|adaptive|all>] [--trace]" << std::endl;
            std::cout << "Provide comma- or whitespace-separated integers on standard input." << std::endl;
            return 0;
        }
    }

    // Read input data from standard input (comma- or space-separated integers)
    std::vector<int> inputData;
    std::string fullInput;
    std::string line;
    while (std::getline(std::cin, line)) {
        fullInput += line + " ";
    }

    // Parse tokens (accept commas, spaces, tabs, newlines)
    std::string token;
    for (char ch : fullInput) {
        if (ch == ',' || ch == '\t' || ch == '\r' || ch == '\n' || ch == ' ') {
            if (!token.empty()) {
                try {
                    inputData.push_back(std::stoi(token));
                } catch (...) {
                    // Skip non-integer artifacts
                }
                token.clear();
            }
        } else {
            token += ch;
        }
    }
    if (!token.empty()) {
        try {
            inputData.push_back(std::stoi(token));
        } catch (...) {
            // Ignore trailing non-integer
        }
    }

    // If input is empty, return an error in JSON format
    if (inputData.empty()) {
        std::cout << "{\"success\":false,\"error\":\"No valid integer input provided on stdin.\"}" << std::endl;
        return 1;
    }

    if (traceMode) {
        if (requestedAlgo == "all") {
            requestedAlgo = "adaptive"; // Default to adaptive when tracing without specific algo
        }
        runTrace(requestedAlgo, inputData);
        return 0;
    }

    // Benchmarking mode
    std::cout << "{\"success\":true,";

    if (requestedAlgo == "all") {
        std::vector<std::string> algos = {"insertion", "merge", "quick", "heap", "adaptive"};
        std::cout << "\"mode\":\"all\",\"inputSize\":" << inputData.size() << ",\"results\":[";
        for (size_t i = 0; i < algos.size(); ++i) {
            if (i > 0) std::cout << ",";
            BenchmarkResult res = runBenchmark(algos[i], inputData);
            printResultJson(res, true);
        }
        std::cout << "]}";
    } else {
        std::cout << "\"mode\":\"single\",";
        BenchmarkResult res = runBenchmark(requestedAlgo, inputData);
        std::cout << "\"result\":";
        printResultJson(res, true);
        std::cout << "}";
    }
    std::cout << std::endl;

    return 0;
}
