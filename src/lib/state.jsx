import { createContext, useContext, useReducer, useEffect, useMemo } from 'react';
import { loadMethodsData, validateMethodsData } from './data';
import { createSearchIndex, applyFiltersAndSearch, FILTER_DEFAULTS } from './filters';

/**
 * Application state context and reducer
 */

const AppStateContext = createContext(null);
const AppDispatchContext = createContext(null);

// Initial state
const initialState = {
  // Data
  data: null,
  loading: true,
  error: null,
  validationErrors: [],

  // Filters
  filters: { ...FILTER_DEFAULTS },

  // UI state
  selectedStep: null,
  selectedModality: null,
  selectedMethodId: null,
  hoveredMethodId: null,
  compareMethodIds: [],
  isCompareMode: false,
  showFilters: false,
  sortBy: 'name',
  sortOrder: 'asc',

  // Search
  searchIndex: null,
};

// Action types
const ACTIONS = {
  SET_DATA: 'SET_DATA',
  SET_ERROR: 'SET_ERROR',
  SET_LOADING: 'SET_LOADING',
  SET_VALIDATION_ERRORS: 'SET_VALIDATION_ERRORS',
  SET_FILTERS: 'SET_FILTERS',
  RESET_FILTERS: 'RESET_FILTERS',
  SET_SELECTED_STEP: 'SET_SELECTED_STEP',
  SET_SELECTED_MODALITY: 'SET_SELECTED_MODALITY',
  SET_SELECTED_METHOD: 'SET_SELECTED_METHOD',
  SET_HOVERED_METHOD: 'SET_HOVERED_METHOD',
  TOGGLE_COMPARE_METHOD: 'TOGGLE_COMPARE_METHOD',
  CLEAR_COMPARE: 'CLEAR_COMPARE',
  SET_COMPARE_MODE: 'SET_COMPARE_MODE',
  TOGGLE_FILTERS: 'TOGGLE_FILTERS',
  SET_SORT: 'SET_SORT',
  SET_SEARCH_INDEX: 'SET_SEARCH_INDEX',
};

// Reducer
function appReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_DATA:
      return { ...state, data: action.payload, loading: false, error: null };
    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    case ACTIONS.SET_VALIDATION_ERRORS:
      return { ...state, validationErrors: action.payload };
    case ACTIONS.SET_FILTERS:
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case ACTIONS.RESET_FILTERS:
      return { ...state, filters: { ...FILTER_DEFAULTS }, selectedStep: null, selectedModality: null };
    case ACTIONS.SET_SELECTED_STEP:
      return {
        ...state,
        selectedStep: action.payload,
        selectedModality: null,
        filters: { ...state.filters, pipelineStep: action.payload, modalities: [] },
      };
    case ACTIONS.SET_SELECTED_MODALITY:
      return {
        ...state,
        selectedStep: 'collect',
        selectedModality: action.payload,
        filters: { 
          ...state.filters, 
          pipelineStep: 'collect',
          modalities: action.payload ? [action.payload] : [],
        },
      };
    case ACTIONS.SET_SELECTED_METHOD:
      return { ...state, selectedMethodId: action.payload };
    case ACTIONS.SET_HOVERED_METHOD:
      return { ...state, hoveredMethodId: action.payload };
    case ACTIONS.TOGGLE_COMPARE_METHOD: {
      const methodId = action.payload;
      const current = state.compareMethodIds;
      let updated;
      if (current.includes(methodId)) {
        updated = current.filter((id) => id !== methodId);
      } else if (current.length < 3) {
        updated = [...current, methodId];
      } else {
        updated = current;
      }
      return { ...state, compareMethodIds: updated };
    }
    case ACTIONS.CLEAR_COMPARE:
      return { ...state, compareMethodIds: [], isCompareMode: false };
    case ACTIONS.SET_COMPARE_MODE:
      return { ...state, isCompareMode: action.payload };
    case ACTIONS.TOGGLE_FILTERS:
      return { ...state, showFilters: !state.showFilters };
    case ACTIONS.SET_SORT:
      return { ...state, sortBy: action.payload.sortBy, sortOrder: action.payload.order };
    case ACTIONS.SET_SEARCH_INDEX:
      return { ...state, searchIndex: action.payload };
    default:
      return state;
  }
}

/**
 * App state provider component
 */
export function AppStateProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load data on mount
  useEffect(() => {
    async function loadData() {
      try {
        const data = await loadMethodsData();

        // Validate data
        const validation = validateMethodsData(data);
        if (!validation.isValid) {
          console.warn('Data validation warnings:', validation.errors);
          dispatch({ type: ACTIONS.SET_VALIDATION_ERRORS, payload: validation.errors });
        }

        // Create search index
        const searchIndex = createSearchIndex(data.methods);
        dispatch({ type: ACTIONS.SET_SEARCH_INDEX, payload: searchIndex });

        dispatch({ type: ACTIONS.SET_DATA, payload: data });
      } catch (error) {
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
      }
    }

    loadData();
  }, []);

  // Memoize filtered methods
  const filteredMethods = useMemo(() => {
    if (!state.data?.methods || !state.searchIndex) return [];
    return applyFiltersAndSearch(state.data.methods, state.searchIndex, state.filters);
  }, [state.data?.methods, state.searchIndex, state.filters]);

  // Enhanced state with computed values
  const enhancedState = useMemo(
    () => ({
      ...state,
      filteredMethods,
      pipelineSteps: state.data?.pipeline_steps || [],
      allMethods: state.data?.methods || [],
    }),
    [state, filteredMethods]
  );

  return (
    <AppStateContext.Provider value={enhancedState}>
      <AppDispatchContext.Provider value={dispatch}>{children}</AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
}

/**
 * Hook to access app state
 */
export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return context;
}

/**
 * Hook to access dispatch function
 */
export function useAppDispatch() {
  const context = useContext(AppDispatchContext);
  if (!context) {
    throw new Error('useAppDispatch must be used within AppStateProvider');
  }
  return context;
}

/**
 * Action creators
 */
export const actions = {
  setSelectedStep: (stepId) => ({
    type: ACTIONS.SET_SELECTED_STEP,
    payload: stepId,
  }),
  setSelectedModality: (modalityId) => ({
    type: ACTIONS.SET_SELECTED_MODALITY,
    payload: modalityId,
  }),
  setSelectedMethod: (methodId) => ({
    type: ACTIONS.SET_SELECTED_METHOD,
    payload: methodId,
  }),
  setHoveredMethod: (methodId) => ({
    type: ACTIONS.SET_HOVERED_METHOD,
    payload: methodId,
  }),
  setFilters: (filters) => ({
    type: ACTIONS.SET_FILTERS,
    payload: filters,
  }),
  resetFilters: () => ({
    type: ACTIONS.RESET_FILTERS,
  }),
  toggleCompareMethod: (methodId) => ({
    type: ACTIONS.TOGGLE_COMPARE_METHOD,
    payload: methodId,
  }),
  clearCompare: () => ({
    type: ACTIONS.CLEAR_COMPARE,
  }),
  setCompareMode: (enabled) => ({
    type: ACTIONS.SET_COMPARE_MODE,
    payload: enabled,
  }),
  toggleFilters: () => ({
    type: ACTIONS.TOGGLE_FILTERS,
  }),
  setSort: (sortBy, order) => ({
    type: ACTIONS.SET_SORT,
    payload: { sortBy, order },
  }),
};
