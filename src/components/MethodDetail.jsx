import { useNavigate } from 'react-router-dom';
import { useAppState, getMethodById, getRelatedMethods, getPipelineStepById } from '@/lib';
import '@/styles/detail.css';

/**
 * Format paper URL correctly
 * Handles: bare DOI, full DOI URL, or regular URL
 */
function formatPaperUrl(doiOrUrl) {
  if (!doiOrUrl) return null;
  
  // Already a full URL (http or https)
  if (doiOrUrl.startsWith('http://') || doiOrUrl.startsWith('https://')) {
    return doiOrUrl;
  }
  
  // Looks like a DOI (starts with 10.)
  if (doiOrUrl.startsWith('10.')) {
    return `https://doi.org/${doiOrUrl}`;
  }
  
  // Fallback: assume it's a DOI
  return `https://doi.org/${doiOrUrl}`;
}

/**
 * Method detail panel/page component
 */
export default function MethodDetail({ methodId, onClose }) {
  const navigate = useNavigate();
  const { data } = useAppState();

  if (!data) return null;

  const method = getMethodById(data, methodId);

  if (!method) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon">❌</div>
        <h3 className="empty-state__title">Method not found</h3>
        <p className="empty-state__text">The method "{methodId}" could not be found.</p>
        <button className="btn btn--primary" onClick={() => navigate('/')}>
          Back to Explorer
        </button>
      </div>
    );
  }

  const step = getPipelineStepById(data, method.pipeline_step);
  const relatedMethods = getRelatedMethods(data, methodId);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate('/');
    }
  };

  const handleRelatedClick = (relatedId) => {
    navigate(`/methods/${relatedId}`);
  };

  return (
    <>
      {onClose && <div className="method-detail__backdrop" onClick={handleClose} />}
      <div className="method-detail" role="dialog" aria-labelledby="method-title">
        <div className="method-detail__header">
          <div>
            <span className="method-detail__step">
              {step?.name || method.pipeline_step.replace('_', ' ')}
            </span>
            <h1 id="method-title" className="method-detail__title">
              {method.name}
            </h1>
          </div>
          <button
            className="method-detail__close"
            onClick={handleClose}
            aria-label="Close detail panel"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="method-detail__content">
          {/* Description */}
          <section className="method-detail__section">
            <h2 className="method-detail__section-title">Description</h2>
            <p className="method-detail__section-content">{method.short_description}</p>
          </section>

          {/* Algorithm Summary */}
          <section className="method-detail__section">
            <h2 className="method-detail__section-title">Algorithm Summary</h2>
            <p className="method-detail__section-content">{method.algorithm_summary}</p>
          </section>

          {/* Inputs & Outputs */}
          <section className="method-detail__section">
            <div className="method-detail__grid">
              <div>
                <h2 className="method-detail__section-title">Inputs</h2>
                <ul className="method-detail__list">
                  {method.inputs.map((input, i) => (
                    <li key={i} className="method-detail__list-item">{input}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h2 className="method-detail__section-title">Outputs</h2>
                <ul className="method-detail__list">
                  {method.outputs.map((output, i) => (
                    <li key={i} className="method-detail__list-item">{output}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Modalities & Tasks */}
          <section className="method-detail__section">
            <h2 className="method-detail__section-title">Modalities & Tasks</h2>
            <div className="method-detail__tags">
              {method.modalities.map((mod) => (
                <span key={mod} className={`tag tag--${mod}`}>{mod}</span>
              ))}
              {method.tasks.map((task) => (
                <span key={task} className="tag">{task}</span>
              ))}
            </div>
          </section>

          {/* Assumptions */}
          {method.assumptions && method.assumptions.length > 0 && (
            <section className="method-detail__section">
              <h2 className="method-detail__section-title">Assumptions</h2>
              <ul className="method-detail__list">
                {method.assumptions.map((assumption, i) => (
                  <li key={i} className="method-detail__list-item">{assumption}</li>
                ))}
              </ul>
            </section>
          )}

          {/* Limitations */}
          {method.limitations && method.limitations.length > 0 && (
            <section className="method-detail__section">
              <h2 className="method-detail__section-title">Limitations</h2>
              <ul className="method-detail__list">
                {method.limitations.map((limitation, i) => (
                  <li key={i} className="method-detail__list-item">{limitation}</li>
                ))}
              </ul>
            </section>
          )}

          {/* Reference */}
          <section className="method-detail__section">
            <h2 className="method-detail__section-title">Reference</h2>
            <div className="method-detail__reference">
              <p className="method-detail__reference-title">{method.references.paper_title}</p>
              <p className="method-detail__reference-authors">
                {method.references.authors.join(', ')}
              </p>
              <p className="method-detail__reference-meta">
                {method.references.venue}, {method.references.year}, {method.references.doi_or_url}
              </p>
              {method.references.doi_or_url && (
                <a
                  href={formatPaperUrl(method.references.doi_or_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn--sm btn--secondary"
                  style={{ marginTop: 'var(--sp-3)' }}
                >
                  View Paper →
                </a>
              )}
            </div>
          </section>

          {/* Artifacts */}
          {method.artifacts && Object.keys(method.artifacts).length > 0 && (
            <section className="method-detail__section">
              <h2 className="method-detail__section-title">Artifacts</h2>
              <div className="method-detail__artifacts">
                {method.artifacts.code_url && (
                  <a href={method.artifacts.code_url} target="_blank" rel="noopener noreferrer" className="btn btn--sm btn--secondary">
                    Code →
                  </a>
                )}
                {method.artifacts.dataset_url && (
                  <a href={method.artifacts.dataset_url} target="_blank" rel="noopener noreferrer" className="btn btn--sm btn--secondary">
                    Dataset →
                  </a>
                )}
                {method.artifacts.demo_url && (
                  <a href={method.artifacts.demo_url} target="_blank" rel="noopener noreferrer" className="btn btn--sm btn--secondary">
                    Demo →
                  </a>
                )}
              </div>
            </section>
          )}

          {/* Tags */}
          {method.tags && method.tags.length > 0 && (
            <section className="method-detail__section">
              <h2 className="method-detail__section-title">Tags</h2>
              <div className="method-detail__tags">
                {method.tags.map((tag) => (
                  <span key={tag} className="tag">#{tag}</span>
                ))}
              </div>
            </section>
          )}

          {/* Related Methods */}
          {relatedMethods.length > 0 && (
            <section className="method-detail__section">
              <h2 className="method-detail__section-title">Related Methods</h2>
              <div className="related-methods">
                {relatedMethods.map((related) => (
                  <div
                    key={related.id}
                    className="related-method"
                    onClick={() => handleRelatedClick(related.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleRelatedClick(related.id);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`View ${related.name}`}
                  >
                    <span className="related-method__name">{related.name}</span>
                    <span className="related-method__relationship">{related.relationship}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Metadata */}
          <section className="method-detail__section" style={{ marginTop: 'var(--sp-8)' }}>
            <p style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
              Created: {new Date(method.created_at).toLocaleDateString()} · 
              Updated: {new Date(method.updated_at).toLocaleDateString()}
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
