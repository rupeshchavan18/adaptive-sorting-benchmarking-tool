import type { EngineStatus } from '../types';


interface HeaderProps {
  status: EngineStatus | null;
  loadingStatus: boolean;
}

export const Header: React.FC<HeaderProps> = ({ status, loadingStatus }) => {
  return (
    <header className="app-header">
      <div className="brand-section">
        <div className="brand-icon" aria-hidden="true">
          ⚡
        </div>
        <div className="brand-titles">
          <h1>Adaptive Sorting Algorithm Benchmarking Tool</h1>
          <p>C++ DSA Project • Native MinGW C++ Engine • Hardware Performance Profiling</p>
        </div>
      </div>

      <div className="engine-status-badge" title="C++ Engine Status">
        <span className="status-dot"></span>
        <span>
          {loadingStatus ? (
            'Detecting C++ engine...'
          ) : status?.engineReady ? (
            `C++ Engine: Active (${status.compiler.split(' ')[0] || 'g++'})`
          ) : (
            'C++ Engine: Ready'
          )}
        </span>
      </div>
    </header>
  );
};
