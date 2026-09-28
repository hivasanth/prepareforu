import type { QuestionVisual } from '../../types/exam.types'

export const VISUAL_FIXTURES = {
  valid: {
    table: {
      type: 'table',
      title: 'Harappan Sites',
      data: { headers: ['Site', 'Period'], rows: [['Mohenjo-daro', '2600 BCE'], ['Kalibangan', '2500 BCE']] },
    } as QuestionVisual,
    chart: {
      type: 'chart',
      title: 'Population',
      data: { chartType: 'bar', labels: ['1976', '1992'], data: [42, 73] },
    } as QuestionVisual,
    geometry: {
      type: 'geometry',
      title: 'Triangle',
      data: { shape: 'triangle', labels: { ab: '5 cm', bc: '6 cm', angleA: '60' } },
    } as QuestionVisual,
    venn: {
      type: 'venn',
      title: 'Settlement Comparison',
      data: { setA: 'Aryans', setB: 'Dravidians', intersection: 'Both' },
    } as QuestionVisual,
    mermaid: {
      type: 'mermaid',
      title: 'Feudal Hierarchy',
      data: { code: 'graph TD;\n  Raya["Raya"] --> Nayaka["Nayaka"];' },
    } as QuestionVisual,
    latex: {
      type: 'latex',
      title: 'Area Formula',
      data: { expression: 'A = \\pi r^2' },
    } as QuestionVisual,
    svg: {
      type: 'svg',
      title: 'Pie Diagram',
      data: { svg_content: '<circle cx="50" cy="50" r="40" fill="rgba(99,102,241,0.2)" stroke="#6366f1" />' },
    } as QuestionVisual,
    map_overlay: {
      type: 'map_overlay',
      title: 'Empire Extent',
      data: { center: { lat: 22, lng: 78 }, zoom: 5, overlays: [{ lat: 17.4, lng: 78.5, label: 'Hyderabad' }] },
    } as QuestionVisual,
  },
  invalid: {
    unknownType: { type: 'hologram', data: {} } as unknown as QuestionVisual,
    emptyTable: { type: 'table', data: { headers: [], rows: [] } } as QuestionVisual,
    emptyGeometry: { type: 'geometry', data: { shape: 'square' } } as QuestionVisual,
    emptyMermaid: { type: 'mermaid', data: { code: '' } } as QuestionVisual,
    emptyChart: { type: 'chart', data: {} } as QuestionVisual,
    emptySvg: { type: 'svg', data: {} } as QuestionVisual,
    emptyLatex: { type: 'latex', data: {} } as QuestionVisual,
    noTitle: {
      type: 'table',
      data: { headers: ['Year'], rows: [['2024']] },
    } as QuestionVisual,
  },
} as const

export const ALL_VISUAL_TYPES: QuestionVisual['type'][] = [
  'table', 'chart', 'geometry', 'venn', 'mermaid', 'latex', 'svg', 'map_overlay',
]