import { Link } from 'react-router-dom';
import {
  Header,
  PipelineVisualization,
  LandscapeVisualization,
  MethodList,
  FiltersPanel,
  CompareBar,
} from '@/components';
import { useAppState, useAppDispatch, actions, getStatistics } from '@/lib';
import '@/styles/home.css';

/**
 * Stats row - inline, calm design
 */
function StatsRow() {
  const { data } = useAppState();

  if (!data) return null;

  const stats = getStatistics(data);

  return (
    <div className="stats-row">
      <div className="stats-row__item">
        <span className="stats-row__value">{stats.totalMethods}</span>
        <span className="stats-row__label">methods</span>
      </div>
      <div className="stats-row__divider" />
      <div className="stats-row__item">
        <span className="stats-row__value">{Object.keys(stats.stepCounts).length}</span>
        <span className="stats-row__label">pipeline steps</span>
      </div>
      <div className="stats-row__divider" />
      <div className="stats-row__item">
        <span className="stats-row__value">{Object.keys(stats.modalityCounts).length}</span>
        <span className="stats-row__label">modalities</span>
      </div>
    </div>
  );
}

/**
 * Pipeline section with header and legend
 */
function PipelineSection() {
  const { selectedStep } = useAppState();
  const dispatch = useAppDispatch();

  return (
    <section className="pipeline-section">
      <div className="pipeline-section__header">
        <div>
          <h2 className="pipeline-section__title">Pipeline Overview</h2>
          <p className="pipeline-section__hint">Click a step to filter methods</p>
        </div>
        <div className="pipeline-section__legend">
          <div className="pipeline-section__legend-item">
            <div className="pipeline-section__legend-dot" />
            <span>Selected</span>
          </div>
          <div className="pipeline-section__legend-item">
            <div className="pipeline-section__legend-dot pipeline-section__legend-dot--muted" />
            <span>Available</span>
          </div>
        </div>
      </div>
      <div className="pipeline-viz-wrapper">
        <PipelineVisualization />
      </div>
      {selectedStep && (
        <div className="pipeline-clear">
          <button
            className="btn btn--ghost btn--sm"
            onClick={() => dispatch(actions.setSelectedStep(null))}
          >
            Clear selection
          </button>
        </div>
      )}
    </section>
  );
}

/**
 * Controls row with filters toggle and compare mode
 */
function ControlsRow() {
  const { isCompareMode, showFilters, compareMethodIds } = useAppState();
  const dispatch = useAppDispatch();

  return (
    <div className="controls-row">
      <div className="controls-row__left">
        <button
          className={`btn ${showFilters ? 'btn--primary' : 'btn--secondary'}`}
          onClick={() => dispatch(actions.toggleFilters())}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          Filters
        </button>
      </div>
      <div className="controls-row__right">
        <button
          className={`btn ${isCompareMode ? 'btn--primary' : 'btn--secondary'}`}
          onClick={() => dispatch(actions.setCompareMode(!isCompareMode))}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
          </svg>
          Compare
          {isCompareMode && compareMethodIds.length > 0 && (
            <span style={{ 
              background: 'rgba(255,255,255,0.2)', 
              padding: '2px 6px', 
              borderRadius: '10px',
              fontSize: '11px'
            }}>
              {compareMethodIds.length}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

/**
 * Active filters display
 */
function ActiveFilters() {
  const { filters, selectedStep } = useAppState();
  const dispatch = useAppDispatch();

  const hasFilters = selectedStep || 
    filters.modalities?.length > 0 || 
    filters.tasks?.length > 0 ||
    filters.searchQuery;

  if (!hasFilters) return null;

  const clearAll = () => {
    dispatch(actions.setSelectedStep(null));
    dispatch(actions.setFilters({ 
      searchQuery: '', 
      modalities: [], 
      tasks: [] 
    }));
  };

  return (
    <div className="active-filters">
      <span className="active-filters__label">Active:</span>
      
      {selectedStep && (
        <button 
          className="filter-chip filter-chip--active"
          onClick={() => dispatch(actions.setSelectedStep(null))}
        >
          Step: {selectedStep.replace('_', ' ')}
          <span className="filter-chip__remove">×</span>
        </button>
      )}
      
      {filters.searchQuery && (
        <button 
          className="filter-chip filter-chip--active"
          onClick={() => dispatch(actions.setFilters({ searchQuery: '' }))}
        >
          Search: "{filters.searchQuery}"
          <span className="filter-chip__remove">×</span>
        </button>
      )}
      
      {filters.modalities?.map(mod => (
        <button 
          key={mod}
          className="filter-chip filter-chip--active"
          onClick={() => dispatch(actions.setFilters({ 
            modalities: filters.modalities.filter(m => m !== mod) 
          }))}
        >
          {mod}
          <span className="filter-chip__remove">×</span>
        </button>
      ))}
      
      <button className="btn btn--ghost btn--sm" onClick={clearAll}>
        Clear all
      </button>
    </div>
  );
}

/**
 * Landscape section with header
 */
function LandscapeSection() {
  return (
    <section className="landscape-section">
      <div className="landscape-section__header">
        <div className="landscape-section__info">
          <h2 className="landscape-section__title">Method Landscape</h2>
          <p className="landscape-section__description">
            Explore methods by publication year and automation level. 
            Hover for details, click to view.
          </p>
        </div>
      </div>
      <div className="landscape-viz-wrapper">
        <LandscapeVisualization />
      </div>
    </section>
  );
}

/**
 * Methods sidebar section
 */
function MethodsSidebar() {
  const { filteredMethods, allMethods } = useAppState();

  return (
    <aside className="methods-sidebar">
      <div className="methods-sidebar__header">
        <h2 className="methods-sidebar__title">Methods</h2>
        <span className="methods-sidebar__count">
          {filteredMethods.length} / {allMethods.length}
        </span>
      </div>
      <div className="methods-sidebar__list">
        <MethodList />
      </div>
    </aside>
  );
}

/**
 * Home page view - main explorer
 */
export default function HomePage() {
  const { loading, error } = useAppState();

  if (loading) {
    return (
      <div className="main-layout">
        <Header />
        <main className="main-content">
          <div className="loading">
            <div className="loading__spinner" />
            <p>Loading methods data...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="main-layout">
        <Header />
        <main className="main-content">
          <div className="error">
            <div className="error__icon">⚠️</div>
            <h2>Error Loading Data</h2>
            <p>{error}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="main-layout">
      <Header />
      <div className="home-layout">
        <main className="main-content home-main">
          <StatsRow />
          <PipelineSection />
          <ControlsRow />
          <ActiveFilters />
          <FiltersPanel />
          <LandscapeSection />
        </main>
        <MethodsSidebar />
      </div>
      <CompareBar />
    </div>
  );
}
