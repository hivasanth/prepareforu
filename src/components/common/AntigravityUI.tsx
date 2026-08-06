// ─── Barrel: re-exports all AntigravityUI components from domain files ──────
export { useTheme } from '../../context/ThemeContext'

// Typography
export { H1, H2, H3, Body, Label, Display, Caption, BrandTitle } from './AntigravityTypography'

// Module Typography (Layer 2 — certified Phase 3.5 U-3: Admin-specific serif + sans text primitive)
export { AdminText } from './AdminText'

// Theme (DS-006)
export { AuthThemeProvider } from '../../context/ThemeContext'

// Layout
export { PageContainer, Stack, Grid, FilterBar, CollectionToolbar, FilterSelect, SelectionContainer, SectionHeader } from './AntigravityLayout'

// Premium Select (canonical dropdown)
export { PremiumSelect } from './PremiumSelect'

// Card
export { Card, StatCard } from './AntigravityCard'

// Form
export { Input, TextArea, Select, Switch, Checkbox, Radio, RadioGroup } from './AntigravityForm'

// Button
export { Button, PrimaryButton, IconButton } from './AntigravityButton'

// Data display
export { Tabs, AdminPageTitle, Badge, ProgressBar, MetricBlock, DataGrid } from './AntigravityData'
export type { DataGridColumn, DataGridSortDirection, TabOption, TabsSize } from './AntigravityData'

// Segmented filter
export { SegmentedFilter } from './SegmentedFilter'
export type { SegmentedFilterOption } from './SegmentedFilter'

// Theme toggle
export { ThemeToggle } from './ThemeToggle'

// Alert (DS-004)
export { Alert } from './Alert'

// Spinner (DS-005)
export { Spinner } from './Spinner'

// Pagination (DS-007)
export { Pagination } from './Pagination'

// Animations
export { PageTransition, SectionReveal } from './AntigravityAnimation'

// Dashboard
export { ExamCard } from './AntigravityDashboard'

// Results
export { ScoreCard, ResultStatCard } from './AntigravityResults'

// Icons
export { IconBadge } from './IconBadge'
export { PremiumIconContainer } from './PremiumIconContainer'

// Avatar (Phase 3.5 U-5 — certified Icon/Display primitive, DS-014)
export { Avatar } from './Avatar'
export type { AvatarSize, AvatarShape } from './Avatar'

// CollectionCard (Phase 3.2 Foundation composite — premium collection surfaces)
export { CollectionCard } from './CollectionCard'
export type { CollectionCardProps, CollectionCardLayout, CollectionCardVariant, CollectionCardTitleTag } from './CollectionCard'

// Collection system (Phase 3.2.2 — shared collection surface blocks)
export { SelectionCheckbox } from './SelectionCheckbox'
export { CollectionHeader } from './CollectionHeader'

// Collection filter (Phase 3.2.4 — finite-set premium dropdown filter)
export { CollectionFilter } from './CollectionFilter'
export type { CollectionFilterOption } from './CollectionFilter'

// Menu / Dropdown (DS-008)
export { Menu } from './Menu'

// Navigation (DS-009)
export { Navigation, NavigationContext, useSidebarMode } from './Navigation'
export type { NavItem, NavigationMode } from './Navigation'

// Error Experience
export { ErrorContainer } from './ErrorContainer'
export { RetryButton } from './RetryButton'
export type { ErrorContainerVariant } from '../../types/error.types'

// Success Modal (Group 5 — milestone-success feedback, DS Success Modal)
export { SuccessModal } from './SuccessModal'

// Toast (Group 5 — fixes SubAdminCreate.tsx:10 build blocker: missing barrel export)
export { ToastContainer, useToast } from '../../hooks/useToast'
