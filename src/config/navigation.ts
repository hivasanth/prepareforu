import { 
  Home, 
  FileText, 
  BookOpen, 
  FileSignature, 
  UserCheck, 
  Trophy, 
  User,
  BarChart3,
  HelpCircle,
  Upload,
  Shield,
  Settings,
  PlusCircle,
  Layers,
  Users,
  LayoutGrid,
  History,
  BookMarked,
  Palette,
  Brain
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  color: string;
  /** Semantic route ownership: additional path prefixes that should keep this
   *  section active. Matched with the same exact-or-descendant rule as `path`.
   *  Used when a detail route lives OUTSIDE the section's literal path tree
   *  (e.g. /sub-admin/exams/:examId is a Dashboard-owned detail flow). */
  matchPaths?: string[];
}

/**
 * L-2: a nav item is active for its exact path AND for nested child paths
 * (e.g. /admin/upload stays highlighted on /admin/upload/bulk-parser/topic/:id).
 * Exact-or-descendant matching only — no two nav items are prefixes of each
 * other, so at most one item can match.
 */
export function isNavActive(itemPath: string, currentPath: string): boolean {
  return currentPath === itemPath || currentPath.startsWith(itemPath + '/')
}

/**
 * Section-level active test: the owning section is active for its own path
 * tree (exact-or-descendant) AND for any explicitly attributed detail paths
 * (`matchPaths`). Accepts any structurally-compatible nav item (config NavItem
 * and the sidebar Navigation's local NavItem both satisfy: `path` + optional
 * `matchPaths`). Backward compatible — items without `matchPaths` behave
 * exactly like `isNavActive(item.path, currentPath)`.
 */
export interface NavItemActiveSource {
  path: string
  matchPaths?: string[]
}

export function isNavItemActive(item: NavItemActiveSource, currentPath: string): boolean {
  // Section-level URLs arrive as full locations (e.g. /sub-admin/my-exams?exam=ex-1).
  // Query/hash are not part of the route path, so match against the pathname only.
  const path = currentPath.split(/[?#]/)[0]
  if (isNavActive(item.path, path)) return true
  return (item.matchPaths ?? []).some(match => isNavActive(match, path))
}
export const USER_NAV: NavItem[] = [
  { label: 'Dashboard',       path: '/dashboard',     icon: Home,          color: '#2563EB' },
  { label: 'Exams',           path: '/exams',         icon: FileText,      color: '#16A34A' },
  { label: 'History',         path: '/history',       icon: History,       color: '#8B5CF6' },
  { label: 'Subject Tests',   path: '/subject-tests', icon: BookOpen,      color: '#F59E0B' },
  { label: 'Topic Exams',     path: '/topic-exams',   icon: Layers,        color: '#10B981' },
  { label: 'Study Topics',    path: '/topics',        icon: BookMarked,    color: '#7C3AED' },
  { label: 'Prepare & Write', path: '/prepare-write', icon: FileSignature, color: '#DC2626' },
  { label: 'Performance',     path: '/performance',   icon: BarChart3,     color: '#3B82F6' },
  { label: 'Educator Exams',  path: '/educator-exams',icon: UserCheck,     color: '#7C3AED' },
  { label: 'Leaderboard',     path: '/leaderboard',   icon: Trophy,        color: '#EA580C' },
  { label: 'Memory Games',    path: '/memory-games',  icon: Brain,         color: '#0EA5E9' },
  { label: 'Profile',         path: '/profile',       icon: User,          color: '#0891B2' },
];

export const ADMIN_NAV: NavItem[] = [
  { label: 'OVERVIEW',      path: '/admin/overview',    icon: BarChart3,    color: '#374151' },
  { label: 'QUESTIONS',     path: '/admin/questions',   icon: HelpCircle,   color: '#16A34A' },
  { label: 'UPLOAD QS',     path: '/admin/upload',      icon: Upload,       color: '#DB2777' },
  { label: 'TOPICS',        path: '/admin/topics',      icon: BookMarked,   color: '#7C3AED' },
  { label: 'LEADERBOARD',   path: '/admin/leaderboard', icon: Trophy,       color: '#F59E0B' },
  { label: 'USERS',         path: '/admin/users',       icon: Users,        color: '#2563EB' },
  { label: 'SUB ADMINS',    path: '/admin/sub-admins',  icon: Shield,       color: '#4F46E5' },
  { label: 'SETTINGS',      path: '/admin/settings',    icon: Settings,     color: '#EA580C' },
  // L-1: the design-system showcase is a development tool — it is filtered
  // out of the production navigation (route registration is DEV-gated too).
  ...(import.meta.env.DEV
    ? [{ label: 'DESIGN SYSTEM', path: '/admin/design-system', icon: Palette, color: '#8B5CF6' } as NavItem]
    : []),
];

export const SUB_ADMIN_NAV: NavItem[] = [
  /** The exam-detail flow is OWNED by the My Exams section: Dashboard "Recent
      Deployments" and My Exams cards both open /sub-admin/my-exams?exam=<id>,
      so the detail view lives under the My Exams path tree. */
  { label: 'DASHBOARD',     path: '/sub-admin/dashboard', icon: LayoutGrid, color: '#2563EB' },
  { label: 'MY EXAMS',      path: '/sub-admin/my-exams',  icon: Layers,     color: '#F59E0B' },
  { label: 'STUDENTS',      path: '/sub-admin/students',  icon: Users,      color: '#7C3AED' },
  { label: 'CREATE EXAM',   path: '/sub-admin/create',    icon: PlusCircle, color: '#DC2626' },
  { label: 'SETTINGS',      path: '/sub-admin/settings',  icon: Settings,   color: '#374151' },
];
