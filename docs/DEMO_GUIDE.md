# Manual Demo Guide & Presentation Checklist

A practical, step-by-step walkthrough to demonstrate the core capabilities of the **Adaptive Sorting Algorithm Benchmarking Tool** in under 5 minutes.

---

## 1. Quick Startup

From the project root directory:
```cmd
start.bat
```
- Open `http://localhost:5173` in your browser.
- Verify the header badge shows: **`C++ Engine: Active (g++)`**.

---

## 2. Interactive Demo Walkthrough (5 Minutes)

### Demo 1: The Adaptive Sorting Advantage (Linear $O(N)$ vs $O(N \log N)$)
1. In the **Benchmark Lab** tab, click the **Nearly Sorted** preset button.
2. Set **Array Size (N)** to `1,000` elements and **Disorder / Swap Perturbation** to `2%`.
3. Click **"Execute All 5 Algorithms in C++"**.
4. **Observe the Results**:
   - Notice the **Already-Sorted / Nearly-Sorted Banner** triggers.
   - **Insertion Sort** and **Adaptive Sort** finish with only $\approx 1,000$ comparisons and minimal execution time ($\approx 5\text{--}15\,\mu\text{s}$).
   - **Merge Sort** and **Quick Sort** take $\approx 10,000\text{--}15,000$ comparisons.
   - Adaptive Sort's strategy card shows: `Selected Insertion Sort (Nearly Sorted)` with exact inversion percentages.

---

### Demo 2: Quadratic Degradation on Reverse-Sorted Data
1. Click the **Reverse** preset button.
2. Set **Array Size (N)** to `500` elements.
3. Click **"Execute All 5 Algorithms in C++"**.
4. **Observe**:
   - **Insertion Sort** comparison count spikes to $\frac{500 \times 499}{2} = 124,750$ comparisons ($O(N^2)$ worst case).
   - **Quick Sort** and **Heap Sort** maintain optimal $O(N \log N)$ behavior ($\approx 4,000\text{--}5,000$ comparisons).
   - **Adaptive Sort** detects high disorder and automatically chooses **Quick Sort**, shielding the system from $O(N^2)$ degradation.

---

### Demo 3: Deep-Link to Step-by-Step Visualizer
1. In the results table from Demo 2, click the **"🔍 Visualize"** button next to **Quick Sort**.
2. Notice the application automatically transitions to the **Step-by-Step Visualizer** with the first 16 elements loaded.
3. Use the playback controls:
   - Click **Play (▶)** to watch scanning pointers $i$ and $j$ move across the track.
   - Observe elements swapping when $arr[i] > pivot$ and $arr[j] < pivot$.
   - Observe the pivot locking with the 🔒 **Final** indicator.
   - Adjust speed to **2x** or **0.5x**, or drag the **Progress Scrubber** to jump to any step.

---

### Demo 4: Classroom Slide Presets
1. In the Visualizer tab, click the **"📖 Quick Slide (N=7)"** preset button.
   - Loads `[26, 22, 12, 29, 19, 33, 35]`.
   - Click **Next (▶)** step-by-step to walk through each pivot, comparison, and swap.
2. Click the **"📖 Merge Slide (N=8)"** preset button.
   - Loads `[6, 7, 11, 3, 13, 8, 9, 4]`.
   - Switch to **Merge Sort** to view recursive splits down to $N=1$ base cases and two-finger buffer merges.
3. Select **Heap Sort**:
   - View the dual layout: dynamic **Binary Max-Heap Tree** (SVG) and the linear in-place array.
   - Step through Phase 1 (Heap Construction) and Phase 2 (Root Extraction).

---

## 3. Manual Testing Checklist

| Checklist Item | Steps to Verify | Expected Result |
| :--- | :--- | :--- |
| **Empty Input Check** | Clear custom input box, submit | Run button disabled, `"Input is empty"` warning displayed |
| **Negative Numbers** | Input `-15, 20, -3, 0, 8, -25, 14` | Output: `[-25, -15, -3, 0, 8, 14, 20]` with `✓ Verified` |
| **All Duplicates** | Input `5, 5, 5, 5, 5, 5, 5` | Sorted correctly; Insertion does $N-1=6$ comparisons |
| **Single Element** | Input `42` | Output `[42]`, 0 comparisons, stack depth 1, theoretical space $O(1)$ |
| **Scrubber Control** | Drag scrubber from 0% to 100% | Visualizer state updates smoothly to correspond with step |
| **Copy Output** | Click `📋 Copy Array` in preview card | Clipboard contains sorted comma-separated string, shows `✓ Copied!` |
