import * as d3 from 'd3';
import { STEP_COLORS, MODALITY_COLORS } from './PipelineViz';

/**
 * Landscape Visualization - Refined D3.js Component
 * Scatterplot with proper typography and subtle design
 */

// Design tokens (matching CSS)
const TOKENS = {
  bg: '#2e3440',
  bgSubtle: '#323845',
  surface: '#3b4252',
  surfaceRaised: '#434c5e',
  text: '#eceff4',
  textSecondary: '#d8dee9',
  textMuted: '#9aa5b8',
  border: 'rgba(76, 86, 106, 0.5)',
  accent: '#88c0d0',
};

const MATURITY_ORDER = {
  research: 0,
  emerging: 1,
  established: 2,
  mature: 3,
};

const MATURITY_LABELS = {
  0: 'Research',
  1: 'Emerging',
  2: 'Established',
  3: 'Mature',
};

const AUTOMATION_ORDER = {
  manual: 0,
  'semi-automated': 1,
  automated: 2,
};

/**
 * Creates the refined landscape scatter plot
 */
export function createLandscapeVisualization(container, data, options = {}) {
  const containerWidth = container.clientWidth;
  
  // Early return if container has no width yet
  if (!containerWidth || containerWidth === 0) {
    return {
      update: () => {},
      destroy: () => {},
    };
  }

  const {
    width = containerWidth,
    height = options.height || 320,
    onMethodClick = () => {},
    onMethodHover = () => {},
    selectedMethodId = null,
    highlightedStep = null,
    colorBy = 'modality',
    yAxis = 'maturity',
  } = options;

  d3.select(container).selectAll('*').remove();

  const margin = { top: 24, right: 120, bottom: 50, left: 60 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const svg = d3
    .select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('role', 'img')
    .attr('aria-label', 'Method landscape visualization')
    .style('font-family', 'Inter, -apple-system, BlinkMacSystemFont, sans-serif');

  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  // Prepare data
  const methods = data.methods.map((m) => ({
    ...m,
    stepOrder: data.pipelineSteps.find((s) => s.id === m.pipeline_step)?.order || 0,
    maturityValue: MATURITY_ORDER[m.maturity] ?? 1,
    automationValue: AUTOMATION_ORDER[m.automation_level] ?? 1,
    primaryModality: m.modalities[0] || 'mixed',
  }));

  // Scales
  const xScale = d3
    .scaleLinear()
    .domain([0.5, data.pipelineSteps.length + 0.5])
    .range([0, innerWidth]);

  const yDomain = yAxis === 'maturity' ? [0, 3] : [0, 2];
  const yLabels = yAxis === 'maturity' ? MATURITY_LABELS : { 0: 'Manual', 1: 'Semi-Auto', 2: 'Automated' };

  const yScale = d3.scaleLinear().domain(yDomain).range([innerHeight, 0]);

  // Add jitter
  const jitteredMethods = methods.map((m) => {
    const jitterX = (Math.random() - 0.5) * 0.5;
    const jitterY = (Math.random() - 0.5) * 0.35;
    return {
      ...m,
      cx: xScale(m.stepOrder + jitterX),
      cy: yScale((yAxis === 'maturity' ? m.maturityValue : m.automationValue) + jitterY),
    };
  });

  // Subtle grid lines
  const gridGroup = g.append('g').attr('class', 'grid');

  // Horizontal grid only (cleaner)
  Object.keys(yLabels).forEach((key) => {
    const yVal = parseInt(key);
    gridGroup
      .append('line')
      .attr('x1', 0)
      .attr('y1', yScale(yVal))
      .attr('x2', innerWidth)
      .attr('y2', yScale(yVal))
      .attr('stroke', TOKENS.border)
      .attr('stroke-dasharray', '2,4')
      .attr('opacity', 0.5);
  });

  // X Axis - pipeline step labels
  const xAxisGroup = g
    .append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0,${innerHeight})`);

  data.pipelineSteps.forEach((step) => {
    const xPos = xScale(step.order);
    
    // Step name (shortened)
    xAxisGroup
      .append('text')
      .attr('x', xPos)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .attr('fill', TOKENS.textMuted)
      .attr('font-size', '11px')
      .text(step.name.split(/[\s/]+/).slice(0, 2).join(' '));

    // Small step number
    xAxisGroup
      .append('text')
      .attr('x', xPos)
      .attr('y', 36)
      .attr('text-anchor', 'middle')
      .attr('fill', TOKENS.textMuted)
      .attr('font-size', '10px')
      .attr('font-feature-settings', '"tnum"')
      .text(step.order);
  });

  // Y Axis
  const yAxisGroup = g.append('g').attr('class', 'y-axis');

  Object.entries(yLabels).forEach(([key, label]) => {
    const yVal = parseInt(key);
    yAxisGroup
      .append('text')
      .attr('x', -12)
      .attr('y', yScale(yVal))
      .attr('dy', '0.35em')
      .attr('text-anchor', 'end')
      .attr('fill', TOKENS.textMuted)
      .attr('font-size', '11px')
      .text(label);
  });

  // Y axis label
  yAxisGroup
    .append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -innerHeight / 2)
    .attr('y', -48)
    .attr('text-anchor', 'middle')
    .attr('fill', TOKENS.textMuted)
    .attr('font-size', '11px')
    .attr('font-weight', '500')
    .text(yAxis === 'maturity' ? 'Maturity Level' : 'Automation Level');

  // Tooltip - refined styling
  const tooltip = d3
    .select(container)
    .append('div')
    .attr('class', 'tooltip')
    .style('position', 'absolute')
    .style('visibility', 'hidden')
    .style('background', TOKENS.surfaceRaised)
    .style('color', TOKENS.text)
    .style('padding', '12px 14px')
    .style('border-radius', '6px')
    .style('border', `1px solid ${TOKENS.border}`)
    .style('font-size', '12px')
    .style('line-height', '1.5')
    .style('box-shadow', '0 4px 12px rgba(0,0,0,0.25)')
    .style('pointer-events', 'none')
    .style('z-index', '100')
    .style('max-width', '260px');

  // Draw method points
  const methodPoints = g
    .selectAll('.method-point')
    .data(jitteredMethods)
    .enter()
    .append('g')
    .attr('class', 'method-point')
    .attr('transform', (d) => `translate(${d.cx},${d.cy})`)
    .style('cursor', 'pointer')
    .attr('role', 'button')
    .attr('tabindex', 0);

  // Method circles - smaller, more refined
  methodPoints
    .append('circle')
    .attr('r', 0)
    .attr('fill', (d) => {
      if (colorBy === 'modality') {
        return MODALITY_COLORS[d.primaryModality] || MODALITY_COLORS.mixed;
      }
      return STEP_COLORS[d.pipeline_step] || '#81a1c1';
    })
    .attr('stroke', 'transparent')
    .attr('stroke-width', 2)
    .attr('opacity', (d) => {
      if (highlightedStep && d.pipeline_step !== highlightedStep) return 0.25;
      return 0.85;
    })
    .transition()
    .duration(400)
    .delay((d, i) => i * 15)
    .attr('r', 10);

  // Interactions
  methodPoints
    .on('mouseenter', function (event, d) {
      d3.select(this).select('circle')
        .transition()
        .duration(100)
        .attr('r', 12)
        .attr('stroke', TOKENS.text)
        .attr('opacity', 1);

      tooltip
        .style('visibility', 'visible')
        .html(`
          <div style="font-weight: 500; margin-bottom: 4px;">${d.name}</div>
          <div style="font-size: 11px; color: ${TOKENS.textMuted}; margin-bottom: 6px;">
            ${d.pipeline_step.replace('_', ' ')} · ${d.references?.year || 'N/A'}
          </div>
          <div style="font-size: 11px; color: ${TOKENS.textSecondary};">
            ${d.modalities.join(', ')}
          </div>
        `);

      onMethodHover(d.id);
    })
    .on('mousemove', function (event) {
      const containerRect = container.getBoundingClientRect();
      tooltip
        .style('left', event.clientX - containerRect.left + 12 + 'px')
        .style('top', event.clientY - containerRect.top - 8 + 'px');
    })
    .on('mouseleave', function (event, d) {
      d3.select(this).select('circle')
        .transition()
        .duration(100)
        .attr('r', 10)
        .attr('stroke', 'transparent')
        .attr('opacity', highlightedStep && d.pipeline_step !== highlightedStep ? 0.25 : 0.85);

      tooltip.style('visibility', 'hidden');
      onMethodHover(null);
    })
    .on('click', function (event, d) {
      event.stopPropagation();
      onMethodClick(d.id);
    })
    .on('keydown', function (event, d) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onMethodClick(d.id);
      }
    });

  // Legend - compact, right side
  const legendGroup = svg
    .append('g')
    .attr('class', 'legend')
    .attr('transform', `translate(${width - margin.right + 16}, ${margin.top})`);

  legendGroup
    .append('text')
    .attr('x', 0)
    .attr('y', 0)
    .attr('fill', TOKENS.textMuted)
    .attr('font-size', '10px')
    .attr('font-weight', '500')
    .attr('text-transform', 'uppercase')
    .attr('letter-spacing', '0.05em')
    .text(colorBy === 'modality' ? 'Modality' : 'Step');

  const legendItems = colorBy === 'modality' 
    ? Object.entries(MODALITY_COLORS) 
    : Object.entries(STEP_COLORS);

  legendItems.forEach(([key, color], i) => {
    const itemGroup = legendGroup
      .append('g')
      .attr('transform', `translate(0, ${16 + i * 18})`);

    itemGroup.append('circle').attr('r', 5).attr('cx', 5).attr('cy', 0).attr('fill', color);

    itemGroup
      .append('text')
      .attr('x', 15)
      .attr('y', 3)
      .attr('fill', TOKENS.textMuted)
      .attr('font-size', '10px')
      .text(key.replace('_', ' '));
  });

  function update(newOptions = {}) {
    const { selectedMethodId: newSelected, highlightedStep: newHighlight } = newOptions;

    methodPoints.selectAll('circle')
      .transition()
      .duration(150)
      .attr('stroke', (d) => {
        if (newSelected === d.id) return TOKENS.text;
        return 'transparent';
      })
      .attr('opacity', (d) => {
        if (newHighlight && d.pipeline_step !== newHighlight) return 0.25;
        return 0.85;
      });
  }

  return {
    update,
    destroy: () => {
      tooltip.remove();
      d3.select(container).selectAll('*').remove();
    },
  };
}

/**
 * Creates a comparison radar visualization
 */
export function createComparisonVisualization(container, methods, options = {}) {
  const { width = 400, height = 360 } = options;

  d3.select(container).selectAll('*').remove();

  if (!methods || methods.length < 2) {
    d3.select(container)
      .append('div')
      .style('color', TOKENS.textMuted)
      .style('text-align', 'center')
      .style('padding', '40px')
      .style('font-size', '13px')
      .text('Select 2-3 methods to compare');
    return { destroy: () => d3.select(container).selectAll('*').remove() };
  }

  const svg = d3
    .select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('font-family', 'Inter, -apple-system, BlinkMacSystemFont, sans-serif');

  const centerX = width / 2;
  const centerY = height / 2 + 20;
  const radius = Math.min(width, height) / 2 - 70;

  const dimensions = [
    { key: 'maturity', label: 'Maturity', max: 3 },
    { key: 'automation', label: 'Automation', max: 2 },
    { key: 'modalities', label: 'Modalities', max: 6 },
    { key: 'tasks', label: 'Tasks', max: 10 },
    { key: 'inputs', label: 'Inputs', max: 5 },
    { key: 'outputs', label: 'Outputs', max: 5 },
  ];

  const angleSlice = (2 * Math.PI) / dimensions.length;

  const axisGroup = svg.append('g').attr('transform', `translate(${centerX},${centerY})`);

  // Circular grid - subtle
  [0.25, 0.5, 0.75, 1].forEach((level) => {
    axisGroup
      .append('circle')
      .attr('r', radius * level)
      .attr('fill', 'none')
      .attr('stroke', TOKENS.border)
      .attr('stroke-dasharray', level === 1 ? 'none' : '2,4');
  });

  // Axis lines and labels
  dimensions.forEach((dim, i) => {
    const angle = angleSlice * i - Math.PI / 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    axisGroup
      .append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', x)
      .attr('y2', y)
      .attr('stroke', TOKENS.border);

    axisGroup
      .append('text')
      .attr('x', Math.cos(angle) * (radius + 16))
      .attr('y', Math.sin(angle) * (radius + 16))
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', TOKENS.textMuted)
      .attr('font-size', '10px')
      .text(dim.label);
  });

  // Method colors - accent-based
  const methodColors = [TOKENS.accent, '#a3be8c', '#b48ead'];

  methods.forEach((method, mIndex) => {
    const values = dimensions.map((dim) => {
      switch (dim.key) {
        case 'maturity':
          return (MATURITY_ORDER[method.maturity] ?? 1) / dim.max;
        case 'automation':
          return (AUTOMATION_ORDER[method.automation_level] ?? 1) / dim.max;
        case 'modalities':
          return Math.min(method.modalities?.length || 1, dim.max) / dim.max;
        case 'tasks':
          return Math.min(method.tasks?.length || 1, dim.max) / dim.max;
        case 'inputs':
          return Math.min(method.inputs?.length || 1, dim.max) / dim.max;
        case 'outputs':
          return Math.min(method.outputs?.length || 1, dim.max) / dim.max;
        default:
          return 0.5;
      }
    });

    const points = values.map((val, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      return {
        x: Math.cos(angle) * radius * val,
        y: Math.sin(angle) * radius * val,
      };
    });

    const lineGenerator = d3
      .lineRadial()
      .angle((d, i) => angleSlice * i)
      .radius((d) => d * radius)
      .curve(d3.curveLinearClosed);

    axisGroup
      .append('path')
      .datum(values)
      .attr('d', lineGenerator)
      .attr('fill', methodColors[mIndex])
      .attr('fill-opacity', 0.15)
      .attr('stroke', methodColors[mIndex])
      .attr('stroke-width', 2);

    points.forEach((point) => {
      axisGroup
        .append('circle')
        .attr('cx', point.x)
        .attr('cy', point.y)
        .attr('r', 3)
        .attr('fill', methodColors[mIndex]);
    });
  });

  // Legend - top
  const legend = svg.append('g').attr('transform', `translate(16, 16)`);

  methods.forEach((method, i) => {
    const item = legend.append('g').attr('transform', `translate(0, ${i * 18})`);

    item.append('circle').attr('r', 4).attr('cx', 4).attr('cy', 0).attr('fill', methodColors[i]);

    item
      .append('text')
      .attr('x', 14)
      .attr('y', 3)
      .attr('fill', TOKENS.text)
      .attr('font-size', '11px')
      .attr('font-weight', '500')
      .text(method.name.length > 28 ? method.name.substring(0, 28) + '…' : method.name);
  });

  return {
    destroy: () => d3.select(container).selectAll('*').remove(),
  };
}

export { MATURITY_ORDER, AUTOMATION_ORDER };
