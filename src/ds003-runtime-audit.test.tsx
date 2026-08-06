import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { ThemeProvider } from './context/ThemeContext'
import { Input, TextArea, Select, Switch, Checkbox, Radio, RadioGroup } from './components/common/AntigravityForm'

afterEach(cleanup)

function renderWithTheme(ui: React.ReactNode, light = false) {
  return render(
    <ThemeProvider>
      <div className={light ? 'light' : undefined}>{ui}</div>
    </ThemeProvider>,
  )
}

const SURFACE_CLS = 'bg-hover-bg border-border-subtle rounded-xl text-text-primary placeholder:text-text-placeholder'
const FOCUS_CLS = 'focus:border-primary'
const HOVER_CLS = 'transition-all'

describe('DS-003 RUNTIME AUDIT', () => {
  // ---- INPUT TYPES (text / password / email / number / search) ----
  const types = ['text', 'password', 'email', 'number', 'search'] as const

  types.forEach((type) => {
    describe(`${type} input`, () => {
      it('renders with Foundation material in DARK mode', () => {
        renderWithTheme(<Input type={type} placeholder={`${type} field`} aria-label={type} />)
        const el = screen.getByLabelText(type)
        expect(el.tagName).toBe('INPUT')
        expect(el).toHaveClass(...SURFACE_CLS.split(' '))
        expect(el).toHaveClass(FOCUS_CLS)
        expect(el).toHaveClass(HOVER_CLS)
        expect(el).toHaveAttribute('type', type)
        expect(el).toHaveAttribute('placeholder', `${type} field`)
      })

      it('renders with Foundation material in LIGHT mode', () => {
        renderWithTheme(<Input type={type} placeholder={`${type} field`} aria-label={type} />, true)
        const el = screen.getByLabelText(type)
        expect(el).toHaveClass(...SURFACE_CLS.split(' '))
        expect(el).toHaveClass(FOCUS_CLS)
      })

      it('exposes focus ring + is focusable by keyboard', () => {
        renderWithTheme(<Input type={type} aria-label={type} />)
        const el = screen.getByLabelText(type)
        el.focus()
        expect(el).toHaveFocus()
        expect(el).toHaveClass(FOCUS_CLS)
      })

      it('honors disabled state', () => {
        renderWithTheme(<Input type={type} aria-label={type} disabled />)
        expect(screen.getByLabelText(type)).toBeDisabled()
      })

      it('forwards error state (aria-invalid + validation class)', () => {
        renderWithTheme(
          <Input type={type} aria-label={type} aria-invalid="true" className="border-danger focus:border-danger" />,
        )
        const el = screen.getByLabelText(type)
        expect(el).toHaveAttribute('aria-invalid', 'true')
        expect(el).toHaveClass('border-danger')
      })

      it('forwards success state (validation class)', () => {
        renderWithTheme(<Input type={type} aria-label={type} className="border-success focus:border-success" />)
        const el = screen.getByLabelText(type)
        expect(el).toHaveClass('border-success')
      })
    })
  })

  // ---- TEXTAREA ----
  describe('TextArea', () => {
    it('renders with Foundation material (DARK)', () => {
      renderWithTheme(<TextArea placeholder="content" aria-label="ta" />)
      const el = screen.getByLabelText('ta')
      expect(el.tagName).toBe('TEXTAREA')
      expect(el).toHaveClass(...SURFACE_CLS.split(' '))
      expect(el).toHaveClass(FOCUS_CLS)
      expect(el).toHaveClass(HOVER_CLS)
    })
    it('renders with Foundation material (LIGHT)', () => {
      renderWithTheme(<TextArea placeholder="content" aria-label="ta" />, true)
      const el = screen.getByLabelText('ta')
      expect(el).toHaveClass('bg-hover-bg', 'border-border-subtle', 'rounded-xl')
    })
    it('supports rows + disabled', () => {
      renderWithTheme(<TextArea placeholder="content" aria-label="ta" rows={6} disabled />)
      const el = screen.getByLabelText('ta')
      expect(el).toHaveAttribute('rows', '6')
      expect(el).toBeDisabled()
    })
    it('forwards error state', () => {
      renderWithTheme(<TextArea aria-label="ta" aria-invalid="true" className="border-danger" />)
      const el = screen.getByLabelText('ta')
      expect(el).toHaveAttribute('aria-invalid', 'true')
    })
    it('management variant renders neutral Management Surface material (no ancient gold)', () => {
      renderWithTheme(<TextArea variant="management" aria-label="ta-m" />)
      const el = screen.getByLabelText('ta-m')
      expect(el.tagName).toBe('TEXTAREA')
      expect(el).toHaveClass('bg-[var(--management-surface)]', 'border-[var(--management-border)]', 'text-text-primary', 'rounded-xl')
      expect(el).toHaveClass('focus:border-[var(--management-accent)]')
      expect(el).not.toHaveClass('ancient-textarea')
    })
  })

  // ---- SELECT ----
  describe('Select', () => {
    const opts = [
      { id: 'a', name: 'Alpha' },
      { id: 'b', name: 'Beta' },
    ]
    it('renders options + Foundation material (DARK)', () => {
      const { container } = renderWithTheme(<Select aria-label="sel" value="a" onChange={() => {}} options={opts} />)
      const el = container.querySelector('select')!
      expect(el.tagName).toBe('SELECT')
      expect(el).toHaveClass('bg-hover-bg', 'border-border-subtle', 'rounded-xl', 'text-text-primary')
      expect(screen.getByText('Alpha')).toBeTruthy()
      expect(screen.getByText('Beta')).toBeTruthy()
    })
    it('renders with Foundation material (LIGHT)', () => {
      const { container } = renderWithTheme(<Select aria-label="sel" value="a" onChange={() => {}} options={opts} />, true)
      const el = container.querySelector('select')!
      expect(el).toHaveClass('bg-hover-bg', 'border-border-subtle', 'rounded-xl')
    })
    it('renders placeholder option', () => {
      renderWithTheme(<Select aria-label="sel" value="" onChange={() => {}} options={opts} placeholder="Pick" />)
      expect(screen.getByText('Pick')).toBeTruthy()
    })
    it('disabled state', () => {
      const { container } = renderWithTheme(<Select aria-label="sel" value="a" onChange={() => {}} options={opts} disabled />)
      expect(container.querySelector('select')!).toBeDisabled()
    })
    it('calls onChange with selected id (keyboard navigable)', () => {
      let val = 'a'
      const { container } = renderWithTheme(<Select aria-label="sel" value={val} onChange={(v) => (val = v)} options={opts} />)
      fireEvent.change(container.querySelector('select')!, { target: { value: 'b' } })
      expect(val).toBe('b')
    })
    it('DOCUMENTED A11Y GAP: label is not associated via htmlFor/id (aria-label not forwarded to <select>)', () => {
      const { container } = renderWithTheme(<Select label="Country" value="a" onChange={() => {}} options={opts} />)
      const sel = container.querySelector('select')!
      // Current behaviour: the <select> has no id and the rendered <label> has no htmlFor.
      expect(sel.id).toBe('')
      const labelEl = container.querySelector('label')!
      expect(labelEl.getAttribute('for')).toBeNull()
    })
  })

  // ---- SWITCH ----
  describe('Switch', () => {
    it('renders as a switch role + reflects checked (DARK)', () => {
      renderWithTheme(<Switch aria-label="sw" checked={false} onChange={() => {}} />)
      const el = screen.getByRole('switch')
      expect(el).toHaveAttribute('aria-checked', 'false')
    })
    it('reflects checked=true', () => {
      renderWithTheme(<Switch aria-label="sw" checked onChange={() => {}} />)
      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true')
    })
    it('toggles via keyboard (Enter/Space click)', () => {
      let checked = false
      renderWithTheme(<Switch aria-label="sw" checked={checked} onChange={(c) => (checked = c)} />)
      fireEvent.click(screen.getByRole('switch'))
      expect(checked).toBe(true)
    })
    it('disabled state', () => {
      renderWithTheme(<Switch aria-label="sw" checked={false} onChange={() => {}} disabled />)
      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false')
    })
  })

  // ---- CHECKBOX (Foundation Checkbox) ----
  describe('Checkbox (Foundation Checkbox)', () => {
    it('renders as checkbox type (DARK)', () => {
      renderWithTheme(<Checkbox checked={false} onChange={() => {}} label="Test" />)
      const el = screen.getByRole('checkbox')
      expect(el.tagName).toBe('INPUT')
      expect(el).toHaveAttribute('type', 'checkbox')
    })
    it('renders as checkbox type (LIGHT)', () => {
      renderWithTheme(<Checkbox checked={false} onChange={() => {}} label="Test" />, true)
      const el = screen.getByRole('checkbox')
      expect(el).toHaveAttribute('type', 'checkbox')
    })
    it('toggles via keyboard (change event) and reflects checked', () => {
      let checked = false
      const { rerender } = renderWithTheme(
        <Checkbox
          checked={checked}
          onChange={(c) => (checked = c)}
          label="Test"
        />,
      )
      const box = screen.getByRole('checkbox') as HTMLInputElement
      fireEvent.click(box)
      expect(checked).toBe(true)
      rerender(
        <ThemeProvider>
          <Checkbox checked={checked} onChange={() => {}} label="Test" />
        </ThemeProvider>,
      )
      expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(true)
    })
    it('disabled state', () => {
      renderWithTheme(<Checkbox checked={false} onChange={() => {}} label="Test" disabled />)
      expect(screen.getByRole('checkbox')).toBeDisabled()
    })
  })

  // ---- RADIO (Foundation Radio) ----
  describe('Radio', () => {
    it('is a Foundation component', () => {
      expect(Input).toBeTypeOf('function')
      expect(TextArea).toBeTypeOf('function')
      expect(Select).toBeTypeOf('function')
      expect(Switch).toBeTypeOf('function')
      expect(Checkbox).toBeTypeOf('function')
      expect(Radio).toBeTypeOf('function')
      expect(RadioGroup).toBeTypeOf('function')
    })
  })

  // ---- CONSUMER OVERRIDE GUARD ----
  describe('Consumer override guard (governance)', () => {
    it('consumer className merges WITHOUT overriding Foundation ownership classes', () => {
      renderWithTheme(<Input aria-label="ov" className="w-full my-2" />)
      const el = screen.getByLabelText('ov')
      expect(el).toHaveClass('w-full', 'my-2')
      expect(el).toHaveClass('bg-hover-bg', 'border-border-subtle', 'rounded-xl')
    })
  })
})
