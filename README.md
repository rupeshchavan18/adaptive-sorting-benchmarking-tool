# Adaptive Sorting Algorithm Benchmarking Tool

A full-stack Data Structures & Algorithms (DSA) benchmarking and teaching visualization platform. The application couples a high-performance **native C++ sorting engine** with a local **Node.js Express API bridge** and a **React 19 + TypeScript + Vite frontend**.

The tool benchmarks and visualizes step-by-step operations for strictly **five allowed sorting algorithms**:
1. **Insertion Sort**
2. **Merge Sort**
3. **Quick Sort**
4. **Heap Sort**
5. **Adaptive Sort** (Hybrid Size- and Disorder-Aware Engine)

---

## 1. Project Objectives

- **Empirical Rigor**: Replace simulated JavaScript sorting with a compiled native C++ engine (`cpp/sorter.exe`) utilizing hardware performance counters (`QueryPerformanceCounter`) and OS memory diagnostics (Windows PSAPI).
- **Metric Honesty**: Strictly separate mathematically estimated asymptotic complexities ($\mathcal{O}(1), \mathcal{O}(N), \mathcal{O}(N \log N)$) from experimentally measured physical metrics (elapsed microseconds, exact comparison tallies, dynamic heap buffer bytes, and peak working set RAM).
- **Pedagogical Visualization**: Provide a step-by-step visualizer where every frame, pointer, comparison, shift, and tree node corresponds 1-to-1 with real trace events emitted by the C++ engine.
- **Demonstration of Algorithmic Adaptivity**: Demonstrate how a hybrid adaptive sort inspects dataset characteristics ($N \le 24$ and adjacent disorder $\le 5\%$) to dynamically switch between Insertion Sort's linear $\mathcal{O}(N)$ performance on nearly-sorted data and Quick Sort's $\mathcal{O}(N \log N)$ partitioning on disordered data.

---

## 2. Key Features

### Benchmark Lab Mode
- **Multi-Algorithm Comparative Benchmarking**: Evaluates all 5 algorithms on identical input in a single run.
- **Microsecond Timing Resolution**: Hardware-level QPC timing converted to fractional microseconds ($\mu\text{s}$) and milliseconds ($\text{ms}$).
- **Accurate Comparison Counting**: Atomic comparison tracking (`comparisons++`) inside actual element comparison routines.
- **Honest Memory Metrics**:
  - `Theoretical Space (Estimated)`: Asymptotic classification.
  - `Auxiliary Heap (Measured)`: Dynamically allocated buffer bytes during execution (e.g. Merge Sort's temporary vectors).
  - `Call Stack Depth (Tracked)`: Maximum call stack recursion depth.
  - `Process Peak RAM (Measured)`: Physical process working set queried from Windows PSAPI.
- **Already-Sorted Input Detection**: Highlights ideal linear $\mathcal{O}(N)$ best-case behavior for Insertion and Adaptive Sort.
- **Deep-Link Visualization**: One-click "Visualize" buttons on each benchmark result row to inspect the algorithm in the Step-by-Step Visualizer.

### Step-by-Step Teaching Visualizer Mode
- **Real C++ Trace Generation**: Executes `sorter.exe --algo <name> --trace` to generate structured JSON playback steps.
- **Shared Playback Controls**:
  - Play, Pause, Step Next, Step Previous, Reset
  - Continuous Progress Scrubber
  - Playback Speed Multipliers ($0.25\times, 0.5\times, 1\times, 2\times, 4\times$)
  - Dynamic Step Counter and Pass Counter
- **Algorithm-Specific Visualizer Views**:
  - **Insertion Sort**: Active key card, comparison arrows, shifting animation, and sorted prefix zone `[0..i]` vs. unsorted zone `[i+1..N-1]`.
  - **Merge Sort**: Recursive division down to $N=1$ base cases, left/right sub-arrays, two-finger merge pointers ($i, j, k$), and merged sub-results.
  - **Quick Sort**: 👑 Pivot card, scanning pointers ($i, j$), swap badges, and 🔒 locked final pivot indicators. Includes preset matching classroom slides: `[26, 22, 12, 29, 19, 33, 35]`.
  - **Heap Sort**: Dual layout featuring a linear array and an interactive SVG **Binary Max-Heap Tree** (`parent = (i-1)/2`, `left = 2i+1`, `right = 2i+2`), showing heapify sift-down, element swaps, and root extraction into the sorted suffix.
  - **Adaptive Sort**: Strategy selection engine card displaying Rule 1 (Size $N \le 24$) and Rule 2 (Inversion scan $\le 5\%$) rationale before executing the selected algorithm.

---

## 3. Technology Stack

| Layer | Technologies / Tools | Purpose |
| :--- | :--- | :--- |
| **Sorting Engine** | C++11, MinGW `g++`, Windows API (`windows.h`, `psapi.h`) | Algorithmic execution, QPC timing, memory introspection, trace JSON output |
| **Backend API** | Node.js (CommonJS), Express 4, CORS, Child Process (`spawn`) | Streams input data via stdin to `sorter.exe`, parses JSON responses, exposes `/api/sort` and `/api/trace` |
| **Frontend UI** | React 19, TypeScript, Vite, Vanilla CSS | Interactive benchmark lab, SVG tree renderer, playback coordinator, glassmorphic dark theme |
| **Verification** | Custom Node.js testing harnesses, Oxlint | End-to-end correctness, edge cases, type validation |

---

## 4. Architecture Overview

```
                                      Browser (User)
                                            │
                                            ▼
                          ┌───────────────────────────────────┐
                          │    React 19 + Vite Frontend       │
                          │   (http://localhost:5173)         │
                          └─────────────────┬─────────────────┘
                                            │ HTTP (JSON) via Vite Proxy
                                            ▼
                          ┌───────────────────────────────────┐
                          │     Node.js Express Backend       │
                          │   (http://localhost:5050)         │
                          └─────────────────┬─────────────────┘
                                            │ stdin (streamed integers)
                                            │ stdout (structured JSON)
                                            ▼
                          ┌───────────────────────────────────┐
                          │      Native C++ Sorting Engine    │
                          │        (cpp/sorter.exe)           │
                          │  - QPC Microsecond Timing         │
                          │  - Atomic Comparison Tallies      │
                          │  - PSAPI Working Set Memory       │
                          │  - Trace Event Generator          │
                          └───────────────────────────────────┘
```

---

## 5. Prerequisites

Before running the application, ensure the following are installed and accessible in your system `PATH`:
1. **MinGW GCC / G++** (`g++ --version`): Required to compile `cpp/sorter.cpp` with C++11 support.
2. **Node.js** (v18 or higher recommended, `node -v`): Required to run the Express backend and Vite frontend.
3. **npm** (`npm -v`): Required to manage dependencies and start the React dev server.

---

## 6. Exact Setup & Run Commands

### Option A: One-Click Startup (Recommended for Windows)

From the project root directory, run the automated launch script:
```cmd
cd /d "d:\capcut raw video\DS project"
start.bat
```
*`start.bat` will automatically verify that `sorter.exe` is compiled, launch the Node.js backend in a separate terminal window on port 5050, launch the Vite frontend on port 5173, and display status links.*

---

### Option B: Manual Step-by-Step Startup

#### Step 1: Compile the C++ Engine
```cmd
cd /d "d:\capcut raw video\DS project\cpp"
g++ -std=c++11 -O2 sorter.cpp -o sorter.exe -lpsapi
```
*(Verify by running: `sorter.exe --help`)*

#### Step 2: Install Backend Dependencies & Start Server
```cmd
cd /d "d:\capcut raw video\DS project\backend"
npm install
node server.js
```
*(The backend starts on `http://localhost:5050`. Health check endpoint: `http://localhost:5050/api/status`)*

#### Step 3: Install Frontend Dependencies & Start Dev Server
```cmd
cd /d "d:\capcut raw video\DS project\frontend"
npm install
npm run dev
```
*(Open your browser at `http://localhost:5173`)*

#### Step 4: Run Production Build (Optional)
```cmd
cd /d "d:\capcut raw video\DS project\frontend"
npm run build
```

---

## 7. Project Directory Structure

```
DS project/
├── backend/
│   ├── package.json         # Express & CORS dependencies
│   └── server.js            # Node API bridging HTTP to sorter.exe
├── cpp/
│   ├── build.bat            # MinGW g++ compilation script
│   ├── sorter.cpp           # Complete C++ engine (benchmarking & trace emitter)
│   └── sorter.exe           # Compiled native binary
├── docs/
│   ├── ALGORITHMS.md        # Comprehensive algorithm analysis & mechanics
│   ├── DEMO_GUIDE.md        # Step-by-step presentation & visual walkthrough
│   └── TESTING.md           # Test cases, verification data & methodology
├── frontend/
│   ├── src/
│   │   ├── components/      # UI panels, tables, legends, banners
│   │   │   └── visualizer/  # Dedicated views for Insertion, Merge, Quick, Heap, Adaptive
│   │   ├── types.ts         # TypeScript interfaces (BenchmarkResult, TraceStep)
│   │   ├── App.tsx          # Main layout & navigation hub
│   │   └── index.css        # Modern glassmorphic stylesheet
│   ├── index.html           # HTML5 entry point
│   ├── package.json         # React 19 & Vite configuration
│   └── vite.config.ts       # Vite bundler & API proxy configuration
├── start.bat                # Automated one-click startup script
└── README.md                # Project documentation root
```
#   a d a p t i v e - s o r t i n g - b e n c h m a r k i n g - t o o l  
 