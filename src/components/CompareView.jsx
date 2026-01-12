import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState, useAppDispatch, actions, getMethodById } from '@/lib';
import { createComparisonVisualization } from '@/viz/LandscapeViz';

/**
 * Compare bar - floating bottom bar when in compare mode
 */
export function CompareBar() {
  const { isCompareMode, compareMethodIds, data } = useAppState();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  if (!isCompareMode || compareMethodIds.length === 0) return null;

  const selectedMethods = compareMethodIds
    .map((id) => getMethodById(data, id))
    .filter(Boolean);

  const handleCompare = () => {
    if (compareMethodIds.length >= 2) {
      navigate(`/compare?methods=${compareMethodIds.join(',')}`);
    }
  };

  const handleCancel = () => {
    dispatch(actions.clearCompare());
  };

  return (
    <div className="compare-bar animate-slide-up">
      <span className="compare-bar__count">
        <span>{selectedMethods.length}</span> selected
      </span>
      <button className="btn btn--ghost btn--sm" onClick={handleCancel}>
        Clear
      </button>
      <button
        className="btn btn--primary btn--sm"
        onClick={handleCompare}
        disabled={selectedMethods.length < 2}
      >
        Compare →
      </button>
    </div>
  );
}

/**
 * Comparison view component with table and radar chart
 */
export function ComparisonView({ methodIds }) {
  const { data } = useAppState();
  const radarRef = useRef(null);
  const vizRef = useRef(null);

  const methods = methodIds
    .map((id) => getMethodById(data, id))
    .filter(Boolean);

  useEffect(() => {
    if (radarRef.current && methods.length >= 2) {
      vizRef.current = createComparisonVisualization(radarRef.current, methods, {
        width: 400,
        height: 360,
      });
    }

    return () => {
      if (vizRef.current) {
        vizRef.current.destroy();
      }
    };
  }, [methods]);

  if (methods.length < 2) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon">⚖️</div>
        <h3 className="empty-state__title">Select methods to compare</h3>
        <p className="empty-state__text">
          Please select at least 2 methods to compare.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 'var(--sp-6)', alignItems: 'start' }}>
      {/* Comparison Table */}
      <div style={{ 
        background: 'var(--surface)', 
        borderRadius: 'var(--radius-lg)', 
        border: '1px solid var(--border-subtle)',
        overflow: 'hidden' 
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: 'var(--surface-raised)' }}>
              <th style={{ padding: 'var(--sp-3) var(--sp-4)', textAlign: 'left', fontWeight: 500, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Attribute
              </th>
              {methods.map((m) => (
                <th key={m.id} style={{ padding: 'var(--sp-3) var(--sp-4)', textAlign: 'left', fontWeight: 500, color: 'var(--text)' }}>
                  {m.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { label: 'Pipeline Step', key: (m) => m.pipeline_step.replace('_', ' ') },
              { label: 'Maturity', key: (m) => m.maturity || '—' },
              { label: 'Automation', key: (m) => m.automation_level || '—' },
              { label: 'Modalities', key: (m) => m.modalities?.join(', ') || '—' },
              { label: 'Tasks', key: (m) => m.tasks?.join(', ') || '—' },
              { label: 'Year', key: (m) => m.references?.year || '—' },
              { label: 'Evidence Type', key: (m) => m.evidence_type || '—' },
              { label: 'Inputs', key: (m) => m.inputs?.length || 0 },
              { label: 'Outputs', key: (m) => m.outputs?.length || 0 },
            ].map((row, idx) => (
              <tr key={row.label} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: 'var(--sp-3) var(--sp-4)', color: 'var(--text-muted)', fontWeight: 500 }}>
                  {row.label}
                </td>
                {methods.map((m) => (
                  <td key={m.id} style={{ padding: 'var(--sp-3) var(--sp-4)', color: 'var(--text-secondary)' }}>
                    {row.key(m)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Radar Chart */}
      <div
        ref={radarRef}
        style={{
          background: 'var(--bg-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--sp-4)',
          minWidth: '400px',
        }}
      />
    </div>
  );
}
