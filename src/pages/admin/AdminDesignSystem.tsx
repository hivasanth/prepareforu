import { useState, useCallback } from 'react'
import {
  Button, PrimaryButton, IconButton,
  Card, StatCard,
  Input, TextArea, Switch, Checkbox, Radio, RadioGroup,
  Tabs, Badge, ProgressBar, MetricBlock,
  PageContainer, Stack, Grid, SelectionContainer,
  PremiumSelect,
  Pill, StatusBadge, CounterBadge, NumberBadge,
  SegmentedFilter,
  ThemeToggle,
  Alert,
  Spinner,
  IconBadge,
  Typography,
  H2, Body, Label,
} from '../../components/common/AntigravityUI'
import { Skeleton } from '../../components/common/Skeleton'
import { AdminModal } from '../../components/common/AdminModal'
import { ErrorContainer } from '../../components/common/ErrorContainer'
import { RetryButton } from '../../components/common/RetryButton'
import { FloatingList, FloatingListHeader, FloatingListItem } from '../../components/common/FloatingList'
import { EmptyState, ConfirmModal, ErrorState } from '../../components/common/SharedComponents'
import { BilingualToggle } from '../../components/common/BilingualToggle'
import { SuccessModal } from '../../components/common/SuccessModal'
import { useTheme } from '../../context/ThemeContext'
import { normalizeError } from '../../utils/errorClassification'
import type { ErrorCategory, ErrorSeverity } from '../../types/error.types'
import { QuestionCard } from '../../components/exam/QuestionCard'
import { QuestionOptions } from '../../components/exam/QuestionOptions'
import { QuestionActions } from '../../components/exam/QuestionActions'
import { ExamHeader } from '../../components/exam/ExamHeader'
import { ReviewQuestionCard } from '../../components/exam/ReviewQuestionCard'
import type { Question, AttemptAnswer } from '../../types/exam.types'
import {
  BUTTON_HOVER, CARD_HOVER, ROW_HOVER, GHOST_HOVER,
  GOLD_LIGHT_MATERIAL,
} from '../../components/common/AntigravityMotion'
import {
  Layers, Info, CheckCircle, AlertTriangle, XCircle, Zap,
  Eye, PenSquare, Trash2, Settings, Search,
  BarChart3, HelpCircle, Trophy, Users,
  ArrowRight, Timer, FileText,
  Flame, GraduationCap, Target, TrendingUp, ChevronRight,
  WifiOff, Clock, ShieldAlert, ServerCrash, AlertCircle, Ban, Wrench,
  Send, ChevronLeft, CheckCircle2, RefreshCcw,
} from 'lucide-react'

/* ─── Fixture Data ─────────────────────────────────────────────────────── */

const DEMO_OPTIONS = [
  { id: 'en', name: 'English' },
  { id: 'te', name: 'Telugu' },
  { id: 'hi', name: 'Hindi' },
]

const DEMO_TABS = [
  { id: 'tab1', label: 'Overview' },
  { id: 'tab2', label: 'Details' },
  { id: 'tab3', label: 'Settings' },
  { id: 'tab4', label: 'Disabled', disabled: true },
]

const DEMO_FILTER_OPTIONS = [
  { id: 'all', label: 'All Time' },
  { id: '7d', label: '7 Days' },
  { id: '30d', label: '30 Days' },
]

const DEMO_TABLE_DATA = [
  { id: '1', question: 'What is the capital of France?', subject: 'Geography', difficulty: 'easy', status: 'active' },
  { id: '2', question: 'Explain photosynthesis briefly', subject: 'Biology', difficulty: 'medium', status: 'active' },
  { id: '3', question: 'Solve: 2x + 5 = 15', subject: 'Mathematics', difficulty: 'easy', status: 'draft' },
  { id: '4', question: 'Who wrote Romeo and Juliet?', subject: 'Literature', difficulty: 'hard', status: 'active' },
]

const DEMO_FLOATING_ITEMS = [
  { id: '1', name: 'Rahul Kumar', score: 85, rank: 1, status: 'passed' },
  { id: '2', name: 'Priya Singh', score: 72, rank: 2, status: 'passed' },
  { id: '3', name: 'Amit Patel', score: 68, rank: 3, status: 'conditional' },
]

const MOCK_QUESTIONS: Question[] = [
  {
    id: 'q1', exam_id: 'e1', paper_id: 'p1', subject_name: 'Geography',
    correct_option: 'A', difficulty: 'easy', negative_marks: 0.33,
    question_text_en: 'What is the capital of France?',
    question_text_te: 'ఫ్రాన్స్ రాజధాని ఏమిటి?',
    option_a_en: 'Paris', option_b_en: 'London', option_c_en: 'Berlin', option_d_en: 'Madrid',
    option_a_te: 'పారిస్', option_b_te: 'లండన్', option_c_te: 'బెర్లిన్', option_d_te: 'మాడ్రిడ్',
    explanation_en: 'Paris is the capital and most populous city of France.',
    explanation_te: 'పారిస్ ఫ్రాన్స్ రాజధాని మరియు అత్యంత జనాభా కలిగిన నగరం.',
  },
  {
    id: 'q2', exam_id: 'e1', paper_id: 'p1', subject_name: 'Science',
    correct_option: 'C', difficulty: 'medium', negative_marks: 0.33,
    question_text_en: 'Which gas is most abundant in Earth\'s atmosphere?',
    question_text_te: 'భూమి వాతావరణంలో అత్యధికంగా ఉండే వాయువు ఏది?',
    option_a_en: 'Oxygen', option_b_en: 'Carbon Dioxide', option_c_en: 'Nitrogen', option_d_en: 'Argon',
    option_a_te: 'ఆక్సిజన్', option_b_te: 'కార్బన్ డై ఆక్సైడ్', option_c_te: 'నైట్రోజన్', option_d_te: 'ఆర్గాన్',
    explanation_en: 'Nitrogen makes up about 78% of Earth\'s atmosphere.',
    explanation_te: 'నైట్రోజన్ భూమి వాతావరణంలో సుమారు 78% ఉంటుంది.',
  },
  {
    id: 'q3', exam_id: 'e1', paper_id: 'p1', subject_name: 'History',
    correct_option: 'B', difficulty: 'hard', negative_marks: 0.33,
    question_text_en: 'Who was the first President of the United States?',
    question_text_te: 'సంయుక్త రాష్ట్రాల మొదటి అధ్యక్షుడు ఎవరు?',
    option_a_en: 'Thomas Jefferson', option_b_en: 'George Washington', option_c_en: 'John Adams', option_d_en: 'Benjamin Franklin',
    option_a_te: 'థామస్ జెఫెర్సన్', option_b_te: 'జార్జ్ వాషింగ్టన్', option_c_te: 'జాన్ అడామ్స్', option_d_te: 'బెంజమిన్ ఫ్రాంక్లిన్',
    explanation_en: 'George Washington served as the first President from 1789 to 1797.',
    explanation_te: 'జార్జ్ వ�ाषింగ్టన్ 1789 నుండి 1797 వరకు మొదటి అధ్యక్షుడిగా పనిచేశాడు.',
  },
]

const MOCK_ANSWERS: Record<string, AttemptAnswer> = {
  q1: { id: 'a1', attempt_id: 'att1', question_id: 'q1', selected_option: 'A', is_correct: true, marks_awarded: 1, time_spent_secs: 45, visited: true, marked_for_review: false, last_visited_at: null },
  q2: { id: 'a2', attempt_id: 'att1', question_id: 'q2', selected_option: 'A', is_correct: false, marks_awarded: 0, time_spent_secs: 120, visited: true, marked_for_review: false, last_visited_at: null },
  q3: { id: 'a3', attempt_id: 'att1', question_id: 'q3', selected_option: null, is_correct: null, marks_awarded: 0, time_spent_secs: 0, visited: false, marked_for_review: false, last_visited_at: null },
}

/* ─── Section 23 — Error & Feedback Reference Data ─────────────────────── */
/* All titles and friendly messages below are DERIVED LIVE from the ONE
 * canonical classifier (src/utils/errorClassification.ts) at module scope,
 * so this showcase can never drift from the copy users actually see. */

const EF_CATEGORY_ORDER: ErrorCategory[] = [
  'network', 'offline', 'timeout', 'authentication', 'authorization',
  'server', 'validation', 'rateLimit', 'maintenance', 'business', 'unknown',
]

const EF_SEVERITIES: ErrorSeverity[] = ['low', 'medium', 'high', 'critical']

/* One representative simulated raw failure per category. The explicit
 * `category` option keeps every row deterministic regardless of the
 * viewer's online/offline state. */
const EF_CATEGORY_DEMO = EF_CATEGORY_ORDER.map((category) => {
  const normalized = normalizeError('demo failure', { category })
  return { category, title: normalized.title, message: normalized.message }
})

/* Live classification demos — NO explicit category override, so the real
 * detector (detectCategory → resolveCode → friendly copy) runs exactly as it
 * would in production. Raw inputs are displayed here for documentation ONLY;
 * production surfaces never render the raw column to users. */
const EF_CLASSIFIER_DEMOS = [
  'TypeError: Failed to fetch',
  'Request timed out after 30000ms',
  'Auth error: JWT expired',
  'permission denied for table study_topics',
  'new row violates row-level security policy',
  'HTTP 429 — rate limit exceeded',
  '503 Service Unavailable: maintenance window',
  'Postgres error 42P01: relation "study_topics" does not exist',
].map((raw) => ({ raw, ...normalizeError(new Error(raw)) }))

/* ─── Section Wrapper ──────────────────────────────────────────────────── */

function ShowcaseSection({ id, title, subtitle, children }: {
  id: string
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-black text-text-primary uppercase tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-text-secondary">{subtitle}</p>}
      </div>
      {children}
    </section>
  )
}

function ComponentLabel({ name, variant, role, source }: {
  name: string
  variant?: string
  role?: string
  source?: string
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-[9px] font-bold text-text-muted uppercase tracking-widest mb-2">
      <span className="text-text-secondary">{name}</span>
      {variant && <span className="text-primary">variant="{variant}"</span>}
      {role && <span className="text-text-muted">Role: {role}</span>}
      {source && <span className="text-text-hint">Source: {source}</span>}
    </div>
  )
}

function Row({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      {label && <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{label}</p>}
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  )
}

/* ─── Main Page ────────────────────────────────────────────────────────── */

export default function AdminDesignSystem() {
  const [activeTab, setActiveTab] = useState('tab1')
  const [switchVal, setSwitchVal] = useState(true)
  const [checkVal, setCheckVal] = useState(true)
  const [radioVal, setRadioVal] = useState('a')
  const [inputVal, setInputVal] = useState('Sample text')
  const [filterVal, setFilterVal] = useState('all')
  const [selectVal, setSelectVal] = useState('en')
  const [modalOpen, setModalOpen] = useState(false)
  const [counter, setCounter] = useState(0)
  const [alertsVisible, setAlertsVisible] = useState({ info: true, success: true, warning: true, error: true })
  const [examLang, setExamLang] = useState<'en' | 'te'>('en')
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isMarked, setIsMarked] = useState(false)
  const [examLangReview, setExamLangReview] = useState<'en' | 'te'>('en')

  /* ── Section 23 — Error & Feedback System demo state (LOCAL ONLY) ──
   * No Supabase calls, no API requests, no auth changes, no cache or route
   * mutations. Every interaction resolves with local timers/state. */

  /* Theme tied to the live ThemeContext so the ThemeToggle demo stays in sync
   * with the real light/dark mode (DEV showcase only). */
  const { isDark, toggleTheme } = useTheme()
  const [efAlertVisible, setEfAlertVisible] = useState(true)
  const [efRetrying, setEfRetrying] = useState(false)
  const [rbRetrying, setRbRetrying] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmFails, setConfirmFails] = useState(false)
  const [confirmBusy, setConfirmBusy] = useState(false)
  const [confirmError, setConfirmError] = useState(false)
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [successModalOpen, setSuccessModalOpen] = useState(false)
  /* ── Section 24 — Error Container pattern demos (LOCAL ONLY) ── */
  const [ecModalOpen, setEcModalOpen] = useState(false)

  const inc = useCallback(() => setCounter(c => c + 1), [])

  const simulateRetry = useCallback((setLoading: (loading: boolean) => void) => {
    setLoading(true)
    window.setTimeout(() => setLoading(false), 800)
  }, [])

  const openConfirmDemo = useCallback((fails: boolean) => {
    setConfirmFails(fails)
    setConfirmError(false)
    setConfirmOpen(true)
  }, [])

  /* Simulated destructive confirm — mirrors the CURRENT ConfirmModal contract:
   * busy locks actions while in flight; failure keeps the dialog open with the
   * composed Alert visible; the retry attempt succeeds (recovery); success
   * closes. */
  const runConfirmDemo = useCallback(() => {
    setConfirmBusy(true)
    window.setTimeout(() => {
      setConfirmBusy(false)
      if (confirmFails && !confirmError) {
        setConfirmError(true)
      } else {
        setConfirmError(false)
        setConfirmOpen(false)
      }
    }, 700)
  }, [confirmFails, confirmError])

  return (
    <PageContainer>
      <Stack gap="section">
        {/* ─── PAGE HEADER ─── */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <IconBadge icon={Layers} size="lg" status="primary" shape="rounded" />
              <div>
                <h1 className="text-2xl font-black text-text-primary uppercase tracking-tight m-0">Design System</h1>
                <p className="text-xs text-text-secondary m-0">Canonical UI Component Reference — Visual Validation</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle theme={isDark ? 'dark' : 'light'} onToggle={toggleTheme} />
            <Badge variant="primary" size="sm">INTERNAL</Badge>
          </div>
        </header>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 1: FOUNDATIONS
            ═══════════════════════════════════════════════════════════════════ */}
        <ShowcaseSection id="foundations" title="1. Foundations" subtitle="Semantic color, surface, border, and text tokens">
          <ComponentLabel name="Token Swatches" role="surface rendering" source="themes.css" />

          <div className="space-y-4">
            <Row label="Background Tokens">
              {[
                { name: 'bg-app', cls: 'bg-app-bg' },
                { name: 'bg-surface / card-bg', cls: 'bg-card-bg' },
                { name: 'bg-elevated', cls: 'bg-[var(--bg-elevated)]' },
                { name: 'bg-hover', cls: 'bg-[var(--bg-hover)]' },
                { name: 'bg-input', cls: 'bg-input-bg' },
              ].map(t => (
                <div key={t.name} className="flex flex-col items-center gap-1">
                  <div className={`w-16 h-16 rounded-xl border border-border-subtle ${t.cls}`} />
                  <span className="text-[8px] font-bold text-text-muted uppercase tracking-wider text-center leading-tight">{t.name}</span>
                </div>
              ))}
            </Row>

            <Row label="Text Tokens">
              {[
                { name: 'text-primary', cls: 'text-text-primary' },
                { name: 'text-secondary', cls: 'text-text-secondary' },
                { name: 'text-muted', cls: 'text-text-muted' },
                { name: 'text-hint', cls: 'text-text-hint' },
                { name: 'text-disabled', cls: 'text-text-disabled' },
              ].map(t => (
                <span key={t.name} className={`text-sm font-bold ${t.cls}`}>Aa</span>
              ))}
            </Row>

            <Row label="Status Tokens">
              {[
                { name: 'success', cls: 'bg-success text-white' },
                { name: 'warning', cls: 'bg-warning text-white' },
                { name: 'danger', cls: 'bg-danger text-white' },
                { name: 'info', cls: 'bg-primary text-white' },
                { name: 'accent', cls: 'bg-secondary text-white' },
              ].map(t => (
                <div key={t.name} className="flex flex-col items-center gap-1">
                  <div className={`w-12 h-12 rounded-xl ${t.cls}`} />
                  <span className="text-[8px] font-bold text-text-muted uppercase">{t.name}</span>
                </div>
              ))}
            </Row>

            <Row label="Border Tokens">
              {[
                { name: 'border-default', cls: 'border-2 border-default' },
                { name: 'border-subtle', cls: 'border-2 border-border-subtle' },
                { name: 'border-input', cls: 'border-2 border-input-border' },
                { name: 'border-focus', cls: 'border-2 border-input-focus-border' },
              ].map(t => (
                <div key={t.name} className="flex flex-col items-center gap-1">
                  <div className={`w-12 h-12 rounded-xl bg-card-bg ${t.cls}`} />
                  <span className="text-[8px] font-bold text-text-muted uppercase text-center leading-tight">{t.name}</span>
                </div>
              ))}
            </Row>

            <Row label="Elevation / Shadow">
              {[
                { name: 'elevation-0', cls: 'shadow-[var(--elevation-0)]' },
                { name: 'elevation-1', cls: 'shadow-[var(--elevation-1)]' },
                { name: 'elevation-2', cls: 'shadow-[var(--elevation-2)]' },
                { name: 'elevation-3', cls: 'shadow-[var(--elevation-3)]' },
                { name: 'elevation-4', cls: 'shadow-[var(--elevation-4)]' },
              ].map(t => (
                <div key={t.name} className="flex flex-col items-center gap-1">
                  <div className={`w-16 h-16 rounded-xl bg-card-bg ${t.cls}`} />
                  <span className="text-[8px] font-bold text-text-muted uppercase text-center leading-tight">{t.name}</span>
                </div>
              ))}
            </Row>
          </div>
        </ShowcaseSection>

        <hr className="border-border-subtle/30" />

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 2: BUTTONS
            ═══════════════════════════════════════════════════════════════════ */}
        <ShowcaseSection id="buttons" title="2. Buttons" subtitle="All variants, sizes, states, and className source">
          <ComponentLabel name="Button" source="AntigravityButton.tsx" />

          <Row label="Variants">
            <Button variant="primary" onClick={inc}>Primary {counter > 0 && `(${counter})`}</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="success">Success</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="soft">Soft</Button>
            <Button variant="ghost">Ghost</Button>
          </Row>

          <Row label="Sizes">
            <Button variant="primary" size="xs">XS</Button>
            <Button variant="primary" size="sm">SM</Button>
            <Button variant="primary" size="md">MD</Button>
            <Button variant="primary" size="lg">LG</Button>
            <Button variant="primary" size="xl">XL</Button>
          </Row>

          <Row label="States">
            <Button variant="primary">Normal</Button>
            <Button variant="primary" disabled>Disabled</Button>
            <Button variant="primary" loading>Loading</Button>
          </Row>

          <Row label="Icon Buttons">
            <IconButton variant="primary" size="sm"><Eye size={16} /></IconButton>
            <IconButton variant="ghost" size="sm"><Search size={16} /></IconButton>
            <IconButton variant="danger" size="sm"><Trash2 size={16} /></IconButton>
            <IconButton variant="action" intent="view" size="sm"><Eye size={16} /></IconButton>
            <IconButton variant="action" intent="edit" size="sm"><PenSquare size={16} /></IconButton>
            <IconButton variant="action" intent="delete" size="sm"><Trash2 size={16} /></IconButton>
            <IconButton variant="primary" size="sm" disabled><Settings size={16} /></IconButton>
          </Row>

          <Row label="PrimaryButton (full-width CTA)">
            <div className="w-full max-w-xs">
              <PrimaryButton onClick={inc}>Start Full Exam</PrimaryButton>
            </div>
          </Row>

          {/* ── Dark Mode Variants Table ── */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Dark Mode Variants</p>
            <div className="overflow-x-auto">
              <table className="w-full text-[9px] border-collapse">
                <thead>
                  <tr className="border-b border-border-subtle/30">
                    <th className="text-left py-2 px-3 text-text-muted uppercase tracking-wider">Variant</th>
                    <th className="text-left py-2 px-3 text-text-muted uppercase tracking-wider">ClassName</th>
                    <th className="text-left py-2 px-3 text-text-muted uppercase tracking-wider">Hover</th>
                  </tr>
                </thead>
                <tbody className="text-text-secondary">
                  <tr className="border-b border-border-subtle/10">
                    <td className="py-2 px-3 font-bold text-primary">primary</td>
                    <td className="py-2 px-3 font-mono text-[8px]">bg-primary text-white border-transparent shadow-elevation-2 shadow-primary/20</td>
                    <td className="py-2 px-3">BUTTON_HOVER → hover:-translate-y-0.5 hover:shadow-card-hover-3d</td>
                  </tr>
                  <tr className="border-b border-border-subtle/10">
                    <td className="py-2 px-3 font-bold text-primary">secondary</td>
                    <td className="py-2 px-3 font-mono text-[8px]">bg-button-surface-secondary text-button-text-secondary border-button-border-secondary shadow-button-secondary</td>
                    <td className="py-2 px-3">BUTTON_HOVER → hover:bg-button-surface-secondary-hover</td>
                  </tr>
                  <tr className="border-b border-border-subtle/10">
                    <td className="py-2 px-3 font-bold text-success">success</td>
                    <td className="py-2 px-3 font-mono text-[8px]">bg-success text-white border-transparent shadow-elevation-2 shadow-success/20</td>
                    <td className="py-2 px-3">BUTTON_HOVER → hover:-translate-y-0.5 hover:shadow-card-hover-3d</td>
                  </tr>
                  <tr className="border-b border-border-subtle/10">
                    <td className="py-2 px-3 font-bold text-danger">danger</td>
                    <td className="py-2 px-3 font-mono text-[8px]">bg-danger text-white border-transparent shadow-elevation-2 shadow-danger/20</td>
                    <td className="py-2 px-3">BUTTON_HOVER → hover:-translate-y-0.5 hover:shadow-card-hover-3d</td>
                  </tr>
                  <tr className="border-b border-border-subtle/10">
                    <td className="py-2 px-3 font-bold text-primary">soft</td>
                    <td className="py-2 px-3 font-mono text-[8px]">bg-primary/10 text-primary border border-primary/20</td>
                    <td className="py-2 px-3">GHOST_HOVER → hover:bg-primary/20 (no lift, no shadow)</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-text-secondary">ghost</td>
                    <td className="py-2 px-3 font-mono text-[8px]">bg-button-surface-ghost text-button-text-ghost border-button-border-ghost shadow-none</td>
                    <td className="py-2 px-3">GHOST_HOVER → hover:bg-button-surface-ghost-hover hover:text-button-text-ghost-hover</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Light Mode Variants Table ── */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Light Mode Variants</p>
            <div className="overflow-x-auto">
              <table className="w-full text-[9px] border-collapse">
                <thead>
                  <tr className="border-b border-border-subtle/30">
                    <th className="text-left py-2 px-3 text-text-muted uppercase tracking-wider">Variant</th>
                    <th className="text-left py-2 px-3 text-text-muted uppercase tracking-wider">ClassName</th>
                    <th className="text-left py-2 px-3 text-text-muted uppercase tracking-wider">Hover</th>
                  </tr>
                </thead>
                <tbody className="text-text-secondary">
                  <tr className="border-b border-border-subtle/10">
                    <td className="py-2 px-3 font-bold text-primary">primary</td>
                    <td className="py-2 px-3 font-mono text-[8px]">bg-[image:var(--material-button-primary-surface)] text-[var(--material-button-primary-text)] border-[var(--border-premium-width)] border-[var(--material-button-primary-border)] shadow-[var(--material-button-primary-shadow)] → elevation-carved (3D)</td>
                    <td className="py-2 px-3">BUTTON_HOVER → hover:-translate-y-0.5 hover:shadow-card-hover-3d</td>
                  </tr>
                  <tr className="border-b border-border-subtle/10">
                    <td className="py-2 px-3 font-bold text-primary">secondary</td>
                    <td className="py-2 px-3 font-mono text-[8px]">bg-button-surface-secondary text-button-text-secondary border-[var(--border-premium-width)] border-button-border-secondary shadow-button-secondary → elevation-carved (3D)</td>
                    <td className="py-2 px-3">BUTTON_HOVER → hover:bg-button-surface-secondary-hover</td>
                  </tr>
                  <tr className="border-b border-border-subtle/10">
                    <td className="py-2 px-3 font-bold text-success">success</td>
                    <td className="py-2 px-3 font-mono text-[8px]">bg-success text-white border border-transparent shadow-elevation-2 shadow-success/20</td>
                    <td className="py-2 px-3">BUTTON_HOVER → hover:-translate-y-0.5 hover:shadow-card-hover-3d</td>
                  </tr>
                  <tr className="border-b border-border-subtle/10">
                    <td className="py-2 px-3 font-bold text-danger">danger</td>
                    <td className="py-2 px-3 font-mono text-[8px]">bg-danger text-white border border-transparent shadow-elevation-2 shadow-danger/20</td>
                    <td className="py-2 px-3">BUTTON_HOVER → hover:-translate-y-0.5 hover:shadow-card-hover-3d</td>
                  </tr>
                  <tr className="border-b border-border-subtle/10">
                    <td className="py-2 px-3 font-bold text-primary">soft</td>
                    <td className="py-2 px-3 font-mono text-[8px]">bg-primary/10 text-primary border border-primary/20</td>
                    <td className="py-2 px-3">GHOST_HOVER → hover:bg-primary/20 (no lift, no shadow)</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-text-secondary">ghost</td>
                    <td className="py-2 px-3 font-mono text-[8px]">bg-button-surface-ghost text-button-text-ghost border-button-border-ghost shadow-none</td>
                    <td className="py-2 px-3">GHOST_HOVER → hover:bg-button-surface-ghost-hover hover:text-button-text-ghost-hover</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Size Variants Table ── */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Size Variants</p>
            <div className="overflow-x-auto">
              <table className="w-full text-[9px] border-collapse">
                <thead>
                  <tr className="border-b border-border-subtle/30">
                    <th className="text-left py-2 px-3 text-text-muted uppercase tracking-wider">Size</th>
                    <th className="text-left py-2 px-3 text-text-muted uppercase tracking-wider">Height</th>
                    <th className="text-left py-2 px-3 text-text-muted uppercase tracking-wider">Padding</th>
                    <th className="text-left py-2 px-3 text-text-muted uppercase tracking-wider">Font</th>
                    <th className="text-left py-2 px-3 text-text-muted uppercase tracking-wider">Radius</th>
                  </tr>
                </thead>
                <tbody className="text-text-secondary">
                  <tr className="border-b border-border-subtle/10">
                    <td className="py-2 px-3 font-bold">xs</td>
                    <td className="py-2 px-3">h-8 (32px)</td>
                    <td className="py-2 px-3">px-3 (12px)</td>
                    <td className="py-2 px-3">10px bold tracking-wider</td>
                    <td className="py-2 px-3">rounded-button-xs (10px)</td>
                  </tr>
                  <tr className="border-b border-border-subtle/10">
                    <td className="py-2 px-3 font-bold">sm</td>
                    <td className="py-2 px-3">h-9 (36px)</td>
                    <td className="py-2 px-3">px-4 (16px)</td>
                    <td className="py-2 px-3">12px bold tracking-wider</td>
                    <td className="py-2 px-3">rounded-button-sm (12px)</td>
                  </tr>
                  <tr className="border-b border-border-subtle/10">
                    <td className="py-2 px-3 font-bold">md</td>
                    <td className="py-2 px-3">h-[48px]</td>
                    <td className="py-2 px-3">px-6 (24px)</td>
                    <td className="py-2 px-3">13px bold tracking-wider</td>
                    <td className="py-2 px-3">rounded-button-md (14px)</td>
                  </tr>
                  <tr className="border-b border-border-subtle/10">
                    <td className="py-2 px-3 font-bold">lg</td>
                    <td className="py-2 px-3">h-[48px]</td>
                    <td className="py-2 px-3">px-8 (32px)</td>
                    <td className="py-2 px-3">14px bold tracking-wider</td>
                    <td className="py-2 px-3">rounded-button-md (14px)</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold">xl</td>
                    <td className="py-2 px-3">h-14 (56px)</td>
                    <td className="py-2 px-3">px-10 (40px)</td>
                    <td className="py-2 px-3">15px bold tracking-wider</td>
                    <td className="py-2 px-3">rounded-button-xl (16px)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Icon Button Variants Table ── */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Icon Button Variants</p>
            <div className="overflow-x-auto">
              <table className="w-full text-[9px] border-collapse">
                <thead>
                  <tr className="border-b border-border-subtle/30">
                    <th className="text-left py-2 px-3 text-text-muted uppercase tracking-wider">Variant</th>
                    <th className="text-left py-2 px-3 text-text-muted uppercase tracking-wider">ClassName</th>
                    <th className="text-left py-2 px-3 text-text-muted uppercase tracking-wider">Hover</th>
                  </tr>
                </thead>
                <tbody className="text-text-secondary">
                  <tr className="border-b border-border-subtle/10">
                    <td className="py-2 px-3 font-bold text-primary">primary</td>
                    <td className="py-2 px-3 font-mono text-[8px]">bg-primary/10 text-primary</td>
                    <td className="py-2 px-3">BUTTON_HOVER → hover:bg-primary hover:text-white</td>
                  </tr>
                  <tr className="border-b border-border-subtle/10">
                    <td className="py-2 px-3 font-bold text-text-secondary">ghost</td>
                    <td className="py-2 px-3 font-mono text-[8px]">bg-button-surface-ghost text-button-text-ghost</td>
                    <td className="py-2 px-3">GHOST_HOVER → hover:bg-button-surface-ghost-hover</td>
                  </tr>
                  <tr className="border-b border-border-subtle/10">
                    <td className="py-2 px-3 font-bold text-danger">danger</td>
                    <td className="py-2 px-3 font-mono text-[8px]">bg-danger/10 text-danger</td>
                    <td className="py-2 px-3">BUTTON_HOVER → hover:bg-danger hover:text-white</td>
                  </tr>
                  <tr className="border-b border-border-subtle/10">
                    <td className="py-2 px-3 font-bold text-danger">danger-soft</td>
                    <td className="py-2 px-3 font-mono text-[8px]">bg-primary/10 text-danger</td>
                    <td className="py-2 px-3">GHOST_HOVER → hover:bg-danger/10 hover:text-white</td>
                  </tr>
                  <tr className="border-b border-border-subtle/10">
                    <td className="py-2 px-3 font-bold text-primary">theme</td>
                    <td className="py-2 px-3 font-mono text-[8px]">selection-surface border-[var(--border-premium-width)] border-button-border-secondary</td>
                    <td className="py-2 px-3">BUTTON_HOVER</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold text-primary">action</td>
                    <td className="py-2 px-3 font-mono text-[8px]">bg-button-surface-action text-button-text-action border border-button-border-action</td>
                    <td className="py-2 px-3">GHOST_HOVER → hover:bg-button-surface-action-hover + intent color (view:info/edit:success/delete:danger)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </ShowcaseSection>

        <hr className="border-border-subtle/30" />

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 3: CARDS / SURFACES
            ═══════════════════════════════════════════════════════════════════ */}
        <ShowcaseSection id="cards" title="3. Cards / Surfaces" subtitle="All card variants with padding options">
          <ComponentLabel name="Card" source="AntigravityCard.tsx" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(['default', 'elevated', 'subtle', 'premium', 'premium-neutral', 'premium-dark-neutral', 'management', 'static'] as const).map(v => (
              <Card key={v} variant={v} padding={20}>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">variant="{v}"</p>
                <p className="text-sm font-bold text-text-primary">Card Content</p>
                <p className="text-xs text-text-secondary mt-1">Hover me {v !== 'static' ? '(lifts)' : '(no hover)'}</p>
              </Card>
            ))}
          </div>

          <Row label="Padding">
            <Card variant="default" padding={0}><div className="p-4 text-xs text-text-secondary">padding=0 (custom inner)</div></Card>
            <Card variant="default" padding={16}><div className="text-xs text-text-secondary">padding=16</div></Card>
            <Card variant="default" padding={24}><div className="text-xs text-text-secondary">padding=24</div></Card>
          </Row>

          <ComponentLabel name="StatCard" source="AntigravityCard.tsx" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={BarChart3} label="ACCURACY" value="87%" status="success" />
            <StatCard icon={Trophy} label="RANK" value="#3" status="warning" />
            <StatCard icon={Zap} label="STREAK" value="12" status="info" />
            <StatCard icon={Timer} label="TIME" value="45m" status="secondary" />
          </div>
        </ShowcaseSection>

        <hr className="border-border-subtle/30" />

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 4: FORM CONTROLS
            ═══════════════════════════════════════════════════════════════════ */}
        <ShowcaseSection id="forms" title="4. Form Controls" subtitle="Input, TextArea, PremiumSelect, Switch, Checkbox, Radio">
          <ComponentLabel name="Input" source="AntigravityForm.tsx" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
            <Input placeholder="Default input" value={inputVal} onChange={e => setInputVal(e.target.value)} />
            <Input placeholder="With search icon" leftIcon={Search} />
            <Input placeholder="Compact variant" variant="compact" />
            <Input placeholder="Disabled" disabled />
            <Input placeholder="Error state" className="!border-danger" />
            <Input placeholder="Management variant" variant="management" />
          </div>

          <ComponentLabel name="TextArea" source="AntigravityForm.tsx" />
          <div className="max-w-2xl">
            <TextArea placeholder="Enter question text here..." />
          </div>

          <ComponentLabel name="PremiumSelect" source="PremiumSelect.tsx" />
          <div className="max-w-xs">
            <PremiumSelect value={selectVal} onChange={setSelectVal} options={DEMO_OPTIONS} placeholder="Select language" label="Language" />
          </div>

          <ComponentLabel name="Switch" source="AntigravityForm.tsx" />
          <div className="space-y-2 max-w-xs">
            <Switch checked={switchVal} onChange={setSwitchVal} label="Enable notifications" />
            <Switch checked={false} onChange={() => {}} label="Disabled switch" disabled />
          </div>

          <ComponentLabel name="Checkbox" source="AntigravityForm.tsx" />
          <div className="space-y-2 max-w-xs">
            <Checkbox checked={checkVal} onChange={setCheckVal} label="I agree to terms" />
            <Checkbox checked={false} onChange={() => {}} label="Disabled checkbox" disabled />
            <Checkbox checked={true} onChange={() => {}} indeterminate label="Indeterminate" />
          </div>

          <ComponentLabel name="Radio" source="AntigravityForm.tsx" />
          <div className="space-y-2 max-w-xs">
            <Radio checked={radioVal === 'a'} onChange={() => setRadioVal('a')} label="Option A" />
            <Radio checked={radioVal === 'b'} onChange={() => setRadioVal('b')} label="Option B" />
            <Radio checked={false} onChange={() => {}} label="Disabled" disabled />
          </div>

          <ComponentLabel name="RadioGroup" source="AntigravityForm.tsx" />
          <div className="max-w-xs">
            <RadioGroup
              value={radioVal}
              onChange={setRadioVal}
              options={[{ value: 'a', label: 'Easy' }, { value: 'b', label: 'Medium' }, { value: 'c', label: 'Hard' }]}
              label="Difficulty"
            />
          </div>
        </ShowcaseSection>

        <hr className="border-border-subtle/30" />

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 5: PILLS / BADGES
            ═══════════════════════════════════════════════════════════════════ */}
        <ShowcaseSection id="badges" title="5. Pills / Badges" subtitle="All badge variants and semantic roles">
          <ComponentLabel name="Badge" source="AntigravityData.tsx" />
          <Row label="Badge Variants">
            <Badge variant="primary">PRIMARY</Badge>
            <Badge variant="success">SUCCESS</Badge>
            <Badge variant="warning">WARNING</Badge>
            <Badge variant="danger">DANGER</Badge>
            <Badge variant="secondary">SECONDARY</Badge>
            <Badge variant="secondary">NEUTRAL</Badge>
            <Badge variant="default">DEFAULT</Badge>
          </Row>

          <ComponentLabel name="Pill" source="Pill.tsx" />
          <Row label="Pill Roles">
            <Pill role="status" variant="success">ACTIVE</Pill>
            <Pill role="status" variant="warning">IN PROGRESS</Pill>
            <Pill role="status" variant="danger">LIVE NOW</Pill>
            <Pill role="difficulty" variant="success">EASY</Pill>
            <Pill role="difficulty" variant="warning">MEDIUM</Pill>
            <Pill role="difficulty" variant="danger">HARD</Pill>
          </Row>

          <ComponentLabel name="StatusBadge" source="StatusBadge.tsx" />
          <Row>
            <StatusBadge status="primary">ACTIVE</StatusBadge>
            <StatusBadge status="neutral">INACTIVE</StatusBadge>
            <StatusBadge status="warning">PENDING</StatusBadge>
          </Row>

          <ComponentLabel name="CounterBadge" source="CounterBadge.tsx" />
          <Row>
            <CounterBadge>5</CounterBadge>
            <CounterBadge>120</CounterBadge>
            <CounterBadge>0</CounterBadge>
          </Row>
        </ShowcaseSection>

        <hr className="border-border-subtle/30" />

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 6: NUMBERS
            ═══════════════════════════════════════════════════════════════════ */}
        <ShowcaseSection id="numbers" title="6. Numbers" subtitle="NumberBadge — all variants use the same premium forest/gold material">
          <ComponentLabel name="NumberBadge" source="NumberBadge.tsx" />

          <Row label="Question Numbers">
            {[1, 2, 3, 4, 5].map(n => (
              <NumberBadge key={n} variant="question" value={n} />
            ))}
          </Row>

          <Row label="Option Letters">
            {['A', 'B', 'C', 'D'].map(l => (
              <NumberBadge key={l} variant="option" value={l} />
            ))}
          </Row>

          <Row label="Ranks">
            {[1, 2, 3, 4, 5].map(n => (
              <NumberBadge key={n} variant="rank" value={n} />
            ))}
          </Row>

          {/* ── Variant ClassNames Table ── */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Variant ClassNames</p>
            <div className="overflow-x-auto">
              <table className="w-full text-[9px] border-collapse">
                <thead>
                  <tr className="border-b border-border-subtle/30">
                    <th className="text-left py-2 px-3 text-text-muted uppercase tracking-wider">Variant</th>
                    <th className="text-left py-2 px-3 text-text-muted uppercase tracking-wider">Light Mode</th>
                    <th className="text-left py-2 px-3 text-text-muted uppercase tracking-wider">Dark Mode</th>
                  </tr>
                </thead>
                <tbody className="text-text-secondary">
                  <tr className="border-b border-border-subtle/10">
                    <td className="py-2 px-3 font-bold">question</td>
                    <td className="py-2 px-3 font-mono text-[8px]">bg-[image:var(--gradient-header)] text-[var(--ancient-gold-bright)] shadow-premium-icon</td>
                    <td className="py-2 px-3 font-mono text-[8px]">bg-hover-bg text-text-secondary</td>
                  </tr>
                  <tr className="border-b border-border-subtle/10">
                    <td className="py-2 px-3 font-bold">option</td>
                    <td className="py-2 px-3 font-mono text-[8px]">bg-[image:var(--gradient-header)] text-[var(--ancient-gold-bright)] shadow-premium-icon bg-option-surface border border-border-subtle</td>
                    <td className="py-2 px-3 font-mono text-[8px]">bg-option-surface text-text-secondary border border-border-subtle</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold">rank</td>
                    <td className="py-2 px-3 font-mono text-[8px]">bg-[image:var(--gradient-header)] text-[var(--ancient-gold-bright)] shadow-premium-icon border border-border-subtle + top-3 override</td>
                    <td className="py-2 px-3 font-mono text-[8px]">bg-hover-bg text-text-secondary border border-border-subtle + top-3 override</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Rank Top-3 Overrides Table ── */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Rank Top-3 Overrides</p>
            <div className="overflow-x-auto">
              <table className="w-full text-[9px] border-collapse">
                <thead>
                  <tr className="border-b border-border-subtle/30">
                    <th className="text-left py-2 px-3 text-text-muted uppercase tracking-wider">Rank</th>
                    <th className="text-left py-2 px-3 text-text-muted uppercase tracking-wider">Light Override</th>
                    <th className="text-left py-2 px-3 text-text-muted uppercase tracking-wider">Dark Override</th>
                  </tr>
                </thead>
                <tbody className="text-text-secondary">
                  <tr className="border-b border-border-subtle/10">
                    <td className="py-2 px-3 font-bold">1st</td>
                    <td className="py-2 px-3 font-mono text-[8px]">text-warning border-warning/20</td>
                    <td className="py-2 px-3 font-mono text-[8px]">text-primary border-primary/20</td>
                  </tr>
                  <tr className="border-b border-border-subtle/10">
                    <td className="py-2 px-3 font-bold">2nd</td>
                    <td className="py-2 px-3 font-mono text-[8px]">text-text-muted border-border-subtle/40</td>
                    <td className="py-2 px-3 font-mono text-[8px]">text-text-muted border-border-subtle/40</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-bold">3rd</td>
                    <td className="py-2 px-3 font-mono text-[8px]">text-[var(--gold-300)] border-warning/20</td>
                    <td className="py-2 px-3 font-mono text-[8px]">text-text-secondary border-border-subtle/40</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </ShowcaseSection>

        <hr className="border-border-subtle/30" />

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 7: TABS / FILTERS / SELECTION
            ═══════════════════════════════════════════════════════════════════ */}
        <ShowcaseSection id="selection" title="7. Tabs / Filters / Selection" subtitle="SelectionContainer, Tabs, SegmentedFilter">
          <ComponentLabel name="SelectionContainer" source="AntigravityLayout.tsx" />
          <SelectionContainer>
            <p className="text-xs text-text-secondary light:text-[var(--gold-300)] p-2">SelectionContainer content — premium surface with gold border in light mode</p>
          </SelectionContainer>

          <ComponentLabel name="Tabs" variant="primary" source="AntigravityData.tsx" />
          <Tabs options={DEMO_TABS} activeId={activeTab} onChange={setActiveTab} variant="primary" />

          <ComponentLabel name="Tabs" variant="secondary" source="AntigravityData.tsx" />
          <Tabs options={DEMO_TABS} activeId={activeTab} onChange={setActiveTab} variant="secondary" />

          <ComponentLabel name="SegmentedFilter" source="SegmentedFilter.tsx" />
          <SegmentedFilter options={DEMO_FILTER_OPTIONS} value={filterVal} onChange={setFilterVal} />
        </ShowcaseSection>

        <hr className="border-border-subtle/30" />

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 8: NAVIGATION
            ═══════════════════════════════════════════════════════════════════ */}
        <ShowcaseSection id="navigation" title="8. Navigation" subtitle="Sidebar nav items — active, inactive, hover states">
          <ComponentLabel name="Navigation.Item" source="Navigation.tsx" />

          <Card variant="default" padding={16}>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3">Simulated Nav Items</p>
            <div className="space-y-1">
              {[
                { label: 'OVERVIEW', icon: BarChart3, active: false },
                { label: 'QUESTIONS', icon: HelpCircle, active: true },
                { label: 'USERS', icon: Users, active: false },
                { label: 'SETTINGS', icon: Settings, active: false },
              ].map(item => (
                <div
                  key={item.label}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 cursor-pointer ${
                    item.active
                      ? 'bg-primary text-white shadow-md shadow-primary/20'
                      : 'text-text-secondary hover:bg-hover-bg hover:text-text-primary'
                  }`}
                >
                  <item.icon size={20} strokeWidth={item.active ? 2.5 : 2} />
                  <span className="text-sm font-bold tracking-tight">{item.label}</span>
                  {item.active && (
                    <div className="absolute -left-1 w-1 h-6 bg-white rounded-r-full" />
                  )}
                </div>
              ))}
            </div>
          </Card>
        </ShowcaseSection>

        <hr className="border-border-subtle/30" />

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 9: LISTS
            ═══════════════════════════════════════════════════════════════════ */}
        <ShowcaseSection id="lists" title="9. Lists" subtitle="FloatingList, FloatingListHeader, FloatingListItem">
          <ComponentLabel name="FloatingList" source="FloatingList.tsx" />

          <div className="max-w-lg">
            <FloatingList>
              <FloatingListHeader>
                <div className="flex items-center justify-between text-[10px] font-bold text-text-muted light:text-[var(--gold-300)] uppercase tracking-widest">
                  <span>Student</span>
                  <span>Score</span>
                </div>
              </FloatingListHeader>
              {DEMO_FLOATING_ITEMS.map(item => (
                <FloatingListItem key={item.id}>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <NumberBadge variant="rank" value={item.rank} />
                      <span className="text-sm font-bold text-text-primary">{item.name}</span>
                    </div>
                    <span className="text-sm font-black text-text-primary">{item.score}%</span>
                  </div>
                </FloatingListItem>
              ))}
            </FloatingList>
          </div>
        </ShowcaseSection>

        <hr className="border-border-subtle/30" />

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 10: TABLES / DATA
            ═══════════════════════════════════════════════════════════════════ */}
        <ShowcaseSection id="data" title="10. Tables / Data" subtitle="DataGrid, MetricBlock, ProgressBar">
          <ComponentLabel name="DataGrid" source="AntigravityData.tsx" />

          <div className="max-w-3xl">
            <FloatingList>
              <FloatingListHeader>
                <div className="flex items-center w-full text-[10px] font-bold text-text-muted light:text-[var(--gold-300)] uppercase tracking-widest">
                  <span className="flex-1">Question</span>
                  <span className="flex-1">Subject</span>
                  <span className="w-24 text-center">Difficulty</span>
                  <span className="w-24 text-center">Status</span>
                  <span className="w-28 text-center">Actions</span>
                </div>
              </FloatingListHeader>
              {DEMO_TABLE_DATA.map(row => (
                <FloatingListItem key={row.id}>
                  <div className="flex items-center w-full">
                    <span className="flex-1 text-sm font-bold text-text-primary">{row.question}</span>
                    <span className="flex-1 text-xs text-text-secondary">{row.subject}</span>
                    <span className="w-24 flex justify-center">
                      <Pill role="difficulty" variant={row.difficulty === 'easy' ? 'success' : row.difficulty === 'medium' ? 'warning' : 'danger'}>
                        {row.difficulty.toUpperCase()}
                      </Pill>
                    </span>
                    <span className="w-24 flex justify-center">
                      <Badge variant={row.status === 'active' ? 'success' : 'secondary'} size="sm">{row.status.toUpperCase()}</Badge>
                    </span>
                    <span className="w-28 flex items-center justify-center gap-2">
                      <IconButton variant="action" intent="view" size="sm"><Eye size={14} /></IconButton>
                      <IconButton variant="action" intent="edit" size="sm"><PenSquare size={14} /></IconButton>
                      <IconButton variant="action" intent="delete" size="sm"><Trash2 size={14} /></IconButton>
                    </span>
                  </div>
                </FloatingListItem>
              ))}
            </FloatingList>
          </div>

          <ComponentLabel name="MetricBlock" source="AntigravityData.tsx" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricBlock label="Questions" value={120} />
            <MetricBlock label="Accuracy" value="87%" />
            <MetricBlock label="Time Spent" value="2.5h" />
            <MetricBlock label="Rank" value="#3" />
          </div>

          <ComponentLabel name="ProgressBar" source="AntigravityData.tsx" />
          <div className="space-y-2 max-w-md">
            <ProgressBar value={75} />
            <ProgressBar value={45} color="warning" />
            <ProgressBar value={90} color="success" />
            <ProgressBar value={20} color="danger" />
          </div>
        </ShowcaseSection>

        <hr className="border-border-subtle/30" />

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 11: FEEDBACK
            ═══════════════════════════════════════════════════════════════════ */}
        <ShowcaseSection id="feedback" title="11. Feedback" subtitle="Alert, ErrorContainer, EmptyState, retry">
          <ComponentLabel name="Alert" source="Alert.tsx" />
          <div className="space-y-3 max-w-2xl">
            {alertsVisible.info && <Alert variant="info" icon={Info} title="Information" onDismiss={() => setAlertsVisible(v => ({ ...v, info: false }))}>This is an informational message.</Alert>}
            {alertsVisible.success && <Alert variant="success" icon={CheckCircle} title="Success" onDismiss={() => setAlertsVisible(v => ({ ...v, success: false }))}>Operation completed successfully.</Alert>}
            {alertsVisible.warning && <Alert variant="warning" icon={AlertTriangle} title="Warning" onDismiss={() => setAlertsVisible(v => ({ ...v, warning: false }))}>Please review before proceeding.</Alert>}
            {alertsVisible.error && <Alert variant="error" icon={XCircle} title="Error" onDismiss={() => setAlertsVisible(v => ({ ...v, error: false }))}>Something went wrong. Please try again.</Alert>}
            {!alertsVisible.info && !alertsVisible.success && !alertsVisible.warning && !alertsVisible.error && (
              <button onClick={() => setAlertsVisible({ info: true, success: true, warning: true, error: true })} className="text-xs text-text-muted hover:text-text-secondary underline">Reset alerts</button>
            )}
          </div>

          <ComponentLabel name="ErrorContainer" source="ErrorContainer.tsx" />
          <div className="max-w-lg">
            <ErrorContainer severity="high" category="network">
              <H2>Failed to Load</H2>
              <Body>Unable to fetch questions. Please check your connection.</Body>
            </ErrorContainer>
          </div>

          <ComponentLabel name="RetryButton" source="RetryButton.tsx" />
          <RetryButton onRetry={inc} />

          <ComponentLabel name="EmptyState" source="SharedComponents.tsx" />
          <div className="max-w-md">
            <EmptyState
              icon={<FileText size={48} />}
              title="No Questions Found"
              subtitle="Create your first question to get started."
            />
          </div>
        </ShowcaseSection>

        <hr className="border-border-subtle/30" />

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 12: MODALS / OVERLAYS
            ═══════════════════════════════════════════════════════════════════ */}
        <ShowcaseSection id="modals" title="12. Modals / Overlays" subtitle="AdminModal — trigger to inspect overlay, panel, focus trap">
          <ComponentLabel name="AdminModal" source="AdminModal.tsx" />

          <Row>
            <Button variant="primary" onClick={() => setModalOpen(true)}>
              Open Modal
            </Button>
          </Row>

          <AdminModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            title="Design System Modal"
          >
            <Stack gap="md">
              <Alert variant="info" icon={Info}>
                This modal demonstrates the canonical overlay, panel, shadow, radius, focus trap, and body scroll lock.
              </Alert>
              <p className="text-sm text-text-secondary">
                The modal uses <code className="text-primary bg-primary/10 px-1 rounded">rounded-[2.5rem]</code> radius,
                <code className="text-primary bg-primary/10 px-1 rounded"> shadow-2xl</code>,
                and <code className="text-primary bg-primary/10 px-1 rounded">bg-app-bg/60 backdrop-blur-md</code> overlay.
              </p>
              <p className="text-sm text-text-secondary">
                Press Escape or click the close button to dismiss. Tab cycling is trapped within this modal.
              </p>
              <Input placeholder="Focus trap test — tab through elements" />
              <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button variant="primary" onClick={() => setModalOpen(false)}>Confirm</Button>
              </div>
            </Stack>
          </AdminModal>
        </ShowcaseSection>

        <hr className="border-border-subtle/30" />

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 13: LOADING / SKELETONS
            ═══════════════════════════════════════════════════════════════════ */}
        <ShowcaseSection id="skeletons" title="13. Loading / Skeletons" subtitle="Skeleton variants — premium (gold-aware) default">
          <ComponentLabel name="Skeleton" source="Skeleton.tsx" />

          <Row label="Text Skeletons">
            <Skeleton type="text" width={200} height={16} />
            <Skeleton type="text" width={120} height={12} />
            <Skeleton type="text" width={80} height={8} />
          </Row>

          <Row label="Card Skeleton">
            <div className="w-full max-w-sm">
              <Skeleton type="card" unit="card" height={180} />
            </div>
          </Row>

          <Row label="Row Skeleton">
            <div className="w-full max-w-lg">
              <Skeleton type="card" unit="row" height={56} />
            </div>
          </Row>

          <Row label="Spinner">
            <Spinner size="sm" />
            <Spinner size="md" />
            <Spinner size="lg" />
          </Row>
        </ShowcaseSection>

        <hr className="border-border-subtle/30" />

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 14: TYPOGRAPHY
            ═══════════════════════════════════════════════════════════════════ */}
        <ShowcaseSection id="typography" title="14. Typography" subtitle="All typography roles — Vend Sans, Cinzel, Garamond">
          <ComponentLabel name="Typography" source="Typography.tsx" />

          <div className="space-y-3">
            {[
              { role: 'display' as const, label: 'Display', text: 'The Quick Brown Fox Jumps Over The Lazy Dog' },
              { role: 'page-title' as const, label: 'H1', text: 'Page Heading' },
              { role: 'section-title' as const, label: 'H2', text: 'Section Heading' },
              { role: 'card-title' as const, label: 'H3', text: 'Subsection Heading' },
              { role: 'body' as const, label: 'Body', text: 'Primary reading text for content paragraphs.' },
              { role: 'card-title' as const, label: 'Title', text: 'Card Title Text' },
              { role: 'caption' as const, label: 'Caption', text: 'Secondary metadata text' },
              { role: 'label' as const, label: 'Label', text: 'FORM LABEL' },
              { role: 'metric' as const, label: 'Metric', text: '87%' },
              { role: 'metric' as const, label: 'StatValue', text: '1,234' },
              { role: 'label' as const, label: 'StatLabel', text: 'TOTAL QUESTIONS' },
              { role: 'badge' as const, label: 'Badge', text: 'ACTIVE' },
              { role: 'navigation' as const, label: 'NavLabel', text: 'QUESTIONS' },
              { role: 'link' as const, label: 'Link', text: 'View Details' },
            ].map(item => (
              <div key={item.role} className="flex items-baseline gap-4">
                <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest w-20 shrink-0">{item.label}</span>
                <Typography role={item.role}>{item.text}</Typography>
              </div>
            ))}
          </div>

          <Row label="Font Families">
            <div className="space-y-2">
              <p className="font-['Vend_Sans'] text-sm text-text-primary">Vend Sans — Primary geometric sans-serif</p>
              <p className="font-['Cinzel'] text-sm text-text-primary">Cinzel — Decorative serif for light mode accents</p>
              <p className="font-['EB_Garamond'] italic text-sm text-text-primary">EB Garamond — Italic serif for subtitles</p>
            </div>
          </Row>
        </ShowcaseSection>

        <hr className="border-border-subtle/30" />

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 15: MOTION / HOVER
            ═══════════════════════════════════════════════════════════════════ */}
        <ShowcaseSection id="motion" title="15. Motion / Hover" subtitle="Interactive hover recipes — hover each element to see the effect">
          <ComponentLabel name="Motion Recipes" source="AntigravityMotion.ts" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { name: 'BUTTON_HOVER', desc: 'Material buttons — lift -translate-y-0.5 + shadow', cls: `${BUTTON_HOVER} bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm cursor-pointer` },
              { name: 'CARD_HOVER', desc: 'Cards — lift -translate-y-1 + 3D shadow', cls: `${CARD_HOVER} bg-card-bg border border-border-subtle px-6 py-4 rounded-2xl cursor-pointer` },
              { name: 'ROW_HOVER', desc: 'Rows — lift -translate-y-0.5 + 3D shadow', cls: `${ROW_HOVER} bg-card-bg border border-border-subtle px-6 py-3 rounded-xl cursor-pointer` },
              { name: 'GHOST_HOVER', desc: 'Ghost buttons — bg/color only, NO lift', cls: `${GHOST_HOVER} bg-hover-bg text-text-secondary px-6 py-3 rounded-xl font-bold text-sm cursor-pointer` },
            ].map(m => (
              <div key={m.name} className="space-y-2">
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{m.name}</p>
                <div className={m.cls}>Hover me — {m.desc}</div>
              </div>
            ))}
          </div>

          <Row label="Static Recipes (framer-motion — cannot demo live, shown for reference)">
            {[
              { name: 'TAB_SPRING', value: 'spring 260/32/mass 1.1' },
              { name: 'TOGGLE_SPRING', value: 'spring 260/28/mass 1' },
              { name: 'DRAWER_SPRING', value: 'spring 220/25' },
              { name: 'MODAL_TRANSITION', value: 'tween 0.2s standard' },
              { name: 'PAGE_TRANSITION', value: 'tween 0.3s standard' },
              { name: 'SELECT_POPUP_TRANSITION', value: 'tween 0.15s enter' },
              { name: 'SECTION_REVEAL', value: 'tween 0.2s standard' },
              { name: 'MENU_TRANSITION', value: 'tween 0.15s standard' },
            ].map(r => (
              <div key={r.name} className="px-3 py-2 bg-hover-bg/30 rounded-lg border border-border-subtle/30">
                <span className="text-[10px] font-bold text-primary">{r.name}</span>
                <span className="text-[10px] text-text-muted ml-2">{r.value}</span>
              </div>
            ))}
          </Row>
        </ShowcaseSection>

        <hr className="border-border-subtle/30" />

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 16: SPACING
            ═══════════════════════════════════════════════════════════════════ */}
        <ShowcaseSection id="spacing" title="16. Spacing & Radius" subtitle="Spacing scale and border radius tokens">
          <ComponentLabel name="Spacing Scale" source="themes.css" />

          <div className="flex flex-wrap items-end gap-3">
            {[
              { name: 'space-1', val: '4px', w: 4 },
              { name: 'space-2', val: '8px', w: 8 },
              { name: 'space-3', val: '12px', w: 12 },
              { name: 'space-4', val: '16px', w: 16 },
              { name: 'space-5', val: '20px', w: 20 },
              { name: 'space-6', val: '24px', w: 24 },
              { name: 'space-8', val: '32px', w: 32 },
              { name: 'space-10', val: '40px', w: 40 },
              { name: 'space-12', val: '48px', w: 48 },
            ].map(s => (
              <div key={s.name} className="flex flex-col items-center gap-1">
                <div className="bg-primary/30 rounded" style={{ width: s.w, height: 24 }} />
                <span className="text-[7px] font-bold text-text-muted uppercase">{s.name}</span>
                <span className="text-[7px] text-text-hint">{s.val}</span>
              </div>
            ))}
          </div>

          <ComponentLabel name="Border Radius" source="themes.css" />
          <div className="flex flex-wrap items-center gap-4">
            {[
              { name: 'button-xs', val: '10px', cls: 'rounded-button-xs' },
              { name: 'button-sm', val: '12px', cls: 'rounded-button-sm' },
              { name: 'button-md', val: '14px', cls: 'rounded-button-md' },
              { name: 'button-xl', val: '16px', cls: 'rounded-button-xl' },
              { name: 'input (radius-md)', val: '12px', cls: 'rounded-xl' },
              { name: 'card (radius-xl)', val: '20px', cls: 'rounded-2xl' },
              { name: 'modal', val: '40px', cls: 'rounded-[2.5rem]' },
            ].map(r => (
              <div key={r.name} className="flex flex-col items-center gap-1">
                <div className={`w-16 h-16 bg-card-bg border border-border-subtle ${r.cls}`} />
                <span className="text-[7px] font-bold text-text-muted uppercase text-center leading-tight">{r.name}</span>
                <span className="text-[7px] text-text-hint">{r.val}</span>
              </div>
            ))}
          </div>
        </ShowcaseSection>

        <hr className="border-border-subtle/30" />

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 17: RESPONSIVE
            ═══════════════════════════════════════════════════════════════════ */}
        <ShowcaseSection id="responsive" title="17. Responsive Examples" subtitle="Grid and layout behavior at different breakpoints">
          <ComponentLabel name="Responsive Grid" source="AntigravityLayout.tsx" />

          <div className="space-y-4">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Grid cols=1 / sm:2 / lg:4</p>
            <Grid cols={1} gap={4} className="sm:grid-cols-2 lg:grid-cols-4">
              {['A', 'B', 'C', 'D'].map(i => (
                <Card key={i} variant="elevated" padding={16}>
                  <p className="text-sm font-bold text-text-primary">Item {i}</p>
                  <p className="text-xs text-text-secondary">Responsive card</p>
                </Card>
              ))}
            </Grid>

            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Stack gap=sm / md / lg</p>
            <div className="flex gap-4">
              <Stack gap="sm" className="flex-1">
                <div className="bg-primary/10 rounded-lg p-2 text-xs text-text-primary text-center">sm</div>
                <div className="bg-primary/10 rounded-lg p-2 text-xs text-text-primary text-center">sm</div>
              </Stack>
              <Stack gap="md" className="flex-1">
                <div className="bg-primary/10 rounded-lg p-2 text-xs text-text-primary text-center">md</div>
                <div className="bg-primary/10 rounded-lg p-2 text-xs text-text-primary text-center">md</div>
              </Stack>
              <Stack gap="lg" className="flex-1">
                <div className="bg-primary/10 rounded-lg p-2 text-xs text-text-primary text-center">lg</div>
                <div className="bg-primary/10 rounded-lg p-2 text-xs text-text-primary text-center">lg</div>
              </Stack>
            </div>
          </div>
        </ShowcaseSection>

        <hr className="border-border-subtle/30" />

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 18: ACCESSIBILITY
            ═══════════════════════════════════════════════════════════════════ */}
        <ShowcaseSection id="accessibility" title="18. Accessibility Examples" subtitle="Focus rings, ARIA patterns, keyboard navigation">
          <ComponentLabel name="Focus Ring" source="AntigravityMotion.ts" />

          <div className="space-y-4">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
              Tab through these elements to see FOCUS_RING (ring-2 ring-primary/50 ring-offset-2)
            </p>
            <Row>
              <Button variant="primary" size="sm">Button</Button>
              <Button variant="secondary" size="sm">Secondary</Button>
              <Button variant="ghost" size="sm">Ghost</Button>
              <IconButton variant="ghost" size="sm"><Settings size={16} /></IconButton>
            </Row>

            <Row label="ARIA Roles Demo">
              <div className="flex items-center gap-2 text-xs text-text-secondary">
                <span className="px-2 py-1 bg-primary/10 text-primary rounded text-[9px] font-bold">role="dialog"</span>
                <span className="px-2 py-1 bg-success/10 text-success rounded text-[9px] font-bold">role="switch"</span>
                <span className="px-2 py-1 bg-warning/10 text-warning rounded text-[9px] font-bold">role="combobox"</span>
                <span className="px-2 py-1 bg-danger/10 text-danger rounded text-[9px] font-bold">role="alert"</span>
                <span className="px-2 py-1 bg-info/10 text-info rounded text-[9px] font-bold">role="status"</span>
              </div>
            </Row>

            <Row label="Interactive ARIA Demo">
              <Switch checked={switchVal} onChange={setSwitchVal} label="role=switch aria-checked" />
              <Checkbox checked={checkVal} onChange={setCheckVal} label="keyboard focusable" />
            </Row>
          </div>
        </ShowcaseSection>

        <hr className="border-border-subtle/30" />

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 19: EXAM-SPECIFIC
            ═══════════════════════════════════════════════════════════════════ */}
        <ShowcaseSection id="exam" title="19. Exam-Specific Components" subtitle="Question card, options, badges in exam context">
          <ComponentLabel name="QuestionCard" source="QuestionCard.tsx" />
          <QuestionCard
            question={MOCK_QUESTIONS[0]}
            index={0}
            total={3}
            displayLang={examLang}
            onToggleLang={setExamLang}
            selectedAnswer={selectedAnswer}
            onSelectOption={(opt) => setSelectedAnswer(prev => prev === opt ? null : opt)}
            isMarkedForReview={isMarked}
            onToggleReview={() => setIsMarked(v => !v)}
          />

          <ComponentLabel name="BilingualToggle" source="BilingualToggle.tsx" />
          <BilingualToggle displayLang={examLang} onChange={setExamLang} />
        </ShowcaseSection>

        <hr className="border-border-subtle/30" />

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 20: USER DASHBOARD — Containers, Hover, Surfaces, Icons
            ═══════════════════════════════════════════════════════════════════ */}
        <ShowcaseSection id="dashboard" title="20. User Dashboard" subtitle="Containers, hover effects, surface colors, and icons from UserDashboard.tsx">
          <ComponentLabel name="WelcomeBanner" source="WelcomeBanner.tsx" role="premium surface container" />

          {/* --- WelcomeBanner replica --- */}
          <section className="relative overflow-hidden min-h-[200px] rounded-2xl bg-card-premium-surface light:bg-[image:var(--gradient-header)] shadow-elevation-2 border border-border-subtle">
            <div className="absolute inset-0 opacity-40 bg-cover bg-center" style={{ backgroundImage: "url('/bg/hero-banner.jpg')" }} />
            <div className="relative z-[2] p-5 md:p-8 text-white">
              <div className="mb-6">
                <Typography role="label" color="inherit" className="mb-1">WELCOME BACK</Typography>
                <Typography role="display" color="inherit" className="uppercase">Hi, Learner</Typography>
                <Typography role="body" as="p" color="inherit" className="italic mt-[6px]">Your daily practice dashboard</Typography>
                <div className="w-12 h-[1px] mb-5 bg-white/40" />
                <Typography role="card-title" color="inherit">Today's Progress</Typography>
                <Typography role="body" color="inherit" className="text-sm italic mt-[6px]">Keep the streak going</Typography>
              </div>
            </div>
          </section>

          <div className="mt-4 text-[9px] font-bold text-text-muted uppercase tracking-widest space-y-1">
            <p>Surface: <code className="text-primary bg-primary/10 px-1 rounded">bg-card-premium-surface</code> dark / <code className="text-primary bg-primary/10 px-1 rounded">light:bg-[image:var(--gradient-header)]</code> light</p>
            <p>Shadow: <code className="text-primary bg-primary/10 px-1 rounded">shadow-elevation-2</code> | Border: <code className="text-primary bg-primary/10 px-1 rounded">border-border-subtle</code></p>
            <p>Text: all white via parent <code className="text-primary bg-primary/10 px-1 rounded">text-white</code> | Divider: <code className="text-primary bg-primary/10 px-1 rounded">bg-white/40</code></p>
          </div>

          <hr className="border-border-subtle/30" />

          {/* --- StatCards --- */}
          <ComponentLabel name="StatCard Grid" source="DashboardStatsGrid.tsx" role="4 stat cards with hover" />

          <Grid cols={2} lg={4} className="grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 lg:gap-6">
            <StatCard icon={Flame} label="STREAK" value="12" unit="Days" status="warning" />
            <StatCard icon={GraduationCap} label="WISDOM" value="48" unit="Exams" status="accent" />
            <StatCard icon={Target} label="PRECISION" value="87" unit="%" status="info" />
            <StatCard icon={Trophy} label="STANDING" value="#3" status="secondary" />
          </Grid>

          <div className="mt-4 text-[9px] font-bold text-text-muted uppercase tracking-widest space-y-1">
            <p>Hover: <code className="text-primary bg-primary/10 px-1 rounded">CARD_HOVER</code> = <code className="text-text-secondary">hover:-translate-y-1 hover:shadow-card-hover-3d</code></p>
            <p>Dark surface: <code className="text-primary bg-primary/10 px-1 rounded">bg-card-bg</code> | Light: <code className="text-primary bg-primary/10 px-1 rounded">stat-card-surface</code></p>
            <p>Icon bg: <code className="text-primary bg-primary/10 px-1 rounded">bg-stat-icon-bg</code> | Label: <code className="text-primary bg-primary/10 px-1 rounded">text-stat-label-text</code> | Value: <code className="text-primary bg-primary/10 px-1 rounded">text-stat-value-text</code></p>
          </div>

          <hr className="border-border-subtle/30" />

          {/* --- PremiumIconContainer status variants --- */}
          <ComponentLabel name="PremiumIconContainer Status Colors" source="AntigravityCard.tsx" role="icon container per status" />

          <Row>
            {[
              { status: 'warning', icon: Flame, label: 'Flame/warning', color: 'text-warning' },
              { status: 'accent', icon: GraduationCap, label: 'GradCap/accent', color: 'text-primary' },
              { status: 'info', icon: Target, label: 'Target/info', color: 'text-info' },
              { status: 'secondary', icon: Trophy, label: 'Trophy/secondary', color: 'text-[var(--color-secondary)]' },
            ].map(s => (
              <div key={s.status} className="flex flex-col items-center gap-1">
                <div className={`w-12 h-12 rounded-stat-icon-radius flex items-center justify-center bg-stat-icon-bg ${s.color}`}>
                  <s.icon size={20} />
                </div>
                <span className="text-[8px] font-bold text-text-muted uppercase">{s.label}</span>
              </div>
            ))}
            <div className="flex flex-col items-center gap-1">
              <div className="w-12 h-12 rounded-stat-icon-radius flex items-center justify-center bg-hover-bg text-text-secondary">
                <TrendingUp size={20} />
              </div>
              <span className="text-[8px] font-bold text-text-muted uppercase">Card icon/default</span>
            </div>
          </Row>

          <hr className="border-border-subtle/30" />

          {/* --- Soft Button variant --- */}
          <ComponentLabel name="Soft Button Variant" source="AntigravityButton.tsx" role="used in RecentActivity header" />

          <Row>
            <Button variant="soft">Analytics</Button>
            <Button variant="soft" disabled>Disabled Soft</Button>
          </Row>

          <div className="mt-2 text-[9px] font-bold text-text-muted uppercase tracking-widest">
            <p>Dark: <code className="text-primary bg-primary/10 px-1 rounded">bg-primary/10 text-primary border-primary/20</code> | Hover: <code className="text-primary bg-primary/10 px-1 rounded">hover:bg-primary/20</code></p>
          </div>

          <hr className="border-border-subtle/30" />

          {/* --- AttemptCard surface --- */}
          <ComponentLabel name="AttemptCard / RecentActivity Card" source="RecentAttemptCard.tsx" role="card with group hover" />

          <Card variant="default" padding={20} className="w-full group">
            <div className="flex justify-between items-center mb-4">
              <Badge variant="primary" size="sm">PRACTICE</Badge>
              <div className="w-9 h-9 rounded-button-xs flex items-center justify-center bg-hover-bg text-text-secondary">
                <TrendingUp size={16} />
              </div>
            </div>
            <div className="flex flex-col md:grid md:grid-cols-[1fr_auto] gap-4">
              <div className="space-y-3">
                <Body className="m-0 font-bold leading-tight uppercase tracking-tight">Indian Geography Paper</Body>
                <div className="flex items-center justify-between md:justify-start gap-8">
                  <Body className="m-0 font-bold text-text-secondary">19 Aug 2026</Body>
                  <div className="flex flex-col text-right md:hidden">
                    <Typography role="metric" color="success">72%</Typography>
                  </div>
                </div>
              </div>
              <div className="hidden md:flex flex-col text-right">
                <Label>Performance</Label>
                <Typography role="metric" color="success">72%</Typography>
              </div>
            </div>
            <div className="mt-auto pt-4 border-t border-border-subtle/30 flex items-center justify-between">
              <div className="flex items-baseline gap-1">
                <Typography role="metric">156</Typography>
                <Label>Pts</Label>
              </div>
              <Typography role="link" className="flex items-center gap-1">Full Review <ChevronRight size={16} /></Typography>
            </div>
          </Card>

          <div className="mt-4 text-[9px] font-bold text-text-muted uppercase tracking-widest space-y-1">
            <p>Hover: <code className="text-primary bg-primary/10 px-1 rounded">CARD_HOVER</code> (same as StatCard)</p>
            <p>Group: <code className="text-primary bg-primary/10 px-1 rounded">group</code> class on Card for child hover targeting</p>
            <p>Divider: <code className="text-primary bg-primary/10 px-1 rounded">border-border-subtle/30</code> | Link: <code className="text-primary bg-primary/10 px-1 rounded">var(--text-link)</code></p>
            <p>Icon container: <code className="text-primary bg-primary/10 px-1 rounded">bg-hover-bg text-text-secondary</code></p>
          </div>

          <hr className="border-border-subtle/30" />

          {/* --- EmptyState premium surface --- */}
          <ComponentLabel name="EmptyState Premium Surface" source="SharedComponents.tsx" role="empty state with premium bg" />

          <div className="max-w-md">
            <EmptyState
              icon={<BarChart3 size={48} className="text-primary" />}
              title="No Activity Yet"
              subtitle="Take your first practice exam to see results here."
            />
          </div>

          <div className="mt-4 text-[9px] font-bold text-text-muted uppercase tracking-widest space-y-1">
            <p>Surface: <code className="text-primary bg-primary/10 px-1 rounded">stat-card-surface</code> + <code className="text-primary bg-primary/10 px-1 rounded">GOLD_LIGHT_MATERIAL</code></p>
            <p>Border: <code className="text-primary bg-primary/10 px-1 rounded">border-gold-300</code> | Radius: <code className="text-primary bg-primary/10 px-1 rounded">rounded-[32px]</code></p>
          </div>

          <hr className="border-border-subtle/30" />

          {/* --- Skeleton Loading States --- */}
          <ComponentLabel name="Dashboard Skeleton States" source="SharedComponents.tsx" role="loading placeholders" />

          <div className="space-y-4">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">StatSkeleton (4-col grid)</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="flex items-center gap-3 h-20 px-4 py-4 rounded-2xl bg-[var(--skeleton-surface)] border border-[var(--border-subtle)] shadow-[var(--card-shadow)] light:stat-card-surface light:shadow-premium-card light:border-card-premium-border">
                  <div className="w-11 h-11 rounded-stat-icon-radius bg-[var(--skeleton-block)] animate-pulse" />
                  <div className="flex flex-col gap-1 flex-1">
                    <div className="w-3/5 h-2.5 rounded-full bg-[var(--skeleton-block)] animate-pulse" />
                    <div className="w-2/5 h-5 rounded-full bg-[var(--skeleton-block)] animate-pulse" />
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Card Skeleton (3-col grid, static lift)</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3].map(i => (
                <div key={i} className="bg-[var(--skeleton-surface)] border border-card-premium-border shadow-[var(--card-shadow)] light:stat-card-surface light:shadow-premium-card light:border-card-premium-border -translate-y-1 shadow-card-hover-3d rounded-2xl p-6 animate-pulse">
                  <div className="flex justify-between mb-4">
                    <div className="w-16 h-5 rounded-full bg-[var(--skeleton-block)] animate-pulse" />
                    <div className="w-9 h-9 rounded-button-xs bg-[var(--skeleton-block)] animate-pulse" />
                  </div>
                  <div className="w-3/4 h-3 rounded-full bg-[var(--skeleton-block)] animate-pulse mb-3" />
                  <div className="w-1/2 h-2 rounded-full bg-[var(--skeleton-block)] animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          <hr className="border-border-subtle/30" />

          {/* --- ErrorContainer with all category icons --- */}
          <ComponentLabel name="ErrorContainer Category Icons" source="ErrorContainer.tsx" role="error category mapping" />

          <Row>
            {[
              { icon: WifiOff, label: 'network', color: 'text-danger' },
              { icon: Clock, label: 'timeout', color: 'text-warning' },
              { icon: ShieldAlert, label: 'auth', color: 'text-danger' },
              { icon: ServerCrash, label: 'server', color: 'text-danger' },
              { icon: AlertCircle, label: 'validation', color: 'text-info' },
              { icon: Ban, label: 'rateLimit', color: 'text-danger' },
              { icon: Wrench, label: 'maintenance', color: 'text-warning' },
              { icon: AlertTriangle, label: 'business', color: 'text-warning' },
            ].map(e => (
              <div key={e.label} className="flex flex-col items-center gap-1">
                <IconBadge icon={e.icon} size="lg" status={e.label === 'timeout' || e.label === 'maintenance' || e.label === 'business' ? 'warning' : e.label === 'validation' ? 'primary' : 'danger'} shape="rounded" />
                <span className="text-[8px] font-bold text-text-muted uppercase">{e.label}</span>
              </div>
            ))}
          </Row>

          <hr className="border-border-subtle/30" />

          {/* --- Complete Surface Color Palette (Dashboard-specific) --- */}
          <ComponentLabel name="Dashboard Surface Color Palette" role="all tokens used in UserDashboard" source="themes.css" />

          <div className="space-y-4">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Background Tokens</p>
            <Row>
              {[
                { name: 'bg-card-bg', cls: 'bg-card-bg' },
                { name: 'bg-card-premium-surface', cls: 'bg-card-premium-surface' },
                { name: 'bg-hover-bg', cls: 'bg-hover-bg' },
                { name: 'bg-stat-icon-bg', cls: 'bg-stat-icon-bg' },
                { name: 'stat-card-surface', cls: 'stat-card-surface' },
                { name: 'bg-skeleton-surface', cls: 'bg-[var(--skeleton-surface)]' },
                { name: 'bg-skeleton-block', cls: 'bg-[var(--skeleton-block)]' },
                { name: 'bg-primary/10', cls: 'bg-primary/10' },
                { name: 'bg-danger/10', cls: 'bg-danger/10' },
              ].map(t => (
                <div key={t.name} className="flex flex-col items-center gap-1">
                  <div className={`w-12 h-12 rounded-xl border border-border-subtle ${t.cls}`} />
                  <span className="text-[7px] font-bold text-text-muted uppercase text-center leading-tight">{t.name}</span>
                </div>
              ))}
            </Row>

            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Text Tokens</p>
            <Row>
              {[
                { name: 'text-text-primary', cls: 'text-text-primary' },
                { name: 'text-text-secondary', cls: 'text-text-secondary' },
                { name: 'text-text-muted', cls: 'text-text-muted' },
                { name: 'text-stat-label-text', cls: 'text-stat-label-text' },
                { name: 'text-stat-value-text', cls: 'text-stat-value-text' },
                { name: 'text-primary', cls: 'text-primary' },
                { name: 'text-warning', cls: 'text-warning' },
                { name: 'text-info', cls: 'text-info' },
                { name: 'text-success', cls: 'text-success' },
                { name: 'text-danger', cls: 'text-danger' },
              ].map(t => (
                <div key={t.name} className="flex flex-col items-center gap-1">
                  <span className={`text-lg font-bold ${t.cls}`}>Aa</span>
                  <span className="text-[7px] font-bold text-text-muted uppercase text-center leading-tight">{t.name}</span>
                </div>
              ))}
            </Row>

            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Shadow Tokens</p>
            <Row>
              {[
                { name: 'shadow-card-shadow', cls: 'shadow-card-shadow' },
                { name: 'shadow-elevation-2', cls: 'shadow-elevation-2' },
                { name: 'shadow-card-hover-3d', cls: 'shadow-card-hover-3d' },
                { name: 'shadow-premium-card', cls: 'shadow-premium-card' },
                { name: 'shadow-primary/20', cls: 'shadow-primary/20' },
              ].map(t => (
                <div key={t.name} className="flex flex-col items-center gap-1">
                  <div className={`w-16 h-16 rounded-xl bg-card-bg ${t.cls}`} />
                  <span className="text-[7px] font-bold text-text-muted uppercase text-center leading-tight">{t.name}</span>
                </div>
              ))}
            </Row>
          </div>

          <hr className="border-border-subtle/30" />

          {/* --- Dashboard Icon Inventory --- */}
          <ComponentLabel name="Dashboard Icon Inventory" role="all Lucide icons used in UserDashboard" />

          <Row>
            {[
              { icon: Flame, name: 'Flame', usage: 'Streak stat' },
              { icon: GraduationCap, name: 'GraduationCap', usage: 'Exams stat' },
              { icon: Target, name: 'Target', usage: 'Accuracy stat' },
              { icon: Trophy, name: 'Trophy', usage: 'Rank stat' },
              { icon: TrendingUp, name: 'TrendingUp', usage: 'AttemptCard icon' },
              { icon: ArrowRight, name: 'ArrowRight', usage: 'Analytics button' },
              { icon: BarChart3, name: 'BarChart3', usage: 'EmptyState icon' },
              { icon: ChevronRight, name: 'ChevronRight', usage: 'Review link' },
            ].map(ic => (
              <div key={ic.name} className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-xl bg-hover-bg flex items-center justify-center text-text-secondary">
                  <ic.icon size={18} />
                </div>
                <span className="text-[7px] font-bold text-text-muted uppercase text-center leading-tight">{ic.name}</span>
                <span className="text-[7px] text-text-hint text-center">{ic.usage}</span>
              </div>
            ))}
          </Row>

          <hr className="border-border-subtle/30" />

          {/* --- Motion / Hover applied in Dashboard --- */}
          <ComponentLabel name="Dashboard Motion Applied" role="hover recipes as used in dashboard" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest">CARD_HOVER (StatCard + AttemptCard)</p>
              <div className={`${CARD_HOVER} bg-card-bg border border-border-subtle px-6 py-4 rounded-2xl cursor-pointer`}>
                Hover me — lift -translate-y-1 + 3D shadow
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest">GHOST_HOVER (Soft button)</p>
              <div className={`${GHOST_HOVER} bg-primary/10 text-primary border border-primary/20 px-6 py-3 rounded-xl font-bold text-sm cursor-pointer`}>
                Hover me — bg shift, NO lift
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest">FOCUS_RING (all interactive)</p>
              <div className="bg-card-bg border border-border-subtle px-6 py-3 rounded-xl font-bold text-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2" tabIndex={0}>
                Tab to me — ring focus
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Skeleton static lift</p>
              <div className="bg-[var(--skeleton-surface)] border border-card-premium-border -translate-y-1 shadow-card-hover-3d rounded-2xl p-4 animate-pulse">
                Permanent lift — not hover-triggered
              </div>
            </div>
          </div>

          <hr className="border-border-subtle/30" />

          {/* --- Light Mode Overrides --- */}
          <ComponentLabel name="Light Mode Premium Overrides" role="GOLD_LIGHT_MATERIAL applied in dashboard" />

          <div className="space-y-3">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">GOLD_LIGHT_MATERIAL</p>
            <code className="block text-[9px] text-text-secondary bg-hover-bg/30 p-3 rounded-xl border border-border-subtle/30">
              light:stat-card-surface light:shadow-premium-card light:border-card-premium-border
            </code>
            <p className="text-[9px] text-text-secondary">Applied to: StatCard, AttemptCard, Skeleton cards, EmptyState — all premium surfaces get forest gradient in light mode</p>
          </div>

          <div className="space-y-3 mt-4">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">PremiumIconContainer Light</p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-stat-icon-radius flex items-center justify-center bg-stat-icon-bg text-warning dark-only">Dark</div>
              <div className="w-12 h-12 rounded-stat-icon-radius flex items-center justify-center bg-[image:var(--gradient-header)] text-[var(--ancient-gold-bright)] shadow-premium-icon">Light</div>
            </div>
            <code className="block text-[9px] text-text-secondary bg-hover-bg/30 p-3 rounded-xl border border-border-subtle/30">
              light:bg-[image:var(--gradient-header)] light:text-[var(--ancient-gold-bright)] light:shadow-premium-icon
            </code>
          </div>
        </ShowcaseSection>

        <hr className="border-border-subtle/30" />

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 21: BUTTON VARIANTS — DARK & LIGHT
            One button per variant. Source className shown below each.
            ═══════════════════════════════════════════════════════════════════ */}
        <ShowcaseSection id="buttons-dark-light" title="21. Button Variants — Dark & Light" subtitle="Source: AntigravityButton.tsx | Hover: AntigravityMotion.ts | Radius: rounded-button-md (14px) via sizeVariants">

          {/* ── Radius Reference ── */}
          <div className="flex flex-wrap items-center gap-3 text-[9px] font-bold text-text-muted uppercase tracking-widest">
            <span>Radius:</span>
            {[
              { name: 'xs', val: '10px', cls: 'rounded-button-xs' },
              { name: 'sm', val: '12px', cls: 'rounded-button-sm' },
              { name: 'md', val: '14px', cls: 'rounded-button-md' },
              { name: 'xl', val: '16px', cls: 'rounded-button-xl' },
            ].map(r => (
              <span key={r.name} className="px-2 py-1 bg-hover-bg/30 rounded-lg border border-border-subtle/30">
                {r.name} <span className="text-text-hint">({r.val})</span>
              </span>
            ))}
          </div>

          {/* ── DARK MODE ── */}
          <div className="space-y-4 p-6 rounded-2xl bg-[#0a0e1a] border border-[#1e293b]">
            <p className="text-[11px] font-black text-white uppercase tracking-widest">Dark Mode</p>

            {[
              {
                variant: 'primary' as const,
                label: 'Primary',
                className: 'rounded-button-md bg-primary text-white border-transparent shadow-elevation-2 shadow-primary/20',
                hover: 'BUTTON_HOVER → hover:-translate-y-0.5 hover:shadow-card-hover-3d',
              },
              {
                variant: 'secondary' as const,
                label: 'Secondary',
                className: 'rounded-button-md bg-button-surface-secondary text-button-text-secondary border-button-border-secondary shadow-button-secondary',
                hover: 'BUTTON_HOVER → hover:bg-button-surface-secondary-hover',
              },
              {
                variant: 'success' as const,
                label: 'Success',
                className: 'rounded-button-md bg-success text-white border-transparent shadow-elevation-2 shadow-success/20',
                hover: 'BUTTON_HOVER → hover:-translate-y-0.5 hover:shadow-card-hover-3d',
              },
              {
                variant: 'danger' as const,
                label: 'Danger',
                className: 'rounded-button-md bg-danger text-white border-transparent shadow-elevation-2 shadow-danger/20',
                hover: 'BUTTON_HOVER → hover:-translate-y-0.5 hover:shadow-card-hover-3d',
              },
              {
                variant: 'soft' as const,
                label: 'Soft',
                className: 'rounded-button-md bg-primary/10 text-primary border border-primary/20',
                hover: 'GHOST_HOVER → hover:bg-primary/20 (no lift, no shadow)',
              },
              {
                variant: 'ghost' as const,
                label: 'Ghost',
                className: 'rounded-button-md bg-button-surface-ghost text-button-text-ghost border-button-border-ghost shadow-none',
                hover: 'GHOST_HOVER → hover:bg-button-surface-ghost-hover hover:text-button-text-ghost-hover',
              },
            ].map(v => (
              <div key={v.variant} className="space-y-1">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{v.label}</p>
                <Button variant={v.variant}>{v.label} Button</Button>
                <code className="block text-[8px] text-slate-500 bg-black/40 p-2 rounded-lg border border-slate-800 leading-relaxed">
                  {v.className}<br/>Hover: {v.hover}
                </code>
              </div>
            ))}
          </div>

          {/* ── LIGHT MODE ── */}
          <div className="space-y-4 p-6 rounded-2xl bg-[#faf8f5] border border-[#e8e0d4]">
            <p className="text-[11px] font-black text-[#2d2418] uppercase tracking-widest">Light Mode</p>

            {[
              {
                variant: 'primary' as const,
                label: 'Primary',
                className: 'rounded-button-md bg-[image:var(--material-button-primary-surface)] text-[var(--material-button-primary-text)] border-[var(--border-premium-width)] border-[var(--material-button-primary-border)] shadow-[var(--material-button-primary-shadow)] → elevation-carved (3D)',
                hover: 'BUTTON_HOVER → hover:-translate-y-0.5 hover:shadow-card-hover-3d',
              },
              {
                variant: 'secondary' as const,
                label: 'Secondary',
                className: 'rounded-button-md bg-button-surface-secondary text-button-text-secondary border-[var(--border-premium-width)] border-button-border-secondary shadow-button-secondary → elevation-carved (3D)',
                hover: 'BUTTON_HOVER → hover:bg-button-surface-secondary-hover',
              },
              {
                variant: 'success' as const,
                label: 'Success',
                className: 'rounded-button-md bg-success text-white border border-transparent shadow-elevation-2 shadow-success/20',
                hover: 'BUTTON_HOVER → hover:-translate-y-0.5 hover:shadow-card-hover-3d',
              },
              {
                variant: 'danger' as const,
                label: 'Danger',
                className: 'rounded-button-md bg-danger text-white border border-transparent shadow-elevation-2 shadow-danger/20',
                hover: 'BUTTON_HOVER → hover:-translate-y-0.5 hover:shadow-card-hover-3d',
              },
              {
                variant: 'soft' as const,
                label: 'Soft',
                className: 'rounded-button-md bg-primary/10 text-primary border border-primary/20',
                hover: 'GHOST_HOVER → hover:bg-primary/20 (no lift, no shadow)',
              },
              {
                variant: 'ghost' as const,
                label: 'Ghost',
                className: 'rounded-button-md bg-button-surface-ghost text-button-text-ghost border-button-border-ghost shadow-none',
                hover: 'GHOST_HOVER → hover:bg-button-surface-ghost-hover hover:text-button-text-ghost-hover',
              },
            ].map(v => (
              <div key={v.variant} className="space-y-1">
                <p className="text-[9px] font-bold text-[#8b7355] uppercase tracking-widest">{v.label}</p>
                <Button variant={v.variant}>{v.label} Button</Button>
                <code className="block text-[8px] text-[#8b7355] bg-white/60 p-2 rounded-lg border border-[#e8e0d4] leading-relaxed">
                  {v.className}<br/>Hover: {v.hover}
                </code>
              </div>
            ))}
          </div>
        </ShowcaseSection>

        <hr className="border-border-subtle/30" />

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 22: EXAM VIEW & REVIEW ELEMENTS
            ═══════════════════════════════════════════════════════════════════ */}
        <ShowcaseSection id="exam-view-review" title="22. Exam View & Review Elements" subtitle="Live exam components and post-exam review elements with real renders">

          {/* ── EXAM VIEW ── */}
          <div className="space-y-6">
            <p className="text-[11px] font-black text-primary uppercase tracking-widest">Exam View Elements</p>

            {/* ExamHeader + ExamTimer */}
            <ComponentLabel name="ExamHeader" source="ExamHeader.tsx" />
            <div className="rounded-2xl overflow-hidden border border-border-subtle">
              <ExamHeader
                title="APPSC Group 2 Prelims 2025"
                subtitle="Indian Polity & Governance"
                timerSlot={
                  <div className="flex items-center gap-2 px-4 py-2 rounded-2xl border-2 border-success/20 bg-elevated-bg">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-text-muted">Remaining</span>
                    <span className="text-2xl tabular-nums font-sans text-success font-bold">42:18</span>
                  </div>
                }
                rightActions={
                  <Button variant="primary" size="sm">
                    <Send size={14} /> Finish
                  </Button>
                }
              />
            </div>

            {/* QuestionCard — interactive demo */}
            <ComponentLabel name="QuestionCard" source="QuestionCard.tsx" variant="interactive demo" />
            <QuestionCard
              question={MOCK_QUESTIONS[0]}
              index={0}
              total={3}
              displayLang={examLang}
              onToggleLang={setExamLang}
              selectedAnswer={selectedAnswer}
              onSelectOption={(opt) => setSelectedAnswer(prev => prev === opt ? null : opt)}
              isMarkedForReview={isMarked}
              onToggleReview={() => setIsMarked(v => !v)}
            />

            {/* QuestionOptions — all states */}
            <ComponentLabel name="QuestionOptions" source="QuestionOptions.tsx" variant="state showcase" />
            <Card variant="elevated" padding={16}>
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3">Default (none selected)</p>
                  <QuestionOptions
                    options={['Paris is the capital of France', 'London is the capital of France', 'Berlin is the capital of France', 'Madrid is the capital of France']}
                    selectedAnswer={null}
                    onSelect={() => {}}
                  />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3">Selected (Option A)</p>
                  <QuestionOptions
                    options={['Paris is the capital of France', 'London is the capital of France', 'Berlin is the capital of France', 'Madrid is the capital of France']}
                    selectedAnswer="A"
                    onSelect={() => {}}
                  />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3">Review Mode — Correct (A) + Wrong selection (B)</p>
                  <QuestionOptions
                    options={['Paris is the capital of France', 'London is the capital of France', 'Berlin is the capital of France', 'Madrid is the capital of France']}
                    selectedAnswer="B"
                    onSelect={() => {}}
                    showCorrect
                    correctOption="A"
                    userAnswer="B"
                  />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3">Disabled</p>
                  <QuestionOptions
                    options={['Paris is the capital of France', 'London is the capital of France', 'Berlin is the capital of France', 'Madrid is the capital of France']}
                    selectedAnswer={null}
                    onSelect={() => {}}
                    disabled
                  />
                </div>
              </div>
            </Card>

            {/* QuestionActions */}
            <ComponentLabel name="QuestionActions" source="QuestionActions.tsx" />
            <Card variant="elevated" padding={16}>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3">Default (not marked)</p>
                  <QuestionActions displayLang="en" onToggleLang={() => {}} isMarkedForReview={false} onToggleReview={() => {}} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3">Marked for Review</p>
                  <QuestionActions displayLang="en" onToggleLang={() => {}} isMarkedForReview={true} onToggleReview={() => {}} />
                </div>
              </div>
            </Card>

            {/* QuestionPalette */}
            <ComponentLabel name="QuestionPalette" source="QuestionPalette.tsx" />
            <Card variant="elevated" padding={16}>
              <div className="grid grid-cols-5 gap-2 max-w-xs">
                {MOCK_QUESTIONS.map((q, i) => {
                  const states = [
                    'bg-success text-white border-success ring-2 ring-success/30 shadow-md shadow-success/30 scale-105 z-10',
                    'bg-warning text-white border-warning shadow-sm shadow-warning/30',
                    'bg-transparent light:bg-white text-text-muted border-border-subtle',
                  ]
                  return (
                    <button key={q.id} className={`h-11 rounded-xl flex items-center justify-center text-[11px] font-bold border transition-all ${states[i]}`}>
                      {i + 1}
                    </button>
                  )
                })}
                {['bg-purple-500 text-white border-purple-500 shadow-sm', 'bg-info text-white border-info shadow-sm', 'bg-transparent light:bg-white text-text-muted border-border-subtle', 'bg-warning text-white border-warning shadow-sm', 'bg-success text-white border-success ring-2 ring-success/30'].map((cls, i) => (
                  <button key={`extra-${i}`} className={`h-11 rounded-xl flex items-center justify-center text-[11px] font-bold border transition-all ${cls}`}>
                    {i + 4}
                  </button>
                ))}
              </div>
              <p className="text-[9px] text-text-muted mt-3 uppercase tracking-widest">Current (green) · Answered (amber) · Marked (purple) · Skipped (blue) · Not Visited</p>
            </Card>

            {/* QuestionNavigator */}
            <ComponentLabel name="QuestionNavigator" source="QuestionNavigator.tsx" />
            <Card variant="elevated" padding={16}>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3">Mid-exam (Prev / Clear / Skip / Next)</p>
                  <div className="md:flex hidden items-center justify-between gap-4">
                    <div className="flex gap-3">
                      <button className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold uppercase tracking-widest bg-hover-bg text-text-secondary border border-border-subtle rounded-[13px]">
                        <ChevronLeft size={16} /> Prev
                      </button>
                      <button className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold uppercase tracking-widest bg-hover-bg text-text-secondary border border-border-subtle rounded-[13px]">
                        <Trash2 size={14} /> Clear
                      </button>
                    </div>
                    <div className="flex gap-3">
                      <button className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold uppercase tracking-widest bg-hover-bg text-text-secondary border border-border-subtle rounded-[13px]">
                        Skip <ChevronRight size={16} />
                      </button>
                      <button className="flex items-center gap-2 px-8 py-3 text-[13px] font-bold uppercase tracking-widest bg-primary text-white shadow-primary/20 rounded-[13px]">
                        Next <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3">Last question (Submit Exam)</p>
                  <div className="md:flex hidden items-center justify-end gap-3">
                    <button className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold uppercase tracking-widest bg-hover-bg text-text-secondary border border-border-subtle rounded-[13px]">
                      <ChevronLeft size={16} /> Prev
                    </button>
                    <button className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold uppercase tracking-widest bg-danger text-white shadow-danger/20 rounded-[13px]">
                      <Send size={16} /> Submit Exam
                    </button>
                  </div>
                </div>
              </div>
            </Card>

            {/* SubmitExamModal */}
            <ComponentLabel name="SubmitExamModal" source="SubmitExamModal.tsx" />
            <div className="flex gap-3">
              <Button variant="primary" onClick={() => setModalOpen(true)}>Open Submit Modal</Button>
            </div>
            <AdminModal
              isOpen={modalOpen}
              onClose={() => setModalOpen(false)}
              title="Submit Exam"
              description="Review your progress before submitting."
              maxWidth="sm:max-w-sm"
              footer={
                <div className="flex flex-col gap-3 w-full">
                  <Button variant="primary" fullWidth onClick={() => setModalOpen(false)} className="py-4 text-lg">Submit & Review</Button>
                  <Button variant="secondary" fullWidth onClick={() => setModalOpen(false)} className="py-4 text-base">Back to Test</Button>
                </div>
              }
            >
              <div className="text-center">
                <IconBadge icon={CheckCircle2} size="4xl" shape="circle" status="primary" className="mx-auto mb-6" />
                <p className="font-bold text-text-secondary">Are you sure you want to submit your exam?</p>
                <Card variant="elevated" className="mt-6 text-left overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Total Questions</span>
                    <span className="font-black text-text-primary tabular-nums">30</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Answered</span>
                    <span className="font-black text-success tabular-nums">22</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Unanswered</span>
                    <span className="font-black text-danger tabular-nums">8</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Marked for Review</span>
                    <span className="font-black text-purple-500 tabular-nums">3</span>
                  </div>
                </Card>
              </div>
            </AdminModal>
          </div>

          <hr className="border-border-subtle/30" />

          {/* ── REVIEW PAGE ── */}
          <div className="space-y-6">
            <p className="text-[11px] font-black text-secondary uppercase tracking-widest">Review Page Elements</p>

            {/* ReviewLayout — Report Header */}
            <ComponentLabel name="ReviewLayout — Report Header" source="ReviewLayout.tsx" />
            <div className={`bg-card-bg border border-border-subtle shadow-2xl p-8 md:p-10 text-center space-y-6 relative overflow-hidden rounded-[32px] ${GOLD_LIGHT_MATERIAL}`}>
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-secondary to-primary" />
              <IconBadge icon={Trophy} size="6xl" shape="circle" status="primary" className="mx-auto mb-4" />
              <div>
                <h1 className="text-[clamp(22px,3.5vw,42px)] font-black text-text-primary uppercase tracking-tighter m-0">Performance Report</h1>
                <p className="text-[clamp(11px,1.2vw,14px)] font-medium text-text-muted uppercase tracking-widest mt-2">APPSC Group 2 Prelims 2025</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 border-y border-border-subtle">
                <div className="space-y-1"><p className="text-[10px] font-bold text-text-muted uppercase">Accuracy</p><p className="text-2xl font-black text-primary">73%</p></div>
                <div className="space-y-1"><p className="text-[10px] font-bold text-text-muted uppercase">Correct</p><p className="text-2xl font-black text-success">22</p></div>
                <div className="space-y-1"><p className="text-[10px] font-bold text-text-muted uppercase">Wrong</p><p className="text-2xl font-black text-danger">6</p></div>
                <div className="space-y-1"><p className="text-[10px] font-bold text-text-muted uppercase">Time</p><p className="text-2xl font-black text-info">48m</p></div>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm font-bold text-text-secondary">
                <span><Layers size={14} className="inline mr-1 text-text-muted" />Total: 30</span>
                <span><AlertCircle size={14} className="inline mr-1 text-text-muted" />Skipped: 2</span>
                <span><Eye size={14} className="inline mr-1 text-text-muted" />Not Visited: 0</span>
                <span><Trophy size={14} className="inline mr-1 text-text-muted" />Score: 22</span>
              </div>
            </div>

            {/* ReviewLayout — Filter Bar */}
            <ComponentLabel name="ReviewLayout — Filter Bar" source="ReviewLayout.tsx" />
            <Card variant="elevated" padding={16}>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <h3 className="text-sm font-bold text-text-primary uppercase tracking-tight m-0">Detailed Analysis</h3>
                  <BilingualToggle displayLang={examLangReview} onChange={setExamLangReview} />
                </div>
                <Input type="text" leftIcon={Search} placeholder="Search questions or subjects..." className="w-full" />
                <SegmentedFilter
                  options={[
                    { id: 'all', label: 'All', badge: <NumberBadge value={30} variant="rank" className="w-6 h-6 text-[9px]" /> },
                    { id: 'correct', label: 'Correct', badge: <NumberBadge value={22} variant="rank" className="w-6 h-6 text-[9px]" /> },
                    { id: 'wrong', label: 'Wrong', badge: <NumberBadge value={6} variant="rank" className="w-6 h-6 text-[9px]" /> },
                    { id: 'skipped', label: 'Skipped', badge: <NumberBadge value={2} variant="rank" className="w-6 h-6 text-[9px]" /> },
                  ]}
                  value="all"
                  onChange={() => {}}
                  size="md"
                />
              </div>
            </Card>

            {/* ReviewQuestionCard — Correct answer */}
            <ComponentLabel name="ReviewQuestionCard" source="ReviewQuestionCard.tsx" variant="correct" />
            <ReviewQuestionCard
              question={MOCK_QUESTIONS[0]}
              answer={MOCK_ANSWERS.q1}
              index={0}
              displayLang="en"
            />

            {/* ReviewQuestionCard — Wrong answer */}
            <ComponentLabel name="ReviewQuestionCard" source="ReviewQuestionCard.tsx" variant="incorrect" />
            <ReviewQuestionCard
              question={MOCK_QUESTIONS[1]}
              answer={MOCK_ANSWERS.q2}
              index={1}
              displayLang="en"
            />

            {/* ReviewQuestionCard — Not visited */}
            <ComponentLabel name="ReviewQuestionCard" source="ReviewQuestionCard.tsx" variant="not visited" />
            <ReviewQuestionCard
              question={MOCK_QUESTIONS[2]}
              answer={MOCK_ANSWERS.q3}
              index={2}
              displayLang="en"
            />
          </div>
        </ShowcaseSection>

        <hr className="border-border-subtle/30" />

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 23: ERROR & FEEDBACK SYSTEM — PRODUCTION REFERENCE
            Every example renders the REAL reusable production component with
            LOCAL-ONLY state. No backend calls, no auth/cache/route changes.
            ═══════════════════════════════════════════════════════════════════ */}
        <ShowcaseSection id="error-feedback" title="23. Error & Feedback System" subtitle="Production Error & Feedback Reference — real components, live classifier copy, local-state demos only">

          {/* ── 23.1 Error Surface Overview ── */}
          <ComponentLabel name="Surface Matrix" role="situation → component mapping" source="current architecture" />
          <div className="overflow-x-auto">
            <table className="w-full text-[9px] border-collapse">
              <thead>
                <tr className="border-b border-border-subtle/30">
                  <th className="text-left py-2 px-3 text-text-muted uppercase tracking-wider">Situation</th>
                  <th className="text-left py-2 px-3 text-text-muted uppercase tracking-wider">Component</th>
                  <th className="text-left py-2 px-3 text-text-muted uppercase tracking-wider">Persistent?</th>
                  <th className="text-left py-2 px-3 text-text-muted uppercase tracking-wider">Retry?</th>
                  <th className="text-left py-2 px-3 text-text-muted uppercase tracking-wider">Typical Use</th>
                </tr>
              </thead>
              <tbody className="text-text-secondary">
                {[
                  ['Page load failure', 'ErrorContainer (page) + RetryButton', 'Yes', 'Yes', 'Initial data fetch fails; nothing to show'],
                  ['Section load failure', 'ErrorContainer variant="inline" + RetryButton', 'Yes', 'Yes', 'One section fails while page stays usable'],
                  ['Refresh failure w/ existing content', 'Inline Alert (+ retry where wired)', 'Until dismissed', 'Optional', 'Stale refresh keeps old content visible'],
                  ['Modal save failure', 'Alert inside AdminModal children', 'While modal open', 'Re-save', 'Create/update in modal fails; modal stays open'],
                  ['Delete failure', 'ConfirmModal error slot (error prop)', 'Modal stays open', 'Re-confirm', 'Destructive action fails — Alert renders in modal slot'],
                  ['Publish/toggle failure', 'Inline Alert near affected section', 'Until dismissed/displaced', 'Re-toggle', 'Optimistic update rolled back'],
                  ['Reorder failure', 'Inline Alert near management area', 'Until dismissed', 'Reload canonical order', 'Optimistic reorder rolled back'],
                  ['Field validation', 'Label error + helper text', 'While invalid', 'Fix value', 'Per-field schema messages'],
                  ['Authentication failure', 'ErrorContainer category="authentication"', 'Yes', 'Sign in again', 'Session expired'],
                  ['Authorization failure', 'ErrorContainer category="authorization"', 'Yes', 'No', 'RLS / permission denial'],
                  ['Empty data', 'EmptyState', 'Yes', 'n/a', 'Legitimate empty collection — NEVER for failures'],
                  ['Transient success', 'Alert (success) — onDismiss or next navigation', 'Until dismissed', 'n/a', 'Created / updated / deleted confirmation'],
                  ['Non-critical transient error', 'Alert (error) near affected control', 'Until dismissed', 'Re-attempt', 'Clipboard-style minor failures'],
                  ['React render crash', 'ErrorBoundary', 'Full-page fallback', 'Reload actions', 'Render-time exceptions only'],
                ].map(([situation, component, persistent, retry, use]) => (
                  <tr key={situation} className="border-b border-border-subtle/10">
                    <td className="py-2 px-3 font-bold text-text-primary">{situation}</td>
                    <td className="py-2 px-3 font-mono text-[8px] text-primary">{component}</td>
                    <td className="py-2 px-3">{persistent}</td>
                    <td className="py-2 px-3">{retry}</td>
                    <td className="py-2 px-3">{use}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <hr className="border-border-subtle/30" />

          {/* ── 23.2 ErrorContainer ── */}
          <ComponentLabel name="ErrorContainer" variant="page" source="ErrorContainer.tsx" />
          <div className="max-w-lg">
            <ErrorContainer category="network" severity="high" variant="page">
              <H2>Connection Lost</H2>
              <Body>Please check your internet connection and try again.</Body>
              <RetryButton onRetry={() => simulateRetry(setEfRetrying)} loading={efRetrying} />
            </ErrorContainer>
          </div>

          <ComponentLabel name="ErrorContainer" variant="inline" source="ErrorContainer.tsx" />
          <div className="w-full">
            <ErrorContainer category="server" severity="medium" variant="inline">
              <H2>Server Error</H2>
              <Body>Our servers are having trouble. Please try again shortly.</Body>
            </ErrorContainer>
          </div>

          <ComponentLabel name="ErrorContainer" role="all categories — icon + severity via IconBadge" source="errorClassification.ts" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {EF_CATEGORY_DEMO.map(demo => (
              <div key={demo.category} className="space-y-1">
                <p className="text-[9px] font-bold text-primary uppercase tracking-widest">category=&quot;{demo.category}&quot;</p>
                <ErrorContainer category={demo.category} severity="medium" variant="inline">
                  <p className="text-sm font-black text-text-primary uppercase tracking-tight m-0">{demo.title}</p>
                  <p className="text-xs text-text-secondary m-0">{demo.message}</p>
                </ErrorContainer>
              </div>
            ))}
          </div>

          <ComponentLabel name="ErrorContainer" role="severity → IconBadge status (low/primary · medium/warning · high|critical/danger)" source="error.types" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {EF_SEVERITIES.map(sev => (
              <div key={sev} className="space-y-1">
                <p className="text-[9px] font-bold text-primary uppercase tracking-widest">severity=&quot;{sev}&quot;</p>
                <ErrorContainer category="business" severity={sev} variant="inline">
                  <p className="text-sm font-black text-text-primary uppercase tracking-tight m-0">Something Went Wrong</p>
                  <p className="text-xs text-text-secondary m-0">Severity {sev} — same card surface, different IconBadge status color.</p>
                </ErrorContainer>
              </div>
            ))}
          </div>

          <div className="text-[9px] font-bold text-text-muted uppercase tracking-widest space-y-1">
            <p>Composition: SectionReveal → Card(default) → role=&quot;alert&quot; container → IconBadge + children. Retry contract: ErrorContainer does NOT own retry — pair with RetryButton as a child.</p>
            <p>Avoid for: field-level validation (use Label error + helper text), success messages (use Alert), transient feedback (use Alert or inline contextual surfaces).</p>
          </div>

          <hr className="border-border-subtle/30" />

          {/* ── 23.3 Friendly Message Reference (source-derived) ── */}
          <ComponentLabel name="Friendly Message Reference" role="category → title + message users actually see" source="errorClassification.ts buildTitle/buildFriendlyMessage" />
          <div className="overflow-x-auto">
            <table className="w-full text-[9px] border-collapse">
              <thead>
                <tr className="border-b border-border-subtle/30">
                  <th className="text-left py-2 px-3 text-text-muted uppercase tracking-wider">Category</th>
                  <th className="text-left py-2 px-3 text-text-muted uppercase tracking-wider">Title</th>
                  <th className="text-left py-2 px-3 text-text-muted uppercase tracking-wider">Friendly Message (verbatim from source)</th>
                </tr>
              </thead>
              <tbody className="text-text-secondary">
                {EF_CATEGORY_DEMO.map(demo => (
                  <tr key={demo.category} className="border-b border-border-subtle/10">
                    <td className="py-2 px-3 font-bold text-primary">{demo.category}</td>
                    <td className="py-2 px-3 font-bold text-text-primary">{demo.title}</td>
                    <td className="py-2 px-3">&quot;{demo.message}&quot;</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <hr className="border-border-subtle/30" />

          {/* ── 23.4 Alert ── */}
          <ComponentLabel name="Alert" source="Alert.tsx" />
          <div className="space-y-3 max-w-2xl">
            <Alert variant="info" icon={Info} title="Info">General information banner — role=&quot;status&quot;.</Alert>
            <Alert variant="success" icon={CheckCircle} title="Success">Positive confirmation — role=&quot;status&quot;.</Alert>
            <Alert variant="warning" icon={AlertTriangle} title="Warning">Caution notice — role=&quot;status&quot;.</Alert>
            {efAlertVisible && (
              <Alert variant="error" icon={XCircle} title="Error" onDismiss={() => setEfAlertVisible(false)}>
                Inline error — role=&quot;alert&quot;. Dismiss is optional per consumer.
              </Alert>
            )}
            {!efAlertVisible && (
              <button onClick={() => setEfAlertVisible(true)} className="text-xs text-text-muted hover:text-text-secondary underline">Reset alerts</button>
            )}
          </div>
          <div className="text-[9px] font-bold text-text-muted uppercase tracking-widest space-y-1">
            <p>Variants map to status tokens: info→primary, success→success, error→danger, warning→warning. Only variant=&quot;error&quot; renders role=&quot;alert&quot;.</p>
            <p>Avoid for: page-wide retryable load errors when ErrorContainer is appropriate.</p>
          </div>

          <hr className="border-border-subtle/30" />

          {/* ── 23.5 RetryButton ── */}
          <ComponentLabel name="RetryButton" source="RetryButton.tsx" />
          <Row label="States">
            <RetryButton onRetry={() => simulateRetry(setRbRetrying)} loading={rbRetrying} />
            <RetryButton onRetry={() => {}} loading />
            <RetryButton onRetry={() => {}} disabled />
            <RetryButton onRetry={() => {}} label="Reload Data" />
          </Row>
          <div className="space-y-3 max-w-lg">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Interactive demo (local state only)</p>
            <span data-testid="ds-retry-interactive">
              <RetryButton onRetry={() => simulateRetry(setEfRetrying)} loading={efRetrying} />
            </span>
            <p className="text-xs text-text-secondary m-0">Click → loading (disabled + spinner) → returns to normal after 800ms. No backend call.</p>
          </div>
          <div className="text-[9px] font-bold text-text-muted uppercase tracking-widest space-y-1">
            <p>aria-label swaps to &quot;Retrying…&quot; while loading; disabled while loading. Emits aria-busy while loading (falsy renders as omitted — never &quot;false&quot;).</p>
            <p>Avoid for: general-purpose actions — this button means &quot;retry the failed operation&quot;.</p>
          </div>

          <hr className="border-border-subtle/30" />

          {/* ── 23.6 Legacy ErrorState ── */}
          <div className="flex items-center gap-2">
            <Badge variant="warning" size="sm">LEGACY</Badge>
            <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest">Existing ErrorState — SharedComponents.tsx — visual comparison only, do not use in new work</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ErrorState message="Failed to load leaderboard data." />
            <ErrorState
              title="Query Failed"
              message="Legacy contract: no Card surface of its own, emoji/default icon, built-in Try Again and Return Home buttons."
              onRetry={() => simulateRetry(setRbRetrying)}
              onBack={() => {}}
            />
          </div>
          <div className="text-[9px] font-bold text-text-muted uppercase tracking-widest space-y-1">
            <p>No Card surface — inherits whatever container surrounds it. Built-in retry/back buttons bypass RetryButton. Zero production consumers remain — retained only as a documented legacy reference.</p>
            <p>Avoid for: all new implementations — use ErrorContainer + RetryButton.</p>
          </div>

          <hr className="border-border-subtle/30" />

          {/* ── 23.7 ConfirmModal (current capability) ── */}
          <ComponentLabel name="ConfirmModal" variant="current API — open / title / message / danger / busy" source="SharedComponents.tsx" />
          <Row>
            <Button variant="danger" onClick={() => openConfirmDemo(false)}>Open Confirm Modal (succeeds)</Button>
            <Button variant="danger" onClick={() => openConfirmDemo(true)}>Open Confirm Modal (fails)</Button>
          </Row>
          <ConfirmModal
            open={confirmOpen}
            title={`Delete "${'Satavahanas & Sangam Age'}"?`}
            message={(
              <>
                <span className="block">This will permanently remove this topic and all its content. This cannot be undone.</span>
                {confirmError && (
                  <Alert variant="error" icon={XCircle} className="mt-3">
                    Failed to delete the topic. The server did not respond — please try again.
                  </Alert>
                )}
              </>
            )}
            danger
            confirmLabel="Yes, Delete Permanently"
            onConfirm={runConfirmDemo}
            onCancel={() => setConfirmOpen(false)}
            busy={confirmBusy}
          />
          <div className="text-[9px] font-bold text-text-muted uppercase tracking-widest space-y-1">
            <p>Demonstrated: confirmation message → danger confirm → busy locks actions → failure keeps dialog OPEN with composed Alert visible → success closes. Focus trap intact throughout.</p>
            <p className="text-warning">Dedicated error slot is available via the <em>error</em> prop (renders an Alert titled &quot;Action failed&quot; above the actions) and is wired at AdminTopics + BulkUploadPanel. The composed-into-message pattern above remains valid for bespoke per-operation copy (AdminSubAdminsView remove-educator, AdminSettings) — callers choose either, never both.</p>
            <p>Avoid for: non-destructive informational dialogs (use AdminModal).</p>
          </div>

          <hr className="border-border-subtle/30" />

          {/* ── 23.8 AdminModal + Save Failure ── */}
          <ComponentLabel name="AdminModal + Alert" role="modal save failure stays visible" source="AdminModal.tsx + Alert.tsx" />
          <Row>
            <Button variant="primary" onClick={() => setSaveModalOpen(true)}>Open Save-Failure Modal</Button>
          </Row>
          <AdminModal
            isOpen={saveModalOpen}
            onClose={() => setSaveModalOpen(false)}
            title="Edit Topic"
            description="APPSC_GROUP_1 → Maths"
            maxWidth="sm:max-w-md"
            footer={(
              <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setSaveModalOpen(false)}>Cancel</Button>
                <Button variant="primary" onClick={() => {}}>Save Changes</Button>
              </div>
            )}
          >
            <Stack gap="md">
              <Alert variant="error" icon={XCircle} title="Save failed" className="mb-4">
                Our servers are having trouble. Please try again shortly.
              </Alert>
              <Input placeholder="Topic title remains editable…" />
              <TextArea placeholder="Content remains visible and editable…" />
              <p className="text-xs text-text-secondary m-0">
                Demonstrated: save fails → modal REMAINS OPEN → error Alert persists above the form → user can correct and re-save. No backend call in this demo.
              </p>
            </Stack>
          </AdminModal>
          <div className="text-[9px] font-bold text-text-muted uppercase tracking-widest">
            <p>Avoid for: quick destructive confirmations (use ConfirmModal) and routine inline success (use Alert).</p>
          </div>

          <hr className="border-border-subtle/30" />

          {/* ── 23.9 Form Validation (current field-error pattern) ── */}
          <ComponentLabel name="Field Validation" role="Label error + adjacent helper text — current production pattern" source="TopicMetadataFields.tsx pattern" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 max-w-2xl">
            {[
              { id: 'ds-required', label: 'Topic Title (EN)', invalid: true, msg: 'English title is required.' },
              { id: 'ds-format', label: 'YouTube Link', invalid: true, msg: 'Enter a valid YouTube URL.' },
              { id: 'ds-duplicate', label: 'Subject Name', invalid: true, msg: 'A topic with this title already exists.' },
              { id: 'ds-range', label: 'Display Order', invalid: true, msg: 'Display order must be at least 1.' },
            ].map(f => (
              <div key={f.id} className="space-y-1">
                <Label htmlFor={f.id} error>{f.label}</Label>
                <Input id={f.id} aria-invalid={f.invalid} aria-describedby={`${f.id}-error`} placeholder="Invalid value entered…" />
                <span id={`${f.id}-error`} aria-live="polite" className="block text-xs font-bold text-danger mt-1">{f.msg}</span>
              </div>
            ))}
          </div>
          <div className="text-[9px] font-bold text-text-muted uppercase tracking-widest space-y-1">
            <p>Markup replicated verbatim from production: aria-invalid + aria-describedby + label-error. The FieldError primitive (SharedComponents.tsx) is the canonical inline surface for new work; verbatim spans remain in existing file-specific markup.</p>
            <p>Avoid for: operation/save failures (use Alert or ErrorContainer) — this surface is for per-field validation only.</p>
          </div>

          <hr className="border-border-subtle/30" />

          {/* ── 23.10 Alert feedback (toast-replacement contract) ── */}
          <ComponentLabel name="Alert" role="inline contextual feedback — canonical success/error surface" source="Alert.tsx" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
            <Card variant="default" padding={16}>
              <p className="text-[10px] font-bold text-success uppercase tracking-widest mb-2">Alert — good for</p>
              <ul className="text-xs text-text-secondary space-y-1 list-disc pl-4 m-0">
                <li>Mutation success (created / updated / deleted)</li>
                <li>Inline contextual error near the affected control</li>
                <li>Notices that must survive navigation (auto-dismiss loses them)</li>
              </ul>
            </Card>
            <Card variant="default" padding={16}>
              <p className="text-[10px] font-bold text-danger uppercase tracking-widest mb-2">Alert — NOT preferred for</p>
              <ul className="text-xs text-text-secondary space-y-1 list-disc pl-4 m-0">
                <li>Page / section load failure (use ErrorContainer + RetryButton)</li>
                <li>Legitimate empty data (use EmptyState)</li>
                <li>Field-level validation (use Label error + helper text)</li>
              </ul>
            </Card>
          </div>
          <div className="text-[9px] font-bold text-text-muted uppercase tracking-widest space-y-1">
            <p>Feedback contract: success/warning render role=&quot;status&quot; aria-live=&quot;polite&quot;; error renders role=&quot;alert&quot; aria-live=&quot;assertive&quot;. Alerts do not auto-dismiss — clear via optional onDismiss or the next navigation.</p>
            <p>Toast infrastructure (useToast / ToastContainer) was removed in the toast-elimination pass; every feedback path now routes through Alert / ErrorContainer / EmptyState.</p>
          </div>

          <hr className="border-border-subtle/30" />

          {/* ── 23.11 SuccessModal vs Alert ── */}
          <ComponentLabel name="SuccessModal" role="non-transient milestone success" source="SuccessModal.tsx" />
          <Row>
            <Button variant="success" onClick={() => setSuccessModalOpen(true)}>Open Success Modal</Button>
          </Row>
          <SuccessModal
            isOpen={successModalOpen}
            title="Exam Submitted"
            message="Your exam has been submitted successfully. Your full performance report is ready."
            onClose={() => setSuccessModalOpen(false)}
          />
          <div className="text-[9px] font-bold text-text-muted uppercase tracking-widest space-y-1">
            <p>&quot;Non-transient success&quot; — blocks until acknowledged (OK). Contrast with Alert feedback above, which is persistent but non-blocking.</p>
            <p>Avoid for: routine CRUD success — those stay as persistent Alert feedback.</p>
          </div>

          <hr className="border-border-subtle/30" />

          {/* ── 23.12 ErrorBoundary (documentation only — never crash this page) ── */}
          <ComponentLabel name="ErrorBoundary" role="React render-crash fallback" source="ErrorBoundary.tsx" />
          <Card variant="default" padding={20} className="max-w-xl">
            <div className="flex flex-col items-center text-center gap-3">
              <IconBadge icon={ShieldAlert} size="4xl" shape="circle" status="danger" />
              <p className="text-sm font-black text-text-primary uppercase tracking-tight m-0">An Error Occurred</p>
              <p className="text-xs text-text-secondary m-0 max-w-sm">
                ErrorBoundary handles React render crashes with a full-page fallback (&quot;We encountered an unexpected issue.&quot;) plus reload/home actions. It is intentionally separate from ErrorContainer — it never handles API/data errors, and it is NOT triggered here to keep this page safe.
              </p>
            </div>
          </Card>
          <div className="text-[9px] font-bold text-text-muted uppercase tracking-widest">
            <p>Avoid for: API errors, validation, or anything recoverable within normal layout — those belong to the surfaces above.</p>
          </div>

          <hr className="border-border-subtle/30" />

          {/* ── 23.13 Classification Reference — raw input → normalizeError → UI ── */}
          <ComponentLabel name="Error Classification Reference" role="raw technical failure → normalizeError() → PageError → UI" source="normalizeError / classifyError" />
          <code className="block text-[9px] text-text-secondary bg-hover-bg/30 p-3 rounded-xl border border-border-subtle/30">
            raw technical failure → normalizeError() → PageError {'{ category, severity, title, message, retryable }'} → UI surface
          </code>
          <div className="overflow-x-auto">
            <table className="w-full text-[9px] border-collapse">
              <thead>
                <tr className="border-b border-border-subtle/30">
                  <th className="text-left py-2 px-3 text-text-muted uppercase tracking-wider">Raw Input (simulated — documentation only, NEVER shown to users)</th>
                  <th className="text-left py-2 px-3 text-text-muted uppercase tracking-wider">Category</th>
                  <th className="text-left py-2 px-3 text-text-muted uppercase tracking-wider">User Title</th>
                  <th className="text-left py-2 px-3 text-text-muted uppercase tracking-wider">User Message</th>
                  <th className="text-left py-2 px-3 text-text-muted uppercase tracking-wider">Typical Surface</th>
                </tr>
              </thead>
              <tbody className="text-text-secondary">
                {EF_CLASSIFIER_DEMOS.map(demo => {
                  const surface = demo.category === 'authentication' || demo.category === 'authorization'
                    ? 'ErrorContainer (page)'
                    : 'ErrorContainer + RetryButton'
                  return (
                    <tr key={demo.raw} className="border-b border-border-subtle/10">
                      <td className="py-2 px-3 font-mono text-[8px] text-text-hint line-through decoration-danger/50">{demo.raw}</td>
                      <td className="py-2 px-3 font-bold text-primary">{demo.category}</td>
                      <td className="py-2 px-3 font-bold text-text-primary">{demo.title}</td>
                      <td className="py-2 px-3">&quot;{demo.message}&quot;</td>
                      <td className="py-2 px-3">{surface}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="text-[9px] font-bold text-text-muted uppercase tracking-widest">
            <p>The struck-through raw column demonstrates that SQL/policy internals are detected and replaced — users only ever see the friendly title + message columns.</p>
          </div>

          <hr className="border-border-subtle/30" />

          {/* ── 23.14 Decision Guide ── */}
          <ComponentLabel name="Error Surface Decision Guide" role="which component for which situation" />
          <div className="overflow-x-auto">
            <table className="w-full text-[9px] border-collapse">
              <thead>
                <tr className="border-b border-border-subtle/30">
                  <th className="text-left py-2 px-3 text-text-muted uppercase tracking-wider">When…</th>
                  <th className="text-left py-2 px-3 text-text-muted uppercase tracking-wider">Use</th>
                </tr>
              </thead>
              <tbody className="text-text-secondary">
                {[
                  ['PAGE LOAD FAILURE', 'ErrorContainer + RetryButton'],
                  ['SECTION LOAD FAILURE', 'ErrorContainer variant="inline" + RetryButton'],
                  ['MODAL SAVE FAILURE', 'Alert inside AdminModal'],
                  ['DESTRUCTIVE CONFIRMATION', 'ConfirmModal'],
                  ['FIELD VALIDATION', 'Label error + helper text'],
                  ['TRANSIENT SUCCESS', 'Alert (success) — persistent until dismissed'],
                  ['NON-CRITICAL TRANSIENT FAILURE', 'Alert (error) — inline near affected control'],
                  ['REACT CRASH', 'ErrorBoundary'],
                  ['EMPTY DATA', 'EmptyState'],
                ].map(([when, use]) => (
                  <tr key={when} className="border-b border-border-subtle/10">
                    <td className="py-2 px-3 font-bold text-text-primary">{when}</td>
                    <td className="py-2 px-3 font-mono text-[8px] text-primary">{use}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <hr className="border-border-subtle/30" />

          {/* ── 23.15 Confirmed Current Gaps ── */}
          <ComponentLabel name="Confirmed Resolved Gaps" role="verified against source — closed in Phase 2" />
          <ol className="text-xs text-text-secondary space-y-2 list-decimal pl-5 max-w-2xl m-0">
            <li><strong className="text-text-primary">ConfirmModal now has a dedicated error slot</strong> (<em>error</em> prop → Alert), wired at AdminTopics + BulkUploadPanel (see 23.7).</li>
            <li><strong className="text-text-primary">Row-level mutation errors now have a primitive</strong> — RowLevelError (SharedComponents.tsx), used for inline JSON/row failures (CreateStepJsonPaste, subject-row errors).</li>
            <li><strong className="text-text-primary">ErrorState is legacy at zero production consumers</strong> — all 5 former sites migrated to ErrorContainer/RowLevelError (see 23.6).</li>
            <li><strong className="text-text-primary">FieldError primitive now exists</strong> (SharedComponents.tsx) as the canonical inline label-error surface (see 23.9).</li>
            <li><strong className="text-text-primary">RetryButton now emits aria-busy while loading</strong> (see 23.5).</li>
          </ol>

        </ShowcaseSection>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 24: ERROR CONTAINERS — PRODUCTION PATTERN CATALOG
            Every pattern reflects REAL production markup (verbatim or faithful
            replica). No new error UI is invented and none is refactored; the
            goal is a single catalog to find the right container per situation.
            Each entry = live replica + usage sites + a11y + responsive notes.
            ═══════════════════════════════════════════════════════════════════ */}
        <ShowcaseSection id="error-containers" title="24. Error Containers" subtitle="Pattern catalog — every production error-container surface in one place. Replicas render the real components; animation intent is shown statically.">

          {/* ── 24.01 Page-Level Error (ErrorContainer variant="page") ── */}
          <ComponentLabel name="24.01 · Page-Level Error" variant="page" source="ErrorContainer.tsx" />
          <div className="max-w-xl">
            <ErrorContainer category="network" severity="high" variant="page" padding={24}>
              <H2>Failed to load dashboard</H2>
              <Body>We couldn't reach the server. Check your connection and try again.</Body>
              <RetryButton onRetry={() => {}} />
            </ErrorContainer>
          </div>
          <div className="text-[9px] font-bold text-text-muted uppercase tracking-widest space-y-1">
            <p>Replica: DashboardStatsGrid (error with no last-known-good), AdminQuestions, AdminTopics, AdminSettings pageError, and every usePageError-driven page (UserExams, UserHistory, UserLeaderboard, SubAdminDashboard). Composition: SectionReveal → Card(default) → role=&quot;alert&quot; centered stack → IconBadge 4xl.</p>
            <p>Responsive: max-w-lg mx-auto self-centers at any width; the icon + text stack collapses cleanly on mobile.</p>
            <p>Avoid for: failures where useful content can stay visible — prefer 24.02 or 24.03.</p>
          </div>

          <hr className="border-border-subtle/30" />

          {/* ── 24.02 Section-Level (inline) Error ── */}
          <ComponentLabel name="24.02 · Section-Level (Inline) Error" variant="inline" source="ErrorContainer.tsx" />
          <div className="max-w-xl">
            <ErrorContainer category="server" severity="medium" variant="inline" padding={16}>
              <H2>Failed to load papers</H2>
              <Body>Postgres connection refused. The tab strip above stays usable.</Body>
              <RetryButton onRetry={() => {}} />
            </ErrorContainer>
          </div>
          <div className="text-[9px] font-bold text-text-muted uppercase tracking-widest space-y-1">
            <p>Replica: AdminSelectionTabs (exam-list and papers rows — failed load gates ONLY the failed row), AdminSettings sticky save-bar (inline, padding 16), SubAdminStudents / SubAdminSettings per-region errors.</p>
            <p>Key nuance: ErrorContainer defaults to variant=&quot;page&quot;; section-level consumers pass variant=&quot;inline&quot; + className=&quot;w-full&quot; so the block fills its parent instead of self-centering.</p>
            <p>Avoid for: isolated single-line messages — 24.05 Alert is lighter for that job.</p>
          </div>

          <hr className="border-border-subtle/30" />

          {/* ── 24.03 Non-Destructive Refresh (last-known-good retained) ── */}
          <ComponentLabel name="24.03 · Non-Destructive Refresh" role="refreshFailed → polite status notice over retained data" source="DashboardStatsGrid.tsx DASH-LOW-1" />
          <div className="max-w-3xl space-y-3">
            <div role="status" aria-live="polite" className="text-sm font-bold text-text-secondary">
              Couldn&apos;t refresh your stats. Showing your last saved numbers.
            </div>
            <div className="space-y-3">
              <Grid cols={2} lg={4}>
                <StatCard icon={Flame} label="STREAK" value={12} unit="Days" status="warning" />
                <StatCard icon={GraduationCap} label="WISDOM" value={38} unit="Exams" status="accent" />
                <StatCard icon={Target} label="PRECISION" value={72} unit="%" status="info" />
                <StatCard icon={Trophy} label="STANDING" value={4} status="secondary" />
              </Grid>
            </div>
          </div>
          <div className="text-[9px] font-bold text-text-muted uppercase tracking-widest space-y-1">
            <p>Contract: when refreshFailed AND last-known-good stats exist, the destructive ErrorContainer (24.01) is REPLACED by this role=&quot;status&quot; aria-live=&quot;polite&quot; notice over the retained content. The full ErrorContainer only renders when there is NO data to keep.</p>
            <p>This is the canonical &quot;keep content&quot; companion to 24.05 (Alert + retry) — 24.03 is the async-refresh case, 24.05 is the re-fetch case with an explicit retry action.</p>
            <p>Avoid for: first load with no data — that is 24.01, not a notice.</p>
          </div>

          <hr className="border-border-subtle/30" />

          {/* ── 24.04 API / Request Category Icons ── */}
          <ComponentLabel name="24.04 · API Category Icons" role="category → lucide icon + IconBadge status (live from classifier)" source="ErrorContainer.tsx CATEGORY_ICONS + errorClassification.ts" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-4xl">
            {EF_CATEGORY_DEMO.map((d) => (
              <ErrorContainer key={d.category} category={d.category} severity="medium" variant="inline" padding={16}>
                <H2 className="text-[11px]">{d.title}</H2>
                <Body className="text-[11px]">{d.message}</Body>
              </ErrorContainer>
            ))}
          </div>
          <div className="text-[9px] font-bold text-text-muted uppercase tracking-widest space-y-1">
            <p>Icons map 1:1 to the classifier: network/offline→WifiOff, timeout→Clock, authentication/authorization→ShieldAlert, server→ServerCrash, validation→AlertCircle, rateLimit→Ban, maintenance→Wrench, business→AlertTriangle, unknown→AlertCircle.</p>
            <p>Severity → IconBadge status: low→primary, medium→warning, high &amp; critical→danger. The badge is the single color signal — the container surface itself never changes color.</p>
            <p>Copy above is derived live from buildTitle / buildFriendlyMessage — it cannot drift from what users see.</p>
          </div>

          <hr className="border-border-subtle/30" />

          {/* ── 24.05 Inline Contextual Error (Alert + retry) ── */}
          <ComponentLabel name="24.05 · Inline Contextual Error" role="refetch failure with content retained — Alert host" source="AdminQuestions.tsx + Alert.tsx composition" />
          <div className="max-w-xl">
            <Alert variant="error" icon={XCircle} title="Something went wrong" className="w-full">
              <span>Couldn&apos;t refresh the question list — your existing rows are still shown.</span>
              <div className="mt-2">
                <RetryButton onRetry={() => {}} label="RETRY" />
              </div>
            </Alert>
          </div>
          <div className="text-[9px] font-bold text-text-muted uppercase tracking-widest space-y-1">
            <p>Verbatim shape from AdminQuestions (refresh keeps rows rendered, Alert + nested RetryButton &quot;RETRY&quot;) — the same composition drives AdminUsers, ExamDetailSection copy errors, and AdminSubAdminsView domain errors (&quot;Action failed&quot; with title from DomainErrorInfo).</p>
            <p>A11y: variant=&quot;error&quot; is the ONLY Alert variant rendering role=&quot;alert&quot; (assertive); success/warning render role=&quot;status&quot; (polite).</p>
            <p>Avoid for: full-screen or section-blocking failures — that is ErrorContainer territory (24.01/24.02).</p>
          </div>

          <hr className="border-border-subtle/30" />

          {/* ── 24.06 Form Field Validation ── */}
          <ComponentLabel name="24.06 · Form Field Validation" role="per-field error — aria-invalid + describedby + live region" source="TopicMetadataFields.tsx / ExamModePanel.tsx pattern" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 max-w-2xl">
            <div className="space-y-1">
              <Label htmlFor="ec-question" error>Question Text (EN)</Label>
              <Input id="ec-question" aria-invalid aria-describedby="ec-question-error" placeholder="Required…" />
              <span id="ec-question-error" aria-live="polite" className="block text-xs font-bold text-danger mt-1">Question text is required.</span>
            </div>
            <div className="space-y-1">
              <Label htmlFor="ec-options" error>Options</Label>
              <Input id="ec-options" aria-invalid aria-describedby="ec-options-error" placeholder="Separate options…" />
              <span id="ec-options-error" aria-live="polite" className="block text-xs font-bold text-danger mt-1">At least two options are required.</span>
            </div>
          </div>
          <div className="text-[9px] font-bold text-text-muted uppercase tracking-widest space-y-1">
            <p>Markup is replicated verbatim from production: Label error + Input aria-invalid + aria-describedby. The FieldError primitive (SharedComponents.tsx) is the canonical inline surface for new work (23.9); verbatim spans remain in existing file-specific markup.</p>
            <p>Avoid for: operation/save failures — that is Alert (24.05/24.07), not field-error spans.</p>
          </div>

          <hr className="border-border-subtle/30" />

          {/* ── 24.07 Modal Operation Error ── */}
          <ComponentLabel name="24.07 · Modal Operation Error" role="modal stays open — error Alert persists above the form" source="AdminModal.tsx + Alert.tsx (AdminSubAdminsView pattern)" />
          <Row>
            <Button onClick={() => setEcModalOpen(true)}>Open Modal Operation-Failure Demo</Button>
          </Row>
          <AdminModal
            isOpen={ecModalOpen}
            onClose={() => setEcModalOpen(false)}
            title="Rename Subject"
            description="APPSC_GROUP_1 → Capacity Building"
            maxWidth="sm:max-w-md"
            footer={(
              <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setEcModalOpen(false)}>Cancel</Button>
                <Button variant="primary" onClick={() => {}}>Retry Save</Button>
              </div>
            )}
          >
            <Stack gap="md">
              <Alert variant="error" icon={XCircle} title="Rename failed" className="mb-4">
                The subject name didn&apos;t update. Please try again or contact support.
              </Alert>
              <Input defaultValue="Capacity Building" aria-label="Subject name" />
              <p className="text-xs text-text-secondary m-0">
                Demonstrated: save fails → modal REMAINS OPEN → error Alert persists above the editable field → user can correct and re-submit. No backend call in this demo.
              </p>
            </Stack>
          </AdminModal>
          <div className="text-[9px] font-bold text-text-muted uppercase tracking-widest space-y-1">
            <p>Canonical modal-error pattern: AdminModal + Alert as child (AdminSubAdminsView &quot;Could not save&quot;), plus the ConfirmModal-with-composed-Alert variant (23.7). Failure never closes the dialog.</p>
            <p>Avoid for: destructive confirmations (use ConfirmModal) and non-modal inline failures (use 24.05).</p>
          </div>

          <hr className="border-border-subtle/30" />

          {/* ── 24.08 Upload Error Overlay ── */}
          <ComponentLabel name="24.08 · Upload Error Overlay" role="full-panel status overlay — IconBadge 6xl danger + per-row error detail" source="UploadProgressOverlay.tsx" />
          <div className="max-w-md mx-auto">
            <div className="rounded-[2.5rem] bg-card-bg/95 backdrop-blur-md p-8 text-center border border-border-subtle/20 shadow-elevation-2">
              <IconBadge icon={AlertTriangle} size="6xl" shape="circle" status="danger" className="mb-6" />
              <h3 className="text-lg font-bold uppercase tracking-widest mb-2 text-text-primary">Upload Failed</h3>
              <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">APPSC_GROUP_1 • Prelims 2025</p>
              <p className="text-sm text-text-secondary mt-4 max-w-md">An error occurred during upload. You can try again.</p>
              <div className="mt-4 max-w-md text-left">
                <Alert variant="error" title="Error Details">
                  Row 12: missing required field &quot;answer&quot;.
                </Alert>
              </div>
              <Button onClick={() => {}} aria-label="Retry upload" className="mt-6">Try Again</Button>
            </div>
          </div>
          <div className="text-[9px] font-bold text-text-muted uppercase tracking-widest space-y-1">
            <p>Verbatim: an absolute inset-0 z-50 overlay over the upload panel. role=&quot;status&quot; covers progress AND failure — success swaps to a CheckCircle2 6xl badge, failure to AlertTriangle 6xl danger.</p>
            <p>Last row error surfaces through an embedded Alert (&quot;Error Details&quot;); the retry Button carries aria-label=&quot;Retry upload&quot; so the visible &quot;Try Again&quot; stays effectively scoped for AT users.</p>
            <p>Avoid for: per-row validation while the upload is still acceptable — that is 24.09.</p>
          </div>

          <hr className="border-border-subtle/30" />

          {/* ── 24.09 Upload Validation Error List ── */}
          <ComponentLabel name="24.09 · Upload Validation Error List" role="bounded scroll alert — grouped errors + per-row actions" source="JsonTab.tsx" />
          <div className="max-w-2xl">
            <Alert variant="error" icon={AlertTriangle} title="Validation Errors" className="animate-in">
              <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-2">
                {[
                  { row: 3, message: 'Missing "correct" option on row 3.' },
                  { row: 7, message: 'Options array must have at least 2 entries.' },
                  { row: 12, message: 'Question text exceeds 500 characters.' },
                  { row: 14, message: 'Duplicate question detected — keys must be unique.' },
                ].map((err) => (
                  <div key={err.row} className="flex items-center justify-between gap-4 p-2 bg-danger/5 rounded-xl border border-danger/10">
                    <p className="text-[11px] text-danger/80 font-bold flex items-start gap-2 m-0">
                      <span className="opacity-40">→</span> {err.message}
                    </p>
                    <Button variant="danger" size="xs" onClick={() => {}} className="shrink-0">
                      Skip Row
                    </Button>
                  </div>
                ))}
              </div>
            </Alert>
          </div>
          <div className="text-[9px] font-bold text-text-muted uppercase tracking-widest space-y-1">
            <p>Verbatim: Alert error hosts a max-h-48 scroll region of bg-danger/5 row chips; actionable rows get a Danger xs &quot;Skip Row&quot; button (skip clears the row from the batch).</p>
            <p>A11y: the alert announces once (role=&quot;alert&quot;); inner rows are plain text + explicit action button — no nested live regions to avoid chatter during typing.</p>
            <p>Avoid for: a single message — 24.08 / 24.05 are lighter; this list only earns its weight at 2+ errors.</p>
          </div>

          <hr className="border-border-subtle/30" />

          {/* ── 24.10 Render-Crash Error Boundary ── */}
          <ComponentLabel name="24.10 · Render-Crash Error Boundary" role="React render-crash fallback — never used for API/data errors" source="ErrorBoundary.tsx (App.tsx wrap sites)" />
          <div className="max-w-md mx-auto text-center p-8 rounded-3xl bg-card-bg border border-border-subtle">
            <IconBadge icon={AlertTriangle} size="4xl" shape="circle" status="danger" className="mx-auto mb-4" />
            <H2>We encountered an unexpected issue.</H2>
            <Body>Something went wrong while rendering this screen. The rest of the app is unaffected.</Body>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 mt-4">
              <Button variant="secondary" fullWidth onClick={() => {}}>Back</Button>
              <Button variant="primary" fullWidth onClick={() => {}}>Reload Page</Button>
            </div>
          </div>
          <div className="text-[9px] font-bold text-text-muted uppercase tracking-widest space-y-1">
            <p>Mount sites: App.tsx (root, user root, admin root). Renders a full-page fallback with ErrorActionButtons (&quot;Back&quot; / &quot;Reload Page&quot; — reload wires window.location.reload() in production; buttons here are inert replicas).</p>
            <p>Intentionally SEPARATE from ErrorContainer: the boundary only handles render-time exceptions, never fetch/API failures (those stay in 24.01).</p>
            <p>Never demoable live (it must not crash this page) — shown as a faithful replica.</p>
          </div>

          <hr className="border-border-subtle/30" />

          {/* ── 24.11 Access Denied (route-level) ── */}
          <ComponentLabel name="24.11 · Access Denied" role="route guard — no retry, re-auth via navigation" source="Unauthorized.tsx" />
          <div className="max-w-md w-full mx-auto bg-card-bg border border-border-subtle rounded-[40px] p-8 sm:p-12 shadow-2xl text-center">
            <IconBadge icon={ShieldAlert} size="5xl" status="danger" className="mx-auto mb-8 rounded-3xl" />
            <h1 className="text-3xl font-black text-text-primary mb-4 uppercase tracking-tight">Unauthorized Access</h1>
            <p className="text-text-secondary text-sm m-0 mb-6">It seems you don&apos;t have the required administrative permissions for this page.</p>
            <Button fullWidth>Return to Dashboard</Button>
          </div>
          <div className="text-[9px] font-bold text-text-muted uppercase tracking-widest space-y-1">
            <p>Verbatim page pattern for admin-route guards: IconBadge ShieldAlert 5xl danger inside a rounded-[40px] centered card; bespoke copy (the classifier title for this category is the shorter &quot;Access Denied&quot;).</p>
            <p>A11y: full-page blocks carry their own heading + description; there is no retry because the fix is re-authentication, so the primary action navigates to the dashboard.</p>
            <p>Avoid for: retryable failures — retry states belong in 24.01.</p>
          </div>

          <hr className="border-border-subtle/30" />

          {/* ── 24.12 Legacy ErrorState ── */}
          <ComponentLabel name="24.12 · Legacy ErrorState" role="no Card shell — built-in Try Again / Return Home" source="SharedComponents.tsx" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
            <ErrorState message="Failed to load topic list." />
            <ErrorState
              title="Query Failed"
              message="Legacy contract surface: no own Card, default icon, built-in Try Again and Return Home buttons."
              onRetry={() => {}}
              onBack={() => {}}
            />
          </div>
          <div className="text-[9px] font-bold text-text-muted uppercase tracking-widest space-y-1">
            <p>Same legacy surface as 23.6 but shown here as a CONTAINER PATTERN: role=&quot;alert&quot; centered column, inherits whatever parent surrounds it, built-in action buttons bypass RetryButton.</p>
            <p>Zero production consumers remain — retained as a documented legacy reference only, do not regress.</p>
            <p>Avoid for: all new implementations — use ErrorContainer + RetryButton (24.01/24.02).</p>
          </div>

          <hr className="border-border-subtle/30" />

          {/* ── 24.13 Exam Integrity Warnings ── */}
          <ComponentLabel name="24.13 · Exam Integrity Warnings" role="warning surfaces during live exams — role=alert, non-destructive" source="ExamLayout.tsx + StatusBoard.tsx" />
          <div className="space-y-3 max-w-2xl">
            <div role="alert" className="p-4 bg-warning/5 border border-warning/10 rounded-xl flex items-start gap-3">
              <AlertCircle size={18} className="text-warning flex-shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <p className="m-0 text-[10px] font-bold text-warning uppercase tracking-widest">Security Status</p>
                <p className="m-0 text-[10px] font-bold text-warning/70 leading-relaxed">Fullscreen exits recorded: 2. Please maintain fullscreen for exam integrity.</p>
              </div>
            </div>
            <div className="rounded-xl overflow-hidden">
              <div role="alert" className="w-full bg-warning flex items-center justify-between px-4 py-2 gap-3">
                <span className="flex items-center gap-2 text-white text-[11px] font-bold uppercase tracking-widest">Fullscreen is required for this exam</span>
                <button type="button" className="flex items-center gap-1.5 bg-option-surface text-warning text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg hover:bg-warning/10 active:brightness-95 transition-interaction duration-fast ease-standard">
                  Enter Fullscreen
                </button>
              </div>
            </div>
          </div>
          <div className="text-[9px] font-bold text-text-muted uppercase tracking-widest space-y-1">
            <p>Verbatim from StatusBoard (tile violation block, bg-warning/5) and ExamLayout (fullscreen bar, solid bg-warning with white text). Both are role=&quot;alert&quot; integrity warnings — they interrupt focus for compliance, not failure.</p>
            <p>Bar contrast is intentionally strong (white on amber) because it must be read mid-exam; the canvas stays mounted behind it.</p>
            <p>Avoid for: API/data failures — these are exam-environment warnings only.</p>
          </div>

          <hr className="border-border-subtle/30" />

          {/* ── 24.14 Account / Auth-Conflict Surfaces ── */}
          <ComponentLabel name="24.14 · Account / Auth-Conflict Surfaces" role="account-state banners on auth surfaces" source="ProfileForm.tsx + AccountDisabledPage.tsx" />
          <div className="space-y-4 max-w-2xl">
            <div role="alert" className="p-6 rounded-[24px] bg-danger/5 border border-danger/20 flex gap-4 items-center shadow-inner">
              <AlertCircle size={24} className="text-danger shrink-0" />
              <div className="flex-1">
                <Body className="text-danger font-semibold text-[12px] uppercase tracking-widest">Authentication Conflict</Body>
                <Body className="text-[13px] text-danger/80 m-0 mt-1">If you can&apos;t recall your password, use the recovery engine.</Body>
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={() => {}}>Reset Via Email</Button>
            </div>
            <div className="max-w-md w-full mx-auto">
              <Card variant="auth-light" className="text-center space-y-6">
                <div className="w-20 h-20 bg-hover-bg rounded-full flex items-center justify-center mx-auto">
                  <div className="w-12 h-12 bg-danger/10 text-danger rounded-2xl flex items-center justify-center">
                    <XCircle size={24} strokeWidth={2.5} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Body secondary className="text-sm font-semibold leading-relaxed px-4">
                    Your account has been deactivated by the platform administrators. This can happen for various reasons including policy violations or subscription issues.
                  </Body>
                </div>
                <Stack gap="md" className="pt-4">
                  <Button fullWidth>CONTACT SUPPORT</Button>
                  <Button variant="danger" fullWidth>SIGN OUT</Button>
                </Stack>
              </Card>
            </div>
          </div>
          <div className="text-[9px] font-bold text-text-muted uppercase tracking-widest space-y-1">
            <p>Top: ProfileForm auth-conflict banner — bg-danger/5 rounded-[24px] with a secondary recovery action (verbatim). Bottom: AccountDisabledPage — the gold &quot;auth-light&quot; card variant stacking a danger XCircle inside a circle tile, with contact + sign-out actions.</p>
            <p>auth-light uses GOLD_LIGHT_MATERIAL + shadow-card-auth-light; the danger keystone sits on the branded surface rather than its own card.</p>
            <p>Avoid for: generic fetch failures — these surfaces are for account/credential states.</p>
          </div>

          <hr className="border-border-subtle/30" />

          {/* ── 24.15 Bespoke Inline Red Cards (dedup candidates) ── */}
          <ComponentLabel name="24.15 · Bespoke Inline Red Cards" role="hand-rolled role=alert blocks — byte-close to Alert error, dedup candidates" source="ExamDetailSection.tsx + CreateStepJsonPaste.tsx" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
            <div className="bg-red-500/8 border border-red-500/20 rounded-2xl p-6 flex flex-col items-center gap-4 text-center" role="alert">
              <AlertCircle size={28} className="text-red-500" />
              <div>
                <p className="font-black text-red-500 text-sm m-0">Failed to load evaluation data.</p>
              </div>
              <Button variant="primary" size="sm" onClick={() => {}} aria-label="Retry loading exam data">
                <RefreshCcw size={13} /> Retry
              </Button>
            </div>
            <div className="bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3 flex items-start gap-3" role="alert">
              <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
              <span className="text-xs font-bold text-red-500 leading-tight">Invalid JSON at position 42. Check the array brackets.</span>
            </div>
          </div>
          <div className="text-[9px] font-bold text-text-muted uppercase tracking-widest space-y-1">
            <p>Verbatim from ExamDetailSection (dataError, centered + own Retry button) and CreateStepJsonPaste (id=&quot;json-paste-error&quot; + aria-invalid/describedby wiring). Both are hand-rolled role=&quot;alert&quot; blocks using raw red-500 tokens.</p>
            <p>Dedup candidates: ExamDetailSection is structurally equivalent to Alert variant=&quot;error&quot; + RetryButton; CreateStepJsonPaste is a single-message variant. DOCUMENTED ONLY — no refactor in this task.</p>
            <p>Avoid for: new work — use the canonical surfaces in 24.05 / 24.06.</p>
          </div>

        </ShowcaseSection>

        {/* ─── FOOTER ─── */}
        <footer className="text-center py-8 text-[10px] text-text-muted uppercase tracking-widest">
          Design System Showcase — Internal Reference Page
        </footer>
      </Stack>
    </PageContainer>
  )
}
