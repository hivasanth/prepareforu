// ─── Barrel: re-exports all AntigravityUI components from domain files ──────
export { useTheme } from '../../context/ThemeContext'

// Typography
export { H1, H2, H3, Body, Label, Display, Caption, BrandTitle } from './AntigravityTypography'

// Single Foundation Typography primitive (Phase 5.4C — all roles resolve here)
export { Typography } from './Typography'
export type { TypographyRole, TypographyColor, TypographyWeight, TypographyVariant, TypographyProps } from './Typography'

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
export { Input, TextArea, Switch, Checkbox, Radio, RadioGroup } from './AntigravityForm'

// Button
export { Button, PrimaryButton, IconButton } from './AntigravityButton'

// Data display
export { Tabs, AdminPageTitle, Badge, ProgressBar, MetricBlock, DataGrid } from './AntigravityData'
export type { DataGridColumn, DataGridSortDirection, TabOption, TabsSize } from './AntigravityData'

// Pill/Badge language (Phase 5.4D — ONE primitive, every badge/pill is a wrapper)
export { Pill } from './Pill'
export type { PillProps, PillRole, PillVariant, PillSize, PillState } from './Pill'
export { StatusBadge } from './StatusBadge'
export { CounterBadge } from './CounterBadge'
export { FilterPill } from './FilterPill'
export { SelectionPill } from './SelectionPill'
export { NavigationPill } from './NavigationPill'

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

// Number/Rank indicator (Requirement E — reusable number primitive)
export { NumberBadge } from './NumberBadge'
export type { NumberBadgeVariant } from './NumberBadge'

// Avatar (Phase 3.5 U-5 — certified Icon/Display primitive, DS-014)
export { Avatar } from './Avatar'
export type { AvatarSize, AvatarShape } from './Avatar'

// FloatingList (Phase 5.5 — header + independent floating list items)
export { FloatingList, FloatingListHeader, FloatingListItem } from './FloatingList'

// CollectionCard (Phase 3.2 Foundation composite — premium collection surfaces)
export { CollectionCard } from './CollectionCard'
export type { CollectionCardProps, CollectionCardLayout, CollectionCardVariant, CollectionCardTitleTag } from './CollectionCard'

// Collection system (Phase 3.2.2 — shared collection surface blocks)
export { SelectionCheckbox } from './SelectionCheckbox'
export { CollectionHeader } from './CollectionHeader'

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
