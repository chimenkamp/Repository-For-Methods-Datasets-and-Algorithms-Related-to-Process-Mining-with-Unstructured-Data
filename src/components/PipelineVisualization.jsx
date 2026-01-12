import { useRef, useEffect, useCallback } from 'react';
import { createPipelineVisualization } from '@/viz/PipelineViz';
import { useAppState, useAppDispatch, actions } from '@/lib';

/**
 * Pipeline visualization React wrapper component
 */
export default function PipelineVisualization() {
  const containerRef = useRef(null);
  const vizRef = useRef(null);
  const { data, selectedStep, selectedModality } = useAppState();
  const dispatch = useAppDispatch();
  
  // Use refs for state to avoid stale closures
  const selectedStepRef = useRef(selectedStep);
  const selectedModalityRef = useRef(selectedModality);
  selectedStepRef.current = selectedStep;
  selectedModalityRef.current = selectedModality;

  // Stable click handler for pipeline steps
  const handleStepClick = useCallback((stepId) => {
    const currentSelected = selectedStepRef.current;
    const currentModality = selectedModalityRef.current;
    
    // If clicking the same step and no modality is selected, deselect
    // If a modality was selected, clicking the step clears it and shows all collect methods
    if (stepId === currentSelected && !currentModality) {
      dispatch(actions.setSelectedStep(null));
    } else if (stepId === 'collect' && currentModality) {
      // Clicking collect when a modality is selected - show all collect methods
      dispatch(actions.setSelectedModality(null));
    } else {
      dispatch(actions.setSelectedStep(stepId));
    }
  }, [dispatch]);

  // Stable click handler for data source circles
  const handleDataSourceClick = useCallback((modalityId) => {
    const currentModality = selectedModalityRef.current;
    // Toggle modality selection
    const newModality = modalityId === currentModality ? null : modalityId;
    dispatch(actions.setSelectedModality(newModality));
  }, [dispatch]);

  // Create visualization on mount and when data changes (but NOT when selectedStep changes)
  useEffect(() => {
    if (!containerRef.current || !data) return;

    // Wait for container to have dimensions (fixes race condition on initial load)
    const initViz = () => {
      const container = containerRef.current;
      if (!container || container.clientWidth === 0) {
        // Retry after a short delay if container not ready
        const retryTimeout = setTimeout(initViz, 50);
        return () => clearTimeout(retryTimeout);
      }

      // Prepare data for visualization - use all methods, not filtered
      const vizData = {
        pipelineSteps: data.pipeline_steps || [],
        methods: data.methods || [],
      };

      // Create new visualization
      vizRef.current = createPipelineVisualization(container, vizData, {
        height: 280,
        selectedStep: selectedStepRef.current,
        selectedModality: selectedModalityRef.current,
        animated: true,
        onStepClick: handleStepClick,
        onDataSourceClick: handleDataSourceClick,
        onStepHover: () => {},
      });
    };

    // Use requestAnimationFrame to ensure DOM is ready
    const rafId = requestAnimationFrame(initViz);

    // Cleanup
    return () => {
      cancelAnimationFrame(rafId);
      if (vizRef.current) {
        vizRef.current.destroy();
      }
    };
  }, [data, handleStepClick, handleDataSourceClick]);

  // Update visualization when selection changes (without recreating)
  useEffect(() => {
    if (vizRef.current) {
      vizRef.current.update({ selectedStep, selectedModality });
    }
  }, [selectedStep, selectedModality]);

  // Handle resize
  useEffect(() => {
    let resizeTimeout;
    
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (containerRef.current && data && vizRef.current) {
          const vizData = {
            pipelineSteps: data.pipeline_steps || [],
            methods: data.methods || [],
          };

          vizRef.current.destroy();
          vizRef.current = createPipelineVisualization(containerRef.current, vizData, {
            height: 280,
            selectedStep: selectedStepRef.current,
            selectedModality: selectedModalityRef.current,
            animated: false,
            onStepClick: handleStepClick,
            onDataSourceClick: handleDataSourceClick,
            onStepHover: () => {},
          });
        }
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, [data, handleStepClick, handleDataSourceClick]);

  if (!data) return null;

  return (
    <div
      ref={containerRef}
      role="figure"
      aria-label="Interactive pipeline visualization showing the process mining workflow steps"
      style={{ width: '100%', minHeight: '280px' }}
    />
  );
}
