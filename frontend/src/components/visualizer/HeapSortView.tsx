import React from 'react';
import type { TraceStep } from '../../types';

interface HeapSortViewProps {
  step: TraceStep;
}

interface TreeNode {
  index: number;
  value: number;
  level: number;
  x: number;
  y: number;
  parentIndex?: number;
}

export const HeapSortView: React.FC<HeapSortViewProps> = ({ step }) => {
  const arr = step.array || [];
  const n = arr.length;
  const heapSize = step.heapSize !== undefined && step.heapSize >= 0 ? step.heapSize : n;
  const rootIdx = step.rootIndex ?? -1;
  const leftChild = step.leftChildIndex ?? -1;
  const rightChild = step.rightChildIndex ?? -1;
  const largestIdx = step.largestIndex ?? -1;
  const swap1 = step.swapIdx1 ?? -1;
  const swap2 = step.swapIdx2 ?? -1;
  const sortedBoundary = step.sortedBoundary !== undefined && step.sortedBoundary >= 0 ? step.sortedBoundary : n;

  // Compute SVG Tree Nodes layout dynamically
  const svgWidth = 660;
  const svgHeight = Math.max(260, (Math.floor(Math.log2(Math.max(1, n))) + 1) * 75 + 40);

  const treeNodes: TreeNode[] = [];
  for (let i = 0; i < n; i++) {
    const level = Math.floor(Math.log2(i + 1));
    const nodesOnLevel = Math.pow(2, level);
    const posOnLevel = i - (nodesOnLevel - 1);
    const x = (posOnLevel + 0.5) * (svgWidth / nodesOnLevel);
    const y = 35 + level * 65;
    const parentIndex = i > 0 ? Math.floor((i - 1) / 2) : undefined;

    treeNodes.push({
      index: i,
      value: arr[i],
      level,
      x,
      y,
      parentIndex,
    });
  }

  const isExtraction = step.phase === 'extraction' || step.type === 'extract_max' || step.type === 'element_sorted';
  const isHeapBuilt = step.type === 'heap_built';

  return (
    <div className="vis-stage heap-stage" aria-label="Heap Sort Visualization Stage">
      {/* Top Heap Phase Indicator */}
      <div className="heap-header-bar">
        <div className="heap-phase-badge">
          {step.phase === 'init' && '🚀 Phase 1: Constructing Initial Max-Heap'}
          {step.phase === 'heapify' && '🔄 Phase 1: Heapifying Subtree to Restore Max-Heap Property'}
          {isHeapBuilt && '✨ Max-Heap Successfully Built! Root holds Maximum Element'}
          {isExtraction && '🎯 Phase 2: Extracting Maximum Root to Sorted Suffix'}
          {step.type === 'sorted' && '🏆 Entire Array Fully Extracted and Sorted'}
        </div>

        <div className="heap-sizes-row">
          <span className="badge-tag mono heap-active-badge">
            Active Max-Heap Size: <strong>{heapSize}</strong> elements [0 .. {Math.max(0, heapSize - 1)}]
          </span>
          <span className="badge-tag mono heap-sorted-badge">
            Extracted Sorted Suffix: <strong>{n - heapSize}</strong> elements [{heapSize} .. {n - 1}]
          </span>
        </div>
      </div>

      {/* Side-by-side or Stacked: SVG Tree and Array Representation */}
      <div className="heap-dual-view">
        {/* Visualizer 1: Interactive Max-Heap SVG Tree */}
        <div className="card heap-tree-panel">
          <div className="panel-title-bar">
            <span>🌲 Binary Max-Heap Tree Representation</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
              arr[i] with children at 2i+1 and 2i+2
            </span>
          </div>

          <div className="svg-tree-wrapper">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="heap-svg"
              aria-label="Binary Heap Tree Graph"
            >
              {/* Branch connecting lines */}
              {treeNodes.map((node) => {
                if (node.parentIndex === undefined) return null;
                const parent = treeNodes[node.parentIndex];
                if (!parent) return null;

                const isInHeap = node.index < heapSize && parent.index < heapSize;
                const isSwappingEdge =
                  (node.index === swap1 && parent.index === swap2) ||
                  (node.index === swap2 && parent.index === swap1);

                return (
                  <line
                    key={`edge-${node.index}`}
                    x1={parent.x}
                    y1={parent.y}
                    x2={node.x}
                    y2={node.y}
                    stroke={
                      isSwappingEdge
                        ? 'var(--rose-400)'
                        : isInHeap
                        ? 'rgba(56, 189, 248, 0.4)'
                        : 'rgba(255, 255, 255, 0.1)'
                    }
                    strokeWidth={isSwappingEdge ? 3 : isInHeap ? 2 : 1}
                    strokeDasharray={isInHeap ? undefined : '4 3'}
                  />
                );
              })}

              {/* Node Circles */}
              {treeNodes.map((node) => {
                const idx = node.index;
                const inHeap = idx < heapSize;
                const isRoot = idx === rootIdx;
                const isLeft = idx === leftChild;
                const isRight = idx === rightChild;
                const isLargest = idx === largestIdx;
                const isSwapping = idx === swap1 || idx === swap2;
                const isExtracted = idx >= sortedBoundary;

                let fill = '#162032';
                let stroke = '#334155';
                let textColor = '#f8fafc';

                if (isSwapping) {
                  fill = '#9f1239';
                  stroke = '#fb7185';
                  textColor = '#ffffff';
                } else if (isRoot) {
                  fill = '#78350f';
                  stroke = '#fbbf24';
                  textColor = '#fef08a';
                } else if (isLargest && (isLeft || isRight)) {
                  fill = '#064e3b';
                  stroke = '#34d399';
                  textColor = '#a7f3d0';
                } else if (isLeft) {
                  fill = '#0c4a6e';
                  stroke = '#38bdf8';
                  textColor = '#bae6fd';
                } else if (isRight) {
                  fill = '#3b0764';
                  stroke = '#c084fc';
                  textColor = '#f5d0fe';
                } else if (isExtracted) {
                  fill = '#064e3b';
                  stroke = '#10b981';
                  textColor = '#a7f3d0';
                } else if (!inHeap) {
                  fill = '#0f172a';
                  stroke = 'rgba(255,255,255,0.08)';
                  textColor = '#64748b';
                }

                return (
                  <g key={`node-${idx}`} className="heap-node-group">
                    {/* Glowing outer ring for root or swap */}
                    {(isRoot || isSwapping) && (
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={24}
                        fill="none"
                        stroke={stroke}
                        strokeWidth={2}
                        strokeDasharray="3 3"
                        opacity={0.7}
                      />
                    )}

                    {/* Main Node Circle */}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={19}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={2.2}
                    />

                    {/* Node Value Text */}
                    <text
                      x={node.x}
                      y={node.y + 5}
                      textAnchor="middle"
                      fill={textColor}
                      fontSize="12.5px"
                      fontWeight="700"
                      fontFamily="var(--font-mono)"
                    >
                      {node.value}
                    </text>

                    {/* Index Label badge below node */}
                    <text
                      x={node.x}
                      y={node.y + 30}
                      textAnchor="middle"
                      fill="var(--text-dim)"
                      fontSize="9.5px"
                      fontFamily="var(--font-mono)"
                    >
                      [{idx}]
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Visualizer 2: Array Representation */}
        <div className="card heap-array-panel">
          <div className="panel-title-bar">
            <span>📊 Linear Array Mapping (In-Place Memory)</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
              Index 0 is Heap Root; sorted elements accumulate at the tail
            </span>
          </div>

          <div className="array-cards-row">
            {arr.map((val, idx) => {
              const inHeap = idx < heapSize;
              const isRoot = idx === rootIdx;
              const isLeft = idx === leftChild;
              const isRight = idx === rightChild;
              const isLargest = idx === largestIdx;
              const isSwapping = idx === swap1 || idx === swap2;
              const isExtracted = idx >= sortedBoundary;

              let cardClass = '';
              if (isSwapping) cardClass = 'swap-highlight';
              else if (isRoot) cardClass = 'heap-root';
              else if (isLargest && (isLeft || isRight)) cardClass = 'heap-largest';
              else if (isLeft) cardClass = 'heap-left-child';
              else if (isRight) cardClass = 'heap-right-child';
              else if (isExtracted) cardClass = 'heap-extracted';
              else if (inHeap) cardClass = 'in-heap';
              else cardClass = 'inactive-card';

              return (
                <div key={idx} className={`array-card ${cardClass}`}>
                  <div className="card-top-tag">
                    {isExtracted && <span className="tag-ok">✓ Sorted</span>}
                    {!isExtracted && isRoot && <span className="tag-piv">Root i={idx}</span>}
                    {!isExtracted && !isRoot && isLeft && <span className="tag-i">Left 2i+1</span>}
                    {!isExtracted && !isRoot && isRight && <span className="tag-j">Right 2i+2</span>}
                    {!isExtracted && !isRoot && !isLeft && !isRight && inHeap && <span className="tag-part">Heap</span>}
                    {!inHeap && !isExtracted && <span className="tag-idle">Pending</span>}
                  </div>
                  <div className="card-value">{val}</div>
                  <div className="card-index">[{idx}]</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
