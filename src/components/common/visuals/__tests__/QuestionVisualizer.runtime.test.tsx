import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import React, { Suspense } from 'react'
import { ThemeProvider } from '../../../../context/ThemeContext'

// ─── mock mermaid (jsdom can't run real SVG render) ───────────────────────
vi.mock('mermaid', () => {
  const safe = {
    initialize: vi.fn(),
    render: vi.fn().mockImplementation((_id: string, code: string) => {
      if (!code || code.includes('CRASH')) return Promise.reject(new Error('parse failed'))
      return Promise.resolve({ svg: `<svg aria-hidden="true"><text>${code}</text></svg>` })
    }),
  }
  return { default: safe, ...safe }
})

// ─── mock recharts (jsdom ResponsiveContainer width=0 renders nothing) ───
vi.mock('recharts', () => {
  const stub = (name: string) => {
    const C = ({ children, ...rest }: any) => React.createElement('div', { 'data-recharts': name, ...rest }, children)
    C.displayName = name
    return C
  }
  return {
    ResponsiveContainer: ({ children }: any) => <div data-testid="rsc">{children}</div>,
    BarChart: stub('BarChart'),
    Bar: stub('Bar'),
    XAxis: stub('XAxis'),
    YAxis: stub('YAxis'),
    CartesianGrid: stub('CartesianGrid'),
    Tooltip: stub('Tooltip'),
    Cell: stub('Cell'),
    PieChart: stub('PieChart'),
    Pie: stub('Pie'),
    AreaChart: stub('AreaChart'),
    Area: stub('Area'),
    Legend: stub('Legend'),
  }
})

// ─── mock react-simple-maps ──────────────────────────────────────────────
vi.mock('react-simple-maps', () => ({
  ComposableMap: ({ children }: any) => <div data-testid="composable-map">{children}</div>,
  Geographies: ({ children }: any) => {
    return <div data-testid="geographies">{children({ geographies: [{ rsmKey: 'geo-1', properties: { name: 'Testland' } }] })}</div>
  },
  Geography: () => <div data-testid="geography" />,
  Marker: ({ children, coordinates }: any) => (
    <div data-testid="marker" data-coords={JSON.stringify(coordinates)}>{children}</div>
  ),
}))

// ─── mock katex ──────────────────────────────────────────────────────────
vi.mock('katex', () => ({
  default: {
    renderToString: (expr: string) => {
      if (!expr || expr.includes('BREAK')) throw new Error('KaTeX parse error')
      return `<span class="katex">${expr}</span>`
    },
  },
}))

// ─── mock DOMPurify ──────────────────────────────────────────────────────
vi.mock('dompurify', () => ({
  default: {
    sanitize: (html: string) =>
      html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/on\w+="[^"]*"/gi, ''),
  },
}))

import mermaid from 'mermaid'
import { QuestionVisualizer } from '../../QuestionVisualizer'
import { MermaidDiagram } from '../../../visualizers/MermaidDiagram'
import { ChartVisualizer } from '../../../visualizers/ChartVisualizer'
import { MapVisualizer } from '../../../visualizers/MapVisualizer'
import VisualErrorBoundary from '../VisualErrorBoundary'
import { VISUAL_FIXTURES, ALL_VISUAL_TYPES } from '../../../../test/fixtures/visuals'
import type { QuestionVisual } from '../../../../types/exam.types'

function Wrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider><Suspense fallback={<div>loading</div>}>{children}</Suspense></ThemeProvider>
}

afterEach(() => cleanup())

/* ═══════════════════════════════════════════════════════════════════════════
   1. UNKNOWN / INVALID TYPE fallbacks
   ═══════════════════════════════════════════════════════════════════════════ */
describe('QuestionVisualizer — unknown and invalid type fallbacks', () => {
  it('renders a controlled fallback for an unknown type (hologram)', () => {
    render(<QuestionVisualizer visual={{ type: 'hologram', data: {} } as any} />, { wrapper: Wrapper })
    expect(screen.getByText(/visual could not be rendered/i)).toBeInTheDocument()
    expect(screen.getByText(/visual/i)).toBeInTheDocument()
  })

  it('renders a controlled fallback for an empty string type', () => {
    render(<QuestionVisualizer visual={{ type: '', data: {} } as unknown as QuestionVisual} />, { wrapper: Wrapper })
    expect(screen.getByText(/visual could not be rendered/i)).toBeInTheDocument()
  })

  it('renders a controlled fallback for a completely empty visual object', () => {
    render(<QuestionVisualizer visual={{} as any} />, { wrapper: Wrapper })
    expect(screen.getByText(/visual could not be rendered/i)).toBeInTheDocument()
  })
})

/* ═══════════════════════════════════════════════════════════════════════════
   2. ALL 8 CANONICAL TYPES — render check
   ═══════════════════════════════════════════════════════════════════════════ */
describe('QuestionVisualizer — canonical type rendering', () => {
  for (const type of ALL_VISUAL_TYPES) {
    it(`${type}: renders its title and an img container`, async () => {
      const visual = VISUAL_FIXTURES.valid[type] ?? VISUAL_FIXTURES.valid.table
      render(<QuestionVisualizer visual={visual} />, { wrapper: Wrapper })
      if (visual.title) {
        expect(screen.getByText(visual.title)).toBeInTheDocument()
      }
      expect(screen.getByRole('img')).toBeInTheDocument()
    })
  }
})

/* ═══════════════════════════════════════════════════════════════════════════
   3. TABLE semantics + a11y
   ═══════════════════════════════════════════════════════════════════════════ */
describe('table visual — semantics', () => {
  it('renders semantic th with scope=col', () => {
    render(<QuestionVisualizer visual={VISUAL_FIXTURES.valid.table} />, { wrapper: Wrapper })
    const th = screen.getByText('Site')
    expect(th.tagName).toBe('TH')
    expect(th).toHaveAttribute('scope', 'col')
  })

  it('empty headers render fallback', () => {
    render(<QuestionVisualizer visual={VISUAL_FIXTURES.invalid.emptyTable} />, { wrapper: Wrapper })
    expect(screen.getByText(/visual could not be rendered/i)).toBeInTheDocument()
  })
})

/* ═══════════════════════════════════════════════════════════════════════════
   4. CHART empty state
   ═══════════════════════════════════════════════════════════════════════════ */
describe('chart visual — empty state', () => {
  it('renders fallback when data has no series values', () => {
    render(<ChartVisualizer data={{}} />, { wrapper: Wrapper })
    expect(screen.getByText(/visual could not be rendered/i)).toBeInTheDocument()
  })
})

/* ═══════════════════════════════════════════════════════════════════════════
   5. MERMAID — theme and errors
   ═══════════════════════════════════════════════════════════════════════════ */
describe('MermaidDiagram — theme and error handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders SVG on valid code', async () => {
    render(<MermaidDiagram code="graph TD; A-->B;" />, { wrapper: Wrapper })
    const container = screen.getByTestId('mermaid-container') as HTMLElement
    await vi.waitFor(() => expect(container.querySelector('svg')).toBeTruthy())
  })

  it('renders fallback on empty code', () => {
    render(<MermaidDiagram code="" />, { wrapper: Wrapper })
    expect(screen.getByText(/visual could not be rendered/i)).toBeInTheDocument()
  })

  it('renders fallback on mermaid parse failure', async () => {
    render(<MermaidDiagram code="CRASH THIS" />, { wrapper: Wrapper })
    await screen.findByText(/visual could not be rendered/i)
    expect(screen.getByText(/visual could not be rendered/i)).toBeInTheDocument()
  })

  it('calls mermaid.initialize with dark theme (default)', () => {
    render(<MermaidDiagram code="graph TD;" />, { wrapper: Wrapper })
    const darkInit = (mermaid.initialize as any).mock.calls.find(
      (c: any[]) => c[0]?.theme === 'dark'
    )
    expect(darkInit).toBeTruthy()
  })
})

/* ═══════════════════════════════════════════════════════════════════════════
   6. SVG — sanitization + a11y
   ═══════════════════════════════════════════════════════════════════════════ */
describe('svg visual — security', () => {
  it('passes through DOMPurify and renders an svg element', () => {
    render(<QuestionVisualizer visual={VISUAL_FIXTURES.valid.svg} />, { wrapper: Wrapper })
    const svg = document.querySelector('svg')
    expect(svg).toBeTruthy()
  })
})

/* ═══════════════════════════════════════════════════════════════════════════
   7. MAP — overlay + a11y
   ═══════════════════════════════════════════════════════════════════════════ */
describe('map visual — overlay and a11y', () => {
  it('renders markers with labels', () => {
    render(<MapVisualizer data={VISUAL_FIXTURES.valid.map_overlay.data} />, { wrapper: Wrapper })
    expect(screen.getByText('Hyderabad')).toBeInTheDocument()
    expect(screen.getAllByTestId('marker')).toHaveLength(1)
  })

  it('has a meaningful aria-label on the container', () => {
    render(<QuestionVisualizer visual={VISUAL_FIXTURES.valid.map_overlay} />, { wrapper: Wrapper })
    const img = screen.getByRole('img')
    expect(img.getAttribute('aria-label')).toBeTruthy()
  })
})

/* ═══════════════════════════════════════════════════════════════════════════
   8. GEOMETRY / VENN parity check
   ═══════════════════════════════════════════════════════════════════════════ */
describe('geometry and venn — parity', () => {
  it('triangle renders labels', () => {
    render(<QuestionVisualizer visual={VISUAL_FIXTURES.valid.geometry} />, { wrapper: Wrapper })
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('5 cm')).toBeInTheDocument()
  })

  it('venn renders both sets and intersection', () => {
    render(<QuestionVisualizer visual={VISUAL_FIXTURES.valid.venn} />, { wrapper: Wrapper })
    expect(screen.getByText('Aryans')).toBeInTheDocument()
    expect(screen.getByText('Dravidians')).toBeInTheDocument()
    expect(screen.getByText('Both')).toBeInTheDocument()
  })

  it('unknown geometry shape renders fallback', () => {
    render(<QuestionVisualizer visual={VISUAL_FIXTURES.invalid.emptyGeometry} />, { wrapper: Wrapper })
    expect(screen.getByText(/visual could not be rendered/i)).toBeInTheDocument()
  })
})

/* ═══════════════════════════════════════════════════════════════════════════
   9. ERROR BOUNDARY isolation — render error in one visual doesn't crash parent
   ═══════════════════════════════════════════════════════════════════════════ */
describe('QuestionVisualizer — error isolation', () => {
  it('katex throw on invalid expression → fallback instead of crash', async () => {
    render(
      <QuestionVisualizer visual={{ type: 'latex', data: { expression: 'BREAK this' } } as any} />,
      { wrapper: Wrapper }
    )
    // katex mock throws, MathBlock catches → fallback shown (lazy chunk loads first)
    expect(await screen.findByText(/visual could not be rendered/i)).toBeInTheDocument()
  })

  it('a render crash inside a visual is contained by the boundary', () => {
    const Boom = () => { throw new Error('boom') }
    render(
      <VisualErrorBoundary visualType="table" title="T">
        <Boom />
      </VisualErrorBoundary>,
      { wrapper: Wrapper }
    )
    expect(screen.getByText(/visual could not be rendered/i)).toBeInTheDocument()
  })
})

/* ═══════════════════════════════════════════════════════════════════════════
   10. DATA-CONTRACT STATIC CHECKS (browser security)
   ═══════════════════════════════════════════════════════════════════════════ */
describe('visual rendering — security constraints', () => {
  it('DOMPurify strips scripts from svg payloads', () => {
    const malicious = {
      type: 'svg',
      data: { svg_content: '<svg><script>alert(1)</script><circle r="10"/></svg>' },
    } as QuestionVisual
    render(<QuestionVisualizer visual={malicious} />, { wrapper: Wrapper })
    const svg = document.querySelector('svg')
    expect(svg).toBeTruthy()
    expect(svg?.innerHTML.toLowerCase()).not.toContain('<script')
  })

  it('mermaid strict mode is the only securityLevel configured', () => {
    const initCalls = (mermaid.initialize as any).mock.calls
    for (const [opts] of initCalls) {
      expect(opts.securityLevel).toBe('strict')
    }
  })
})

/* ═══════════════════════════════════════════════════════════════════════════
   11. A11Y — accessible labels (not the literal string "visual")
   ═══════════════════════════════════════════════════════════════════════════ */
describe('accessibility — meaningful labels', () => {
  for (const type of ALL_VISUAL_TYPES) {
    const visual = VISUAL_FIXTURES.valid[type] ?? VISUAL_FIXTURES.valid.table
    it(`${type}: img role has an aria-label`, () => {
      render(<QuestionVisualizer visual={visual} />, { wrapper: Wrapper })
      const img = screen.getByRole('img')
      const label = img.getAttribute('aria-label')
      expect(label).toBeTruthy()
      expect(label).not.toBe('visual')
    })
  }
})

/* ═══════════════════════════════════════════════════════════════════════════
   12. BILINGUAL VISUAL TEXT — ONE visual, "English / Telugu" strings render
   ═══════════════════════════════════════════════════════════════════════════ */
describe('bilingual visual text (English / Telugu) renders in the ONE visual object', () => {
  it('table: bilingual headers and text cells render; numeric cells stay numeric without a separator', () => {
    const visual: QuestionVisual = {
      type: 'table',
      title: 'Major Rivers / ప్రధాన నదులు',
      data: {
        headers: ['River / నది', 'Length (km) / పొడవు (కి.మీ)'],
        rows: [['Godavari / గోదావరి', 1465]],
      },
    }
    render(<QuestionVisualizer visual={visual} />, { wrapper: Wrapper })
    expect(screen.getByText('Major Rivers / ప్రధాన నదులు')).toBeInTheDocument()
    expect(screen.getByText('River / నది')).toBeInTheDocument()
    expect(screen.getByText('Godavari / గోదావరి')).toBeInTheDocument()
    // The number is a number: no "/" was invented for it.
    expect(screen.getByText('1465')).toBeInTheDocument()
    expect(screen.queryByText('1465 / 1465')).not.toBeInTheDocument()
  })

  it('venn: bilingual set and intersection labels render in one diagram', () => {
    const visual: QuestionVisual = {
      type: 'venn',
      title: 'Classification / వర్గీకరణ',
      data: { setA: 'Plants / మొక్కలు', setB: 'Animals / జంతువులు', intersection: 'Both / రెండూ' },
    }
    render(<QuestionVisualizer visual={visual} />, { wrapper: Wrapper })
    expect(screen.getByText('Plants / మొక్కలు')).toBeInTheDocument()
    expect(screen.getByText('Animals / జంతువులు')).toBeInTheDocument()
    expect(screen.getByText('Both / రెండూ')).toBeInTheDocument()
  })

  it('geometry: bilingual side label renders inside one SVG', () => {
    const visual: QuestionVisual = {
      type: 'geometry',
      title: 'Triangle / త్రిభుజం',
      data: { shape: 'triangle', labels: { ab: 'Side AB / భుజం AB', bc: 'Side BC / భుజం BC', angleA: 'Angle A / కోణం A' } },
    }
    render(<QuestionVisualizer visual={visual} />, { wrapper: Wrapper })
    expect(screen.getByText('Side AB / భుజం AB')).toBeInTheDocument()
    expect(screen.getByText('Side BC / భుజం BC')).toBeInTheDocument()
  })

  it('map: bilingual overlay label renders on the single marker', () => {
    const visual: QuestionVisual = {
      type: 'map_overlay',
      title: 'Empire Extent / సామ్రాజ్య విస్తీర్ణం',
      data: { center: { lat: 17.385, lng: 78.4867 }, zoom: 7, overlays: [{ lat: 17.385, lng: 78.4867, label: 'Amaravati / అమరావతి', color: '#e31b23' }] },
    }
    render(<QuestionVisualizer visual={visual} />, { wrapper: Wrapper })
    expect(screen.getByText('Amaravati / అమరావతి')).toBeInTheDocument()
    expect(screen.getAllByTestId('marker')).toHaveLength(1)
  })

  it('svg: bilingual <text> survives DOMPurify and renders', () => {
    const visual: QuestionVisual = {
      type: 'svg',
      title: 'River Course / నది మార్గం',
      data: { svg_content: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80"><text x="10" y="24" font-size="14" fill="#000">River / నది</text><rect x="10" y="32" width="180" height="30" fill="#dce6f2"/></svg>' },
    }
    render(<QuestionVisualizer visual={visual} />, { wrapper: Wrapper })
    expect(screen.getByText('River / నది')).toBeInTheDocument()
    expect(document.querySelector('svg')).toBeTruthy()
  })

  it('mermaid: bilingual node label flows through to the mermaid renderer', async () => {
    const code = 'graph TD; A[Parliament / పార్లమెంటు] --> B[Lok Sabha / లోక్ సభ];'
    const visual: QuestionVisual = { type: 'mermaid', title: 'Parliament Structure / పార్లమెంటు నిర్మాణం', data: { code } }
    render(<QuestionVisualizer visual={visual} />, { wrapper: Wrapper })
    expect(screen.getByText('Parliament Structure / పార్లమెంటు నిర్మాణం')).toBeInTheDocument()
    const container = screen.getByTestId('mermaid-container') as HTMLElement
    await vi.waitFor(() => expect(container.querySelector('svg')).toBeTruthy())
    expect(container.innerHTML).toContain('Lok Sabha / లోక్ సభ')
    expect(container.innerHTML).toContain('Parliament / పార్లమెంటు')
  })

  it('chart: bilingual title renders; structural series data stays numeric', () => {
    const visual: QuestionVisual = {
      type: 'chart',
      title: 'Crop Production / పంట ఉత్పత్తి',
      data: { chartType: 'bar', labels: ['2019', '2020', '2021'], series: [{ name: 'Rice / బియ్యం', value: [120, 180, 145] }] },
    }
    render(<QuestionVisualizer visual={visual} />, { wrapper: Wrapper })
    expect(screen.getByText('Crop Production / పంట ఉత్పత్తి')).toBeInTheDocument()
    expect(document.querySelector('[data-recharts="BarChart"]')).toBeTruthy()
    const series = visual.data.series as { name: string; value: number[] }[] | undefined
    expect(series?.[0]?.value).toEqual([120, 180, 145])
  })

  it('latex: bilingual title renders; the formula stays pure LaTeX', () => {
    const visual: QuestionVisual = {
      type: 'latex',
      title: 'Quadratic Formula / ద్విఘాత సూత్రం',
      data: { expression: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}' },
    }
    render(<QuestionVisualizer visual={visual} />, { wrapper: Wrapper })
    expect(screen.getByText('Quadratic Formula / ద్విఘాత సూత్రం')).toBeInTheDocument()
    expect(screen.getByRole('img')).toBeInTheDocument()
  })
})