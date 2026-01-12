import { useAppState, useAppDispatch, actions, getFilterOptions } from '@/lib';

/**
 * Filter chip component
 */
function FilterChip({ label, isActive, onClick }) {
  return (
    <button
      className={`filter-chip ${isActive ? 'filter-chip--active' : ''}`}
      onClick={onClick}
      type="button"
      aria-pressed={isActive}
    >
      {label}
    </button>
  );
}

/**
 * Filters panel component - refined design
 */
export default function FiltersPanel() {
  const { filters, allMethods, showFilters } = useAppState();
  const dispatch = useAppDispatch();

  if (!showFilters) return null;

  const filterOptions = getFilterOptions(allMethods);

  const toggleArrayFilter = (filterName, value) => {
    const current = filters[filterName] || [];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    dispatch(actions.setFilters({ [filterName]: updated }));
  };

  const hasActiveFilters =
    filters.pipelineStep ||
    (filters.modalities && filters.modalities.length > 0) ||
    (filters.tasks && filters.tasks.length > 0) ||
    (filters.maturityLevels && filters.maturityLevels.length > 0) ||
    (filters.evidenceTypes && filters.evidenceTypes.length > 0);

  return (
    <div className="filters-panel animate-slide-up">
      <div className="filters-panel__header">
        <h2 className="filters-panel__title">Filters</h2>
        {hasActiveFilters && (
          <button
            className="btn btn--ghost btn--sm"
            onClick={() => dispatch(actions.resetFilters())}
          >
            Clear all
          </button>
        )}
      </div>

      <div className="filters-panel__grid">
        {/* Modalities */}
        <div className="filters-panel__group">
          <label className="filters-panel__label">Modality</label>
          <div className="filters-panel__chips">
            {filterOptions.modalities.map((mod) => (
              <FilterChip
                key={mod}
                label={mod}
                isActive={filters.modalities?.includes(mod)}
                onClick={() => toggleArrayFilter('modalities', mod)}
              />
            ))}
          </div>
        </div>

        {/* Tasks */}
        <div className="filters-panel__group">
          <label className="filters-panel__label">Task</label>
          <div className="filters-panel__chips">
            {filterOptions.tasks.map((task) => (
              <FilterChip
                key={task}
                label={task}
                isActive={filters.tasks?.includes(task)}
                onClick={() => toggleArrayFilter('tasks', task)}
              />
            ))}
          </div>
        </div>

        {/* Maturity */}
        <div className="filters-panel__group">
          <label className="filters-panel__label">Maturity</label>
          <div className="filters-panel__chips">
            {filterOptions.maturityLevels.map((level) => (
              <FilterChip
                key={level}
                label={level}
                isActive={filters.maturityLevels?.includes(level)}
                onClick={() => toggleArrayFilter('maturityLevels', level)}
              />
            ))}
          </div>
        </div>

        {/* Evidence Type */}
        <div className="filters-panel__group">
          <label className="filters-panel__label">Evidence</label>
          <div className="filters-panel__chips">
            {filterOptions.evidenceTypes.map((type) => (
              <FilterChip
                key={type}
                label={type}
                isActive={filters.evidenceTypes?.includes(type)}
                onClick={() => toggleArrayFilter('evidenceTypes', type)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
