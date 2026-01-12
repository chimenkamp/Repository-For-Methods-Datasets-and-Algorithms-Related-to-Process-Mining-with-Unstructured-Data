import { useRef, useEffect, useState } from 'react';
import { createLandscapeVisualization } from '@/viz/LandscapeViz';
import { useAppState, useAppDispatch, actions } from '@/lib';
import { useNavigate } from 'react-router-dom';

/**
 * Landscape visualization React wrapper component
 */
export default function LandscapeVisualization() {
  const containerRef = useRef(null);
  const vizRef = useRef(null);
  const { data, selectedStep, selectedMethodId, filteredMethods } = useAppState();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [colorBy, setColorBy] = useState('modality');
  const [yAxis, setYAxis] = useState('maturity');

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

      const vizData = {
        pipelineSteps: data.pipeline_steps || [],
        methods: filteredMethods,
      };

      vizRef.current = createLandscapeVisualization(container, vizData, {
        height: 320,
        selectedMethodId,
        highlightedStep: selectedStep,
        colorBy,
        yAxis,
        onMethodClick: (methodId) => {
          navigate(`/methods/${methodId}`);
        },
        onMethodHover: (methodId) => {
          dispatch(actions.setHoveredMethod(methodId));
        },
      });
    };

    // Use requestAnimationFrame to ensure DOM is ready
    const rafId = requestAnimationFrame(initViz);

    return () => {
      cancelAnimationFrame(rafId);
      if (vizRef.current) {
        vizRef.current.destroy();
      }
    };
  }, [data, filteredMethods, colorBy, yAxis]);

  useEffect(() => {
    if (vizRef.current) {
      vizRef.current.update({
        selectedMethodId,
        highlightedStep: selectedStep,
      });
    }
  }, [selectedStep, selectedMethodId]);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && data && vizRef.current) {
        vizRef.current.destroy();

        const vizData = {
          pipelineSteps: data.pipeline_steps || [],
          methods: filteredMethods,
        };

        vizRef.current = createLandscapeVisualization(containerRef.current, vizData, {
          height: 320,
          selectedMethodId,
          highlightedStep: selectedStep,
          colorBy,
          yAxis,
          onMethodClick: (methodId) => {
            navigate(`/methods/${methodId}`);
          },
          onMethodHover: (methodId) => {
            dispatch(actions.setHoveredMethod(methodId));
          },
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [data, filteredMethods, colorBy, yAxis, selectedMethodId, selectedStep, dispatch, navigate]);

  if (!data) return null;

  return (
    <div
      ref={containerRef}
      role="figure"
      aria-label="Interactive scatter plot showing methods by pipeline step and maturity"
      style={{ width: '100%', minHeight: '320px' }}
    />
  );
}
